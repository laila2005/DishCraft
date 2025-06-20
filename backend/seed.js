const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");

dotenv.config();

const ingredientsData = [
  // Proteins
  { name: "Chicken Breast", category: "protein" },
  { name: "Salmon Fillet", category: "protein" },
  { name: "Tofu", category: "protein" },
  { name: "Eggs", category: "protein" },
  { name: "Lentils", category: "protein" },
  { name: "Chickpeas", category: "protein" },
  { name: "Ground Beef", category: "protein" },
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
  // Grains/Carbs
  { name: "Pasta", category: "grain" },
  { name: "Rice", category: "grain" },
  { name: "Quinoa", category: "grain" },
  { name: "Bread", category: "grain" },
  // Dairy & Alternatives
  { name: "Parmesan Cheese", category: "dairy" },
  { name: "Cheddar Cheese", category: "dairy" },
  { name: "Milk", category: "dairy" },
  { name: "Yogurt", category: "dairy" },
  { name: "Almond Milk", category: "dairy" }, // (dairy alternative)
  // Spices & Herbs
  { name: "Olive Oil", category: "other" }, // (Fat/Oil)
  { name: "Salt", category: "spice" },
  { name: "Black Pepper", category: "spice" },
  { name: "Paprika", category: "spice" },
  { name: "Cumin", category: "spice" },
  { name: "Oregano", category: "spice" },
  { name: "Basil", category: "spice" },
  { name: "Thyme", category: "spice" },
  { name: "Rosemary", category: "spice" },
  { name: "Chili Powder", category: "spice" },
  // Other
  { name: "Soy Sauce", category: "other" },
  { name: "Lemon", category: "fruit" },
  { name: "Lime", category: "fruit" },
  { name: "Honey", category: "other" },
  { name: "Maple Syrup", category: "other" },
];

