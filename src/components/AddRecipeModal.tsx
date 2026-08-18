import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  FileText,
  Link2,
  Loader2,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useData, type Recipe } from '@/contexts/DataContext';
import {
  extractFromImage,
  extractFromText,
  importRecipeFromUrl,
  isClaudeEnabled,
  type ExtractedRecipe,
} from '@/lib/ai';

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200';

type NewRecipe = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

/** Fill the gaps an extraction leaves, without inventing content. */
function toRecipe(extracted: ExtractedRecipe, extra: Partial<NewRecipe> = {}): NewRecipe {
  return {
    title: extracted.title || 'Untitled recipe',
    description: extracted.description || '',
    image: extra.image || FALLBACK_IMAGE,
    ingredients: extracted.ingredients,
    instructions: extracted.instructions,
    prepTime: extracted.prepTime ?? 0,
    cookTime: extracted.cookTime ?? 0,
    servings: extracted.servings ?? 4,
    cuisine: extracted.cuisine ?? '',
    tags: extracted.tags,
    notes: extracted.notes ?? undefined,
    ...extra,
  };
}

export function AddRecipeModal() {
  const { showAddRecipe, setShowAddRecipe, addRecipe } = useData();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const close = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setShowAddRecipe(false);
  }, [setShowAddRecipe]);

  const save = useCallback(
    (recipe: NewRecipe, note?: string) => {
      const created = addRecipe(recipe);
      toast.success(`Saved "${created.title}"`, { description: note });
      setShowAddRecipe(false);
      navigate(`/recipes/${created.id}`);
    },
    [addRecipe, navigate, setShowAddRecipe]
  );

  return (
    <Dialog open={showAddRecipe} onOpenChange={(open) => (open ? null : close())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a recipe</DialogTitle>
          <DialogDescription>
            Import from a link, paste the text, photograph a recipe card, or type it in.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="url" className="flex min-h-0 flex-1 flex-col">
          <div className="px-5">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="url">
                <Link2 />
                <span className="hidden sm:inline">Link</span>
              </TabsTrigger>
              <TabsTrigger value="paste">
                <FileText />
                <span className="hidden sm:inline">Paste</span>
              </TabsTrigger>
              <TabsTrigger value="photo">
                <Camera />
                <span className="hidden sm:inline">Photo</span>
              </TabsTrigger>
              <TabsTrigger value="manual">
                <PencilLine />
                <span className="hidden sm:inline">Manual</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <TabsContent value="url">
              <UrlImport abortRef={abortRef} onSave={save} />
            </TabsContent>
            <TabsContent value="paste">
              <PasteImport abortRef={abortRef} onSave={save} />
            </TabsContent>
            <TabsContent value="photo">
              <PhotoImport abortRef={abortRef} onSave={save} />
            </TabsContent>
            <TabsContent value="manual">
              <ManualEntry onSave={save} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

type AbortRef = React.MutableRefObject<AbortController | null>;
type SaveFn = (recipe: NewRecipe, note?: string) => void;

// ------------------------------------------------------------------ URL tab

function UrlImport({ abortRef, onSave }: { abortRef: AbortRef; onSave: SaveFn }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const outcome = await importRecipeFromUrl(url, controller.signal);
      if (!outcome.ok) {
        setError(outcome.message);
        return;
      }
      onSave(
        toRecipe(outcome.recipe, {
          image: outcome.recipe.image || FALLBACK_IMAGE,
          sourceUrl: outcome.recipe.sourceUrl,
        }),
        `Read from the page's ${outcome.method === 'json-ld' ? 'structured data' : 'microdata'}.`
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Something went wrong reading that page.');
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipe-url">Recipe URL</Label>
        <Input
          id="recipe-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && url.trim() && !busy && run()}
          placeholder="https://example.com/best-lasagne"
        />
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p>
          Recipes are read from the page's own structured data (schema.org), which most
          recipe sites and food blogs publish — so what you get is exactly what the site
          says, not a guess.
        </p>
        <p className="mt-2">
          Some sites block browsers from reading them directly. When that happens you'll be
          told, and the Paste tab will still work.
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      <Button className="w-full" disabled={!url.trim() || busy} loading={busy} onClick={run}>
        {busy ? 'Reading the page…' : 'Import recipe'}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- Paste tab

function PasteImport({ abortRef, onSave }: { abortRef: AbortRef; onSave: SaveFn }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await extractFromText(text, controller.signal);
      if (result.recipe.ingredients.length === 0) {
        toast.error('No ingredients found', {
          description: 'Check the text includes an ingredients list, or use the Manual tab.',
        });
        return;
      }
      const note = result.degradedReason
        ? `${result.degradedReason} Parsed locally instead.`
        : result.engine === 'claude'
          ? 'Structured by Claude.'
          : 'Parsed on your device.';
      onSave(toRecipe(result.recipe), note);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error('Could not read that text.');
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="recipe-text">Recipe text</Label>
          {isClaudeEnabled() && (
            <Badge variant="accent">
              <Sparkles className="size-3" />
              AI assisted
            </Badge>
          )}
        </div>
        <Textarea
          id="recipe-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="font-mono text-xs leading-relaxed"
          placeholder={`Chocolate Chip Cookies

Prep 15 minutes · Cook 11 minutes · Serves 24

Ingredients
2 1/4 cups all-purpose flour
1 tsp baking soda
1 cup butter, softened
2 large eggs

Instructions
1. Preheat the oven to 375°F
2. Mix the flour and baking soda
3. Bake for 9-11 minutes`}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Headed sections are detected automatically. Without headings, each line is
        classified by its own content — quantities and units mark ingredients, action verbs
        mark steps.
      </p>

      <Button className="w-full" disabled={!text.trim() || busy} loading={busy} onClick={run}>
        {busy ? 'Reading…' : 'Extract recipe'}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- Photo tab

function PhotoImport({ abortRef, onSave }: { abortRef: AbortRef; onSave: SaveFn }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = isClaudeEnabled();

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires onChange.
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('That file is not an image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('That image is larger than 10MB. Try a smaller photo.');
      return;
    }

    setBusy(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await extractFromImage(file, controller.signal);
      if (!result.ok) {
        setError(result.message ?? 'Could not read that image.');
        return;
      }
      onSave(toRecipe(result.recipe), 'Transcribed from your photo by Claude.');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError('Could not read that image.');
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {!enabled ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary">
            <Camera className="size-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">Photo import needs the AI service</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Reading a recipe from a photograph requires a vision model. Set{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_AI_PROXY_URL</code>{' '}
            to enable it — see the README.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Until then, use the Paste or Manual tabs.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center">
          {busy ? (
            <>
              <Loader2 className="mx-auto mb-3 size-8 animate-spin text-primary" />
              <h3 className="font-semibold">Reading your photo…</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Transcribing the recipe card.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Camera className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold">Photograph a recipe</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                Take a straight-on photo of a recipe card or cookbook page.
              </p>
              <Button className="mt-4" onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" />
                Choose a photo
              </Button>
            </>
          )}
        </div>
      )}

      {error && <ErrorNote message={error} />}
    </div>
  );
}

// --------------------------------------------------------------- Manual tab

function ManualEntry({ onSave }: { onSave: SaveFn }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    cuisine: '',
    tags: '',
    image: '',
  });
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const cleanIngredients = ingredients.map((i) => i.trim()).filter(Boolean);
  const canSave = form.title.trim().length > 0 && cleanIngredients.length > 0;

  const submit = () => {
    if (!canSave) return;
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image.trim() || FALLBACK_IMAGE,
      ingredients: cleanIngredients,
      instructions: instructions.map((i) => i.trim()).filter(Boolean),
      prepTime: Math.max(0, form.prepTime),
      cookTime: Math.max(0, form.cookTime),
      servings: Math.max(1, form.servings),
      cuisine: form.cuisine.trim(),
      tags: form.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="m-title">Title *</Label>
        <Input
          id="m-title"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Sunday roast chicken"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="m-desc">Description</Label>
        <Textarea
          id="m-desc"
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="A short line about the dish"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="m-servings">Servings</Label>
          <Input
            id="m-servings"
            type="number"
            min={1}
            inputMode="numeric"
            value={form.servings}
            onChange={(e) => set('servings', parseInt(e.target.value, 10) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-prep">Prep (min)</Label>
          <Input
            id="m-prep"
            type="number"
            min={0}
            inputMode="numeric"
            value={form.prepTime}
            onChange={(e) => set('prepTime', parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-cook">Cook (min)</Label>
          <Input
            id="m-cook"
            type="number"
            min={0}
            inputMode="numeric"
            value={form.cookTime}
            onChange={(e) => set('cookTime', parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </div>

      <ListEditor
        label="Ingredients *"
        hint="Include quantities — they drive the nutrition estimate."
        items={ingredients}
        setItems={setIngredients}
        placeholder={(i) => `e.g. ${i === 0 ? '2 cups plain flour' : 'Ingredient'}`}
      />

      <ListEditor
        label="Method"
        items={instructions}
        setItems={setInstructions}
        multiline
        placeholder={(i) => `Step ${i + 1}`}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="m-cuisine">Cuisine</Label>
          <Input
            id="m-cuisine"
            value={form.cuisine}
            onChange={(e) => set('cuisine', e.target.value)}
            placeholder="Italian"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-tags">Tags</Label>
          <Input
            id="m-tags"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="dinner, quick"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="m-image">Image URL</Label>
        <Input
          id="m-image"
          type="url"
          value={form.image}
          onChange={(e) => set('image', e.target.value)}
          placeholder="Optional"
        />
      </div>

      <Button className="w-full" disabled={!canSave} onClick={submit}>
        Save recipe
      </Button>
    </div>
  );
}

function ListEditor({
  label,
  hint,
  items,
  setItems,
  placeholder,
  multiline,
}: {
  label: string;
  hint?: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: (index: number) => string;
  multiline?: boolean;
}) {
  const update = (index: number, value: string) =>
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
  const remove = (index: number) =>
    setItems((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            {multiline ? (
              <Textarea
                rows={2}
                value={item}
                onChange={(e) => update(index, e.target.value)}
                placeholder={placeholder(index)}
                className="flex-1"
              />
            ) : (
              <Input
                value={item}
                onChange={(e) => update(index, e.target.value)}
                placeholder={placeholder(index)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setItems((prev) => [...prev, '']);
                  }
                }}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label={`Remove item ${index + 1}`}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setItems((prev) => [...prev, ''])}
        className="w-full"
      >
        <Plus className="size-4" />
        Add
      </Button>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/8 p-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p className="text-foreground">{message}</p>
    </div>
  );
}

export default AddRecipeModal;
