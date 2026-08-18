/**
 * Recipe nutrition computation.
 *
 * The output always carries a confidence figure and the list of ingredients we
 * could not resolve. That is the whole point: an estimate the user can audit
 * beats a single confident-looking number they cannot check.
 */

import { matchFood } from './match';
import { parseIngredient, type ParsedIngredient } from './parse';
import { toGrams } from './units';
import type { Food, FoodCategory, FoodNutrients } from './foods';

export type NutrientKey = keyof FoodNutrients;

export const EMPTY_NUTRIENTS: FoodNutrients = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
};

export type IngredientStatus =
  | 'ok'
  /** Matched a food, but the amount could not be converted to grams. */
  | 'no-amount'
  /** No row in the table looked close enough. */
  | 'unmatched'
  /** "Salt and pepper to taste" — intentionally not counted. */
  | 'to-taste';

export interface IngredientAnalysis {
  parsed: ParsedIngredient;
  food: Food | null;
  matchScore: number;
  grams: number | null;
  nutrients: FoodNutrients;
  status: IngredientStatus;
  /** Why this line did not contribute, in plain language. */
  reason?: string;
}

export interface RecipeNutrition {
  perServing: FoodNutrients;
  total: FoodNutrients;
  servings: number;
  ingredients: IngredientAnalysis[];
  /**
   * 0..1. Share of the recipe's estimated mass that resolved to a known food,
   * blended with the average match quality. "to taste" lines are excluded
   * from the denominator — they genuinely carry no measurable amount.
   */
  confidence: number;
  matchedCount: number;
  countedCount: number;
  /** Lines that contributed nothing and why. */
  unresolved: IngredientAnalysis[];
}

function scaleNutrients(food: Food, grams: number): FoodNutrients {
  const k = grams / 100;
  return {
    calories: food.calories * k,
    protein: food.protein * k,
    carbs: food.carbs * k,
    fat: food.fat * k,
    fiber: food.fiber * k,
    sugar: food.sugar * k,
    sodium: food.sodium * k,
  };
}

function addInto(target: FoodNutrients, add: FoodNutrients): void {
  target.calories += add.calories;
  target.protein += add.protein;
  target.carbs += add.carbs;
  target.fat += add.fat;
  target.fiber += add.fiber;
  target.sugar += add.sugar;
  target.sodium += add.sodium;
}

function divide(n: FoodNutrients, d: number): FoodNutrients {
  if (d <= 0) return { ...n };
  return {
    calories: n.calories / d,
    protein: n.protein / d,
    carbs: n.carbs / d,
    fat: n.fat / d,
    fiber: n.fiber / d,
    sugar: n.sugar / d,
    sodium: n.sodium / d,
  };
}

/** Analyse one ingredient line end to end. */
export function analyzeIngredient(line: string): IngredientAnalysis {
  const parsed = parseIngredient(line);
  const match = matchFood(parsed.name);

  const base: IngredientAnalysis = {
    parsed,
    food: match?.food ?? null,
    matchScore: match?.score ?? 0,
    grams: null,
    nutrients: { ...EMPTY_NUTRIENTS },
    status: 'unmatched',
  };

  if (parsed.toTaste && parsed.quantity === null) {
    return {
      ...base,
      status: 'to-taste',
      reason: 'Added to taste — no measurable amount',
    };
  }

  if (!match) {
    return {
      ...base,
      status: 'unmatched',
      reason: `"${parsed.name}" is not in the nutrition table`,
    };
  }

  const food = match.food;

  if (parsed.quantity === null) {
    return {
      ...base,
      status: 'no-amount',
      reason: 'No quantity given',
    };
  }

  const grams = toGrams(
    { value: parsed.quantity, unit: parsed.unit },
    { density: food.density, itemGrams: food.itemGrams }
  );

  if (grams === null || grams <= 0) {
    const what =
      parsed.unit?.kind === 'volume'
        ? `no density on record for ${food.name}`
        : `no per-item weight on record for ${food.name}`;
    return { ...base, status: 'no-amount', reason: `Cannot convert to grams — ${what}` };
  }

  return {
    ...base,
    grams,
    nutrients: scaleNutrients(food, grams),
    status: 'ok',
  };
}

export function computeRecipeNutrition(
  ingredients: string[],
  servings: number
): RecipeNutrition {
  const safeServings = servings > 0 ? servings : 1;
  const analyses = ingredients
    .filter((l) => l && l.trim())
    .map(analyzeIngredient);

  const total = { ...EMPTY_NUTRIENTS };
  for (const a of analyses) {
    if (a.status === 'ok') addInto(total, a.nutrients);
  }

  // Confidence: weight by calorie contribution, because getting the olive oil
  // wrong matters far more than getting the parsley wrong. Lines that are
  // genuinely amount-free ("to taste") don't count against us.
  const relevant = analyses.filter((a) => a.status !== 'to-taste');
  const counted = relevant.filter((a) => a.status === 'ok');

  let confidence = 0;
  if (relevant.length === 0) {
    confidence = 1;
  } else if (counted.length === 0) {
    confidence = 0;
  } else {
    const coverage = counted.length / relevant.length;
    const avgQuality =
      counted.reduce((s, a) => s + a.matchScore, 0) / counted.length;
    // Unresolved lines are the dominant risk, so coverage is weighted heaviest.
    confidence = Math.max(0, Math.min(1, coverage * 0.7 + avgQuality * 0.3));
    // An unresolved line that likely carried real calories hurts more.
    const unresolvedPenalty =
      relevant.filter((a) => a.status === 'unmatched').length / relevant.length;
    confidence *= 1 - unresolvedPenalty * 0.25;
  }

  return {
    total,
    perServing: divide(total, safeServings),
    servings: safeServings,
    ingredients: analyses,
    confidence,
    matchedCount: analyses.filter((a) => a.food).length,
    countedCount: counted.length,
    unresolved: relevant.filter((a) => a.status !== 'ok'),
  };
}

/** Sum per-serving nutrition across a set of planned recipes. */
export function sumNutrition(items: FoodNutrients[]): FoodNutrients {
  const total = { ...EMPTY_NUTRIENTS };
  for (const n of items) addInto(total, n);
  return total;
}

export function confidenceLabel(c: number): {
  label: string;
  tone: 'success' | 'warning' | 'destructive';
} {
  if (c >= 0.8) return { label: 'High confidence', tone: 'success' };
  if (c >= 0.55) return { label: 'Moderate confidence', tone: 'warning' };
  return { label: 'Low confidence', tone: 'destructive' };
}

/** Energy split across the three macronutrients, as percentages. */
export function macroSplit(n: FoodNutrients): {
  protein: number;
  carbs: number;
  fat: number;
} {
  const kcal = {
    protein: n.protein * 4,
    carbs: n.carbs * 4,
    fat: n.fat * 9,
  };
  const sum = kcal.protein + kcal.carbs + kcal.fat;
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: (kcal.protein / sum) * 100,
    carbs: (kcal.carbs / sum) * 100,
    fat: (kcal.fat / sum) * 100,
  };
}

/** Best-guess grocery aisle for an ingredient line. */
export function categorizeIngredient(line: string): FoodCategory {
  const match = matchFood(parseIngredient(line).name);
  return match ? match.food.category : 'Other';
}

export function formatNutrient(value: number, key: NutrientKey): string {
  if (!Number.isFinite(value)) return '—';
  if (key === 'calories') return `${Math.round(value)}`;
  if (key === 'sodium') return `${Math.round(value)}mg`;
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10}g`;
}
