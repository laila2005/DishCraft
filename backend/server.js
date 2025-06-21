const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const Ingredient = require("./models/Ingredient");
const RecipeComponent = require("./models/RecipeComponent");
const Meal = require("./models/Meal");
const MealPlan = require("./models/MealPlan");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

connectDB();

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Helper function to generate cooking instructions
const generateInstructions = (protein, vegetable, carb, sauce, cookingMethod) => {
  const instructions = [];
  
  switch (cookingMethod.toLowerCase()) {
    case 'bake/roast':
    case 'bake':
    case 'roast':
      instructions.push(`Preheat your oven to 375°F (190°C).`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt, pepper, and your favorite herbs.`);
      instructions.push(`Place the ${protein.toLowerCase()} on a baking sheet or in a roasting pan.`);
      instructions.push(`Bake for 20-25 minutes or until the ${protein.toLowerCase()} is cooked through.`);
      instructions.push(`Meanwhile, prepare the ${vegetable.toLowerCase()} by steaming or roasting alongside.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} in a small saucepan.`);
      instructions.push(`Serve the ${protein.toLowerCase()} over the ${carb.toLowerCase()}, topped with ${vegetable.toLowerCase()} and ${sauce.toLowerCase()}.`);
      break;
      
    case 'stir-fry':
    case 'sauté':
      instructions.push(`Heat 2 tablespoons of oil in a large skillet or wok over medium-high heat.`);
      instructions.push(`Add the ${protein.toLowerCase()} and cook for 5-7 minutes until browned and cooked through.`);
      instructions.push(`Add the ${vegetable.toLowerCase()} and stir-fry for 3-4 minutes until tender-crisp.`);
      instructions.push(`Meanwhile, cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Add the ${sauce.toLowerCase()} to the pan and stir to combine.`);
      instructions.push(`Cook for another 2-3 minutes until heated through.`);
      instructions.push(`Serve over the prepared ${carb.toLowerCase()}.`);
      break;
      
    case 'grill':
    case 'grilled':
      instructions.push(`Preheat your grill to medium-high heat.`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt, pepper, and your favorite spices.`);
      instructions.push(`Grill the ${protein.toLowerCase()} for 6-8 minutes per side until cooked through.`);
      instructions.push(`Prepare the ${vegetable.toLowerCase()} by grilling or steaming.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} if desired.`);
      instructions.push(`Serve the grilled ${protein.toLowerCase()} with ${carb.toLowerCase()}, ${vegetable.toLowerCase()}, and ${sauce.toLowerCase()}.`);
      break;
      
    case 'steam':
    case 'steamed':
      instructions.push(`Set up a steamer basket over boiling water.`);
      instructions.push(`Season the ${protein.toLowerCase()} with salt and pepper.`);
      instructions.push(`Steam the ${protein.toLowerCase()} for 12-15 minutes until cooked through.`);
      instructions.push(`Add the ${vegetable.toLowerCase()} to the steamer for the last 5-7 minutes.`);
      instructions.push(`Cook the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Warm the ${sauce.toLowerCase()} in a small saucepan.`);
      instructions.push(`Serve the steamed ${protein.toLowerCase()} and ${vegetable.toLowerCase()} over ${carb.toLowerCase()} with ${sauce.toLowerCase()}.`);
      break;
      
    default:
      instructions.push(`Prepare the ${protein.toLowerCase()} by cooking it using your preferred method until done.`);
      instructions.push(`Cook the ${vegetable.toLowerCase()} until tender.`);
      instructions.push(`Prepare the ${carb.toLowerCase()} according to package directions.`);
      instructions.push(`Heat the ${sauce.toLowerCase()} if needed.`);
      instructions.push(`Combine all ingredients and serve hot.`);
  }
  
  return instructions;
};

// Helper function to estimate cooking time
const estimateCookingTime = (cookingMethod) => {
  switch (cookingMethod.toLowerCase()) {
    case 'bake/roast':
    case 'bake':
    case 'roast':
      return '25-35 minutes';
    case 'stir-fry':
    case 'sauté':
      return '15-20 minutes';
    case 'grill':
    case 'grilled':
      return '20-25 minutes';
    case 'steam':
    case 'steamed':
      return '20-25 minutes';
    case 'boil':
    case 'simmer':
      return '25-30 minutes';
    default:
      return '20-30 minutes';
  }
};

// Helper function to determine difficulty
const determineDifficulty = (cookingMethod) => {
  switch (cookingMethod.toLowerCase()) {
    case 'steam':
    case 'steamed':
    case 'boil':
      return 'Easy';
    case 'bake/roast':
    case 'bake':
    case 'roast':
      return 'Easy';
    case 'stir-fry':
    case 'sauté':
      return 'Medium';
    case 'grill':
    case 'grilled':
      return 'Medium';
    default:
      return 'Easy';
  }
};

