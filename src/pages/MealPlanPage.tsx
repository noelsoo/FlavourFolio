import React, { useState } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const MealPlanPage = () => {
  const { recipes, mealPlans, updateMealPlan } = useData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);

  const currentWeek = getCurrentWeekDates();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getMealPlan = (date: string) => {
    return mealPlans.find(plan => plan.date === date);
  };

  const getRecipesForDate = (date: string) => {
    const plan = getMealPlan(date);
    if (!plan) return [];
    return recipes.filter(recipe => plan.recipeIds.includes(recipe.id));
  };

  const handleAddRecipe = (date: string, recipeId: string) => {
    const currentPlan = getMealPlan(date);
    const currentRecipeIds = currentPlan ? currentPlan.recipeIds : [];
    updateMealPlan(date, [...currentRecipeIds, recipeId]);
    setShowRecipeSelector(false);
    setSelectedDate(null);
  };

  const handleRemoveRecipe = (date: string, recipeId: string) => {
    const currentPlan = getMealPlan(date);
    if (currentPlan) {
      const updatedRecipeIds = currentPlan.recipeIds.filter(id => id !== recipeId);
      updateMealPlan(date, updatedRecipeIds);
    }
  };

  const openRecipeSelector = (date: string) => {
    setSelectedDate(date);
    setShowRecipeSelector(true);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Weekly Meal Plan</h1>
        <p className="text-gray-600">Plan your meals for the week</p>
      </div>

      {/* Week View */}
      <div className="space-y-4">
        {currentWeek.map((date, index) => {
          const dayRecipes = getRecipesForDate(date);
          const dayName = dayNames[index];
          const dayDate = new Date(date).getDate();
          const isToday = date === new Date().toISOString().split('T')[0];

          return (
            <div key={date} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isToday ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <div className="text-center">
                      <div className="text-xs font-medium">{dayName}</div>
                      <div className="text-sm font-bold">{dayDate}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{dayName}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => openRecipeSelector(date)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Planned Recipes */}
              <div className="space-y-2">
                {dayRecipes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No meals planned</p>
                  </div>
                ) : (
                  dayRecipes.map((recipe) => (
                    <div key={recipe.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{recipe.title}</h4>
                        <p className="text-sm text-gray-600">{recipe.prepTime + recipe.cookTime}m • {recipe.servings} servings</p>
                      </div>
                      <button
                        onClick={() => handleRemoveRecipe(date, recipe.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Selector Modal */}
      {showRecipeSelector && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[70vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Select Recipe</h3>
                <button
                  onClick={() => setShowRecipeSelector(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
              <div className="space-y-2">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleAddRecipe(selectedDate, recipe.id)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{recipe.title}</h4>
                      <p className="text-sm text-gray-600">{recipe.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get current week dates
const getCurrentWeekDates = (): string[] => {
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

export default MealPlanPage;