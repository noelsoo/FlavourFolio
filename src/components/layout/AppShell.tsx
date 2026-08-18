import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  ChefHat,
  Plus,
  Settings,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/cookbooks', icon: BookOpen, label: 'Cookbooks' },
  { to: '/recipes', icon: ChefHat, label: 'Recipes' },
  { to: '/meal-plan', icon: Calendar, label: 'Meal plan' },
  { to: '/groceries', icon: ShoppingCart, label: 'Groceries' },
];

/**
 * One shell, two form factors. Below `lg` it is a mobile app: sticky header
 * plus a bottom tab bar. At `lg` and above the tab bar is replaced by a
 * persistent sidebar and the content area widens into a real desktop layout.
 */
export function AppShell() {
  const { setShowAddRecipe, groceryItems } = useData();
  const { user } = useAuth();
  const location = useLocation();

  const outstanding = groceryItems.filter((i) => !i.isCompleted).length;
  const initials =
    user?.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'FF';

  return (
    <div className="min-h-dvh bg-background lg:flex">
      {/* ---------------- Desktop sidebar ---------------- */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card lg:flex xl:w-72">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ChefHat className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-none">FlavourFolio</p>
            <p className="mt-1 text-xs text-muted-foreground">Your kitchen, organised</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/groceries' && outstanding > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground tabular-nums">
                  {outstanding}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 p-3">
          <Button className="w-full" onClick={() => setShowAddRecipe(true)}>
            <Plus className="size-4" />
            Add recipe
          </Button>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <Avatar className="size-6">
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">{user?.name ?? 'Settings'}</span>
            <Settings className="size-4" />
          </NavLink>
        </div>
      </aside>

      {/* ---------------- Main column ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />

        <main className="flex-1 pb-24 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <Outlet key={location.pathname} />
          </div>
        </main>

        <MobileTabBar outstanding={outstanding} />
      </div>
    </div>
  );
}

function MobileHeader() {
  const { setShowAddRecipe } = useData();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <NavLink to="/cookbooks" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChefHat className="size-4.5" />
          </div>
          <span className="font-display text-base font-semibold">FlavourFolio</span>
        </NavLink>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowAddRecipe(true)}
            aria-label="Add recipe"
          >
            <Sparkles className="size-4.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" asChild aria-label="Settings">
            <NavLink to="/settings">
              <Settings className="size-4.5" />
            </NavLink>
          </Button>
        </div>
      </div>
    </header>
  );
}

function MobileTabBar({ outstanding }: { outstanding: number }) {
  const { setShowAddRecipe } = useData();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-center gap-1 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <TabLink key={item.to} {...item} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAddRecipe(true)}
            className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
            aria-label="Add recipe"
          >
            <Plus className="size-6" />
          </button>
        </div>

        {NAV_ITEMS.slice(2).map((item) => (
          <TabLink
            key={item.to}
            {...item}
            badge={item.to === '/groceries' ? outstanding : 0}
          />
        ))}
      </div>
    </nav>
  );
}

function TabLink({
  to,
  icon: Icon,
  label,
  badge = 0,
}: {
  to: string;
  icon: typeof BookOpen;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )
      }
    >
      <span className="relative">
        <Icon className="size-5" />
        {badge > 0 && (
          <span className="absolute -right-2 -top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground tabular-nums">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
