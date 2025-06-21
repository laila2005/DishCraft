const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Import models
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");
const Meal = require("./models/Meal");
const MealPlan = require("./models/MealPlan");
const User = require("./models/User");
const ChefRecipe = require("./models/ChefRecipe");

// Import middleware
const { authenticateToken, requireChef, requireAdmin, optionalAuth } = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();

// Utility functions for recipe generation
const generateInstructions = (cookingMethod) => {
  switch (cookingMethod) {
    case "Baking":
      return [
        "Preheat oven to specified temperature.",
        "Prepare baking dish as instructed.",
        "Combine ingredients in a bowl.",
        "Pour mixture into baking dish.",
        "Bake for the recommended time until golden brown.",
        "Let cool before serving.",
      ];
    case "Frying":
      return [
        "Heat oil in a pan over medium-high heat.",
        "Add ingredients to the hot oil.",
        "Fry until crispy and cooked through, turning occasionally.",
        "Remove from pan and drain excess oil on paper towels.",
        "Serve hot.",
      ];
    case "Grilling":
      return [
        "Preheat grill to medium-high heat.",
        "Brush ingredients with oil and season.",
        "Place on grill and cook for recommended time, turning once.",
        "Remove from grill and let rest before serving.",
      ];
    case "Boiling":
      return [
        "Bring a pot of water to a rolling boil.",
        "Add ingredients to boiling water.",
        "Cook until tender or desired consistency.",
        "Drain water and serve.",
      ];
    case "Roasting":
      return [
        "Preheat oven to specified temperature.",
        "Toss ingredients with oil and seasonings on a baking sheet.",
        "Roast until tender and caramelized, flipping halfway.",
        "Serve immediately.",
      ];
    case "Steaming":
      return [
        "Fill a pot with an inch or two of water and bring to a simmer.",
        "Place ingredients in a steamer basket over the simmering water.",
        "Cover and steam until tender-crisp.",
        "Serve immediately.",
      ];
    case "Sautéing":
      return [
        "Heat a small amount of oil or butter in a skillet over medium-high heat.",
        "Add ingredients and cook quickly, stirring frequently, until tender and lightly browned.",
        "Serve immediately.",
      ];
    case "Braising":
      return [
        "Sear meat or vegetables in a pot until browned.",
        "Add liquid (broth, wine) to cover partially.",
        "Bring to a simmer, then cover and cook on low heat or in oven until tender.",
        "Serve with the cooking liquid.",
      ];
    default:
      return [
        "Prepare ingredients as needed.",
        "Cook using a suitable method until done.",
        "Season to taste and serve.",
      ];
  }
};

const estimateCookingTime = (cookingMethod) => {
  switch (cookingMethod) {
    case "Baking":
      return "30-45 minutes";
    case "Frying":
      return "10-20 minutes";
    case "Grilling":
      return "15-25 minutes";
    case "Boiling":
      return "5-15 minutes";
    case "Roasting":
      return "40-60 minutes";
    case "Steaming":
      return "10-20 minutes";
    case "Sautéing":
      return "5-10 minutes";
    case "Braising":
      return "2-4 hours";
    default:
      return "20-30 minutes";
  }
};

const determineDifficulty = (cookingMethod) => {
  switch (cookingMethod) {
    case "Boiling":
    case "Steaming":
    case "Sautéing":
      return "Easy";
    case "Frying":
    case "Grilling":
    case "Baking":
      return "Medium";
    case "Roasting":
    case "Braising":
      return "Hard";
    default:
      return "Medium";
  }
};

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    console.log("Signup request received:", req.body);
    
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email, and password are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address" 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: "User with this email already exists" 
      });
    }

    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error" 
      });
    }

    // Create new user
    user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "user", // Default to 'user' if not provided
    });

    await user.save();
    console.log("User created successfully:", user._id);

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    
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
      message: "Server error during signup. Please try again." 
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("Login request received:", { email: req.body.email });
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error" 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    console.log("User logged in successfully:", user._id);

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
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login. Please try again." 
    });
  }
});

