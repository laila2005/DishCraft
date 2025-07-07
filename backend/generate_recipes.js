const mongoose = require('mongoose');
const User = require('./models/User');
const ChefRecipe = require('./models/ChefRecipe');

// MongoDB connection
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
    console.log('Connected to MongoDB');
    await populateDatabase();
});

// Chef data
const chefs = [
    { name: "Chef Gordon Ramsay", email: "gordon.ramsay@dishcraft.com", password: "Gordon123!", bio: "World-renowned chef known for his expertise in French and British cuisine.", specialty: "French Cuisine", experience: "30+ years", location: "London, UK" },
    { name: "Chef Julia Child", email: "julia.child@dishcraft.com", password: "Julia123!", bio: "Legendary chef who brought French cuisine to American homes.", specialty: "French Cuisine", experience: "40+ years", location: "Cambridge, MA" },
    { name: "Chef Wolfgang Puck", email: "wolfgang.puck@dishcraft.com", password: "Wolfgang123!", bio: "Austrian-born chef known for his innovative California cuisine.", specialty: "California Cuisine", experience: "35+ years", location: "Los Angeles, CA" },
    { name: "Chef Emeril Lagasse", email: "emeril.lagasse@dishcraft.com", password: "Emeril123!", bio: "Celebrity chef known for his New Orleans-style cooking.", specialty: "Creole Cuisine", experience: "25+ years", location: "New Orleans, LA" },
    { name: "Chef Bobby Flay", email: "bobby.flay@dishcraft.com", password: "Bobby123!", bio: "Iron Chef and restaurateur known for his Southwestern expertise.", specialty: "Southwestern Cuisine", experience: "30+ years", location: "New York, NY" },
    { name: "Chef Giada De Laurentiis", email: "giada.delaurentiis@dishcraft.com", password: "Giada123!", bio: "Italian-American chef and TV personality.", specialty: "Italian Cuisine", experience: "20+ years", location: "Los Angeles, CA" },
    { name: "Chef Anthony Bourdain", email: "anthony.bourdain@dishcraft.com", password: "Anthony123!", bio: "Celebrated chef, author, and travel documentarian.", specialty: "Global Cuisine", experience: "25+ years", location: "New York, NY" },
    { name: "Chef Ina Garten", email: "ina.garten@dishcraft.com", password: "Ina123!", bio: "The Barefoot Contessa, known for her elegant yet approachable recipes.", specialty: "American Cuisine", experience: "30+ years", location: "East Hampton, NY" },
    { name: "Chef Thomas Keller", email: "thomas.keller@dishcraft.com", password: "Thomas123!", bio: "Multiple Michelin-starred chef known for his French Laundry.", specialty: "French-American Cuisine", experience: "35+ years", location: "Yountville, CA" },
    { name: "Chef Alice Waters", email: "alice.waters@dishcraft.com", password: "Alice123!", bio: "Pioneer of the farm-to-table movement.", specialty: "California Cuisine", experience: "40+ years", location: "Berkeley, CA" },
    { name: "Chef Marcus Samuelsson", email: "marcus.samuelsson@dishcraft.com", password: "Marcus123!", bio: "Ethiopian-Swedish chef known for his Red Rooster restaurant.", specialty: "Global Fusion", experience: "25+ years", location: "New York, NY" },
    { name: "Chef José Andrés", email: "jose.andres@dishcraft.com", password: "Jose123!", bio: "Spanish chef and humanitarian known for his tapas restaurants.", specialty: "Spanish Cuisine", experience: "30+ years", location: "Washington, DC" },
    { name: "Chef Nigella Lawson", email: "nigella.lawson@dishcraft.com", password: "Nigella123!", bio: "British food writer and TV personality.", specialty: "British Cuisine", experience: "25+ years", location: "London, UK" },
    { name: "Chef Jamie Oliver", email: "jamie.oliver@dishcraft.com", password: "Jamie123!", bio: "British chef and food campaigner.", specialty: "British Cuisine", experience: "25+ years", location: "London, UK" },
    { name: "Chef Rachael Ray", email: "rachael.ray@dishcraft.com", password: "Rachael123!", bio: "American TV personality known for her 30-minute meals.", specialty: "American Cuisine", experience: "20+ years", location: "New York, NY" },
    { name: "Chef Guy Fieri", email: "guy.fieri@dishcraft.com", password: "Guy123!", bio: "Celebrity chef known for his Diners, Drive-Ins and Dives show.", specialty: "American Cuisine", experience: "20+ years", location: "Santa Rosa, CA" },
    { name: "Chef Cat Cora", email: "cat.cora@dishcraft.com", password: "Cat123!", bio: "First female Iron Chef and Greek-American chef.", specialty: "Mediterranean Cuisine", experience: "25+ years", location: "Santa Barbara, CA" },
    { name: "Chef Masaharu Morimoto", email: "masaharu.morimoto@dishcraft.com", password: "Masaharu123!", bio: "Iron Chef and Japanese chef known for fusion cuisine.", specialty: "Japanese Cuisine", experience: "30+ years", location: "Philadelphia, PA" },
    { name: "Chef Christina Tosi", email: "christina.tosi@dishcraft.com", password: "Christina123!", bio: "Pastry chef and founder of Milk Bar.", specialty: "Pastry & Desserts", experience: "15+ years", location: "New York, NY" },
    { name: "Chef David Chang", email: "david.chang@dishcraft.com", password: "David123!", bio: "Founder of Momofuku restaurant group.", specialty: "Asian-American Cuisine", experience: "20+ years", location: "New York, NY" }
];

