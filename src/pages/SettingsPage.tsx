import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Download,
  LogOut,
  Monitor,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_TARGETS, useData } from '@/contexts/DataContext';
import { useTheme } from '@/hooks/use-theme';
import { isStorageAvailable, storageFootprint } from '@/lib/storage';
import { isClaudeEnabled } from '@/lib/ai';
import { cn } from '@/lib/utils';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { preferences, setTargets, resetAllData, recipes, cookbooks, mealPlan } = useData();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name ?? '');
  const [targets, setLocalTargets] = useState(preferences.targets);

  const initials =
    user?.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'FF';

  const footprintKb = Math.round((storageFootprint() / 1024) * 10) / 10;

  const saveTargets = () => {
    setTargets(targets);
    toast.success('Targets updated');
  };

  const exportData = () => {
    const payload = { recipes, cookbooks, mealPlan, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flavourfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported your data');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" backTo={-1} />

      {/* ------------------------------- profile ------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{user?.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-name">Display name</Label>
            <div className="flex gap-2">
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={!name.trim() || name === user?.name}
                onClick={() => {
                  updateProfile({ name: name.trim() });
                  toast.success('Name updated');
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------- appearance ------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={theme === option.value}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors',
                  theme === option.value
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'hover:bg-secondary'
                )}
              >
                <option.icon className="size-5" />
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------- targets ------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4" />
            Daily nutrition targets
          </CardTitle>
          <CardDescription>
            Used to show progress on the meal plan. These are your own reference
            figures, not medical advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['calories', 'Energy (kcal)'],
                ['protein', 'Protein (g)'],
                ['carbs', 'Carbs (g)'],
                ['fat', 'Fat (g)'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`target-${key}`}>{label}</Label>
                <Input
                  id={`target-${key}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={targets[key]}
                  onChange={(e) =>
                    setLocalTargets((prev) => ({
                      ...prev,
                      [key]: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={saveTargets}>Save targets</Button>
            <Button variant="ghost" onClick={() => setLocalTargets(DEFAULT_TARGETS)}>
              Reset to defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --------------------------------- AI ---------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            AI features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span>Claude extraction</span>
            <Badge variant={isClaudeEnabled() ? 'success' : 'secondary'}>
              {isClaudeEnabled() ? 'Connected' : 'Not configured'}
            </Badge>
          </div>
          <Separator />
          <p className="text-muted-foreground">
            {isClaudeEnabled()
              ? 'Messy pasted text and photographed recipe cards are sent to your configured proxy for Claude to read.'
              : 'Link and paste import work offline using the built-in parsers. Photo import needs a vision model — set VITE_AI_PROXY_URL to enable it. See the README.'}
          </p>
          <p className="text-muted-foreground">
            Nutrition figures are always calculated on your device from a reference
            table — never generated by a model.
          </p>
        </CardContent>
      </Card>

      {/* -------------------------------- data --------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4" />
            Your data
          </CardTitle>
          <CardDescription>
            {isStorageAvailable()
              ? `Stored in this browser only — about ${footprintKb} KB. Nothing is uploaded.`
              : 'Browser storage is unavailable, so changes will not survive a refresh.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ['Recipes', recipes.length],
              ['Cookbooks', cookbooks.length],
              ['Planned meals', mealPlan.length],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg bg-secondary p-3">
                <p className="text-xl font-semibold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="size-4" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (
                  window.confirm(
                    'Reset everything back to the sample recipes? Your own recipes, cookbooks and meal plans will be deleted. This cannot be undone.'
                  )
                ) {
                  resetAllData();
                  toast.success('Reset to sample data');
                }
              }}
            >
              <RotateCcw className="size-4" />
              Reset all data
            </Button>
          </div>

          {!isStorageAvailable() && (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/8 p-3 text-xs">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
              This browser is blocking local storage — private browsing often does.
              Anything you add will be lost when you close the tab.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <p className="pb-4 text-center text-xs text-muted-foreground">
        FlavourFolio · nutrition figures are estimates from reference data
      </p>
    </div>
  );
}
