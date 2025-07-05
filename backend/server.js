require('dotenv').config(); // Load environment variables at the very top
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const sendEmail = require('./utils/sendEmail');
const bcrypt = require("bcryptjs");
//dotenv.config();

// Import models
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");
// const Meal = require("./models/Meal");
// const MealPlan = require("./models/MealPlan");
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


// --- Image Upload Endpoint ---
const path = require('path');
const multer = require('multer');

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Image upload endpoint
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded.' });
  }
  // Return the public URL to the uploaded image
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ imageUrl });
});

// Enhanced recipe generation with rule-based system (returns 3 suggestions)
const generateRecipe = async (req, res) => {
  const { ingredients, cookingMethod, cuisine, difficulty, prepTime } = req.body;

  // Basic validation
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: "Ingredients are required." });
  }

  try {
    // Fetch all available ingredients from the database
    const availableIngredients = await Ingredient.find({});
    const availableIngredientNames = availableIngredients.map(ing => ing.name.toLowerCase());

    // Identify missing ingredients
    const missingIngredients = ingredients.filter(ing => !availableIngredientNames.includes(ing.toLowerCase()));

    // Helper functions
    const adjectives = ["Delicious", "Savory", "Flavorful", "Aromatic", "Perfect", "Zesty", "Hearty", "Fresh"];
    const cookingMethods = cookingMethod ? [cookingMethod] : ["Baking", "Frying", "Boiling", "Roasting", "Grilling", "Steaming", "Stewing", "Braising", "Poaching", "Sautéing", "Stir-frying"];
    const cuisines = cuisine ? [cuisine] : ["International", "Italian", "Mexican", "Asian", "American", "Mediterranean"];

    const generateRecipeName = (ingredients, cookingMethod, cuisine) => {
      const mainIngredient = ingredients[0] || "Mixed";
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      if (cuisine && cuisine !== "") {
        return `${randomAdjective} ${cuisine} ${cookingMethod} ${mainIngredient}`;
      }
      return `${randomAdjective} ${cookingMethod} ${mainIngredient}`;
    };

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

    // Generate 3 recipe suggestions
    const suggestions = [];
    for (let i = 0; i < 3; i++) {
      const method = cookingMethods[i % cookingMethods.length];
      const cui = cuisines[i % cuisines.length];
      const instructions = generateInstructions(method, ingredients);
      suggestions.push({
        name: generateRecipeName(ingredients, method, cui),
        ingredients: generateIngredientQuantities(ingredients),
        instructions,
        cookingMethod: method,
        cuisine: cui,
        difficulty: difficulty || "Medium",
        prepTime: prepTime || "20-30 minutes",
        missingIngredients,
        servings: "4 people",
        calories: "Approximately 350-450 per serving"
      });
    }

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ message: "Error generating recipe", error: error.message });
  }
};

// Routes

// User authentication routes
app.post("/api/register", async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({
      message: "All fields are required.",
      error: "Missing required fields: email, password, name, or role."
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email.",
        error: "Duplicate email. Please use a different email address.",
        field: "email"
      });
    }

    // 👉  NO manual bcrypt.hash here – the schema’s pre('save') will hash it
    const newUser = new User({
      name: name || email.split("@")[0], // fallback to email prefix
      email,
      password,                          // plain text (will be hashed by hook)
      role
    });

    await newUser.save();
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "User already exists with this email.",
        error: "Duplicate email. Please use a different email address.",
        field: "email"
      });
    }
    res.status(500).json({
      message: "Server error during registration.",
      error: error.message
    });
  }
});


//

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;


  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
      error: "Missing email or password."
    });
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials.",
        error: "No user found with this email.",
        field: "email"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials.",
        error: "Incorrect password.",
        field: "password"
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.status(200).json({
      message: "Logged in successfully.",
      token,
      role: user.role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error logging in.",
      error: error.message
    });
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

