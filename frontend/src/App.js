import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForms from './components/AuthForms';
import './App.css';

// Main App Component (wrapped with authentication)
function AppContent() {
  // Existing state for ingredients and recipe generation
  const [ingredients, setIngredients] = useState([]);
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
  const [selectedMealPlanId, setSelectedMealPlanId] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('dinner');

  // Authentication state
  const [showAuthForms, setShowAuthForms] = useState(false);
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  // Backend URL
  const BACKEND_URL = 'https://dishcraft-backend-3tk2.onrender.com';

  // Function to fetch meal plans (now requires authentication )
  const fetchMealPlans = useCallback(async () => {
    if (!isAuthenticated) {
      setMealPlans([]);
      return;
    }

    setLoadingMealPlans(true);
    setErrorMealPlans(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/meal-plans`);
      setMealPlans(response.data);
      if (response.data.length > 0 && !selectedMealPlanId) {
        setSelectedMealPlanId(response.data[0]._id);
      }
      setLoadingMealPlans(false);
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      if (err.response?.status === 401) {
        setErrorMealPlans('Please log in to view your meal plans.');
      } else {
        setErrorMealPlans('Failed to load meal plans.');
      }
      setLoadingMealPlans(false);
    }
  }, [BACKEND_URL, selectedMealPlanId, isAuthenticated]);

  // Fetch ingredients on component mount (public endpoint)
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/ingredients`);
        setIngredients(response.data);
        setLoadingIngredients(false);
      } catch (err) {
        console.error('Error fetching ingredients:', err);
        setErrorIngredients('Failed to load ingredients.');
        setLoadingIngredients(false);
      }
    };
    fetchIngredients();
  }, [BACKEND_URL]);

  // Fetch meal plans when authentication status changes
  useEffect(() => {
    if (!authLoading) {
      fetchMealPlans();
    }
  }, [fetchMealPlans, authLoading]);

  // Filter ingredients based on user input
  useEffect(() => {
    if (ingredientInput.trim() && ingredients.length > 0) {
      const filtered = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(ingredientInput.toLowerCase()) &&
        !userIngredients.some(userIng => userIng._id === ingredient._id)
      );
      setFilteredIngredients(filtered.slice(0, 8));
      setShowIngredientSuggestions(true);
    } else {
      setFilteredIngredients([]);
      setShowIngredientSuggestions(false);
    }
  }, [ingredientInput, ingredients, userIngredients]);

  // Add ingredient to user's list
  const addIngredient = (ingredient) => {
    setUserIngredients([...userIngredients, ingredient]);
    setIngredientInput('');
    setShowIngredientSuggestions(false);
  };

  // Remove ingredient from user's list
  const removeIngredient = (ingredientId) => {
    setUserIngredients(userIngredients.filter(ing => ing._id !== ingredientId));
  };

  // Add ingredient by typing (custom ingredient)
  const addCustomIngredient = () => {
    if (ingredientInput.trim() && !userIngredients.some(ing => ing.name.toLowerCase() === ingredientInput.toLowerCase())) {
      const customIngredient = {
        _id: `custom_${Date.now()}`,
        name: ingredientInput.trim(),
        category: 'custom'
      };
      setUserIngredients([...userIngredients, customIngredient]);
      setIngredientInput('');
      setShowIngredientSuggestions(false);
    }
  };

  // Generate recipe based on user ingredients
  const generateRecipe = async () => {
    setLoadingRecipe(true);
    setErrorRecipe(null);
    setGeneratedRecipe(null);

    const preferences = {
      mode: 'ingredients',
      userIngredients: userIngredients.map(ing => ing.name)
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

  // Function to create a new meal plan (requires authentication)
  const createMealPlan = async () => {
    if (!isAuthenticated) {
      alert('Please log in to create meal plans.');
      setShowAuthForms(true);
      return;
    }

    if (!newMealPlanName.trim()) {
      alert('Please enter a name for the meal plan.');
      return;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/meal-plans`, { name: newMealPlanName });
      setMealPlans([...mealPlans, response.data]);
      setNewMealPlanName('');
      setSelectedMealPlanId(response.data._id);
      alert('Meal plan created successfully!');
    } catch (err) {
      console.error('Error creating meal plan:', err);
      if (err.response?.status === 401) {
        alert('Please log in to create meal plans.');
        setShowAuthForms(true);
      } else {
        alert('Failed to create meal plan.');
      }
    }
  };

  // Function to add generated recipe to selected meal plan (requires authentication)
  const addRecipeToPlan = async () => {
    if (!isAuthenticated) {
      alert('Please log in to save recipes to meal plans.');
      setShowAuthForms(true);
      return;
    }

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
      fetchMealPlans();
    } catch (err) {
      console.error('Error adding recipe to meal plan:', err);
      if (err.response?.status === 401) {
        alert('Please log in to save recipes.');
        setShowAuthForms(true);
      } else {
        alert('Failed to add recipe to meal plan.');
      }
    }
  };

  // Function to delete a meal plan (requires authentication)
  const deleteMealPlan = async (planId) => {
    if (!isAuthenticated) return;

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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <h2>🍳 Loading DishCraft...</h2>
          <p>Preparing your kitchen assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🧑‍🍳 DishCraft</h1>
            <p>Smart Kitchen Assistant - Create recipes from your ingredients</p>
          </div>
          
          <div className="header-right">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="welcome-text">👋 Welcome, {user.name}!</span>
                <button onClick={logout} className="logout-btn">
                  🚪 Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthForms(true)} 
                className="login-btn"
              >
                🔐 Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Authentication Notice for Non-Authenticated Users */}
        {!isAuthenticated && (
          <div className="auth-notice">
            <h3>🎉 Welcome to DishCraft!</h3>
            <p>Create an account to save your meal plans and access personalized features.</p>
            <button 
              onClick={() => setShowAuthForms(true)} 
              className="auth-notice-btn"
            >
              Get Started - It's Free! 🚀
            </button>
          </div>
        )}

        {/* Main Ingredient Input Section */}
        <section className="ingredient-input-section">
          <h2>🥘 What's in Your Kitchen?</h2>
          <p className="section-description">Tell us what ingredients you have, and we'll create the perfect recipe for you!</p>
          
          <div className="ingredient-input-container">
            <div className="input-wrapper">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomIngredient()}
                placeholder="Type an ingredient (e.g., chicken, tomatoes, rice)..."
                className="ingredient-input"
              />
              <button onClick={addCustomIngredient} className="add-ingredient-btn">
                ➕ Add
              </button>
            </div>

            {/* Ingredient Suggestions */}
            {showIngredientSuggestions && filteredIngredients.length > 0 && (
              <div className="ingredient-suggestions">
                {filteredIngredients.map(ingredient => (
                  <button
                    key={ingredient._id}
                    onClick={() => addIngredient(ingredient)}
                    className="suggestion-btn"
                  >
                    {ingredient.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User's Selected Ingredients */}
          {userIngredients.length > 0 && (
            <div className="selected-ingredients">
              <h3>🛒 Your Ingredients ({userIngredients.length})</h3>
              <div className="ingredient-tags">
                {userIngredients.map(ingredient => (
                  <span key={ingredient._id} className="ingredient-tag">
                    {ingredient.name}
                    <button 
                      onClick={() => removeIngredient(ingredient._id)}
                      className="remove-ingredient"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              {userIngredients.length < 3 && (
                <p className="ingredient-tip">💡 Add at least 3 ingredients for better recipe suggestions!</p>
              )}
            </div>
          )}

          {/* Generate Recipe Button */}
          <div className="generate-section">
            <button 
              onClick={generateRecipe} 
              disabled={loadingRecipe || userIngredients.length === 0}
              className="generate-btn"
            >
              {loadingRecipe ? '🔄 Creating Your Recipe...' : '🧑‍🍳 Create Recipe from My Ingredients'}
            </button>

            {userIngredients.length === 0 && (
              <p className="warning-message">⚠️ Please add some ingredients first to generate a recipe!</p>
            )}
          </div>

          {loadingRecipe && <p className="loading-message">🍳 Analyzing your ingredients and creating the perfect recipe...</p>}
          {errorRecipe && <p className="error-message">❌ Error: {errorRecipe}</p>}

          {/* Generated Recipe Display */}
          {generatedRecipe && (
            <div className="generated-recipe-card">
              <h3>🍽️ {generatedRecipe.title}</h3>
              <p className="recipe-description">{generatedRecipe.description}</p>
              
              {/* Ingredient Match Information */}
              {generatedRecipe.ingredientMatch && (
                <div className="ingredient-match-info">
                  <p className="match-score">
                    🎯 <strong>Ingredient Match:</strong> {generatedRecipe.ingredientMatch.matchedCount} of {generatedRecipe.ingredientMatch.totalRequired} required ingredients ({generatedRecipe.ingredientMatch.matchScore}% match)
                  </p>
                  {generatedRecipe.ingredientMatch.missingIngredients && generatedRecipe.ingredientMatch.missingIngredients.length > 0 && (
                    <p className="missing-ingredients">
                      🛒 <strong>You might need:</strong> {generatedRecipe.ingredientMatch.missingIngredients.join(', ')}
                    </p>
                  )}
                </div>
              )}
              
              <div className="recipe-details">
                <div className="recipe-info">
                  <span className="info-item">⏱️ <strong>Time:</strong> {generatedRecipe.cookingTime}</span>
                  <span className="info-item">📊 <strong>Difficulty:</strong> {generatedRecipe.difficulty}</span>
                  <span className="info-item">👥 <strong>Serves:</strong> {generatedRecipe.servings || 4}</span>
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

              {/* Add to Meal Plan Section - Only show if authenticated */}
              {isAuthenticated && (
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
              )}

              {/* Login prompt for non-authenticated users */}
              {!isAuthenticated && (
                <div className="login-prompt">
                  <p>💡 <strong>Want to save this recipe?</strong></p>
                  <button 
                    onClick={() => setShowAuthForms(true)}
                    className="login-prompt-btn"
                  >
                    🔐 Login to Save Recipes
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <hr />

        {/* Meal Planning Section - Enhanced for Authentication */}
        <section className="meal-planning-section">
          <h2>📅 My Meal Plans</h2>
          
          {isAuthenticated ? (
            <>
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
            </>
          ) : (
            <div className="auth-required">
              <h3>🔐 Login Required</h3>
              <p>Create an account to access personalized meal planning features!</p>
              <button 
                onClick={() => setShowAuthForms(true)}
                className="auth-required-btn"
              >
                🚀 Get Started - It's Free!
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Authentication Forms Modal */}
      {showAuthForms && (
        <AuthForms onClose={() => setShowAuthForms(false)} />
      )}
    </div>
  );
}

// Main App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
