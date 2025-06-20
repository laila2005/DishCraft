const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors"); // Import the cors package
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent"); // Make sure this is imported if you plan to use it later

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
// Allow requests from your frontend origin (e.g., http://localhost:3000 )
// For production, replace '*' with your actual frontend domain (e.g., 'https://your-frontend-domain.com' )
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
