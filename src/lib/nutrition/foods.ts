/**
 * Reference nutrition table.
 *
 * Values are per 100 g of the *edible portion*, rounded to whole numbers, and
 * drawn from standard USDA FoodData Central reference entries for generic raw
 * or as-purchased foods. They are reference figures, not brand-specific: a
 * particular jar of pasta sauce will differ. The engine surfaces a confidence
 * score alongside every total so this uncertainty is visible rather than
 * hidden behind a falsely precise number.
 *
 *   density   g per ml — needed to convert cups/tbsp/tsp to grams.
 *   itemGrams g per item — needed for "2 eggs", "3 cloves garlic".
 */

export type FoodCategory =
  | 'Produce'
  | 'Meat & Seafood'
  | 'Dairy & Eggs'
  | 'Bakery'
  | 'Pantry'
  | 'Grains & Pasta'
  | 'Spices & Herbs'
  | 'Condiments'
  | 'Nuts & Seeds'
  | 'Frozen'
  | 'Beverages'
  | 'Other';

export interface FoodNutrients {
  /** kcal */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  /** milligrams */
  sodium: number;
}

export interface Food extends FoodNutrients {
  id: string;
  name: string;
  aliases: string[];
  category: FoodCategory;
  density?: number;
  itemGrams?: number;
}

/** Terse constructor so the table below stays readable. */
function f(
  id: string,
  name: string,
  category: FoodCategory,
  n: [number, number, number, number, number, number, number],
  extra: { aliases?: string[]; density?: number; itemGrams?: number } = {}
): Food {
  const [calories, protein, carbs, fat, fiber, sugar, sodium] = n;
  return {
    id,
    name,
    category,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
    aliases: extra.aliases ?? [],
    density: extra.density,
    itemGrams: extra.itemGrams,
  };
}

