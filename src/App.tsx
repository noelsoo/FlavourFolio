import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import AuthGuard from './components/AuthGuard';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import CookbooksPage from './pages/CookbooksPage';
import CookbookDetailPage from './pages/CookbookDetailPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import MealPlanPage from './pages/MealPlanPage';
import GroceriesPage from './pages/GroceriesPage';
import MorePage from './pages/MorePage';
import SettingsPage from './pages/SettingsPage';
import AddRecipeModal from './components/AddRecipeModal';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <AuthGuard>
                  <MainLayout />
                </AuthGuard>
              }>
                <Route index element={<Navigate to="/cookbooks" replace />} />
                <Route path="cookbooks" element={<CookbooksPage />} />
                <Route path="cookbooks/:id" element={<CookbookDetailPage />} />
                <Route path="recipes/:id" element={<RecipeDetailPage />} />
                <Route path="meal-plan" element={<MealPlanPage />} />
                <Route path="groceries" element={<GroceriesPage />} />
                <Route path="more" element={<MorePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
            <AddRecipeModal />
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;