import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Heart, Clock, Users, Star, ChefHat, Calendar, ShoppingCart, Settings, MoreHorizontal, BookOpen, Filter, Camera, Link as LinkIcon, Type, Edit3, Trash2, Share2, Check, X, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';

// --- Reusable UI Components ---

const AppHeader = ({ title, onBack, rightActions }) => {
    const colors = { primary: '#4A7C59', text: '#3D3D3D' };
    return (
        <div className="bg-white sticky top-0 z-10 border-b border-gray-200 px-4 py-3 flex items-center justify-between h-16">
            <div className="flex items-center">
                {onBack && (
                    <button onClick={onBack} className="mr-3 p-2 -ml-2">
                        <ArrowLeft size={24} style={{ color: colors.primary }} />
                    </button>
                )}
                <h1 className="text-2xl font-bold" style={{ color: colors.text }}>{title}</h1>
            </div>
            <div className="flex items-center space-x-2">
                {rightActions}
            </div>
        </div>
    );
};

const BottomNav = ({ currentView, setCurrentView, onAddClick }) => {
    const colors = { primary: '#4A7C59' };
    const navItems = [
        { id: 'cookbooks', icon: BookOpen, label: 'Cookbooks' },
        { id: 'meal-plan', icon: Calendar, label: 'Meal Plan' },
        { id: 'grocery', icon: ShoppingCart, label: 'Groceries' },
        { id: 'more', icon: MoreHorizontal, label: 'More' }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-transparent z-30">
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center px-2">
                {navItems.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentView === item.id ? 'text-green-700' : 'text-gray-500'}`}
                        style={{ color: currentView === item.id ? colors.primary : '#6B7280' }}
                    >
                        <item.icon size={24} />
                        <span className="text-xs mt-1">{item.label}</span>
                    </button>
                ))}
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
                <button
                    onClick={onAddClick}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-105 transition-transform"
                    style={{ backgroundColor: colors.primary }}
                >
                    <Plus size={32} />
                </button>
            </div>
        </div>
    );
};

const BottomSheet = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={onClose}>
        <div className="bg-white rounded-t-2xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <button onClick={onClose} className="p-2">
                    <X size={24} className="text-gray-500" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

// --- Mock Data ---
const mockRecipes = [
    { id: 1, title: "Creamy Tomato and Spinach Pasta", image: "https://placehold.co/400x300/E8A87C/3D3D3D?text=Pasta", cuisine: "Italian", prepTime: 10, cookTime: 20, servings: 4, ingredients: [{ name: "Pasta", amount: "500g", category: "Pantry" }, { name: "Spinach", amount: "2 cups", category: "Produce" }], instructions: ["Cook pasta.", "Sauté garlic, add tomatoes and cream.", "Stir in spinach and cooked pasta."], source: "budgetbytes.com" },
    { id: 2, title: "Pork Belly Kimchi Jjim", image: "https://placehold.co/400x300/F4D35E/3D3D3D?text=Kimchi+Jjim", cuisine: "Korean", prepTime: 15, cookTime: 45, servings: 3, ingredients: [], instructions: [], source: "vt.tiktok.com" },
    { id: 3, title: "Vietnamese Chicken Ragu", image: "https://placehold.co/400x300/4A7C59/F9F9F9?text=Ragu", cuisine: "Vietnamese", prepTime: 20, cookTime: 40, servings: 4, ingredients: [], instructions: [], source: "vt.tiktok.com" },
];

const mockCookbooks = [
    { id: 1, name: "Uncategorized", recipeIds: [1, 2, 3] },
    { id: 2, name: "Dinner", recipeIds: [] },
];

// --- Helper Functions ---
const getRecipesForCookbook = (cookbookId, recipes, cookbooks) => {
    const cookbook = cookbooks.find(cb => cb.id === cookbookId);
    if (!cookbook) return [];
    return cookbook.recipeIds.map(recipeId => recipes.find(r => r.id === recipeId)).filter(Boolean);
};


// --- App Views ---

const CookbooksView = ({ recipes, cookbooks, onSelectRecipe, onCreateCookbook, onSelectCookbook }) => {
    const [viewMode, setViewMode] = useState('cookbooks'); // 'cookbooks' or 'recipes'
    const [selectedCookbookId, setSelectedCookbookId] = useState(null);

    const handleCookbookClick = (cookbookId) => {
        setSelectedCookbookId(cookbookId);
        setViewMode('recipes');
        if (onSelectCookbook) { // Ensure onSelectCookbook is called if provided
            onSelectCookbook(cookbookId);
        }
    };

    const recipesToShow = useMemo(() => {
        if (viewMode === 'recipes' && selectedCookbookId) {
            return getRecipesForCookbook(selectedCookbookId, recipes, cookbooks);
        }
        return [];
    }, [viewMode, selectedCookbookId, recipes, cookbooks]);

    if (viewMode === 'recipes' && selectedCookbookId) {
        const selectedCookbook = cookbooks.find(cb => cb.id === selectedCookbookId);
        return (
            <div className="pb-24">
                <AppHeader
                    title={selectedCookbook ? selectedCookbook.name : "Recipes"}
                    onBack={() => {
                        setViewMode('cookbooks');
                        setSelectedCookbookId(null); // Reset selected cookbook
                    }}
                />
                <div className="p-4">
                    {recipesToShow.length === 0 && <p className="text-center text-gray-500">No recipes in this cookbook yet.</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recipesToShow.map(recipe => (
                            <div key={recipe.id} className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer" onClick={() => onSelectRecipe && onSelectRecipe(recipe.id)}>
                                <img src={recipe.image || `https://placehold.co/400x300/cccccc/3D3D3D?text=No+Image`} alt={recipe.title} className="w-full h-40 object-cover" />
                                <div className="p-3">
                                    <h3 className="font-semibold text-lg">{recipe.title}</h3>
                                    <p className="text-sm text-gray-500">{recipe.cuisine}</p>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <Clock size={12} className="mr-1" /> {recipe.prepTime && recipe.cookTime ? recipe.prepTime + recipe.cookTime + ' min' : 'N/A'}
                                        <Users size={12} className="ml-2 mr-1" /> {recipe.servings || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24">
            <AppHeader
                title={
                    <div className="flex items-center cursor-pointer"> {/* Removed onClick here as it's not switching views directly */}
                        Cookbooks <ChevronDown size={20} className="ml-1" />
                    </div>
                }
            />
            <div className="p-4">
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between items-center">
                    <span>Import recipes faster 🚀</span>
                    <a href="#" className="font-semibold underline">1 min tutorial</a>
                </div>
                <div className="relative mb-4">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search recipe titles" className="w-full bg-white pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                </div>
                <div className="flex space-x-2 mb-6">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm">Sort</button>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm">Ingredients</button>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm">Cuisine</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {cookbooks.map(cb => (
                        <div key={cb.id} className="bg-white rounded-lg p-3 shadow-sm aspect-square flex flex-col justify-between cursor-pointer" onClick={() => handleCookbookClick(cb.id)}>
                            <img src={`https://placehold.co/150x100/${cb.id === 1 ? 'E8A87C' : 'F4D35E'}/3D3D3D?text=${encodeURIComponent(cb.name)}`} alt={cb.name} className="w-full h-2/3 object-cover rounded-md bg-gray-100" />
                            <div>
                                <h3 className="font-semibold mt-2">{cb.name}</h3>
                                <p className="text-sm text-gray-500">{cb.recipeIds.length} recipes</p>
                            </div>
                        </div>
                    ))}
                    <div
                        className="bg-white rounded-lg p-3 shadow-sm aspect-square flex flex-col justify-center items-center border-2 border-dashed border-gray-300 cursor-pointer"
                        onClick={onCreateCookbook} // Ensure onCreateCookbook prop is used
                    >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2"> {/* Changed background to white/gray */}
                            <Plus size={24} className="text-[#4A7C59]" /> {/* Adjusted icon color */}
                        </div>
                        <span className="font-semibold text-center text-gray-700">Create new cookbook</span> {/* Adjusted text color */}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MealPlanView = () => {
    // Mock data for days and dates - in a real app, this would be dynamic
    const weekDays = [
        { day: "Mon", date: "23" }, { day: "Tue", date: "24" }, { day: "Wed", date: "25" },
        { day: "Thu", date: "26" }, { day: "Fri", date: "27" }, { day: "Sat", date: "28" },
        { day: "Sun", date: "29" }
    ];
    const mealTypes = ["Breakfast", "Lunch", "Dinner"];
    // Mock planned meals: { 'YYYY-MM-DD': { 'MealType': {title: 'Recipe Title'} } }
    const [plannedMeals, setPlannedMeals] = useState({
        '2025-06-23': { // Assuming current week is June 23-29, 2025 for demo
            'Lunch': { title: "Creamy Tomato Pasta", id: 1 },
        },
        '2025-06-25': {
            'Dinner': { title: "Vietnamese Chicken Ragu", id: 3 },
        }
    });

    // Function to get a displayable date for the current week, e.g., "23 Jun 2025 - 29 Jun 2025"
    // This is a simplified example. A real app would use a date library.
    const getCurrentWeekDisplay = () => {
        // For this mock, we'll hardcode it based on weekDays
        return `${weekDays[0].date} Jun 2025 - ${weekDays[6].date} Jun 2025`;
    };

    // Placeholder for adding/editing a meal
    const handleMealSlotClick = (dateStr, mealType) => {
        // In a real app, this would open a recipe picker or editor
        console.log(`Clicked on ${dateStr}, ${mealType}`);
        // Example: Add a placeholder if empty, or clear if exists
        setPlannedMeals(prev => {
            const dayMeals = prev[dateStr] || {};
            if (dayMeals[mealType]) {
                const { [mealType]: _, ...restDayMeals } = dayMeals; // Remove meal
                return { ...prev, [dateStr]: restDayMeals };
            } else {
                return { // Add a placeholder meal
                    ...prev,
                    [dateStr]: { ...dayMeals, [mealType]: { title: "New Placeholder Meal", id: Date.now() } }
                };
            }
        });
    };


    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            <AppHeader title="My Meal Plan" rightActions={<MoreHorizontal size={24} className="text-gray-600" />} />
            <div className="p-4">
                <div className="flex items-center justify-between my-2 mb-6">
                    <button className="p-2 text-gray-600 hover:text-gray-800"><ArrowLeft size={20} /></button>
                    <h2 className="font-semibold text-gray-700">{getCurrentWeekDisplay()}</h2>
                    <button className="p-2 text-gray-600 hover:text-gray-800"><ArrowRight size={20} /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                    {weekDays.map(({ day, date }) => (
                        <div key={day} className="font-semibold text-gray-600">
                            <div>{day}</div>
                            <div className="text-2xl text-gray-800">{date}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1" style={{ minHeight: '60vh' }}> {/* Ensure columns have some height */}
                    {weekDays.map(({ day, date }, dayIndex) => {
                        // Construct YYYY-MM-DD string for keying into plannedMeals, assuming June 2025 for demo
                        const dateStr = `2025-06-${date.padStart(2, '0')}`;
                        const mealsForDay = plannedMeals[dateStr] || {};

                        return (
                            <div key={day} className="bg-white rounded-lg shadow-sm p-2 space-y-2 flex flex-col">
                                {mealTypes.map(mealType => {
                                    const meal = mealsForDay[mealType];
                                    return (
                                        <div
                                            key={mealType}
                                            onClick={() => handleMealSlotClick(dateStr, mealType)}
                                            className="bg-gray-50 p-2 rounded-md h-24 flex flex-col justify-center items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <h4 className="text-xs font-semibold text-gray-500 mb-1 self-start">{mealType}</h4>
                                            {meal ? (
                                                <p className="text-xs text-center text-green-700 font-semibold">{meal.title}</p>
                                            ) : (
                                                <Plus size={20} className="text-gray-400" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const GroceryListView = () => {
    const initialItems = [
        { id: 1, name: "Chicken Breasts", category: "Meat & Seafood", checked: false, emoji: "🍗" },
        { id: 2, name: "Spinach", category: "Produce", checked: false, emoji: "🥬" },
        { id: 3, name: "Pasta", category: "Pantry", checked: true, emoji: "🍝" },
        { id: 4, name: "Milk", category: "Dairy & Alternatives", checked: false, emoji: "🥛" },
        { id: 5, name: "Eggs", category: "Dairy & Alternatives", checked: false, emoji: "🥚" },
        { id: 6, name: "Tomatoes", category: "Produce", checked: false, emoji: "🍅" },
    ];
    const [list, setList] = useState(initialItems);
    const [showOptions, setShowOptions] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("Produce"); // Default category for new items

    const handleToggleChecked = (itemId) => {
        setList(l => l.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i));
    };

    const handleAddItem = () => {
        if (newItemName.trim() === "") return;
        const newItem = {
            id: Date.now(), // Simple unique ID
            name: newItemName.trim(),
            category: newItemCategory,
            checked: false,
            emoji: "🛒" // Generic emoji for manually added items
        };
        setList(prevList => [...prevList, newItem]);
        setNewItemName(""); // Reset input
    };

    const handleClearAll = () => {
        setList([]);
        setShowOptions(false);
    };

    const handleShare = () => {
        // Placeholder for sharing functionality
        const itemsToShare = list.filter(item => !item.checked).map(item => `${item.name} (${item.category})`).join("\n");
        if (navigator.share) {
            navigator.share({
                title: 'My Grocery List',
                text: `Here's my grocery list:\n${itemsToShare || 'No items yet!'}`,
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
        } else {
            // Fallback for browsers that don't support navigator.share
            alert(`Grocery List:\n${itemsToShare || 'No items yet!'}`);
        }
        setShowOptions(false);
    };

    const groupedItems = useMemo(() => {
        return list.reduce((acc, item) => {
            const category = item.category || "Uncategorized";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {});
    }, [list]);

    // Define a default order for categories or sort them alphabetically
    const categoryOrder = ["Produce", "Meat & Seafood", "Dairy & Alternatives", "Pantry", "Frozen", "Beverages", "Other", "Uncategorized"];
    const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b); // both not in order, sort alphabetically
        if (indexA === -1) return 1; // a not in order, put after b
        if (indexB === -1) return -1; // b not in order, put after a
        return indexA - indexB; // both in order, sort by order
    });


    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            <AppHeader title="My Grocery List" rightActions={
                <>
                    {/* The Plus button in header can be used for quick add, or we can have a dedicated input field */}
                    {/* <button onClick={() => { /* Open a modal or inline form for adding items */ }}><Plus size={24} className="text-gray-600" /></button> */}
                    {/* Share and More buttons remain */}
                    <button onClick={handleShare}><Share2 size={24} className="text-gray-600" /></button>
                    <button onClick={() => setShowOptions(true)}><MoreHorizontal size={24} className="text-gray-600" /></button>
                </>
            } />
            <div className="p-4">
                <div className="flex space-x-2 mb-4">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Add item (e.g., Apples)"
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
                    />
                    {/* Basic category selector for new items */}
                    <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
                    >
                        {categoryOrder.filter(c => c !== "Uncategorized").map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button
                        onClick={handleAddItem}
                        className="p-3 bg-[#4A7C59] text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus size={24}/>
                    </button>
                </div>

                <div className="flex justify-end mb-4">
                    <button className="text-sm bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center text-gray-600">
                        Sort by: Aisle <ChevronDown size={16} className="ml-1" />
                    </button>
                </div>

                {list.length === 0 && <p className="text-center text-gray-500 py-8">Your grocery list is empty. Add items above or plan some meals!</p>}

                <div className="space-y-4">
                    {sortedCategories.map(category => (
                        <div key={category}>
                            <h2 className="font-bold text-xl mb-2 text-gray-700">{category}</h2>
                            <div className="bg-white rounded-lg shadow-sm">
                                {groupedItems[category].map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center justify-between p-3 ${index < groupedItems[category].length - 1 ? 'border-b border-gray-100' : ''}`}
                                    >
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3">{item.emoji || "🛒"}</span>
                                            <span className={`${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleToggleChecked(item.id)}
                                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150 ease-in-out
                                                ${item.checked ? 'bg-[#4A7C59] border-[#4A7C59]' : 'border-gray-300 hover:border-gray-400'}`}
                                        >
                                            {item.checked && <Check size={16} className="text-white" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showOptions && (
                <BottomSheet title="Grocery List Options" onClose={() => setShowOptions(false)}> {/* Added title for clarity */}
                    <div className="space-y-2">
                        <button onClick={handleShare} className="w-full text-left p-3 text-lg text-blue-600 hover:bg-blue-50 rounded-md flex items-center">
                           <Share2 size={20} className="mr-3"/> Share items in list
                        </button>
                        <button onClick={handleClearAll} className="w-full text-left p-3 text-lg text-red-600 hover:bg-red-50 rounded-md flex items-center">
                           <Trash2 size={20} className="mr-3"/> Clear all items in list
                        </button>
                    </div>
                     <button onClick={() => setShowOptions(false)} className="w-full text-center mt-6 p-3 text-lg font-semibold text-blue-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                </BottomSheet>
            )}
        </div>
    );
};

const RecipeEditorView = ({ onBack, onSave }) => {
    const [activeSection, setActiveSection] = useState(null);
    const [recipeData, setRecipeData] = useState({
        title: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        cuisine: '',
        sourceUrl: '',
        tags: '', // Comma-separated string
        nutrition: { calories: '', protein: '', carbs: '', fats: '' },
        selectedCookbookId: mockCookbooks.find(cb => cb.name === "Uncategorized")?.id || mockCookbooks[0]?.id,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("nutrition.")) {
            const field = name.split(".")[1];
            setRecipeData(prev => ({
                ...prev,
                nutrition: { ...prev.nutrition, [field]: value }
            }));
        } else {
            setRecipeData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSectionSave = () => { // Renamed from handleSave to avoid conflict with onSave prop
        // This function is for saving within a section like 'Info' or 'Nutrition'
        console.log("Saving section data:", recipeData);
        setActiveSection(null); // Close active section and return to main editor
    };

    const handleCookbookSelect = (cookbookId) => {
        setRecipeData(prev => ({ ...prev, selectedCookbookId: cookbookId }));
        setActiveSection(null); // Go back to main editor view
    };

    if (activeSection === 'info') {
        return (
            <div className="bg-white min-h-screen">
                <AppHeader title="Info" onBack={() => setActiveSection(null)} rightActions={<button onClick={handleSectionSave} className="font-semibold text-[#4A7C59]">Save</button>} />
                <div className="p-4 space-y-4">
                    <input type="text" name="prepTime" value={recipeData.prepTime} onChange={handleInputChange} placeholder="Prep time (e.g., 15 min)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                    <input type="text" name="cookTime" value={recipeData.cookTime} onChange={handleInputChange} placeholder="Cook time (e.g., 30 min)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                    <input type="number" name="servings" value={recipeData.servings} onChange={handleInputChange} placeholder="Servings (e.g., 4)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                    <input type="text" name="cuisine" value={recipeData.cuisine} onChange={handleInputChange} placeholder="Cuisine (e.g., Italian)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                    <input type="text" name="sourceUrl" value={recipeData.sourceUrl} onChange={handleInputChange} placeholder="Source URL (e.g., https://example.com/recipe)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                    <input type="text" name="tags" value={recipeData.tags} onChange={handleInputChange} placeholder="Tags (e.g., quick, easy, dinner)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                </div>
            </div>
        )
    }

    if (activeSection === 'cookbooks') {
        return (
            <div className="bg-white min-h-screen">
                <AppHeader title="Select Cookbook" onBack={() => setActiveSection(null)} />
                <div className="p-4 space-y-2">
                    {mockCookbooks.map(cb => (
                        <button
                            key={cb.id}
                            onClick={() => handleCookbookSelect(cb.id)}
                            className={`w-full text-left p-3 rounded-md hover:bg-gray-100 ${recipeData.selectedCookbookId === cb.id ? 'bg-green-100 text-green-700 font-semibold' : ''}`}
                        >
                            {cb.name}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    if (activeSection === 'nutrition') {
        return (
            <div className="bg-white min-h-screen">
                <AppHeader title="Nutrition" onBack={() => setActiveSection(null)} rightActions={<button onClick={handleSectionSave} className="font-semibold text-[#4A7C59]">Save</button>} />
                <div className="p-4 space-y-4">
                    <input type="number" name="nutrition.calories" value={recipeData.nutrition.calories} onChange={handleInputChange} placeholder="Calories (e.g., 350)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                    <input type="number" name="nutrition.protein" value={recipeData.nutrition.protein} onChange={handleInputChange} placeholder="Protein (g) (e.g., 20)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                    <input type="number" name="nutrition.carbs" value={recipeData.nutrition.carbs} onChange={handleInputChange} placeholder="Carbs (g) (e.g., 45)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                    <input type="number" name="nutrition.fats" value={recipeData.nutrition.fats} onChange={handleInputChange} placeholder="Fats (g) (e.g., 15)" className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                </div>
            </div>
        )
    }

    const selectedCookbookName = mockCookbooks.find(cb => cb.id === recipeData.selectedCookbookId)?.name || "Select";

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
             <div className="bg-white sticky top-0 z-10 border-b border-gray-200 px-4 py-3 flex items-center justify-between h-16">
                <button className="font-semibold text-lg" onClick={onBack}>Cancel</button>
                <button className="font-bold text-lg text-[#4A7C59]" onClick={() => onSave(recipeData)}>Save</button> {/* Pass recipeData on save */}
            </div>

            <div className="p-4 space-y-4">
                <div className="bg-white rounded-lg p-4 space-y-4">
                    <input type="text" name="title" value={recipeData.title} onChange={handleInputChange} placeholder="Title" className="w-full text-xl font-bold p-2 border-b focus:outline-none focus:border-[#4A7C59]" />
                    <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
                        <Camera size={32} className="text-gray-400" />
                    </div>
                    <button onClick={() => setActiveSection('cookbooks')} className="w-full flex justify-between items-center py-3 border-b">
                        <span>Cookbooks</span>
                        <span className="text-gray-500 flex items-center">{selectedCookbookName} <ArrowRight size={16} className="ml-2" /></span>
                    </button>
                    <button onClick={() => setActiveSection('info')} className="w-full flex justify-between items-center py-3 border-b"><span>Info</span><ArrowRight size={16} /></button>
                    <button onClick={() => setActiveSection('nutrition')} className="w-full flex justify-between items-center py-3"><span>Nutrition</span><ArrowRight size={16} /></button>
                </div>
                <div className="bg-white rounded-lg p-4">
                    <h2 className="font-bold text-xl mb-2">INGREDIENTS</h2>
                    <input type="text" placeholder="Add ingredient" className="w-full bg-gray-100 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                </div>
                <div className="bg-white rounded-lg p-4">
                    <h2 className="font-bold text-xl mb-2">INSTRUCTIONS</h2>
                    <input type="text" placeholder="Add step" className="w-full bg-gray-100 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                </div>
                <div className="bg-white rounded-lg p-4">
                    <h2 className="font-bold text-xl mb-2">NOTES</h2>
                    <input type="text" placeholder="Add your recipe notes" className="w-full bg-gray-100 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]" />
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [currentView, setCurrentView] = useState('cookbooks');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditingRecipe, setIsEditingRecipe] = useState(false);

    // This would be your main router/view controller
    const renderView = () => {
        if (isEditingRecipe) {
            return <RecipeEditorView onBack={() => setIsEditingRecipe(false)} onSave={() => setIsEditingRecipe(false)} />
        }

        switch (currentView) {
            case 'cookbooks':
                return <CookbooksView recipes={mockRecipes} cookbooks={mockCookbooks} />;
            case 'meal-plan':
                return <MealPlanView />;
            case 'grocery':
                return <GroceryListView />;
            case 'more':
                return <div className="pb-24"><AppHeader title="More" /></div>;
            default:
                return <CookbooksView recipes={mockRecipes} cookbooks={mockCookbooks} />;
        }
    };

    const handleAddClick = () => {
        setShowAddModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {renderView()}

            {!isEditingRecipe && <BottomNav currentView={currentView} setCurrentView={setCurrentView} onAddClick={handleAddClick} />}

            {showAddModal && (
                <BottomSheet title="Add a new recipe" onClose={() => setShowAddModal(false)}>
                    <div className="space-y-3">
                        {[
                            { icon: LinkIcon, label: "Import from Web (URL)", desc: "AI scans link for recipe details", action: () => console.log("Import from Web clicked") },
                            { icon: Camera, label: "Scan with Camera", desc: "Use OCR to get recipe from image", action: () => console.log("Scan with Camera clicked") },
                            { icon: Type, label: "Paste Recipe Text", desc: "AI formats pasted text into a recipe", action: () => console.log("Paste Recipe Text clicked") },
                        ].map((option, index) => (
                            <button
                                key={option.label}
                                onClick={() => {
                                    option.action();
                                    // Potentially close modal or navigate, for now just log
                                    // setShowAddModal(false);
                                }}
                                className={`w-full flex items-center p-4 rounded-xl transition-colors ${
                                    index === 0
                                    ? 'bg-green-100 hover:bg-green-200 border-2 border-green-600' // Highlight first option
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${index === 0 ? 'bg-green-600' : 'bg-white'}`}>
                                    <option.icon size={24} className={index === 0 ? 'text-white' : 'text-[#4A7C59]'} />
                                </div>
                                <div className="text-left">
                                    <div className={`font-semibold ${index === 0 ? 'text-green-700' : 'text-gray-800'}`}>{option.label}</div>
                                    <div className={`text-xs ${index === 0 ? 'text-green-600' : 'text-gray-500'}`}>{option.desc}</div>
                                </div>
                            </button>
                        ))}
                        <div className="relative text-center my-4 py-2">
                            <hr className="border-gray-300"/>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500">OR</span>
                        </div>
                        <button
                            onClick={() => {
                                setShowAddModal(false);
                                setIsEditingRecipe(true);
                            }}
                            className="w-full flex items-center justify-center p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <Edit3 size={20} className="mr-3 text-gray-700" />
                            <span className="font-semibold text-gray-800">Write from scratch</span>
                        </button>
                    </div>
                </BottomSheet>
            )}
        </div>
    );
};

export default App;
