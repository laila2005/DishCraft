const mongoose = require("mongoose");
const Meal = require("./Meal"); // Import the Meal model

const MealPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    // This would typically reference a User model if you had authentication
    type: String,
    default: "anonymous", // For now, a simple string or 'anonymous'
  },
  meals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meal", // Reference to the Meal model
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MealPlan", MealPlanSchema);
