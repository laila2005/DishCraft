const mongoose = require("mongoose");
const dotenv = require("dotenv");
const axios = require("axios");

// Load environment variables
dotenv.config();

// Import models
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for API population...");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

// Function to categorize ingredients based on name
const categorizeIngredient = (ingredientName) => {
  const name = ingredientName.toLowerCase();
  
  // Protein sources
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
      name.includes('fish') || name.includes('salmon') || name.includes('turkey') ||
      name.includes('tofu') || name.includes('egg') || name.includes('shrimp') ||
      name.includes('lamb') || name.includes('duck') || name.includes('tuna') ||
      name.includes('cod') || name.includes('beans') || name.includes('lentils') ||
      name.includes('chickpeas') || name.includes('tempeh') || name.includes('bacon') ||
      name.includes('ham') || name.includes('sausage') || name.includes('crab') ||
      name.includes('lobster') || name.includes('scallops')) {
    return 'protein';
  }
  
  // Grains and carbohydrates
  if (name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
      name.includes('quinoa') || name.includes('potato') || name.includes('noodles') ||
      name.includes('couscous') || name.includes('barley') || name.includes('oats') ||
      name.includes('flour') || name.includes('tortilla') || name.includes('bagel') ||
      name.includes('cereal') || name.includes('crackers') || name.includes('wheat')) {
    return 'grain';
  }
  
  // Vegetables
  if (name.includes('tomato') || name.includes('onion') || name.includes('pepper') ||
      name.includes('carrot') || name.includes('broccoli') || name.includes('spinach') ||
      name.includes('lettuce') || name.includes('cucumber') || name.includes('celery') ||
      name.includes('mushroom') || name.includes('zucchini') || name.includes('eggplant') ||
      name.includes('cabbage') || name.includes('kale') || name.includes('asparagus') ||
      name.includes('corn') || name.includes('peas') || name.includes('bean') ||
      name.includes('squash') || name.includes('beet') || name.includes('radish') ||
      name.includes('artichoke') || name.includes('leek') || name.includes('fennel') ||
      name.includes('chard') || name.includes('arugula') || name.includes('endive')) {
    return 'vegetable';
  }
  
  // Dairy products
  if (name.includes('cheese') || name.includes('milk') || name.includes('yogurt') ||
      name.includes('butter') || name.includes('cream') || name.includes('sour cream') ||
      name.includes('cottage cheese') || name.includes('ricotta') || name.includes('mozzarella') ||
      name.includes('cheddar') || name.includes('parmesan') || name.includes('feta') ||
      name.includes('goat cheese') || name.includes('brie') || name.includes('camembert')) {
    return 'dairy';
  }
  
  // Fruits
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') ||
      name.includes('lemon') || name.includes('lime') || name.includes('berry') ||
      name.includes('grape') || name.includes('peach') || name.includes('pear') ||
      name.includes('cherry') || name.includes('mango') || name.includes('pineapple') ||
      name.includes('avocado') || name.includes('coconut') || name.includes('strawberry') ||
      name.includes('blueberry') || name.includes('raspberry') || name.includes('blackberry') ||
      name.includes('cranberry') || name.includes('kiwi') || name.includes('papaya') ||
      name.includes('melon') || name.includes('watermelon') || name.includes('cantaloupe')) {
    return 'fruit';
  }
  
  // Spices and herbs
  if (name.includes('salt') || name.includes('pepper') || name.includes('garlic') ||
      name.includes('herb') || name.includes('spice') || name.includes('basil') ||
      name.includes('oregano') || name.includes('thyme') || name.includes('rosemary') ||
      name.includes('cumin') || name.includes('paprika') || name.includes('cinnamon') ||
      name.includes('ginger') || name.includes('turmeric') || name.includes('curry') ||
      name.includes('chili') || name.includes('cayenne') || name.includes('nutmeg') ||
      name.includes('cardamom') || name.includes('cloves') || name.includes('allspice') ||
      name.includes('bay') || name.includes('dill') || name.includes('parsley') ||
      name.includes('cilantro') || name.includes('mint') || name.includes('sage')) {
    return 'spice';
  }
  
  // Default to other
  return 'other';
};

