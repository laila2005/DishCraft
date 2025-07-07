require('dotenv').config();
const mongoose = require('mongoose');
const ChefRecipe = require('./models/ChefRecipe');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function debugDatabase() {
    try {
        console.log('🔍 Debugging Database...\n');

        // Check total recipes
        const totalRecipes = await ChefRecipe.countDocuments();
        console.log(`📊 Total recipes in database: ${totalRecipes}`);

        // Check recipes with chefs
        const recipesWithChefs = await ChefRecipe.countDocuments({ chef: { $exists: true, $ne: null } });
        console.log(`👨‍🍳 Recipes with chefs assigned: ${recipesWithChefs}`);

        // Check public recipes
        const publicRecipes = await ChefRecipe.countDocuments({ isPublic: true });
        console.log(`🌐 Public recipes: ${publicRecipes}`);

        // Get sample recipes with their chefs
        const sampleRecipes = await ChefRecipe.find({ isPublic: true })
            .populate('chef', 'name email')
            .limit(5);

        console.log('\n📋 Sample Recipes:');
        sampleRecipes.forEach((recipe, index) => {
            console.log(`${index + 1}. "${recipe.name}" by ${recipe.chef ? recipe.chef.name : 'NO CHEF'}`);
            console.log(`   Ingredients: ${recipe.ingredients ? recipe.ingredients.length : 0} items`);
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                console.log(`   Sample ingredients: ${recipe.ingredients.slice(0, 3).map(ing => ing.name).join(', ')}`);
            }
            console.log('');
        });

        // Test ingredient matching
        console.log('🧪 Testing ingredient matching...');
        const testIngredients = ['pasta', 'olive oil', 'salt']; // Use ingredients we know exist
        console.log(`Testing with ingredients: ${testIngredients.join(', ')}`);

        const allRecipes = await ChefRecipe.find({ isPublic: true })
            .populate('chef', 'name email');

        let matchCount = 0;
        allRecipes.forEach(recipe => {
            if (!recipe.ingredients || recipe.ingredients.length === 0) return;

            const recipeIngredientNames = recipe.ingredients.map(ing => ing.name.toLowerCase());
            let recipeMatchCount = 0;

            console.log(`\n🔍 Checking "${recipe.name}":`);
            console.log(`   Recipe ingredients: ${recipeIngredientNames.join(', ')}`);

            for (const userIng of testIngredients) {
                const matches = recipeIngredientNames.filter(recipeIng =>
                    recipeIng.includes(userIng) || userIng.includes(recipeIng));
                if (matches.length > 0) {
                    recipeMatchCount++;
                    console.log(`   ✅ "${userIng}" matches: ${matches.join(', ')}`);
                } else {
                    console.log(`   ❌ "${userIng}" - no match`);
                }
            }

            const matchPercentage = (recipeMatchCount / recipeIngredientNames.length) * 100;
            console.log(`   📊 Match: ${recipeMatchCount}/${recipeIngredientNames.length} (${Math.round(matchPercentage)}%)`);

            if (matchPercentage >= 50) {
                matchCount++;
                console.log(`   ✅ RECIPE MATCHES >=50%`);
            } else {
                console.log(`   ❌ Recipe below 50% threshold`);
            }
        });

        console.log(`\n📈 Found ${matchCount} recipes with >=50% match`);

        // Check for specific ingredients
        console.log('\n🔍 Checking for specific ingredients...');
        const allIngredients = [];
        allRecipes.forEach(recipe => {
            if (recipe.ingredients) {
                recipe.ingredients.forEach(ing => {
                    if (!allIngredients.includes(ing.name.toLowerCase())) {
                        allIngredients.push(ing.name.toLowerCase());
                    }
                });
            }
        });

        console.log(`Total unique ingredients in database: ${allIngredients.length}`);
        console.log('Sample ingredients:', allIngredients.slice(0, 20));

    } catch (error) {
        console.error('❌ Error debugging database:', error);
    } finally {
        mongoose.connection.close();
    }
}

debugDatabase(); 