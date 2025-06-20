const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    enum: ["vegetable", "fruit", "protein", "dairy", "grain", "spice", "other"],
    default: "other",
  },
});

module.exports = mongoose.model("Ingredient", IngredientSchema);
