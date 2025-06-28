const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require('dotenv').config();
// Load environment variables first
//dotenv.config();

// Import models
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");
const Meal = require("./models/Meal");
const MealPlan = require("./models/MealPlan");
const User = require("./models/User");
const ChefRecipe = require("./models/ChefRecipe");

// Import middleware
const { authenticateToken, requireChef, requireAdmin, optionalAuth } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB with better error handling (removed deprecated options)
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

// Utility functions for recipe generation
const generateInstructions = (cookingMethod, ingredients) => {
  let instructions = [];

  switch (cookingMethod) {
    case "Baking":
      instructions = [
        "Preheat oven to 375°F (190°C).",
        "Lightly grease a baking dish with butter or cooking spray.",
        "Combine all dry ingredients in a large bowl, whisking to ensure no lumps.",
        "In a separate bowl, mix all wet ingredients until well combined.",
        "Gradually add the wet ingredients to the dry ingredients, mixing until just combined. Be careful not to overmix.",
        "Pour the batter or mixture into the prepared baking dish, spreading evenly.",
        "Bake for 25-35 minutes, or until golden brown and a toothpick inserted into the center comes out clean.",
        "Let cool on a wire rack for at least 10 minutes before serving."
      ];
      break;
    case "Frying":
      instructions = [
        "Heat 2 tablespoons of oil in a large skillet or frying pan over medium-high heat.",
        "Carefully add the ingredients to the hot oil in a single layer, ensuring not to overcrowd the pan.",
        "Fry for 3-5 minutes per side, or until golden brown and cooked through. Adjust heat as needed to prevent burning.",
        "Remove from pan and place on a plate lined with paper towels to drain excess oil.",
        "Season with salt and pepper to taste and serve immediately."
      ];
      break;
    case "Boiling":
      instructions = [
        "Fill a large pot with water and bring to a rolling boil over high heat.",
        "Add a pinch of salt to the boiling water (optional, but recommended for pasta and vegetables).",
        "Carefully add the ingredients to the boiling water. Reduce heat slightly to maintain a gentle boil.",
        "Cook for 8-12 minutes, or until tender-crisp (for vegetables) or al dente (for pasta).",
        "Drain thoroughly using a colander and serve hot."
      ];
      break;
    case "Roasting":
      instructions = [
        "Preheat oven to 400°F (200°C).",
        "Chop vegetables into uniform pieces for even cooking.",
        "In a large bowl, toss the ingredients with 2 tablespoons of olive oil, salt, pepper, and your favorite herbs (e.g., rosemary, thyme).",
        "Spread the seasoned ingredients in a single layer on a baking sheet.",
        "Roast for 20-30 minutes, flipping halfway through, until tender and slightly caramelized.",
        "Serve hot as a side dish or main course."
      ];
      break;
    case "Grilling":
      instructions = [
        "Preheat grill to medium-high heat (around 400°F / 200°C). Clean and oil the grill grates.",
        "Brush ingredients with olive oil and season generously with salt, pepper, and desired spices.",
        "Place ingredients directly on the hot grill grates.",
        "Grill for 4-6 minutes per side, or until desired doneness is reached and grill marks appear.",
        "For thicker cuts, reduce heat to medium and continue grilling until cooked through.",
        "Remove from grill and let rest for a few minutes before slicing or serving."
      ];
      break;
    case "Steaming":
      instructions = [
        "Fill a pot with about 1 inch of water and bring to a boil. Place a steamer basket inside the pot, ensuring it doesn't touch the water.",
        "Add the ingredients to the steamer basket in a single layer.",
        "Cover the pot tightly and steam for 5-10 minutes, or until tender-crisp. Cooking time will vary based on the type and size of ingredients.",
        "Carefully remove the steamer basket and serve the steamed ingredients immediately.",
        "Season with a drizzle of olive oil, lemon juice, or a sprinkle of herbs if desired."
      ];
      break;
    case "Stewing":
      instructions = [
        "In a large pot or Dutch oven, heat 1 tablespoon of oil over medium-high heat.",
        "Brown any meat ingredients on all sides, then remove from the pot and set aside.",
        "Add chopped vegetables (e.g., onions, carrots, celery) to the pot and sauté until softened, about 5-7 minutes.",
        "Return the browned meat to the pot. Add 4 cups of broth or water, along with herbs and spices (e.g., bay leaf, thyme, paprika).",
        "Bring to a simmer, then reduce heat to low, cover, and cook for 1.5-2 hours, or until the meat is fork-tender.",
        "Adjust seasoning to taste before serving hot."
      ];
      break;
    case "Braising":
      instructions = [
        "Preheat oven to 325°F (160°C).",
        "Season meat (e.g., beef short ribs, pork shoulder) generously with salt and pepper.",
        "In an oven-safe pot or Dutch oven, heat 2 tablespoons of oil over medium-high heat. Sear the meat on all sides until deeply browned. Remove and set aside.",
        "Add chopped aromatics (e.g., onions, garlic, carrots) to the pot and cook until softened.",
        "Deglaze the pot with 1 cup of red wine or broth, scraping up any browned bits from the bottom.",
        "Return the meat to the pot. Add enough liquid (broth, stock) to come halfway up the sides of the meat. Add herbs (e.g., thyme, rosemary).",
        "Bring to a simmer on the stovetop, then cover tightly and transfer to the preheated oven.",
        "Braise for 2-3 hours, or until the meat is incredibly tender and easily pulls apart.",
        "Remove meat, reduce sauce if desired, and serve."
      ];
      break;
    case "Poaching":
      instructions = [
        "Choose a liquid for poaching (e.g., water, broth, wine, milk) and pour it into a shallow pan or skillet.",
        "Add any desired aromatics to the liquid (e.g., lemon slices, herbs, peppercorns).",
        "Bring the liquid to a gentle simmer over medium heat. Do not let it boil vigorously.",
        "Carefully place the ingredients (e.g., chicken breast, fish fillets, eggs) into the simmering liquid.",
        "Poach for 5-10 minutes, or until cooked through. Cooking time will depend on the thickness of the ingredient.",
        "Remove the poached item with a slotted spoon and serve immediately, perhaps with a drizzle of the poaching liquid."
      ];
      break;
    case "Sautéing":
      instructions = [
        "Heat 1-2 tablespoons of olive oil or butter in a large skillet over medium-high heat until shimmering.",
        "Add chopped or sliced ingredients (e.g., vegetables, small pieces of meat) to the hot pan in a single layer.",
        "Sauté for 5-8 minutes, stirring frequently, until tender-crisp and lightly browned.",
        "Season with salt, pepper, and any desired herbs or spices during the last minute of cooking.",
        "Serve immediately as a side dish or incorporated into a larger meal."
      ];
      break;
    case "Stir-frying":
      instructions = [
        "Prepare all ingredients by chopping them into uniform, bite-sized pieces. This ensures even cooking.",
        "Heat 1-2 tablespoons of high-smoke-point oil (e.g., vegetable, peanut, or sesame oil) in a large wok or skillet over high heat until it just begins to smoke.",
        "Add harder vegetables (e.g., carrots, broccoli) first and stir-fry for 2-3 minutes.",
        "Add protein (e.g., chicken, beef, tofu) and stir-fry until nearly cooked through, breaking up any clumps.",
        "Add softer vegetables (e.g., bell peppers, snap peas) and stir-fry for another 1-2 minutes.",
        "Pour in your desired sauce (e.g., soy sauce, oyster sauce, ginger-garlic sauce) and toss to coat all ingredients.",
        "Cook for 1-2 minutes more, allowing the sauce to thicken slightly and flavors to meld.",
        "Serve immediately over rice or noodles."
      ];
      break;
    default:
      instructions = [
        "Prepare ingredients as needed.",
        "Cook using a suitable method until done.",
        "Season to taste and serve."
      ];
  }

  return instructions;
};