// Function to determine recipe component type based on ingredient category
const getComponentType = (ingredientName, category) => {
  const name = ingredientName.toLowerCase();
  
  if (category === 'protein') return 'protein';
  if (category === 'grain') return 'carb';
  if (category === 'vegetable') return 'vegetable';
  
  // Additional sauce/base detection
  if (name.includes('oil') || name.includes('vinegar') || name.includes('sauce') ||
      name.includes('dressing') || name.includes('marinade') || name.includes('stock') ||
      name.includes('broth') || name.includes('wine') || name.includes('juice') ||
      category === 'spice' || category === 'dairy') {
    return 'sauce_base';
  }
  
  return 'sauce_base'; // Default fallback
};

// Function to fetch ingredients from Spoonacular API
const fetchSpoonacularIngredients = async () => {
  try {
    console.log("Fetching ingredients from Spoonacular API...");
    
    // Fetch random recipes to extract diverse ingredients
    const response = await axios.get('https://api.spoonacular.com/recipes/random', {
      params: {
        number: 100, // Maximum allowed per request
        apiKey: process.env.SPOONACULAR_API_KEY
      }
    });

    const recipes = response.data.recipes;
    const ingredientsSet = new Set();
    const componentsSet = new Set();

    console.log(`Processing ${recipes.length} recipes for ingredients...`);

    recipes.forEach((recipe, index) => {
      if (index % 10 === 0) {
        console.log(`Processing recipe ${index + 1}/${recipes.length}: ${recipe.title}`);
      }
      
      if (recipe.extendedIngredients) {
        recipe.extendedIngredients.forEach(ingredient => {
          const name = ingredient.name || ingredient.originalName;
          if (name && name.length > 0) {
            // Clean up ingredient name
            const cleanName = name.replace(/[^\w\s-]/g, '').trim();
            if (cleanName.length > 2 && cleanName.length < 50) { // Reasonable length
              const category = categorizeIngredient(cleanName);
              const componentType = getComponentType(cleanName, category);
              
              // Add to ingredients set
              ingredientsSet.add(JSON.stringify({
                name: cleanName,
                category: category
              }));
              
              // Add to components set
              componentsSet.add(JSON.stringify({
                name: cleanName,
                type: componentType,
                description: `${cleanName} - sourced from Spoonacular API`
              }));
            }
          }
        });
      }
    });

    return {
      ingredients: Array.from(ingredientsSet).map(item => JSON.parse(item)),
      components: Array.from(componentsSet).map(item => JSON.parse(item))
    };

  } catch (error) {
    console.error("Error fetching from Spoonacular API:", error.message);
    if (error.response) {
      console.error("API Response Status:", error.response.status);
      console.error("API Response Data:", error.response.data);
    }
    throw error;
  }
};

// Function to get additional cooking methods and techniques
const getAdditionalCookingMethods = () => {
  return [
    { name: "Air Frying", type: "cooking_method", description: "Quick cooking with circulated hot air" },
    { name: "Slow Cooking", type: "cooking_method", description: "Long, low-temperature cooking" },
    { name: "Pressure Cooking", type: "cooking_method", description: "Fast cooking under pressure" },
    { name: "Smoking", type: "cooking_method", description: "Cooking with wood smoke for flavor" },
    { name: "Sous Vide", type: "cooking_method", description: "Precise temperature water bath cooking" },
    { name: "Blanching", type: "cooking_method", description: "Brief boiling followed by ice bath" },
    { name: "Marinating", type: "cooking_method", description: "Soaking in seasoned liquid" },
    { name: "Fermenting", type: "cooking_method", description: "Controlled bacterial or yeast breakdown" },
    { name: "Dehydrating", type: "cooking_method", description: "Removing moisture to preserve" },
    { name: "Pickling", type: "cooking_method", description: "Preserving in acidic solution" },
    { name: "Confit", type: "cooking_method", description: "Slow cooking in fat" },
    { name: "Flambéing", type: "cooking_method", description: "Igniting alcohol for flavor" }
  ];
};

