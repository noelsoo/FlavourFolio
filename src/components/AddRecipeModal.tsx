import React, { useState, useRef } from 'react';
import { X, Link, Camera, FileText, PlusCircle, Upload } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';

const AddRecipeModal = () => {
  const { showAddRecipeModal, setShowAddRecipeModal, addRecipe } = useData();
  const [activeTab, setActiveTab] = useState<'url' | 'manual' | 'camera' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [estimatedCalories, setEstimatedCalories] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualRecipe, setManualRecipe] = useState({
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    prepTime: 0,
    cookTime: 0,
    servings: 4,
    cuisine: '',
    tags: ''
  });

  const handleImportFromUrl = async () => {
    if (!url.trim()) return;
    
    setIsImporting(true);
    
    try {
      // Simulate AI import with realistic processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract domain for better mock data - handle URLs without protocol
      let processedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        processedUrl = 'https://' + url;
      }
      
      const domain = processedUrl.toLowerCase();
      let mockRecipe;
      
      if (domain.includes('tiktok')) {
        mockRecipe = {
          title: 'Viral TikTok Pasta',
          description: 'The trending pasta recipe that everyone is talking about',
          image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
          ingredients: [
            '1 lb pasta',
            '2 tbsp olive oil',
            '4 cloves garlic, minced',
            '1 can crushed tomatoes',
            '1/2 cup heavy cream',
            'Fresh basil leaves',
            'Parmesan cheese, grated',
            'Salt and pepper to taste'
          ],
          instructions: [
            'Cook pasta according to package directions',
            'Heat olive oil in a large pan over medium heat',
            'Add garlic and sauté until fragrant',
            'Add crushed tomatoes and simmer for 10 minutes',
            'Stir in heavy cream and season with salt and pepper',
            'Add cooked pasta and toss to combine',
            'Garnish with fresh basil and parmesan cheese'
          ],
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          cuisine: 'Italian',
          tags: ['viral', 'pasta', 'easy'],
          sourceUrl: url
        };
      } else if (domain.includes('instagram')) {
        mockRecipe = {
          title: 'Instagram-Worthy Smoothie Bowl',
          description: 'Beautiful and nutritious smoothie bowl perfect for social media',
          image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=800',
          ingredients: [
            '1 frozen banana',
            '1/2 cup frozen berries',
            '1/4 cup almond milk',
            '1 tbsp almond butter',
            'Granola for topping',
            'Fresh berries for topping',
            'Coconut flakes',
            'Chia seeds'
          ],
          instructions: [
            'Blend frozen banana, berries, almond milk, and almond butter until smooth',
            'Pour into a bowl',
            'Top with granola, fresh berries, coconut flakes, and chia seeds',
            'Take a photo for Instagram!',
            'Enjoy immediately'
          ],
          prepTime: 5,
          cookTime: 0,
          servings: 1,
          cuisine: 'Healthy',
          tags: ['smoothie', 'healthy', 'breakfast'],
          sourceUrl: url
        };
      } else if (domain.includes('youtube')) {
        mockRecipe = {
          title: 'YouTube Chef\'s Signature Dish',
          description: 'A restaurant-quality dish you can make at home',
          image: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800',
          ingredients: [
            '2 chicken breasts',
            '2 tbsp olive oil',
            '1 onion, diced',
            '3 cloves garlic, minced',
            '1 cup white wine',
            '1 cup chicken broth',
            '2 tbsp butter',
            'Fresh thyme',
            'Salt and pepper'
          ],
          instructions: [
            'Season chicken breasts with salt and pepper',
            'Heat olive oil in a large skillet over medium-high heat',
            'Cook chicken until golden brown on both sides, remove and set aside',
            'Add onion and garlic to the same pan, cook until softened',
            'Pour in white wine and chicken broth, bring to a simmer',
            'Return chicken to pan and cook until internal temperature reaches 165°F',
            'Finish with butter and fresh thyme'
          ],
          prepTime: 15,
          cookTime: 30,
          servings: 2,
          cuisine: 'French',
          tags: ['chicken', 'wine', 'elegant'],
          sourceUrl: url
        };
      } else {
        mockRecipe = {
          title: 'Imported Recipe',
          description: 'A delicious recipe imported from the web',
          image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
          ingredients: [
            '2 cups flour',
            '1 cup sugar',
            '1/2 cup butter',
            '2 eggs',
            '1 tsp vanilla extract',
            '1 tsp baking powder',
            '1/2 tsp salt'
          ],
          instructions: [
            'Preheat oven to 350°F',
            'Mix dry ingredients in a bowl',
            'Cream butter and sugar in another bowl',
            'Add eggs one at a time, then vanilla',
            'Gradually combine wet and dry ingredients',
            'Pour into greased pan',
            'Bake for 25-30 minutes until golden'
          ],
          prepTime: 15,
          cookTime: 30,
          servings: 8,
          cuisine: 'American',
          tags: ['dessert', 'baking'],
          sourceUrl: url
        };
      }
      
      addRecipe(mockRecipe);
      setUrl('');
      setShowAddRecipeModal(false);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const parseRecipeText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());

    let title = 'Processed Recipe';
    const ingredients: string[] = [];
    const instructions: string[] = [];
    let currentSection: 'ingredients' | 'instructions' | 'unknown' = 'unknown';

    const ingredientKeywords = ['ingredients', 'ingredient list', 'what you need', 'for the recipe'];
    const instructionKeywords = ['instructions', 'directions', 'method', 'how to', 'steps', 'preparation'];

    // Heuristic for a line that might be a section header
    const isSectionHeader = (line: string) => {
      const lowerCaseLine = line.toLowerCase();
      return ingredientKeywords.some(keyword => lowerCaseLine.includes(keyword)) ||
             instructionKeywords.some(keyword => lowerCaseLine.includes(keyword)) ||
             (line.endsWith(':') && line.length < 30);
    };

    // Heuristic for a line that is likely an ingredient
    const isIngredientLine = (line: string) => {
      const lowerCaseLine = line.toLowerCase();
      // More comprehensive list of units, preparations, and common ingredient terms
      const ingredientKeywords = /(\d+\s*|\d+\/\d+\s*|a\s|an\s|one\s|two\s|three\s|four\s|five\s|six\s|seven\s|eight\s|nine\s|ten\s)?\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|pinch|dash|sprinkle|to taste|large|medium|small|clove|can|cans|package|packages|bunch|head|slice|slices|piece|pieces|stalk|stalks|leaf|leaves|sprig|sprigs|container|containers|box|boxes|jar|jars|bottle|bottles|bag|bags|sheet|sheets|strip|strips|cube|cubes|wedge|wedges|pint|pints|quart|quarts|gallon|gallons|drop|drops|handful|handfuls|bundle|bundles|carton|cartons|drizzle|drizzles|dollop|dollops|scoop|scoops|splash|splashes|whole|half|quarter|eighth|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|finely|chopped|diced|minced|sliced|grated|crushed|fresh|dried|ground|powdered|melted|softened|unsalted|salted|cold|warm|hot|boiling|room temperature|cooked|uncooked|raw|peeled|seeded|cored|pitted|halved|quartered|cubed|shredded|drained|rinsed|toasted|roasted|grilled|baked|fried|saut\u00e9ed|steamed|boiled|blanched|pureed|mashed|whipped|beaten|chilled|frozen|thawed|defrosted|canned|freshly|lightly|heavily|packed|loosely|firmly|about|approximately|or more|or less|as needed|optional|divided|for serving|for garnish|plus more|if needed|such as|like|e.g.|water|salt|pepper|sugar|oil|butter|flour|egg|milk|cream|cheese|chicken|beef|pork|fish|vegetable|fruit|herb|spice)/i;
      return ingredientKeywords.test(lowerCaseLine) || lowerCaseLine.includes('garnish') || lowerCaseLine.includes('topping');
    };

    // Heuristic for a line that is likely an instruction
    const isInstructionLine = (line: string) => {
      const lowerCaseLine = line.toLowerCase();
      // Instructions often start with numbers or action verbs
      const instructionVerbs = /^(preheat|mix|add|cook|chop|stir|bake|serve|garnish|combine|whisk|heat|boil|simmer|fry|roast|grill|steam|saut\u00e9|drain|rinse|peel|cut|dice|mince|slice|grate|crush|blend|puree|mash|whip|beat|chill|freeze|thaw|defrost|season|taste|transfer|remove|place|cover|uncover|reduce|increase|set|allow|let|cool|refrigerate|store|prepare|make|form|roll|knead|fold|pour|spread|brush|dip|coat|arrange|decorate|finish|top|enjoy)/i;
      return /^\d+\./.test(line) || instructionVerbs.test(lowerCaseLine) || line.length > 70; // Longer lines are often instructions
    };

    // First pass: Identify title and section headers, and initial categorization
    let titleFound = false;
    let potentialTitle = '';
    let lastLineWasEmpty = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      const originalLine = line; // Keep original for potential title

      if (!line) {
        lastLineWasEmpty = true;
        continue;
      }

      // Remove common leading bullet points, numbers, and hash tags
      line = line.replace(/^[\d\.\-\•\*#]+\s*/, '').trim();

      const lowerCaseLine = line.toLowerCase();

      // Title detection: first non-empty line that's not a section header or obvious ingredient/instruction
      if (!titleFound && !isSectionHeader(line) && !isIngredientLine(line) && !isInstructionLine(line) && line.length < 60) {
        potentialTitle = originalLine; // Store original line before cleaning
        // Don't set titleFound yet, wait for confirmation or next section
      }

      // Section header detection
      if (ingredientKeywords.some(keyword => lowerCaseLine.includes(keyword)) && !lowerCaseLine.includes('instructions')) {
        currentSection = 'ingredients';
        if (potentialTitle && !titleFound) {
          title = potentialTitle;
          titleFound = true;
        }
        continue;
      } else if (instructionKeywords.some(keyword => lowerCaseLine.includes(keyword)) && !lowerCaseLine.includes('ingredients')) {
        currentSection = 'instructions';
        if (potentialTitle && !titleFound) {
          title = potentialTitle;
          titleFound = true;
        }
        continue;
      }

      // If a section is identified, add the line to it
      if (currentSection === 'ingredients') {
        ingredients.push(originalLine); // Push original line to preserve formatting for now
      } else if (currentSection === 'instructions') {
        instructions.push(originalLine); // Push original line to preserve formatting for now
      } else {
        // If no explicit section header, try to categorize based on line content and context
        if (isIngredientLine(line) && !isInstructionLine(line)) {
          ingredients.push(originalLine);
        } else if (isInstructionLine(line) && !isIngredientLine(line)) {
          instructions.push(originalLine);
        } else if (potentialTitle && !titleFound && lastLineWasEmpty) {
          // If there was an empty line, and we have a potential title, confirm it
          title = potentialTitle;
          titleFound = true;
          // Then categorize the current line
          if (isIngredientLine(line)) ingredients.push(originalLine);
          else if (isInstructionLine(line)) instructions.push(originalLine);
          else ingredients.push(originalLine); // Default to ingredient if still ambiguous
        } else {
          // Ambiguous lines before a section header, default to ingredients if nothing else makes sense
          ingredients.push(originalLine);
        }
      }
      lastLineWasEmpty = false;
    }

    // If title wasn't found by a section header, use the potential title
    if (!titleFound && potentialTitle) {
      title = potentialTitle;
    }

    // Second pass: Refine categorization and clean up
    const finalIngredients: string[] = [];
    const finalInstructions: string[] = [];

    // Combine all lines for a unified second pass, preserving original order
    const allLines = lines.map(line => line.trim());

    for (const line of allLines) {
      let cleanedLine = line.replace(/^[\d\.\-\•\*#]+\s*/, '').trim();
      if (!cleanedLine) continue;

      const lowerCaseLine = cleanedLine.toLowerCase();

      // Re-evaluate section headers more strictly
      if (ingredientKeywords.some(keyword => lowerCaseLine.includes(keyword)) && !lowerCaseLine.includes('instructions')) {
        inIngredientsSection = true;
        inInstructionsSection = false;
        continue; // Skip the header line itself
      } else if (instructionKeywords.some(keyword => lowerCaseLine.includes(keyword)) && !lowerCaseLine.includes('ingredients')) {
        inInstructionsSection = true;
        inIngredientsSection = false;
        continue; // Skip the header line itself
      }

      // Categorize based on current section or heuristics
      if (inIngredientsSection) {
        if (isIngredientLine(cleanedLine) || (!isInstructionLine(cleanedLine) && cleanedLine.length < 70)) {
          finalIngredients.push(cleanedLine);
        } else if (isInstructionLine(cleanedLine)) {
          // If an instruction-like line appears in ingredient section, switch to instructions
          inIngredientsSection = false;
          inInstructionsSection = true;
          finalInstructions.push(cleanedLine);
        }
      } else if (inInstructionsSection) {
        if (isInstructionLine(cleanedLine) || (!isIngredientLine(cleanedLine) && cleanedLine.length > 50)) {
          finalInstructions.push(cleanedLine);
        } else if (isIngredientLine(cleanedLine)) {
          // If an ingredient-like line appears in instruction section, switch to ingredients
          inInstructionsSection = false;
          inIngredientsSection = true;
          finalIngredients.push(cleanedLine);
        }
      } else {
        // For lines before any explicit section header, use strong heuristics
        if (isIngredientLine(cleanedLine) && !isInstructionLine(cleanedLine)) {
          finalIngredients.push(cleanedLine);
        } else if (isInstructionLine(cleanedLine) && !isIngredientLine(cleanedLine)) {
          finalInstructions.push(cleanedLine);
        } else if (cleanedLine.length < 50) { // Default to ingredient for shorter ambiguous lines
          finalIngredients.push(cleanedLine);
        } else {
          finalInstructions.push(cleanedLine);
        }
      }
    }

    // Final cleanup: remove any remaining hash tags and empty lines
    const cleanAndFilter = (arr: string[]) => arr.map(item => item.replace(/#/g, '').trim()).filter(item => item.length > 0);

    const finalCleanedIngredients = cleanAndFilter(finalIngredients);
    const finalCleanedInstructions = cleanAndFilter(finalInstructions);

    // If parsing resulted in empty arrays, provide placeholders
    if (finalCleanedIngredients.length === 0) finalCleanedIngredients.push('Please add ingredients');
    if (finalCleanedInstructions.length === 0) finalCleanedInstructions.push('Please add cooking instructions');

    return {
      title,
      ingredients: finalCleanedIngredients,
      instructions: finalCleanedInstructions
    };

  };

  const estimateCalories = async (ingredients: string[], servings: number): Promise<number> => {
    // Simulate AI call for calorie estimation
    // In a real application, this would be an API call to an AI service
    console.log('Estimating calories for:', ingredients);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    // Simple mock estimation: sum of lengths of ingredients * a random factor
    const baseCalories = ingredients.reduce((sum, ingredient) => sum + ingredient.length, 0) * 5;
    const estimated = Math.round(baseCalories / servings + (Math.random() * 100));
    return estimated > 100 ? estimated : 250; // Ensure a reasonable minimum
  };

  const handleProcessText = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessingText(true);
    setEstimatedCalories(null); // Reset calories before new estimation
    
    try {
      // Simulate AI text processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const parsed = parseRecipeText(textInput);
      
      // Estimate calories after parsing
      const servings = 4; // Default servings for text import, can be made dynamic
      const calories = await estimateCalories(parsed.ingredients, servings);
      setEstimatedCalories(calories);

      const processedRecipe = {
        title: parsed.title,
        description: 'Recipe processed from text input',
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        prepTime: 15,
        cookTime: 30,
        servings: servings,
        cuisine: 'Various',
        tags: ['processed', 'text-import'],
        calories: calories // Add calories to the recipe object
      };
      
      addRecipe(processedRecipe);
      setTextInput('');
      setShowAddRecipeModal(false);
    } catch (error) {
      console.error('Text processing failed:', error);
    } finally {
      setIsProcessingText(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setIsProcessingImage(true);
    
    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock OCR result based on file name or random selection
      const ocrRecipes = [
        {
          title: 'Grandma\'s Chocolate Chip Cookies',
          description: 'Classic family recipe extracted from handwritten card',
          ingredients: [
            '2 1/4 cups all-purpose flour',
            '1 tsp baking soda',
            '1 tsp salt',
            '1 cup butter, softened',
            '3/4 cup granulated sugar',
            '3/4 cup brown sugar',
            '2 large eggs',
            '2 tsp vanilla extract',
            '2 cups chocolate chips'
          ],
          instructions: [
            'Preheat oven to 375°F',
            'Mix flour, baking soda, and salt in a bowl',
            'Cream butter and both sugars until fluffy',
            'Beat in eggs and vanilla',
            'Gradually blend in flour mixture',
            'Stir in chocolate chips',
            'Drop rounded tablespoons onto ungreased cookie sheets',
            'Bake 9-11 minutes until golden brown'
          ],
          prepTime: 15,
          cookTime: 11,
          servings: 48,
          cuisine: 'American',
          tags: ['cookies', 'dessert', 'family-recipe']
        },
        {
          title: 'Homemade Chicken Soup',
          description: 'Comforting soup recipe scanned from cookbook',
          ingredients: [
            '1 whole chicken',
            '8 cups water',
            '2 carrots, sliced',
            '2 celery stalks, chopped',
            '1 onion, diced',
            '2 cloves garlic, minced',
            '1 bay leaf',
            '1 tsp dried thyme',
            'Salt and pepper to taste',
            '2 cups egg noodles'
          ],
          instructions: [
            'Place chicken in large pot with water',
            'Bring to boil, then simmer 1 hour',
            'Remove chicken, shred meat when cool',
            'Strain broth and return to pot',
            'Add vegetables and seasonings',
            'Simmer 20 minutes until vegetables are tender',
            'Add shredded chicken and noodles',
            'Cook 8-10 minutes until noodles are done'
          ],
          prepTime: 20,
          cookTime: 90,
          servings: 6,
          cuisine: 'American',
          tags: ['soup', 'comfort-food', 'chicken']
        }
      ];
      
      const randomRecipe = ocrRecipes[Math.floor(Math.random() * ocrRecipes.length)];
      
      addRecipe(randomRecipe);
      setShowAddRecipeModal(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('OCR processing failed:', error);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleManualSubmit = () => {
    if (!manualRecipe.title.trim()) return;
    
    const recipe = {
      title: manualRecipe.title,
      description: manualRecipe.description,
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      ingredients: manualRecipe.ingredients.filter(i => i.trim()),
      instructions: manualRecipe.instructions.filter(i => i.trim()),
      prepTime: manualRecipe.prepTime,
      cookTime: manualRecipe.cookTime,
      servings: manualRecipe.servings,
      cuisine: manualRecipe.cuisine,
      tags: manualRecipe.tags.split(',').map(t => t.trim()).filter(t => t)
    };
    
    addRecipe(recipe);
    
    // Reset form
    setManualRecipe({
      title: '',
      description: '',
      ingredients: [''],
      instructions: [''],
      prepTime: 0,
      cookTime: 0,
      servings: 4,
      cuisine: '',
      tags: ''
    });
    
    setShowAddRecipeModal(false);
  };

  const addIngredient = () => {
    setManualRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setManualRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const addInstruction = () => {
    setManualRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setManualRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const tabs = [
    { id: 'url', label: 'From URL', icon: Link },
    { id: 'manual', label: 'Manual', icon: PlusCircle },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'text', label: 'Text', icon: FileText },
  ];

  return (
    <AnimatePresence>
      {showAddRecipeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-hidden"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Recipe</h2>
                <button
                  onClick={() => setShowAddRecipeModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex space-x-1 mt-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {activeTab === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipe URL
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="tiktok.com/@chef/video/123 or any recipe website"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Supported platforms:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>TikTok recipe videos</li>
                      <li>Instagram posts and reels</li>
                      <li>YouTube cooking videos</li>
                      <li>Pinterest recipe pins</li>
                      <li>Food blogs and recipe websites</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={handleImportFromUrl}
                    disabled={!url.trim() || isImporting}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Importing Recipe...</span>
                      </>
                    ) : (
                      <span>Import Recipe</span>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'manual' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipe Title *
                    </label>
                    <input
                      type="text"
                      value={manualRecipe.title}
                      onChange={(e) => setManualRecipe(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter recipe title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={manualRecipe.description}
                      onChange={(e) => setManualRecipe(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the recipe"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Servings
                      </label>
                      <input
                        type="number"
                        value={manualRecipe.servings}
                        onChange={(e) => setManualRecipe(prev => ({ ...prev, servings: parseInt(e.target.value) || 0 }))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prep (min)
                      </label>
                      <input
                        type="number"
                        value={manualRecipe.prepTime}
                        onChange={(e) => setManualRecipe(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cook (min)
                      </label>
                      <input
                        type="number"
                        value={manualRecipe.cookTime}
                        onChange={(e) => setManualRecipe(prev => ({ ...prev, cookTime: parseInt(e.target.value) || 0 }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingredients
                    </label>
                    {manualRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="mb-2">
                        <input
                          type="text"
                          value={ingredient}
                          onChange={(e) => updateIngredient(index, e.target.value)}
                          placeholder={`Ingredient ${index + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      + Add Ingredient
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions
                    </label>
                    {manualRecipe.instructions.map((instruction, index) => (
                      <div key={index} className="mb-2">
                        <textarea
                          value={instruction}
                          onChange={(e) => updateInstruction(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addInstruction}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      + Add Step
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cuisine
                      </label>
                      <input
                        type="text"
                        value={manualRecipe.cuisine}
                        onChange={(e) => setManualRecipe(prev => ({ ...prev, cuisine: e.target.value }))}
                        placeholder="e.g., Italian, Asian"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={manualRecipe.tags}
                        onChange={(e) => setManualRecipe(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="dinner, healthy, quick"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualRecipe.title.trim()}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Recipe
                  </button>
                </div>
              )}

              {activeTab === 'camera' && (
                <div className="text-center py-8">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  
                  {isProcessingImage ? (
                    <div className="space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                      <h3 className="text-lg font-medium text-gray-900">Processing Image...</h3>
                      <p className="text-gray-600">
                        Using OCR to extract recipe text from your image
                      </p>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Camera OCR</h3>
                      <p className="text-gray-600 mb-4">
                        Take a photo of a recipe card or cookbook page to automatically extract the recipe using OCR technology.
                      </p>
                      <button 
                        onClick={handleCameraClick}
                        className="btn-primary flex items-center space-x-2 mx-auto"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Choose Image</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Recipe Text
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste the recipe text here and our AI will format it for you...

Example format:
Chocolate Chip Cookies

Ingredients:
2 cups flour
1 cup sugar
1/2 cup butter
2 eggs
1 tsp vanilla

Instructions:
1. Mix dry ingredients
2. Cream butter and sugar
3. Add eggs and vanilla
4. Combine all ingredients
5. Bake at 350°F for 12 minutes"
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button 
                    onClick={handleProcessText}
                    disabled={!textInput.trim() || isProcessingText}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isProcessingText ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing Text...</span>
                      </>
                    ) : (
                      <span>Process Text</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddRecipeModal;