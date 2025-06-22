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
    console.error("MongoDB connection error:", err.message);
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
      "Combine ingredients in a bowl.",
      "Pour mixture into baking dish.",
      "Bake for the recommended time until golden brown.",
      "Let cool before serving.",
    ],
    "Frying": [
      "Heat oil in a pan over medium-high heat.",
      "Add ingredients to the hot oil.",
      "Fry until crispy and cooked through, turning occasionally.",
      "Remove from pan and drain excess oil on paper towels.",
      "Serve hot.",
    ],
    "Grilling": [
      "Preheat grill to medium-high heat.",
      "Brush ingredients with oil and season.",
      "Place on grill and cook for recommended time, turning once.",
      "Remove from grill and let rest before serving.",
    ],
    "Boiling": [
      "Bring a pot of water to a rolling boil.",
      "Add ingredients to boiling water.",
      "Cook until tender or desired consistency.",
      "Drain water and serve.",
    ],
    "Roasting": [
      "Preheat oven to specified temperature.",
      "Toss ingredients with oil and seasonings on a baking sheet.",
      "Roast until tender and caramelized, flipping halfway.",
      "Serve immediately.",
    ],
    "Steaming": [
      "Fill a pot with an inch or two of water and bring to a simmer.",
      "Place ingredients in a steamer basket over the simmering water.",
      "Cover and steam until tender-crisp.",
      "Serve immediately.",
    ],
    "Sautéing": [
      "Heat a small amount of oil or butter in a skillet over medium-high heat.",
      "Add ingredients and cook quickly, stirring frequently, until tender and lightly browned.",
      "Serve immediately.",
    ],
    "Braising": [
      "Sear meat or vegetables in a pot until browned.",
      "Add liquid (broth, wine) to cover partially.",
      "Bring to a simmer, then cover and cook on low heat or in oven until tender.",
      "Serve with the cooking liquid.",
    ]
  };

  return instructions[cookingMethod] || [
    "Prepare ingredients as needed.",
    "Cook using a suitable method until done.",
    "Season to taste and serve.",
  ];
};

const estimateCookingTime = (cookingMethod) => {
  const times = {
    "Baking": "30-45 minutes",
    "Frying": "10-20 minutes",
    "Grilling": "15-25 minutes",
    "Boiling": "5-15 minutes",
    "Roasting": "40-60 minutes",
    "Steaming": "10-20 minutes",
    "Sautéing": "5-10 minutes",
    "Braising": "2-4 hours"
  };

  return times[cookingMethod] || "20-30 minutes";
};

const determineDifficulty = (cookingMethod) => {
  const difficulties = {
    "Boiling": "Easy",
    "Steaming": "Easy",
    "Sautéing": "Easy",
    "Frying": "Medium",
    "Grilling": "Medium",
    "Baking": "Medium",
    "Roasting": "Hard",
    "Braising": "Hard"
  };

  return difficulties[cookingMethod] || "Medium";
};

// Health check endpoint (should be first)
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Auth Routes with comprehensive error handling
app.post("/api/auth/signup", async (req, res) => {
  try {
    console.log("=== SIGNUP REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { name, email, password, role } = req.body;

    // Validate environment
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error - JWT_SECRET missing" 
      });
    }

    // Validate required fields
    if (!name || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({ 
        success: false, 
        message: "Name, email, and password are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address" 
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log("Password too short");
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    console.log("Checking if user exists with email:", email);
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log("User already exists");
      return res.status(400).json({ 
        success: false, 
        message: "User with this email already exists" 
      });
    }

    // Create new user
    console.log("Creating new user...");
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "user",
    });

    const savedUser = await user.save();
    console.log("User created successfully with ID:", savedUser._id);

    // Generate JWT
    const token = jwt.sign(
      { userId: savedUser._id, role: savedUser.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    console.log("JWT token generated successfully");

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { 
        id: savedUser._id, 
        name: savedUser.name, 
        email: savedUser.email, 
        role: savedUser.role 
      },
    });

  } catch (error) {
    console.error("=== SIGNUP ERROR ===");
    console.error("Error details:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "User with this email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error during signup. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("=== LOGIN REQUEST ===");
    console.log("Request body:", JSON.stringify({ email: req.body.email }, null, 2));
    
    const { email, password } = req.body;

    // Validate environment
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error - JWT_SECRET missing" 
      });
    }

    // Validate required fields
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Find user and include password for comparison
    console.log("Looking for user with email:", email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    console.log("User found, checking password...");
    
    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    console.log("Password matches, generating token...");

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    console.log("Login successful for user:", user._id);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
    });

  } catch (error) {
    console.error("=== LOGIN ERROR ===");
    console.error("Error details:", error);
    
    res.status(500).json({ 
      success: false, 
      message: "Server error during login. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Protected route for getting current user info
app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: { 
      id: req.user._id, 
      name: req.user.name, 
      email: req.user.email, 
      role: req.user.role 
    },
  });
});