// SMART INGREDIENT MATCHING ALGORITHM
const findBestRecipeMatch = async (userIngredients, preferences) => {
  try {
    const [proteins, vegetables, carbs, sauces, methods] = await Promise.all([
      RecipeComponent.find({ type: "protein" }),
      RecipeComponent.find({ type: "vegetable" }),
      RecipeComponent.find({ type: "carb" }),
      RecipeComponent.find({ type: "sauce_base" }),
      RecipeComponent.find({ type: "cooking_method" })
    ]);

    // Score components based on user ingredients
    const scoreComponent = (components, userIngredients) => {
      return components.map(component => {
        let score = 0;
        let matchedIngredients = [];
        
        const componentName = component.name.toLowerCase();
        userIngredients.forEach(userIng => {
          const userIngName = userIng.toLowerCase();
          
          // Exact match (10 points)
          if (componentName.includes(userIngName) || userIngName.includes(componentName)) {
            score += 10;
            matchedIngredients.push(userIng);
          }
          // Partial match (5 points)
          else if (componentName.split(' ').some(word => userIngName.includes(word)) ||
                   userIngName.split(' ').some(word => componentName.includes(word))) {
            score += 5;
            matchedIngredients.push(userIng);
          }
        });
        
        return { component, score, matchedIngredients };
      }).sort((a, b) => b.score - a.score);
    };

    // Score all component types
    const scoredProteins = scoreComponent(proteins, userIngredients);
    const scoredVegetables = scoreComponent(vegetables, userIngredients);
    const scoredCarbs = scoreComponent(carbs, userIngredients);
    const scoredSauces = scoreComponent(sauces, userIngredients);

    // Select best matches (prefer user ingredients, fallback to random)
    const selectedProtein = scoredProteins[0].score > 0 ? 
      scoredProteins[0].component : 
      proteins[Math.floor(Math.random() * proteins.length)];
    
    const selectedVegetable = scoredVegetables[0].score > 0 ? 
      scoredVegetables[0].component : 
      vegetables[Math.floor(Math.random() * vegetables.length)];
    
    const selectedCarb = scoredCarbs[0].score > 0 ? 
      scoredCarbs[0].component : 
      carbs[Math.floor(Math.random() * carbs.length)];
    
    const selectedSauce = scoredSauces[0].score > 0 ? 
      scoredSauces[0].component : 
      sauces[Math.floor(Math.random() * sauces.length)];

    const selectedMethod = methods[Math.floor(Math.random() * methods.length)];

    // Calculate match statistics
    const totalScore = scoredProteins[0].score + scoredVegetables[0].score + 
                      scoredCarbs[0].score + scoredSauces[0].score;
    
    const allMatchedIngredients = [
      ...scoredProteins[0].matchedIngredients,
      ...scoredVegetables[0].matchedIngredients,
      ...scoredCarbs[0].matchedIngredients,
      ...scoredSauces[0].matchedIngredients
    ];
    
    const requiredIngredients = [
      selectedProtein.name,
      selectedVegetable.name,
      selectedCarb.name,
      selectedSauce.name
    ];
    
    const missingIngredients = requiredIngredients.filter(req => 
      !userIngredients.some(userIng => 
        req.toLowerCase().includes(userIng.toLowerCase()) || 
        userIng.toLowerCase().includes(req.toLowerCase())
      )
    );

    return {
      selectedProtein,
      selectedVegetable,
      selectedCarb,
      selectedSauce,
      selectedMethod,
      matchInfo: {
        totalScore,
        matchedCount: allMatchedIngredients.length,
        totalRequired: requiredIngredients.length,
        missingIngredients: missingIngredients.length > 0 ? missingIngredients : null,
        matchedIngredients: allMatchedIngredients
      }
    };
  } catch (error) {
    console.error('Error in findBestRecipeMatch:', error);
    throw error;
  }
};

// --- API ENDPOINTS ---

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to DishCraft API - Enhanced with Smart Ingredient Matching!");
});

// GET all ingredients
app.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients = await Ingredient.find().sort({ name: 1 });
    res.json(ingredients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error fetching ingredients");
  }
});

