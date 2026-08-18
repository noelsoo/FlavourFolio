/**
 * Recipe extraction from a web page.
 *
 * Nearly every food blog and recipe site publishes schema.org/Recipe metadata
 * as JSON-LD (Google Search requires it for rich results), so parsing that is
 * both accurate and free — no model call, no guessing. Microdata is handled as
 * a fallback for older sites.
 *
 * This operates on an HTML string. Fetching that HTML is the caller's problem,
 * because a browser cannot fetch arbitrary cross-origin pages — see
 * `import-url.ts` for how that is handled honestly.
 */

import type { ExtractedRecipe } from './local-extract';

/** ISO-8601 duration ("PT1H30M") to minutes. */
export function parseISODuration(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== 'string') return null;

  const match = value.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
  );
  if (match) {
    const [, d, h, m, s] = match;
    const minutes =
      (d ? parseFloat(d) * 1440 : 0) +
      (h ? parseFloat(h) * 60 : 0) +
      (m ? parseFloat(m) : 0) +
      (s ? parseFloat(s) / 60 : 0);
    return minutes > 0 ? Math.round(minutes) : null;
  }

  // Some sites emit plain text like "1 hr 30 mins".
  // Alternations are longest-first: matching "h" before "hr" would leave the
  // trailing "r" in place and the minutes group would never match.
  const loose = value.match(
    /(?:(\d+)\s*(?:hours?|hrs?|h))?\s*(?:(\d+)\s*(?:minutes?|mins?|m))?/i
  );
  if (loose && (loose[1] || loose[2])) {
    return (loose[1] ? parseInt(loose[1], 10) * 60 : 0) + (loose[2] ? parseInt(loose[2], 10) : 0);
  }
  return null;
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return decodeEntities(value.trim());
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === 'string') return decodeEntities(obj.text.trim());
    if (typeof obj.name === 'string') return decodeEntities(obj.name.trim());
    if (typeof obj.url === 'string') return obj.url;
  }
  return '';
}

function decodeEntities(s: string): string {
  if (typeof document === 'undefined') return s;
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}

function toStringList(value: unknown): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  const out: string[] = [];

  for (const item of raw) {
    // HowToSection wraps a nested list of HowToStep.
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>;
      const type = String(obj['@type'] ?? '');
      if (type.includes('HowToSection') && obj.itemListElement) {
        out.push(...toStringList(obj.itemListElement));
        continue;
      }
    }
    const text = textOf(item);
    if (text) out.push(text);
  }

  // A single blob of newline-joined steps is common; split it back out.
  if (out.length === 1 && out[0].includes('\n')) {
    return out[0]
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return out;
}

function firstImage(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const v of value) {
      const found = firstImage(v);
      if (found) return found;
    }
    return '';
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
    if (obj.contentUrl) return firstImage(obj.contentUrl);
  }
  return '';
}

function parseServings(value: unknown): number | null {
  const text = textOf(value);
  const m = text.match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n > 0 && n < 1000 ? n : null;
}

/** Walk any JSON-LD shape (@graph, arrays, nesting) looking for a Recipe node. */
function findRecipeNode(node: unknown, depth = 0): Record<string, unknown> | null {
  if (!node || depth > 6) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;

  const type = obj['@type'];
  const types = Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
  if (types.some((t) => t.toLowerCase().includes('recipe'))) return obj;

  for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement']) {
    if (obj[key]) {
      const found = findRecipeNode(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export interface HtmlExtractionResult {
  recipe: ExtractedRecipe & { image: string; sourceUrl: string };
  /** How the data was obtained, surfaced to the user. */
  method: 'json-ld' | 'microdata';
}

export function extractRecipeFromHtml(
  html: string,
  sourceUrl = ''
): HtmlExtractionResult | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // --- Preferred: JSON-LD ---
  const scripts = Array.from(
    doc.querySelectorAll('script[type="application/ld+json"]')
  );
  for (const script of scripts) {
    const raw = script.textContent?.trim();
    if (!raw) continue;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      continue; // Malformed blocks are common; just skip them.
    }
    const node = findRecipeNode(data);
    if (node) {
      return { recipe: fromSchemaNode(node, sourceUrl), method: 'json-ld' };
    }
  }

  // --- Fallback: microdata ---
  const scope = doc.querySelector('[itemtype*="schema.org/Recipe" i]');
  if (scope) {
    const prop = (name: string) =>
      Array.from(scope.querySelectorAll(`[itemprop="${name}"]`));
    const readOne = (name: string) => {
      const el = prop(name)[0];
      if (!el) return '';
      return (
        el.getAttribute('content') ??
        el.getAttribute('datetime') ??
        el.textContent?.trim() ??
        ''
      );
    };
    const readMany = (name: string) =>
      prop(name)
        .map((el) => el.getAttribute('content') ?? el.textContent?.trim() ?? '')
        .filter(Boolean);

    const ingredients = [
      ...readMany('recipeIngredient'),
      ...readMany('ingredients'),
    ];
    if (ingredients.length) {
      const imgEl = prop('image')[0];
      return {
        method: 'microdata',
        recipe: {
          title: readOne('name') || doc.title || 'Imported recipe',
          description: readOne('description'),
          ingredients,
          instructions: readMany('recipeInstructions'),
          prepTime: parseISODuration(readOne('prepTime')),
          cookTime: parseISODuration(readOne('cookTime')),
          servings: parseServings(readOne('recipeYield')),
          cuisine: readOne('recipeCuisine') || null,
          tags: readMany('recipeCategory'),
          notes: null,
          image:
            imgEl?.getAttribute('src') ??
            imgEl?.getAttribute('content') ??
            '',
          sourceUrl,
        },
      };
    }
  }

  return null;
}

function fromSchemaNode(
  node: Record<string, unknown>,
  sourceUrl: string
): ExtractedRecipe & { image: string; sourceUrl: string } {
  const prepTime = parseISODuration(node.prepTime);
  const cookTime = parseISODuration(node.cookTime);
  const totalTime = parseISODuration(node.totalTime);

  // Some sites give only totalTime; attribute it to cooking rather than invent a split.
  let resolvedCook = cookTime;
  if (cookTime === null && totalTime !== null) {
    resolvedCook = prepTime !== null ? Math.max(0, totalTime - prepTime) : totalTime;
  }

  const keywords = node.keywords;
  const tags = [
    ...toStringList(node.recipeCategory),
    ...(typeof keywords === 'string'
      ? keywords.split(',').map((k) => k.trim())
      : toStringList(keywords)),
  ]
    .filter(Boolean)
    .map((t) => t.toLowerCase())
    .slice(0, 8);

  return {
    title: textOf(node.name) || 'Imported recipe',
    description: textOf(node.description).slice(0, 400),
    ingredients: toStringList(node.recipeIngredient ?? node.ingredients),
    instructions: toStringList(node.recipeInstructions),
    prepTime,
    cookTime: resolvedCook,
    servings: parseServings(node.recipeYield),
    cuisine: textOf(node.recipeCuisine) || null,
    tags: Array.from(new Set(tags)),
    notes: null,
    image: firstImage(node.image),
    sourceUrl: textOf(node.url) || sourceUrl,
  };
}
