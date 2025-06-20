const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");

dotenv.config();

const ingredientsData = [
  { name: "Chicken Breast", category: "protein" },
  { name: "Salmon Fillet", category: "protein" },
  { name: "Tofu", category: "protein" },
  { name: "Eggs", category: "protein" },
  { name: "Broccoli", category: "vegetable" },
  { name: "Spinach", category: "vegetable" },
  { name: "Carrot", category: "vegetable" },
  { name: "Bell Pepper", category: "vegetable" },
  { name: "Onion", category: "vegetable" },
  { name: "Garlic", category: "vegetable" },
  { name: "Tomato", category: "vegetable" }, // Changed from fruit to vegetable for culinary context
  { name: "Potato", category: "vegetable" },
  { name: "Sweet Potato", category: "vegetable" },
  { name: "Pasta", category: "grain" },
  { name: "Rice", category: "grain" },
  { name: "Quinoa", category: "grain" },
  { name: "Olive Oil", category: "other" },
  { name: "Salt", category: "spice" },
  { name: "Black Pepper", category: "spice" },
  { name: "Paprika", category: "spice" },
  { name: "Cumin", category: "spice" },
  { name: "Oregano", category: "spice" },
  { name: "Basil", category: "spice" },
  { name: "Parmesan Cheese", category: "dairy" },
  { name: "Cheddar Cheese", category: "dairy" },
  { name: "Milk", category: "dairy" },
  { name: "Soy Sauce", category: "other" },
  { name: "Lemon", category: "fruit" },
];

const recipeComponentsData = [
  // Proteins
  { name: "Chicken Breast", type: "protein", tags: ["poultry"], description: "Versatile white meat." },
  { name: "Salmon Fillet", type: "protein", tags: ["fish", "omega-3"], description: "Rich and flaky fish." },
  { name: "Tofu", type: "protein", tags: ["vegetarian", "vegan"], description: "Plant-based protein." },
  // Vegetables
  { name: "Broccoli Florets", type: "vegetable", tags: ["green", "healthy"], description: "Nutrient-rich green vegetable." },
  { name: "Spinach Leaves", type: "vegetable", tags: ["leafy-green", "iron"], description: "Tender and versatile greens." },
  // Carbs
  { name: "Cooked Pasta", type: "carb", tags: ["italian"], description: "Base for many Italian dishes." },
  { name: "Steamed Rice", type: "carb", tags: ["asian", "versatile"], description: "Staple grain for many cuisines." },
  // Sauce Bases
  { name: "Tomato Sauce", type: "sauce_base", tags: ["italian", "versatile"], description: "Classic red sauce." },
  { name: "Creamy Alfredo Sauce", type: "sauce_base", tags: ["italian", "rich"], description: "Rich and creamy white sauce." },
  { name: "Soy-Ginger Glaze", type: "sauce_base", tags: ["asian"], description: "Savory and aromatic glaze." },
  // Cooking Methods
  {
    name: "Sauté",
    type: "cooking_method",
    tags: ["quick", "pan-fry"],
    description: "Cooking quickly in a pan with a small amount of fat.",
    compatible_types: ["protein", "vegetable"],
  },
  {
    name: "Bake",
    type: "cooking_method",
    tags: ["oven"],
    description: "Cooking with dry heat in an oven.",
    compatible_types: ["protein", "vegetable", "carb"],
  },
  {
    name: "Stir-fry",
    type: "cooking_method",
    tags: ["asian", "quick", "wok"],
    description: "Quickly frying small pieces of food in a wok or large pan.",
    compatible_types: ["protein", "vegetable", "carb"],
  },
  // Instruction Templates (Simplified for MVP)
  {
    name: "Basic Pan-Sauté Template",
    type: "instruction_template",
    tags: ["sauté"],
    steps: [
      "1. Heat [fat source, e.g., 1 tbsp olive oil] in a large skillet over medium-high heat.",
      "2. Add [protein, e.g., diced chicken] and cook until browned and cooked through, about 5-7 minutes. Remove and set aside.",
      "3. Add [vegetables, e.g., chopped onions and bell peppers] to the skillet and sauté until tender-crisp, about 3-5 minutes.",
      "4. Return [protein] to the skillet. Add [sauce_base, e.g., 1 cup tomato sauce] and [seasonings, e.g., salt, pepper, oregano]. Stir to combine.",
      "5. Simmer for 2-3 minutes until heated through. Serve immediately, optionally with [carb, e.g., cooked pasta].",
    ],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Seeding...");

    // Clear existing data
    await Ingredient.deleteMany({});
    console.log("Ingredients Cleared");
    await RecipeComponent.deleteMany({});
    console.log("Recipe Components Cleared");

    // Insert new data
    await Ingredient.insertMany(ingredientsData);
    console.log("Ingredients Seeded");
    await RecipeComponent.insertMany(recipeComponentsData);
    console.log("Recipe Components Seeded");

    console.log("Database Seeding Complete!");
  } catch (err) {
    console.error("Error seeding database:", err.message);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB Connection Closed.");
  }
};

seedDB();