// --- User Profile Endpoints ---
// Get user profile (name, email, photo, saved recipes)
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'savedRecipes',
        select: 'name image chef category cuisine',
        populate: { path: 'chef', select: 'name profilePhoto' }
      });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      savedRecipes: user.savedRecipes
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// Update user profile (name, photo)
// Supports both direct URL and file upload (multipart/form-data)
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    let profilePhotoUrl = req.body.profilePhoto;
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      const singleUpload = upload.single('profilePhoto');
      singleUpload(req, res, async function (err) {
        if (err) {
          console.error('Multer error:', err); // <--- Add this line for debugging
          return res.status(400).json({ message: err.message });
        }
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (req.body.name) user.name = req.body.name;
        if (req.file) {
          profilePhotoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
          user.profilePhoto = profilePhotoUrl;
        } else if (req.body.profilePhoto) {
          user.profilePhoto = req.body.profilePhoto;
        }
        await user.save();
        return res.status(200).json({
          message: "Profile updated successfully.",
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePhoto: user.profilePhoto
          }
        });
      });
    } else {
      // JSON body (URL only)
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (req.body.name) user.name = req.body.name;
      if (profilePhotoUrl) user.profilePhoto = profilePhotoUrl;
      await user.save();
      res.status(200).json({
        message: "Profile updated successfully.",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePhoto: user.profilePhoto
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

//forget pass
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${process.env.FRONTEND_URL || 'https://dishcraft-frontend.onrender.com'}/reset-password/${token}`;

    const html = `
      <p>Hello ${user.name || ''},</p>
      <p>Click the link below to reset your password. This link will expire in 1 hour:</p>
      <a href="${resetLink}">${resetLink}</a>
    `;

    const emailSent = await sendEmail({
      to: user.email,
      subject: 'DishCraft Password Reset',
      html
    });

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send reset email" });
    }

    res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});


// Reset password
app.post('/api/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    user.password = password; // will be hashed by the pre-save hook
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ message: "Invalid or expired token" });
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


// Meal and MealPlan features have been removed in favor of the new recipe-centric system.
// All related routes and model imports are deprecated and have been deleted for code clarity and maintainability.

// ...existing code...

// Add or update chef recipe (supports image upload via multipart/form-data or direct URL)
app.post("/api/chef-recipes", authenticateToken, requireChef, async (req, res) => {
  // If multipart/form-data, use multer to handle file
  // Unified handler for both JSON and multipart/form-data
  const isMultipart = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data');
  const handleRecipe = async (body, imageUrl) => {
    try {
      // Parse arrays if sent as strings (for multipart)
      let ingredients = body.ingredients;
      let instructions = body.instructions;
      if (typeof ingredients === 'string') ingredients = JSON.parse(ingredients);
      if (typeof instructions === 'string') instructions = JSON.parse(instructions);

      // Coerce and validate numeric fields
      const prepTime = Number(body.prepTime);
      const cookTime = Number(body.cookTime);
      const servings = Number(body.servings);
      const totalTime = Number(body.totalTime) || (prepTime + cookTime);
      const category = body.category;

      if (!body.name || !category || isNaN(prepTime) || isNaN(cookTime) || isNaN(servings)) {
        return res.status(400).json({ message: 'Missing or invalid required fields.' });
      }

      const newChefRecipe = new ChefRecipe({
        name: body.name,
        description: body.description,
        ingredients,
        instructions,
        cookingMethod: body.cookingMethod,
        cuisine: body.cuisine,
        difficulty: body.difficulty,
        prepTime,
        cookTime,
        totalTime,
        servings,
        category,
        image: imageUrl || body.image,
        chef: req.user._id
      });
      await newChefRecipe.save();
      return res.status(201).json({ message: "Chef recipe added successfully.", chefRecipe: newChefRecipe });
    } catch (error) {
      console.error("Error adding chef recipe:", error);
      return res.status(500).json({ message: "Error adding chef recipe", error: error.message });
    }
  };

  if (isMultipart) {
    const singleUpload = upload.single('image');
    singleUpload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      let imageUrl = req.body.image;
      if (req.file) {
        imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }
      await handleRecipe(req.body, imageUrl);
    });
  } else {
    await handleRecipe(req.body, req.body.image);
  }
});

// Update chef recipe (PUT endpoint for editing)
app.put("/api/chef-recipes/:id", authenticateToken, requireChef, async (req, res) => {
  try {
    console.log("[PUT] Updating recipe:", req.params.id);
    console.log("[PUT] User:", req.user._id);
    console.log("[PUT] Request body:", req.body);
    
    const recipeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      console.log("[PUT] Invalid recipe ID format:", recipeId);
      return res.status(400).json({ message: "Invalid recipe ID format." });
    }

    // Find the recipe and ensure the chef owns it
    const recipe = await ChefRecipe.findById(recipeId);
    if (!recipe) {
      console.log("[PUT] Recipe not found:", recipeId);
      return res.status(404).json({ message: "Recipe not found" });
    }
    console.log("[PUT] Recipe found:", recipe._id, "Owner:", recipe.chef);
    if (recipe.chef.toString() !== req.user._id.toString()) {
      console.log("[PUT] Authorization failed. Recipe owner:", recipe.chef, "User:", req.user._id);
      return res.status(403).json({ message: "You are not authorized to edit this recipe." });
    }

    // Parse arrays if sent as strings
    let ingredients = req.body.ingredients;
    let instructions = req.body.instructions;
    if (typeof ingredients === 'string') ingredients = JSON.parse(ingredients);
    if (typeof instructions === 'string') instructions = JSON.parse(instructions);

    // Coerce and validate numeric fields
    const prepTime = Number(req.body.prepTime);
    const cookTime = Number(req.body.cookTime);
    const servings = Number(req.body.servings);
    const totalTime = Number(req.body.totalTime) || (prepTime + cookTime);

    if (!req.body.name || !req.body.category || isNaN(prepTime) || isNaN(cookTime) || isNaN(servings)) {
      return res.status(400).json({ message: 'Missing or invalid required fields.' });
    }

    // Update the recipe
    console.log("[PUT] Updating recipe with data:", {
      name: req.body.name,
      cookingMethod: req.body.cookingMethod,
      category: req.body.category,
      prepTime,
      cookTime,
      servings
    });
    
    const updatedRecipe = await ChefRecipe.findByIdAndUpdate(
      recipeId,
      {
        name: req.body.name,
        description: req.body.description,
        ingredients,
        instructions,
        cookingMethod: req.body.cookingMethod,
        cuisine: req.body.cuisine,
        difficulty: req.body.difficulty,
        prepTime,
        cookTime,
        totalTime,
        servings,
        category: req.body.category,
        dietaryTags: req.body.dietaryTags || [],
        chefNotes: req.body.chefNotes,
        tips: req.body.tips || [],
        equipment: req.body.equipment || [],
        tags: req.body.tags || []
      },
      { new: true }
    );

    console.log("[PUT] Recipe updated successfully:", updatedRecipe._id);
    res.status(200).json({ 
      message: "Recipe updated successfully.", 
      recipe: updatedRecipe 
    });
  } catch (error) {
    console.error("[PUT] Error updating chef recipe:", error);
    res.status(500).json({ message: "Error updating chef recipe", error: error.message });
  }
});

// --- Enhanced Recipe Actions ---

// Like or unlike a recipe
app.post("/api/chef-recipes/:id/like", authenticateToken, async (req, res) => {
  try {
    const recipe = await ChefRecipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    const userId = req.user._id.toString();
    const liked = recipe.likes.map(id => id.toString()).includes(userId);
    if (liked) {
      recipe.likes = recipe.likes.filter(id => id.toString() !== userId);
    } else {
      recipe.likes.push(req.user._id);
    }
    await recipe.save();
    res.status(200).json({ liked: !liked, likesCount: recipe.likes.length });
  } catch (error) {
    res.status(500).json({ message: "Error liking recipe", error: error.message });
  }
});

// Save or unsave a recipe (fix: ensure ObjectId type and no duplicates)
app.post("/api/chef-recipes/:id/save", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const recipeId = req.params.id;
    // Ensure ObjectId type and no duplicates
    let recipeObjectId;
    try {
      recipeObjectId = new mongoose.Types.ObjectId(recipeId);
    } catch (e) {
      return res.status(400).json({ message: "Invalid recipe ID format." });
    }
    // Check if recipe exists before saving
    const recipe = await ChefRecipe.findById(recipeObjectId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    const alreadySaved = user.savedRecipes.some(id => id.toString() === recipeObjectId.toString());
    if (!alreadySaved) {
      user.savedRecipes.push(recipeObjectId);
      await user.save();
    }
    res.status(200).json({ saved: true, savedRecipes: user.savedRecipes });
  } catch (error) {
    res.status(500).json({ message: "Error saving recipe", error: error.message });
  }
});

// Rate a recipe
app.post("/api/chef-recipes/:id/rate", authenticateToken, async (req, res) => {
  const { value } = req.body;
  if (!value || value < 1 || value > 5) return res.status(400).json({ message: "Rating must be 1-5" });
  try {
    const recipe = await ChefRecipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    const userId = req.user._id.toString();
    // Remove previous rating if exists
    recipe.ratings = recipe.ratings.filter(r => r.user.toString() !== userId);
    recipe.ratings.push({ user: req.user._id, value });
    await recipe.save();
    res.status(200).json({ message: "Recipe rated", ratings: recipe.ratings });
  } catch (error) {
    res.status(500).json({ message: "Error rating recipe", error: error.message });
  }
});

// Add feedback to a recipe
app.post("/api/chef-recipes/:id/feedback", authenticateToken, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Feedback text is required" });
  try {
    const recipe = await ChefRecipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    
    // Add the feedback
    recipe.feedbacks.push({ 
      user: req.user._id, 
      text: text.trim(),
      createdAt: new Date()
    });
    await recipe.save();
    
    // Populate the feedbacks with user names for the response
    const populatedRecipe = await ChefRecipe.findById(req.params.id)
      .populate('feedbacks.user', 'name');
    
    res.status(201).json({ 
      message: "Feedback added", 
      feedbacks: populatedRecipe.feedbacks.map(fb => ({
        text: fb.text,
        userName: fb.user && fb.user.name ? fb.user.name : 'Anonymous User',
        createdAt: fb.createdAt
      }))
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ message: "Error adding feedback", error: error.message });
  }
});

// Get a single recipe by ID (with all details, feedback, chef info)
app.get("/api/chef-recipes/:id", async (req, res) => {
  try {
    const recipe = await ChefRecipe.findById(req.params.id)
      .populate('chef', 'name email')
      .populate('feedbacks.user', 'name email');
    if (!recipe) return res.status(404).json({ message: "Recipe not found", code: "RECIPE_NOT_FOUND" });
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recipe", error: error.message, code: "RECIPE_FETCH_ERROR" });
  }
});

// Get all recipes for a chef (with pagination and sorting)
app.get("/api/chef-recipes", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = "-createdAt" } = req.query;
    const filter = { chef: req.user._id };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ChefRecipe.countDocuments(filter);
    const chefRecipes = await ChefRecipe.find(filter)
      .populate('chef', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    res.status(200).json({
      data: chefRecipes,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching chef recipes:", error);
    res.status(500).json({ message: "Error fetching chef recipes", error: error.message });
  }
});

// Get public/featured recipes with filters, pagination, and sorting
app.get("/api/recipes", async (req, res) => {
  try {
    const { featured, chef, category, cuisine, q, page = 1, limit = 12, sort = "-createdAt" } = req.query;
    let filter = { isPublic: true };
    if (featured === 'true') filter.isFeatured = true;
    if (chef) filter.chef = chef;
    if (category) filter.category = category;
    if (cuisine) filter.cuisine = cuisine;
    if (q) filter.name = { $regex: q, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ChefRecipe.countDocuments(filter);
    const recipes = await ChefRecipe.find(filter)
      .populate('chef', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      data: recipes,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching recipes", error: error.message });
  }
});

// Recipe generation route
app.post("/api/generate-recipe", generateRecipe);


// --- My Recipes Alias Endpoint ---
// Returns all recipes for the logged-in chef (same as /api/chef-recipes)
app.get("/api/my-recipes", authenticateToken, requireChef, async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = "-createdAt" } = req.query;
    const filter = { chef: req.user._id };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ChefRecipe.countDocuments(filter);
    const chefRecipes = await ChefRecipe.find(filter)
      .populate('chef', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    res.status(200).json({
      data: chefRecipes,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching my recipes:", error);
    res.status(500).json({ message: "Error fetching my recipes", error: error.message });
  }
});

// --- Chef Profile Endpoint ---
// Returns chef's name, profile photo, and all their recipes (with ingredients, instructions, ratings, feedbacks, likes)
app.get("/api/chef/profile", authenticateToken, requireChef, async (req, res) => {
  try {
    const chef = await User.findById(req.user._id).select("-password");
    if (!chef) return res.status(404).json({ message: "Chef not found" });
    const recipes = await ChefRecipe.find({ chef: chef._id })
      .populate({ path: "feedbacks.user", select: "name" });
    res.status(200).json({
      _id: chef._id,
      name: chef.name,
      profilePhoto: chef.profilePhoto,
      recipes: recipes.map(r => ({
        _id: r._id,
        name: r.name,
        ingredients: r.ingredients,
        instructions: r.instructions,
        ratings: r.ratings,
        feedbacks: r.feedbacks.map(fb => ({
          text: fb.text,
          userName: fb.user && fb.user.name ? fb.user.name : undefined
        })),
        likedBy: r.likes || []
      }))
    });
  } catch (error) {
    console.error("Error fetching chef profile:", error);
    res.status(500).json({ message: "Error fetching chef profile", error: error.message });
  }
});

// Get user's saved recipes (full details)
app.get("/api/user/saved-recipes", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedRecipes',
      select: 'name description image chef category cuisine prepTime cookTime servings instructions ingredients',
      populate: { path: 'chef', select: 'name profilePhoto' }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ savedRecipes: user.savedRecipes });
  } catch (error) {
    console.error("/api/user/saved-recipes error:", error);
    res.status(500).json({ message: "Error fetching saved recipes", error: error.message });
  }
});

// Save a generated recipe and add to user's savedRecipes
app.post("/api/chef-recipes/save-generated", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const data = req.body;
    // Validate required fields (minimal for generated recipes)
    if (!data.name || !data.ingredients || !data.instructions || !data.cuisine || !data.cookingMethod) {
      return res.status(400).json({ message: "Missing required recipe fields." });
    }
    // Fill in defaults for missing fields
    const chefId = req.user._id;
    const newRecipe = new ChefRecipe({
      name: data.name,
      description: data.description || "No description provided.",
      ingredients: data.ingredients,
      instructions: data.instructions,
      cookingMethod: data.cookingMethod,
      cuisine: data.cuisine,
      difficulty: data.difficulty || "medium",
      prepTime: Number(data.prepTime) || 10,
      cookTime: Number(data.cookTime) || 10,
      totalTime: Number(data.totalTime) || (Number(data.prepTime) || 10) + (Number(data.cookTime) || 10),
      servings: Number(data.servings) || 4,
      category: data.category || "main-course",
      image: data.image || "",
      chef: chefId,
      dietaryTags: data.dietaryTags || [],
      nutrition: data.nutrition || {},
      isPublic: false // Generated recipes saved by users are private by default
    });
    await newRecipe.save();
    // Add to user's savedRecipes only if not already present
    if (!user.savedRecipes.some(id => id.toString() === newRecipe._id.toString())) {
      user.savedRecipes.push(newRecipe._id);
      await user.save();
    }
    res.status(201).json({ message: "Recipe saved to profile!", recipe: newRecipe });
  } catch (error) {
    console.error("Error saving generated recipe:", error);
    res.status(500).json({ message: "Error saving generated recipe", error: error.message });
  }
});

// Unsave/delete a saved recipe from user's savedRecipes
app.delete("/api/user/saved-recipes/:id", authenticateToken, async (req, res) => {
  try {
    let recipeId = req.params.id;
    if (recipeId && typeof recipeId === 'object' && recipeId._id) {
      recipeId = recipeId._id;
    }
    recipeId = String(recipeId);
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: "Invalid recipe ID format.", sent: recipeId });
    }
    // Remove from user's savedRecipes only
    // Fix: Always use 'new' with ObjectId
    const ObjectId = mongoose.Types.ObjectId;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedRecipes: new ObjectId(recipeId) } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Recipe removed from saved recipes", savedRecipes: user.savedRecipes });
  } catch (error) {
    res.status(500).json({ message: "Error removing saved recipe", error: error.message });
  }
});

// Delete a chef's recipe (and remove from all users' savedRecipes)
app.delete("/api/chef-recipes/:id", authenticateToken, requireChef, async (req, res) => {
  try {
    const recipeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: "Invalid recipe ID format." });
    }
    // Only allow the chef who owns the recipe to delete it
    const recipe = await ChefRecipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    if (recipe.chef.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this recipe." });
    }
    // Remove recipe from all users' savedRecipes
    await User.updateMany(
      { savedRecipes: mongoose.Types.ObjectId(recipeId) },
      { $pull: { savedRecipes: mongoose.Types.ObjectId(recipeId) } }
    );
    // Delete the recipe document
    await ChefRecipe.deleteOne({ _id: recipeId });
    res.status(200).json({ message: "Recipe deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting recipe", error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
