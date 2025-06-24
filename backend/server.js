const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Load environment variables first
dotenv.config();

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
const generateInstructions = (cookingMethod) => {
  const instructions = {
    "Baking": [
      "Preheat oven to specified temperature.",
      "Prepare baking dish as instructed.",
      "Bake until golden brown and cooked through.",
      "Let cool before serving."
    ],
    "Frying": [
      "Heat oil in a pan over medium-high heat.",
      "Add ingredients and stir-fry until cooked.",
      "Season to taste and serve immediately."
    ],
    "Boiling": [
      "Bring a pot of water to a rolling boil.",
      "Add ingredients and cook until tender.",
      "Drain and serve."
    ],
    "Roasting": [
      "Preheat oven to specified temperature.",
      "Toss ingredients with oil and seasonings.",
      "Roast until tender and slightly caramelized."
    ],
    "Grilling": [
      "Preheat grill to medium-high heat.",
      "Brush ingredients with oil and seasonings.",
      "Grill until cooked through and grill marks appear."
    ],
    "Steaming": [
      "Bring water to a boil in a pot with a steamer basket.",
      "Place ingredients in the steamer basket.",
      "Steam until tender-crisp."
    ],
    "Stewing": [
      "Brown ingredients in a pot.",
      "Add liquid and simmer until tender.",
      "Season and serve hot."
    ],
    "Braising": [
      "Sear ingredients in a pot until browned.",
      "Add liquid and cover, then simmer gently until tender.",
      "Reduce sauce and serve."
    ],
    "Poaching": [
      "Gently simmer ingredients in liquid until cooked through.",
      "Remove from liquid and serve."
    ],
    "Sautéing": [
      "Heat a small amount of fat in a pan over medium-high heat.",
      "Add ingredients and cook quickly until tender-crisp.",
      "Season and serve."
    ],
    "Stir-frying": [
      "Heat oil in a wok or large pan over high heat.",
      "Add ingredients in order of cooking time required.",
      "Stir constantly until all ingredients are cooked through.",
      "Season to taste and serve immediately."
    ]
  };
  return instructions[cookingMethod] || ["Follow general cooking instructions."];
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
    const instructions = generateInstructions(cookingMethod);

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
    res.status(200).json({ message: "Logged in successfully.", token, role: user.role });
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
    res.status(200).json(ingredients);
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
