import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Plus,
  RefreshCw,
  Share2,
  ShoppingCart,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/PageHeader';
import { useData, type GroceryItem } from '@/contexts/DataContext';
import { cn, weekDates } from '@/lib/utils';

export default function GroceriesPage() {
  const navigate = useNavigate();
  const {
    groceryItems,
    mealPlan,
    generateGroceryList,
    toggleGroceryItem,
    addGroceryItem,
    removeGroceryItem,
    clearCompletedGroceries,
    clearGroceryList,
  } = useData();

  const [newItem, setNewItem] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<string, GroceryItem[]>();
    for (const item of groceryItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [groceryItems]);

  const total = groceryItems.length;
  const completed = groceryItems.filter((i) => i.isCompleted).length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  const hasPlan = mealPlan.some((e) => weekDates().includes(e.date));

  const regenerate = () => {
    const count = generateGroceryList(weekDates());
    if (count === 0) {
      toast.error('Nothing planned this week', {
        description: 'Add meals to the plan first.',
        action: { label: 'Plan meals', onClick: () => navigate('/meal-plan') },
      });
      return;
    }
    toast.success(`Rebuilt from ${count} planned ingredients`);
  };

  const share = async () => {
    const text = grouped
      .map(
        ([category, items]) =>
          `${category}\n${items.map((i) => `${i.isCompleted ? '☑' : '☐'} ${i.display}`).join('\n')}`
      )
      .join('\n\n');

    // navigator.share needs a user gesture and isn't everywhere; clipboard is
    // the fallback, and both can be blocked, so report what actually happened.
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FlavourFolio grocery list', text });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied the list to your clipboard');
    } catch {
      toast.error('Could not share or copy the list');
    }
  };

  const submitNew = () => {
    if (!newItem.trim()) return;
    addGroceryItem(newItem);
    setNewItem('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groceries"
        description={
          total > 0
            ? `${completed} of ${total} picked up`
            : 'Built from the meals you have planned.'
        }
        action={
          <>
            <Button variant="outline" onClick={regenerate}>
              <RefreshCw className="size-4" />
              Rebuild
            </Button>
            {total > 0 && (
              <Button variant="outline" size="icon" onClick={share} aria-label="Share list">
                <Share2 className="size-4" />
              </Button>
            )}
          </>
        }
      />

      {total > 0 && (
        <div className="space-y-2">
          <Progress value={pct} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(pct)}% complete</span>
            <div className="flex gap-3">
              {completed > 0 && (
                <button
                  type="button"
                  className="hover:text-foreground"
                  onClick={clearCompletedGroceries}
                >
                  Clear picked up
                </button>
              )}
              <button
                type="button"
                className="hover:text-destructive"
                onClick={() => {
                  clearGroceryList();
                  toast.success('Emptied the list');
                }}
              >
                Empty list
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitNew()}
          placeholder="Add an item, e.g. 2 lbs potatoes"
          aria-label="Add a grocery item"
        />
        <Button
          onClick={submitNew}
          disabled={!newItem.trim()}
          className="shrink-0"
          aria-label="Add item to list"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your list is empty"
          description={
            hasPlan
              ? 'You have meals planned this week — build the list from them.'
              : 'Plan some meals and the ingredients will be combined into a list here.'
          }
          action={
            hasPlan ? (
              <Button onClick={regenerate}>
                <RefreshCw className="size-4" />
                Build from meal plan
              </Button>
            ) : (
              <Button onClick={() => navigate('/meal-plan')}>Plan some meals</Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.map(([category, items]) => (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span className="size-2 rounded-full bg-primary" />
                    {category}
                  </h2>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {items.filter((i) => i.isCompleted).length}/{items.length}
                  </span>
                </div>

                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.id} className="group flex items-start gap-2.5 py-1.5">
                      <Checkbox
                        id={item.id}
                        checked={item.isCompleted}
                        onCheckedChange={() => toggleGroceryItem(item.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <label
                        htmlFor={item.id}
                        className={cn(
                          'min-w-0 flex-1 cursor-pointer text-sm leading-snug',
                          item.isCompleted && 'text-muted-foreground line-through'
                        )}
                      >
                        {item.display}
                        {item.sources.length > 0 && (
                          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                            {item.sources.join(' · ')}
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeGroceryItem(item.id)}
                        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {total > 0 && completed === total && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/8 p-4 text-sm font-medium text-primary">
          <Check className="size-4" />
          Everything picked up.
        </div>
      )}
    </div>
  );
}