// Enhanced recipe generation with rule-based system
const generateRecipe = async (req, res) => {
  const { ingredients, cookingMethod, cuisine, difficulty, prepTime } = req.body;

  // Basic validation
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: "Ingredients are required." });
  }
  if (!cookingMethod) {
    return res.status(400).json({ message: "Cooking method is required." });
  }

  try {
    // Fetch all available ingredients from the database
    const availableIngredients = await Ingredient.find({});
    const availableIngredientNames = availableIngredients.map(ing => ing.name.toLowerCase());

    // Identify missing ingredients
    const missingIngredients = ingredients.filter(ing => !availableIngredientNames.includes(ing.toLowerCase()));

    // Generate instructions based on cooking method
    const instructions = generateInstructions(cookingMethod, ingredients);

    // Rule-based recipe name generation
    const generateRecipeName = (ingredients, cookingMethod, cuisine) => {
      const mainIngredient = ingredients[0] || "Mixed";
      const adjectives = ["Delicious", "Savory", "Flavorful", "Aromatic", "Perfect"];
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      
      if (cuisine && cuisine !== "") {
        return `${randomAdjective} ${cuisine} ${cookingMethod} ${mainIngredient}`;
      }
      return `${randomAdjective} ${cookingMethod} ${mainIngredient}`;
    };

    // Rule-based ingredient quantities
    const generateIngredientQuantities = (ingredients) => {
      const baseQuantities = {
        "meat": ["1 lb", "500g", "2 cups diced"],
        "vegetable": ["2 cups", "1 large", "3 medium"],
        "grain": ["1 cup", "2 cups", "1.5 cups"],
        "liquid": ["1 cup", "2 cups", "1/2 cup"],
        "spice": ["1 tsp", "1 tbsp", "1/2 tsp"],
        "default": ["1 cup", "2 pieces", "as needed"]
      };

      return ingredients.map(name => {
        const lowerName = name.toLowerCase();
        let quantity = "1 cup"; // default
        let unit = "";

        // Simple categorization rules
        if (lowerName.includes("beef") || lowerName.includes("chicken") || lowerName.includes("pork") || lowerName.includes("fish")) {
          quantity = baseQuantities.meat[Math.floor(Math.random() * baseQuantities.meat.length)];
        } else if (lowerName.includes("pasta") || lowerName.includes("rice") || lowerName.includes("noodle")) {
          quantity = baseQuantities.grain[Math.floor(Math.random() * baseQuantities.grain.length)];
        } else if (lowerName.includes("oil") || lowerName.includes("sauce") || lowerName.includes("broth") || lowerName.includes("juice")) {
          quantity = baseQuantities.liquid[Math.floor(Math.random() * baseQuantities.liquid.length)];
        } else if (lowerName.includes("salt") || lowerName.includes("pepper") || lowerName.includes("garlic") || lowerName.includes("herb")) {
          quantity = baseQuantities.spice[Math.floor(Math.random() * baseQuantities.spice.length)];
        } else {
          quantity = baseQuantities.vegetable[Math.floor(Math.random() * baseQuantities.vegetable.length)];
        }

        return { name, quantity, unit };
      });
    };

    // Enhanced recipe generation with rules
    const generatedRecipe = {
      name: generateRecipeName(ingredients, cookingMethod, cuisine),
      ingredients: generateIngredientQuantities(ingredients),
      instructions: instructions,
      cookingMethod,
      cuisine: cuisine || "International",
      difficulty: difficulty || "Medium",
      prepTime: prepTime || "20-30 minutes",
      missingIngredients: missingIngredients,
      servings: "4 people",
      calories: "Approximately 350-450 per serving"
    };

    res.status(200).json(generatedRecipe);
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ message: "Error generating recipe", error: error.message });
  }
};

