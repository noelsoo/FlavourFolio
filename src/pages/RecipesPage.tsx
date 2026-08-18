import { useMemo, useState } from 'react';
import { ChefHat, Heart, Plus, Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RecipeCard } from '@/components/RecipeCard';
import { useData } from '@/contexts/DataContext';
import { PageHeader } from '@/components/layout/PageHeader';

type SortKey = 'recent' | 'title' | 'time' | 'calories';

export default function RecipesPage() {
  const { recipes, getNutrition, setShowAddRecipe } = useData();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const cuisines = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.cuisine).filter(Boolean))).sort(),
    [recipes]
  );

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const recipe of recipes) {
      for (const tag of recipe.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = recipes.filter((recipe) => {
      if (favouritesOnly && !recipe.isFavorite) return false;
      if (cuisine !== 'all' && recipe.cuisine !== cuisine) return false;
      if (activeTags.length && !activeTags.every((t) => recipe.tags.includes(t))) {
        return false;
      }
      if (!q) return true;
      // Search titles, descriptions and ingredient text.
      return (
        recipe.title.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q) ||
        recipe.cuisine.toLowerCase().includes(q) ||
        recipe.tags.some((t) => t.includes(q)) ||
        recipe.ingredients.some((i) => i.toLowerCase().includes(q))
      );
    });

    return result.sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'time':
          return a.prepTime + a.cookTime - (b.prepTime + b.cookTime);
        case 'calories': {
          const ca = getNutrition(a.id)?.perServing.calories ?? Infinity;
          const cb = getNutrition(b.id)?.perServing.calories ?? Infinity;
          return ca - cb;
        }
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }, [recipes, query, cuisine, sort, favouritesOnly, activeTags, getNutrition]);

  const hasFilters =
    query.trim() !== '' || cuisine !== 'all' || favouritesOnly || activeTags.length > 0;

  const clearFilters = () => {
    setQuery('');
    setCuisine('all');
    setFavouritesOnly(false);
    setActiveTags([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="All recipes"
        description={`${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} in your collection`}
        action={
          <Button onClick={() => setShowAddRecipe(true)}>
            <Plus className="size-4" />
            Add recipe
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes and ingredients…"
              className="pl-9"
              type="search"
              aria-label="Search recipes"
            />
          </div>

          <div className="flex gap-2">
            <Select value={cuisine} onValueChange={setCuisine}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter by cuisine">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cuisines</SelectItem>
                {cuisines.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Sort recipes">
                <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest first</SelectItem>
                <SelectItem value="title">A to Z</SelectItem>
                <SelectItem value="time">Quickest first</SelectItem>
                <SelectItem value="calories">Fewest calories</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={favouritesOnly ? 'default' : 'outline'}
              size="icon"
              onClick={() => setFavouritesOnly((v) => !v)}
              aria-pressed={favouritesOnly}
              aria-label="Show favourites only"
              className="shrink-0"
            >
              <Heart className={favouritesOnly ? 'fill-current' : ''} />
            </Button>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setActiveTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                  }
                >
                  <Badge variant={active ? 'default' : 'secondary'} className="cursor-pointer">
                    {tag}
                  </Badge>
                </button>
              );
            })}
            {hasFilters && (
              <button type="button" onClick={clearFilters}>
                <Badge variant="outline" className="cursor-pointer gap-1">
                  <X className="size-3" />
                  Clear
                </Badge>
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={hasFilters ? 'No recipes match those filters' : 'No recipes yet'}
          description={
            hasFilters
              ? 'Try a broader search or clear the filters.'
              : 'Import one from a link, paste in some text, or write it out yourself.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setShowAddRecipe(true)}>
                <Plus className="size-4" />
                Add your first recipe
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
