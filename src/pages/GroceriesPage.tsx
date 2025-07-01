import React, { useState, useEffect } from 'react';
import { Check, Plus, Share2, RefreshCw, ShoppingCart } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const GroceriesPage = () => {
  const { groceryItems, generateGroceryList, toggleGroceryItem, addGroceryItem } = useData();
  const [newItem, setNewItem] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (groceryItems.length === 0) {
      generateGroceryList();
    }
  }, []);

  const handleAddItem = () => {
    if (newItem.trim()) {
      addGroceryItem({
        name: newItem,
        quantity: newItem,
        category: 'Custom',
        isCompleted: false
      });
      setNewItem('');
      setShowAddForm(false);
    }
  };

  const handleShareList = () => {
    const listText = groceryItems
      .map(item => `${item.isCompleted ? '✓' : '○'} ${item.quantity}`)
      .join('\n');
    
    if (navigator.share) {
      navigator.share({
        title: 'FlavorFolio Grocery List',
        text: listText,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(listText);
      // You could show a toast notification here
    }
  };

  const groupedItems = groceryItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, typeof groceryItems>);

  const categories = Object.keys(groupedItems).sort();
  const completedCount = groceryItems.filter(item => item.isCompleted).length;
  const totalCount = groceryItems.length;

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grocery List</h1>
            <p className="text-gray-600">
              {completedCount} of {totalCount} items completed
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={generateGroceryList}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              title="Regenerate from meal plan"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleShareList}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              title="Share list"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* Add Item Button */}
      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Add Custom Item</p>
          </button>
        ) : (
          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="e.g., 2 lbs ground beef"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddItem}
                  className="flex-1 btn-primary"
                >
                  Add Item
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

      {/* Grocery List */}
      {totalCount === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items in your list</h3>
          <p className="text-gray-600 mb-4">
            Add recipes to your meal plan to automatically generate a grocery list
          </p>
          <button
            onClick={generateGroceryList}
            className="btn-primary"
          >
            Generate from Meal Plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                <span>{category}</span>
              </h3>
              
              <div className="space-y-3">
                {groupedItems[category].map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleGroceryItem(item.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        item.isCompleted
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      {item.isCompleted && <Check className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1">
                      <span className={`${
                        item.isCompleted 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-900'
                      }`}>
                        {item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroceriesPage;