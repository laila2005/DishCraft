// Script to clean up broken ObjectId references in users' savedRecipes arrays
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
console.log('MONGO_URI:', process.env.MONGO_URI); // DEBUG: print the loaded URI

const User = require('../models/User');
const ChefRecipe = require('../models/ChefRecipe');

async function fixSavedRecipes() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    let totalFixed = 0;
    for (const user of users) {
        if (!user.savedRecipes || user.savedRecipes.length === 0) continue;
        // Only keep valid ObjectIds that exist in ChefRecipe
        const validRecipeIds = [];
        for (const recipeId of user.savedRecipes) {
            try {
                if (!mongoose.Types.ObjectId.isValid(recipeId)) continue;
                const exists = await ChefRecipe.exists({ _id: recipeId });
                if (exists) validRecipeIds.push(recipeId);
            } catch (e) {
                // skip
            }
        }
        if (validRecipeIds.length !== user.savedRecipes.length) {
            user.savedRecipes = validRecipeIds;
            await user.save();
            totalFixed++;
            console.log(`Fixed savedRecipes for user ${user.email}`);
        }
    }
    console.log(`Done. Fixed ${totalFixed} users.`);
    process.exit(0);
}

fixSavedRecipes().catch(e => { console.error(e); process.exit(1); });
