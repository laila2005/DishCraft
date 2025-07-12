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
    'https://dishcraft-frontend.onrender.com'
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

// Import and use all your existing routes here
// You'll need to copy all your route handlers from server.js

// Example route structure (you'll need to add all your actual routes):
app.get('/api/ingredients', async (req, res) => {
  try {
    await ensureDBConnection();
    const ingredients = await Ingredient.find({});
    res.json({ data: ingredients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add all your other routes here...

// Fallback
app.get('/api', (req, res) => {
  res.json({ message: '🚀 DishCraft API is running on Vercel' });
});

// Export for Vercel
module.exports = app; 