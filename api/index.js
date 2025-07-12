const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Import models
const Ingredient = require('../backend/models/Ingredient');
const RecipeComponent = require('../backend/models/RecipeComponent');
const User = require('../backend/models/User');
const ChefRecipe = require('../backend/models/ChefRecipe');

// Import middleware
const { authenticateToken, requireChef, requireAdmin, optionalAuth } = require('../backend/middleware/authMiddleware');

// Import utilities
const sendEmail = require('../backend/utils/sendEmail');

const app = express();

// CORS Configuration for Vercel
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://dish-craft-a6mh.vercel.app',
    'https://dishcraft-frontend.onrender.com',
    'https://dish-craft-e8ys6yf70-laila-mohameds-projects.vercel.app'
  ],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    throw err;
  }
};

// Initialize database connection
let dbConnected = false;
const ensureDBConnection = async () => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await ensureDBConnection();
    res.json({ status: 'OK', message: 'DishCraft API is running' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

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
    await ensureDBConnection();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email.",
        error: "Duplicate email. Please use a different email address.",
        field: "email"
      });
    }

    const newUser = new User({
      name: name || email.split("@")[0],
      email,
      password,
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

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
      error: "Missing email or password."
    });
  }

  try {
    await ensureDBConnection();
    
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

// Auth check endpoint
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    await ensureDBConnection();
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data." });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  res.json({ message: "Logged out successfully." });
});

// Ingredients routes
app.get("/api/ingredients", async (req, res) => {
  try {
    await ensureDBConnection();
    const ingredients = await Ingredient.find({});
    res.json({ data: ingredients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Recipe generation route
app.post("/api/generate-recipe", async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: "Ingredients are required." });
  }

  try {
    await ensureDBConnection();
    
    // Fetch all available ingredients from the database
    const availableIngredients = await Ingredient.find({});
    const availableIngredientNames = availableIngredients.map(ing => ing.name.toLowerCase());

    // Identify missing ingredients
    const missingIngredients = ingredients.filter(ing => !availableIngredientNames.includes(ing.toLowerCase()));

    // Helper functions
    const adjectives = ["Delicious", "Savory", "Flavorful", "Aromatic", "Perfect", "Zesty", "Hearty", "Fresh"];
    const cookingMethods = ["Baking", "Frying", "Boiling", "Roasting", "Grilling", "Steaming", "Stewing", "Braising", "Poaching", "Sautéing", "Stir-frying"];
    const cuisines = ["International", "Italian", "Mexican", "Asian", "American", "Mediterranean"];

    const generateRecipeName = (ingredients, cookingMethod, cuisine) => {
      const mainIngredient = ingredients[0] || "Mixed";
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      return `${randomAdjective} ${cuisine} ${cookingMethod} ${mainIngredient}`;
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

    const generateInstructions = (cookingMethod, ingredients) => {
      let instructions = [];
      switch (cookingMethod) {
        case "Baking":
          instructions = [
            "Preheat oven to 375°F (190°C).",
            "Lightly grease a baking dish with butter or cooking spray.",
            "Combine all dry ingredients in a large bowl, whisking to ensure no lumps.",
            "In a separate bowl, mix all wet ingredients until well combined.",
            "Gradually add the wet ingredients to the dry ingredients, mixing until just combined.",
            "Pour the batter or mixture into the prepared baking dish, spreading evenly.",
            "Bake for 25-35 minutes, or until golden brown and a toothpick inserted into the center comes out clean.",
            "Let cool on a wire rack for at least 10 minutes before serving."
          ];
          break;
        case "Frying":
          instructions = [
            "Heat 2 tablespoons of oil in a large skillet or frying pan over medium-high heat.",
            "Carefully add the ingredients to the hot oil in a single layer, ensuring not to overcrowd the pan.",
            "Fry for 3-5 minutes per side, or until golden brown and cooked through.",
            "Remove from pan and place on a plate lined with paper towels to drain excess oil.",
            "Season with salt and pepper to taste and serve immediately."
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
        difficulty: "Medium",
        prepTime: "20-30 minutes",
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
});

// Chef recipes routes
app.get("/api/recipes", async (req, res) => {
  try {
    await ensureDBConnection();
    const { isPublic, limit = 10 } = req.query;
    let query = {};
    
    if (isPublic === 'true') {
      query.isPublic = true;
    }
    
    const recipes = await ChefRecipe.find(query)
      .populate('chef', 'name email')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.json({ data: recipes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Contact form route
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    await ensureDBConnection();
    
    // Send email using your email service
    const emailContent = `
      Name: ${name}
      Email: ${email}
      Message: ${message}
    `;

    // You can implement email sending here using your email service
    console.log('Contact form submission:', { name, email, message });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Failed to send message." });
  }
});

// Fallback
app.get('/api', (req, res) => {
  res.json({ message: '🚀 DishCraft API is running on Vercel' });
});

// Export for Vercel
module.exports = app; 