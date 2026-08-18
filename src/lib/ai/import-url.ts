/**
 * Recipe import from a URL.
 *
 * Honest constraint: a browser cannot fetch arbitrary cross-origin pages. Most
 * recipe sites send no permissive CORS header, so a direct `fetch` from the
 * page is blocked by the browser regardless of what we do. The previous
 * implementation hid this by pattern-matching the URL string and inventing a
 * hardcoded recipe — importing "tiktok.com/anything" always produced the same
 * fictional pasta.
 *
 * What we do instead:
 *   1. Try a direct fetch (works for same-origin and CORS-friendly sites).
 *   2. Try the configured fetch proxy, if the deployment has one.
 *   3. Fail with a clear explanation and route the user to paste instead.
 *
 * Every path that succeeds returns data actually read from the page.
 */

import { extractRecipeFromHtml } from './jsonld';
import { getAiConfig } from './config';
import type { ExtractedRecipe } from './local-extract';

export type ImportOutcome =
  | {
      ok: true;
      recipe: ExtractedRecipe & { image: string; sourceUrl: string };
      method: 'json-ld' | 'microdata';
    }
  | { ok: false; reason: ImportFailure; message: string };

export type ImportFailure =
  | 'invalid-url'
  | 'blocked'
  | 'not-found'
  | 'no-recipe-data'
  | 'network';

export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchHtml(url: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  if (!response.ok) {
    throw Object.assign(new Error(`HTTP ${response.status}`), {
      status: response.status,
    });
  }
  return response.text();
}

export async function importRecipeFromUrl(
  rawUrl: string,
  signal?: AbortSignal
): Promise<ImportOutcome> {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    return {
      ok: false,
      reason: 'invalid-url',
      message: "That doesn't look like a valid web address.",
    };
  }

  const { fetchProxyUrl } = getAiConfig();
  const attempts: string[] = [url];
  if (fetchProxyUrl) {
    attempts.push(`${fetchProxyUrl.replace(/\/$/, '')}?url=${encodeURIComponent(url)}`);
  }

  let sawNotFound = false;
  let html: string | null = null;

  for (const attempt of attempts) {
    try {
      html = await fetchHtml(attempt, signal);
      break;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
      const status = (err as { status?: number }).status;
      if (status === 404 || status === 410) sawNotFound = true;
    }
  }

  if (html === null) {
    if (sawNotFound) {
      return {
        ok: false,
        reason: 'not-found',
        message: 'That page could not be found.',
      };
    }
    return {
      ok: false,
      reason: 'blocked',
      message:
        "This site doesn't allow the browser to read it directly. Copy the recipe text and use the Paste tab instead.",
    };
  }

  const extracted = extractRecipeFromHtml(html, url);
  if (!extracted) {
    return {
      ok: false,
      reason: 'no-recipe-data',
      message:
        "The page loaded, but it doesn't publish structured recipe data. Try the Paste tab.",
    };
  }

  if (extracted.recipe.ingredients.length === 0) {
    return {
      ok: false,
      reason: 'no-recipe-data',
      message: 'Found a recipe on the page but it listed no ingredients.',
    };
  }

  return { ok: true, recipe: extracted.recipe, method: extracted.method };
}
