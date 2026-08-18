/**
 * Ingredient line parser.
 *
 * Turns "2 1/4 cups all-purpose flour, sifted" into structured parts:
 *   { quantity: 2.25, unit: cup, name: "all-purpose flour", note: "sifted" }
 *
 * Handles the shapes that actually turn up in recipes: unicode fractions,
 * mixed numbers, ranges, parenthetical can sizes ("1 (14 oz) can"), leading
 * bullets, trailing prep notes, and "to taste" lines with no quantity at all.
 */

import {
  parseQuantity,
  lookupUnit,
  UNIT_ALIASES_BY_LENGTH,
  type UnitDef,
} from './units';

export interface ParsedIngredient {
  /** The line exactly as written, preserved for display. */
  raw: string;
  quantity: number | null;
  unit: UnitDef | null;
  /** Ingredient name with descriptors kept, e.g. "all-purpose flour". */
  name: string;
  /** Trailing preparation note, e.g. "sifted", "finely chopped". */
  note: string | null;
  /** True for "salt and pepper to taste" style lines — no measurable amount. */
  toTaste: boolean;
  /** True when a parenthetical gave an explicit pack size we used. */
  usedPackSize: boolean;
}

/** Words that describe preparation rather than identity — dropped when matching. */
const PREP_WORDS = new Set([
  'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded', 'crushed',
  'ground', 'melted', 'softened', 'peeled', 'seeded', 'cored', 'pitted',
  'halved', 'quartered', 'cubed', 'drained', 'rinsed', 'toasted', 'roasted',
  'grilled', 'cooked', 'uncooked', 'raw', 'beaten', 'whipped', 'chilled',
  'frozen', 'thawed', 'defrosted', 'divided', 'packed', 'sifted', 'trimmed',
  'julienned', 'shaved', 'torn', 'crumbled', 'mashed', 'pureed', 'blanched',
  'finely', 'roughly', 'coarsely', 'thinly', 'thickly', 'freshly', 'lightly',
  'optional', 'plus', 'more', 'needed', 'taste', 'garnish', 'serving',
  'room', 'temperature', 'large', 'medium', 'small', 'extra', 'good', 'quality',
  'boneless', 'skinless', 'about', 'approximately', 'preferably',
]);

const BULLET_RE = /^\s*(?:[-–—•*·▢□]|\d+[.)])\s*/;

/** Longest-first alternation so "tablespoons" wins over "t". */
const UNIT_PATTERN = UNIT_ALIASES_BY_LENGTH.map((a) =>
  a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
).join('|');
const LEADING_UNIT_RE = new RegExp(`^(${UNIT_PATTERN})\\b\\.?`, 'i');

export function parseIngredient(line: string): ParsedIngredient {
  const raw = line.trim();
  let working = raw.replace(BULLET_RE, '').trim();

  const result: ParsedIngredient = {
    raw,
    quantity: null,
    unit: null,
    name: working,
    note: null,
    toTaste: false,
    usedPackSize: false,
  };

  if (!working) return result;

  // "to taste" / "as needed" lines carry no usable amount.
  if (/\b(to taste|as needed|for serving|for garnish|as required)\b/i.test(working)) {
    result.toTaste = true;
  }

  // Leading quantity, if any.
  const qty = parseQuantity(working);
  if (qty) {
    result.quantity = qty.value;
    working = qty.rest.trim();
  }

  // Parenthetical pack size: "1 (14 oz) can crushed tomatoes",
  // "2 x 400g tins". The inner measure is the real amount per pack.
  const packMatch = working.match(/^\(?\s*(?:x\s*)?([\d.,/\s¼½¾⅓⅔⅛⅜⅝⅞]+)\s*([a-zA-Z.]+)\s*\)/);
  if (packMatch) {
    const inner = parseQuantity(packMatch[1]);
    const innerUnit = lookupUnit(packMatch[2]);
    if (inner && innerUnit && innerUnit.kind !== 'count') {
      // Total = packs x size-per-pack.
      result.quantity = (result.quantity ?? 1) * inner.value;
      result.unit = innerUnit;
      result.usedPackSize = true;
      working = working.slice(packMatch[0].length).trim();
      // Drop the now-redundant container noun ("can", "tin", "jar").
      working = working.replace(/^(cans?|tins?|jars?|bottles?|packets?|packages?|boxes?)\b\.?\s*/i, '');
    }
  }

  // Unit directly after the quantity.
  if (!result.unit) {
    const unitMatch = working.match(LEADING_UNIT_RE);
    if (unitMatch) {
      const unit = lookupUnit(unitMatch[1]);
      // A bare "1 pepper" should read as a count, not the unit "pinch" etc.
      if (unit) {
        result.unit = unit;
        working = working.slice(unitMatch[0].length).trim();
      }
    }
  }

  // "of" filler: "2 cups of flour"
  working = working.replace(/^of\s+/i, '');

  // A second parenthetical after the unit is usually a note: "(about 2 large)".
  working = working.replace(/\([^)]*\)/g, ' ').replace(/\s{2,}/g, ' ').trim();

  // Trailing prep note after the last comma, when it reads like preparation.
  const commaIdx = working.indexOf(',');
  if (commaIdx > 0) {
    const head = working.slice(0, commaIdx).trim();
    const tail = working.slice(commaIdx + 1).trim();
    const tailWords = tail.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const prepish =
      tailWords.length > 0 && tailWords.every((w) => PREP_WORDS.has(w) || w.length <= 2);
    if (prepish && head) {
      result.note = tail;
      working = head;
    }
  }

  result.name = working.replace(/[.;:]+$/, '').trim() || raw;
  return result;
}

/**
 * Strip descriptors down to the identifying words, for database matching.
 * "2 finely chopped large red onions" -> "red onion"
 */
export function normalizeForMatch(name: string): string {
  const cleaned = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const words = cleaned
    .split(/[\s-]+/)
    .filter((w) => w && !PREP_WORDS.has(w))
    .map(singularize);

  return words.join(' ').trim();
}

/** Conservative English singulariser — enough for ingredient nouns. */
export function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (/(ss|us|is)$/.test(word)) return word;
  if (/ies$/.test(word)) return word.slice(0, -3) + 'y';
  if (/(ches|shes|xes|zes|ses)$/.test(word)) return word.slice(0, -2);
  if (/oes$/.test(word)) return word.slice(0, -2);
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}
