import React from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Users, ExternalLink, Heart, Share2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { recipes } = useData();
  
  const recipe = recipes.find(r => r.id === id);

  if (!recipe) {
    return (
      <div className="p-4 max-w-md mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Recipe not found</h2>
        <p className="text-gray-600">The recipe you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Recipe Image */}
      <div className="relative">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 right-4 flex space-x-2">
          <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors">
            <Heart className="w-5 h-5 text-gray-700" />
          </button>
          <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors">
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Recipe Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
          <p className="text-gray-600 mb-4">{recipe.description}</p>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Prep: {recipe.prepTime}m</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Cook: {recipe.cookTime}m</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings} servings</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Source URL */}
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium mt-4"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Original Recipe</span>
            </a>
          )}
        </div>

        {/* Ingredients */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{ingredient}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="space-y-4">
            {recipe.instructions.map((instruction, index) => (
              <div key={index} className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-gray-700 pt-1">{instruction}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {recipe.notes && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-700">{recipe.notes}</p>
            </div>
          </div>
        )}

        {/* Recipe Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Cuisine:</span>
              <p className="font-medium text-gray-900">{recipe.cuisine}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Time:</span>
              <p className="font-medium text-gray-900">{recipe.prepTime + recipe.cookTime} minutes</p>
            </div>
            {recipe.calories && (
              <div>
                <span className="text-gray-600">Estimated Calories:</span>
                <p className="font-medium text-gray-900">{recipe.calories} kcal</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailPage;