const mongoose = require("mongoose");

const mealPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Meal plan name is required"],
    trim: true,
    maxlength: [100, "Meal plan name cannot exceed 100 characters"]
  },
  
  // Link to user who owns this meal plan
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Description of the meal plan
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"],
    default: ""
  },
  
  // Meals in this plan
  meals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meal"
  }],
  
  // Plan settings
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  
  // Plan status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Plan type (weekly, monthly, custom)
  planType: {
    type: String,
    enum: ["weekly", "monthly", "custom"],
    default: "weekly"
  },
  
  // Nutritional goals (for future features)
  nutritionalGoals: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  
  // Tags for organization
  tags: [String],
  
  // Sharing settings
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    permission: {
      type: String,
      enum: ["view", "edit"],
      default: "view"
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
mealPlanSchema.index({ userId: 1 });
mealPlanSchema.index({ userId: 1, isActive: 1 });
mealPlanSchema.index({ startDate: 1, endDate: 1 });

// Virtual for meal count
mealPlanSchema.virtual('mealCount').get(function() {
  return this.meals ? this.meals.length : 0;
});

// Instance method to check if user has access
mealPlanSchema.methods.hasAccess = function(userId, permission = 'view') {
  // Owner has full access
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Check if plan is public for view access
  if (permission === 'view' && this.isPublic) {
    return true;
  }
  
  // Check shared permissions
  const sharedAccess = this.sharedWith.find(share => 
    share.userId.toString() === userId.toString()
  );
  
  if (sharedAccess) {
    if (permission === 'view') return true;
    if (permission === 'edit' && sharedAccess.permission === 'edit') return true;
  }
  
  return false;
};

// Static method to find user's meal plans
mealPlanSchema.statics.findByUser = function(userId, includeShared = false) {
  const query = { userId };
  
  if (includeShared) {
    query.$or = [
      { userId },
      { 'sharedWith.userId': userId },
      { isPublic: true }
    ];
  }
  
  return this.find(query).populate('meals').sort({ createdAt: -1 });
};

// Ensure virtual fields are serialized
mealPlanSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("MealPlan", mealPlanSchema);