// Recipe templates for generating 100 diverse recipes
const recipeTemplates = [
    // Italian Cuisine
    { name: "Spaghetti Carbonara", cuisine: "italian", category: "main-course", difficulty: "medium", cookingMethod: "boiling" },
    { name: "Margherita Pizza", cuisine: "italian", category: "main-course", difficulty: "medium", cookingMethod: "baking" },
    { name: "Risotto ai Funghi", cuisine: "italian", category: "main-course", difficulty: "hard", cookingMethod: "stir-frying" },
    { name: "Osso Buco", cuisine: "italian", category: "main-course", difficulty: "hard", cookingMethod: "braising" },
    { name: "Tiramisu", cuisine: "italian", category: "dessert", difficulty: "medium", cookingMethod: "no-cook" },

    // French Cuisine
    { name: "Beef Bourguignon", cuisine: "french", category: "main-course", difficulty: "hard", cookingMethod: "braising" },
    { name: "Coq au Vin", cuisine: "french", category: "main-course", difficulty: "hard", cookingMethod: "braising" },
    { name: "Ratatouille", cuisine: "french", category: "main-course", difficulty: "medium", cookingMethod: "stewing" },
    { name: "Crème Brûlée", cuisine: "french", category: "dessert", difficulty: "medium", cookingMethod: "baking" },
    { name: "French Onion Soup", cuisine: "french", category: "soup", difficulty: "medium", cookingMethod: "simmering" },

    // Asian Cuisine
    { name: "Pad Thai", cuisine: "thai", category: "main-course", difficulty: "medium", cookingMethod: "stir-frying" },
    { name: "Sushi California Roll", cuisine: "japanese", category: "main-course", difficulty: "medium", cookingMethod: "rolling" },
    { name: "Kung Pao Chicken", cuisine: "chinese", category: "main-course", difficulty: "medium", cookingMethod: "stir-frying" },
    { name: "Bibimbap", cuisine: "korean", category: "main-course", difficulty: "medium", cookingMethod: "frying" },
    { name: "Pho", cuisine: "vietnamese", category: "soup", difficulty: "hard", cookingMethod: "simmering" },

    // Mexican Cuisine
    { name: "Beef Tacos", cuisine: "mexican", category: "main-course", difficulty: "easy", cookingMethod: "frying" },
    { name: "Enchiladas", cuisine: "mexican", category: "main-course", difficulty: "medium", cookingMethod: "baking" },
    { name: "Guacamole", cuisine: "mexican", category: "appetizer", difficulty: "easy", cookingMethod: "no-cook" },
    { name: "Churros", cuisine: "mexican", category: "dessert", difficulty: "medium", cookingMethod: "frying" },
    { name: "Pozole", cuisine: "mexican", category: "soup", difficulty: "hard", cookingMethod: "simmering" },

    // American Cuisine
    { name: "Classic Burger", cuisine: "american", category: "main-course", difficulty: "easy", cookingMethod: "grilling" },
    { name: "Mac and Cheese", cuisine: "american", category: "main-course", difficulty: "easy", cookingMethod: "baking" },
    { name: "Apple Pie", cuisine: "american", category: "dessert", difficulty: "medium", cookingMethod: "baking" },
    { name: "Chicken Wings", cuisine: "american", category: "appetizer", difficulty: "easy", cookingMethod: "frying" },
    { name: "BBQ Ribs", cuisine: "american", category: "main-course", difficulty: "hard", cookingMethod: "grilling" },

    // Mediterranean Cuisine
    { name: "Greek Salad", cuisine: "greek", category: "salad", difficulty: "easy", cookingMethod: "raw" },
    { name: "Moussaka", cuisine: "greek", category: "main-course", difficulty: "hard", cookingMethod: "baking" },
    { name: "Paella", cuisine: "spanish", category: "main-course", difficulty: "hard", cookingMethod: "simmering" },
    { name: "Hummus", cuisine: "middle-eastern", category: "appetizer", difficulty: "easy", cookingMethod: "blending" },
    { name: "Falafel", cuisine: "middle-eastern", category: "main-course", difficulty: "medium", cookingMethod: "frying" },

    // Indian Cuisine
    { name: "Chicken Tikka Masala", cuisine: "indian", category: "main-course", difficulty: "medium", cookingMethod: "grilling" },
    { name: "Butter Chicken", cuisine: "indian", category: "main-course", difficulty: "medium", cookingMethod: "simmering" },
    { name: "Naan Bread", cuisine: "indian", category: "side-dish", difficulty: "medium", cookingMethod: "baking" },
    { name: "Biryani", cuisine: "indian", category: "main-course", difficulty: "hard", cookingMethod: "steaming" },
    { name: "Gulab Jamun", cuisine: "indian", category: "dessert", difficulty: "medium", cookingMethod: "frying" },

    // Desserts
    { name: "Chocolate Lava Cake", cuisine: "french", category: "dessert", difficulty: "medium", cookingMethod: "baking" },
    { name: "Chocolate Chip Cookies", cuisine: "american", category: "dessert", difficulty: "easy", cookingMethod: "baking" },
    { name: "Cheesecake", cuisine: "american", category: "dessert", difficulty: "medium", cookingMethod: "baking" },
    { name: "Tiramisu", cuisine: "italian", category: "dessert", difficulty: "medium", cookingMethod: "no-cook" },
    { name: "Crème Brûlée", cuisine: "french", category: "dessert", difficulty: "medium", cookingMethod: "baking" },

    // Salads
    { name: "Caesar Salad", cuisine: "american", category: "salad", difficulty: "easy", cookingMethod: "raw" },
    { name: "Greek Salad", cuisine: "greek", category: "salad", difficulty: "easy", cookingMethod: "raw" },
    { name: "Cobb Salad", cuisine: "american", category: "salad", difficulty: "easy", cookingMethod: "raw" },
    { name: "Nicoise Salad", cuisine: "french", category: "salad", difficulty: "medium", cookingMethod: "boiling" },
    { name: "Waldorf Salad", cuisine: "american", category: "salad", difficulty: "easy", cookingMethod: "raw" }
];

