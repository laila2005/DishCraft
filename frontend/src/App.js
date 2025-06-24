import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForms from './components/AuthForms';
import ChefDashboard from './components/ChefDashboard';
import './App.css';

// Main App Component (wrapped with authentication)
function AppContent() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [showAuthForms, setShowAuthForms] = useState(false);

  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [errorIngredients, setErrorIngredients] = useState(null);

  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [errorRecipe, setErrorRecipe] = useState(null);

  const [userIngredients, setUserIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [showIngredientSuggestions, setShowIngredientSuggestions] = useState(false);

  // Recipe generation options
  const [recipeOptions, setRecipeOptions] = useState({
    cookingMethod: 'Stir-frying',
    cuisine: 'Italian',
    difficulty: 'Medium',
    prepTime: '20-30 minutes'
  });

  const [mealPlans, setMealPlans] = useState([]);
  const [loadingMealPlans, setLoadingMealPlans] = useState(false);
  const [errorMealPlans, setErrorMealPlans] = useState(null);
  const [newMealPlanName, setNewMealPlanName] = useState('');

  const getBackendUrl = () => {
    return process.env.REACT_APP_BACKEND_URL || 'https://dishcraft-backend-3tk2.onrender.com';
  };

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoadingIngredients(true);
        setErrorIngredients(null);

        const backendUrl = getBackendUrl();
        console.log('Fetching ingredients from:', `${backendUrl}/api/ingredients`);

        const response = await axios.get(`${backendUrl}/api/ingredients`);

        // Check if response.data has a 'data' property and if it's an array
        const ingredientsData = response.data.data || response.data;
        if (Array.isArray(ingredientsData)) {
          setIngredients(ingredientsData);
          console.log(`Successfully loaded ${ingredientsData.length} ingredients`);
        } else {
          console.warn('Ingredients data is not an array:', ingredientsData);
          setIngredients([]);
          setErrorIngredients('Invalid ingredients data format');
        }
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        setErrorIngredients('Failed to load ingredients. Please check your connection.');
        setIngredients([]);
      } finally {
        setLoadingIngredients(false);
      }
    };

    fetchIngredients();
  }, []);

  const handleIngredientInputChange = useCallback((e) => {
    const value = e.target.value;
    setIngredientInput(value);

    if (value.trim()) {
      const filtered = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredIngredients(filtered);
      setShowIngredientSuggestions(true);
    } else {
      setFilteredIngredients([]);
      setShowIngredientSuggestions(false);
    }
  }, [ingredients]);

  const addIngredient = useCallback((ingredientName) => {
    if (ingredientName && !userIngredients.includes(ingredientName)) {
      setUserIngredients(prev => [...prev, ingredientName]);
      setIngredientInput('');
      setShowIngredientSuggestions(false);
    }
  }, [userIngredients]);

  const removeIngredient = useCallback((ingredientName) => {
    setUserIngredients(prev => prev.filter(ing => ing !== ingredientName));
  }, []);

  const handleRecipeOptionChange = (option, value) => {
    setRecipeOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const generateRecipe = async () => {
    if (userIngredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    try {
      setLoadingRecipe(true);
      setErrorRecipe(null);
      console.log('Generating recipe with ingredients:', userIngredients);

      const backendUrl = getBackendUrl();
      const response = await axios.post(`${backendUrl}/api/generate-recipe`, {
        ingredients: userIngredients,
        cookingMethod: recipeOptions.cookingMethod,
        cuisine: recipeOptions.cuisine,
        difficulty: recipeOptions.difficulty,
        prepTime: recipeOptions.prepTime
      });

      setGeneratedRecipe(response.data);
    } catch (error) {
      console.error('Error generating recipe:', error);
      setErrorRecipe('Failed to generate recipe. Please try again.');
    } finally {
      setLoadingRecipe(false);
    }
  };

  const fetchMealPlans = async () => {
    try {
      setLoadingMealPlans(true);
      setErrorMealPlans(null);

      const backendUrl = getBackendUrl();
      const token = localStorage.getItem('dishcraft_token');
      const response = await axios.get(`${backendUrl}/api/meal-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMealPlans(response.data);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      setErrorMealPlans('Failed to load meal plans');
    } finally {
      setLoadingMealPlans(false);
    }
  };

  const createMealPlan = async () => {
    if (!newMealPlanName.trim()) {
      alert('Please enter a meal plan name');
      return;
    }

    try {
      const backendUrl = getBackendUrl();
      const token = localStorage.getItem('dishcraft_token');
      const response = await axios.post(`${backendUrl}/api/meal-plans`, {
        name: newMealPlanName,
        description: 'Custom meal plan',
        meals: []
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMealPlans(prev => [...prev, response.data.mealPlan]);
      setNewMealPlanName('');
    } catch (error) {
      console.error('Error creating meal plan:', error);
      alert('Failed to create meal plan');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMealPlans();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (showAuthForms) {
    return (
      <div className="App">
        <AuthForms onClose={() => setShowAuthForms(false)} />
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'chef') {
    return (
      <div className="App">
        <ChefDashboard />
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1>DishCraft</h1>
            <p>Generate Your Next Meal</p>
          </div>
          <div className="main-navigation">
            {isAuthenticated ? (
              <div className="user-info">
                <span>Welcome, {user?.name || user?.email}!</span>
                <button onClick={logout} className="logout-btn">Logout</button>
              </div>
            ) : (
              <button onClick={() => setShowAuthForms(true)} className="nav-btn">
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="recipe-generator">
          <h2>Generate Your Next Meal</h2>
          <p className="generator-description">
            Backend: {getBackendUrl()}
          </p>
          
          {errorIngredients && (
            <div className="error-message">
              ⚠️ {errorIngredients}
            </div>
          )}
          
          <div className="ingredient-input-section">
            <h3>Enter ingredients you have...</h3>
            <div className="input-container">
              <input
                type="text"
                value={ingredientInput}
                onChange={handleIngredientInputChange}
                placeholder="Enter ingredients you have..."
                className="ingredient-input"
              />
              <button 
                onClick={() => addIngredient(ingredientInput)}
                className="nav-btn"
                style={{ marginLeft: '10px' }}
              >
                Add Ingredient
              </button>
              {showIngredientSuggestions && filteredIngredients.length > 0 && (
                <div className="ingredient-suggestions">
                  {filteredIngredients.slice(0, 5).map((ingredient, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => addIngredient(ingredient.name)}
                    >
                      {ingredient.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="selected-ingredients">
            <h3>Selected Ingredients:</h3>
            {userIngredients.length === 0 ? (
              <p className="no-ingredients">No ingredients selected</p>
            ) : (
              <div className="ingredient-tags">
                {userIngredients.map((ingredient, index) => (
                  <span key={index} className="ingredient-tag">
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="remove-ingredient"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={generateRecipe}
            disabled={loadingRecipe || userIngredients.length === 0}
            className="generate-btn"
          >
            {loadingRecipe ? 'Generating Recipe...' : 'Generate Recipe'}
          </button>

          {errorRecipe && (
            <div className="error-message">{errorRecipe}</div>
          )}

          {generatedRecipe && (
            <div className="generated-recipe">
              <h3>{generatedRecipe.name}</h3>
              
              {generatedRecipe.missingIngredients && generatedRecipe.missingIngredients.length > 0 && (
                <div className="missing-ingredients">
                  <h4>Missing Ingredients:</h4>
                  <div className="missing-ingredient-tags">
                    {generatedRecipe.missingIngredients.map((ingredient, index) => (
                      <span key={index} className="missing-ingredient-tag">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="recipe-details">
                <div className="detail-item">
                  <strong>Cooking Time:</strong> {generatedRecipe.prepTime}
                </div>
                <div className="detail-item">
                  <strong>Difficulty:</strong> {generatedRecipe.difficulty}
                </div>
                <div className="detail-item">
                  <strong>Cuisine:</strong> {generatedRecipe.cuisine}
                </div>
                <div className="detail-item">
                  <strong>Cooking Method:</strong> {generatedRecipe.cookingMethod}
                </div>
                {generatedRecipe.servings && (
                  <div className="detail-item">
                    <strong>Servings:</strong> {generatedRecipe.servings}
                  </div>
                )}
                {generatedRecipe.calories && (
                  <div className="detail-item">
                    <strong>Calories:</strong> {generatedRecipe.calories}
                  </div>
                )}
              </div>

              <div className="recipe-ingredients">
                <h4>Ingredients:</h4>
                <div className="ingredient-list">
                  {generatedRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="ingredient-item">
                      <span className="ingredient-quantity">{ingredient.quantity}</span>
                      <span className="ingredient-name">{ingredient.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recipe-instructions">
                <h4>Instructions:</h4>
                <ol className="instructions-list">
                  {generatedRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="instruction-step">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="meal-plans-section">
            <h2>Meal Plans</h2>
            
            <div className="create-meal-plan">
              <input
                type="text"
                value={newMealPlanName}
                onChange={(e) => setNewMealPlanName(e.target.value)}
                placeholder="Enter meal plan name"
                className="meal-plan-input"
              />
              <button onClick={createMealPlan} className="create-meal-plan-btn">
                Create Meal Plan
              </button>
            </div>

            {loadingMealPlans ? (
              <div className="loading">Loading meal plans...</div>
            ) : errorMealPlans ? (
              <div className="error-message">{errorMealPlans}</div>
            ) : (
              <div className="meal-plans-list">
                {mealPlans.length === 0 ? (
                  <p>No meal plans found</p>
                ) : (
                  mealPlans.map((plan, index) => (
                    <div key={index} className="meal-plan-item">
                      <h3>{plan.name}</h3>
                      <p>{plan.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Main App wrapper with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
