const mongoose = require('mongoose');
require('dotenv').config();

const ChefRecipe = require('./models/ChefRecipe');
const User = require('./models/User');

async function checkRecipeCounts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const recipes = await ChefRecipe.find({}).populate('chef', 'name email');

        const chefRecipeCounts = {};

        recipes.forEach(recipe => {
            const chefName = recipe.chef ? recipe.chef.name : 'Unknown';
            chefRecipeCounts[chefName] = (chefRecipeCounts[chefName] || 0) + 1;
        });

        console.log('\nRecipe counts by chef:');
        console.log('======================');

        Object.entries(chefRecipeCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([chef, count]) => {
                console.log(`${chef}: ${count} recipes`);
            });

        console.log(`\nTotal recipes: ${recipes.length}`);

        const maxChef = Object.entries(chefRecipeCounts)
            .sort((a, b) => b[1] - a[1])[0];

        if (maxChef) {
            console.log(`\nChef with most recipes: ${maxChef[0]} (${maxChef[1]} recipes)`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkRecipeCounts(); 