// Admin route example
app.get("/api/admin", authenticateToken, requireAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome, Admin!",
    user: { 
      id: req.user._id, 
      name: req.user.name, 
      email: req.user.email, 
      role: req.user.role 
    },
  });
});

// Chef routes
app.get("/api/chef/dashboard", authenticateToken, requireChef, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Chef Dashboard!",
    user: { 
      id: req.user._id, 
      name: req.user.name, 
      email: req.user.email, 
      role: req.user.role 
    },
  });
});

// Ingredient Routes
app.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients = await Ingredient.find({});
    res.status(200).json({ success: true, data: ingredients });
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/ingredients", authenticateToken, requireChef, async (req, res) => {
  try {
    const newIngredient = new Ingredient(req.body);
    await newIngredient.save();
    res.status(201).json({ success: true, data: newIngredient });
  } catch (error) {
    console.error("Error creating ingredient:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Recipe Component Routes
app.get("/api/recipe-components", async (req, res) => {
  try {
    const components = await RecipeComponent.find({});
    res.status(200).json({ success: true, data: components });
  } catch (error) {
    console.error("Error fetching recipe components:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/recipe-components", authenticateToken, requireChef, async (req, res) => {
  try {
    const newComponent = new RecipeComponent(req.body);
    await newComponent.save();
    res.status(201).json({ success: true, data: newComponent });
  } catch (error) {
    console.error("Error creating recipe component:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Meal Routes
app.get("/api/meals", authenticateToken, async (req, res) => {
  try {
    const meals = await Meal.find({ user: req.user._id });
    res.status(200).json({ success: true, data: meals });
  } catch (error) {
    console.error("Error fetching meals:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/meals", authenticateToken, async (req, res) => {
  try {
    const newMeal = new Meal({ ...req.body, user: req.user._id });
    await newMeal.save();
    res.status(201).json({ success: true, data: newMeal });
  } catch (error) {
    console.error("Error creating meal:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Meal Plan Routes
app.get("/api/meal-plans", authenticateToken, async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ user: req.user._id });
    res.status(200).json({ success: true, data: mealPlans });
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/meal-plans", authenticateToken, async (req, res) => {
  try {
    const newMealPlan = new MealPlan({ ...req.body, user: req.user._id });
    await newMealPlan.save();
    res.status(201).json({ success: true, data: newMealPlan });
  } catch (error) {
    console.error("Error creating meal plan:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Chef Recipe Routes
app.get("/api/chef-recipes", authenticateToken, requireChef, async (req, res) => {
  try {
    const chefRecipes = await ChefRecipe.find({ chef: req.user._id });
    res.status(200).json({ success: true, data: chefRecipes });
  } catch (error) {
    console.error("Error fetching chef recipes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/chef-recipes", authenticateToken, requireChef, async (req, res) => {
  try {
    const newChefRecipe = new ChefRecipe({ ...req.body, chef: req.user._id });
    await newChefRecipe.save();
    res.status(201).json({ success: true, data: newChefRecipe });
  } catch (error) {
    console.error("Error creating chef recipe:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Generate Recipe Endpoint
app.post("/api/generate-recipe", optionalAuth, async (req, res) => {
  try {
    console.log("=== GENERATE RECIPE REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { ingredients: userIngredients, dietaryRestrictions, cuisinePreference, mealType } = req.body;

    // Fetch all available ingredients and recipe components from the database
    const allIngredients = await Ingredient.find({});
    const allRecipeComponents = await RecipeComponent.find({});

    console.log(`Found ${allIngredients.length} ingredients and ${allRecipeComponents.length} recipe components.`);

    // Fallback data in case database is empty or specific types are missing
    const defaultProteins = ["chicken breast", "beef steak", "tofu", "salmon", "eggs", "lentils", "pork loin", "shrimp", "turkey", "beans"];
    const defaultVegetables = ["broccoli", "spinach", "carrots", "bell peppers", "onions", "mushrooms", "zucchini", "sweet potatoes", "asparagus", "kale"];
    const defaultCarbs = ["rice", "pasta", "quinoa", "potatoes", "bread", "oats", "couscous", "corn"];
    const defaultSauceBases = ["tomato sauce", "cream sauce", "soy sauce", "pesto", "curry paste", "broth", "coconut milk", "peanut butter", "vinegar", "lemon juice"];
    const defaultCookingMethods = ["Baking", "Frying", "Grilling", "Boiling", "Roasting", "Steaming", "Sautéing", "Braising"];

    const proteins = allRecipeComponents.filter(c => c.type === 'protein').map(c => c.name) || defaultProteins;
    const vegetables = allRecipeComponents.filter(c => c.type === 'vegetable').map(c => c.name) || defaultVegetables;
    const carbs = allRecipeComponents.filter(c => c.type === 'carb').map(c => c.name) || defaultCarbs;
    const sauceBases = allRecipeComponents.filter(c => c.type === 'sauce_base').map(c => c.name) || defaultSauceBases;
    const cookingMethods = allRecipeComponents.filter(c => c.type === 'cooking_method').map(c => c.name) || defaultCookingMethods;

    // Filter ingredients based on user input (if provided)
    let availableIngredients = userIngredients && userIngredients.length > 0
      ? allIngredients.filter(ing => userIngredients.includes(ing.name))
      : allIngredients;

    if (availableIngredients.length === 0 && userIngredients.length > 0) {
      console.warn("No matching ingredients found in DB for user input. Using all available ingredients.");
      availableIngredients = allIngredients;
    }

    // Simple recipe generation logic (can be expanded)
    let selectedIngredients = [];
    let missingIngredients = [];

    // Try to pick ingredients from user's list first
    if (userIngredients && userIngredients.length > 0) {
      // Prioritize user ingredients
      selectedIngredients = userIngredients.slice(0, 3); // Take first 3 user ingredients

      // Check for missing components based on a simple recipe structure
      const hasProtein = selectedIngredients.some(ing => proteins.includes(ing));
      const hasVegetable = selectedIngredients.some(ing => vegetables.includes(ing));
      const hasCarb = selectedIngredients.some(ing => carbs.includes(ing));
      const hasSauce = selectedIngredients.some(ing => sauceBases.includes(ing));

      if (!hasProtein && proteins.length > 0) missingIngredients.push(proteins[Math.floor(Math.random() * proteins.length)]);
      if (!hasVegetable && vegetables.length > 0) missingIngredients.push(vegetables[Math.floor(Math.random() * vegetables.length)]);
      if (!hasCarb && carbs.length > 0) missingIngredients.push(carbs[Math.floor(Math.random() * carbs.length)]);
      if (!hasSauce && sauceBases.length > 0) missingIngredients.push(sauceBases[Math.floor(Math.random() * sauceBases.length)]);

      // Add some random ingredients if user provided few
      while (selectedIngredients.length < 5 && availableIngredients.length > 0) {
        const randomIng = availableIngredients[Math.floor(Math.random() * availableIngredients.length)].name;
        if (!selectedIngredients.includes(randomIng)) {
          selectedIngredients.push(randomIng);
        }
      }
    } else {
      // If no user ingredients, pick random ones
      console.log("No user ingredients provided, generating random recipe.");
      selectedIngredients = [];
      const allNames = allIngredients.map(ing => ing.name);
      while (selectedIngredients.length < 5 && allNames.length > 0) {
        const randomIng = allNames[Math.floor(Math.random() * allNames.length)];
        if (!selectedIngredients.includes(randomIng)) {
          selectedIngredients.push(randomIng);
        }
      }
      // If still no ingredients, use defaults
      if (selectedIngredients.length === 0) {
        selectedIngredients = [defaultProteins[0], defaultVegetables[0], defaultCarbs[0], defaultSauceBases[0]];
      }
    }

    // Select a random cooking method
    const randomCookingMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];

    const recipeName = `Delicious ${randomCookingMethod} ${selectedIngredients[0] || 'Dish'}`;
    const instructions = generateInstructions(randomCookingMethod);
    const cookingTime = estimateCookingTime(randomCookingMethod);
    const difficulty = determineDifficulty(randomCookingMethod);

    const generatedRecipe = {
      name: recipeName,
      ingredients: selectedIngredients,
      instructions,
      cookingTime,
      difficulty,
      missingIngredients: missingIngredients.filter(Boolean), // Filter out any undefined/null
      // Add more fields as needed, e.g., servings, prepTime, etc.
    };

    res.status(200).json({ success: true, data: generatedRecipe });

  } catch (error) {
    console.error("=== GENERATE RECIPE ERROR ===");
    console.error("Error details:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate recipe. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware (catch-all)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).send('Something broke!');
});

// Handle 404 - Not Found
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Start server
app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔑 JWT_SECRET configured: ${!!process.env.JWT_SECRET}`);
  console.log(`🗄️  MONGO_URI configured: ${!!process.env.MONGO_URI}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log("==================================================");
});
