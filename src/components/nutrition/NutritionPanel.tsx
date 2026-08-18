import { AlertTriangle, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  confidenceLabel,
  macroSplit,
  type RecipeNutrition,
} from '@/lib/nutrition';

const MACROS = [
  { key: 'protein', label: 'Protein', color: 'bg-macro-protein', text: 'text-macro-protein' },
  { key: 'carbs', label: 'Carbs', color: 'bg-macro-carbs', text: 'text-macro-carbs' },
  { key: 'fat', label: 'Fat', color: 'bg-macro-fat', text: 'text-macro-fat' },
] as const;

interface NutritionPanelProps {
  nutrition: RecipeNutrition;
  /** Multiplier when the user scales the recipe. */
  scale?: number;
  className?: string;
}

export function NutritionPanel({ nutrition, scale = 1, className }: NutritionPanelProps) {
  const per = nutrition.perServing;
  const split = macroSplit(per);
  const confidence = confidenceLabel(nutrition.confidence);

  const grams = {
    protein: per.protein * scale,
    carbs: per.carbs * scale,
    fat: per.fat * scale,
  };

  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tabular-nums tracking-tight">
              {Math.round(per.calories * scale)}
            </span>
            <span className="text-sm text-muted-foreground">kcal</span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">per serving</p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="How this estimate was calculated">
              <Badge variant={confidence.tone} className="gap-1.5">
                <Info className="size-3" />
                {confidence.label}
              </Badge>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Calculated from {nutrition.countedCount} of{' '}
            {nutrition.ingredients.filter((i) => i.status !== 'to-taste').length} measurable
            ingredients, using reference values per 100g.
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Energy split across the three macronutrients. */}
      <div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          {MACROS.map((macro) => (
            <div
              key={macro.key}
              className={cn('h-full transition-all duration-500', macro.color)}
              style={{ width: `${split[macro.key]}%` }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {MACROS.map((macro) => (
            <div key={macro.key}>
              <div className="flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', macro.color)} />
                <span className="text-xs text-muted-foreground">{macro.label}</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {grams[macro.key] >= 10
                  ? Math.round(grams[macro.key])
                  : Math.round(grams[macro.key] * 10) / 10}
                g
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {Math.round(split[macro.key])}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Fibre</dt>
          <dd className="font-medium tabular-nums">
            {Math.round(per.fiber * scale * 10) / 10}g
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sugar</dt>
          <dd className="font-medium tabular-nums">
            {Math.round(per.sugar * scale * 10) / 10}g
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sodium</dt>
          <dd className="font-medium tabular-nums">{Math.round(per.sodium * scale)}mg</dd>
        </div>
      </dl>

      {nutrition.unresolved.length > 0 && (
        <div className="rounded-lg border border-dashed bg-muted/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <AlertTriangle className="size-3.5 text-macro-carbs" />
            Not included in this estimate
          </p>
          <ul className="mt-2 space-y-1">
            {nutrition.unresolved.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="text-foreground">{item.parsed.raw}</span> — {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Compact single-line variant for cards and list rows. */
export function NutritionSummary({
  nutrition,
  className,
}: {
  nutrition: RecipeNutrition;
  className?: string;
}) {
  const per = nutrition.perServing;
  return (
    <div className={cn('flex items-center gap-3 text-xs tabular-nums', className)}>
      <span className="font-medium">{Math.round(per.calories)} kcal</span>
      <span className="text-macro-protein">P {Math.round(per.protein)}g</span>
      <span className="text-macro-carbs">C {Math.round(per.carbs)}g</span>
      <span className="text-macro-fat">F {Math.round(per.fat)}g</span>
    </div>
  );
}

/** Progress against a daily target, used on the meal plan. */
export function TargetBar({
  label,
  value,
  target,
  unit = 'g',
  indicatorClassName,
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  indicatorClassName?: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = target > 0 && value > target * 1.1;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn('text-xs tabular-nums', over && 'text-destructive')}>
          {Math.round(value)}
          <span className="text-muted-foreground">
            /{Math.round(target)}
            {unit}
          </span>
        </span>
      </div>
      <Progress
        value={pct}
        indicatorClassName={cn(indicatorClassName, over && 'bg-destructive')}
      />
    </div>
  );
}