// POST generate recipe - ENHANCED WITH SMART MATCHING
app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { preferences } = req.body;
    const { mode, userIngredients, dietary, cuisine, protein } = preferences || {};

    console.log('Recipe generation request:', { mode, userIngredients: userIngredients?.length, dietary, cuisine });

    let selectedComponents;
    let matchInfo = null;

    if (mode === 'ingredients' && userIngredients && userIngredients.length > 0) {
      // SMART INGREDIENT-BASED GENERATION
      console.log('Using smart ingredient matching with:', userIngredients);
      selectedComponents = await findBestRecipeMatch(userIngredients, preferences);
      matchInfo = selectedComponents.matchInfo;
    } else {
      // RANDOM RECIPE GENERATION
      console.log('Using random recipe generation');
      const [proteinOptions, vegetableOptions, carbOptions, sauceOptions, methodOptions] = await Promise.all([
        RecipeComponent.find({ type: "protein" }),
        RecipeComponent.find({ type: "vegetable" }),
        RecipeComponent.find({ type: "carb" }),
        RecipeComponent.find({ type: "sauce_base" }),
        RecipeComponent.find({ type: "cooking_method" })
      ]);

      if (!proteinOptions.length || !vegetableOptions.length || !carbOptions.length || 
          !sauceOptions.length || !methodOptions.length) {
        return res.status(500).json({ error: "Insufficient recipe components in database" });
      }

      selectedComponents = {
        selectedProtein: proteinOptions[Math.floor(Math.random() * proteinOptions.length)],
        selectedVegetable: vegetableOptions[Math.floor(Math.random() * vegetableOptions.length)],
        selectedCarb: carbOptions[Math.floor(Math.random() * carbOptions.length)],
        selectedSauce: sauceOptions[Math.floor(Math.random() * sauceOptions.length)],
        selectedMethod: methodOptions[Math.floor(Math.random() * methodOptions.length)]
      };
    }

    const { selectedProtein, selectedVegetable, selectedCarb, selectedSauce, selectedMethod } = selectedComponents;

    // Generate smart recipe title and description
    const title = mode === 'ingredients' && matchInfo?.matchedCount > 0 ?
      `Custom ${selectedMethod.name} ${selectedProtein.name} with ${selectedVegetable.name}` :
      `${selectedMethod.name} ${selectedProtein.name} with ${selectedVegetable.name}`;

    const description = mode === 'ingredients' ?
      `A personalized recipe created using your available ingredients. This ${selectedMethod.name.toLowerCase()} recipe makes great use of what you have in your kitchen!` :
      `A delicious and nutritious ${selectedMethod.name.toLowerCase()} recipe featuring ${selectedProtein.name.toLowerCase()}, ${selectedVegetable.name.toLowerCase()}, and ${selectedCarb.name.toLowerCase()}, all brought together with ${selectedSauce.name.toLowerCase()}.`;

    // Generate detailed instructions
    const instructions = generateInstructions(
      selectedProtein.name,
      selectedVegetable.name,
      selectedCarb.name,
      selectedSauce.name,
      selectedMethod.name
    );

    const generatedRecipe = {
      title,
      description,
      components: {
        protein: selectedProtein.name,
        vegetable: selectedVegetable.name,
        carb: selectedCarb.name,
        sauce: selectedSauce.name,
        cookingMethod: selectedMethod.name,
      },
      instructions,
      cookingTime: estimateCookingTime(selectedMethod.name),
      difficulty: determineDifficulty(selectedMethod.name),
      servings: 4,
      prepTime: "10-15 minutes",
      // Include ingredient match information for smart recipes
      ...(matchInfo && {
        ingredientMatch: {
          matchedCount: matchInfo.matchedCount,
          totalRequired: matchInfo.totalRequired,
          missingIngredients: matchInfo.missingIngredients,
          matchScore: Math.round((matchInfo.matchedCount / matchInfo.totalRequired) * 100)
        }
      })
    };

    console.log('Generated recipe:', { 
      title, 
      mode, 
      matchInfo: matchInfo ? `${matchInfo.matchedCount}/${matchInfo.totalRequired}` : 'N/A' 
    });

    res.json(generatedRecipe);
  } catch (err) {
    console.error("Error generating recipe:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Server Error generating recipe", details: err.message });
  }
});

// MEAL PLAN ENDPOINTS (unchanged)
app.post("/api/meal-plans", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Meal plan name is required." });
    }
    const newMealPlan = new MealPlan({ name });
    await newMealPlan.save();
    res.status(201).json(newMealPlan);
  } catch (err) {
    console.error("Error creating meal plan:", err.message);
    res.status(500).send("Server Error creating meal plan");
  }
});

app.get("/api/meal-plans", async (req, res) => {
  try {
    const mealPlans = await MealPlan.find().populate("meals");
    res.json(mealPlans);
  } catch (err) {
    console.error("Error fetching meal plans:", err.message);
    res.status(500).send("Server Error fetching meal plans");
  }
});

app.post("/api/meal-plans/:planId/add-recipe", async (req, res) => {
  try {
    const { planId } = req.params;
    const { recipeDetails, mealType } = req.body;

    if (!recipeDetails || !recipeDetails.title) {
      return res.status(400).json({ message: "Recipe details are required." });
    }

    const mealPlan = await MealPlan.findById(planId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found." });
    }

    const newMeal = new Meal({
      recipeTitle: recipeDetails.title,
      recipeDetails: recipeDetails,
      mealType: mealType || "dinner",
    });
    await newMeal.save();

    mealPlan.meals.push(newMeal._id);
    await mealPlan.save();

    res.status(200).json({ message: "Recipe added to meal plan successfully!", mealPlan });
  } catch (err) {
    console.error("Error adding recipe to meal plan:", err.message);
    res.status(500).send("Server Error adding recipe to meal plan");
  }
});

app.delete("/api/meal-plans/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    
    const mealPlan = await MealPlan.findById(planId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found." });
    }

    if (mealPlan.meals && mealPlan.meals.length > 0) {
      await Meal.deleteMany({ _id: { $in: mealPlan.meals } });
    }

    await MealPlan.findByIdAndDelete(planId);

    res.status(200).json({ message: "Meal plan deleted successfully!" });
  } catch (err) {
    console.error("Error deleting meal plan:", err.message);
    res.status(500).send("Server Error deleting meal plan");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("🧠 Smart DishCraft API with Ingredient Matching is ready!");
});