export const FOODS: Food[] = [
  // ---------------------------------------------------------------- Produce
  f('onion', 'Onion', 'Produce', [40, 1.1, 9.3, 0.1, 1.7, 4.2, 4], { aliases: ['yellow onion', 'white onion', 'brown onion', 'onions', 'diced onion', 'chopped onion'], density: 0.68, itemGrams: 110 }),
  f('red-onion', 'Red onion', 'Produce', [40, 1.1, 9.3, 0.1, 1.7, 4.2, 4], { aliases: ['red onions'], density: 0.68, itemGrams: 110 }),
  f('shallot', 'Shallot', 'Produce', [72, 2.5, 16.8, 0.1, 3.2, 7.9, 12], { aliases: ['shallots'], density: 0.68, itemGrams: 25 }),
  f('spring-onion', 'Spring onion', 'Produce', [32, 1.8, 7.3, 0.2, 2.6, 2.3, 16], { aliases: ['green onion', 'green onions', 'scallion', 'scallions', 'spring onions'], density: 0.4, itemGrams: 15 }),
  f('garlic', 'Garlic', 'Produce', [149, 6.4, 33.1, 0.5, 2.1, 1.0, 17], { aliases: ['garlic clove', 'garlic cloves', 'minced garlic'], density: 0.57, itemGrams: 3 }),
  f('ginger', 'Ginger', 'Produce', [80, 1.8, 17.8, 0.8, 2.0, 1.7, 13], { aliases: ['fresh ginger', 'ginger root'], density: 0.5, itemGrams: 15 }),
  f('tomato', 'Tomato', 'Produce', [18, 0.9, 3.9, 0.2, 1.2, 2.6, 5], { aliases: ['tomatoes', 'fresh tomato', 'roma tomato', 'plum tomato'], density: 0.65, itemGrams: 123 }),
  f('cherry-tomato', 'Cherry tomatoes', 'Produce', [18, 0.9, 3.9, 0.2, 1.2, 2.6, 5], { aliases: ['cherry tomato', 'grape tomatoes'], density: 0.65, itemGrams: 17 }),
  f('canned-tomatoes', 'Canned tomatoes', 'Pantry', [32, 1.6, 7.3, 0.3, 1.9, 4.4, 186], { aliases: ['crushed tomatoes', 'diced tomatoes', 'chopped tomatoes', 'tinned tomatoes', 'canned crushed tomatoes', 'passata'], density: 1.03, itemGrams: 400 }),
  f('tomato-paste', 'Tomato paste', 'Pantry', [82, 4.3, 18.9, 0.5, 4.1, 12.2, 59], { aliases: ['tomato purée', 'tomato puree', 'tomato concentrate'], density: 1.07 }),
  f('sun-dried-tomato', 'Sun-dried tomatoes', 'Pantry', [258, 14.1, 55.8, 3.0, 12.3, 37.6, 2095], { aliases: ['sun dried tomatoes', 'sundried tomatoes'], density: 0.45 }),
  f('potato', 'Potato', 'Produce', [77, 2.0, 17.5, 0.1, 2.2, 0.8, 6], { aliases: ['potatoes', 'russet potato', 'white potato'], density: 0.65, itemGrams: 173 }),
  f('sweet-potato', 'Sweet potato', 'Produce', [86, 1.6, 20.1, 0.1, 3.0, 4.2, 55], { aliases: ['sweet potatoes', 'yam', 'yams'], density: 0.65, itemGrams: 130 }),
  f('carrot', 'Carrot', 'Produce', [41, 0.9, 9.6, 0.2, 2.8, 4.7, 69], { aliases: ['carrots', 'baby carrots'], density: 0.64, itemGrams: 61 }),
  f('celery', 'Celery', 'Produce', [16, 0.7, 3.0, 0.2, 1.6, 1.3, 80], { aliases: ['celery stalk', 'celery stalks'], density: 0.43, itemGrams: 40 }),
  f('bell-pepper', 'Bell pepper', 'Produce', [26, 1.0, 6.0, 0.3, 2.1, 4.2, 4], { aliases: ['red pepper', 'green pepper', 'yellow pepper', 'capsicum', 'bell peppers', 'sweet pepper'], density: 0.62, itemGrams: 119 }),
  f('chilli', 'Chilli pepper', 'Produce', [40, 1.9, 8.8, 0.4, 1.5, 5.3, 9], { aliases: ['chili', 'chilli', 'chile', 'jalapeno', 'jalapeño', 'red chilli', 'green chilli', 'serrano'], density: 0.6, itemGrams: 14 }),
  f('spinach', 'Spinach', 'Produce', [23, 2.9, 3.6, 0.4, 2.2, 0.4, 79], { aliases: ['baby spinach', 'fresh spinach'], density: 0.13, itemGrams: 30 }),
  f('kale', 'Kale', 'Produce', [35, 2.9, 4.4, 1.5, 4.1, 0.8, 53], { aliases: ['curly kale'], density: 0.28 }),
  f('lettuce', 'Lettuce', 'Produce', [15, 1.4, 2.9, 0.2, 1.3, 0.8, 28], { aliases: ['romaine', 'romaine lettuce', 'iceberg lettuce', 'cos lettuce', 'salad leaves'], density: 0.24, itemGrams: 300 }),
  f('broccoli', 'Broccoli', 'Produce', [34, 2.8, 6.6, 0.4, 2.6, 1.7, 33], { aliases: ['broccoli florets'], density: 0.36, itemGrams: 148 }),
  f('cauliflower', 'Cauliflower', 'Produce', [25, 1.9, 5.0, 0.3, 2.0, 1.9, 30], { aliases: ['cauliflower florets'], density: 0.4, itemGrams: 588 }),
  f('mushroom', 'Mushrooms', 'Produce', [22, 3.1, 3.3, 0.3, 1.0, 2.0, 5], { aliases: ['mushroom', 'button mushrooms', 'cremini', 'chestnut mushrooms', 'portobello'], density: 0.29, itemGrams: 18 }),
  f('zucchini', 'Zucchini', 'Produce', [17, 1.2, 3.1, 0.3, 1.0, 2.5, 8], { aliases: ['courgette', 'courgettes', 'zucchinis'], density: 0.5, itemGrams: 196 }),
  f('cucumber', 'Cucumber', 'Produce', [15, 0.7, 3.6, 0.1, 0.5, 1.7, 2], { aliases: ['cucumbers'], density: 0.5, itemGrams: 301 }),
  f('aubergine', 'Aubergine', 'Produce', [25, 1.0, 5.9, 0.2, 3.0, 3.5, 2], { aliases: ['eggplant', 'eggplants', 'aubergines'], density: 0.4, itemGrams: 458 }),
  f('peas', 'Peas', 'Frozen', [81, 5.4, 14.5, 0.4, 5.7, 5.7, 5], { aliases: ['green peas', 'frozen peas', 'garden peas'], density: 0.61 }),
  f('corn', 'Corn', 'Produce', [86, 3.3, 19.0, 1.4, 2.0, 3.2, 15], { aliases: ['sweetcorn', 'corn kernels'], density: 0.66, itemGrams: 90 }),
  f('green-beans', 'Green beans', 'Produce', [31, 1.8, 7.0, 0.2, 2.7, 3.3, 6], { aliases: ['string beans', 'french beans'], density: 0.44 }),
  f('asparagus', 'Asparagus', 'Produce', [20, 2.2, 3.9, 0.1, 2.1, 1.9, 2], { density: 0.53, itemGrams: 16 }),
  f('cabbage', 'Cabbage', 'Produce', [25, 1.3, 5.8, 0.1, 2.5, 3.2, 18], { aliases: ['white cabbage', 'green cabbage'], density: 0.38, itemGrams: 908 }),
  f('avocado', 'Avocado', 'Produce', [160, 2.0, 8.5, 14.7, 6.7, 0.7, 7], { aliases: ['avocados'], density: 0.96, itemGrams: 150 }),
  f('lemon', 'Lemon', 'Produce', [29, 1.1, 9.3, 0.3, 2.8, 2.5, 2], { aliases: ['lemons', 'lemon juice', 'lemon zest'], density: 1.03, itemGrams: 58 }),
  f('lime', 'Lime', 'Produce', [30, 0.7, 10.5, 0.2, 2.8, 1.7, 2], { aliases: ['limes', 'lime juice', 'lime zest'], density: 1.03, itemGrams: 67 }),
  f('orange', 'Orange', 'Produce', [47, 0.9, 11.8, 0.1, 2.4, 9.4, 0], { aliases: ['oranges', 'orange juice'], density: 1.04, itemGrams: 131 }),
  f('apple', 'Apple', 'Produce', [52, 0.3, 13.8, 0.2, 2.4, 10.4, 1], { aliases: ['apples'], density: 0.6, itemGrams: 182 }),
  f('banana', 'Banana', 'Produce', [89, 1.1, 22.8, 0.3, 2.6, 12.2, 1], { aliases: ['bananas'], density: 0.6, itemGrams: 118 }),
  f('strawberry', 'Strawberries', 'Produce', [32, 0.7, 7.7, 0.3, 2.0, 4.9, 1], { aliases: ['strawberry'], density: 0.6, itemGrams: 12 }),
  f('blueberry', 'Blueberries', 'Produce', [57, 0.7, 14.5, 0.3, 2.4, 10.0, 1], { aliases: ['blueberry'], density: 0.62 }),
  f('mixed-berries', 'Mixed berries', 'Frozen', [43, 0.8, 10.2, 0.3, 3.0, 6.5, 2], { aliases: ['frozen berries', 'berries'], density: 0.6 }),

  // -------------------------------------------------------- Meat & seafood
  f('chicken-breast', 'Chicken breast', 'Meat & Seafood', [165, 31.0, 0, 3.6, 0, 0, 74], { aliases: ['chicken breasts', 'boneless skinless chicken breast', 'chicken fillet'], itemGrams: 174, density: 0.7 }),
  f('chicken-thigh', 'Chicken thigh', 'Meat & Seafood', [209, 26.0, 0, 10.9, 0, 0, 88], { aliases: ['chicken thighs'], itemGrams: 111, density: 0.7 }),
  f('chicken', 'Chicken', 'Meat & Seafood', [190, 28.0, 0, 8.1, 0, 0, 82], { aliases: ['whole chicken', 'chicken meat', 'shredded chicken', 'cooked chicken'], itemGrams: 1400, density: 0.7 }),
  f('ground-beef', 'Ground beef', 'Meat & Seafood', [254, 17.2, 0, 20.0, 0, 0, 67], { aliases: ['minced beef', 'beef mince', 'hamburger meat', 'ground chuck'], density: 0.9 }),
  f('beef-steak', 'Beef steak', 'Meat & Seafood', [217, 26.1, 0, 11.8, 0, 0, 55], { aliases: ['steak', 'sirloin', 'beef', 'ribeye', 'beef sirloin'], itemGrams: 225, density: 0.9 }),
  f('pork', 'Pork', 'Meat & Seafood', [242, 27.3, 0, 14.0, 0, 0, 62], { aliases: ['pork chop', 'pork chops', 'pork loin', 'pork shoulder'], itemGrams: 170, density: 0.9 }),
  f('bacon', 'Bacon', 'Meat & Seafood', [541, 37.0, 1.4, 42.0, 0, 0, 1717], { aliases: ['streaky bacon', 'bacon strips', 'pancetta'], itemGrams: 12 }),
  f('sausage', 'Sausage', 'Meat & Seafood', [301, 12.0, 2.5, 27.0, 0, 1.0, 855], { aliases: ['sausages', 'italian sausage', 'chorizo'], itemGrams: 75 }),
  f('ham', 'Ham', 'Meat & Seafood', [145, 20.9, 1.5, 5.5, 0, 1.5, 1203], { aliases: ['prosciutto', 'sliced ham'], itemGrams: 28 }),
  f('turkey', 'Turkey', 'Meat & Seafood', [189, 28.6, 0, 7.4, 0, 0, 68], { aliases: ['turkey breast', 'ground turkey'], density: 0.7 }),
  f('lamb', 'Lamb', 'Meat & Seafood', [282, 25.0, 0, 19.8, 0, 0, 72], { aliases: ['lamb chops', 'leg of lamb', 'ground lamb'], density: 0.9 }),
  f('salmon', 'Salmon', 'Meat & Seafood', [208, 20.4, 0, 13.4, 0, 0, 59], { aliases: ['salmon fillet', 'salmon fillets', 'fresh salmon'], itemGrams: 170, density: 0.9 }),
  f('tuna', 'Tuna', 'Meat & Seafood', [132, 28.0, 0, 1.3, 0, 0, 47], { aliases: ['tuna steak', 'canned tuna'], itemGrams: 142, density: 0.9 }),
  f('white-fish', 'White fish', 'Meat & Seafood', [96, 20.4, 0, 1.2, 0, 0, 78], { aliases: ['cod', 'haddock', 'tilapia', 'fish fillet', 'white fish fillet', 'pollock'], itemGrams: 150, density: 0.9 }),
  f('shrimp', 'Shrimp', 'Meat & Seafood', [99, 20.9, 0.2, 1.7, 0, 0, 111], { aliases: ['prawns', 'prawn', 'shrimps', 'king prawns'], itemGrams: 15, density: 0.8 }),
  f('anchovy', 'Anchovies', 'Pantry', [210, 28.9, 0, 9.7, 0, 0, 3668], { aliases: ['anchovy', 'anchovy fillets'], itemGrams: 4 }),

  // ----------------------------------------------------------- Dairy & eggs
  f('egg', 'Egg', 'Dairy & Eggs', [143, 12.6, 0.7, 9.5, 0, 0.4, 142], { aliases: ['eggs', 'large egg', 'large eggs', 'whole egg'], itemGrams: 50, density: 1.03 }),
  f('egg-white', 'Egg white', 'Dairy & Eggs', [52, 10.9, 0.7, 0.2, 0, 0.7, 166], { aliases: ['egg whites'], itemGrams: 33, density: 1.03 }),
  f('milk', 'Milk', 'Dairy & Eggs', [61, 3.2, 4.8, 3.3, 0, 5.1, 43], { aliases: ['whole milk', 'full fat milk', 'semi-skimmed milk'], density: 1.03 }),
  f('almond-milk', 'Almond milk', 'Dairy & Eggs', [17, 0.6, 0.6, 1.5, 0.3, 0.4, 63], { aliases: ['unsweetened almond milk'], density: 1.02 }),
  f('oat-milk', 'Oat milk', 'Dairy & Eggs', [43, 0.8, 6.7, 1.5, 0.8, 4.1, 42], { density: 1.02 }),
  f('heavy-cream', 'Heavy cream', 'Dairy & Eggs', [340, 2.8, 2.8, 36.1, 0, 2.9, 27], { aliases: ['double cream', 'whipping cream', 'thickened cream', 'cream'], density: 0.994 }),
  f('sour-cream', 'Sour cream', 'Dairy & Eggs', [198, 2.4, 4.6, 19.4, 0, 3.5, 40], { aliases: ['soured cream', 'creme fraiche', 'crème fraîche'], density: 0.96 }),
  f('yogurt', 'Yogurt', 'Dairy & Eggs', [61, 3.5, 4.7, 3.3, 0, 4.7, 46], { aliases: ['plain yogurt', 'natural yoghurt', 'yoghurt'], density: 1.03 }),
  f('greek-yogurt', 'Greek yogurt', 'Dairy & Eggs', [59, 10.2, 3.6, 0.4, 0, 3.2, 36], { aliases: ['greek yoghurt'], density: 1.05 }),
  // 0.959 g/ml is the packed-solid convention (1 cup = 227 g = 2 sticks),
  // not the 0.911 physical density of melted butter. Recipes mean the former.
  f('butter', 'Butter', 'Dairy & Eggs', [717, 0.9, 0.1, 81.1, 0, 0.1, 11], { aliases: ['unsalted butter', 'salted butter'], density: 0.959, itemGrams: 113 }),
  f('cheddar', 'Cheddar cheese', 'Dairy & Eggs', [403, 24.9, 1.3, 33.1, 0, 0.5, 621], { aliases: ['cheddar', 'grated cheddar', 'sharp cheddar'], density: 0.4, itemGrams: 28 }),
  f('parmesan', 'Parmesan', 'Dairy & Eggs', [431, 38.5, 4.1, 29.0, 0, 0.9, 1529], { aliases: ['parmesan cheese', 'parmigiano', 'grated parmesan', 'pecorino'], density: 0.4 }),
  f('mozzarella', 'Mozzarella', 'Dairy & Eggs', [300, 22.2, 2.2, 22.4, 0, 1.0, 627], { aliases: ['mozzarella cheese', 'fresh mozzarella'], density: 0.45, itemGrams: 125 }),
  f('cream-cheese', 'Cream cheese', 'Dairy & Eggs', [342, 5.9, 5.5, 34.2, 0, 3.8, 314], { density: 1.0 }),
  f('feta', 'Feta', 'Dairy & Eggs', [264, 14.2, 4.1, 21.3, 0, 4.1, 917], { aliases: ['feta cheese'], density: 0.45 }),
  f('ricotta', 'Ricotta', 'Dairy & Eggs', [174, 11.3, 3.0, 13.0, 0, 0.3, 84], { aliases: ['ricotta cheese'], density: 1.04 }),

  // ------------------------------------------------------- Grains & starches
  f('flour', 'All-purpose flour', 'Pantry', [364, 10.3, 76.3, 1.0, 2.7, 0.3, 2], { aliases: ['plain flour', 'white flour', 'ap flour', 'all purpose flour'], density: 0.53 }),
  f('bread-flour', 'Bread flour', 'Pantry', [361, 12.0, 72.5, 1.7, 2.4, 0.3, 2], { aliases: ['strong flour', 'strong white flour'], density: 0.53 }),
  f('whole-wheat-flour', 'Whole wheat flour', 'Pantry', [340, 13.2, 72.0, 2.5, 10.7, 0.4, 2], { aliases: ['wholemeal flour', 'whole grain flour'], density: 0.51 }),
  f('rice', 'Rice', 'Grains & Pasta', [365, 7.1, 80.0, 0.7, 1.3, 0.1, 5], { aliases: ['white rice', 'long grain rice', 'basmati rice', 'jasmine rice', 'uncooked rice'], density: 0.78 }),
  f('brown-rice', 'Brown rice', 'Grains & Pasta', [370, 7.9, 77.2, 2.9, 3.5, 0.9, 7], { density: 0.76 }),
  f('pasta', 'Pasta', 'Grains & Pasta', [371, 13.0, 74.7, 1.5, 3.2, 2.7, 6], { aliases: ['spaghetti', 'penne', 'fusilli', 'linguine', 'macaroni', 'dried pasta', 'noodles', 'egg noodles', 'tagliatelle', 'rigatoni'], density: 0.45 }),
  f('bread', 'Bread', 'Bakery', [265, 9.0, 49.0, 3.2, 2.7, 5.0, 491], { aliases: ['white bread', 'sliced bread', 'loaf'], itemGrams: 30 }),
  f('breadcrumbs', 'Breadcrumbs', 'Pantry', [395, 13.4, 71.9, 5.3, 4.5, 6.2, 732], { aliases: ['panko', 'panko breadcrumbs', 'bread crumbs'], density: 0.46 }),
  f('oats', 'Rolled oats', 'Pantry', [389, 16.9, 66.3, 6.9, 10.6, 0, 2], { aliases: ['oatmeal', 'porridge oats', 'old fashioned oats'], density: 0.4 }),
  f('quinoa', 'Quinoa', 'Grains & Pasta', [368, 14.1, 64.2, 6.1, 7.0, 0, 5], { density: 0.72 }),
  f('couscous', 'Couscous', 'Grains & Pasta', [376, 12.8, 77.4, 0.6, 5.0, 0.2, 10], { density: 0.7 }),
  f('tortilla', 'Tortilla', 'Bakery', [306, 8.2, 51.4, 7.0, 3.1, 2.6, 685], { aliases: ['tortillas', 'flour tortilla', 'wrap', 'wraps'], itemGrams: 45 }),
  f('cornstarch', 'Cornstarch', 'Pantry', [381, 0.3, 91.3, 0.1, 0.9, 0, 9], { aliases: ['corn starch', 'cornflour'], density: 0.55 }),

  // -------------------------------------------------------- Legumes & pulses
  f('black-beans', 'Black beans', 'Pantry', [132, 8.9, 23.7, 0.5, 8.7, 0.3, 237], { aliases: ['canned black beans'], density: 0.7, itemGrams: 400 }),
  f('chickpeas', 'Chickpeas', 'Pantry', [164, 8.9, 27.4, 2.6, 7.6, 4.8, 242], { aliases: ['garbanzo beans', 'canned chickpeas'], density: 0.7, itemGrams: 400 }),
  f('kidney-beans', 'Kidney beans', 'Pantry', [127, 8.7, 22.8, 0.5, 6.4, 0.3, 237], { aliases: ['red kidney beans'], density: 0.7, itemGrams: 400 }),
  f('lentils', 'Lentils', 'Pantry', [116, 9.0, 20.1, 0.4, 7.9, 1.8, 2], { aliases: ['red lentils', 'green lentils', 'dried lentils'], density: 0.85 }),
  f('tofu', 'Tofu', 'Other', [76, 8.1, 1.9, 4.8, 0.3, 0.6, 7], { aliases: ['firm tofu', 'silken tofu'], density: 1.05, itemGrams: 396 }),

  // ------------------------------------------------------------- Nuts & seeds
  f('almonds', 'Almonds', 'Nuts & Seeds', [579, 21.2, 21.6, 49.9, 12.5, 4.4, 1], { aliases: ['almond', 'flaked almonds', 'sliced almonds'], density: 0.6 }),
  f('walnuts', 'Walnuts', 'Nuts & Seeds', [654, 15.2, 13.7, 65.2, 6.7, 2.6, 2], { aliases: ['walnut'], density: 0.5 }),
  f('cashews', 'Cashews', 'Nuts & Seeds', [553, 18.2, 30.2, 43.9, 3.3, 5.9, 12], { aliases: ['cashew nuts'], density: 0.58 }),
  f('peanut-butter', 'Peanut butter', 'Pantry', [588, 25.1, 19.6, 50.4, 6.0, 9.2, 429], { density: 1.08 }),
  f('almond-butter', 'Almond butter', 'Pantry', [614, 20.9, 18.8, 55.5, 10.3, 4.4, 7], { density: 1.05 }),
  f('sesame-seeds', 'Sesame seeds', 'Nuts & Seeds', [573, 17.7, 23.4, 49.7, 11.8, 0.3, 11], { density: 0.6 }),
  f('chia-seeds', 'Chia seeds', 'Nuts & Seeds', [486, 16.5, 42.1, 30.7, 34.4, 0, 16], { aliases: ['chia'], density: 0.66 }),
  f('pine-nuts', 'Pine nuts', 'Nuts & Seeds', [673, 13.7, 13.1, 68.4, 3.7, 3.6, 2], { density: 0.55 }),

  // -------------------------------------------------------------- Fats & oils
  f('olive-oil', 'Olive oil', 'Pantry', [884, 0, 0, 100, 0, 0, 2], { aliases: ['extra virgin olive oil', 'evoo'], density: 0.918 }),
  f('vegetable-oil', 'Vegetable oil', 'Pantry', [884, 0, 0, 100, 0, 0, 0], { aliases: ['canola oil', 'sunflower oil', 'rapeseed oil', 'cooking oil', 'oil', 'neutral oil'], density: 0.92 }),
  f('coconut-oil', 'Coconut oil', 'Pantry', [892, 0, 0, 99.1, 0, 0, 0], { density: 0.92 }),
  f('sesame-oil', 'Sesame oil', 'Pantry', [884, 0, 0, 100, 0, 0, 0], { aliases: ['toasted sesame oil'], density: 0.92 }),

  // --------------------------------------------------------- Sugars & baking
  f('sugar', 'Granulated sugar', 'Pantry', [387, 0, 100, 0, 0, 100, 1], { aliases: ['white sugar', 'caster sugar', 'granulated'], density: 0.845 }),
  f('brown-sugar', 'Brown sugar', 'Pantry', [380, 0.1, 98.1, 0, 0, 97.0, 28], { aliases: ['light brown sugar', 'dark brown sugar', 'muscovado'], density: 0.93 }),
  f('powdered-sugar', 'Powdered sugar', 'Pantry', [389, 0, 99.8, 0, 0, 97.8, 2], { aliases: ['icing sugar', 'confectioners sugar'], density: 0.51 }),
  f('honey', 'Honey', 'Pantry', [304, 0.3, 82.4, 0, 0.2, 82.1, 4], { density: 1.42 }),
  f('maple-syrup', 'Maple syrup', 'Pantry', [260, 0, 67.0, 0.1, 0, 60.4, 12], { density: 1.32 }),
  f('cocoa-powder', 'Cocoa powder', 'Pantry', [228, 19.6, 57.9, 13.7, 37.0, 1.8, 21], { aliases: ['unsweetened cocoa powder', 'cacao powder'], density: 0.42 }),
  f('chocolate-chips', 'Chocolate chips', 'Pantry', [479, 4.2, 63.9, 24.2, 5.9, 54.5, 11], { aliases: ['dark chocolate', 'chocolate', 'semisweet chocolate chips'], density: 0.72 }),
  f('vanilla-extract', 'Vanilla extract', 'Pantry', [288, 0.1, 12.7, 0.1, 0, 12.7, 9], { aliases: ['vanilla', 'vanilla essence'], density: 0.88 }),
  f('baking-powder', 'Baking powder', 'Pantry', [53, 0, 27.7, 0, 0.2, 0, 10600], { density: 0.9 }),
  f('baking-soda', 'Baking soda', 'Pantry', [0, 0, 0, 0, 0, 0, 27360], { aliases: ['bicarbonate of soda', 'sodium bicarbonate'], density: 0.9 }),
  f('yeast', 'Yeast', 'Pantry', [325, 40.4, 41.2, 7.6, 26.9, 0, 51], { aliases: ['active dry yeast', 'instant yeast'], density: 0.8 }),

  // ------------------------------------------------------------- Condiments
  f('soy-sauce', 'Soy sauce', 'Condiments', [53, 8.1, 4.9, 0.6, 0.8, 0.4, 5493], { aliases: ['light soy sauce', 'dark soy sauce', 'tamari'], density: 1.11 }),
  f('vinegar', 'Vinegar', 'Condiments', [21, 0, 0.9, 0, 0, 0.4, 5], { aliases: ['white vinegar', 'apple cider vinegar', 'red wine vinegar', 'balsamic vinegar', 'rice vinegar'], density: 1.01 }),
  f('mustard', 'Mustard', 'Condiments', [66, 4.4, 5.8, 3.3, 4.0, 1.1, 1104], { aliases: ['dijon mustard', 'wholegrain mustard', 'yellow mustard'], density: 1.05 }),
  f('ketchup', 'Ketchup', 'Condiments', [101, 1.0, 27.4, 0.1, 0.3, 21.8, 907], { aliases: ['tomato ketchup'], density: 1.14 }),
  f('mayonnaise', 'Mayonnaise', 'Condiments', [680, 1.0, 0.6, 74.9, 0, 0.6, 635], { aliases: ['mayo'], density: 0.91 }),
  f('hot-sauce', 'Hot sauce', 'Condiments', [11, 0.5, 1.8, 0.4, 0.3, 1.1, 2643], { aliases: ['sriracha', 'tabasco', 'chilli sauce'], density: 1.05 }),
  f('worcestershire', 'Worcestershire sauce', 'Condiments', [78, 0, 19.5, 0, 0, 10.0, 980], { density: 1.15 }),
  f('fish-sauce', 'Fish sauce', 'Condiments', [35, 5.1, 3.6, 0, 0, 3.6, 7851], { density: 1.15 }),
  f('stock', 'Stock', 'Pantry', [4, 0.5, 0.4, 0.1, 0, 0.2, 343], { aliases: ['chicken stock', 'chicken broth', 'vegetable stock', 'beef stock', 'broth', 'vegetable broth', 'beef broth'], density: 1.0 }),
  f('coconut-milk', 'Coconut milk', 'Pantry', [230, 2.3, 5.5, 23.8, 2.2, 3.3, 15], { aliases: ['canned coconut milk'], density: 1.0, itemGrams: 400 }),
  f('white-wine', 'White wine', 'Beverages', [82, 0.1, 2.6, 0, 0, 1.0, 5], { aliases: ['dry white wine'], density: 0.99 }),
  f('red-wine', 'Red wine', 'Beverages', [85, 0.1, 2.6, 0, 0, 0.6, 4], { density: 0.99 }),
  f('water', 'Water', 'Other', [0, 0, 0, 0, 0, 0, 0], { aliases: ['cold water', 'warm water', 'boiling water'], density: 1.0 }),

  // ---------------------------------------------------------- Spices & herbs
  f('salt', 'Salt', 'Spices & Herbs', [0, 0, 0, 0, 0, 0, 38758], { aliases: ['sea salt', 'kosher salt', 'table salt', 'fine salt'], density: 1.22 }),
  f('black-pepper', 'Black pepper', 'Spices & Herbs', [251, 10.4, 63.9, 3.3, 25.3, 0.6, 20], { aliases: ['pepper', 'ground black pepper', 'cracked pepper'], density: 0.46 }),
  f('paprika', 'Paprika', 'Spices & Herbs', [282, 14.1, 53.9, 12.9, 34.9, 10.3, 68], { aliases: ['smoked paprika'], density: 0.46 }),
  f('cumin', 'Cumin', 'Spices & Herbs', [375, 17.8, 44.2, 22.3, 10.5, 2.3, 168], { aliases: ['ground cumin', 'cumin seeds'], density: 0.45 }),
  f('cinnamon', 'Cinnamon', 'Spices & Herbs', [247, 4.0, 80.6, 1.2, 53.1, 2.2, 10], { aliases: ['ground cinnamon'], density: 0.45 }),
  f('chilli-powder', 'Chilli powder', 'Spices & Herbs', [282, 13.5, 49.7, 14.3, 34.8, 7.2, 1640], { aliases: ['chili powder', 'cayenne', 'cayenne pepper', 'red pepper flakes', 'chilli flakes'], density: 0.46 }),
  f('curry-powder', 'Curry powder', 'Spices & Herbs', [325, 14.3, 55.8, 14.0, 53.2, 2.8, 52], { aliases: ['garam masala', 'curry paste'], density: 0.46 }),
  f('turmeric', 'Turmeric', 'Spices & Herbs', [312, 9.7, 67.1, 3.3, 22.7, 3.2, 27], { aliases: ['ground turmeric'], density: 0.46 }),
  f('oregano', 'Oregano', 'Spices & Herbs', [265, 9.0, 68.9, 4.3, 42.5, 4.1, 25], { aliases: ['dried oregano'], density: 0.2 }),
  f('basil', 'Basil', 'Spices & Herbs', [23, 3.2, 2.7, 0.6, 1.6, 0.3, 4], { aliases: ['fresh basil', 'basil leaves'], density: 0.09, itemGrams: 0.5 }),
  f('parsley', 'Parsley', 'Spices & Herbs', [36, 3.0, 6.3, 0.8, 3.3, 0.9, 56], { aliases: ['fresh parsley', 'flat leaf parsley'], density: 0.24 }),
  f('coriander', 'Coriander', 'Spices & Herbs', [23, 2.1, 3.7, 0.5, 2.8, 0.9, 46], { aliases: ['cilantro', 'fresh coriander', 'ground coriander'], density: 0.16 }),
  f('thyme', 'Thyme', 'Spices & Herbs', [101, 5.6, 24.5, 1.7, 14.0, 0, 9], { aliases: ['fresh thyme', 'dried thyme'], density: 0.2, itemGrams: 1 }),
  f('rosemary', 'Rosemary', 'Spices & Herbs', [131, 3.3, 20.7, 5.9, 14.1, 0, 26], { aliases: ['fresh rosemary', 'dried rosemary'], density: 0.2, itemGrams: 1.5 }),
  f('bay-leaf', 'Bay leaf', 'Spices & Herbs', [313, 7.6, 75.0, 8.4, 26.3, 0, 23], { aliases: ['bay leaves'], itemGrams: 0.2 }),
  f('italian-seasoning', 'Italian seasoning', 'Spices & Herbs', [265, 9.0, 64.4, 7.0, 42.5, 3.0, 30], { aliases: ['mixed herbs', 'herbs de provence', 'dried mixed herbs'], density: 0.2 }),
  f('nutmeg', 'Nutmeg', 'Spices & Herbs', [525, 5.8, 49.3, 36.3, 20.8, 28.5, 16], { density: 0.46 }),
];

export const FOOD_BY_ID = new Map(FOODS.map((food) => [food.id, food]));
