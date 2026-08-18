import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/PageHeader';
import { TargetBar } from '@/components/nutrition/NutritionPanel';
import {
  MEAL_SLOTS,
  useData,
  type MealSlot,
  type Recipe,
} from '@/contexts/DataContext';
import { cn, toDateKey, weekDates } from '@/lib/utils';
import { EMPTY_NUTRIENTS, type FoodNutrients } from '@/lib/nutrition';

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function MealPlanPage() {
  const navigate = useNavigate();
  const {
    recipes,
    mealPlan,
    getRecipe,
    getNutrition,
    addMeal,
    removeMeal,
    generateGroceryList,
    clearWeek,
    preferences,
  } = useData();

  const [weekOffset, setWeekOffset] = useState(0);
  const [picking, setPicking] = useState<{ date: string; slot: MealSlot } | null>(null);

  const dates = useMemo(() => weekDates(new Date(), weekOffset), [weekOffset]);
  const today = toDateKey(new Date());

  /** Per-serving nutrition for one planned entry, scaled to planned servings. */
  const nutritionForEntry = (recipeId: string, plannedServings: number): FoodNutrients => {
    const recipe = getRecipe(recipeId);
    const nutrition = getNutrition(recipeId);
    if (!recipe || !nutrition) return EMPTY_NUTRIENTS;
    const servings = plannedServings > 0 ? plannedServings : recipe.servings;
    const per = nutrition.perServing;
    return {
      calories: per.calories * servings,
      protein: per.protein * servings,
      carbs: per.carbs * servings,
      fat: per.fat * servings,
      fiber: per.fiber * servings,
      sugar: per.sugar * servings,
      sodium: per.sodium * servings,
    };
  };

  const weekTotals = useMemo(() => {
    const byDate = new Map<string, FoodNutrients>();
    for (const date of dates) byDate.set(date, { ...EMPTY_NUTRIENTS });

    for (const entry of mealPlan) {
      const bucket = byDate.get(entry.date);
      if (!bucket) continue;
      const n = nutritionForEntry(entry.recipeId, entry.servings);
      bucket.calories += n.calories;
      bucket.protein += n.protein;
      bucket.carbs += n.carbs;
      bucket.fat += n.fat;
      bucket.fiber += n.fiber;
      bucket.sugar += n.sugar;
      bucket.sodium += n.sodium;
    }
    return byDate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates, mealPlan, recipes]);

  const plannedCount = mealPlan.filter((e) => dates.includes(e.date)).length;

  const buildList = () => {
    const count = generateGroceryList(dates);
    if (count === 0) {
      toast.error('Nothing planned this week', {
        description: 'Add some meals first.',
      });
      return;
    }
    toast.success(`Built a list of ${count} items`, {
      action: { label: 'View', onClick: () => navigate('/groceries') },
    });
  };

  const weekLabel = () => {
    const start = new Date(`${dates[0]}T00:00:00`);
    const end = new Date(`${dates[6]}T00:00:00`);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meal plan"
        description="Plan the week, then turn it into a shopping list."
        action={
          <>
            <Button variant="outline" onClick={buildList} disabled={plannedCount === 0}>
              <ShoppingCart className="size-4" />
              Build list
            </Button>
            {plannedCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear this week"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  clearWeek(dates);
                  toast.success('Cleared the week');
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </>
        }
      />

      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset((w) => w - 1)}
          aria-label="Previous week"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{weekLabel()}</p>
          <p className="text-xs text-muted-foreground">
            {weekOffset === 0
              ? 'This week'
              : weekOffset === 1
                ? 'Next week'
                : weekOffset === -1
                  ? 'Last week'
                  : `${weekOffset > 0 ? '+' : ''}${weekOffset} weeks`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {dates.map((date) => {
            const d = new Date(`${date}T00:00:00`);
            const isToday = date === today;
            const totals = weekTotals.get(date) ?? EMPTY_NUTRIENTS;
            const entries = mealPlan.filter((e) => e.date === date);

            return (
              <Card
                key={date}
                className={cn('flex flex-col', isToday && 'border-primary/40 ring-1 ring-primary/20')}
              >
                <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {d.toLocaleDateString(undefined, { weekday: 'long' })}
                      {isToday && <Badge className="px-1.5 py-0 text-[10px]">Today</Badge>}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {totals.calories > 0 && (
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {Math.round(totals.calories)} kcal
                    </span>
                  )}
                </CardHeader>

                <CardContent className="flex-1 space-y-2 p-4 pt-1">
                  {MEAL_SLOTS.map((slot) => {
                    const slotEntries = entries.filter((e) => e.slot === slot);
                    if (slotEntries.length === 0) return null;
                    return (
                      <div key={slot} className="space-y-1">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {SLOT_LABEL[slot]}
                        </p>
                        {slotEntries.map((entry) => {
                          const recipe = getRecipe(entry.recipeId);
                          if (!recipe) return null;
                          const n = nutritionForEntry(entry.recipeId, entry.servings);
                          return (
                            <div
                              key={entry.id}
                              className="group flex items-center gap-2 rounded-lg bg-secondary/60 p-1.5"
                            >
                              <img
                                src={recipe.image}
                                alt=""
                                loading="lazy"
                                className="size-9 shrink-0 rounded-md object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => navigate(`/recipes/${recipe.id}`)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <span className="block truncate text-xs font-medium">
                                  {recipe.title}
                                </span>
                                <span className="block text-[11px] tabular-nums text-muted-foreground">
                                  {Math.round(n.calories)} kcal
                                </span>
                              </button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove ${recipe.title}`}
                                onClick={() => removeMeal(entry.id)}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {entries.length === 0 && (
                    <p className="py-2 text-xs text-muted-foreground">Nothing planned</p>
                  )}
                </CardContent>

                <div className="grid grid-cols-2 gap-1 border-t p-2">
                  {MEAL_SLOTS.map((slot) => (
                    <Button
                      key={slot}
                      variant="ghost"
                      size="sm"
                      className="h-7 justify-start px-2 text-[11px] text-muted-foreground"
                      onClick={() => setPicking({ date, slot })}
                    >
                      <Plus className="size-3" />
                      {SLOT_LABEL[slot]}
                    </Button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <aside className="xl:sticky xl:top-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Daily average</CardTitle>
              <p className="text-xs text-muted-foreground">
                Across the {dates.filter((d) => (weekTotals.get(d)?.calories ?? 0) > 0).length || 0}{' '}
                planned days, against your targets.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const plannedDays = dates.filter(
                  (d) => (weekTotals.get(d)?.calories ?? 0) > 0
                );
                if (plannedDays.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      Plan a meal to see how the week adds up.
                    </p>
                  );
                }
                const sum = plannedDays.reduce(
                  (acc, d) => {
                    const t = weekTotals.get(d)!;
                    acc.calories += t.calories;
                    acc.protein += t.protein;
                    acc.carbs += t.carbs;
                    acc.fat += t.fat;
                    return acc;
                  },
                  { calories: 0, protein: 0, carbs: 0, fat: 0 }
                );
                const n = plannedDays.length;
                const t = preferences.targets;
                return (
                  <>
                    <TargetBar
                      label="Energy"
                      value={sum.calories / n}
                      target={t.calories}
                      unit=" kcal"
                    />
                    <TargetBar
                      label="Protein"
                      value={sum.protein / n}
                      target={t.protein}
                      indicatorClassName="bg-macro-protein"
                    />
                    <TargetBar
                      label="Carbs"
                      value={sum.carbs / n}
                      target={t.carbs}
                      indicatorClassName="bg-macro-carbs"
                    />
                    <TargetBar
                      label="Fat"
                      value={sum.fat / n}
                      target={t.fat}
                      indicatorClassName="bg-macro-fat"
                    />
                    <p className="border-t pt-3 text-xs text-muted-foreground">
                      Estimates only. Adjust your targets in Settings.
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </aside>
      </div>

      <RecipePicker
        open={picking !== null}
        slot={picking?.slot}
        recipes={recipes}
        onClose={() => setPicking(null)}
        onPick={(recipe) => {
          if (!picking) return;
          addMeal(picking.date, picking.slot, recipe.id, recipe.servings);
          toast.success(`Added "${recipe.title}"`);
          setPicking(null);
        }}
      />
    </div>
  );
}

function RecipePicker({
  open,
  slot,
  recipes,
  onClose,
  onPick,
}: {
  open: boolean;
  slot?: MealSlot;
  recipes: Recipe[];
  onClose: () => void;
  onPick: (recipe: Recipe) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {slot ? SLOT_LABEL[slot].toLowerCase() : 'a meal'}</DialogTitle>
          <DialogDescription>Choose a recipe from your collection.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {recipes.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No recipes yet"
              description="Add a recipe before planning meals."
              className="border-0"
            />
          ) : (
            <ul className="space-y-1">
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => onPick(recipe)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={recipe.image}
                      alt=""
                      loading="lazy"
                      className="size-12 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{recipe.title}</span>
                      <span className="block text-sm text-muted-foreground">
                        {recipe.servings} servings ·{' '}
                        {recipe.prepTime + recipe.cookTime} min
                      </span>
                    </span>
                    <Plus className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
