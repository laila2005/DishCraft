import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForms from './components/AuthForms';
import ChefDashboard from './components/ChefDashboard';
import './App.css';

// Main App Component (wrapped with authentication)
function AppContent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Existing state for ingredients and recipe generation
  const [ingredients, setIngredients] = useState([]); // Ensure it's initialized as an empty array
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [errorIngredients, setErrorIngredients] = useState(null);

  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [errorRecipe, setErrorRecipe] = useState(null);

  // State for ingredient-based recipe generation
  const [userIngredients, setUserIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [showIngredientSuggestions, setShowIngredientSuggestions] = useState(false);

  // State for Meal Planning
  const [mealPlans, setMealPlans] = useState([]);
  const [loadingMealPlans, setLoadingMealPlans] = useState(false);
  const [errorMealPlans, setErrorMealPlans] = useState(null);
  const [newMealPlanName, setNewMealPlanName] = useState('');

  // Fetch ingredients from backend
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoadingIngredients(true);
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/ingredients`);
        setIngredients(response.data.data); // Ensure data is an array
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        setErrorIngredients('Failed to load ingredients.');
      } finally {
        setLoadingIngredients(false);
      }
    };

    fetchIngredients();
  }, []);

  // Handle ingredient input change and filter suggestions
  const handleIngredientInputChange = useCallback((e) => {
    const input = e.target.value;
    setIngredientInput(input);
    if (input.length > 0) {
      // Ensure ingredients is an array before calling filter
      const filtered = Array.isArray(ingredients) 
        ? ingredients.filter(ing => 
            ing.name.toLowerCase().includes(input.toLowerCase())
          )
        : [];
      setFilteredIngredients(filtered);
      setShowIngredientSuggestions(true);
    } else {
      setFilteredIngredients([]);
      setShowIngredientSuggestions(false);
    }
  }, [ingredients]); // Depend on ingredients state

  // Add ingredient to user's list
  const addIngredient = useCallback((ingredientName) => {
    setUserIngredients(prev => {
      if (!prev.includes(ingredientName)) {
        return [...prev, ingredientName];
      }
      return prev;
    });
    setIngredientInput('');
    setShowIngredientSuggestions(false);
  }, []);

  // Remove ingredient from user's list
  const removeIngredient = useCallback((ingredientName) => {
    setUserIngredients(prev => prev.filter(ing => ing !== ingredientName));
  }, []);

  // Generate recipe
  const generateRecipe = useCallback(async () => {
    setLoadingRecipe(true);
    setErrorRecipe(null);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/generate-recipe`, {
        ingredients: userIngredients,
        // Add other preferences like dietaryRestrictions, cuisinePreference, mealType if you have them in your UI
      });
      setGeneratedRecipe(response.data.data);
    } catch (error) {
      console.error('Error generating recipe:', error);
      setErrorRecipe('Failed to generate recipe. Please try again.');
    } finally {
      setLoadingRecipe(false);
    }
  }, [userIngredients]);

  // Fetch meal plans
  useEffect(() => {
    const fetchMealPlans = async () => {
      if (isAuthenticated && user) {
        setLoadingMealPlans(true);
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          };
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/meal-plans`, config);
          setMealPlans(response.data.data);
        } catch (error) {
          console.error('Error fetching meal plans:', error);
          setErrorMealPlans('Failed to load meal plans.');
        } finally {
          setLoadingMealPlans(false);
        }
      }
    };
    fetchMealPlans();
  }, [isAuthenticated, user]);

  // Add meal plan
  const addMealPlan = useCallback(async () => {
    if (!newMealPlanName.trim()) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/meal-plans`, { name: newMealPlanName }, config);
      setMealPlans(prev => [...prev, response.data.data]);
      setNewMealPlanName('');
    } catch (error) {
      console.error('Error adding meal plan:', error);
      // Handle error, e.g., show a message to the user
    }
  }, [newMealPlanName]);

  // Render content based on authentication status
  return (
    <div className="App">
      <header className="App-header">
        <h1>DishCraft</h1>
        {isAuthenticated ? (
          <div className="auth-status">
            <p>Welcome, {user?.name} ({user?.role})!</p>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <p>Please log in or sign up</p>
        )}
      </header>

      <main>
        {!isAuthenticated ? (
          <AuthForms />
        ) : (
          <>
            <section className="recipe-generation-section">
              <h2>Generate Your Next Meal</h2>
              <div className="ingredient-input-container">
                <input
                  type="text"
                  placeholder="Enter ingredients you have..."
                  value={ingredientInput}
                  onChange={handleIngredientInputChange}
                  onFocus={() => setShowIngredientSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowIngredientSuggestions(false), 100)}
                />
                {showIngredientSuggestions && filteredIngredients.length > 0 && (
                  <ul className="suggestions-list">
                    {filteredIngredients.map(ing => (
                      <li key={ing._id} onMouseDown={() => addIngredient(ing.name)}>
                        {ing.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="user-ingredients-list">
                {userIngredients.map(ing => (
                  <span key={ing} className="ingredient-tag">
                    {ing}
                    <button onClick={() => removeIngredient(ing)}>x</button>
                  </span>
                ))}
              </div>
              <button onClick={generateRecipe} disabled={loadingRecipe || userIngredients.length === 0}>
                {loadingRecipe ? 'Generating...' : 'Generate Recipe'}
              </button>
              {errorRecipe && <p className="error-message">{errorRecipe}</p>}
              {generatedRecipe && (
                <div className="generated-recipe-card">
                  <h3>{generatedRecipe.name}</h3>
                  <p><strong>Ingredients:</strong> {generatedRecipe.ingredients.join(', ')}</p>
                  <p><strong>Instructions:</strong></p>
                  <ol>
                    {generatedRecipe.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <p><strong>Cooking Time:</strong> {generatedRecipe.cookingTime}</p>
                  <p><strong>Difficulty:</strong> {generatedRecipe.difficulty}</p>
                  {generatedRecipe.missingIngredients && generatedRecipe.missingIngredients.length > 0 && (
                    <p className="missing-ingredients">
                      <strong>Missing Ingredients:</strong> {generatedRecipe.missingIngredients.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="meal-plans-section">
              <h2>Your Meal Plans</h2>
              <div className="add-meal-plan">
                <input
                  type="text"
                  placeholder="New Meal Plan Name"
                  value={newMealPlanName}
                  onChange={(e) => setNewMealPlanName(e.target.value)}
                />
                <button onClick={addMealPlan}>Add Meal Plan</button>
              </div>
              {loadingMealPlans && <p>Loading meal plans...</p>}
              {errorMealPlans && <p className="error-message">{errorMealPlans}</p>}
              <div className="meal-plans-list">
                {mealPlans.length === 0 && !loadingMealPlans && <p>No meal plans yet. Add one!</p>}
                {mealPlans.map(plan => (
                  <div key={plan._id} className="meal-plan-card">
                    <h4>{plan.name}</h4>
                    {/* Display meals within the plan here */}
                  </div>
                ))}
              </div>
            </section>

            {user?.role === 'chef' && (
              <section className="chef-dashboard-section">
                <ChefDashboard />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Root App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
