const mongoose = require("mongoose");

const MealSchema = new mongoose.Schema({
  recipeTitle: {
    type: String,
    required: true,
  },
  recipeDetails: {
    // Store a snapshot of the generated recipe details
    type: Object,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    default: "dinner",
  },
});

module.exports = mongoose.model("Meal", MealSchema);

