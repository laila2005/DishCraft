// Script to assign random cooking methods to all ChefRecipe documents that are missing it
const mongoose = require('mongoose');
require('dotenv').config();
const ChefRecipe = require('../models/ChefRecipe');

const COOKING_METHODS = [
    'Steaming',
    'Boiling',
    'Grilling',
    'Baking',
    'Stir-frying'
];

async function assignRandomCookingMethods() {
    await mongoose.connect(process.env.MONGO_URI);
    const recipes = await ChefRecipe.find({ $or: [{ cookingMethod: { $exists: false } }, { cookingMethod: '' }, { cookingMethod: null }] });
    let updated = 0;
    for (const recipe of recipes) {
        const method = COOKING_METHODS[Math.floor(Math.random() * COOKING_METHODS.length)];
        recipe.cookingMethod = method;
        await recipe.save();
        updated++;
        console.log(`Updated recipe ${recipe._id} with cooking method: ${method}`);
    }
    console.log(`Done. Updated ${updated} recipes.`);
    process.exit(0);
}

assignRandomCookingMethods().catch(e => { console.error(e); process.exit(1); });
