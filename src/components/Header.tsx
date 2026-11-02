import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat as Chef, Settings } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    switch (location.pathname) {
      case '/cookbooks':
        return 'My Cookbooks';
      case '/meal-plan':
        return 'Meal Plan';
      case '/groceries':
        return 'Grocery List';
      case '/more':
        return 'More';
      case '/settings':
        return 'Settings';
      default:
        if (location.pathname.startsWith('/cookbooks/')) {
          return 'Cookbook';
        } else if (location.pathname.startsWith('/recipes/')) {
          return 'Recipe';
        }
        return 'Mise';
    }
  };

  const showBackButton = () => {
    return location.pathname !== '/cookbooks' && 
           location.pathname !== '/meal-plan' && 
           location.pathname !== '/groceries' && 
           location.pathname !== '/more';
  };

  const showSettingsButton = () => {
    return location.pathname === '/more';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBackButton() ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <Chef className="w-6 h-6 text-primary-500" />
              <span className="text-lg font-semibold text-primary-500">Mise</span>
            </div>
          )}
        </div>
        
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {getTitle()}
        </h1>
        
        <div className="w-6 flex justify-end">
          {showSettingsButton() && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;