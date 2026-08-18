import { Link } from 'react-router-dom';
import { Clock, Heart, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { NutritionSummary } from '@/components/nutrition/NutritionPanel';
import { useData, type Recipe } from '@/contexts/DataContext';
import { cn, formatMinutes } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const { getNutrition, toggleFavorite } = useData();
  const nutrition = getNutrition(recipe.id);
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Card interactive className={cn('group overflow-hidden', className)}>
      <Link to={`/recipes/${recipe.id}`} className="block focus-visible:outline-none">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <span className="text-3xl">🍽️</span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              // The card is a link; don't navigate when favouriting.
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(recipe.id);
            }}
            aria-label={recipe.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            aria-pressed={!!recipe.isFavorite}
            className="absolute right-2.5 top-2.5 flex size-9 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm transition-colors hover:bg-background"
          >
            <Heart
              className={cn(
                'size-4.5 transition-colors',
                recipe.isFavorite
                  ? 'fill-destructive text-destructive'
                  : 'text-muted-foreground'
              )}
            />
          </button>

          {recipe.cuisine && (
            <Badge
              variant="secondary"
              className="absolute bottom-2.5 left-2.5 bg-background/85 backdrop-blur-sm"
            >
              {recipe.cuisine}
            </Badge>
          )}
        </div>

        <div className="space-y-2.5 p-4">
          <h3 className="line-clamp-1 font-semibold leading-tight">{recipe.title}</h3>
          {recipe.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {recipe.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatMinutes(totalTime)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {recipe.servings}
            </span>
          </div>

          {nutrition && nutrition.countedCount > 0 && (
            <NutritionSummary nutrition={nutrition} className="border-t pt-2.5" />
          )}
        </div>
      </Link>
    </Card>
  );
}

export function RecipeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}
