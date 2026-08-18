import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { AddRecipeModal } from '@/components/AddRecipeModal';
import { useTheme } from '@/hooks/use-theme';

import LoginPage from '@/pages/LoginPage';
import CookbooksPage from '@/pages/CookbooksPage';
import CookbookDetailPage from '@/pages/CookbookDetailPage';
import RecipesPage from '@/pages/RecipesPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import MealPlanPage from '@/pages/MealPlanPage';
import GroceriesPage from '@/pages/GroceriesPage';
import SettingsPage from '@/pages/SettingsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Applies the persisted theme. Must sit inside DataProvider. */
function ThemeGate({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeGate>
          <TooltipProvider delayDuration={200}>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <AppShell />
                    </RequireAuth>
                  }
                >
                  <Route index element={<Navigate to="/cookbooks" replace />} />
                  <Route path="cookbooks" element={<CookbooksPage />} />
                  <Route path="cookbooks/:id" element={<CookbookDetailPage />} />
                  <Route path="recipes" element={<RecipesPage />} />
                  <Route path="recipes/:id" element={<RecipeDetailPage />} />
                  <Route path="meal-plan" element={<MealPlanPage />} />
                  <Route path="groceries" element={<GroceriesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/cookbooks" replace />} />
              </Routes>

              <AddRecipeModal />
              <Toaster
                position="bottom-center"
                closeButton
                toastOptions={{
                  classNames: {
                    toast:
                      'bg-card text-card-foreground border-border shadow-lg rounded-xl',
                  },
                }}
              />
            </Router>
          </TooltipProvider>
        </ThemeGate>
      </DataProvider>
    </AuthProvider>
  );
}
