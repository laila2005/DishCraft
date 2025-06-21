const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Basic user information
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false // Don't include password in queries by default
  },
  
  // User role and type
  role: {
    type: String,
    enum: ["user", "chef", "admin"],
    default: "user"
  },
  
  // User preferences
  dietaryPreferences: {
    type: [String],
    enum: ["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free", "low-carb", "keto"],
    default: []
  },
  cuisinePreferences: {
    type: [String],
    enum: ["italian", "mexican", "asian", "american", "mediterranean", "indian", "french"],
    default: []
  },
  
  // Profile information
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
    default: ""
  },
  profileImage: {
    type: String,
    default: ""
  },
  
  // Chef-specific fields (for future chef functionality)
  isChef: {
    type: Boolean,
    default: false
  },
  chefProfile: {
    specialties: [String],
    experience: String,
    certifications: [String],
    socialMedia: {
      instagram: String,
      youtube: String,
      website: String
    }
  },
  
  // User activity tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Meal plans reference
  mealPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "MealPlan"
  }],
  
  // Favorite recipes (for future functionality)
  favoriteRecipes: [{
    recipeId: String,
    recipeName: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre("save", async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model("User", userSchema);
