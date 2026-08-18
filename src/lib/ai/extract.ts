/**
 * The extraction entry point the UI calls.
 *
 * Routing rule: use Claude when it is configured and the input is genuinely
 * hard, otherwise use the local parser. Claude failures never break the
 * import — they degrade to the deterministic path and say so. The caller gets
 * back which engine produced the result so the UI can be honest about it.
 */

import { extractRecipeFromText, type ExtractedRecipe } from './local-extract';
import {
  extractFromTextWithClaude,
  extractFromImageWithClaude,
  AiUnavailableError,
} from './claude';
import { isClaudeEnabled } from './config';

export type ExtractionEngine = 'claude' | 'local';

export interface ExtractionResult {
  recipe: ExtractedRecipe;
  engine: ExtractionEngine;
  /** Set when we intended to use Claude but fell back. */
  degradedReason?: string;
}

/** Did the deterministic parser produce something plausible? */
function looksComplete(recipe: ExtractedRecipe): boolean {
  return (
    recipe.ingredients.length >= 2 &&
    recipe.instructions.length >= 1 &&
    recipe.title !== 'Untitled recipe'
  );
}

export async function extractFromText(
  text: string,
  signal?: AbortSignal
): Promise<ExtractionResult> {
  const local = extractRecipeFromText(text);

  // The local parser is exact on well-structured text and costs nothing.
  if (!isClaudeEnabled() || looksComplete(local)) {
    return { recipe: local, engine: 'local' };
  }

  try {
    const recipe = await extractFromTextWithClaude(text, signal);
    // Only prefer Claude if it actually did better.
    if (recipe.ingredients.length >= local.ingredients.length) {
      return { recipe, engine: 'claude' };
    }
    return { recipe: local, engine: 'local' };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    return {
      recipe: local,
      engine: 'local',
      degradedReason:
        err instanceof AiUnavailableError
          ? err.message
          : 'AI extraction failed; used the built-in parser.',
    };
  }
}

export interface ImageExtractionResult extends ExtractionResult {
  ok: boolean;
  message?: string;
}

/**
 * Read a recipe from a photo. This genuinely requires a vision model — there
 * is no offline fallback, so when Claude is not configured we say so plainly
 * rather than fabricating a result.
 */
export async function extractFromImage(
  file: File,
  signal?: AbortSignal
): Promise<ImageExtractionResult> {
  const empty: ExtractedRecipe = {
    title: '',
    description: '',
    ingredients: [],
    instructions: [],
    prepTime: null,
    cookTime: null,
    servings: null,
    cuisine: null,
    tags: [],
    notes: null,
  };

  if (!isClaudeEnabled()) {
    return {
      ok: false,
      recipe: empty,
      engine: 'local',
      message:
        'Reading a recipe from a photo needs the AI service, which is not configured for this deployment. Type the recipe in the Manual tab, or paste its text.',
    };
  }

  const base64 = await fileToBase64(file);

  try {
    const recipe = await extractFromImageWithClaude(base64, file.type, signal);
    if (recipe.ingredients.length === 0) {
      return {
        ok: false,
        recipe,
        engine: 'claude',
        message: "Couldn't find a recipe in that image. Try a clearer, straight-on photo.",
      };
    }
    return { ok: true, recipe, engine: 'claude' };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    return {
      ok: false,
      recipe: empty,
      engine: 'claude',
      message:
        err instanceof AiUnavailableError ? err.message : 'Could not read that image.',
    };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      // Strip the "data:image/png;base64," prefix.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}
