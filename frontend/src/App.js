import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForms from './components/AuthForms';
import ChefDashboard from './components/ChefDashboard';
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
  const [selectedMealPlan, setSelectedMealPlan] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('dinner');

  // Authentication and navigation state
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuthForms, setShowAuthForms] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'chef-dashboard'

  const BACKEND_URL = 'https://dishcraft-backend-3tk2.onrender.com';

  // Fetch ingredients
  const fetchIngredients = useCallback(async ( ) => {
    try {
      setLoadingIngredients(true);
      const response = await axios.get(`${BACKEND_URL}/api/ingredients`);
      setIngredients(response.data);
      setLoadingIngredients(false);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setErrorIngredients('Failed to load ingredients');
      setLoadingIngredients(false);
    }
  }, [BACKEND_URL]);

  // Fetch meal plans
  const fetchMealPlans = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingMealPlans(true);
      const response = await axios.get(`${BACKEND_URL}/api/meal-plans`);
      setMealPlans(response.data);
      setLoadingMealPlans(false);
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      setErrorMealPlans('Failed to load meal plans');
      setLoadingMealPlans(false);
    }
  }, [BACKEND_URL, isAuthenticated]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  // Handle ingredient input and filtering
  const handleIngredientInputChange = (e) => {
    const value = e.target.value;
    setIngredientInput(value);

    if (value.length > 1) {
      const filtered = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(value.toLowerCase()) &&
        !userIngredients.some(userIng => userIng.toLowerCase() === ingredient.name.toLowerCase())
      );
      setFilteredIngredients(filtered.slice(0, 10));
      setShowIngredientSuggestions(true);
    } else {
      setShowIngredientSuggestions(false);
    }
  };

  // Add ingredient from suggestions
  const addIngredientFromSuggestion = (ingredientName) => {
    if (!userIngredients.some(ing => ing.toLowerCase() === ingredientName.toLowerCase())) {
      setUserIngredients([...userIngredients, ingredientName]);
    }
    setIngredientInput('');
    setShowIngredientSuggestions(false);
  };

  // Add custom ingredient
  const addCustomIngredient = () => {
    const trimmedInput = ingredientInput.trim();
    if (trimmedInput && !userIngredients.some(ing => ing.toLowerCase() === trimmedInput.toLowerCase())) {
      setUserIngredients([...userIngredients, trimmedInput]);
      setIngredientInput('');
      setShowIngredientSuggestions(false);
    }
  };

  // Remove ingredient
  const removeIngredient = (ingredientToRemove) => {
    setUserIngredients(userIngredients.filter(ing => ing !== ingredientToRemove));
  };

  // Generate recipe
  const generateRecipe = async () => {
    if (userIngredients.length < 2) {
      alert('Please add at least 2 ingredients to generate a recipe.');
      return;
    }

    try {
      setLoadingRecipe(true);
      setErrorRecipe(null);

      const response = await axios.post(`${BACKEND_URL}/api/generate-recipe`, {
        preferences: {
          userIngredients,
          mode: 'ingredients'
        }
      });

      setGeneratedRecipe(response.data);
      setLoadingRecipe(false);
    } catch (err) {
      console.error('Error generating recipe:', err);
      setErrorRecipe('Failed to generate recipe. Please try again.');
      setLoadingRecipe(false);
    }
  };

  // Create meal plan
  const createMealPlan = async () => {
    if (!newMealPlanName.trim()) {
      alert('Please enter a meal plan name.');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/meal-plans`, {
        name: newMealPlanName.trim()
      });

      setMealPlans([...mealPlans, response.data]);
      setNewMealPlanName('');
      alert('Meal plan created successfully!');
    } catch (err) {
      console.error('Error creating meal plan:', err);
      alert('Failed to create meal plan. Please try again.');
    }
  };

  // Add recipe to meal plan
  const addRecipeToMealPlan = async () => {
    if (!selectedMealPlan) {
      alert('Please select a meal plan.');
      return;
    }

    if (!generatedRecipe) {
      alert('Please generate a recipe first.');
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/meal-plans/${selectedMealPlan}/add-recipe`, {
        recipeDetails: generatedRecipe,
        mealType: selectedMealType
      });

      alert('Recipe added to meal plan successfully!');
      fetchMealPlans(); // Refresh meal plans
    } catch (err) {
      console.error('Error adding recipe to meal plan:', err);
      alert('Failed to add recipe to meal plan. Please try again.');
    }
  };

  // Delete meal plan
  const deleteMealPlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await axios.delete(`${BACKEND_URL}/api/meal-plans/${planId}`);
        setMealPlans(mealPlans.filter(plan => plan._id !== planId));
        alert('Meal plan deleted successfully!');
      } catch (err) {
        console.error('Error deleting meal plan:', err);
        alert('Failed to delete meal plan. Please try again.');
      }
    }
  };

  // Navigation functions
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Render different views based on currentView state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'chef-dashboard':
        return <ChefDashboard />;
      case 'home':
      default:
        return renderHomeView();
    }
  };

  // Home view (existing recipe generation and meal planning)
  const renderHomeView = () => (
    <>
      {/* Recipe Generation Section */}
      <section className="ingredient-input-section">
        <h2>🧑‍🍳 Smart Recipe Generator</h2>
        <p>Tell us what ingredients you have, and we'll create the perfect recipe for you!</p>

        <div className="ingredient-input-container">
          <div className="input-wrapper">
            <input
              type="text"
              value={ingredientInput}
              onChange={handleIngredientInputChange}
              placeholder="Type an ingredient (e.g., chicken, tomatoes, rice)..."
              className="ingredient-input"
            />
            <button onClick={addCustomIngredient} className="add-ingredient-btn">
              ➕ Add
            </button>
          </div>

          {showIngredientSuggestions && filteredIngredients.length > 0 && (
            <div className="ingredient-suggestions">
              {filteredIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => addIngredientFromSuggestion(ingredient.name)}
                >
                  {ingredient.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {userIngredients.length > 0 && (
          <div className="selected-ingredients">
            <h3>🥘 Your Ingredients ({userIngredients.length}):</h3>
            <div className="ingredient-tags">
              {userIngredients.map((ingredient, index) => (
                <span key={index} className="ingredient-tag">
                  {ingredient}
                  <button
                    onClick={() => removeIngredient(ingredient)}
                    className="remove-ingredient-btn"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="generate-section">
          <button
            onClick={generateRecipe}
            disabled={loadingRecipe || userIngredients.length < 2}
            className="generate-recipe-btn"
          >
            {loadingRecipe ? '🔄 Generating...' : '✨ Generate Recipe'}
          </button>
          
          {userIngredients.length < 2 && (
            <p className="ingredient-hint">💡 Add at least 2 ingredients to generate a recipe</p>
          )}
        </div>

        {errorRecipe && (
          <div className="error-message">
            ❌ {errorRecipe}
          </div>
        )}

        {generatedRecipe && (
          <div className="generated-recipe-card">
            <h3>🍽️ {generatedRecipe.title}</h3>
            <p className="recipe-description">{generatedRecipe.description}</p>
            
            <div className="recipe-info">
              <div className="recipe-meta">
                <span>⏱️ {generatedRecipe.cookingTime}</span>
                <span>👥 {generatedRecipe.servings} servings</span>
                <span>📊 {generatedRecipe.difficulty}</span>
                <span>🕐 Prep: {generatedRecipe.prepTime}</span>
              </div>
              
              {generatedRecipe.ingredientMatch && (
                <div className="ingredient-match-info">
                  <h4>📊 Ingredient Match: {generatedRecipe.ingredientMatch.matchScore}%</h4>
                  <p>✅ Using {generatedRecipe.ingredientMatch.matchedCount} of your {generatedRecipe.ingredientMatch.totalRequired} ingredients</p>
                  
                  {generatedRecipe.ingredientMatch.missingIngredients.length > 0 && (
                    <div className="missing-ingredients">
                      <p><strong>🛒 You might need:</strong></p>
                      <div className="missing-ingredient-tags">
                        {generatedRecipe.ingredientMatch.missingIngredients.map((ingredient, index) => (
                          <span key={index} className="missing-ingredient-tag">
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="recipe-components">
              <h4>🥘 Recipe Components:</h4>
              <div className="components-grid">
                <div className="component-item">
                  <strong>🥩 Protein:</strong> {generatedRecipe.components.protein}
                </div>
                <div className="component-item">
                  <strong>🥬 Vegetable:</strong> {generatedRecipe.components.vegetable}
                </div>
                <div className="component-item">
                  <strong>🍚 Carb:</strong> {generatedRecipe.components.carb}
                </div>
                <div className="component-item">
                  <strong>🥄 Sauce:</strong> {generatedRecipe.components.sauce}
                </div>
              </div>
            </div>

            <div className="recipe-instructions">
              <h4>📋 Instructions:</h4>
              <ol className="instructions-list">
                {generatedRecipe.instructions.map((instruction, index) => (
                  <li key={index} className="instruction-step">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>

            {isAuthenticated && (
              <div className="add-to-meal-plan">
                <h4>📅 Add to Meal Plan:</h4>
                <div className="meal-plan-controls">
                  <select
                    value={selectedMealPlan}
                    onChange={(e) => setSelectedMealPlan(e.target.value)}
                    className="meal-plan-select"
                  >
                    <option value="">Select a meal plan</option>
                    {mealPlans.map(plan => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name}
                      </option>
                    ))}
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
                    onClick={addRecipeToMealPlan}
                    className="add-to-plan-btn"
                    disabled={!selectedMealPlan}
                  >
                    ➕ Add to Selected Meal Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Meal Planning Section */}
      <section className="meal-planning-section">
        {isAuthenticated ? (
          <>
            <h2>📅 My Meal Plans</h2>
            <p>Plan your weekly meals and stay organized with your favorite recipes!</p>

            <div className="create-meal-plan">
              <h3>➕ Create New Meal Plan</h3>
              <div className="create-meal-plan-form">
                <input
                  type="text"
                  value={newMealPlanName}
                  onChange={(e) => setNewMealPlanName(e.target.value)}
                  placeholder="Enter meal plan name (e.g., 'This Week's Meals')"
                  className="meal-plan-name-input"
                />
                <button onClick={createMealPlan} className="create-plan-btn">
                  🎯 Create Meal Plan
                </button>
              </div>
            </div>

            {loadingMealPlans ? (
              <div className="loading">Loading your meal plans...</div>
            ) : errorMealPlans ? (
              <div className="error-message">❌ {errorMealPlans}</div>
            ) : (
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
            )}
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
    </>
  );

  return (
    <div className="App">
      {/* Enhanced Header with Navigation */}
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🍽️ DishCraft</h1>
            <p>Your AI-Powered Kitchen Assistant</p>
          </div>
          
          {/* Navigation */}
          <nav className="main-navigation">
            <button 
              onClick={() => handleViewChange('home')}
              className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
            >
              🏠 Home
            </button>
            
            {user && user.role === 'chef' && (
              <button 
                onClick={() => handleViewChange('chef-dashboard')}
                className={`nav-btn ${currentView === 'chef-dashboard' ? 'active' : ''}`}
              >
                👨‍🍳 Chef Dashboard
              </button>
            )}
          </nav>

          {/* User Menu */}
          <div className="user-menu">
            {isAuthenticated ? (
              <>
                <span className="welcome-text">
                  Welcome, {user.name}! 
                  {user.role === 'chef' && ' 👨‍🍳'}
                </span>
                <button onClick={logout} className="logout-btn">
                  🚪 Logout
                </button>
              </>
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

      {/* Main Content */}
      <main className="main-content">
        {renderCurrentView()}
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
