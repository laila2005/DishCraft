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

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Helper functions for recipe generation (existing)
const generateInstructions = (protein, vegetable, carb, sauce, cookingMethod) => {
  const instructions = [];
  
  switch (cookingMethod.toLowerCase()) {
    case 'bake/roast':
    case 'bake':
    case 'roast':
      instructions.push(`Preheat your oven to 375°F (190°C).`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt, pepper, and your favorite herbs.`);
      instructions.push(`Prepare the ${vegetable.toLowerCase()} by washing and cutting into appropriate sizes.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions until tender.`);
      instructions.push(`Place the seasoned ${protein.toLowerCase()} in a baking dish and roast for 25-30 minutes.`);
      instructions.push(`In the last 10 minutes, add the ${vegetable.toLowerCase()} to the baking dish.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} in a small saucepan over low heat.`);
      instructions.push(`Serve the roasted ${protein.toLowerCase()} and ${vegetable.toLowerCase()} over the ${carb.toLowerCase()}, topped with ${sauce.toLowerCase()}.`);
      break;
      
    case 'stir-fry':
      instructions.push(`Heat 2 tablespoons of oil in a large wok or skillet over high heat.`);
      instructions.push(`Cut the ${protein.toLowerCase()} into bite-sized pieces and season with salt and pepper.`);
      instructions.push(`Prepare the ${vegetable.toLowerCase()} by cutting into uniform pieces for even cooking.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions and set aside.`);
      instructions.push(`Add the ${protein.toLowerCase()} to the hot wok and stir-fry for 3-4 minutes until cooked through.`);
      instructions.push(`Add the ${vegetable.toLowerCase()} and continue stir-frying for 2-3 minutes until crisp-tender.`);
      instructions.push(`Add the ${sauce.toLowerCase()} and toss everything together for 1 minute.`);
      instructions.push(`Serve immediately over the prepared ${carb.toLowerCase()}.`);
      break;
      
    case 'grill':
      instructions.push(`Preheat your grill to medium-high heat.`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt, pepper, and olive oil.`);
      instructions.push(`Prepare the ${vegetable.toLowerCase()} for grilling by cutting into appropriate sizes.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Grill the ${protein.toLowerCase()} for 6-8 minutes per side until cooked through.`);
      instructions.push(`Grill the ${vegetable.toLowerCase()} for 4-5 minutes until lightly charred and tender.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} and serve alongside the grilled items.`);
      instructions.push(`Plate the grilled ${protein.toLowerCase()} and ${vegetable.toLowerCase()} with the ${carb.toLowerCase()} and drizzle with ${sauce.toLowerCase()}.`);
      break;
      
    case 'steam':
      instructions.push(`Set up a steamer basket in a large pot with about 1 inch of water.`);
      instructions.push(`Bring the water to a boil over high heat.`);
      instructions.push(`Season the ${protein.toLowerCase()} lightly with salt and pepper.`);
      instructions.push(`Prepare the ${vegetable.toLowerCase()} by cutting into uniform pieces.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Steam the ${protein.toLowerCase()} for 12-15 minutes until cooked through.`);
      instructions.push(`Add the ${vegetable.toLowerCase()} to the steamer and continue for 5-7 minutes until tender.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} in a small saucepan.`);
      instructions.push(`Serve the steamed ${protein.toLowerCase()} and ${vegetable.toLowerCase()} over ${carb.toLowerCase()} with ${sauce.toLowerCase()}.`);
      break;
      
    default:
      instructions.push(`Prepare all ingredients by washing and cutting as needed.`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt and pepper.`);
      instructions.push(`Cook the ${protein.toLowerCase()} using your preferred method until done.`);
      instructions.push(`Prepare the ${vegetable.toLowerCase()} by cooking until tender.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} if needed.`);
      instructions.push(`Combine all components and serve hot.`);
  }
  
  return instructions;
};

const estimateCookingTime = (cookingMethod) => {
  const timeRanges = {
    'bake/roast': '35-45',
    'bake': '30-40',
    'roast': '35-45',
    'stir-fry': '15-20',
    'grill': '20-25',
    'steam': '25-30',
    'sauté': '20-25',
    'boil': '15-25'
  };
  
  return timeRanges[cookingMethod.toLowerCase()] || '25-35';
};

const determineDifficulty = (cookingMethod) => {
  const easyMethods = ['steam', 'boil', 'bake'];
  const hardMethods = ['stir-fry', 'grill'];
  
  if (easyMethods.includes(cookingMethod.toLowerCase())) {
    return 'easy';
  } else if (hardMethods.includes(cookingMethod.toLowerCase())) {
    return 'medium';
  }
  return 'easy';
};

// Existing authentication routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password"
      });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      // Initialize chef profile if role is chef
      ...(role === 'chef' && {
        chefProfile: {
          professionalTitle: "",
          yearsOfExperience: 0,
          specialties: [],
          isVerifiedChef: false,
          allowMessages: true,
          showEmail: false,
          showLocation: true
        }
      })
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    // Update login statistics
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message
    });
  }
});

app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile"
    });
  }
});

app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'bio', 'location', 'dietaryPreferences', 'cuisinePreferences',
      'profileImage', 'chefProfile'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile"
    });
  }
});

// ===== NEW CHEF RECIPE ENDPOINTS =====

// GET all public chef recipes with filtering and search
app.get("/api/chef-recipes", optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      cuisine,
      difficulty,
      search,
      chefId,
      featured,
      sort = 'newest'
    } = req.query;

    const query = {
      status: 'approved',
      isPublic: true
    };

    // Apply filters
    if (category) query.category = category;
    if (cuisine) query.cuisine = cuisine;
    if (difficulty) query.difficulty = difficulty;
    if (chefId) query.chefId = chefId;
    if (featured === 'true') query.isFeatured = true;

    // Apply search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
        { 'ingredients.name': searchRegex }
      ];
    }

    // Determine sort order
    let sortOption = { createdAt: -1 }; // default: newest
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1, 'likes.length': -1 };
        break;
      case 'rating':
        sortOption = { 'ratings.rating': -1 };
        break;
      case 'cookTime':
        sortOption = { totalTime: 1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const recipes = await ChefRecipe.find(query)
      .populate('chefId', 'name email role chefProfile')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChefRecipe.countDocuments(query);

    res.json({
      success: true,
      recipes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecipes: total,
        hasNext: skip + recipes.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Error fetching chef recipes:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching recipes"
    });
  }
});

// GET single chef recipe by ID
app.get("/api/chef-recipes/:id", optionalAuth, async (req, res) => {
  try {
    const recipe = await ChefRecipe.findById(req.params.id)
      .populate('chefId', 'name email role chefProfile');

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }

    // Check if recipe is public or user has access
    if (!recipe.isPublic && recipe.status !== 'approved') {
      if (!req.user || (req.user._id.toString() !== recipe.chefId._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
    }

    // Increment views (but not for the recipe owner)
    if (!req.user || req.user._id.toString() !== recipe.chefId._id.toString()) {
      await recipe.incrementViews();
    }

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching recipe"
    });
  }
});

// POST create new chef recipe (chef only)
app.post("/api/chef-recipes", authenticateToken, requireChef, async (req, res) => {
  try {
    const recipeData = {
      ...req.body,
      chefId: req.user._id
    };

    const recipe = new ChefRecipe(recipeData);
    await recipe.save();

    // Update chef statistics
    await req.user.updateChefStats();

    const populatedRecipe = await ChefRecipe.findById(recipe._id)
      .populate('chefId', 'name email role chefProfile');

    res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      recipe: populatedRecipe
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating recipe",
      error: error.message
    });
  }
});

// PUT update chef recipe (chef owner only)
app.put("/api/chef-recipes/:id", authenticateToken, requireChef, async (req, res) => {
  try {
    const recipe = await ChefRecipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }

    // Check if user owns this recipe
    if (recipe.chefId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only edit your own recipes."
      });
    }

    // Update recipe
    Object.keys(req.body).forEach(key => {
      if (key !== 'chefId') { // Prevent changing recipe owner
        recipe[key] = req.body[key];
      }
    });

    // Reset status to pending if content was changed significantly
    if (req.body.title || req.body.ingredients || req.body.instructions) {
      recipe.status = 'pending';
    }

    await recipe.save();

    const populatedRecipe = await ChefRecipe.findById(recipe._id)
      .populate('chefId', 'name email role chefProfile');

    res.json({
      success: true,
      message: "Recipe updated successfully",
      recipe: populatedRecipe
    });
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating recipe"
    });
  }
});

// DELETE chef recipe (chef owner only)
app.delete("/api/chef-recipes/:id", authenticateToken, requireChef, async (req, res) => {
  try {
    const recipe = await ChefRecipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }

    // Check if user owns this recipe
    if (recipe.chefId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own recipes."
      });
    }

    await ChefRecipe.findByIdAndDelete(req.params.id);

    // Update chef statistics
    await req.user.updateChefStats();

    res.json({
      success: true,
      message: "Recipe deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting recipe"
    });
  }
});

// GET chef's own recipes (chef only)
app.get("/api/my-recipes", authenticateToken, requireChef, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      sort = 'newest'
    } = req.query;

    const query = { chefId: req.user._id };

    if (status) query.status = status;
    if (category) query.category = category;

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'rating':
        sortOption = { 'ratings.rating': -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const recipes = await ChefRecipe.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChefRecipe.countDocuments(query);

    res.json({
      success: true,
      recipes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecipes: total
      }
    });
  } catch (error) {
    console.error("Error fetching chef's recipes:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching your recipes"
    });
  }
});

// POST rate a chef recipe (authenticated users only)
app.post("/api/chef-recipes/:id/rate", authenticateToken, async (req, res) => {
  try {
    const { rating, review = '' } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const recipe = await ChefRecipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }

    // Prevent chef from rating their own recipe
    if (recipe.chefId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot rate your own recipe"
      });
    }

    await recipe.addRating(req.user._id, rating, review);

    // Update chef statistics
    const chef = await User.findById(recipe.chefId);
    if (chef) {
      await chef.updateChefStats();
    }

    res.json({
      success: true,
      message: "Rating added successfully",
      averageRating: recipe.averageRating,
      ratingsCount: recipe.ratingsCount
    });
  } catch (error) {
    console.error("Error rating recipe:", error);
    res.status(500).json({
      success: false,
      message: "Server error rating recipe"
    });
  }
});

// POST like/unlike a chef recipe (authenticated users only)
app.post("/api/chef-recipes/:id/like", authenticateToken, async (req, res) => {
  try {
    const recipe = await ChefRecipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }

    const wasLiked = recipe.likes.some(like => like.userId.equals(req.user._id));
    await recipe.toggleLike(req.user._id);

    // Update chef statistics
    const chef = await User.findById(recipe.chefId);
    if (chef) {
      await chef.updateChefStats();
    }

    res.json({
      success: true,
      message: wasLiked ? "Recipe unliked" : "Recipe liked",
      liked: !wasLiked,
      likesCount: recipe.likesCount
    });
  } catch (error) {
    console.error("Error liking recipe:", error);
    res.status(500).json({
      success: false,
      message: "Server error liking recipe"
    });
  }
});

// GET featured recipes
app.get("/api/chef-recipes/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recipes = await ChefRecipe.findFeatured(limit);

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error("Error fetching featured recipes:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching featured recipes"
    });
  }
});

// GET popular chefs
app.get("/api/chefs/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const chefs = await User.findPopularChefs(limit);

    res.json({
      success: true,
      chefs: chefs.map(chef => chef.getChefPublicProfile())
    });
  } catch (error) {
    console.error("Error fetching popular chefs:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching popular chefs"
    });
  }
});

// GET verified chefs
app.get("/api/chefs/verified", async (req, res) => {
  try {
    const { specialties, limit = 20 } = req.query;
    const options = {
      limit: parseInt(limit)
    };

    if (specialties) {
      options.specialties = specialties.split(',');
    }

    const chefs = await User.findVerifiedChefs(options);

    res.json({
      success: true,
      chefs: chefs.map(chef => chef.getChefPublicProfile())
    });
  } catch (error) {
    console.error("Error fetching verified chefs:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching verified chefs"
    });
  }
});

// GET chef profile by ID
app.get("/api/chefs/:id", async (req, res) => {
  try {
    const chef = await User.findById(req.params.id);

    if (!chef || chef.role !== 'chef') {
      return res.status(404).json({
        success: false,
        message: "Chef not found"
      });
    }

    res.json({
      success: true,
      chef: chef.getChefPublicProfile()
    });
  } catch (error) {
    console.error("Error fetching chef profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching chef profile"
    });
  }
});

// GET chef's public recipes
app.get("/api/chefs/:id/recipes", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      sort = 'newest'
    } = req.query;

    const options = {
      limit: parseInt(limit),
      category,
      sort: sort === 'popular' ? { views: -1 } : { createdAt: -1 }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const recipes = await ChefRecipe.findByChef(req.params.id, options);

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error("Error fetching chef recipes:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching chef recipes"
    });
  }
});

// ===== EXISTING ENDPOINTS (ingredients, recipe generation, meal plans) =====

// GET all ingredients (public endpoint)
app.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (err) {
    console.error("Error fetching ingredients:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST generate recipe (enhanced with chef recipe option)
app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { preferences } = req.body;
    
    // If user wants a chef recipe instead of ingredient-based generation
    if (preferences.mode === 'chef-recipe' && preferences.chefRecipeId) {
      const chefRecipe = await ChefRecipe.findById(preferences.chefRecipeId)
        .populate('chefId', 'name chefProfile');
      
      if (!chefRecipe || !chefRecipe.isPublic || chefRecipe.status !== 'approved') {
        return res.status(404).json({
          success: false,
          message: "Chef recipe not found or not available"
        });
      }

      // Increment views
      await chefRecipe.incrementViews();

      // Convert chef recipe to the format expected by frontend
      const convertedRecipe = {
        title: chefRecipe.title,
        description: chefRecipe.description,
        components: {
          protein: chefRecipe.ingredients.find(ing => ing.name.toLowerCase().includes('chicken') || ing.name.toLowerCase().includes('beef') || ing.name.toLowerCase().includes('fish'))?.name || 'Protein',
          vegetable: chefRecipe.ingredients.find(ing => ing.name.toLowerCase().includes('vegetable') || ing.name.toLowerCase().includes('carrot') || ing.name.toLowerCase().includes('broccoli'))?.name || 'Vegetables',
          carb: chefRecipe.ingredients.find(ing => ing.name.toLowerCase().includes('rice') || ing.name.toLowerCase().includes('pasta') || ing.name.toLowerCase().includes('bread'))?.name || 'Carbohydrate',
          sauce: 'Chef\'s Special Sauce',
          cookingMethod: 'Chef\'s Method'
        },
        instructions: chefRecipe.instructions.map(inst => inst.instruction),
        cookingTime: chefRecipe.formattedTotalTime,
        difficulty: chefRecipe.difficulty,
        servings: chefRecipe.servings,
        prepTime: `${chefRecipe.prepTime} minutes`,
        chefInfo: {
          name: chefRecipe.chefId.name,
          id: chefRecipe.chefId._id,
          isChefRecipe: true
        },
        originalRecipeId: chefRecipe._id
      };

      return res.json(convertedRecipe);
    }

    // Original ingredient-based recipe generation logic
    const { userIngredients = [], dietaryRestrictions = '', cuisinePreference = '', proteinPreference = '' } = preferences;

    console.log('Generating recipe with preferences:', preferences);

    // Fetch recipe components from database
    const [proteins, vegetables, carbs, sauces, cookingMethods] = await Promise.all([
      RecipeComponent.find({ type: 'protein' }),
      RecipeComponent.find({ type: 'vegetable' }),
      RecipeComponent.find({ type: 'carb' }),
      RecipeComponent.find({ type: 'sauce' }),
      RecipeComponent.find({ type: 'cooking_method' })
    ]);

    if (!proteins.length || !vegetables.length || !carbs.length || !sauces.length || !cookingMethods.length) {
      return res.status(500).json({
        error: "Insufficient recipe components in database"
      });
    }

    let selectedProtein, selectedVegetable, selectedCarb, selectedSauce, selectedMethod;

    if (userIngredients.length > 0) {
      // Ingredient-based selection with scoring
      const scoreComponent = (component, userIngredients) => {
        const componentName = component.name.toLowerCase();
        let score = 0;
        
        userIngredients.forEach(ingredient => {
          const ingredientName = ingredient.toLowerCase();
          if (componentName.includes(ingredientName) || ingredientName.includes(componentName)) {
            score += 10; // Exact or partial match
          } else if (componentName.split(' ').some(word => ingredientName.includes(word))) {
            score += 5; // Word match
          }
        });
        
        return score;
      };

      // Score and select best matching components
      const scoredProteins = proteins.map(p => ({ ...p.toObject(), score: scoreComponent(p, userIngredients) }));
      const scoredVegetables = vegetables.map(v => ({ ...v.toObject(), score: scoreComponent(v, userIngredients) }));
      const scoredCarbs = carbs.map(c => ({ ...c.toObject(), score: scoreComponent(c, userIngredients) }));
      const scoredSauces = sauces.map(s => ({ ...s.toObject(), score: scoreComponent(s, userIngredients) }));

      selectedProtein = scoredProteins.sort((a, b) => b.score - a.score)[0] || proteins[Math.floor(Math.random() * proteins.length)];
      selectedVegetable = scoredVegetables.sort((a, b) => b.score - a.score)[0] || vegetables[Math.floor(Math.random() * vegetables.length)];
      selectedCarb = scoredCarbs.sort((a, b) => b.score - a.score)[0] || carbs[Math.floor(Math.random() * carbs.length)];
      selectedSauce = scoredSauces.sort((a, b) => b.score - a.score)[0] || sauces[Math.floor(Math.random() * sauces.length)];
      selectedMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];

      console.log('Selected components based on ingredients:', {
        protein: selectedProtein.name,
        vegetable: selectedVegetable.name,
        carb: selectedCarb.name,
        sauce: selectedSauce.name,
        method: selectedMethod.name
      });
    } else {
      // Random selection
      selectedProtein = proteins[Math.floor(Math.random() * proteins.length)];
      selectedVegetable = vegetables[Math.floor(Math.random() * vegetables.length)];
      selectedCarb = carbs[Math.floor(Math.random() * carbs.length)];
      selectedSauce = sauces[Math.floor(Math.random() * sauces.length)];
      selectedMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];
    }

    // Generate recipe details
    const instructions = generateInstructions(
      selectedProtein.name,
      selectedVegetable.name,
      selectedCarb.name,
      selectedSauce.name,
      selectedMethod.name
    );

    const cookingTime = estimateCookingTime(selectedMethod.name);
    const difficulty = determineDifficulty(selectedMethod.name);

    // Calculate ingredient match information
    let ingredientMatch = null;
    if (userIngredients.length > 0) {
      const allComponents = [selectedProtein.name, selectedVegetable.name, selectedCarb.name, selectedSauce.name];
      const matchedIngredients = [];
      const missingIngredients = [];

      allComponents.forEach(component => {
        const isMatched = userIngredients.some(ingredient => 
          component.toLowerCase().includes(ingredient.toLowerCase()) || 
          ingredient.toLowerCase().includes(component.toLowerCase())
        );
        
        if (isMatched) {
          matchedIngredients.push(component);
        } else {
          missingIngredients.push(component);
        }
      });

      ingredientMatch = {
        matchedCount: matchedIngredients.length,
        totalRequired: allComponents.length,
        matchScore: Math.round((matchedIngredients.length / allComponents.length) * 100),
        matchedIngredients,
        missingIngredients
      };
    }

    const recipe = {
      title: `${selectedMethod.name} ${selectedProtein.name} with ${selectedVegetable.name}`,
      description: "A delicious, customizable recipe generated by DishCraft based on your available ingredients.",
      components: {
        protein: selectedProtein.name,
        vegetable: selectedVegetable.name,
        carb: selectedCarb.name,
        sauce: selectedSauce.name,
        cookingMethod: selectedMethod.name
      },
      instructions,
      cookingTime: `${cookingTime} minutes`,
      difficulty,
      servings: 4,
      prepTime: "10-15 minutes",
      ingredientMatch
    };

    console.log('Generated recipe:', recipe);
    res.json(recipe);
  } catch (err) {
    console.error("Error generating recipe:", err.message);
    res.status(500).json({
      error: "Failed to generate recipe",
      details: err.message
    });
  }
});

// GET meal plans (protected - user's own meal plans)
app.get("/api/meal-plans", authenticateToken, async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ userId: req.user._id })
      .populate({
        path: 'meals',
        options: { sort: { scheduledDate: 1 } }
      })
      .sort({ createdAt: -1 });

    res.json(mealPlans);
  } catch (err) {
    console.error("Error fetching meal plans:", err.message);
    res.status(500).send("Server Error fetching meal plans");
  }
});

// POST create meal plan (protected)
app.post("/api/meal-plans", authenticateToken, async (req, res) => {
  try {
    const { name, description = '', planType = 'weekly' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Meal plan name is required." });
    }

    const mealPlan = new MealPlan({
      name: name.trim(),
      description,
      planType,
      userId: req.user._id
    });

    await mealPlan.save();

    // Add meal plan to user's meal plans
    await User.findByIdAndUpdate(req.user._id, {
      $push: { mealPlans: mealPlan._id }
    });

    res.status(201).json(mealPlan);
  } catch (err) {
    console.error("Error creating meal plan:", err.message);
    res.status(500).send("Server Error creating meal plan");
  }
});

// POST add recipe to meal plan (protected)
app.post("/api/meal-plans/:planId/add-recipe", authenticateToken, async (req, res) => {
  try {
    const { planId } = req.params;
    const { recipeDetails, mealType = "dinner" } = req.body;

    // Verify meal plan belongs to user
    const mealPlan = await MealPlan.findOne({ _id: planId, userId: req.user._id });
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found or access denied." });
    }

    if (!recipeDetails || !recipeDetails.title) {
      return res.status(400).json({ message: "Recipe details are required." });
    }

    const newMeal = new Meal({
      recipeTitle: recipeDetails.title,
      recipeDetails: recipeDetails,
      mealType: mealType || "dinner",
      userId: req.user._id
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

// DELETE meal plan (protected)
app.delete("/api/meal-plans/:planId", authenticateToken, async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Verify meal plan belongs to user
    const mealPlan = await MealPlan.findOne({ _id: planId, userId: req.user._id });
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found or access denied." });
    }

    // Delete all associated meals
    if (mealPlan.meals && mealPlan.meals.length > 0) {
      await Meal.deleteMany({ _id: { $in: mealPlan.meals } });
    }

    // Remove from user's meal plans
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { mealPlans: planId }
    });

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
  console.log("🧠 Smart DishCraft API with Chef Recipes is ready!");
});
