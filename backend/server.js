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
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

// Helper function to generate cooking instructions
const generateInstructions = (protein, vegetable, carb, sauce, cookingMethod) => {
  const instructions = [];
  
  switch (cookingMethod.toLowerCase()) {
    case 'grilling':
    case 'grilled':
    case 'grill':
      instructions.push(`Preheat grill to medium-high heat.`);
      instructions.push(`Season the ${protein} with salt and pepper.`);
      instructions.push(`Grill the ${protein} for 6-8 minutes per side until cooked through.`);
      instructions.push(`Meanwhile, prepare the ${vegetable} by cutting into bite-sized pieces.`);
      instructions.push(`Cook the ${carb} according to package instructions.`);
      instructions.push(`Toss the ${vegetable} with ${sauce} and serve alongside the grilled ${protein} and ${carb}.`);
      break;
      
    case 'stir-frying':
    case 'stir-fried':
    case 'stir-fry':
      instructions.push(`Heat oil in a large wok or skillet over high heat.`);
      instructions.push(`Cut ${protein} into small pieces and add to the hot pan.`);
      instructions.push(`Stir-fry the ${protein} for 3-4 minutes until nearly cooked.`);
      instructions.push(`Add chopped ${vegetable} and continue stir-frying for 2-3 minutes.`);
      instructions.push(`Cook ${carb} separately according to package instructions.`);
      instructions.push(`Add ${sauce} to the pan and toss everything together for 1 minute.`);
      instructions.push(`Serve hot over the prepared ${carb}.`);
      break;
      
    case 'baking':
    case 'baked':
    case 'bake':
      instructions.push(`Preheat oven to 375°F (190°C).`);
      instructions.push(`Place ${protein} in a baking dish and season with salt and pepper.`);
      instructions.push(`Add chopped ${vegetable} around the ${protein}.`);
      instructions.push(`Drizzle with ${sauce} and cover with foil.`);
      instructions.push(`Bake for 25-30 minutes until ${protein} is cooked through.`);
      instructions.push(`Meanwhile, prepare ${carb} according to package instructions.`);
      instructions.push(`Serve the baked ${protein} and ${vegetable} over the ${carb}.`);
      break;
      
    case 'sautéing':
    case 'sautéed':
    case 'sauté':
      instructions.push(`Heat oil in a large skillet over medium-high heat.`);
      instructions.push(`Season ${protein} with salt and pepper, then add to the pan.`);
      instructions.push(`Cook ${protein} for 4-5 minutes per side until golden brown.`);
      instructions.push(`Remove ${protein} and set aside.`);
      instructions.push(`Add ${vegetable} to the same pan and sauté for 3-4 minutes.`);
      instructions.push(`Cook ${carb} according to package instructions.`);
      instructions.push(`Return ${protein} to the pan, add ${sauce}, and cook for 2 more minutes.`);
      instructions.push(`Serve over the prepared ${carb}.`);
      break;
      
    case 'steaming':
    case 'steamed':
    case 'steam':
      instructions.push(`Set up a steamer basket over boiling water.`);
      instructions.push(`Season ${protein} with salt and pepper.`);
      instructions.push(`Steam ${protein} for 12-15 minutes until cooked through.`);
      instructions.push(`Add ${vegetable} to the steamer for the last 5 minutes.`);
      instructions.push(`Cook ${carb} separately according to package instructions.`);
      instructions.push(`Serve the steamed ${protein} and ${vegetable} over ${carb} with ${sauce} on the side.`);
      break;
      
    case 'roasting':
    case 'roasted':
    case 'roast':
      instructions.push(`Preheat oven to 400°F (200°C).`);
      instructions.push(`Season ${protein} with salt, pepper, and herbs.`);
      instructions.push(`Place ${protein} and ${vegetable} on a roasting pan.`);
      instructions.push(`Drizzle with ${sauce} and roast for 30-40 minutes.`);
      instructions.push(`Cook ${carb} according to package instructions.`);
      instructions.push(`Serve the roasted ${protein} and ${vegetable} with ${carb}.`);
      break;
      
    default:
      instructions.push(`Prepare ${protein} by seasoning with salt and pepper.`);
      instructions.push(`Cook ${protein} using your preferred method until done.`);
      instructions.push(`Prepare ${vegetable} by cutting and cooking until tender.`);
      instructions.push(`Cook ${carb} according to package instructions.`);
      instructions.push(`Combine all ingredients and serve with ${sauce}.`);
  }
  
  return instructions;
};

// Helper function to estimate cooking time
const estimateCookingTime = (cookingMethod) => {
  switch (cookingMethod.toLowerCase()) {
    case 'grilling':
    case 'grilled':
    case 'grill':
      return '20-25';
    case 'stir-frying':
    case 'stir-fried':
    case 'stir-fry':
      return '15-20';
    case 'baking':
    case 'baked':
    case 'bake':
      return '35-40';
    case 'sautéing':
    case 'sautéed':
    case 'sauté':
      return '20-25';
    case 'steaming':
    case 'steamed':
    case 'steam':
      return '25-30';
    case 'roasting':
    case 'roasted':
    case 'roast':
      return '45-60';
    case 'braising':
    case 'braised':
    case 'braise':
      return '60-90';
    default:
      return '25-30';
  }
};

