/**
 * AI configuration.
 *
 * The app is fully functional with no configuration at all — extraction falls
 * back to the deterministic parsers, which need no network and no key.
 *
 * When `VITE_AI_PROXY_URL` is set, the harder cases (messy pasted text, photos
 * of recipe cards) are sent to Claude through *your own* server. The key lives
 * on that server. It is deliberately not possible to point this at the
 * Anthropic API directly with a key baked into the bundle: anything shipped to
 * the browser is readable by every visitor, and a leaked key is billable.
 * `server/ai-proxy.mjs` in this repo is a working reference proxy.
 */

export interface AiConfig {
  proxyUrl: string | null;
  /** Optional CORS-relaxing fetch proxy for URL import (see import-url.ts). */
  fetchProxyUrl: string | null;
}

function readEnv(key: string): string | null {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getAiConfig(): AiConfig {
  return {
    proxyUrl: readEnv('VITE_AI_PROXY_URL'),
    fetchProxyUrl: readEnv('VITE_FETCH_PROXY_URL'),
  };
}

export function isClaudeEnabled(): boolean {
  return getAiConfig().proxyUrl !== null;
}
