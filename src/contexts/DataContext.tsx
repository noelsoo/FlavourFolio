import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { uid, weekDates } from '@/lib/utils';
import { loadState, saveState, StorageKeys } from '@/lib/storage';
import {
  aggregateIngredients,
  computeRecipeNutrition,
  type RecipeNutrition,
} from '@/lib/nutrition';
import { seedCookbooks, seedRecipes } from '@/data/seed';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  cuisine: string;
  tags: string[];
  sourceUrl?: string;
  notes?: string;
  isFavorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cookbook {
  id: string;
  name: string;
  description: string;
  recipeIds: string[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanEntry {
  id: string;
  date: string;
  slot: MealSlot;
  recipeId: string;
  /** Servings actually being cooked, which may differ from the recipe's own. */
  servings: number;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  /** Display string, e.g. "2 1/2 cups". */
  display: string;
  isCompleted: boolean;
  /** Recipes this came from. Empty for manually added items. */
  sources: string[];
  isManual: boolean;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2000,
  protein: 50,
  carbs: 260,
  fat: 70,
};

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface Preferences {
  targets: NutritionTargets;
  theme: 'light' | 'dark' | 'system';
}

interface DataContextValue {
  recipes: Recipe[];
  cookbooks: Cookbook[];
  mealPlan: MealPlanEntry[];
  groceryItems: GroceryItem[];
  preferences: Preferences;

  getRecipe: (id: string) => Recipe | undefined;
  getCookbook: (id: string) => Cookbook | undefined;
  /** Memoised nutrition for a recipe. */
  getNutrition: (recipeId: string) => RecipeNutrition | null;

  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Recipe;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;

  addCookbook: (input: { name: string; description?: string; color?: string }) => Cookbook;
  updateCookbook: (id: string, updates: Partial<Cookbook>) => void;
  deleteCookbook: (id: string) => void;
  addRecipeToCookbook: (recipeId: string, cookbookId: string) => void;
  removeRecipeFromCookbook: (recipeId: string, cookbookId: string) => void;

  addMeal: (date: string, slot: MealSlot, recipeId: string, servings?: number) => void;
  removeMeal: (entryId: string) => void;
  updateMealServings: (entryId: string, servings: number) => void;
  mealsFor: (date: string) => MealPlanEntry[];
  clearWeek: (dates: string[]) => void;

  generateGroceryList: (dates: string[]) => number;
  toggleGroceryItem: (id: string) => void;
  addGroceryItem: (text: string) => void;
  removeGroceryItem: (id: string) => void;
  clearCompletedGroceries: () => void;
  clearGroceryList: () => void;

  setTargets: (targets: NutritionTargets) => void;
  setTheme: (theme: Preferences['theme']) => void;
  resetAllData: () => void;

  showAddRecipe: boolean;
  setShowAddRecipe: (show: boolean) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const DEFAULT_PREFERENCES: Preferences = {
  targets: DEFAULT_TARGETS,
  theme: 'system',
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Seed data only on a genuinely first run, so a user who deletes every
  // sample recipe doesn't find them resurrected on the next visit.
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const stored = loadState<Recipe[] | null>(StorageKeys.recipes, null);
    if (stored) return stored;
    return loadState(StorageKeys.seeded, false) ? [] : seedRecipes();
  });
  const [cookbooks, setCookbooks] = useState<Cookbook[]>(() => {
    const stored = loadState<Cookbook[] | null>(StorageKeys.cookbooks, null);
    if (stored) return stored;
    return loadState(StorageKeys.seeded, false) ? [] : seedCookbooks();
  });
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>(() =>
    loadState<MealPlanEntry[]>(StorageKeys.mealPlans, [])
  );
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(() =>
    loadState<GroceryItem[]>(StorageKeys.groceries, [])
  );
  const [preferences, setPreferences] = useState<Preferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...loadState<Partial<Preferences>>(StorageKeys.preferences, {}),
  }));
  const [showAddRecipe, setShowAddRecipe] = useState(false);

  useEffect(() => {
    saveState(StorageKeys.recipes, recipes);
    saveState(StorageKeys.seeded, true);
  }, [recipes]);
  useEffect(() => saveState(StorageKeys.cookbooks, cookbooks), [cookbooks]);
  useEffect(() => saveState(StorageKeys.mealPlans, mealPlan), [mealPlan]);
  useEffect(() => saveState(StorageKeys.groceries, groceryItems), [groceryItems]);
  useEffect(() => saveState(StorageKeys.preferences, preferences), [preferences]);

  // Nutrition is pure over (ingredients, servings) but not cheap, so cache it
  // per recipe and recompute only when that recipe actually changes.
  const nutritionCache = useMemo(() => {
    const cache = new Map<string, RecipeNutrition>();
    for (const recipe of recipes) {
      cache.set(recipe.id, computeRecipeNutrition(recipe.ingredients, recipe.servings));
    }
    return cache;
  }, [recipes]);

  const getRecipe = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes]
  );
  const getCookbook = useCallback(
    (id: string) => cookbooks.find((c) => c.id === id),
    [cookbooks]
  );
  const getNutrition = useCallback(
    (recipeId: string) => nutritionCache.get(recipeId) ?? null,
    [nutritionCache]
  );

  // ---------------------------------------------------------------- recipes
  const addRecipe = useCallback(
    (input: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Recipe => {
      const now = new Date();
      const recipe: Recipe = { ...input, id: uid(), createdAt: now, updatedAt: now };
      setRecipes((prev) => [recipe, ...prev]);
      return recipe;
    },
    []
  );

  const updateRecipe = useCallback((id: string, updates: Partial<Recipe>) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r))
    );
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    // Keep referential integrity: drop the recipe from cookbooks and the plan.
    setCookbooks((prev) =>
      prev.map((c) =>
        c.recipeIds.includes(id)
          ? { ...c, recipeIds: c.recipeIds.filter((rid) => rid !== id), updatedAt: new Date() }
          : c
      )
    );
    setMealPlan((prev) => prev.filter((entry) => entry.recipeId !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  }, []);

  // -------------------------------------------------------------- cookbooks
  const addCookbook = useCallback(
    (input: { name: string; description?: string; color?: string }): Cookbook => {
      const now = new Date();
      const cookbook: Cookbook = {
        id: uid(),
        name: input.name,
        description: input.description ?? '',
        color: input.color ?? 'primary',
        recipeIds: [],
        createdAt: now,
        updatedAt: now,
      };
      setCookbooks((prev) => [...prev, cookbook]);
      return cookbook;
    },
    []
  );

  const updateCookbook = useCallback((id: string, updates: Partial<Cookbook>) => {
    setCookbooks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c))
    );
  }, []);

  const deleteCookbook = useCallback((id: string) => {
    setCookbooks((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addRecipeToCookbook = useCallback((recipeId: string, cookbookId: string) => {
    setCookbooks((prev) =>
      prev.map((c) =>
        // Guard against adding the same recipe twice.
        c.id === cookbookId && !c.recipeIds.includes(recipeId)
          ? { ...c, recipeIds: [...c.recipeIds, recipeId], updatedAt: new Date() }
          : c
      )
    );
  }, []);

  const removeRecipeFromCookbook = useCallback((recipeId: string, cookbookId: string) => {
    setCookbooks((prev) =>
      prev.map((c) =>
        c.id === cookbookId
          ? { ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId), updatedAt: new Date() }
          : c
      )
    );
  }, []);

  // -------------------------------------------------------------- meal plan
  const addMeal = useCallback(
    (date: string, slot: MealSlot, recipeId: string, servings?: number) => {
      setMealPlan((prev) => [
        ...prev,
        { id: uid(), date, slot, recipeId, servings: servings ?? 0 },
      ]);
    },
    []
  );

  const removeMeal = useCallback((entryId: string) => {
    setMealPlan((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const updateMealServings = useCallback((entryId: string, servings: number) => {
    setMealPlan((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, servings: Math.max(1, servings) } : e))
    );
  }, []);

  const mealsFor = useCallback(
    (date: string) => mealPlan.filter((e) => e.date === date),
    [mealPlan]
  );

  const clearWeek = useCallback((dates: string[]) => {
    const set = new Set(dates);
    setMealPlan((prev) => prev.filter((e) => !set.has(e.date)));
  }, []);

  // ---------------------------------------------------------------- grocery
  const generateGroceryList = useCallback(
    (dates: string[]): number => {
      const set = new Set(dates.length ? dates : weekDates());
      const entries = mealPlan.filter((e) => set.has(e.date));

      const inputs = entries.flatMap((entry) => {
        const recipe = recipes.find((r) => r.id === entry.recipeId);
        if (!recipe) return [];
        // Scale each line if the plan cooks a different number of servings.
        const planned = entry.servings > 0 ? entry.servings : recipe.servings;
        const scale = recipe.servings > 0 ? planned / recipe.servings : 1;
        return recipe.ingredients.map((ingredient) => ({
          ingredient,
          recipeTitle: recipe.title,
          scale,
        }));
      });

      const aggregated = aggregateIngredients(inputs);

      setGroceryItems((prev) => {
        // Preserve tick state across regeneration, and keep manual additions.
        const checked = new Set(prev.filter((i) => i.isCompleted).map((i) => i.name));
        const manual = prev.filter((i) => i.isManual);
        const generated: GroceryItem[] = aggregated.map((item) => ({
          id: uid(),
          name: item.name,
          category: item.category,
          display: item.display,
          isCompleted: checked.has(item.name),
          sources: item.sources,
          isManual: false,
        }));
        return [...generated, ...manual];
      });

      return aggregated.length;
    },
    [mealPlan, recipes]
  );

  const toggleGroceryItem = useCallback((id: string) => {
    setGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isCompleted: !i.isCompleted } : i))
    );
  }, []);

  const addGroceryItem = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Reuse the ingredient pipeline so manual items get a sensible aisle.
    const [item] = aggregateIngredients([{ ingredient: trimmed, recipeTitle: '' }]);
    setGroceryItems((prev) => [
      ...prev,
      {
        id: uid(),
        name: item?.name ?? trimmed,
        category: item?.category ?? 'Other',
        display: trimmed,
        isCompleted: false,
        sources: [],
        isManual: true,
      },
    ]);
  }, []);

  const removeGroceryItem = useCallback((id: string) => {
    setGroceryItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCompletedGroceries = useCallback(() => {
    setGroceryItems((prev) => prev.filter((i) => !i.isCompleted));
  }, []);

  const clearGroceryList = useCallback(() => setGroceryItems([]), []);

  // ------------------------------------------------------------ preferences
  const setTargets = useCallback((targets: NutritionTargets) => {
    setPreferences((prev) => ({ ...prev, targets }));
  }, []);

  const setTheme = useCallback((theme: Preferences['theme']) => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const resetAllData = useCallback(() => {
    setRecipes(seedRecipes());
    setCookbooks(seedCookbooks());
    setMealPlan([]);
    setGroceryItems([]);
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      recipes,
      cookbooks,
      mealPlan,
      groceryItems,
      preferences,
      getRecipe,
      getCookbook,
      getNutrition,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      toggleFavorite,
      addCookbook,
      updateCookbook,
      deleteCookbook,
      addRecipeToCookbook,
      removeRecipeFromCookbook,
      addMeal,
      removeMeal,
      updateMealServings,
      mealsFor,
      clearWeek,
      generateGroceryList,
      toggleGroceryItem,
      addGroceryItem,
      removeGroceryItem,
      clearCompletedGroceries,
      clearGroceryList,
      setTargets,
      setTheme,
      resetAllData,
      showAddRecipe,
      setShowAddRecipe,
    }),
    [
      recipes, cookbooks, mealPlan, groceryItems, preferences,
      getRecipe, getCookbook, getNutrition,
      addRecipe, updateRecipe, deleteRecipe, toggleFavorite,
      addCookbook, updateCookbook, deleteCookbook,
      addRecipeToCookbook, removeRecipeFromCookbook,
      addMeal, removeMeal, updateMealServings, mealsFor, clearWeek,
      generateGroceryList, toggleGroceryItem, addGroceryItem,
      removeGroceryItem, clearCompletedGroceries, clearGroceryList,
      setTargets, setTheme, resetAllData, showAddRecipe,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
