import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Calendar, ShoppingCart, MoreHorizontal, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const BottomNavigation = () => {
  const { setShowAddRecipeModal } = useData();

  const navItems = [
    { path: '/cookbooks', icon: BookOpen, label: 'Cookbooks' },
    { path: '/meal-plan', icon: Calendar, label: 'Meal Plan' },
    { path: '/groceries', icon: ShoppingCart, label: 'Groceries' },
    { path: '/more', icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
              
              {index === 1 && (
                <button
                  onClick={() => setShowAddRecipeModal(true)}
                  className="flex flex-col items-center space-y-1 py-2 px-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-medium">Add</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;