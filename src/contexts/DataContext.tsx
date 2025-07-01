import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  cuisine: string;
  tags: string[];
  sourceUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cookbook {
  id: string;
  name: string;
  description: string;
  recipeIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MealPlan {
  id: string;
  date: string;
  recipeIds: string[];
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  isCompleted: boolean;
}

interface DataContextType {
  recipes: Recipe[];
  cookbooks: Cookbook[];
  mealPlans: MealPlan[];
  groceryItems: GroceryItem[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  addCookbook: (cookbook: Omit<Cookbook, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCookbook: (id: string, cookbook: Partial<Cookbook>) => void;
  deleteCookbook: (id: string) => void;
  addRecipeToCookbook: (recipeId: string, cookbookId: string) => void;
  removeRecipeFromCookbook: (recipeId: string, cookbookId: string) => void;
  updateMealPlan: (date: string, recipeIds: string[]) => void;
  generateGroceryList: () => void;
  toggleGroceryItem: (id: string) => void;
  addGroceryItem: (item: Omit<GroceryItem, 'id'>) => void;
  showAddRecipeModal: boolean;
  setShowAddRecipeModal: (show: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

// Mock data
const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Creamy Tuscan Chicken',
    description: 'Rich and creamy chicken with sun-dried tomatoes and spinach',
    image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800',
    ingredients: [
      '4 chicken breasts',
      '1 cup heavy cream',
      '1/2 cup sun-dried tomatoes',
      '2 cups fresh spinach',
      '3 cloves garlic',
      '1 tsp Italian seasoning',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Season chicken breasts with salt, pepper, and Italian seasoning',
      'Heat oil in a large skillet over medium-high heat',
      'Cook chicken until golden brown on both sides, remove and set aside',
      'Add garlic to the same pan and sauté for 1 minute',
      'Add sun-dried tomatoes, then pour in heavy cream',
      'Return chicken to pan and simmer for 5 minutes',
      'Add spinach and cook until wilted',
      'Serve immediately'
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    cuisine: 'Italian',
    tags: ['dinner', 'chicken', 'creamy'],
    sourceUrl: 'https://example.com/recipe1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Honey Garlic Salmon',
    description: 'Sweet and savory glazed salmon with a perfect crispy exterior',
    image: 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=800',
    ingredients: [
      '4 salmon fillets',
      '1/4 cup honey',
      '3 cloves garlic, minced',
      '2 tbsp soy sauce',
      '1 tbsp olive oil',
      '1 tsp ginger, grated',
      'Green onions for garnish'
    ],
    instructions: [
      'Preheat oven to 400°F',
      'Mix honey, garlic, soy sauce, and ginger in a bowl',
      'Place salmon on a baking sheet lined with parchment',
      'Brush salmon with honey mixture',
      'Bake for 12-15 minutes until fish flakes easily',
      'Garnish with green onions and serve'
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    cuisine: 'Asian',
    tags: ['dinner', 'salmon', 'healthy'],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '3',
    title: 'Classic Caesar Salad',
    description: 'Fresh romaine lettuce with homemade Caesar dressing and croutons',
    image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800',
    ingredients: [
      '2 heads romaine lettuce',
      '1/2 cup parmesan cheese, grated',
      '1/4 cup olive oil',
      '2 tbsp lemon juice',
      '2 anchovy fillets',
      '1 clove garlic',
      '1 tsp Dijon mustard',
      'Croutons'
    ],
    instructions: [
      'Wash and chop romaine lettuce',
      'In a bowl, mash anchovies and garlic together',
      'Whisk in lemon juice, olive oil, and Dijon mustard',
      'Toss lettuce with dressing',
      'Top with parmesan cheese and croutons',
      'Serve immediately'
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    cuisine: 'American',
    tags: ['salad', 'lunch', 'vegetarian'],
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  }
];

const mockCookbooks: Cookbook[] = [
  {
    id: '1',
    name: 'Weeknight Dinners',
    description: 'Quick and easy meals for busy weeknights',
    recipeIds: ['1', '2'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '2',
    name: 'Healthy Choices',
    description: 'Nutritious recipes for a balanced lifestyle',
    recipeIds: ['2', '3'],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-17')
  }
];

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [cookbooks, setCookbooks] = useState<Cookbook[]>(mockCookbooks);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);

  const addRecipe = (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setRecipes(prev => [...prev, newRecipe]);
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === id 
        ? { ...recipe, ...updates, updatedAt: new Date() }
        : recipe
    ));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
    // Also remove from cookbooks
    setCookbooks(prev => prev.map(cookbook => ({
      ...cookbook,
      recipeIds: cookbook.recipeIds.filter(recipeId => recipeId !== id)
    })));
  };

  const addCookbook = (cookbook: Omit<Cookbook, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCookbook: Cookbook = {
      ...cookbook,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCookbooks(prev => [...prev, newCookbook]);
  };

  const updateCookbook = (id: string, updates: Partial<Cookbook>) => {
    setCookbooks(prev => prev.map(cookbook => 
      cookbook.id === id 
        ? { ...cookbook, ...updates, updatedAt: new Date() }
        : cookbook
    ));
  };

  const deleteCookbook = (id: string) => {
    setCookbooks(prev => prev.filter(cookbook => cookbook.id !== id));
  };

  const addRecipeToCookbook = (recipeId: string, cookbookId: string) => {
    setCookbooks(prev => prev.map(cookbook => 
      cookbook.id === cookbookId 
        ? { 
            ...cookbook, 
            recipeIds: [...cookbook.recipeIds, recipeId],
            updatedAt: new Date()
          }
        : cookbook
    ));
  };

  const removeRecipeFromCookbook = (recipeId: string, cookbookId: string) => {
    setCookbooks(prev => prev.map(cookbook => 
      cookbook.id === cookbookId 
        ? { 
            ...cookbook, 
            recipeIds: cookbook.recipeIds.filter(id => id !== recipeId),
            updatedAt: new Date()
          }
        : cookbook
    ));
  };

  const updateMealPlan = (date: string, recipeIds: string[]) => {
    setMealPlans(prev => {
      const existing = prev.find(plan => plan.date === date);
      if (existing) {
        return prev.map(plan => 
          plan.date === date 
            ? { ...plan, recipeIds }
            : plan
        );
      } else {
        return [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          date,
          recipeIds
        }];
      }
    });
  };

  const generateGroceryList = () => {
    const currentWeek = getCurrentWeekDates();
    const weekRecipeIds = new Set<string>();
    
    currentWeek.forEach(date => {
      const plan = mealPlans.find(p => p.date === date);
      if (plan) {
        plan.recipeIds.forEach(id => weekRecipeIds.add(id));
      }
    });

    const ingredientMap = new Map<string, { quantity: string, category: string }>();
    
    Array.from(weekRecipeIds).forEach(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        recipe.ingredients.forEach(ingredient => {
          const category = categorizeIngredient(ingredient);
          if (ingredientMap.has(ingredient)) {
            // In a real app, you'd want to properly combine quantities
            const existing = ingredientMap.get(ingredient)!;
            ingredientMap.set(ingredient, {
              ...existing,
              quantity: existing.quantity + ', ' + ingredient
            });
          } else {
            ingredientMap.set(ingredient, {
              quantity: ingredient,
              category
            });
          }
        });
      }
    });

    const newGroceryItems: GroceryItem[] = Array.from(ingredientMap.entries()).map(([name, data]) => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      quantity: data.quantity,
      category: data.category,
      isCompleted: false
    }));

    setGroceryItems(newGroceryItems);
  };

  const toggleGroceryItem = (id: string) => {
    setGroceryItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, isCompleted: !item.isCompleted }
        : item
    ));
  };

  const addGroceryItem = (item: Omit<GroceryItem, 'id'>) => {
    const newItem: GroceryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    };
    setGroceryItems(prev => [...prev, newItem]);
  };

  const value = {
    recipes,
    cookbooks,
    mealPlans,
    groceryItems,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addCookbook,
    updateCookbook,
    deleteCookbook,
    addRecipeToCookbook,
    removeRecipeFromCookbook,
    updateMealPlan,
    generateGroceryList,
    toggleGroceryItem,
    addGroceryItem,
    showAddRecipeModal,
    setShowAddRecipeModal
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Helper functions
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

const categorizeIngredient = (ingredient: string): string => {
  const lowerIngredient = ingredient.toLowerCase();
  
  if (lowerIngredient.includes('chicken') || lowerIngredient.includes('salmon') || lowerIngredient.includes('beef')) {
    return 'Meat & Seafood';
  } else if (lowerIngredient.includes('lettuce') || lowerIngredient.includes('spinach') || lowerIngredient.includes('tomato')) {
    return 'Produce';
  } else if (lowerIngredient.includes('cream') || lowerIngredient.includes('cheese') || lowerIngredient.includes('milk')) {
    return 'Dairy';
  } else if (lowerIngredient.includes('oil') || lowerIngredient.includes('sauce') || lowerIngredient.includes('honey')) {
    return 'Condiments';
  } else {
    return 'Pantry';
  }
};