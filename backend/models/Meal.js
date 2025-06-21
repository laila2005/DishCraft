const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  recipeTitle: {
    type: String,
    required: [true, "Recipe title is required"],
    trim: true,
    maxlength: [200, "Recipe title cannot exceed 200 characters"]
  },
  
  // Full recipe details
  recipeDetails: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Meal type
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    default: "dinner"
  },
  
  // Link to user who owns this meal
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Scheduled date for this meal
  scheduledDate: {
    type: Date,
    default: Date.now
  },
  
  // Meal status
  status: {
    type: String,
    enum: ["planned", "prepared", "completed", "skipped"],
    default: "planned"
  },
  
  // Serving information
  servings: {
    planned: {
      type: Number,
      default: 4
    },
    actual: {
      type: Number
    }
  },
  
  // User notes about this meal
  notes: {
    type: String,
    maxlength: [500, "Notes cannot exceed 500 characters"],
    default: ""
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Preparation time tracking
  prepTime: {
    estimated: String,
    actual: Number // in minutes
  },
  
  // Nutritional information (if available)
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  
  // Shopping list for missing ingredients
  shoppingList: [{
    ingredient: String,
    quantity: String,
    purchased: {
      type: Boolean,
      default: false
    }
  }],
  
  // Tags for organization
  tags: [String]
}, {
  timestamps: true
});

// Index for faster queries
mealSchema.index({ userId: 1 });
mealSchema.index({ userId: 1, scheduledDate: 1 });
mealSchema.index({ mealType: 1, scheduledDate: 1 });
mealSchema.index({ status: 1 });

// Virtual for formatted scheduled date
mealSchema.virtual('formattedDate').get(function() {
  return this.scheduledDate.toLocaleDateString();
});

// Instance method to mark as completed
mealSchema.methods.markCompleted = function(rating, notes) {
  this.status = 'completed';
  if (rating) this.rating = rating;
  if (notes) this.notes = notes;
  return this.save();
};

// Static method to find user's meals
mealSchema.statics.findByUser = function(userId, dateRange = {}) {
  const query = { userId };
  
  if (dateRange.start || dateRange.end) {
    query.scheduledDate = {};
    if (dateRange.start) query.scheduledDate.$gte = dateRange.start;
    if (dateRange.end) query.scheduledDate.$lte = dateRange.end;
  }
  
  return this.find(query).sort({ scheduledDate: 1 });
};

// Ensure virtual fields are serialized
mealSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("Meal", mealSchema);