const recipeComponentsData = [
  // --- Proteins ---
  {
    name: "Diced Chicken Breast",
    type: "protein",
    tags: ["poultry", "lean"],
    description: "Versatile white meat, diced for quick cooking.",
    cuisine_tags: ["italian", "mexican", "asian", "american"],
    dietary_tags: [],
    cooking_time_range: { min: 8, max: 12 },
    difficulty: "easy",
  },
  {
    name: "Pan-Seared Salmon Fillet",
    type: "protein",
    tags: ["fish", "omega-3", "healthy"],
    description: "Rich and flaky fish, perfect for pan-searing.",
    cuisine_tags: ["american", "mediterranean"],
    dietary_tags: [],
    cooking_time_range: { min: 10, max: 15 },
    difficulty: "medium",
  },
  {
    name: "Firm Tofu Cubes",
    type: "protein",
    tags: ["plant-based"],
    description: "Excellent plant-based protein, cubed for stir-fries or baking.",
    cuisine_tags: ["asian", "american"],
    dietary_tags: ["vegetarian", "vegan"],
    cooking_time_range: { min: 15, max: 25 },
    difficulty: "easy",
  },
  {
    name: "Cooked Lentils",
    type: "protein",
    tags: ["plant-based", "fiber"],
    description: "Hearty and nutritious legumes.",
    cuisine_tags: ["indian", "mediterranean"],
    dietary_tags: ["vegetarian", "vegan", "gluten-free"],
    cooking_time_range: { min: 20, max: 30 }, // Assuming from dry
    difficulty: "easy",
  },

  // --- Vegetables ---
  {
    name: "Steamed Broccoli Florets",
    type: "vegetable",
    tags: ["green", "healthy", "quick"],
    description: "Nutrient-rich green vegetable, lightly steamed.",
    cuisine_tags: ["american", "asian"],
    dietary_tags: ["vegetarian", "vegan", "gluten-free"],
    cooking_time_range: { min: 5, max: 7 },
    difficulty: "easy",
  },
  {
    name: "Sautéed Spinach with Garlic",
    type: "vegetable",
    tags: ["leafy-green", "iron", "quick"],
    description: "Tender spinach sautéed with aromatic garlic.",
    cuisine_tags: ["italian", "american"],
    dietary_tags: ["vegetarian", "vegan", "gluten-free"],
    cooking_time_range: { min: 3, max: 5 },
    difficulty: "easy",
  },
  {
    name: "Roasted Bell Peppers and Onions",
    type: "vegetable",
    tags: ["colorful", "sweet"],
    description: "Sweet and savory roasted vegetables.",
    cuisine_tags: ["mexican", "mediterranean"],
    dietary_tags: ["vegetarian", "vegan", "gluten-free"],
    cooking_time_range: { min: 20, max: 30 },
    difficulty: "easy",
  },

  // --- Carbs ---
  {
    name: "Cooked Spaghetti",
    type: "carb",
    tags: ["pasta"],
    description: "Classic long pasta, cooked al dente.",
    cuisine_tags: ["italian"],
    dietary_tags: [],
    cooking_time_range: { min: 8, max: 12 },
    difficulty: "easy",
  },
  {
    name: "Steamed Basmati Rice",
    type: "carb",
    tags: ["grain", "aromatic"],
    description: "Fluffy and aromatic long-grain rice.",
    cuisine_tags: ["indian", "asian"],
    dietary_tags: ["gluten-free"],
    cooking_time_range: { min: 15, max: 20 },
    difficulty: "easy",
  },
  {
    name: "Baked Sweet Potato Cubes",
    type: "carb",
    tags: ["root-vegetable", "healthy"],
    description: "Naturally sweet and nutritious, baked until tender.",
    cuisine_tags: ["american"],
    dietary_tags: ["vegetarian", "vegan", "gluten-free"],
    cooking_time_range: { min: 25, max: 35 },
    difficulty: "easy",
  },

  // --- Sauce Bases ---
  {
    name: "Classic Marinara Sauce",
    type: "sauce_base",
    tags: ["tomato", "versatile"],
    description: "Simple and flavorful tomato-based sauce.",
    cuisine_tags: ["italian"],
    dietary_tags: ["vegetarian", "vegan", "gluten-free"],
    difficulty: "easy",
  },
  {
    name: "Pesto Sauce",
    type: "sauce_base",
    tags: ["basil", "nuts", "fresh"],
    description: "Aromatic green sauce made with basil, pine nuts, garlic, and Parmesan.",
    cuisine_tags: ["italian"],
    dietary_tags: ["vegetarian"], // Can be vegan if no cheese
    difficulty: "easy",
  },
  {
    name: "Teriyaki Sauce",
    type: "sauce_base",
    tags: ["soy", "sweet", "savory"],
    description: "Sweet and savory Japanese glaze.",
    cuisine_tags: ["asian"],
    dietary_tags: [], // Often contains gluten
    difficulty: "easy",
  },

  // --- Cooking Methods ---
  {
    name: "Sauté/Pan-Fry",
    type: "cooking_method",
    tags: ["quick", "versatile"],
    description: "Cooking food quickly in a pan with a small amount of fat.",
    compatible_types: ["protein", "vegetable"],
    difficulty: "easy",
  },
  {
    name: "Bake/Roast",
    type: "cooking_method",
    tags: ["oven", "even-cooking"],
    description: "Cooking food with dry heat in an oven.",
    compatible_types: ["protein", "vegetable", "carb"],
    difficulty: "easy",
  },
  {
    name: "Stir-fry",
    type: "cooking_method",
    tags: ["high-heat", "quick"],
    description: "Quickly frying small pieces of food in a wok or large pan, stirring constantly.",
    compatible_types: ["protein", "vegetable", "carb"],
    cuisine_tags: ["asian"],
    difficulty: "medium",
  },
  {
    name: "Simmer",
    type: "cooking_method",
    tags: ["gentle-heat", "sauces", "soups"],
    description: "Cooking food gently in liquid just below the boiling point.",
    compatible_types: ["sauce_base", "protein", "vegetable"],
    difficulty: "easy",
  },

  // --- Instruction Templates (More Generic) ---
  {
    name: "One-Pan Protein & Veggie Sauté",
    type: "instruction_template",
    tags: ["sauté", "quick-meal"],
    steps: [
      "1. Prepare your [protein] (e.g., dice, slice) and chop your [vegetables].",
      "2. Heat [fat source, e.g., 1-2 tbsp olive oil] in a large skillet or wok over medium-high heat.",
      "3. Add [protein] to the hot pan. Cook for [X] minutes, stirring occasionally, until browned and cooked through. Remove from pan and set aside.",
      "4. Add [harder vegetables, e.g., onions, carrots, bell peppers] to the pan. Sauté for [Y] minutes until they begin to soften.",
      "5. Add [softer vegetables, e.g., spinach, mushrooms, zucchini] and [aromatics, e.g., minced garlic]. Cook for another [Z] minutes until tender-crisp.",
      "6. Return the cooked [protein] to the pan. Add your [sauce_base or seasonings, e.g., soy sauce, herbs, spices]. Stir everything together to combine and heat through for 1-2 minutes.",
      "7. Serve immediately, optionally over [carb, e.g., rice or quinoa] or with [side, e.g., bread].",
    ],
    difficulty: "easy",
  },
  {
    name: "Simple Oven Bake for Protein/Veggies",
    type: "instruction_template",
    tags: ["bake", "sheet-pan"],
    steps: [
      "1. Preheat your oven to [temperature, e.g., 200°C or 400°F]. Line a baking sheet with parchment paper.",
      "2. Prepare your [protein] and [vegetables] (e.g., cut into uniform pieces).",
      "3. In a large bowl, toss the [protein] and [vegetables] with [fat source, e.g., 1-2 tbsp olive oil], [seasonings, e.g., salt, pepper, paprika, dried herbs]. Ensure everything is evenly coated.",
      "4. Spread the seasoned [protein] and [vegetables] in a single layer on the prepared baking sheet.",
      "5. Bake for [X] minutes, or until the [protein] is cooked through and the [vegetables] are tender and slightly caramelized. You may need to flip or stir them halfway through cooking.",
      "6. Serve hot with your favorite [carb or side dish].",
    ],
    difficulty: "easy",
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Seeding...");

    // Clear existing data
    console.log("Clearing existing Ingredients...");
    await Ingredient.deleteMany({});
    console.log("Ingredients Cleared.");

    console.log("Clearing existing Recipe Components...");
    await RecipeComponent.deleteMany({});
    console.log("Recipe Components Cleared.");

    // Insert new data
    console.log("Seeding Ingredients...");
    await Ingredient.insertMany(ingredientsData);
    console.log("Ingredients Seeded.");

    console.log("Seeding Recipe Components...");
    await RecipeComponent.insertMany(recipeComponentsData);
    console.log("Recipe Components Seeded.");

    console.log("Database Seeding Complete!");
  } catch (err) {
    console.error("Error seeding database:", err.message);
    console.error(err.stack); // Log the full stack trace for more details
  } finally {
    mongoose.connection.close();
    console.log("MongoDB Connection Closed.");
  }
};

seedDB();
