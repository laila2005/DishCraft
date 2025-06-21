const mongoose = require("mongoose");

const chefRecipeSchema = new mongoose.Schema({
  // Basic recipe information
  title: {
    type: String,
    required: [true, "Recipe title is required"],
    trim: true,
    maxlength: [200, "Recipe title cannot exceed 200 characters"]
  },
  
  description: {
    type: String,
    required: [true, "Recipe description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  
  // Chef who created this recipe
  chefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Recipe details
  ingredients: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      default: ""
    },
    notes: {
      type: String,
      default: ""
    }
  }],
  
  instructions: [{
    stepNumber: {
      type: Number,
      required: true
    },
    instruction: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String, // e.g., "5 minutes"
      default: ""
    },
    temperature: {
      type: String, // e.g., "350°F"
      default: ""
    }
  }],
  
  // Recipe metadata
  category: {
    type: String,
    enum: [
      "appetizer", "main-course", "dessert", "soup", "salad", 
      "breakfast", "lunch", "dinner", "snack", "beverage",
      "side-dish", "sauce", "marinade"
    ],
    required: true
  },
  
  cuisine: {
    type: String,
    enum: [
      "italian", "mexican", "asian", "american", "mediterranean", 
      "indian", "french", "chinese", "japanese", "thai", 
      "greek", "spanish", "middle-eastern", "african", "fusion"
    ],
    required: true
  },
  
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },
  
  // Timing information
  prepTime: {
    type: Number, // in minutes
    required: true,
    min: [1, "Prep time must be at least 1 minute"]
  },
  
  cookTime: {
    type: Number, // in minutes
    required: true,
    min: [1, "Cook time must be at least 1 minute"]
  },
  
  totalTime: {
    type: Number, // in minutes (calculated)
    default: function() {
      return this.prepTime + this.cookTime;
    }
  },
  
  servings: {
    type: Number,
    required: true,
    min: [1, "Must serve at least 1 person"],
    max: [50, "Cannot serve more than 50 people"]
  },
  
  // Dietary information
  dietaryTags: [{
    type: String,
    enum: [
      "vegetarian", "vegan", "gluten-free", "dairy-free", 
      "nut-free", "low-carb", "keto", "paleo", "low-sodium",
      "high-protein", "low-fat", "sugar-free"
    ]
  }],
  
  // Nutritional information (optional)
  nutrition: {
    calories: {
      type: Number,
      min: 0
    },
    protein: {
      type: Number,
      min: 0
    },
    carbs: {
      type: Number,
      min: 0
    },
    fat: {
      type: Number,
      min: 0
    },
    fiber: {
      type: Number,
      min: 0
    },
    sugar: {
      type: Number,
      min: 0
    },
    sodium: {
      type: Number,
      min: 0
    }
  },
  
  // Recipe status and moderation
  status: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "pending"
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  ratings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    review: {
      type: String,
      maxlength: [500, "Review cannot exceed 500 characters"]
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Recipe media
  images: [{
    url: String,
    caption: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  
  videoUrl: {
    type: String,
    default: ""
  },
  
  // Recipe tips and notes
  chefNotes: {
    type: String,
    maxlength: [1000, "Chef notes cannot exceed 1000 characters"],
    default: ""
  },
  
  tips: [{
    type: String,
    maxlength: [200, "Tip cannot exceed 200 characters"]
  }],
  
  // Equipment needed
  equipment: [{
    type: String,
    trim: true
  }],
  
  // Recipe variations
  variations: [{
    name: String,
    description: String,
    ingredientChanges: String
  }],
  
  // SEO and discovery
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Recipe source and attribution
  originalSource: {
    type: String,
    default: ""
  },
  
  inspiration: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chefRecipeSchema.index({ chefId: 1 });
chefRecipeSchema.index({ category: 1 });
chefRecipeSchema.index({ cuisine: 1 });
chefRecipeSchema.index({ difficulty: 1 });
chefRecipeSchema.index({ status: 1 });
chefRecipeSchema.index({ isPublic: 1 });
chefRecipeSchema.index({ isFeatured: 1 });
chefRecipeSchema.index({ createdAt: -1 });
chefRecipeSchema.index({ "ratings.rating": 1 });
chefRecipeSchema.index({ views: -1 });

// Compound indexes
chefRecipeSchema.index({ category: 1, cuisine: 1 });
chefRecipeSchema.index({ chefId: 1, status: 1 });
chefRecipeSchema.index({ isPublic: 1, status: 1 });

// Virtual for average rating
chefRecipeSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10; // Round to 1 decimal
});

// Virtual for total likes
chefRecipeSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for total ratings
chefRecipeSchema.virtual('ratingsCount').get(function() {
  return this.ratings.length;
});

// Virtual for formatted total time
chefRecipeSchema.virtual('formattedTotalTime').get(function() {
  const hours = Math.floor(this.totalTime / 60);
  const minutes = this.totalTime % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Pre-save middleware to calculate total time
chefRecipeSchema.pre('save', function(next) {
  this.totalTime = this.prepTime + this.cookTime;
  next();
});

// Instance method to add a rating
chefRecipeSchema.methods.addRating = function(userId, rating, review = '') {
  // Remove existing rating from this user
  this.ratings = this.ratings.filter(r => !r.userId.equals(userId));
  
  // Add new rating
  this.ratings.push({
    userId,
    rating,
    review,
    ratedAt: new Date()
  });
  
  return this.save();
};

// Instance method to add a like
chefRecipeSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.userId.equals(userId));
  
  if (existingLike) {
    // Remove like
    this.likes = this.likes.filter(like => !like.userId.equals(userId));
  } else {
    // Add like
    this.likes.push({
      userId,
      likedAt: new Date()
    });
  }
  
  return this.save();
};

// Instance method to increment views
chefRecipeSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to find recipes by chef
chefRecipeSchema.statics.findByChef = function(chefId, options = {}) {
  const query = { chefId, status: 'approved', isPublic: true };
  
  if (options.category) query.category = options.category;
  if (options.cuisine) query.cuisine = options.cuisine;
  if (options.difficulty) query.difficulty = options.difficulty;
  
  return this.find(query)
    .populate('chefId', 'name email role chefProfile')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20);
};

// Static method to find featured recipes
chefRecipeSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    status: 'approved', 
    isPublic: true 
  })
    .populate('chefId', 'name email role chefProfile')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to search recipes
chefRecipeSchema.statics.searchRecipes = function(searchTerm, options = {}) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  const query = {
    status: 'approved',
    isPublic: true,
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { 'ingredients.name': searchRegex }
    ]
  };
  
  if (options.category) query.category = options.category;
  if (options.cuisine) query.cuisine = options.cuisine;
  if (options.difficulty) query.difficulty = options.difficulty;
  
  return this.find(query)
    .populate('chefId', 'name email role chefProfile')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20);
};

// Ensure virtual fields are serialized
chefRecipeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("ChefRecipe", chefRecipeSchema);
