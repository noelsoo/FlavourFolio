/**
 * Claude-backed extraction, via your own proxy.
 *
 * Requests go to `VITE_AI_PROXY_URL`; that server holds the API key and calls
 * the Anthropic Messages API. See `server/ai-proxy.mjs` for a working
 * implementation and the wire contract both sides agree on.
 */

import { getAiConfig } from './config';
import type { ExtractedRecipe } from './local-extract';

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

/** The shape we ask Claude to return. Mirrored by the proxy's output schema. */
interface RawExtraction {
  title?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  cuisine?: string | null;
  tags?: string[];
  notes?: string | null;
}

function coerce(raw: RawExtraction): ExtractedRecipe {
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];

  return {
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Untitled recipe',
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    ingredients: list(raw.ingredients),
    instructions: list(raw.instructions),
    prepTime: num(raw.prepTime),
    cookTime: num(raw.cookTime),
    servings: num(raw.servings),
    cuisine: typeof raw.cuisine === 'string' && raw.cuisine.trim() ? raw.cuisine.trim() : null,
    tags: list(raw.tags).map((t) => t.toLowerCase()).slice(0, 8),
    notes: typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes.trim() : null,
  };
}

async function callProxy(
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<ExtractedRecipe> {
  const { proxyUrl } = getAiConfig();
  if (!proxyUrl) {
    throw new AiUnavailableError('No AI proxy configured (VITE_AI_PROXY_URL).');
  }

  let response: Response;
  try {
    response = await fetch(`${proxyUrl.replace(/\/$/, '')}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new AiUnavailableError('Could not reach the AI service.');
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AiUnavailableError(
      `AI service returned ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`
    );
  }

  const json = (await response.json()) as { recipe?: RawExtraction; error?: string };
  if (json.error) throw new AiUnavailableError(json.error);
  if (!json.recipe) throw new AiUnavailableError('AI service returned no recipe.');

  return coerce(json.recipe);
}

/** Structure messy pasted text into a recipe. */
export function extractFromTextWithClaude(
  text: string,
  signal?: AbortSignal
): Promise<ExtractedRecipe> {
  return callProxy({ kind: 'text', text }, signal);
}

/**
 * Read a recipe out of a photo of a recipe card or cookbook page, using
 * Claude's vision capability. `imageBase64` excludes the data: URL prefix.
 */
export function extractFromImageWithClaude(
  imageBase64: string,
  mediaType: string,
  signal?: AbortSignal
): Promise<ExtractedRecipe> {
  return callProxy({ kind: 'image', imageBase64, mediaType }, signal);
}
