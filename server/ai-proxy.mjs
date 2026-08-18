/**
 * Reference AI proxy for FlavourFolio.
 *
 * The browser never sees the Anthropic API key — it lives here. Run this
 * alongside the app and point VITE_AI_PROXY_URL at it:
 *
 *   ANTHROPIC_API_KEY=sk-ant-... node server/ai-proxy.mjs
 *   # then in .env.local:  VITE_AI_PROXY_URL=http://localhost:8787
 *
 * Endpoints
 *   POST /extract  { kind: 'text',  text }                      -> { recipe }
 *   POST /extract  { kind: 'image', imageBase64, mediaType }    -> { recipe }
 *   GET  /fetch?url=...                                         -> raw HTML
 *   GET  /health
 *
 * This is a reference implementation. Before putting it on the public
 * internet, add authentication and per-client rate limiting — as written,
 * anyone who can reach it can spend your API credits.
 */

import http from 'node:http';
import Anthropic from '@anthropic-ai/sdk';

const PORT = Number(process.env.PORT ?? 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5';
const MAX_BODY_BYTES = 12 * 1024 * 1024; // room for a phone photo

const client = new Anthropic();

/** Schema Claude must fill. Structured outputs make the response parseable. */
const RECIPE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'The recipe name.' },
    description: { type: 'string', description: 'One sentence. Empty string if none.' },
    ingredients: {
      type: 'array',
      items: { type: 'string' },
      description:
        'One entry per ingredient, each keeping its original quantity and unit, e.g. "2 1/4 cups all-purpose flour".',
    },
    instructions: {
      type: 'array',
      items: { type: 'string' },
      description: 'One entry per step, in order, with any leading step number removed.',
    },
    prepTime: { type: ['integer', 'null'], description: 'Minutes, or null if not stated.' },
    cookTime: { type: ['integer', 'null'], description: 'Minutes, or null if not stated.' },
    servings: { type: ['integer', 'null'], description: 'Number of servings, or null.' },
    cuisine: { type: ['string', 'null'] },
    tags: { type: 'array', items: { type: 'string' } },
    notes: { type: ['string', 'null'] },
  },
  required: [
    'title', 'description', 'ingredients', 'instructions',
    'prepTime', 'cookTime', 'servings', 'cuisine', 'tags', 'notes',
  ],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You transcribe recipes into structured data.

Rules:
- Transcribe only what is present. Never invent an ingredient, a step, a time, or a serving count. Use null when something is not stated.
- Keep each ingredient's quantity and unit exactly as written — downstream nutrition calculations parse them.
- Split instructions into one entry per step, removing any leading numbering.
- Do not add commentary or reformat measurements.`;

function send(res, status, body, extraHeaders = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type':
      typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    ...extraHeaders,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function extractRecipe(payload) {
  let content;

  if (payload.kind === 'image') {
    if (!payload.imageBase64) throw new Error('imageBase64 is required');
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: payload.mediaType || 'image/jpeg',
          data: payload.imageBase64,
        },
      },
      {
        type: 'text',
        text: 'Transcribe the recipe shown in this image into the structured format.',
      },
    ];
  } else {
    if (!payload.text || !payload.text.trim()) throw new Error('text is required');
    content = [
      {
        type: 'text',
        text: `Structure this recipe text:\n\n${payload.text}`,
      },
    ];
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'low', // Transcription, not reasoning — keep it fast and cheap.
      format: { type: 'json_schema', schema: RECIPE_SCHEMA },
    },
    messages: [{ role: 'user', content }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('The request was declined by the safety system.');
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Model returned no text content');
  return JSON.parse(textBlock.text);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (url.pathname === '/health') return send(res, 200, { ok: true, model: MODEL });

  // Server-side fetch for URL import: the browser's CORS rules don't apply here.
  if (req.method === 'GET' && url.pathname === '/fetch') {
    const target = url.searchParams.get('url');
    if (!target) return send(res, 400, { error: 'url query parameter is required' });

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return send(res, 400, { error: 'Invalid url' });
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return send(res, 400, { error: 'Only http(s) URLs are allowed' });
    }
    // Refuse loopback and link-local targets so this can't be used to probe
    // the host's private network (SSRF).
    if (
      /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i
        .test(parsed.hostname)
    ) {
      return send(res, 403, { error: 'Refusing to fetch a private address' });
    }

    try {
      const upstream = await fetch(parsed.toString(), {
        redirect: 'follow',
        headers: {
          // Many sites serve a bot page without a browser-like UA.
          'User-Agent':
            'Mozilla/5.0 (compatible; FlavourFolio/1.0; +recipe-import)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(15000),
      });
      const html = await upstream.text();
      return send(res, upstream.ok ? 200 : upstream.status, html);
    } catch (err) {
      return send(res, 502, { error: `Fetch failed: ${err.message}` });
    }
  }

  if (req.method === 'POST' && url.pathname === '/extract') {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body);
      const recipe = await extractRecipe(payload);
      return send(res, 200, { recipe });
    } catch (err) {
      const status = err?.status ?? 500;
      console.error('[extract]', err?.message ?? err);
      return send(res, status >= 400 && status < 600 ? status : 500, {
        error: err?.message ?? 'Extraction failed',
      });
    }
  }

  return send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`FlavourFolio AI proxy listening on http://localhost:${PORT}`);
  console.log(`  model:          ${MODEL}`);
  console.log(`  allowed origin: ${ALLOWED_ORIGIN}`);
});