// Generate 100 recipes by expanding the templates
function generateRecipes() {
    const recipes = [];
    const cuisines = ["italian", "french", "american", "mexican", "indian", "chinese", "japanese", "thai", "greek", "spanish", "middle-eastern", "mediterranean"];
    const categories = ["main-course", "appetizer", "dessert", "soup", "salad", "side-dish", "breakfast", "lunch", "dinner"];
    const difficulties = ["easy", "medium", "hard"];
    const cookingMethods = ["baking", "frying", "grilling", "boiling", "simmering", "braising", "stir-frying", "steaming", "raw", "no-cook", "blending"];

    let recipeId = 1;

    // Generate recipes based on templates
    for (let i = 0; i < recipeTemplates.length; i++) {
        const template = recipeTemplates[i];
        const variations = Math.ceil(100 / recipeTemplates.length);

        for (let j = 0; j < variations; j++) {
            if (recipes.length >= 100) break;

            const recipe = {
                name: `${template.name} ${j > 0 ? `Variation ${j + 1}` : ''}`.trim(),
                description: `A delicious ${template.cuisine} ${template.category} that showcases the best of ${template.cuisine} cuisine. Perfect for any occasion.`,
                category: template.category,
                cuisine: template.cuisine,
                difficulty: template.difficulty,
                prepTime: Math.floor(Math.random() * 30) + 10,
                cookTime: Math.floor(Math.random() * 60) + 15,
                servings: Math.floor(Math.random() * 8) + 2,
                cookingMethod: template.cookingMethod,
                dietaryTags: j % 3 === 0 ? ["vegetarian"] : j % 3 === 1 ? ["high-protein"] : [],
                nutrition: {
                    calories: Math.floor(Math.random() * 500) + 200,
                    protein: Math.floor(Math.random() * 30) + 5,
                    carbs: Math.floor(Math.random() * 50) + 10,
                    fat: Math.floor(Math.random() * 25) + 5,
                    fiber: Math.floor(Math.random() * 8) + 1,
                    sugar: Math.floor(Math.random() * 20) + 2,
                    sodium: Math.floor(Math.random() * 800) + 200,
                    cholesterol: Math.floor(Math.random() * 100) + 20,
                    saturatedFat: Math.floor(Math.random() * 10) + 2
                },
                ingredients: generateIngredients(template.category, template.cuisine),
                instructions: generateInstructions(template.cookingMethod, template.difficulty),
                image: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 999999999)}?w=800`,
                gallery: [
                    `https://images.unsplash.com/photo-${Math.floor(Math.random() * 999999999)}?w=800`,
                    `https://images.unsplash.com/photo-${Math.floor(Math.random() * 999999999)}?w=800`
                ]
            };

            recipes.push(recipe);
            recipeId++;
        }
    }

    return recipes.slice(0, 100);
}

