/**
 * Deterministic recipe extraction from pasted text.
 *
 * This replaces the previous two-pass parser, which contradicted itself (a
 * line could satisfy both the "is ingredient" and "is instruction" heuristics
 * and be dropped) and crashed outright — its second pass assigned to
 * `inIngredientsSection` / `inInstructionsSection`, two variables that were
 * never declared, throwing a ReferenceError under ES module strict mode the
 * moment anyone pressed "Process Text".
 *
 * The approach here is a single forward pass with an explicit section state
 * plus a signed score per line, so every line lands in exactly one bucket and
 * ties resolve deterministically.
 */

import { parseIngredient } from '@/lib/nutrition/parse';
import { matchFood } from '@/lib/nutrition/match';
import { parseQuantity } from '@/lib/nutrition/units';

export interface ExtractedRecipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  cuisine: string | null;
  tags: string[];
  notes: string | null;
}

type Section = 'unknown' | 'ingredients' | 'instructions' | 'notes';

const INGREDIENT_HEADERS =
  /^\s*(ingredients?|you(?:'ll)? (?:will )?need|shopping list|for the [\w\s]+)\s*:?\s*$/i;
const INSTRUCTION_HEADERS =
  /^\s*(instructions?|directions?|method|steps?|preparation|how to (?:make|cook)|to make)\s*:?\s*$/i;
const NOTES_HEADERS = /^\s*(notes?|tips?|to serve|storage|variations?)\s*:?\s*$/i;

const ACTION_VERBS =
  /^(preheat|heat|mix|stir|add|combine|whisk|beat|fold|pour|bake|roast|grill|fry|sauté|saute|simmer|boil|blanch|steam|season|transfer|remove|place|cover|uncover|reduce|refrigerate|chill|freeze|thaw|serve|garnish|top|drizzle|sprinkle|spread|brush|arrange|divide|repeat|continue|cook|let|allow|set|bring|drain|rinse|toss|blend|puree|mash|knead|roll|shape|cut|slice|chop|dice|mince|grate|peel|discard|reserve|meanwhile|once|when|while|using|in a|on a|for the)\b/i;

const TIME_RE =
  /\b(?:(prep|preparation|cook(?:ing)?|bake|baking|total|active|rest(?:ing)?|chill(?:ing)?)\s*(?:time)?\s*[:\-–]?\s*)?(\d+)\s*(?:-|–|to)?\s*(\d+)?\s*(hours?|hrs?|h|minutes?|mins?|m)\b/gi;
const SERVINGS_RE =
  /\b(?:serves?|servings?|yield|makes|portions?)\s*[:\-–]?\s*(?:about\s*)?(\d+)/i;

/** Signed classification: positive leans ingredient, negative leans instruction. */
function classify(line: string): number {
  let score = 0;
  const words = line.trim().split(/\s+/);
  const wordCount = words.length;

  // A leading measurement is the single strongest ingredient signal.
  const parsed = parseIngredient(line);
  if (parsed.quantity !== null) score += 2;
  if (parsed.unit) score += 2;

  // Recognised food + short line: almost certainly an ingredient.
  if (matchFood(parsed.name)) score += 1.5;

  // Instructions are sentences: long, verby, often numbered and punctuated.
  if (ACTION_VERBS.test(line.trim())) score -= 2.5;
  if (wordCount > 12) score -= 2;
  if (wordCount > 20) score -= 1.5;
  if (/[.!]\s*$/.test(line.trim()) && wordCount > 6) score -= 1;
  if (/\b(until|then|about \d+ minutes?|degrees|°[CF]|minutes?|oven)\b/i.test(line)) score -= 1.5;

  // Short fragments lean ingredient.
  if (wordCount <= 6) score += 1;
  if (wordCount <= 3) score += 0.5;

  return score;
}

function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[-–—•*·▢□]|\(?\d+[.)])\s*/, '').trim();
}

function toMinutes(value: number, unit: string): number {
  return /^h/i.test(unit) ? value * 60 : value;
}

function extractMeta(text: string): {
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
} {
  let prepTime: number | null = null;
  let cookTime: number | null = null;

  for (const m of text.matchAll(TIME_RE)) {
    const [, labelRaw, aRaw, bRaw, unit] = m;
    const a = parseInt(aRaw, 10);
    const b = bRaw ? parseInt(bRaw, 10) : null;
    // A range ("20-25 minutes") collapses to its midpoint.
    const minutes = toMinutes(b ? (a + b) / 2 : a, unit);
    const label = (labelRaw ?? '').toLowerCase();

    if (/prep/.test(label) && prepTime === null) prepTime = Math.round(minutes);
    else if (/cook|bake/.test(label) && cookTime === null) cookTime = Math.round(minutes);
  }

  const servingsMatch = text.match(SERVINGS_RE);
  const servings = servingsMatch ? parseInt(servingsMatch[1], 10) : null;

  return { prepTime, cookTime, servings: servings && servings > 0 ? servings : null };
}

export function extractRecipeFromText(input: string): ExtractedRecipe {
  const rawLines = input.split(/\r?\n/);
  const lines = rawLines.map((l) => l.trim());

  const ingredients: string[] = [];
  const instructions: string[] = [];
  const notes: string[] = [];

  let section: Section = 'unknown';
  let title = '';
  let description = '';
  // Lines seen before any header, held back until we know where they belong.
  const preamble: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (INGREDIENT_HEADERS.test(line)) {
      section = 'ingredients';
      continue;
    }
    if (INSTRUCTION_HEADERS.test(line)) {
      section = 'instructions';
      continue;
    }
    if (NOTES_HEADERS.test(line)) {
      section = 'notes';
      continue;
    }

    // The first substantive line before any header is the title.
    if (!title && section === 'unknown') {
      const candidate = stripBullet(line);
      const looksLikeMeta =
        SERVINGS_RE.test(candidate) || /^\s*(prep|cook|total)\b/i.test(candidate);
      if (!looksLikeMeta && candidate.length <= 90 && parseQuantity(candidate) === null) {
        title = candidate;
        continue;
      }
    }

    const content = stripBullet(line);
    if (!content) continue;

    switch (section) {
      case 'ingredients':
        ingredients.push(content);
        break;
      case 'instructions':
        instructions.push(content);
        break;
      case 'notes':
        notes.push(content);
        break;
      default:
        preamble.push(content);
    }
  }

  // Nothing was labelled — classify the preamble line by line.
  if (ingredients.length === 0 && instructions.length === 0) {
    for (const line of preamble) {
      if (classify(line) >= 0) ingredients.push(line);
      else instructions.push(line);
    }
  } else {
    // Headers existed, so leftover preamble is descriptive prose.
    description = preamble.filter((l) => l.split(/\s+/).length > 4).join(' ');
  }

  const meta = extractMeta(input);

  return {
    title: title || 'Untitled recipe',
    description: description.slice(0, 300),
    ingredients,
    instructions,
    prepTime: meta.prepTime,
    cookTime: meta.cookTime,
    servings: meta.servings,
    cuisine: null,
    tags: [],
    notes: notes.length ? notes.join('\n') : null,
  };
}