// Helper function to determine difficulty level
const determineDifficulty = (cookingMethod) => {
  switch (cookingMethod.toLowerCase()) {
    case 'steaming':
    case 'steamed':
    case 'steam':
    case 'baking':
    case 'baked':
    case 'bake':
      return 'easy';
    case 'grilling':
    case 'grilled':
    case 'grill':
    case 'sautéing':
    case 'sautéed':
    case 'sauté':
    case 'stir-frying':
    case 'stir-fried':
    case 'stir-fry':
      return 'medium';
    case 'braising':
    case 'braised':
    case 'braise':
    case 'roasting':
    case 'roasted':
    case 'roast':
      return 'hard';
    default:
      return 'medium';
  }
};

// User registration
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(201).json({ success: true, message: "User registered successfully", token });
  } catch (err) {
    console.error("Error registering user:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// User login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({ success: true, message: "Logged in successfully", token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Error logging in:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Protected route example
app.get("/api/protected", authenticateToken, (req, res) => {
  res.status(200).json({ message: "You have access to protected data!", user: req.user });
});

// Get all ingredients (public endpoint)
app.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (err) {
    console.error("Error fetching ingredients:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST generate recipe (enhanced with chef recipe option and better error handling)
app.post("/api/generate-recipe", async (req, res) => {
  try {
    console.log("Generate recipe request received:", req.body);
    const { preferences } = req.body;

    // If user wants a chef recipe instead of ingredient-based generation
    if (preferences && preferences.mode === 'chef-recipe' && preferences.chefRecipeId) {
      try {
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
            protein: chefRecipe.ingredients.find(ing => ing.name.toLowerCase().includes('chicken') || ing.name.toLowerCase().includes('beef') || ing.name.toLowerCase().includes('pork') || ing.name.toLowerCase().includes('fish') || ing.name.toLowerCase().includes('tofu')),
            vegetable: chefRecipe.ingredients.find(ing => ing.name.toLowerCase().includes('vegetable') || ing.name.toLowerCase().includes('carrot') || ing.name.toLowerCase().includes('onion')),
            carb: chefRecipe.ingredients.find(ing => ing.name.toLowerCase().includes('rice') || ing.name.toLowerCase().includes('pasta') || ing.name.toLowerCase().includes('bread')),
            sauce: chefRecipe.ingredients.find(ing => ing.name.toLowerCase().includes('sauce') || ing.name.toLowerCase().includes('oil')),
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
      } catch (chefRecipeError) {
        console.error("Error processing chef recipe:", chefRecipeError);
        return res.status(500).json({
          error: "Failed to process chef recipe",
          details: chefRecipeError.message
        });
      }
    }

    // Original ingredient-based recipe generation logic
    const { userIngredients = [], dietaryRestrictions = '', cuisinePreference = '', proteinPreference = '' } = preferences || {};

    console.log('Generating recipe with preferences:', preferences);

    // Fetch recipe components from database with better error handling
    let proteins, vegetables, carbs, sauces, cookingMethods;
    
    try {
      [proteins, vegetables, carbs, sauces, cookingMethods] = await Promise.all([
        RecipeComponent.find({ type: 'protein' }),
        RecipeComponent.find({ type: 'vegetable' }),
        RecipeComponent.find({ type: 'carb' }),
        RecipeComponent.find({ $or: [{ type: 'sauce' }, { type: 'sauce_base' }] }), // Handle both possible types
        RecipeComponent.find({ type: 'cooking_method' })
      ]);

      console.log('Database query results:', {
        proteins: proteins.length,
        vegetables: vegetables.length,
        carbs: carbs.length,
        sauces: sauces.length,
        cookingMethods: cookingMethods.length
      });

    } catch (dbError) {
      console.error("Database query error:", dbError);
      return res.status(500).json({
        error: "Database query failed",
        details: dbError.message
      });
    }

    // Check if we have sufficient data, provide fallbacks if needed
    if (!proteins.length) {
      proteins = [{ name: 'Chicken Breast', type: 'protein' }, { name: 'Tofu', type: 'protein' }, { name: 'Salmon', type: 'protein' }];
    }
    if (!vegetables.length) {
      vegetables = [{ name: 'Broccoli', type: 'vegetable' }, { name: 'Bell Peppers', type: 'vegetable' }, { name: 'Carrots', type: 'vegetable' }];
    }
    if (!carbs.length) {
      carbs = [{ name: 'Rice', type: 'carb' }, { name: 'Pasta', type: 'carb' }, { name: 'Quinoa', type: 'carb' }];
    }
    if (!sauces.length) {
      sauces = [{ name: 'Olive Oil', type: 'sauce' }, { name: 'Soy Sauce', type: 'sauce' }, { name: 'Tomato Sauce', type: 'sauce' }];
    }
    if (!cookingMethods.length) {
      cookingMethods = [{ name: 'Sauté', type: 'cooking_method' }, { name: 'Bake', type: 'cooking_method' }, { name: 'Grill', type: 'cooking_method' }];
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
    console.error("Full error:", err);
    res.status(500).json({
      error: "Failed to generate recipe",
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get all chef recipes (public endpoint)
app.get("/api/chef-recipes", optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, sort = 'newest' } = req.query;
    let query = {};

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
    if (!recipe.isPublic && !(req.user && (req.user._id.toString() === recipe.chefId._id.toString() || req.user.role === 'admin'))) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Increment views (but not for the recipe owner)
    if (req.user && req.user._id.toString() !== recipe.chefId._id.toString()) {
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
      chefId: req.user._id,
    };

    const newRecipe = new ChefRecipe(recipeData);
    await newRecipe.save();

    const populatedRecipe = await ChefRecipe.findById(newRecipe._id)
      .populate('chefId', 'name email role chefProfile');

    // Update chef statistics
    await req.user.updateChefStats();

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

    // Update recipe fields
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

    res.status(200).json({
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
    const recipe = await ChefRecipe.findByIdAndDelete(req.params.id);

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

    // Update chef statistics
    await req.user.updateChefStats();

    res.status(200).json({
      success: true,
      message: "Recipe deleted successfully!"
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting recipe"
    });
  }
});

// POST rate a chef recipe (authenticated users only)
app.post("/api/chef-recipes/:id/rate", authenticateToken, async (req, res) => {
  try {
    const { rating, review } = req.body;

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
      return res.status(403).json({
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

    res.status(200).json({
      success: true,
      message: "Recipe rated successfully!",
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

    res.status(200).json({
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
    const { page = 1, limit = 20, category, sort = 'newest' } = req.query;
    let query = { chefId: req.params.id, isPublic: true, status: 'approved' };

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
    console.error("Error fetching chef's recipes:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching your recipes"
    });
  }
});

// GET meal plans (protected - user's own meal plans)
app.get("/api/meal-plans", authenticateToken, async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ userId: req.user._id })
      .populate({
        path: 'meals',
        populate: {
          path: 'recipeId',
          model: 'ChefRecipe'
        }
      })
      .sort({ scheduledDate: 1 });

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

    const newMealPlan = new MealPlan({
      name: name.trim(),
      description,
      planType,
      userId: req.user._id,
    });

    await newMealPlan.save();

    // Add meal plan to user's meal plans
    await User.findByIdAndUpdate(req.user._id, {
      $push: { mealPlans: newMealPlan._id }
    });

    res.status(201).json(newMealPlan);
  } catch (err) {
    console.error("Error creating meal plan:", err.message);
    res.status(500).send("Server Error creating meal plan");
  }
});

// POST add recipe to meal plan (protected)
app.post("/api/meal-plans/:planId/add-recipe", authenticateToken, async (req, res) => {
  try {
    const { planId } = req.params;
    const { recipeId, mealType = "dinner" } = req.body;

    if (!recipeId) {
      return res.status(400).json({ message: "Recipe ID is required." });
    }

    const mealPlan = await MealPlan.findOne({ _id: planId, userId: req.user._id });

    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found or access denied." });
    }

    const newMeal = new Meal({
      recipeId,
      mealType,
      userId: req.user._id,
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

// POST remove recipe from meal plan (protected)
app.post("/api/meal-plans/:planId/remove-recipe", authenticateToken, async (req, res) => {
  try {
    const { planId } = req.params;
    const { recipeId } = req.body;

    const mealPlan = await MealPlan.findOne({ _id: planId, userId: req.user._id });

    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found or access denied." });
    }

    // Find the meal entry to remove
    const mealToRemove = await Meal.findOne({ recipeId, _id: { $in: mealPlan.meals } });

    if (!mealToRemove) {
      return res.status(404).json({ message: "Recipe not found in this meal plan." });
    }

    // Remove from meal plan's meals array
    mealPlan.meals = mealPlan.meals.filter(mealId => !mealId.equals(mealToRemove._id));
    await mealPlan.save();

    // Delete the meal entry itself
    await Meal.findByIdAndDelete(mealToRemove._id);

    res.status(200).json({ message: "Recipe removed from meal plan successfully!", mealPlan });
  } catch (err) {
    console.error("Error removing recipe from meal plan:", err.message);
    res.status(500).send("Server Error removing recipe from meal plan");
  }
});

// DELETE meal plan (protected)
app.delete("/api/meal-plans/:planId", authenticateToken, async (req, res) => {
  try {
    const { planId } = req.params;

    const mealPlan = await MealPlan.findOne({ _id: planId, userId: req.user._id });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found or access denied."
      });
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

    res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully!"
    });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    res.status(500).send("Server Error deleting meal plan");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Smart DishCraft API with Chef Recipes is ready!`);
});