function generateIngredients(category, cuisine) {
    const baseIngredients = {
        "main-course": [
            { name: "olive oil", quantity: "2", unit: "tablespoons", notes: "" },
            { name: "salt", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "black pepper", quantity: "1/2", unit: "teaspoon", notes: "freshly ground" },
            { name: "garlic", quantity: "3", unit: "cloves", notes: "minced" },
            { name: "onion", quantity: "1", unit: "medium", notes: "chopped" }
        ],
        "dessert": [
            { name: "sugar", quantity: "1/2", unit: "cup", notes: "" },
            { name: "flour", quantity: "1", unit: "cup", notes: "all-purpose" },
            { name: "eggs", quantity: "2", unit: "large", notes: "" },
            { name: "butter", quantity: "1/4", unit: "cup", notes: "unsalted" },
            { name: "vanilla extract", quantity: "1", unit: "teaspoon", notes: "" }
        ],
        "salad": [
            { name: "lettuce", quantity: "1", unit: "head", notes: "chopped" },
            { name: "tomatoes", quantity: "2", unit: "medium", notes: "diced" },
            { name: "cucumber", quantity: "1", unit: "medium", notes: "sliced" },
            { name: "olive oil", quantity: "2", unit: "tablespoons", notes: "extra virgin" },
            { name: "vinegar", quantity: "1", unit: "tablespoon", notes: "" }
        ]
    };

    const cuisineIngredients = {
        "italian": [
            { name: "pasta", quantity: "1", unit: "pound", notes: "" },
            { name: "parmesan cheese", quantity: "1/2", unit: "cup", notes: "grated" },
            { name: "basil", quantity: "1/4", unit: "cup", notes: "fresh" },
            { name: "tomato sauce", quantity: "1", unit: "cup", notes: "" }
        ],
        "french": [
            { name: "butter", quantity: "3", unit: "tablespoons", notes: "unsalted" },
            { name: "white wine", quantity: "1/2", unit: "cup", notes: "dry" },
            { name: "thyme", quantity: "2", unit: "sprigs", notes: "fresh" },
            { name: "shallots", quantity: "2", unit: "medium", notes: "minced" }
        ],
        "mexican": [
            { name: "corn tortillas", quantity: "8", unit: "pieces", notes: "" },
            { name: "chili powder", quantity: "1", unit: "tablespoon", notes: "" },
            { name: "cumin", quantity: "1", unit: "teaspoon", notes: "ground" },
            { name: "lime", quantity: "2", unit: "pieces", notes: "juiced" }
        ],
        "indian": [
            { name: "curry powder", quantity: "2", unit: "tablespoons", notes: "" },
            { name: "coconut milk", quantity: "1", unit: "can", notes: "14 oz" },
            { name: "ginger", quantity: "1", unit: "tablespoon", notes: "fresh, minced" },
            { name: "turmeric", quantity: "1", unit: "teaspoon", notes: "" }
        ]
    };

    let ingredients = [...(baseIngredients[category] || baseIngredients["main-course"])];

    if (cuisineIngredients[cuisine]) {
        ingredients = ingredients.concat(cuisineIngredients[cuisine]);
    }

    // Add some random ingredients
    const randomIngredients = [
        { name: "bell pepper", quantity: "1", unit: "medium", notes: "diced" },
        { name: "mushrooms", quantity: "8", unit: "ounces", notes: "sliced" },
        { name: "carrots", quantity: "2", unit: "medium", notes: "chopped" },
        { name: "spinach", quantity: "2", unit: "cups", notes: "fresh" },
        { name: "cheese", quantity: "1/2", unit: "cup", notes: "shredded" }
    ];

    ingredients = ingredients.concat(randomIngredients.slice(0, Math.floor(Math.random() * 3) + 1));

    return ingredients;
}

