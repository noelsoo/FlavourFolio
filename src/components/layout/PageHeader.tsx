import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Shows a back button — used on detail pages. */
  backTo?: string | number;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  backTo,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('space-y-3', className)}>
      {backTo !== undefined && (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          onClick={() =>
            typeof backTo === 'string' ? navigate(backTo) : navigate(backTo as number)
          }
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
