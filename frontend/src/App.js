import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Existing state for ingredients and recipe generation
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [errorIngredients, setErrorIngredients] = useState(null);

  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [errorRecipe, setErrorRecipe] = useState(null);

  const [selectedDietary, setSelectedDietary] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedProtein, setSelectedProtein] = useState('');

  // NEW: State for Meal Planning
  const [mealPlans, setMealPlans] = useState([]);
  const [loadingMealPlans, setLoadingMealPlans] = useState(false);
  const [errorMealPlans, setErrorMealPlans] = useState(null);
  const [newMealPlanName, setNewMealPlanName] = useState('');
  const [selectedMealPlanId, setSelectedMealPlanId] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('dinner');

  // IMPORTANT: Your actual Render backend URL
  const BACKEND_URL = 'https://dishcraft-backend-3tk2.onrender.com'; 

  // Fetch ingredients on component mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/ingredients`);
        setIngredients(response.data);
        setLoadingIngredients(false);
      } catch (err) {
        console.error('Error fetching ingredients:', err);
        setErrorIngredients('Failed to load ingredients. Please check your backend URL and CORS settings.');
        setLoadingIngredients(false);
      }
    };
    fetchIngredients();
  }, []);

  // NEW: Fetch meal plans on component mount
  useEffect(() => {
    fetchMealPlans();
  }, []);

  // NEW: Function to fetch meal plans
  const fetchMealPlans = async () => {
    setLoadingMealPlans(true);
    setErrorMealPlans(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/meal-plans`);
      setMealPlans(response.data);
      if (response.data.length > 0 && !selectedMealPlanId) {
        setSelectedMealPlanId(response.data[0]._id); // Select the first plan by default
      }
      setLoadingMealPlans(false);
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      setErrorMealPlans('Failed to load meal plans.');
      setLoadingMealPlans(false);
    }
  };

  // Function to generate a recipe based on preferences
  const generateRecipe = async () => {
    setLoadingRecipe(true);
    setErrorRecipe(null);
    setGeneratedRecipe(null);
    const preferences = {
      dietary: selectedDietary,
      cuisine: selectedCuisine,
      protein: selectedProtein,
    };
    try {
      const response = await axios.post(`${BACKEND_URL}/api/generate-recipe`, { preferences });
      setGeneratedRecipe(response.data);
      setLoadingRecipe(false);
    } catch (err) {
      console.error('Error generating recipe:', err);
      setErrorRecipe('Failed to generate recipe. Please try again.');
      setLoadingRecipe(false);
    }
  };

  // NEW: Function to create a new meal plan
  const createMealPlan = async () => {
    if (!newMealPlanName.trim()) {
      alert('Please enter a name for the meal plan.');
      return;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/meal-plans`, { name: newMealPlanName });
      setMealPlans([...mealPlans, response.data]);
      setNewMealPlanName(''); // Clear input
      setSelectedMealPlanId(response.data._id); // Select the new plan
      alert('Meal plan created successfully!');
    } catch (err) {
      console.error('Error creating meal plan:', err);
      alert('Failed to create meal plan.');
    }
  };

  // NEW: Function to add generated recipe to selected meal plan
  const addRecipeToPlan = async () => {
    if (!generatedRecipe) {
      alert('Please generate a recipe first.');
      return;
    }
    if (!selectedMealPlanId) {
      alert('Please select or create a meal plan.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/meal-plans/${selectedMealPlanId}/add-recipe`, {
        recipeDetails: generatedRecipe,
        mealType: selectedMealType
      });
      alert('Recipe added to meal plan!');
      fetchMealPlans(); // Refresh meal plans to show updated content
    } catch (err) {
      console.error('Error adding recipe to meal plan:', err);
      alert('Failed to add recipe to meal plan.');
    }
  };

  // NEW: Function to delete a meal plan
  const deleteMealPlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await axios.delete(`${BACKEND_URL}/api/meal-plans/${planId}`);
        setMealPlans(mealPlans.filter(plan => plan._id !== planId));
        if (selectedMealPlanId === planId) {
          setSelectedMealPlanId(mealPlans.length > 1 ? mealPlans[0]._id : '');
        }
        alert('Meal plan deleted successfully!');
      } catch (err) {
        console.error('Error deleting meal plan:', err);
        alert('Failed to delete meal plan.');
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🍽️ DishCraft</h1>
        <p>Smart Recipe Generator & Meal Planner</p>
      </header>

      <main>
        {/* Ingredients Section */}
        <section className="ingredients-section">
          <h2>📋 Available Ingredients</h2>
          {loadingIngredients ? (
            <p>Loading ingredients...</p>
          ) : errorIngredients ? (
            <p className="error-message">Error: {errorIngredients}</p>
          ) : ingredients.length === 0 ? (
            <p>No ingredients found. Please seed your database.</p>
          ) : (
            <ul className="ingredient-list">
              {ingredients.map((ingredient) => (
                <li key={ingredient._id}>{ingredient.name}</li>
              ))}
            </ul>
          )}
        </section>

        <hr />

        {/* Recipe Generation Section */}
        <section className="recipe-generation-section">
          <h2>🎲 Generate a New Recipe</h2>
          <div className="preferences-input">
            <div className="input-group">
              <label htmlFor="dietary-select">Dietary Preference:</label>
              <select
                id="dietary-select"
                value={selectedDietary}
                onChange={(e) => setSelectedDietary(e.target.value)}
              >
                <option value="">Any</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten-Free</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="cuisine-select">Cuisine Type:</label>
              <select
                id="cuisine-select"
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
              >
                <option value="">Any</option>
                <option value="italian">Italian</option>
                <option value="mexican">Mexican</option>
                <option value="asian">Asian</option>
                <option value="american">American</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="protein-select">Main Protein:</label>
              <select
                id="protein-select"
                value={selectedProtein}
                onChange={(e) => setSelectedProtein(e.target.value)}
              >
                <option value="">Any</option>
                {ingredients.filter(ing => ing.category === 'protein').map(ing => (
                  <option key={ing._id} value={ing.name.toLowerCase()}>{ing.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={generateRecipe} disabled={loadingRecipe} className="generate-btn">
            {loadingRecipe ? '🔄 Generating...' : '✨ Generate Recipe'}
          </button>

          {loadingRecipe && <p className="loading-message">🍳 Generating your delicious recipe...</p>}
          {errorRecipe && <p className="error-message">❌ Error: {errorRecipe}</p>}

          {generatedRecipe && (
            <div className="generated-recipe-card">
              <h3>🍽️ {generatedRecipe.title}</h3>
              <p className="recipe-description">{generatedRecipe.description}</p>
              
              <div className="recipe-details">
                <div className="recipe-info">
                  <span className="info-item">⏱️ <strong>Time:</strong> {generatedRecipe.cookingTime}</span>
                  <span className="info-item">📊 <strong>Difficulty:</strong> {generatedRecipe.difficulty}</span>
                </div>

                <h4>🥘 Components:</h4>
                <ul className="components-list">
                  <li><strong>Protein:</strong> {generatedRecipe.components.protein}</li>
                  <li><strong>Vegetable:</strong> {generatedRecipe.components.vegetable}</li>
                  <li><strong>Carb:</strong> {generatedRecipe.components.carb}</li>
                  <li><strong>Sauce:</strong> {generatedRecipe.components.sauce}</li>
                  <li><strong>Cooking Method:</strong> {generatedRecipe.components.cookingMethod}</li>
                </ul>

                <h4>📝 Instructions:</h4>
                <ol className="instructions-list">
                  {generatedRecipe.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* NEW: Add to Meal Plan Section */}
              <div className="add-to-plan-section">
                <h4>📅 Add to Meal Plan</h4>
                <div className="meal-plan-controls">
                  <select 
                    value={selectedMealPlanId} 
                    onChange={(e) => setSelectedMealPlanId(e.target.value)} 
                    disabled={mealPlans.length === 0}
                    className="meal-plan-select"
                  >
                    {mealPlans.length === 0 ? (
                      <option value="">No meal plans available</option>
                    ) : (
                      mealPlans.map(plan => (
                        <option key={plan._id} value={plan._id}>{plan.name}</option>
                      ))
                    )}
                  </select>
                  
                  <select 
                    value={selectedMealType} 
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    className="meal-type-select"
                  >
                    <option value="breakfast">🌅 Breakfast</option>
                    <option value="lunch">☀️ Lunch</option>
                    <option value="dinner">🌙 Dinner</option>
                    <option value="snack">🍿 Snack</option>
                  </select>
                  
                  <button 
                    onClick={addRecipeToPlan} 
                    disabled={!generatedRecipe || !selectedMealPlanId}
                    className="add-recipe-btn"
                  >
                    ➕ Add to Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <hr />

        {/* NEW: Meal Planning Section */}
        <section className="meal-planning-section">
          <h2>📅 My Meal Plans</h2>
          
          <div className="create-meal-plan-form">
            <input 
              type="text" 
              value={newMealPlanName} 
              onChange={(e) => setNewMealPlanName(e.target.value)} 
              placeholder="Enter meal plan name (e.g., 'This Week's Meals')"
              className="meal-plan-input"
            />
            <button onClick={createMealPlan} className="create-plan-btn">
              ➕ Create Meal Plan
            </button>
          </div>

          {loadingMealPlans && <p className="loading-message">Loading meal plans...</p>}
          {errorMealPlans && <p className="error-message">❌ Error: {errorMealPlans}</p>}
          
          {mealPlans.length === 0 && !loadingMealPlans && (
            <div className="empty-state">
              <p>📝 You don't have any meal plans yet.</p>
              <p>Create your first meal plan above to get started!</p>
            </div>
          )}

          <div className="meal-plans-grid">
            {mealPlans.map(plan => (
              <div key={plan._id} className="meal-plan-card">
                <div className="meal-plan-header">
                  <h3>📋 {plan.name}</h3>
                  <button 
                    onClick={() => deleteMealPlan(plan._id)}
                    className="delete-plan-btn"
                    title="Delete meal plan"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="meal-plan-content">
                  {plan.meals && plan.meals.length > 0 ? (
                    <ul className="meals-list">
                      {plan.meals.map(meal => (
                        <li key={meal._id} className="meal-item">
                          <div className="meal-info">
                            <span className="meal-title">🍽️ {meal.recipeTitle}</span>
                            <span className="meal-meta">
                              {meal.mealType === 'breakfast' && '🌅'}
                              {meal.mealType === 'lunch' && '☀️'}
                              {meal.mealType === 'dinner' && '🌙'}
                              {meal.mealType === 'snack' && '🍿'}
                              {meal.mealType || 'dinner'} • {new Date(meal.date).toLocaleDateString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-plan">This meal plan is empty. Generate a recipe and add it!</p>
                  )}
                </div>
                
                <div className="meal-plan-stats">
                  <span className="meal-count">
                    📊 {plan.meals ? plan.meals.length : 0} meal{plan.meals && plan.meals.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