// Protected route example
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
    console.log("Generate recipe request received:", req.body);
    
    const { ingredients: userIngredients, dietaryRestrictions, cuisinePreference, mealType } = req.body;

    // Fetch all available ingredients and recipe components from the database
    const allIngredients = await Ingredient.find({});
    const allRecipeComponents = await RecipeComponent.find({});

    console.log(`Found ${allIngredients.length} ingredients and ${allRecipeComponents.length} components in database`);

    // Filter recipe components by type
    const proteins = allRecipeComponents.filter(comp => comp.type === "protein");
    const vegetables = allRecipeComponents.filter(comp => comp.type === "vegetable");
    const carbs = allRecipeComponents.filter(comp => comp.type === "carb");
    const sauceBases = allRecipeComponents.filter(comp => comp.type === "sauce_base");
    const cookingMethods = allRecipeComponents.filter(comp => comp.type === "cooking_method");

    // Fallback arrays if database is empty
    const fallbackProteins = [
      { name: "Chicken Breast", description: "Lean protein", type: "protein" },
      { name: "Salmon Fillet", description: "Rich in omega-3", type: "protein" },
      { name: "Tofu", description: "Plant-based protein", type: "protein" }
    ];
    
    const fallbackVegetables = [
      { name: "Broccoli", description: "Green vegetable", type: "vegetable" },
      { name: "Bell Peppers", description: "Colorful vegetables", type: "vegetable" },
      { name: "Spinach", description: "Leafy green", type: "vegetable" }
    ];
    
    const fallbackCarbs = [
      { name: "Rice", description: "Staple carbohydrate", type: "carb" },
      { name: "Pasta", description: "Italian staple", type: "carb" },
      { name: "Quinoa", description: "Protein-rich grain", type: "carb" }
    ];
    
    const fallbackSauces = [
      { name: "Tomato Sauce", description: "Versatile sauce base", type: "sauce_base" },
      { name: "Olive Oil", description: "Healthy fat", type: "sauce_base" },
      { name: "Soy Sauce", description: "Asian flavor", type: "sauce_base" }
    ];
    
    const fallbackMethods = [
      { name: "Baking", description: "Oven cooking", type: "cooking_method" },
      { name: "Sautéing", description: "Pan cooking", type: "cooking_method" },
      { name: "Grilling", description: "High heat cooking", type: "cooking_method" }
    ];

    // Use database data or fallback
    const availableProteins = proteins.length > 0 ? proteins : fallbackProteins;
    const availableVegetables = vegetables.length > 0 ? vegetables : fallbackVegetables;
    const availableCarbs = carbs.length > 0 ? carbs : fallbackCarbs;
    const availableSauces = sauceBases.length > 0 ? sauceBases : fallbackSauces;
    const availableMethods = cookingMethods.length > 0 ? cookingMethods : fallbackMethods;

    // Select components
    let selectedProtein = availableProteins[Math.floor(Math.random() * availableProteins.length)];
    let selectedVegetable = availableVegetables[Math.floor(Math.random() * availableVegetables.length)];
    let selectedCarb = availableCarbs[Math.floor(Math.random() * availableCarbs.length)];
    let selectedSauceBase = availableSauces[Math.floor(Math.random() * availableSauces.length)];
    let selectedCookingMethod = availableMethods[Math.floor(Math.random() * availableMethods.length)];

    // Attempt to match user ingredients to available components
    const matchedIngredients = [];
    const missingIngredients = [];
    let ingredientMatchScore = 0;

    if (userIngredients && userIngredients.length > 0) {
      userIngredients.forEach(userIng => {
        const lowerUserIng = userIng.toLowerCase();
        const foundIngredient = allIngredients.find(ing => 
          ing.name.toLowerCase().includes(lowerUserIng) || 
          lowerUserIng.includes(ing.name.toLowerCase())
        );
        
        if (foundIngredient) {
          matchedIngredients.push(foundIngredient.name);
          ingredientMatchScore += 1;

          // Prioritize user's ingredients for selection
          if (foundIngredient.category === "protein") {
            const matchingProtein = availableProteins.find(p => 
              p.name.toLowerCase().includes(foundIngredient.name.toLowerCase())
            );
            if (matchingProtein) selectedProtein = matchingProtein;
          } else if (foundIngredient.category === "vegetable") {
            const matchingVegetable = availableVegetables.find(v => 
              v.name.toLowerCase().includes(foundIngredient.name.toLowerCase())
            );
            if (matchingVegetable) selectedVegetable = matchingVegetable;
          } else if (foundIngredient.category === "grain") {
            const matchingCarb = availableCarbs.find(c => 
              c.name.toLowerCase().includes(foundIngredient.name.toLowerCase())
            );
            if (matchingCarb) selectedCarb = matchingCarb;
          }
        }
      });

      // Determine missing ingredients
      const requiredComponents = [selectedProtein, selectedVegetable, selectedCarb, selectedSauceBase];
      requiredComponents.forEach(comp => {
        if (!userIngredients.some(userIng => 
          comp.name.toLowerCase().includes(userIng.toLowerCase()) ||
          userIng.toLowerCase().includes(comp.name.toLowerCase())
        )) {
          missingIngredients.push(comp.name);
        }
      });
    }

    // Calculate ingredient match percentage
    const totalPossibleMatches = Math.max(4, userIngredients ? userIngredients.length : 4);
    const matchPercentage = userIngredients && userIngredients.length > 0 
      ? (ingredientMatchScore / totalPossibleMatches) * 100 
      : 0;

    // Generate recipe name
    const recipeName = `${selectedCookingMethod.name} ${selectedProtein.name} with ${selectedVegetable.name} and ${selectedCarb.name}`;

    // Generate instructions, cooking time, and difficulty using helper functions
    const instructions = generateInstructions(selectedCookingMethod.name);
    const cookingTime = estimateCookingTime(selectedCookingMethod.name);
    const difficulty = determineDifficulty(selectedCookingMethod.name);

    const generatedRecipe = {
      name: recipeName,
      ingredients: [
        selectedProtein.name,
        selectedVegetable.name,
        selectedCarb.name,
        selectedSauceBase.name,
      ],
      instructions: instructions,
      cookingTime: cookingTime,
      difficulty: difficulty,
      cuisine: cuisinePreference || "",
      mealType: mealType || "",
      matchedIngredients: matchedIngredients,
      missingIngredients: missingIngredients,
      ingredientMatchPercentage: matchPercentage.toFixed(2),
      servings: 4,
      prepTime: "15 minutes"
    };

    console.log("Recipe generated successfully:", recipeName);
    res.status(200).json({ success: true, data: generatedRecipe });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate recipe", 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Something went wrong on the server" 
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found" 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`JWT_SECRET configured: ${!!process.env.JWT_SECRET}`);
  console.log(`MONGO_URI configured: ${!!process.env.MONGO_URI}`);
});
