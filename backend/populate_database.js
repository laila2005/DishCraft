const mongoose = require('mongoose');
const User = require('./models/User');
const ChefRecipe = require('./models/ChefRecipe');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/dishcraft', {
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
    {
        name: "Chef Gordon Ramsay",
        email: "gordon.ramsay@dishcraft.com",
        password: "Gordon123!",
        bio: "World-renowned chef known for his expertise in French and British cuisine. Multiple Michelin star winner.",
        specialty: "French Cuisine",
        experience: "30+ years",
        location: "London, UK"
    },
    {
        name: "Chef Julia Child",
        email: "julia.child@dishcraft.com",
        password: "Julia123!",
        bio: "Legendary chef who brought French cuisine to American homes. Author of 'Mastering the Art of French Cooking'.",
        specialty: "French Cuisine",
        experience: "40+ years",
        location: "Cambridge, MA"
    },
    {
        name: "Chef Wolfgang Puck",
        email: "wolfgang.puck@dishcraft.com",
        password: "Wolfgang123!",
        bio: "Austrian-born chef known for his innovative California cuisine and restaurant empire.",
        specialty: "California Cuisine",
        experience: "35+ years",
        location: "Los Angeles, CA"
    },
    {
        name: "Chef Emeril Lagasse",
        email: "emeril.lagasse@dishcraft.com",
        password: "Emeril123!",
        bio: "Celebrity chef known for his New Orleans-style cooking and catchphrase 'Bam!'",
        specialty: "Creole Cuisine",
        experience: "25+ years",
        location: "New Orleans, LA"
    },
    {
        name: "Chef Bobby Flay",
        email: "bobby.flay@dishcraft.com",
        password: "Bobby123!",
        bio: "Iron Chef and restaurateur known for his Southwestern and grilling expertise.",
        specialty: "Southwestern Cuisine",
        experience: "30+ years",
        location: "New York, NY"
    },
    {
        name: "Chef Giada De Laurentiis",
        email: "giada.delaurentiis@dishcraft.com",
        password: "Giada123!",
        bio: "Italian-American chef and TV personality known for her authentic Italian recipes.",
        specialty: "Italian Cuisine",
        experience: "20+ years",
        location: "Los Angeles, CA"
    },
    {
        name: "Chef Anthony Bourdain",
        email: "anthony.bourdain@dishcraft.com",
        password: "Anthony123!",
        bio: "Celebrated chef, author, and travel documentarian who explored global cuisines.",
        specialty: "Global Cuisine",
        experience: "25+ years",
        location: "New York, NY"
    },
    {
        name: "Chef Ina Garten",
        email: "ina.garten@dishcraft.com",
        password: "Ina123!",
        bio: "The Barefoot Contessa, known for her elegant yet approachable recipes and entertaining expertise.",
        specialty: "American Cuisine",
        experience: "30+ years",
        location: "East Hampton, NY"
    },
    {
        name: "Chef Thomas Keller",
        email: "thomas.keller@dishcraft.com",
        password: "Thomas123!",
        bio: "Multiple Michelin-starred chef known for his French Laundry and Per Se restaurants.",
        specialty: "French-American Cuisine",
        experience: "35+ years",
        location: "Yountville, CA"
    },
    {
        name: "Chef Alice Waters",
        email: "alice.waters@dishcraft.com",
        password: "Alice123!",
        bio: "Pioneer of the farm-to-table movement and founder of Chez Panisse restaurant.",
        specialty: "California Cuisine",
        experience: "40+ years",
        location: "Berkeley, CA"
    },
    {
        name: "Chef Marcus Samuelsson",
        email: "marcus.samuelsson@dishcraft.com",
        password: "Marcus123!",
        bio: "Ethiopian-Swedish chef known for his Red Rooster restaurant and global culinary perspective.",
        specialty: "Global Fusion",
        experience: "25+ years",
        location: "New York, NY"
    },
    {
        name: "Chef José Andrés",
        email: "jose.andres@dishcraft.com",
        password: "Jose123!",
        bio: "Spanish chef and humanitarian known for his tapas restaurants and disaster relief work.",
        specialty: "Spanish Cuisine",
        experience: "30+ years",
        location: "Washington, DC"
    },
    {
        name: "Chef Nigella Lawson",
        email: "nigella.lawson@dishcraft.com",
        password: "Nigella123!",
        bio: "British food writer and TV personality known for her indulgent home cooking recipes.",
        specialty: "British Cuisine",
        experience: "25+ years",
        location: "London, UK"
    },
    {
        name: "Chef Jamie Oliver",
        email: "jamie.oliver@dishcraft.com",
        password: "Jamie123!",
        bio: "British chef and food campaigner known for his simple, healthy cooking approach.",
        specialty: "British Cuisine",
        experience: "25+ years",
        location: "London, UK"
    },
    {
        name: "Chef Rachael Ray",
        email: "rachael.ray@dishcraft.com",
        password: "Rachael123!",
        bio: "American TV personality known for her 30-minute meals and accessible cooking style.",
        specialty: "American Cuisine",
        experience: "20+ years",
        location: "New York, NY"
    },
    {
        name: "Chef Guy Fieri",
        email: "guy.fieri@dishcraft.com",
        password: "Guy123!",
        bio: "Celebrity chef known for his Diners, Drive-Ins and Dives show and bold flavors.",
        specialty: "American Cuisine",
        experience: "20+ years",
        location: "Santa Rosa, CA"
    },
    {
        name: "Chef Cat Cora",
        email: "cat.cora@dishcraft.com",
        password: "Cat123!",
        bio: "First female Iron Chef and Greek-American chef known for Mediterranean cuisine.",
        specialty: "Mediterranean Cuisine",
        experience: "25+ years",
        location: "Santa Barbara, CA"
    },
    {
        name: "Chef Masaharu Morimoto",
        email: "masaharu.morimoto@dishcraft.com",
        password: "Masaharu123!",
        bio: "Iron Chef and Japanese chef known for his innovative fusion of Japanese and Western techniques.",
        specialty: "Japanese Cuisine",
        experience: "30+ years",
        location: "Philadelphia, PA"
    },
    {
        name: "Chef Christina Tosi",
        email: "christina.tosi@dishcraft.com",
        password: "Christina123!",
        bio: "Pastry chef and founder of Milk Bar, known for her innovative desserts and cereal milk ice cream.",
        specialty: "Pastry & Desserts",
        experience: "15+ years",
        location: "New York, NY"
    },
    {
        name: "Chef David Chang",
        email: "david.chang@dishcraft.com",
        password: "David123!",
        bio: "Founder of Momofuku restaurant group and known for his modern Asian-American cuisine.",
        specialty: "Asian-American Cuisine",
        experience: "20+ years",
        location: "New York, NY"
    }
];

