import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/PageHeader';
import { RecipeCard } from '@/components/RecipeCard';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';

export default function CookbookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getCookbook,
    recipes,
    addRecipeToCookbook,
    removeRecipeFromCookbook,
    deleteCookbook,
  } = useData();

  const [picking, setPicking] = useState(false);
  const cookbook = id ? getCookbook(id) : undefined;

  if (!cookbook) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Cookbook not found"
        description="It may have been deleted."
        action={<Button onClick={() => navigate('/cookbooks')}>Back to cookbooks</Button>}
      />
    );
  }

  const contents = recipes.filter((r) => cookbook.recipeIds.includes(r.id));
  const available = recipes.filter((r) => !cookbook.recipeIds.includes(r.id));

  const handleDelete = () => {
    deleteCookbook(cookbook.id);
    toast.success(`Deleted "${cookbook.name}"`);
    navigate('/cookbooks');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={cookbook.name}
        description={cookbook.description || undefined}
        backTo="/cookbooks"
        action={
          <>
            <Button onClick={() => setPicking(true)} disabled={available.length === 0}>
              <Plus className="size-4" />
              Add recipes
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete cookbook"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        }
      />

      {contents.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing in here yet"
          description="Add recipes from your collection to build this cookbook up."
          action={
            <Button onClick={() => setPicking(true)} disabled={available.length === 0}>
              <Plus className="size-4" />
              Add recipes
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contents.map((recipe) => (
            <div key={recipe.id} className="relative">
              <RecipeCard recipe={recipe} />
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={`Remove ${recipe.title} from this cookbook`}
                onClick={() => {
                  removeRecipeFromCookbook(recipe.id, cookbook.id);
                  toast.success('Removed from cookbook');
                }}
                className="absolute left-2.5 top-2.5 bg-background/85 backdrop-blur-sm hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={picking} onOpenChange={setPicking}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add recipes</DialogTitle>
            <DialogDescription>
              Pick from the {available.length} not already in this cookbook.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            {available.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Every recipe is already in this cookbook.
              </p>
            ) : (
              <ul className="space-y-1">
                {available.map((recipe) => (
                  <li key={recipe.id}>
                    <button
                      type="button"
                      onClick={() => {
                        addRecipeToCookbook(recipe.id, cookbook.id);
                        toast.success(`Added "${recipe.title}"`);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors',
                        'hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      )}
                    >
                      <img
                        src={recipe.image}
                        alt=""
                        loading="lazy"
                        className="size-12 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{recipe.title}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {recipe.description}
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
    </div>
  );
}