// Routes

// User authentication routes
app.post("/api/register", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      name: username.split('@')[0], // Use email prefix as name
      email: username, 
      password: hashedPassword, 
      role 
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already exists with this email." });
    }
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ email: username }).select('+password');
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.status(200).json({ message: "Logged in successfully.", token, role: user.role, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Add auth/me endpoint for token validation
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
});

// Ingredient routes
app.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients = await Ingredient.find({});
    res.status(200).json({ data: ingredients }); // Wrap ingredients in a 'data' object
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ message: "Error fetching ingredients", error: error.message });
  }
});

app.post("/api/ingredients", authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    const newIngredient = new Ingredient({ name });
    await newIngredient.save();
    res.status(201).json({ message: "Ingredient added successfully.", ingredient: newIngredient });
  } catch (error) {
    console.error("Error adding ingredient:", error);
    res.status(500).json({ message: "Error adding ingredient", error: error.message });
  }
});

// Recipe component routes
app.get("/api/recipe-components", async (req, res) => {
  try {
    const recipeComponents = await RecipeComponent.find({});
    res.status(200).json(recipeComponents);
  } catch (error) {
    console.error("Error fetching recipe components:", error);
    res.status(500).json({ message: "Error fetching recipe components", error: error.message });
  }
});

app.post("/api/recipe-components", authenticateToken, requireAdmin, async (req, res) => {
  const { name, type } = req.body;
  try {
    const newRecipeComponent = new RecipeComponent({ name, type });
    await newRecipeComponent.save();
    res.status(201).json({ message: "Recipe component added successfully.", recipeComponent: newRecipeComponent });
  } catch (error) {
    console.error("Error adding recipe component:", error);
    res.status(500).json({ message: "Error adding recipe component", error: error.message });
  }
});

