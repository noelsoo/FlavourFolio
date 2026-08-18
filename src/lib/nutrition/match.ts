/**
 * Matching a free-text ingredient name to a row in the nutrition table.
 *
 * Scoring is deliberately conservative: a weak token overlap is reported as a
 * low-confidence match (or no match) rather than being quietly promoted, so
 * the totals never claim more precision than the match supports.
 */

import { FOODS, type Food } from './foods';
import { normalizeForMatch, singularize } from './parse';

export interface FoodMatch {
  food: Food;
  /** 0..1 — how sure we are this is the right row. */
  score: number;
}

interface IndexEntry {
  food: Food;
  key: string;
  tokens: string[];
}

const INDEX: IndexEntry[] = FOODS.flatMap((food) => {
  const names = [food.name, ...food.aliases, food.id.replace(/-/g, ' ')];
  return names.map((n) => {
    const key = normalizeForMatch(n);
    return { food, key, tokens: key.split(' ').filter(Boolean) };
  });
}).filter((e) => e.key.length > 0);

const EXACT = new Map<string, Food>();
for (const entry of INDEX) {
  // First writer wins: canonical names are indexed before aliases.
  if (!EXACT.has(entry.key)) EXACT.set(entry.key, entry.food);
}

/** Minimum score we will accept as a usable match. */
export const MATCH_THRESHOLD = 0.5;

export function matchFood(rawName: string): FoodMatch | null {
  const query = normalizeForMatch(rawName);
  if (!query) return null;

  // 1. Exact normalized hit.
  const exact = EXACT.get(query);
  if (exact) return { food: exact, score: 1 };

  const queryTokens = query.split(' ').filter(Boolean);
  if (queryTokens.length === 0) return null;
  const querySet = new Set(queryTokens);

  let best: FoodMatch | null = null;

  for (const entry of INDEX) {
    const score = scoreEntry(query, queryTokens, querySet, entry);
    if (score > 0 && (!best || score > best.score)) {
      best = { food: entry.food, score };
    }
  }

  if (!best || best.score < MATCH_THRESHOLD) return null;
  return best;
}

function scoreEntry(
  query: string,
  queryTokens: string[],
  querySet: Set<string>,
  entry: IndexEntry
): number {
  const { key, tokens } = entry;
  if (tokens.length === 0) return 0;

  // 2. Whole entry appears as a phrase inside the query:
  //    "organic extra virgin olive oil" contains "olive oil".
  if (query === key) return 1;
  if (query.includes(key)) {
    // Longer matched phrases are more trustworthy than single common words.
    const coverage = tokens.length / queryTokens.length;
    return 0.75 + 0.2 * Math.min(1, coverage);
  }

  // 3. Token overlap, requiring the entry's *head noun* to be present.
  //    "chicken stock" must not match a bare "chicken".
  const head = tokens[tokens.length - 1];
  if (!querySet.has(head) && !querySet.has(singularize(head))) return 0;

  let hits = 0;
  for (const t of tokens) {
    if (querySet.has(t)) hits++;
  }
  const entryCoverage = hits / tokens.length;
  const queryCoverage = hits / queryTokens.length;

  if (entryCoverage < 1) {
    // Partial entry coverage: only trust it if the head noun carried it and
    // the entry is short (e.g. "egg" matching "free range egg").
    if (tokens.length > 2) return 0;
    return 0.45 * entryCoverage + 0.15 * queryCoverage;
  }

  // Every word of the entry is present in the query.
  return 0.6 + 0.35 * queryCoverage;
}