function generateInstructions(cookingMethod, difficulty) {
    const baseInstructions = [
        { stepNumber: 1, instruction: "Gather all ingredients and prepare your workspace.", duration: "5 minutes" },
        { stepNumber: 2, instruction: "Preheat oven or prepare cooking equipment as needed.", duration: "10 minutes" },
        { stepNumber: 3, instruction: "Prepare and chop all vegetables and proteins.", duration: "15 minutes" },
        { stepNumber: 4, instruction: "Begin cooking process according to recipe method.", duration: "20 minutes" },
        { stepNumber: 5, instruction: "Add seasonings and adjust flavors to taste.", duration: "5 minutes" },
        { stepNumber: 6, instruction: "Complete cooking and let rest if needed.", duration: "10 minutes" },
        { stepNumber: 7, instruction: "Plate and garnish before serving.", duration: "5 minutes" }
    ];

    const methodSpecificInstructions = {
        "baking": [
            { stepNumber: 3, instruction: "Mix dry ingredients in a large bowl.", duration: "5 minutes" },
            { stepNumber: 4, instruction: "Combine wet ingredients in a separate bowl.", duration: "5 minutes" },
            { stepNumber: 5, instruction: "Fold wet ingredients into dry ingredients until just combined.", duration: "3 minutes" },
            { stepNumber: 6, instruction: "Pour into prepared baking dish and bake until golden.", duration: "30 minutes" }
        ],
        "frying": [
            { stepNumber: 3, instruction: "Heat oil in a large skillet over medium-high heat.", duration: "5 minutes" },
            { stepNumber: 4, instruction: "Carefully add ingredients to hot oil.", duration: "2 minutes" },
            { stepNumber: 5, instruction: "Fry until golden brown and crispy.", duration: "8 minutes" },
            { stepNumber: 6, instruction: "Remove from oil and drain on paper towels.", duration: "2 minutes" }
        ],
        "grilling": [
            { stepNumber: 3, instruction: "Preheat grill to medium-high heat.", duration: "10 minutes" },
            { stepNumber: 4, instruction: "Season ingredients with salt and pepper.", duration: "3 minutes" },
            { stepNumber: 5, instruction: "Place on preheated grill and cook until charred.", duration: "12 minutes" },
            { stepNumber: 6, instruction: "Flip and cook on the other side until done.", duration: "8 minutes" }
        ]
    };

    let instructions = [...baseInstructions];

    if (methodSpecificInstructions[cookingMethod]) {
        instructions = instructions.concat(methodSpecificInstructions[cookingMethod]);
    }

    // Adjust based on difficulty
    if (difficulty === "easy") {
        instructions = instructions.slice(0, 5);
    } else if (difficulty === "hard") {
        instructions.push(
            { stepNumber: 8, instruction: "Allow to rest and develop flavors.", duration: "15 minutes" },
            { stepNumber: 9, instruction: "Make final adjustments and serve.", duration: "5 minutes" }
        );
    }

    return instructions;
}

