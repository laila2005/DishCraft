const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import models
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for seeding...");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

// Ingredients data
const ingredientsData = [
  // Proteins
  { name: "Chicken Breast", category: "protein" },
  { name: "Salmon Fillet", category: "protein" },
  { name: "Tofu", category: "protein" },
  { name: "Eggs", category: "protein" },
  { name: "Lentils", category: "protein" },
  { name: "Chickpeas", category: "protein" },
  { name: "Ground Beef", category: "protein" },
  { name: "Pork Chops", category: "protein" },
  { name: "Turkey Breast", category: "protein" },
  { name: "Shrimp", category: "protein" },
  // Vegetables
  { name: "Broccoli", category: "vegetable" },
  { name: "Spinach", category: "vegetable" },
  { name: "Carrot", category: "vegetable" },
  { name: "Bell Pepper", category: "vegetable" },
  { name: "Onion", category: "vegetable" },
  { name: "Garlic", category: "vegetable" },
  { name: "Tomato", category: "vegetable" },
  { name: "Potato", category: "vegetable" },
  { name: "Sweet Potato", category: "vegetable" },
  { name: "Zucchini", category: "vegetable" },
  { name: "Mushrooms", category: "vegetable" },
  { name: "Asparagus", category: "vegetable" },
  { name: "Green Beans", category: "vegetable" },
  { name: "Cauliflower", category: "vegetable" },
  // Grains/Carbs
  { name: "Pasta", category: "grain" },
  { name: "Rice", category: "grain" },
  { name: "Quinoa", category: "grain" },
  { name: "Bread", category: "grain" },
  { name: "Couscous", category: "grain" },
  { name: "Barley", category: "grain" },
  // Dairy & Alternatives
  { name: "Parmesan Cheese", category: "dairy" },
  { name: "Cheddar Cheese", category: "dairy" },
  { name: "Milk", category: "dairy" },
  { name: "Yogurt", category: "dairy" },
  { name: "Almond Milk", category: "dairy" },
  { name: "Mozzarella Cheese", category: "dairy" },
  // Spices & Herbs
  { name: "Olive Oil", category: "other" },
  { name: "Salt", category: "spice" },
  { name: "Black Pepper", category: "spice" },
  { name: "Paprika", category: "spice" },
  { name: "Cumin", category: "spice" },
  { name: "Oregano", category: "spice" },
  { name: "Basil", category: "spice" },
  { name: "Thyme", category: "spice" },
  { name: "Rosemary", category: "spice" },
  { name: "Chili Powder", category: "spice" },
  { name: "Garlic Powder", category: "spice" },
  { name: "Onion Powder", category: "spice" },
  // Other
  { name: "Soy Sauce", category: "other" },
  { name: "Lemon", category: "fruit" },
  { name: "Lime", category: "fruit" },
  { name: "Honey", category: "other" },
  { name: "Maple Syrup", category: "other" },
  { name: "Coconut Oil", category: "other" },
  { name: "Balsamic Vinegar", category: "other" }
];

