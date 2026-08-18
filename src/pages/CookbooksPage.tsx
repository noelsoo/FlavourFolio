import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BookPlus, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/PageHeader';
import { RecipeCard } from '@/components/RecipeCard';
import { useData } from '@/contexts/DataContext';

export default function CookbooksPage() {
  const { cookbooks, recipes, addCookbook, setShowAddRecipe } = useData();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const recent = [...recipes]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);

  const create = () => {
    if (!name.trim()) return;
    const cookbook = addCookbook({ name: name.trim(), description: description.trim() });
    toast.success(`Created "${cookbook.name}"`);
    setName('');
    setDescription('');
    setCreating(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My cookbooks"
        description="Collections of recipes, grouped however suits you."
        action={
          <Button onClick={() => setCreating(true)}>
            <BookPlus className="size-4" />
            New cookbook
          </Button>
        }
      />

      {cookbooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No cookbooks yet"
          description="Cookbooks group related recipes — weeknight dinners, baking, whatever works."
          action={
            <Button onClick={() => setCreating(true)}>
              <BookPlus className="size-4" />
              Create a cookbook
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cookbooks.map((cookbook) => {
            const contents = recipes.filter((r) => cookbook.recipeIds.includes(r.id));
            const covers = contents.slice(0, 3);

            return (
              <Link key={cookbook.id} to={`/cookbooks/${cookbook.id}`} className="group">
                <Card interactive className="h-full overflow-hidden">
                  <div className="flex h-28 gap-0.5 bg-muted">
                    {covers.length === 0 ? (
                      <div className="flex size-full items-center justify-center">
                        <BookOpen className="size-7 text-muted-foreground/50" />
                      </div>
                    ) : (
                      covers.map((recipe) => (
                        <img
                          key={recipe.id}
                          src={recipe.image}
                          alt=""
                          loading="lazy"
                          className="h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ))
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold leading-tight">{cookbook.name}</h3>
                    {cookbook.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {cookbook.description}
                      </p>
                    )}
                    <p className="mt-2.5 text-xs text-muted-foreground">
                      {contents.length} {contents.length === 1 ? 'recipe' : 'recipes'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recently added</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/recipes">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {recipes.length === 0 && (
        <EmptyState
          icon={Plus}
          title="Your collection is empty"
          description="Import a recipe from a link, paste one in, or write it out."
          action={<Button onClick={() => setShowAddRecipe(true)}>Add a recipe</Button>}
        />
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New cookbook</DialogTitle>
            <DialogDescription>Give this collection a name.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5">
            <div className="space-y-2">
              <Label htmlFor="cb-name">Name</Label>
              <Input
                id="cb-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunday baking"
                onKeyDown={(e) => e.key === 'Enter' && create()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cb-desc">Description</Label>
              <Textarea
                id="cb-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button disabled={!name.trim()} onClick={create}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
