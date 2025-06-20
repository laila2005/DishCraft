const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");
const Meal = require("./models/Meal"); // Import Meal model
const MealPlan = require("./models/MealPlan"); // Import MealPlan model

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

connectDB();

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Helper function to generate cooking instructions
const generateInstructions = (protein, vegetable, carb, sauce, cookingMethod) => {
  const instructions = [];
  
  // Basic instruction templates based on cooking method
  switch (cookingMethod.toLowerCase()) {
    case 'bake/roast':
    case 'bake':
    case 'roast':
      instructions.push(`Preheat your oven to 375°F (190°C).`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt, pepper, and your favorite herbs.`);
      instructions.push(`Place the ${protein.toLowerCase()} on a baking sheet or in a roasting pan.`);
      instructions.push(`Bake for 20-25 minutes or until the ${protein.toLowerCase()} is cooked through.`);
      instructions.push(`Meanwhile, prepare the ${vegetable.toLowerCase()} by steaming or roasting alongside.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} in a small saucepan.`);
      instructions.push(`Serve the ${protein.toLowerCase()} over the ${carb.toLowerCase()}, topped with ${vegetable.toLowerCase()} and ${sauce.toLowerCase()}.`);
      break;
      
    case 'stir-fry':
    case 'sauté':
      instructions.push(`Heat 2 tablespoons of oil in a large skillet or wok over medium-high heat.`);
      instructions.push(`Add the ${protein.toLowerCase()} and cook for 5-7 minutes until browned and cooked through.`);
      instructions.push(`Add the ${vegetable.toLowerCase()} and stir-fry for 3-4 minutes until tender-crisp.`);
      instructions.push(`Meanwhile, cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Add the ${sauce.toLowerCase()} to the pan and stir to combine.`);
      instructions.push(`Cook for another 2-3 minutes until heated through.`);
      instructions.push(`Serve over the prepared ${carb.toLowerCase()}.`);
      break;
      
    case 'grill':
    case 'grilled':
      instructions.push(`Preheat your grill to medium-high heat.`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt, pepper, and your favorite spices.`);
      instructions.push(`Grill the ${protein.toLowerCase()} for 6-8 minutes per side until cooked through.`);
      instructions.push(`Prepare the ${vegetable.toLowerCase()} by grilling or steaming.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} if desired.`);
      instructions.push(`Serve the grilled ${protein.toLowerCase()} with ${carb.toLowerCase()}, ${vegetable.toLowerCase()}, and ${sauce.toLowerCase()}.`);
      break;
      
    case 'steam':
    case 'steamed':
      instructions.push(`Set up a steamer basket over boiling water.`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt and pepper.`);
      instructions.push(`Steam the ${protein.toLowerCase()} for 12-15 minutes until cooked through.`);
      instructions.push(`Add the ${vegetable.toLowerCase()} to the steamer for the last 5-7 minutes.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} in a small saucepan.`);
      instructions.push(`Serve the steamed ${protein.toLowerCase()} and ${vegetable.toLowerCase()} over ${carb.toLowerCase()} with ${sauce.toLowerCase()}.`);
      break;
      
    default:
      instructions.push(`Prepare the ${protein.toLowerCase()} by cooking it using your preferred method until done.`);
      instructions.push(`Cook the ${vegetable.toLowerCase()} until tender.`);
      instructions.push(`Prepare the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Heat the ${sauce.toLowerCase()} if needed.`);
      instructions.push(`Combine all ingredients and serve hot.`);
  }
  
  return instructions;
};

// Helper function to estimate cooking time
const estimateCookingTime = (cookingMethod) => {
  switch (cookingMethod.toLowerCase()) {
    case 'bake/roast':
    case 'bake':
    case 'roast':
      return '25-35 minutes';
    case 'stir-fry':
    case 'sauté':
      return '15-20 minutes';
    case 'grill':
    case 'grilled':
      return '20-25 minutes';
    case 'steam':
    case 'steamed':
      return '20-25 minutes';
    case 'boil':
    case 'simmer':
      return '25-30 minutes';
    default:
      return '20-30 minutes';
  }
};

// Helper function to determine difficulty
const determineDifficulty = (cookingMethod) => {
  switch (cookingMethod.toLowerCase()) {
    case 'steam':
    case 'steamed':
    case 'boil':
      return 'Easy';
    case 'bake/roast':
    case 'bake':
    case 'roast':
      return 'Easy';
    case 'stir-fry':
    case 'sauté':
      return 'Medium';
    case 'grill':
    case 'grilled':
      return 'Medium';
    default:
      return 'Easy';
  }
};

// --- API Endpoints ---

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to DishCraft API!");
});

// GET all ingredients
app.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients = await Ingredient.find().sort({ name: 1 });
    res.json(ingredients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error fetching ingredients");
  }
});

// POST generate recipe
app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { preferences } = req.body;

    // --- Enhanced Recipe Generation Logic (Rule-Based) ---

    // 1. Select a protein (e.g., based on preference or random)
    const proteinOptions = await RecipeComponent.find({ type: "protein" });
    if (proteinOptions.length === 0) {
      return res.status(500).json({ error: "No protein options available in database" });
    }
    const selectedProtein = proteinOptions[Math.floor(Math.random() * proteinOptions.length)];

    // 2. Select a vegetable
    const vegetableOptions = await RecipeComponent.find({ type: "vegetable" });
    if (vegetableOptions.length === 0) {
      return res.status(500).json({ error: "No vegetable options available in database" });
    }
    const selectedVegetable = vegetableOptions[Math.floor(Math.random() * vegetableOptions.length)];

    // 3. Select a carb
    const carbOptions = await RecipeComponent.find({ type: "carb" });
    if (carbOptions.length === 0) {
      return res.status(500).json({ error: "No carb options available in database" });
    }
    const selectedCarb = carbOptions[Math.floor(Math.random() * carbOptions.length)];

    // 4. Select a sauce/flavor profile
    const sauceOptions = await RecipeComponent.find({ type: "sauce_base" });
    if (sauceOptions.length === 0) {
      return res.status(500).json({ error: "No sauce options available in database" });
    }
    const selectedSauce = sauceOptions[Math.floor(Math.random() * sauceOptions.length)];

    // 5. Select a cooking method
    const methodOptions = await RecipeComponent.find({ type: "cooking_method" });
    if (methodOptions.length === 0) {
      return res.status(500).json({ error: "No cooking method options available in database" });
    }
    const selectedMethod = methodOptions[Math.floor(Math.random() * methodOptions.length)];

    // Construct a simple title and description
    const title = `${selectedMethod.name} ${selectedProtein.name} with ${selectedVegetable.name}`;
    const description = `A delicious and nutritious ${selectedMethod.name.toLowerCase()} recipe featuring ${selectedProtein.name.toLowerCase()}, ${selectedVegetable.name.toLowerCase()}, and ${selectedCarb.name.toLowerCase()}, all brought together with ${selectedSauce.name.toLowerCase()}.`;

    // Generate instructions using our helper function
    const instructions = generateInstructions(
      selectedProtein.name,
      selectedVegetable.name,
      selectedCarb.name,
      selectedSauce.name,
      selectedMethod.name
    );

    // Estimate cooking time and difficulty
    const cookingTime = estimateCookingTime(selectedMethod.name);
    const difficulty = determineDifficulty(selectedMethod.name);

    const generatedRecipe = {
      title,
      description,
      components: {
        protein: selectedProtein.name,
        vegetable: selectedVegetable.name,
        carb: selectedCarb.name,
        sauce: selectedSauce.name,
        cookingMethod: selectedMethod.name,
      },
      instructions,
      cookingTime,
      difficulty,
      servings: 4, // Default serving size
      prepTime: "10-15 minutes", // Estimated prep time
    };

    res.json(generatedRecipe);
  } catch (err) {
    console.error("Error generating recipe:", err.message);
    console.error(err.stack);
    res.status(500).send("Server Error generating recipe");
  }
});

// --- Meal Plan API Endpoints ---

// POST create a new meal plan
app.post("/api/meal-plans", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Meal plan name is required." });
    }
    const newMealPlan = new MealPlan({ name });
    await newMealPlan.save();
    res.status(201).json(newMealPlan);
  } catch (err) {
    console.error("Error creating meal plan:", err.message);
    res.status(500).send("Server Error creating meal plan");
  }
});

// GET all meal plans
app.get("/api/meal-plans", async (req, res) => {
  try {
    const mealPlans = await MealPlan.find().populate("meals"); // Populate meals for full details
    res.json(mealPlans);
  } catch (err) {
    console.error("Error fetching meal plans:", err.message);
    res.status(500).send("Server Error fetching meal plans");
  }
});

// POST add a generated recipe to a meal plan
app.post("/api/meal-plans/:planId/add-recipe", async (req, res) => {
  try {
    const { planId } = req.params;
    const { recipeDetails, mealType } = req.body;

    if (!recipeDetails || !recipeDetails.title) {
      return res.status(400).json({ message: "Recipe details are required." });
    }

    const mealPlan = await MealPlan.findById(planId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found." });
    }

    const newMeal = new Meal({
      recipeTitle: recipeDetails.title,
      recipeDetails: recipeDetails, // Store the full recipe object
      mealType: mealType || "dinner", // Default to dinner if not provided
    });
    await newMeal.save();

    mealPlan.meals.push(newMeal._id);
    await mealPlan.save();

    res.status(200).json({ message: "Recipe added to meal plan successfully!", mealPlan });
  } catch (err) {
    console.error("Error adding recipe to meal plan:", err.message);
    res.status(500).send("Server Error adding recipe to meal plan");
  }
});

// DELETE a meal plan
app.delete("/api/meal-plans/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    
    const mealPlan = await MealPlan.findById(planId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found." });
    }

    // Delete all associated meals
    if (mealPlan.meals && mealPlan.meals.length > 0) {
      await Meal.deleteMany({ _id: { $in: mealPlan.meals } });
    }

    // Delete the meal plan
    await MealPlan.findByIdAndDelete(planId);

    res.status(200).json({ message: "Meal plan deleted successfully!" });
  } catch (err) {
    console.error("Error deleting meal plan:", err.message);
    res.status(500).send("Server Error deleting meal plan");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