async function populateDatabase() {
    try {
        console.log('Starting database population...');

        // Clear existing data
        await User.deleteMany({});
        await ChefRecipe.deleteMany({});
        console.log('Cleared existing data');

        // Create chefs
        const createdChefs = [];
        for (const chefData of chefs) {
            const chef = new User({
                name: chefData.name,
                email: chefData.email,
                password: chefData.password,
                bio: chefData.bio,
                specialty: chefData.specialty,
                experience: chefData.experience,
                location: chefData.location,
                role: 'chef'
            });
            await chef.save();
            createdChefs.push(chef);
            console.log(`Created chef: ${chefData.name}`);
        }

        // Get all chef IDs (including the 3 existing ones you mentioned)
        const allChefIds = [
            '686b22b93b8ddc6ffd29930d',
            '686b22b93b8ddc6ffd29930f',
            '686b28f1d6a1b95f32e49cca',
            ...createdChefs.map(chef => chef._id)
        ];

        console.log(`Total chefs available: ${allChefIds.length}`);

        // Generate 100 recipes
        const recipes = generateRecipes();
        console.log(`Generated ${recipes.length} recipes`);

        // Create recipes and assign randomly to chefs
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            const randomChefId = allChefIds[Math.floor(Math.random() * allChefIds.length)];

            const newRecipe = new ChefRecipe({
                ...recipe,
                chef: randomChefId,
                status: 'approved',
                isPublic: true,
                isFeatured: Math.random() < 0.1, // 10% chance to be featured
                views: Math.floor(Math.random() * 1000),
                videoUrl: Math.random() < 0.3 ? `https://youtube.com/watch?v=recipe${i}` : "",
                sourceUrl: Math.random() < 0.5 ? `https://dishcraft.com/recipes/${i}` : ""
            });

            await newRecipe.save();
            console.log(`Created recipe ${i + 1}: ${recipe.name}`);
        }

        console.log('Database population completed successfully!');
        console.log(`Created ${createdChefs.length} new chefs`);
        console.log(`Created ${recipes.length} recipes`);

        mongoose.connection.close();
    } catch (error) {
        console.error('Error populating database:', error);
        mongoose.connection.close();
    }
} 