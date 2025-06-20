const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Ingredient = require("./models/Ingredient"); // Import the Ingredient model

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    // Exit process with failure
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
    const ingredients = await Ingredient.find().sort({ name: 1 }); // Sort by name
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