// Meal routes
app.get("/api/meals", async (req, res) => {
  try {
    const meals = await Meal.find({});
    res.status(200).json(meals);
  } catch (error) {
    console.error("Error fetching meals:", error);
    res.status(500).json({ message: "Error fetching meals", error: error.message });
  }
});

app.post("/api/meals", authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, ingredients, instructions, cookingMethod, cuisine, difficulty, prepTime } = req.body;
  try {
    const newMeal = new Meal({ name, description, ingredients, instructions, cookingMethod, cuisine, difficulty, prepTime });
    await newMeal.save();
    res.status(201).json({ message: "Meal added successfully.", meal: newMeal });
  } catch (error) {
    console.error("Error adding meal:", error);
    res.status(500).json({ message: "Error adding meal", error: error.message });
  }
});

// Meal plan routes
app.get("/api/meal-plans", async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({});
    res.status(200).json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    res.status(500).json({ message: "Error fetching meal plans", error: error.message });
  }
});

app.post("/api/meal-plans", authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, meals } = req.body;
  try {
    const newMealPlan = new MealPlan({ name, description, meals });
    await newMealPlan.save();
    res.status(201).json({ message: "Meal plan added successfully.", mealPlan: newMealPlan });
  } catch (error) {
    console.error("Error adding meal plan:", error);
    res.status(500).json({ message: "Error adding meal plan", error: error.message });
  }
});

// Chef recipe routes - Fixed to allow chef access
app.get("/api/chef-recipes", async (req, res) => {
  try {
    const chefRecipes = await ChefRecipe.find({}).populate('chef', 'name email');
    res.status(200).json(chefRecipes);
  } catch (error) {
    console.error("Error fetching chef recipes:", error);
    res.status(500).json({ message: "Error fetching chef recipes", error: error.message });
  }
});

app.post("/api/chef-recipes", authenticateToken, requireChef, async (req, res) => {
  const { name, description, ingredients, instructions, cookingMethod, cuisine, difficulty, prepTime } = req.body;
  try {
    const newChefRecipe = new ChefRecipe({ 
      name, 
      description, 
      ingredients, 
      instructions, 
      cookingMethod, 
      cuisine, 
      difficulty, 
      prepTime,
      chef: req.user._id // Associate recipe with the logged-in chef
    });
    await newChefRecipe.save();
    res.status(201).json({ message: "Chef recipe added successfully.", chefRecipe: newChefRecipe });
  } catch (error) {
    console.error("Error adding chef recipe:", error);
    res.status(500).json({ message: "Error adding chef recipe", error: error.message });
  }
});

// Recipe generation route
app.post("/api/generate-recipe", generateRecipe);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