// Recipe components data
const recipeComponentsData = [
  // Proteins
  { name: "Chicken Breast", type: "protein", description: "Lean white meat, versatile and quick-cooking" },
  { name: "Salmon Fillet", type: "protein", description: "Rich in omega-3 fatty acids, flaky texture" },
  { name: "Tofu", type: "protein", description: "Plant-based protein, absorbs flavors well" },
  { name: "Ground Beef", type: "protein", description: "Versatile red meat, great for hearty dishes" },
  { name: "Pork Chops", type: "protein", description: "Tender and juicy when cooked properly" },
  { name: "Turkey Breast", type: "protein", description: "Lean poultry, mild flavor" },
  { name: "Shrimp", type: "protein", description: "Quick-cooking seafood, sweet flavor" },
  { name: "Eggs", type: "protein", description: "Versatile protein source, great for any meal" },
  { name: "Lentils", type: "protein", description: "Plant-based protein, hearty and filling" },
  { name: "Chickpeas", type: "protein", description: "Legume protein, nutty flavor" },

  // Vegetables
  { name: "Broccoli", type: "vegetable", description: "Nutritious green vegetable, slightly bitter" },
  { name: "Bell Peppers", type: "vegetable", description: "Sweet and colorful, great for stir-fries" },
  { name: "Spinach", type: "vegetable", description: "Leafy green, mild flavor, nutrient-dense" },
  { name: "Carrots", type: "vegetable", description: "Sweet root vegetable, adds color and crunch" },
  { name: "Zucchini", type: "vegetable", description: "Mild summer squash, versatile preparation" },
  { name: "Mushrooms", type: "vegetable", description: "Earthy flavor, meaty texture" },
  { name: "Onions", type: "vegetable", description: "Aromatic base for many dishes" },
  { name: "Tomatoes", type: "vegetable", description: "Juicy and acidic, great for sauces" },
  { name: "Asparagus", type: "vegetable", description: "Tender spears with a unique flavor" },
  { name: "Green Beans", type: "vegetable", description: "Crisp texture, mild flavor" },

  // Carbohydrates
  { name: "Rice", type: "carb", description: "Staple grain, absorbs flavors well" },
  { name: "Pasta", type: "carb", description: "Italian staple, many shapes and sizes" },
  { name: "Quinoa", type: "carb", description: "Complete protein grain, nutty flavor" },
  { name: "Potatoes", type: "carb", description: "Versatile starchy vegetable" },
  { name: "Sweet Potatoes", type: "carb", description: "Sweet and nutritious root vegetable" },
  { name: "Bread", type: "carb", description: "Baked staple, great for sandwiches" },
  { name: "Couscous", type: "carb", description: "Quick-cooking grain, light texture" },
  { name: "Noodles", type: "carb", description: "Asian-style pasta, various types" },

  // Sauces and Bases
  { name: "Olive Oil", type: "sauce_base", description: "Healthy fat, Mediterranean flavor" },
  { name: "Soy Sauce", type: "sauce_base", description: "Umami-rich Asian condiment" },
  { name: "Tomato Sauce", type: "sauce_base", description: "Classic Italian base for many dishes" },
  { name: "Coconut Milk", type: "sauce_base", description: "Creamy tropical base for curries" },
  { name: "Lemon Juice", type: "sauce_base", description: "Bright acidic flavor enhancer" },
  { name: "Garlic Sauce", type: "sauce_base", description: "Aromatic and flavorful base" },
  { name: "Teriyaki Sauce", type: "sauce_base", description: "Sweet and savory Japanese glaze" },
  { name: "Pesto", type: "sauce_base", description: "Herb-based Italian sauce" },
  { name: "Balsamic Vinegar", type: "sauce_base", description: "Sweet and tangy Italian vinegar" },
  { name: "Honey Mustard", type: "sauce_base", description: "Sweet and tangy condiment" },

  // Cooking Methods
  { name: "Grilling", type: "cooking_method", description: "High-heat cooking over direct flame" },
  { name: "Sautéing", type: "cooking_method", description: "Quick cooking in a pan with oil" },
  { name: "Baking", type: "cooking_method", description: "Dry heat cooking in an oven" },
  { name: "Steaming", type: "cooking_method", description: "Gentle cooking with steam" },
  { name: "Stir-frying", type: "cooking_method", description: "High-heat cooking with constant stirring" },
  { name: "Roasting", type: "cooking_method", description: "Dry heat cooking for larger items" },
  { name: "Braising", type: "cooking_method", description: "Slow cooking in liquid" },
  { name: "Poaching", type: "cooking_method", description: "Gentle cooking in simmering liquid" }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log("Starting database seeding...");

    // Clear existing data
    console.log("Clearing existing data...");
    await Ingredient.deleteMany({});
    await RecipeComponent.deleteMany({});

    // Insert ingredients
    console.log("Inserting ingredients...");
    const insertedIngredients = await Ingredient.insertMany(ingredientsData);
    console.log(`✅ Inserted ${insertedIngredients.length} ingredients`);

    // Insert recipe components
    console.log("Inserting recipe components...");
    const insertedComponents = await RecipeComponent.insertMany(recipeComponentsData);
    console.log(`✅ Inserted ${insertedComponents.length} recipe components`);

    console.log("🎉 Database seeding completed successfully!");
    
    // Display summary
    console.log("\n📊 Seeding Summary:");
    console.log(`- Ingredients: ${insertedIngredients.length}`);
    console.log(`- Recipe Components: ${insertedComponents.length}`);
    console.log(`  - Proteins: ${insertedComponents.filter(c => c.type === 'protein').length}`);
    console.log(`  - Vegetables: ${insertedComponents.filter(c => c.type === 'vegetable').length}`);
    console.log(`  - Carbs: ${insertedComponents.filter(c => c.type === 'carb').length}`);
    console.log(`  - Sauce Bases: ${insertedComponents.filter(c => c.type === 'sauce_base').length}`);
    console.log(`  - Cooking Methods: ${insertedComponents.filter(c => c.type === 'cooking_method').length}`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedDatabase();
};

// Execute if this file is run directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedDatabase, connectDB };
