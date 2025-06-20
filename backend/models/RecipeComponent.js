const mongoose = require("mongoose");

const RecipeComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["protein", "vegetable", "carb", "sauce_base", "cooking_method", "instruction_template", "flavor_profile"],
    required: true,
  },
  tags: [
    {
      type: String,
    },
  ], // e.g., "vegetarian", "vegan", "gluten-free", "italian", "asian"
  description: {
    type: String,
  },
  base_quantity: {
    type: Number,
  },
  unit: {
    type: String,
  },
  // For instruction_template type
  steps: [
    {
      type: String,
    },
  ],
  // For cooking_method type
  compatible_types: [
    {
      type: String,
    },
  ], // e.g., a cooking method like "sauté" is compatible with "protein", "vegetable"
});

module.exports = mongoose.model("RecipeComponent", RecipeComponentSchema);
