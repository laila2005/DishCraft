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
    select: false
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
  location: {
    type: String,
    maxlength: [100, "Location cannot exceed 100 characters"],
    default: ""
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // ENHANCED: Chef-specific profile fields
  chefProfile: {
    // Professional information
    professionalTitle: {
      type: String,
      maxlength: [100, "Professional title cannot exceed 100 characters"],
      default: ""
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    specialties: [{
      type: String,
      enum: [
        "italian", "mexican", "asian", "american", "mediterranean", 
        "indian", "french", "chinese", "japanese", "thai", 
        "greek", "spanish", "middle-eastern", "african", "fusion",
        "baking", "pastry", "grilling", "vegetarian", "vegan"
      ]
    }],
    
    // Chef credentials and achievements
    certifications: [{
      name: String,
      institution: String,
      year: Number
    }],
    awards: [{
      name: String,
      year: Number,
      description: String
    }],
    
    // Work experience
    workExperience: [{
      restaurantName: String,
      position: String,
      startYear: Number,
      endYear: Number,
      description: String
    }],
    
    // Social media and contact
    socialMedia: {
      instagram: {
        type: String,
        default: ""
      },
      twitter: {
        type: String,
        default: ""
      },
      facebook: {
        type: String,
        default: ""
      },
      youtube: {
        type: String,
        default: ""
      },
      tiktok: {
        type: String,
        default: ""
      },
      website: {
        type: String,
        default: ""
      }
    },
    
    // Chef verification and status
    isVerifiedChef: {
      type: Boolean,
      default: false
    },
    verificationDate: {
      type: Date
    },
    verificationDocuments: [{
      type: String, // URLs to verification documents
    }],
    
    // Chef statistics
    totalRecipes: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    
    // Chef preferences and settings
    allowMessages: {
      type: Boolean,
      default: true
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showLocation: {
      type: Boolean,
      default: true
    },
    
    // Featured content
    featuredRecipes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChefRecipe"
    }],
    
    // Chef subscription/premium features
    isPremiumChef: {
      type: Boolean,
      default: false
    },
    premiumExpiryDate: {
      type: Date
    }
  },
  
  // User activity tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // User relationships
  following: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // User meal plans (existing)
  mealPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "MealPlan"
  }],
  
  // User favorite recipes
  favoriteRecipes: [{
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChefRecipe"
    },
    recipeName: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  
  // User recipe collections
  recipeCollections: [{
    name: String,
    description: String,
    recipes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChefRecipe"
    }],
    isPublic: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "chefProfile.isVerifiedChef": 1 });
userSchema.index({ "chefProfile.specialties": 1 });
userSchema.index({ "chefProfile.averageRating": -1 });
userSchema.index({ "chefProfile.totalRecipes": -1 });

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
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

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  delete userObject.chefProfile?.verificationDocuments;
  return userObject;
};

// Instance method to get chef public profile
userSchema.methods.getChefPublicProfile = function() {
  const profile = this.getPublicProfile();
  
  if (this.role !== 'chef') {
    delete profile.chefProfile;
  } else {
    // Only show public chef information
    if (profile.chefProfile) {
      delete profile.chefProfile.verificationDocuments;
      if (!profile.chefProfile.showEmail) {
        delete profile.email;
      }
      if (!profile.chefProfile.showLocation) {
        delete profile.location;
      }
    }
  }
  
  return profile;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find verified chefs
userSchema.statics.findVerifiedChefs = function(options = {}) {
  const query = {
    role: 'chef',
    isActive: true,
    'chefProfile.isVerifiedChef': true
  };
  
  if (options.specialties && options.specialties.length > 0) {
    query['chefProfile.specialties'] = { $in: options.specialties };
  }
  
  return this.find(query)
    .select('-password')
    .sort(options.sort || { 'chefProfile.averageRating': -1, 'chefProfile.totalRecipes': -1 })
    .limit(options.limit || 20);
};

// Static method to find popular chefs
userSchema.statics.findPopularChefs = function(limit = 10) {
  return this.find({
    role: 'chef',
    isActive: true,
    'chefProfile.totalRecipes': { $gt: 0 }
  })
    .select('-password')
    .sort({ 
      'chefProfile.totalViews': -1, 
      'chefProfile.averageRating': -1,
      'chefProfile.totalRecipes': -1 
    })
    .limit(limit);
};

// Instance method to update chef statistics
userSchema.methods.updateChefStats = async function() {
  if (this.role !== 'chef') return;
  
  const ChefRecipe = mongoose.model('ChefRecipe');
  
  // Get chef's recipes
  const recipes = await ChefRecipe.find({ 
    chefId: this._id, 
    status: 'approved' 
  });
  
  // Calculate statistics
  const totalRecipes = recipes.length;
  const totalViews = recipes.reduce((sum, recipe) => sum + recipe.views, 0);
  const totalLikes = recipes.reduce((sum, recipe) => sum + recipe.likes.length, 0);
  
  // Calculate average rating
  let totalRatings = 0;
  let ratingSum = 0;
  
  recipes.forEach(recipe => {
    totalRatings += recipe.ratings.length;
    ratingSum += recipe.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  });
  
  const averageRating = totalRatings > 0 ? Math.round((ratingSum / totalRatings) * 10) / 10 : 0;
  
  // Update chef profile statistics
  this.chefProfile.totalRecipes = totalRecipes;
  this.chefProfile.totalViews = totalViews;
  this.chefProfile.totalLikes = totalLikes;
  this.chefProfile.averageRating = averageRating;
  this.chefProfile.totalRatings = totalRatings;
  
  return this.save();
};

// Instance method to follow/unfollow another user
userSchema.methods.toggleFollow = function(targetUserId) {
  const isFollowing = this.following.some(follow => follow.userId.equals(targetUserId));
  
  if (isFollowing) {
    // Unfollow
    this.following = this.following.filter(follow => !follow.userId.equals(targetUserId));
  } else {
    // Follow
    this.following.push({
      userId: targetUserId,
      followedAt: new Date()
    });
  }
  
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
