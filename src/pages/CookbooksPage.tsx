import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Search, Clock, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const CookbooksPage = () => {
  const { cookbooks, recipes, addCookbook } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCookbook, setNewCookbook] = useState({ name: '', description: '' });

  const filteredCookbooks = cookbooks.filter(cookbook =>
    cookbook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cookbook.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCookbook = () => {
    if (newCookbook.name.trim()) {
      addCookbook({
        name: newCookbook.name,
        description: newCookbook.description,
        recipeIds: []
      });
      setNewCookbook({ name: '', description: '' });
      setShowAddForm(false);
    }
  };

  const getCookbookStats = (cookbook: any) => {
    const cookbookRecipes = recipes.filter(recipe => 
      cookbook.recipeIds.includes(recipe.id)
    );
    const totalTime = cookbookRecipes.reduce((sum, recipe) => 
      sum + recipe.prepTime + recipe.cookTime, 0
    );
    const avgServings = cookbookRecipes.length > 0 
      ? Math.round(cookbookRecipes.reduce((sum, recipe) => sum + recipe.servings, 0) / cookbookRecipes.length)
      : 0;
    
    return { totalRecipes: cookbookRecipes.length, totalTime, avgServings };
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search cookbooks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* All Recipes Card */}
      <Link to="/cookbooks/all" className="block mb-4">
        <div className="recipe-card">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-3 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">All Recipes</h3>
                <p className="text-gray-600">{recipes.length} recipes in total</p>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Add Cookbook Button */}
      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Create New Cookbook</p>
          </button>
        ) : (
          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cookbook Name
                </label>
                <input
                  type="text"
                  value={newCookbook.name}
                  onChange={(e) => setNewCookbook(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weeknight Dinners"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCookbook.description}
                  onChange={(e) => setNewCookbook(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this cookbook"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddCookbook}
                  className="flex-1 btn-primary"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cookbooks List */}
      <div className="space-y-4">
        {filteredCookbooks.map((cookbook) => {
          const stats = getCookbookStats(cookbook);
          return (
            <Link key={cookbook.id} to={`/cookbooks/${cookbook.id}`}>
              <div className="recipe-card">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {cookbook.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {cookbook.description}
                      </p>
                    </div>
                    <div className="bg-accent-100 p-2 rounded-lg ml-4">
                      <BookOpen className="w-5 h-5 text-accent-600" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{stats.totalRecipes} recipes</span>
                      {stats.totalTime > 0 && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{stats.totalTime}m avg</span>
                        </div>
                      )}
                      {stats.avgServings > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{stats.avgServings} servings</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredCookbooks.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cookbooks found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or create a new cookbook
          </p>
        </div>
      )}
    </div>
  );
};

export default CookbooksPage;