/**
 * Quantity + unit handling for ingredient lines.
 *
 * Everything ultimately resolves to grams, because the nutrition table is
 * expressed per 100 g. There are three routes to grams:
 *
 *   mass   → grams directly (1 oz = 28.3495 g)
 *   volume → millilitres, then grams via the food's density (flour ≠ honey)
 *   count  → grams via the food's per-item weight (1 clove garlic ≈ 3 g)
 *
 * A volume or count amount is therefore only convertible when we know which
 * food it refers to. `toGrams` returns null when it can't do the conversion
 * honestly, and the caller records that as an unmatched ingredient rather than
 * silently guessing.
 */

export type UnitKind = 'mass' | 'volume' | 'count';

export interface UnitDef {
  id: string;
  kind: UnitKind;
  /** grams per unit (mass) or millilitres per unit (volume). Unused for count. */
  factor: number;
  aliases: string[];
}

export const UNITS: UnitDef[] = [
  // ---- Mass (factor = grams) ----
  { id: 'g', kind: 'mass', factor: 1, aliases: ['g', 'gram', 'grams', 'gr', 'gm', 'gms'] },
  { id: 'kg', kind: 'mass', factor: 1000, aliases: ['kg', 'kilo', 'kilos', 'kilogram', 'kilograms'] },
  { id: 'mg', kind: 'mass', factor: 0.001, aliases: ['mg', 'milligram', 'milligrams'] },
  { id: 'oz', kind: 'mass', factor: 28.3495, aliases: ['oz', 'ounce', 'ounces'] },
  { id: 'lb', kind: 'mass', factor: 453.592, aliases: ['lb', 'lbs', 'pound', 'pounds', '#'] },

  // ---- Volume (factor = millilitres, US measures) ----
  { id: 'tsp', kind: 'volume', factor: 4.92892, aliases: ['tsp', 'tsps', 't', 'teaspoon', 'teaspoons'] },
  { id: 'tbsp', kind: 'volume', factor: 14.7868, aliases: ['tbsp', 'tbsps', 'tbs', 'tb', 'T', 'tablespoon', 'tablespoons'] },
  { id: 'floz', kind: 'volume', factor: 29.5735, aliases: ['fl oz', 'floz', 'fluid ounce', 'fluid ounces', 'fl. oz', 'fl.oz'] },
  { id: 'cup', kind: 'volume', factor: 236.588, aliases: ['cup', 'cups', 'c'] },
  { id: 'pint', kind: 'volume', factor: 473.176, aliases: ['pint', 'pints', 'pt'] },
  { id: 'quart', kind: 'volume', factor: 946.353, aliases: ['quart', 'quarts', 'qt'] },
  { id: 'gallon', kind: 'volume', factor: 3785.41, aliases: ['gallon', 'gallons', 'gal'] },
  { id: 'ml', kind: 'volume', factor: 1, aliases: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres', 'cc'] },
  { id: 'l', kind: 'volume', factor: 1000, aliases: ['l', 'liter', 'liters', 'litre', 'litres'] },
  { id: 'dl', kind: 'volume', factor: 100, aliases: ['dl', 'deciliter', 'deciliters'] },
  { id: 'dash', kind: 'volume', factor: 0.616, aliases: ['dash', 'dashes'] },
  { id: 'pinch', kind: 'volume', factor: 0.308, aliases: ['pinch', 'pinches'] },
  { id: 'drop', kind: 'volume', factor: 0.0513, aliases: ['drop', 'drops'] },

  // ---- Count (needs the food's per-item weight) ----
  { id: 'piece', kind: 'count', factor: 1, aliases: ['piece', 'pieces', 'whole', 'each', 'pc', 'pcs'] },
  { id: 'clove', kind: 'count', factor: 1, aliases: ['clove', 'cloves'] },
  { id: 'slice', kind: 'count', factor: 1, aliases: ['slice', 'slices'] },
  { id: 'can', kind: 'count', factor: 1, aliases: ['can', 'cans', 'tin', 'tins'] },
  { id: 'package', kind: 'count', factor: 1, aliases: ['package', 'packages', 'pkg', 'packet', 'packets', 'box', 'boxes'] },
  { id: 'bunch', kind: 'count', factor: 1, aliases: ['bunch', 'bunches'] },
  { id: 'head', kind: 'count', factor: 1, aliases: ['head', 'heads'] },
  { id: 'stalk', kind: 'count', factor: 1, aliases: ['stalk', 'stalks', 'rib', 'ribs'] },
  { id: 'sprig', kind: 'count', factor: 1, aliases: ['sprig', 'sprigs'] },
  { id: 'leaf', kind: 'count', factor: 1, aliases: ['leaf', 'leaves'] },
  { id: 'fillet', kind: 'count', factor: 1, aliases: ['fillet', 'fillets', 'filet', 'filets'] },
  { id: 'breast', kind: 'count', factor: 1, aliases: ['breast', 'breasts'] },
  { id: 'thigh', kind: 'count', factor: 1, aliases: ['thigh', 'thighs'] },
  { id: 'jar', kind: 'count', factor: 1, aliases: ['jar', 'jars'] },
  { id: 'bottle', kind: 'count', factor: 1, aliases: ['bottle', 'bottles'] },
  { id: 'ear', kind: 'count', factor: 1, aliases: ['ear', 'ears'] },
  { id: 'strip', kind: 'count', factor: 1, aliases: ['strip', 'strips', 'rasher', 'rashers'] },
  { id: 'handful', kind: 'count', factor: 1, aliases: ['handful', 'handfuls'] },
];

/** alias (lowercased) -> unit. Longest aliases first so "fl oz" beats "oz". */
const UNIT_LOOKUP = new Map<string, UnitDef>();
for (const u of UNITS) {
  for (const a of u.aliases) UNIT_LOOKUP.set(a.toLowerCase(), u);
}

export function lookupUnit(token: string): UnitDef | undefined {
  const key = token.toLowerCase().replace(/\.$/, '').trim();
  return UNIT_LOOKUP.get(key);
}

/** Alias strings sorted longest-first, for regex alternation. */
export const UNIT_ALIASES_BY_LENGTH: string[] = UNITS.flatMap((u) => u.aliases)
  .sort((a, b) => b.length - a.length);

const VULGAR_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

export const VULGAR_FRACTION_CHARS = Object.keys(VULGAR_FRACTIONS).join('');

/**
 * Parse a leading quantity: "2", "1/2", "2 1/4", "1½", "½", "2.5", "2-3".
 * Ranges collapse to their midpoint, which is the least-wrong single value.
 * Returns null when the text does not begin with a number.
 */
export function parseQuantity(text: string): { value: number; rest: string } | null {
  const s = text.trimStart();
  if (!s) return null;

  const readOne = (input: string): { value: number; rest: string } | null => {
    let str = input.trimStart();

    // Leading vulgar fraction on its own: "½ cup"
    if (VULGAR_FRACTIONS[str[0]] !== undefined) {
      return { value: VULGAR_FRACTIONS[str[0]], rest: str.slice(1) };
    }

    const numMatch = str.match(/^(\d+(?:[.,]\d+)?)/);
    if (!numMatch) return null;

    let value = parseFloat(numMatch[1].replace(',', '.'));
    str = str.slice(numMatch[0].length);

    // "1½"
    if (VULGAR_FRACTIONS[str[0]] !== undefined) {
      return { value: value + VULGAR_FRACTIONS[str[0]], rest: str.slice(1) };
    }

    // "1/2" — the number we just read was the numerator.
    const slashMatch = str.match(/^\s*\/\s*(\d+)/);
    if (slashMatch) {
      const denom = parseInt(slashMatch[1], 10);
      if (denom !== 0) value = value / denom;
      return { value, rest: str.slice(slashMatch[0].length) };
    }

    // "2 1/4" — whole number followed by a fraction.
    const mixedMatch = str.match(/^\s+(\d+)\s*\/\s*(\d+)/);
    if (mixedMatch) {
      const denom = parseInt(mixedMatch[2], 10);
      if (denom !== 0) value += parseInt(mixedMatch[1], 10) / denom;
      return { value, rest: str.slice(mixedMatch[0].length) };
    }

    return { value, rest: str };
  };

  const first = readOne(s);
  if (!first) return null;

  // Range: "2-3 cups", "2 to 3 cups" -> midpoint.
  const rangeMatch = first.rest.match(/^\s*(?:-|–|—|\bto\b)\s*/);
  if (rangeMatch) {
    const second = readOne(first.rest.slice(rangeMatch[0].length));
    if (second) {
      return { value: (first.value + second.value) / 2, rest: second.rest };
    }
  }

  return first;
}

export interface Amount {
  value: number;
  unit: UnitDef | null;
}

export interface GramsContext {
  /** grams per millilitre; required to convert volume amounts. */
  density?: number;
  /** grams for one item; required to convert count amounts. */
  itemGrams?: number;
}

/**
 * Convert an amount to grams. Returns null when the conversion needs food
 * information (density / item weight) that the caller did not supply.
 */
export function toGrams(amount: Amount, ctx: GramsContext = {}): number | null {
  const { value, unit } = amount;
  if (!Number.isFinite(value) || value <= 0) return null;

  // No unit at all ("2 eggs") is a count.
  if (!unit) {
    return ctx.itemGrams ? value * ctx.itemGrams : null;
  }

  switch (unit.kind) {
    case 'mass':
      return value * unit.factor;
    case 'volume': {
      if (ctx.density === undefined) return null;
      return value * unit.factor * ctx.density;
    }
    case 'count':
      return ctx.itemGrams ? value * ctx.itemGrams : null;
  }
}

/** Render a number the way a recipe would: 0.5 -> "1/2", 1.25 -> "1 1/4". */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;

  const NAMED: Array<[number, string]> = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [1 / 3, '1/3'],
    [0.375, '3/8'],
    [0.5, '1/2'],
    [0.625, '5/8'],
    [2 / 3, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8'],
  ];

  if (frac < 0.05) return String(whole);
  for (const [v, label] of NAMED) {
    if (Math.abs(frac - v) < 0.04) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }
  if (frac > 0.95) return String(whole + 1);
  return String(rounded);
}