// Main population function
const populateFromAPI = async () => {
  try {
    if (!process.env.SPOONACULAR_API_KEY) {
      throw new Error("SPOONACULAR_API_KEY not found in environment variables. Please add it to your .env file.");
    }

    console.log("🚀 Starting API-based database enrichment...");
    console.log("This will add more ingredients and recipe components to your existing database.\n");

    // Fetch data from Spoonacular
    const { ingredients, components } = await fetchSpoonacularIngredients();
    
    // Add additional cooking methods
    const additionalMethods = getAdditionalCookingMethods();
    components.push(...additionalMethods);

    console.log(`\n📊 Fetched from API:`);
    console.log(`- ${ingredients.length} unique ingredients`);
    console.log(`- ${components.length} unique components`);

    // Get existing data to avoid duplicates
    console.log("\n🔍 Checking existing database...");
    const existingIngredients = await Ingredient.find({});
    const existingComponents = await RecipeComponent.find({});
    
    const existingIngredientNames = new Set(existingIngredients.map(ing => ing.name.toLowerCase()));
    const existingComponentNames = new Set(existingComponents.map(comp => comp.name.toLowerCase()));

    console.log(`- Current ingredients in database: ${existingIngredients.length}`);
    console.log(`- Current components in database: ${existingComponents.length}`);

    // Filter out duplicates
    const newIngredients = ingredients.filter(ing => 
      !existingIngredientNames.has(ing.name.toLowerCase())
    );
    
    const newComponents = components.filter(comp => 
      !existingComponentNames.has(comp.name.toLowerCase())
    );

    console.log(`\n✨ New items to add:`);
    console.log(`- ${newIngredients.length} new ingredients`);
    console.log(`- ${newComponents.length} new components`);

    if (newIngredients.length === 0 && newComponents.length === 0) {
      console.log("\n🎉 Your database is already well-populated! No new items to add.");
      return;
    }

    // Insert new data
    let insertedIngredients = [];
    let insertedComponents = [];

    if (newIngredients.length > 0) {
      console.log("\n📥 Inserting new ingredients...");
      insertedIngredients = await Ingredient.insertMany(newIngredients);
      console.log(`✅ Successfully inserted ${insertedIngredients.length} new ingredients`);
    }

    if (newComponents.length > 0) {
      console.log("\n📥 Inserting new components...");
      insertedComponents = await RecipeComponent.insertMany(newComponents);
      console.log(`✅ Successfully inserted ${insertedComponents.length} new components`);
    }

    // Display detailed summary
    console.log("\n🎯 Database Enrichment Summary:");
    console.log("=" * 50);
    console.log(`Total new ingredients added: ${insertedIngredients.length}`);
    console.log(`Total new components added: ${insertedComponents.length}`);
    
    // Ingredient categories breakdown
    if (insertedIngredients.length > 0) {
      const categoryCount = {};
      insertedIngredients.forEach(ing => {
        categoryCount[ing.category] = (categoryCount[ing.category] || 0) + 1;
      });
      
      console.log("\n🥘 New Ingredients by Category:");
      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count}`);
      });
    }

    // Component types breakdown
    if (insertedComponents.length > 0) {
      const typeCount = {};
      insertedComponents.forEach(comp => {
        typeCount[comp.type] = (typeCount[comp.type] || 0) + 1;
      });
      
      console.log("\n🍳 New Components by Type:");
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
    }

    // Final database stats
    const finalIngredientCount = await Ingredient.countDocuments();
    const finalComponentCount = await RecipeComponent.countDocuments();
    
    console.log("\n📈 Final Database Stats:");
    console.log(`- Total ingredients: ${finalIngredientCount}`);
    console.log(`- Total components: ${finalComponentCount}`);

    console.log("\n🎉 Database enrichment completed successfully!");
    console.log("Your DishCraft application now has access to a much richer ingredient database!");

  } catch (error) {
    console.error("\n❌ Error during API population:", error.message);
    if (error.response && error.response.status === 402) {
      console.error("\n💡 It looks like you've exceeded your Spoonacular API quota.");
      console.error("   - Free tier: 150 requests/day");
      console.error("   - Consider upgrading your plan or try again tomorrow");
    }
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
    process.exit(0);
  }
};

// Run the population
const runAPIPopulation = async () => {
  await connectDB();
  await populateFromAPI();
};

// Execute if this file is run directly
if (require.main === module) {
  runAPIPopulation();
}

module.exports = { populateFromAPI, connectDB };
