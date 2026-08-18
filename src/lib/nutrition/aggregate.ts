/**
 * Grocery-list aggregation.
 *
 * The old implementation concatenated ingredient strings, so two recipes each
 * needing garlic produced "3 cloves garlic, 3 cloves garlic". This version
 * combines amounts properly: same food and compatible units add up, and
 * anything that cannot be combined is listed separately rather than mangled.
 */

import { parseIngredient } from './parse';
import { matchFood } from './match';
import { formatQuantity, type UnitDef } from './units';
import type { FoodCategory } from './foods';

export interface AggregatedItem {
  /** Stable key: food id (or normalized name) plus the unit bucket. */
  key: string;
  name: string;
  category: FoodCategory;
  /** Combined amount, when the parts shared a compatible unit. */
  quantity: number | null;
  unit: UnitDef | null;
  /** Human-readable amount, e.g. "2 1/2 cups". */
  display: string;
  /** Which recipes asked for this. */
  sources: string[];
  /** Original lines, kept so the user can see exactly what was merged. */
  rawLines: string[];
}

export interface AggregateInput {
  ingredient: string;
  recipeTitle: string;
  /** Multiplier when a recipe is scaled up/down in the plan. */
  scale?: number;
}

export function aggregateIngredients(inputs: AggregateInput[]): AggregatedItem[] {
  const buckets = new Map<string, AggregatedItem>();

  for (const input of inputs) {
    const scale = input.scale && input.scale > 0 ? input.scale : 1;
    const parsed = parseIngredient(input.ingredient);
    const match = matchFood(parsed.name);

    const foodKey = match ? match.food.id : parsed.name.toLowerCase().trim();
    const displayName = match ? match.food.name : titleCase(parsed.name);
    const category: FoodCategory = match ? match.food.category : 'Other';

    // Amounts only combine within the same unit; "2 cups" + "100 g" stays split.
    const unitKey = parsed.unit ? parsed.unit.id : parsed.quantity !== null ? 'count' : 'none';
    const key = `${foodKey}::${unitKey}`;

    const existing = buckets.get(key);
    const qty = parsed.quantity !== null ? parsed.quantity * scale : null;

    if (existing) {
      if (qty !== null && existing.quantity !== null) {
        existing.quantity += qty;
      } else if (qty !== null) {
        existing.quantity = qty;
      }
      if (!existing.sources.includes(input.recipeTitle)) {
        existing.sources.push(input.recipeTitle);
      }
      existing.rawLines.push(input.ingredient);
      existing.display = renderAmount(existing.quantity, existing.unit, existing.name);
    } else {
      const item: AggregatedItem = {
        key,
        name: displayName,
        category,
        quantity: qty,
        unit: parsed.unit,
        display: renderAmount(qty, parsed.unit, displayName),
        sources: [input.recipeTitle],
        rawLines: [input.ingredient],
      };
      buckets.set(key, item);
    }
  }

  return Array.from(buckets.values()).sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );
}

function renderAmount(
  quantity: number | null,
  unit: UnitDef | null,
  name: string
): string {
  if (quantity === null) return name;
  const q = formatQuantity(quantity);
  if (!unit) return `${q} ${name}`.trim();

  const label = pluralizeUnit(unit, quantity);
  return `${q} ${label} ${name}`.replace(/\s{2,}/g, ' ').trim();
}

function pluralizeUnit(unit: UnitDef, quantity: number): string {
  const base = unit.aliases[0] ?? unit.id;
  // Abbreviations never pluralise: "2 tbsp", not "2 tbsps".
  const ABBREV = new Set(['g', 'kg', 'mg', 'oz', 'lb', 'ml', 'l', 'dl', 'tsp', 'tbsp', 'floz']);
  if (ABBREV.has(unit.id)) return base;
  if (quantity <= 1) return base;
  if (/(ch|sh|s|x)$/.test(base)) return `${base}es`;
  if (/f$/.test(base)) return `${base.slice(0, -1)}ves`;
  return `${base}s`;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
