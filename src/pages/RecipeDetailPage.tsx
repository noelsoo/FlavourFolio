import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookPlus,
  Calendar,
  Check,
  ChefHat,
  Clock,
  ExternalLink,
  Heart,
  Minus,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/PageHeader';
import { NutritionPanel } from '@/components/nutrition/NutritionPanel';
import { useData } from '@/contexts/DataContext';
import { cn, formatMinutes, toDateKey } from '@/lib/utils';
import { formatQuantity, parseIngredient } from '@/lib/nutrition';

/** Re-render an ingredient line at a new scale, keeping unmatched text intact. */
function scaleIngredient(line: string, factor: number): string {
  if (factor === 1) return line;
  const parsed = parseIngredient(line);
  if (parsed.quantity === null) return line;

  const scaled = formatQuantity(parsed.quantity * factor);
  if (!scaled) return line;

  // Replace only the leading quantity, leaving units and prep notes untouched.
  const withoutBullet = line.replace(/^\s*(?:[-–—•*·]|\d+[.)])\s*/, '');
  const numeric = withoutBullet.match(
    /^\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?(?:\s+\d+\s*\/\s*\d+)?|^\s*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/
  );
  if (!numeric) return `${scaled} × ${withoutBullet}`;
  return `${scaled}${withoutBullet.slice(numeric[0].length)}`;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getRecipe,
    getNutrition,
    cookbooks,
    addRecipeToCookbook,
    deleteRecipe,
    toggleFavorite,
    addMeal,
  } = useData();

  const recipe = id ? getRecipe(id) : undefined;
  const nutrition = id ? getNutrition(id) : null;

  const [servings, setServings] = useState(recipe?.servings ?? 4);
  const [done, setDone] = useState<Set<number>>(new Set());

  const scale = recipe && recipe.servings > 0 ? servings / recipe.servings : 1;

  const scaledIngredients = useMemo(
    () => (recipe ? recipe.ingredients.map((line) => scaleIngredient(line, scale)) : []),
    [recipe, scale]
  );

  if (!recipe) {
    return (
      <EmptyState
        icon={ChefHat}
        title="Recipe not found"
        description="It may have been deleted."
        action={<Button onClick={() => navigate('/recipes')}>Back to recipes</Button>}
      />
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;
  const containing = cookbooks.filter((c) => c.recipeIds.includes(recipe.id));

  const handleDelete = () => {
    deleteRecipe(recipe.id);
    toast.success(`Deleted "${recipe.title}"`);
    navigate('/recipes');
  };

  const planForToday = () => {
    addMeal(toDateKey(new Date()), 'dinner', recipe.id, servings);
    toast.success('Added to today\'s dinner', {
      action: { label: 'View plan', onClick: () => navigate('/meal-plan') },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={recipe.title} backTo={-1} description={recipe.description} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* ------------------------------ main column ------------------------------ */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-xl border bg-muted">
            <img
              src={recipe.image}
              alt=""
              className="aspect-[16/10] w-full object-cover sm:aspect-[2/1]"
            />
            <div className="absolute right-3 top-3 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => toggleFavorite(recipe.id)}
                aria-pressed={!!recipe.isFavorite}
                aria-label="Favourite"
                className="bg-background/85 backdrop-blur-sm"
              >
                <Heart
                  className={cn(
                    recipe.isFavorite && 'fill-destructive text-destructive'
                  )}
                />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" />
              <span className="font-medium">{formatMinutes(totalTime)}</span>
              <span className="text-muted-foreground">
                ({formatMinutes(recipe.prepTime)} prep)
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              <span className="font-medium">{recipe.servings}</span>
              <span className="text-muted-foreground">servings</span>
            </span>
            {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
            {recipe.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={planForToday}>
              <Calendar className="size-4" />
              Plan for today
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <BookPlus className="size-4" />
                  Add to cookbook
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Cookbooks</DropdownMenuLabel>
                {cookbooks.length === 0 && (
                  <DropdownMenuItem disabled>No cookbooks yet</DropdownMenuItem>
                )}
                {cookbooks.map((cookbook) => {
                  const already = cookbook.recipeIds.includes(recipe.id);
                  return (
                    <DropdownMenuItem
                      key={cookbook.id}
                      disabled={already}
                      onSelect={() => {
                        addRecipeToCookbook(recipe.id, cookbook.id);
                        toast.success(`Added to ${cookbook.name}`);
                      }}
                    >
                      {already && <Check className="size-4" />}
                      {cookbook.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {recipe.sourceUrl && (
              <Button variant="outline" asChild>
                <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Source
                </a>
              </Button>
            )}

            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>

          {containing.length > 0 && (
            <p className="text-sm text-muted-foreground">
              In {containing.map((c) => c.name).join(', ')}
            </p>
          )}

          <Separator />

          {/* Ingredients, with live scaling. */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">Ingredients</h2>
              <div className="flex items-center gap-2 rounded-lg border p-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  disabled={servings <= 1}
                  aria-label="Fewer servings"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="min-w-20 text-center text-sm font-medium tabular-nums">
                  {servings} {servings === 1 ? 'serving' : 'servings'}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setServings((s) => Math.min(99, s + 1))}
                  disabled={servings >= 99}
                  aria-label="More servings"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <ul className="space-y-1">
              {scaledIngredients.map((line, index) => (
                <li key={index}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/60">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={done.has(index)}
                      onChange={() =>
                        setDone((prev) => {
                          const next = new Set(prev);
                          if (next.has(index)) next.delete(index);
                          else next.add(index);
                          return next;
                        })
                      }
                    />
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                        done.has(index)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input'
                      )}
                    >
                      {done.has(index) && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span
                      className={cn(
                        'text-sm leading-relaxed',
                        done.has(index) && 'text-muted-foreground line-through'
                      )}
                    >
                      {line}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {recipe.instructions.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-semibold">Method</h2>
              <ol className="space-y-4">
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary tabular-nums">
                      {index + 1}
                    </span>
                    <p className="pt-0.5 text-sm leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {recipe.notes && (
            <section className="rounded-xl border bg-muted/40 p-4">
              <h2 className="mb-2 text-sm font-semibold">Notes</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {recipe.notes}
              </p>
            </section>
          )}
        </div>

        {/* ------------------------------ nutrition rail ------------------------------ */}
        <aside className="lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nutrition</CardTitle>
            </CardHeader>
            <CardContent>
              {nutrition && nutrition.countedCount > 0 ? (
                <NutritionPanel nutrition={nutrition} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  None of these ingredients could be matched to the nutrition table, so
                  there is nothing reliable to show.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
