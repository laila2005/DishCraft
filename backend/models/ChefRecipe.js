const mongoose = require("mongoose");


// Enhanced and improved ChefRecipe schema with indexes for performance
const chefRecipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Recipe name is required"],
    trim: true,
    maxlength: [200, "Recipe name cannot exceed 200 characters"]
  },
  description: {
    type: String,
    required: [true, "Recipe description is required"],
    trim: true,
    maxlength: [2000, "Description cannot exceed 2000 characters"]
  },
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  image: {
    type: String,
    default: ""
  },
  gallery: [{ type: String }], // Multiple images
  ingredients: [{
    name: { type: String, required: true, trim: true },
    quantity: { type: String, required: true },
    unit: { type: String, default: "" },
    notes: { type: String, default: "" }
  }],
  instructions: [{
    stepNumber: { type: Number, required: true },
    instruction: { type: String, required: true, trim: true },
    duration: { type: String, default: "" },
    image: { type: String, default: "" }
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  ratings: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, value: { type: Number, min: 1, max: 5 } }],
  feedbacks: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 },
    reply: { type: String, default: "" }
  }],
  category: {
    type: String,
    enum: [
      "appetizer", "main-course", "dessert", "soup", "salad", 
      "breakfast", "lunch", "dinner", "snack", "beverage",
      "side-dish", "sauce", "marinade", "other"
    ],
    required: true
  },
  cuisine: {
    type: String,
    enum: [
      "italian", "mexican", "asian", "american", "mediterranean", 
      "indian", "french", "chinese", "japanese", "thai", 
      "greek", "spanish", "middle-eastern", "african", "fusion", "other"
    ],
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },
  prepTime: {
    type: Number,
    required: true,
    min: [1, "Prep time must be at least 1 minute"]
  },
  cookTime: {
    type: Number,
    required: true,
    min: [1, "Cook time must be at least 1 minute"]
  },
  totalTime: {
    type: Number,
    default: function() {
      return this.prepTime + this.cookTime;
    }
  },
  servings: {
    type: Number,
    required: true,
    min: [1, "Must serve at least 1 person"],
    max: [100, "Cannot serve more than 100 people"]
  },
  dietaryTags: [{
    type: String,
    enum: [
      "vegetarian", "vegan", "gluten-free", "dairy-free", 
      "nut-free", "low-carb", "keto", "paleo", "low-sodium",
      "high-protein", "low-fat", "sugar-free", "halal", "kosher"
    ]
  }],
  nutrition: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 },
    cholesterol: { type: Number, min: 0 },
    saturatedFat: { type: Number, min: 0 }
  },
  status: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "pending"
  },
  isPublic: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  videoUrl: { type: String, default: "" },
  sourceUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

}, {
  timestamps: true
});

// Indexes for performance
chefRecipeSchema.index({ chef: 1 });
chefRecipeSchema.index({ category: 1 });
chefRecipeSchema.index({ cuisine: 1 });
chefRecipeSchema.index({ isFeatured: 1 });
chefRecipeSchema.index({ isPublic: 1 });
chefRecipeSchema.index({ name: 'text', description: 'text' });

// Virtual for chef's recipe count (for dashboard)
chefRecipeSchema.virtual('chefRecipeCount').get(function() {
  // This is a placeholder; actual aggregation should be done in controller/query
  return undefined;
});

module.exports = mongoose.model("ChefRecipe", chefRecipeSchema);