// Recipe data with full details
const recipes = [
    {
        name: "Classic Beef Bourguignon",
        description: "A traditional French stew made with beef, red wine, and pearl onions. This hearty dish is perfect for cold winter nights and showcases the depth of French cooking techniques.",
        category: "main-course",
        cuisine: "french",
        difficulty: "hard",
        prepTime: 30,
        cookTime: 180,
        servings: 6,
        cookingMethod: "braising",
        dietaryTags: ["high-protein"],
        nutrition: {
            calories: 450,
            protein: 35,
            carbs: 15,
            fat: 25,
            fiber: 4,
            sugar: 8,
            sodium: 800,
            cholesterol: 120,
            saturatedFat: 10
        },
        ingredients: [
            { name: "beef chuck", quantity: "3", unit: "pounds", notes: "cut into 2-inch cubes" },
            { name: "bacon", quantity: "8", unit: "ounces", notes: "cut into lardons" },
            { name: "pearl onions", quantity: "1", unit: "pound", notes: "peeled" },
            { name: "carrots", quantity: "4", unit: "medium", notes: "cut into chunks" },
            { name: "mushrooms", quantity: "1", unit: "pound", notes: "quartered" },
            { name: "red wine", quantity: "2", unit: "cups", notes: "Burgundy or Pinot Noir" },
            { name: "beef broth", quantity: "2", unit: "cups", notes: "" },
            { name: "tomato paste", quantity: "2", unit: "tablespoons", notes: "" },
            { name: "garlic", quantity: "6", unit: "cloves", notes: "minced" },
            { name: "thyme", quantity: "4", unit: "sprigs", notes: "fresh" },
            { name: "bay leaves", quantity: "2", unit: "leaves", notes: "" },
            { name: "butter", quantity: "3", unit: "tablespoons", notes: "" },
            { name: "flour", quantity: "2", unit: "tablespoons", notes: "" },
            { name: "salt", quantity: "2", unit: "teaspoons", notes: "" },
            { name: "black pepper", quantity: "1", unit: "teaspoon", notes: "freshly ground" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "Preheat oven to 325°F (165°C). Pat beef dry with paper towels and season with salt and pepper.", duration: "5 minutes" },
            { stepNumber: 2, instruction: "In a large Dutch oven, cook bacon over medium heat until crispy. Remove bacon and set aside, leaving fat in pot.", duration: "10 minutes" },
            { stepNumber: 3, instruction: "Working in batches, brown beef cubes in bacon fat until well-browned on all sides. Remove and set aside.", duration: "15 minutes" },
            { stepNumber: 4, instruction: "Add pearl onions and carrots to pot, cook until onions are golden, about 5 minutes. Remove and set aside.", duration: "5 minutes" },
            { stepNumber: 5, instruction: "Add mushrooms to pot and cook until golden, about 5 minutes. Remove and set aside.", duration: "5 minutes" },
            { stepNumber: 6, instruction: "Add garlic and tomato paste to pot, cook for 1 minute until fragrant.", duration: "1 minute" },
            { stepNumber: 7, instruction: "Return beef and bacon to pot. Add wine, broth, thyme, and bay leaves. Bring to simmer.", duration: "5 minutes" },
            { stepNumber: 8, instruction: "Cover and transfer to oven. Cook for 2 hours until beef is very tender.", duration: "2 hours" },
            { stepNumber: 9, instruction: "Return pot to stovetop. Add reserved vegetables and simmer uncovered for 30 minutes until sauce thickens.", duration: "30 minutes" },
            { stepNumber: 10, instruction: "In a small bowl, mix butter and flour to make a paste. Whisk into stew to thicken. Season with salt and pepper to taste.", duration: "5 minutes" }
        ],
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800",
            "https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
        ]
    },
    {
        name: "Spaghetti Carbonara",
        description: "A classic Roman pasta dish featuring eggs, cheese, pancetta, and black pepper. This simple yet sophisticated dish showcases the beauty of Italian cuisine with minimal ingredients.",
        category: "main-course",
        cuisine: "italian",
        difficulty: "medium",
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        cookingMethod: "boiling",
        dietaryTags: ["high-protein"],
        nutrition: {
            calories: 650,
            protein: 25,
            carbs: 70,
            fat: 30,
            fiber: 3,
            sugar: 2,
            sodium: 800,
            cholesterol: 200,
            saturatedFat: 12
        },
        ingredients: [
            { name: "spaghetti", quantity: "1", unit: "pound", notes: "" },
            { name: "pancetta", quantity: "8", unit: "ounces", notes: "or guanciale, diced" },
            { name: "eggs", quantity: "4", unit: "large", notes: "room temperature" },
            { name: "pecorino romano", quantity: "1", unit: "cup", notes: "freshly grated" },
            { name: "parmesan", quantity: "1/2", unit: "cup", notes: "freshly grated" },
            { name: "black pepper", quantity: "2", unit: "teaspoons", notes: "freshly ground" },
            { name: "salt", quantity: "2", unit: "tablespoons", notes: "for pasta water" },
            { name: "garlic", quantity: "4", unit: "cloves", notes: "minced" },
            { name: "reserved pasta water", quantity: "1/2", unit: "cup", notes: "" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "Bring a large pot of salted water to boil. Cook spaghetti according to package directions until al dente.", duration: "10 minutes" },
            { stepNumber: 2, instruction: "While pasta cooks, heat a large skillet over medium heat. Add pancetta and cook until crispy, about 8 minutes.", duration: "8 minutes" },
            { stepNumber: 3, instruction: "In a bowl, whisk together eggs, grated cheeses, and black pepper. Set aside.", duration: "3 minutes" },
            { stepNumber: 4, instruction: "Reserve 1/2 cup of pasta water, then drain pasta.", duration: "1 minute" },
            { stepNumber: 5, instruction: "Add hot pasta to skillet with pancetta. Toss to combine and remove from heat.", duration: "1 minute" },
            { stepNumber: 6, instruction: "Quickly add egg mixture to pasta, tossing constantly to create a creamy sauce without scrambling eggs.", duration: "2 minutes" },
            { stepNumber: 7, instruction: "Add reserved pasta water as needed to create a silky sauce. Season with salt and additional pepper to taste.", duration: "1 minute" },
            { stepNumber: 8, instruction: "Serve immediately with extra grated cheese and black pepper on top.", duration: "1 minute" }
        ],
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800",
            "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800"
        ]
    },
    {
        name: "Chicken Tikka Masala",
        description: "A British-Indian fusion dish featuring tender chicken in a creamy, spiced tomato sauce. This beloved curry is rich, aromatic, and perfect with naan bread or rice.",
        category: "main-course",
        cuisine: "indian",
        difficulty: "medium",
        prepTime: 30,
        cookTime: 45,
        servings: 6,
        cookingMethod: "grilling",
        dietaryTags: ["high-protein"],
        nutrition: {
            calories: 380,
            protein: 28,
            carbs: 12,
            fat: 22,
            fiber: 3,
            sugar: 8,
            sodium: 650,
            cholesterol: 85,
            saturatedFat: 8
        },
        ingredients: [
            { name: "chicken breast", quantity: "2", unit: "pounds", notes: "cut into 1-inch cubes" },
            { name: "yogurt", quantity: "1", unit: "cup", notes: "plain, full-fat" },
            { name: "lemon juice", quantity: "2", unit: "tablespoons", notes: "fresh" },
            { name: "garam masala", quantity: "2", unit: "teaspoons", notes: "" },
            { name: "turmeric", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "cumin", quantity: "1", unit: "teaspoon", notes: "ground" },
            { name: "coriander", quantity: "1", unit: "teaspoon", notes: "ground" },
            { name: "cayenne pepper", quantity: "1/2", unit: "teaspoon", notes: "" },
            { name: "onion", quantity: "1", unit: "large", notes: "finely chopped" },
            { name: "garlic", quantity: "6", unit: "cloves", notes: "minced" },
            { name: "ginger", quantity: "2", unit: "tablespoons", notes: "fresh, minced" },
            { name: "tomato paste", quantity: "2", unit: "tablespoons", notes: "" },
            { name: "crushed tomatoes", quantity: "28", unit: "ounces", notes: "canned" },
            { name: "heavy cream", quantity: "1", unit: "cup", notes: "" },
            { name: "butter", quantity: "3", unit: "tablespoons", notes: "" },
            { name: "salt", quantity: "2", unit: "teaspoons", notes: "" },
            { name: "black pepper", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "fresh cilantro", quantity: "1/2", unit: "cup", notes: "chopped" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "In a large bowl, combine yogurt, lemon juice, garam masala, turmeric, cumin, coriander, and cayenne. Add chicken and marinate for 2 hours or overnight.", duration: "10 minutes + marinating time" },
            { stepNumber: 2, instruction: "Preheat grill or broiler to high heat. Thread chicken onto skewers and grill until charred and cooked through, about 8-10 minutes.", duration: "10 minutes" },
            { stepNumber: 3, instruction: "In a large skillet, melt butter over medium heat. Add onion and cook until softened, about 5 minutes.", duration: "5 minutes" },
            { stepNumber: 4, instruction: "Add garlic and ginger, cook for 1 minute until fragrant.", duration: "1 minute" },
            { stepNumber: 5, instruction: "Add tomato paste and cook for 2 minutes, stirring constantly.", duration: "2 minutes" },
            { stepNumber: 6, instruction: "Add crushed tomatoes, salt, and pepper. Simmer for 15 minutes until sauce thickens.", duration: "15 minutes" },
            { stepNumber: 7, instruction: "Add grilled chicken to sauce and simmer for 5 minutes.", duration: "5 minutes" },
            { stepNumber: 8, instruction: "Stir in heavy cream and simmer for 5 more minutes until sauce is creamy.", duration: "5 minutes" },
            { stepNumber: 9, instruction: "Garnish with fresh cilantro and serve with naan bread or rice.", duration: "2 minutes" }
        ],
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800"
        ]
    },
    {
        name: "Caesar Salad",
        description: "A classic American salad featuring crisp romaine lettuce, parmesan cheese, croutons, and a creamy Caesar dressing. This timeless dish is perfect as a starter or light meal.",
        category: "salad",
        cuisine: "american",
        difficulty: "easy",
        prepTime: 20,
        cookTime: 10,
        servings: 4,
        cookingMethod: "raw",
        dietaryTags: ["vegetarian"],
        nutrition: {
            calories: 320,
            protein: 8,
            carbs: 15,
            fat: 25,
            fiber: 4,
            sugar: 3,
            sodium: 800,
            cholesterol: 45,
            saturatedFat: 6
        },
        ingredients: [
            { name: "romaine lettuce", quantity: "2", unit: "heads", notes: "chopped" },
            { name: "parmesan cheese", quantity: "1/2", unit: "cup", notes: "freshly grated" },
            { name: "croutons", quantity: "2", unit: "cups", notes: "homemade or store-bought" },
            { name: "anchovy fillets", quantity: "6", unit: "pieces", notes: "minced" },
            { name: "garlic", quantity: "3", unit: "cloves", notes: "minced" },
            { name: "dijon mustard", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "lemon juice", quantity: "2", unit: "tablespoons", notes: "fresh" },
            { name: "worcestershire sauce", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "olive oil", quantity: "1/3", unit: "cup", notes: "extra virgin" },
            { name: "egg yolk", quantity: "1", unit: "large", notes: "raw" },
            { name: "black pepper", quantity: "1/2", unit: "teaspoon", notes: "freshly ground" },
            { name: "salt", quantity: "1/4", unit: "teaspoon", notes: "" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "In a small bowl, whisk together anchovy, garlic, mustard, lemon juice, and Worcestershire sauce.", duration: "3 minutes" },
            { stepNumber: 2, instruction: "Add egg yolk and whisk to combine.", duration: "1 minute" },
            { stepNumber: 3, instruction: "Slowly drizzle in olive oil while whisking constantly to create an emulsion.", duration: "3 minutes" },
            { stepNumber: 4, instruction: "Season with salt and pepper to taste.", duration: "1 minute" },
            { stepNumber: 5, instruction: "In a large bowl, combine romaine lettuce and dressing. Toss gently to coat.", duration: "2 minutes" },
            { stepNumber: 6, instruction: "Add croutons and parmesan cheese. Toss again to combine.", duration: "2 minutes" },
            { stepNumber: 7, instruction: "Serve immediately with extra parmesan cheese on top.", duration: "1 minute" }
        ],
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800",
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
        ]
    },
    {
        name: "Chocolate Lava Cake",
        description: "Individual chocolate cakes with molten centers that ooze rich chocolate when cut. This elegant dessert is perfect for special occasions and showcases the art of French pastry.",
        category: "dessert",
        cuisine: "french",
        difficulty: "medium",
        prepTime: 20,
        cookTime: 12,
        servings: 4,
        cookingMethod: "baking",
        dietaryTags: ["vegetarian"],
        nutrition: {
            calories: 420,
            protein: 6,
            carbs: 45,
            fat: 25,
            fiber: 3,
            sugar: 35,
            sodium: 200,
            cholesterol: 120,
            saturatedFat: 15
        },
        ingredients: [
            { name: "dark chocolate", quantity: "8", unit: "ounces", notes: "70% cacao, chopped" },
            { name: "butter", quantity: "1/2", unit: "cup", notes: "unsalted" },
            { name: "eggs", quantity: "4", unit: "large", notes: "room temperature" },
            { name: "egg yolks", quantity: "2", unit: "large", notes: "" },
            { name: "sugar", quantity: "1/2", unit: "cup", notes: "" },
            { name: "vanilla extract", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "salt", quantity: "1/4", unit: "teaspoon", notes: "" },
            { name: "all-purpose flour", quantity: "1/4", unit: "cup", notes: "" },
            { name: "cocoa powder", quantity: "2", unit: "tablespoons", notes: "for dusting" },
            { name: "powdered sugar", quantity: "2", unit: "tablespoons", notes: "for dusting" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "Preheat oven to 425°F (220°C). Butter and dust 4 ramekins with cocoa powder.", duration: "5 minutes" },
            { stepNumber: 2, instruction: "In a double boiler, melt chocolate and butter together until smooth. Remove from heat.", duration: "5 minutes" },
            { stepNumber: 3, instruction: "In a large bowl, whisk together eggs, egg yolks, sugar, vanilla, and salt until pale and thick.", duration: "5 minutes" },
            { stepNumber: 4, instruction: "Fold melted chocolate mixture into egg mixture until just combined.", duration: "2 minutes" },
            { stepNumber: 5, instruction: "Gently fold in flour until just combined. Do not overmix.", duration: "2 minutes" },
            { stepNumber: 6, instruction: "Divide batter evenly among prepared ramekins.", duration: "2 minutes" },
            { stepNumber: 7, instruction: "Bake for 10-12 minutes until edges are set but centers are still soft.", duration: "12 minutes" },
            { stepNumber: 8, instruction: "Let stand for 1 minute, then invert onto plates. Dust with powdered sugar and serve immediately.", duration: "3 minutes" }
        ],
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"
        ]
    },
    {
        name: "Margherita Pizza",
        description: "The classic Neapolitan pizza with tomato sauce, mozzarella, and fresh basil. This simple yet perfect combination showcases the essence of Italian pizza making.",
        category: "main-course",
        cuisine: "italian",
        difficulty: "medium",
        prepTime: 30,
        cookTime: 15,
        servings: 4,
        cookingMethod: "baking",
        dietaryTags: ["vegetarian"],
        nutrition: {
            calories: 280,
            protein: 12,
            carbs: 35,
            fat: 12,
            fiber: 2,
            sugar: 4,
            sodium: 600,
            cholesterol: 25,
            saturatedFat: 6
        },
        ingredients: [
            { name: "pizza dough", quantity: "1", unit: "pound", notes: "homemade or store-bought" },
            { name: "tomato sauce", quantity: "1/2", unit: "cup", notes: "simple marinara" },
            { name: "mozzarella", quantity: "8", unit: "ounces", notes: "fresh, sliced" },
            { name: "fresh basil", quantity: "1/2", unit: "cup", notes: "torn" },
            { name: "olive oil", quantity: "2", unit: "tablespoons", notes: "extra virgin" },
            { name: "salt", quantity: "1/2", unit: "teaspoon", notes: "" },
            { name: "black pepper", quantity: "1/4", unit: "teaspoon", notes: "" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "Preheat oven to 500°F (260°C) with pizza stone if available.", duration: "20 minutes" },
            { stepNumber: 2, instruction: "Roll out pizza dough to 12-inch circle on floured surface.", duration: "5 minutes" },
            { stepNumber: 3, instruction: "Transfer dough to pizza peel or baking sheet.", duration: "2 minutes" },
            { stepNumber: 4, instruction: "Spread tomato sauce evenly over dough, leaving 1/2-inch border.", duration: "2 minutes" },
            { stepNumber: 5, instruction: "Arrange mozzarella slices over sauce.", duration: "2 minutes" },
            { stepNumber: 6, instruction: "Drizzle with olive oil and season with salt and pepper.", duration: "1 minute" },
            { stepNumber: 7, instruction: "Bake for 12-15 minutes until crust is golden and cheese is bubbly.", duration: "15 minutes" },
            { stepNumber: 8, instruction: "Remove from oven and top with fresh basil. Slice and serve immediately.", duration: "2 minutes" }
        ],
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800",
            "https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
        ]
    },
    {
        name: "Sushi Roll California",
        description: "A classic American-style sushi roll with crab, avocado, and cucumber. This beginner-friendly roll is perfect for those new to sushi making.",
        category: "main-course",
        cuisine: "japanese",
        difficulty: "medium",
        prepTime: 45,
        cookTime: 20,
        servings: 4,
        cookingMethod: "rolling",
        dietaryTags: ["high-protein"],
        nutrition: {
            calories: 320,
            protein: 15,
            carbs: 45,
            fat: 12,
            fiber: 3,
            sugar: 2,
            sodium: 400,
            cholesterol: 35,
            saturatedFat: 2
        },
        ingredients: [
            { name: "sushi rice", quantity: "2", unit: "cups", notes: "cooked and seasoned" },
            { name: "nori sheets", quantity: "4", unit: "sheets", notes: "dried seaweed" },
            { name: "imitation crab", quantity: "8", unit: "ounces", notes: "shredded" },
            { name: "avocado", quantity: "1", unit: "medium", notes: "sliced" },
            { name: "cucumber", quantity: "1", unit: "medium", notes: "julienned" },
            { name: "rice vinegar", quantity: "1/4", unit: "cup", notes: "" },
            { name: "sugar", quantity: "2", unit: "tablespoons", notes: "" },
            { name: "salt", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "wasabi", quantity: "1", unit: "teaspoon", notes: "optional" },
            { name: "soy sauce", quantity: "1/4", unit: "cup", notes: "for serving" },
            { name: "pickled ginger", quantity: "1/4", unit: "cup", notes: "for serving" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "Cook sushi rice according to package directions. Mix with vinegar, sugar, and salt while still warm.", duration: "20 minutes" },
            { stepNumber: 2, instruction: "Place bamboo mat on work surface. Lay nori sheet shiny side down.", duration: "1 minute" },
            { stepNumber: 3, instruction: "Spread 1/2 cup rice evenly over nori, leaving 1-inch border at top.", duration: "2 minutes" },
            { stepNumber: 4, instruction: "Arrange crab, avocado, and cucumber in horizontal line across center of rice.", duration: "3 minutes" },
            { stepNumber: 5, instruction: "Lift bottom edge of mat and roll tightly away from you, pressing gently.", duration: "2 minutes" },
            { stepNumber: 6, instruction: "Moisten top border with water and complete roll. Press gently to seal.", duration: "1 minute" },
            { stepNumber: 7, instruction: "Repeat with remaining ingredients to make 4 rolls.", duration: "10 minutes" },
            { stepNumber: 8, instruction: "Cut each roll into 8 pieces with sharp knife. Serve with soy sauce, wasabi, and ginger.", duration: "5 minutes" }
        ],
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800",
            "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800"
        ]
    },
    {
        name: "Beef Tacos",
        description: "Authentic Mexican street tacos with seasoned ground beef, fresh toppings, and warm corn tortillas. A quick and flavorful meal perfect for any day.",
        category: "main-course",
        cuisine: "mexican",
        difficulty: "easy",
        prepTime: 20,
        cookTime: 15,
        servings: 6,
        cookingMethod: "frying",
        dietaryTags: ["high-protein"],
        nutrition: {
            calories: 350,
            protein: 20,
            carbs: 25,
            fat: 18,
            fiber: 4,
            sugar: 3,
            sodium: 600,
            cholesterol: 60,
            saturatedFat: 7
        },
        ingredients: [
            { name: "ground beef", quantity: "1", unit: "pound", notes: "80/20 lean" },
            { name: "corn tortillas", quantity: "12", unit: "pieces", notes: "6-inch" },
            { name: "onion", quantity: "1", unit: "medium", notes: "finely chopped" },
            { name: "garlic", quantity: "3", unit: "cloves", notes: "minced" },
            { name: "chili powder", quantity: "2", unit: "tablespoons", notes: "" },
            { name: "cumin", quantity: "1", unit: "teaspoon", notes: "ground" },
            { name: "paprika", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "oregano", quantity: "1", unit: "teaspoon", notes: "dried" },
            { name: "salt", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "black pepper", quantity: "1/2", unit: "teaspoon", notes: "" },
            { name: "tomatoes", quantity: "2", unit: "medium", notes: "diced" },
            { name: "lettuce", quantity: "2", unit: "cups", notes: "shredded" },
            { name: "cheddar cheese", quantity: "1", unit: "cup", notes: "shredded" },
            { name: "sour cream", quantity: "1/2", unit: "cup", notes: "" },
            { name: "lime", quantity: "2", unit: "pieces", notes: "cut into wedges" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "Heat large skillet over medium-high heat. Add ground beef and cook until browned, breaking into small pieces.", duration: "8 minutes" },
            { stepNumber: 2, instruction: "Add onion and garlic, cook until softened, about 3 minutes.", duration: "3 minutes" },
            { stepNumber: 3, instruction: "Add chili powder, cumin, paprika, oregano, salt, and pepper. Cook for 2 minutes until fragrant.", duration: "2 minutes" },
            { stepNumber: 4, instruction: "Warm tortillas in dry skillet or microwave until pliable.", duration: "2 minutes" },
            { stepNumber: 5, instruction: "Fill each tortilla with beef mixture.", duration: "3 minutes" },
            { stepNumber: 6, instruction: "Top with tomatoes, lettuce, cheese, and sour cream.", duration: "2 minutes" },
            { stepNumber: 7, instruction: "Serve with lime wedges and additional toppings as desired.", duration: "1 minute" }
        ],
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800",
            "https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
        ]
    },
    {
        name: "Greek Salad",
        description: "A refreshing Mediterranean salad featuring crisp vegetables, feta cheese, olives, and a simple olive oil dressing. Perfect as a light meal or side dish.",
        category: "salad",
        cuisine: "greek",
        difficulty: "easy",
        prepTime: 15,
        cookTime: 0,
        servings: 4,
        cookingMethod: "raw",
        dietaryTags: ["vegetarian"],
        nutrition: {
            calories: 280,
            protein: 8,
            carbs: 12,
            fat: 22,
            fiber: 4,
            sugar: 6,
            sodium: 800,
            cholesterol: 25,
            saturatedFat: 8
        },
        ingredients: [
            { name: "cucumber", quantity: "1", unit: "large", notes: "diced" },
            { name: "tomatoes", quantity: "4", unit: "medium", notes: "diced" },
            { name: "red onion", quantity: "1/2", unit: "medium", notes: "thinly sliced" },
            { name: "bell pepper", quantity: "1", unit: "large", notes: "diced" },
            { name: "feta cheese", quantity: "1/2", unit: "cup", notes: "crumbled" },
            { name: "kalamata olives", quantity: "1/2", unit: "cup", notes: "pitted" },
            { name: "olive oil", quantity: "1/4", unit: "cup", notes: "extra virgin" },
            { name: "red wine vinegar", quantity: "2", unit: "tablespoons", notes: "" },
            { name: "oregano", quantity: "1", unit: "teaspoon", notes: "dried" },
            { name: "salt", quantity: "1/2", unit: "teaspoon", notes: "" },
            { name: "black pepper", quantity: "1/4", unit: "teaspoon", notes: "" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "In a large bowl, combine cucumber, tomatoes, onion, and bell pepper.", duration: "5 minutes" },
            { stepNumber: 2, instruction: "Add feta cheese and olives to the bowl.", duration: "2 minutes" },
            { stepNumber: 3, instruction: "In a small bowl, whisk together olive oil, vinegar, oregano, salt, and pepper.", duration: "3 minutes" },
            { stepNumber: 4, instruction: "Pour dressing over salad and toss gently to combine.", duration: "2 minutes" },
            { stepNumber: 5, instruction: "Let salad sit for 10 minutes to allow flavors to meld.", duration: "10 minutes" },
            { stepNumber: 6, instruction: "Serve immediately or refrigerate for up to 2 hours.", duration: "1 minute" }
        ],
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800",
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
        ]
    },
    {
        name: "Chocolate Chip Cookies",
        description: "Classic homemade chocolate chip cookies with crisp edges and chewy centers. These timeless treats are perfect for any occasion and loved by all ages.",
        category: "dessert",
        cuisine: "american",
        difficulty: "easy",
        prepTime: 15,
        cookTime: 12,
        servings: 24,
        cookingMethod: "baking",
        dietaryTags: ["vegetarian"],
        nutrition: {
            calories: 150,
            protein: 2,
            carbs: 18,
            fat: 8,
            fiber: 1,
            sugar: 12,
            sodium: 100,
            cholesterol: 25,
            saturatedFat: 4
        },
        ingredients: [
            { name: "all-purpose flour", quantity: "2 1/4", unit: "cups", notes: "" },
            { name: "butter", quantity: "1", unit: "cup", notes: "unsalted, softened" },
            { name: "brown sugar", quantity: "3/4", unit: "cup", notes: "packed" },
            { name: "granulated sugar", quantity: "3/4", unit: "cup", notes: "" },
            { name: "eggs", quantity: "2", unit: "large", notes: "room temperature" },
            { name: "vanilla extract", quantity: "2", unit: "teaspoons", notes: "" },
            { name: "baking soda", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "salt", quantity: "1", unit: "teaspoon", notes: "" },
            { name: "chocolate chips", quantity: "2", unit: "cups", notes: "semi-sweet" },
            { name: "walnuts", quantity: "1", unit: "cup", notes: "chopped, optional" }
        ],
        instructions: [
            { stepNumber: 1, instruction: "Preheat oven to 375°F (190°C). Line baking sheets with parchment paper.", duration: "5 minutes" },
            { stepNumber: 2, instruction: "In a medium bowl, whisk together flour, baking soda, and salt.", duration: "3 minutes" },
            { stepNumber: 3, instruction: "In a large bowl, cream butter and both sugars until light and fluffy.", duration: "3 minutes" },
            { stepNumber: 4, instruction: "Beat in eggs one at a time, then add vanilla extract.", duration: "2 minutes" },
            { stepNumber: 5, instruction: "Gradually add flour mixture to butter mixture, mixing until just combined.", duration: "3 minutes" },
            { stepNumber: 6, instruction: "Stir in chocolate chips and walnuts (if using).", duration: "2 minutes" },
            { stepNumber: 7, instruction: "Drop rounded tablespoons of dough onto prepared baking sheets, spacing 2 inches apart.", duration: "5 minutes" },
            { stepNumber: 8, instruction: "Bake for 10-12 minutes until edges are golden but centers are still soft.", duration: "12 minutes" },
            { stepNumber: 9, instruction: "Cool on baking sheets for 5 minutes, then transfer to wire racks to cool completely.", duration: "10 minutes" }
        ],
        image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
        gallery: [
            "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
            "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800"
        ]
    }
];

// Continue with more recipes...
// I'll add the remaining recipes in batches due to length constraints

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
                password: chefData.password, // Note: In production, this should be hashed
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