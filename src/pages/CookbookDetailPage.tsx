import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Clock, Users, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const CookbookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { cookbooks, recipes, addRecipeToCookbook } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRecipes, setShowAddRecipes] = useState(false);

  const cookbook = id === 'all' ? null : cookbooks.find(c => c.id === id);
  const cookbookRecipes = id === 'all' 
    ? recipes 
    : recipes.filter(recipe => cookbook?.recipeIds.includes(recipe.id));

  const filteredRecipes = cookbookRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableRecipes = recipes.filter(recipe => 
    !cookbook?.recipeIds.includes(recipe.id)
  );

  const handleAddRecipe = (recipeId: string) => {
    if (cookbook) {
      addRecipeToCookbook(recipeId, cookbook.id);
    }
  };

  const title = cookbook ? cookbook.name : 'All Recipes';
  const description = cookbook ? cookbook.description : 'Your complete recipe collection';

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
        <div className="mt-2 text-sm text-gray-500">
          {cookbookRecipes.length} recipe{cookbookRecipes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Add Recipes Button (only for custom cookbooks) */}
      {cookbook && (
        <div className="mb-6">
          {!showAddRecipes ? (
            <button
              onClick={() => setShowAddRecipes(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Add Recipes to Cookbook</p>
            </button>
          ) : (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Recipes</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableRecipes.map(recipe => (
                  <div key={recipe.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{recipe.title}</h4>
                      <p className="text-sm text-gray-600 truncate">{recipe.description}</p>
                    </div>
                    <button
                      onClick={() => handleAddRecipe(recipe.id)}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      Add
                    </button>
                  </div>
                ))}
                {availableRecipes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">All recipes are already in this cookbook</p>
                )}
              </div>
              <button
                onClick={() => setShowAddRecipes(false)}
                className="w-full btn-outline mt-4"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recipes Grid */}
      <div className="space-y-4">
        {filteredRecipes.map((recipe) => (
          <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
            <div className="recipe-card">
              <div className="flex">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-24 h-24 rounded-l-xl object-cover"
                />
                <div className="flex-1 p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {recipe.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.prepTime + recipe.cookTime}m</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{recipe.servings}</span>
                    </div>
                    <div className="flex space-x-1">
                      {recipe.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No recipes found' : 'No recipes yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Add some recipes to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CookbookDetailPage;