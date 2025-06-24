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
        
        const ingredientsData = response.data?.data;
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
    const input = e.target.value;
    setIngredientInput(input);
    
    if (input.length > 0) {
      if (Array.isArray(ingredients)) {
        const filtered = ingredients.filter(ing => 
          ing.name && ing.name.toLowerCase().includes(input.toLowerCase())
        );
        setFilteredIngredients(filtered);
        setShowIngredientSuggestions(true);
      } else {
        console.warn('Ingredients is not an array when filtering:', ingredients);
        setFilteredIngredients([]);
        setShowIngredientSuggestions(false);
      }
    } else {
      setFilteredIngredients([]);
      setShowIngredientSuggestions(false);
    }
  }, [ingredients]);

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

  const removeIngredient = useCallback((ingredientName) => {
    setUserIngredients(prev => prev.filter(ing => ing !== ingredientName));
  }, []);

  const generateRecipe = useCallback(async () => {
    setLoadingRecipe(true);
    setErrorRecipe(null);
    
    try {
      const backendUrl = getBackendUrl();
      console.log('Generating recipe with ingredients:', userIngredients);
      
      const response = await axios.post(`${backendUrl}/api/generate-recipe`, {
        ingredients: userIngredients,
      });
      
      setGeneratedRecipe(response.data.data);
      console.log('Recipe generated successfully:', response.data.data.name);
    } catch (error) {
      console.error('Error generating recipe:', error);
      setErrorRecipe('Failed to generate recipe. Please try again.');
    } finally {
      setLoadingRecipe(false);
    }
  }, [userIngredients]);

  useEffect(() => {
    const fetchMealPlans = async () => {
      if (isAuthenticated && user) {
        setLoadingMealPlans(true);
        try {
          const backendUrl = getBackendUrl();
          const config = {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('dishcraft_token')}`,
            },
          };
          const response = await axios.get(`${backendUrl}/api/meal-plans`, config);
          setMealPlans(response.data.data || []);
        } catch (error) {
          console.error('Error fetching meal plans:', error);
          setErrorMealPlans('Failed to load meal plans.');
          setMealPlans([]);
        } finally {
          setLoadingMealPlans(false);
        }
      }
    };
    fetchMealPlans();
  }, [isAuthenticated, user]);

  const addMealPlan = useCallback(async () => {
    if (!newMealPlanName.trim()) return;
    
    try {
      const backendUrl = getBackendUrl();
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('dishcraft_token')}`,
        },
      };
      const response = await axios.post(`${backendUrl}/api/meal-plans`, { name: newMealPlanName }, config);
      setMealPlans(prev => [...prev, response.data.data]);
      setNewMealPlanName('');
    } catch (error) {
      console.error('Error adding meal plan:', error);
    }
  }, [newMealPlanName]);

  if (authLoading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>Loading DishCraft...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1>DishCraft</h1>
          </div>
          <div className="user-menu">
            {isAuthenticated ? (
              <>
                <p className="welcome-text">Welcome, {user?.name} ({user?.role})!</p>
                <button onClick={logout} className="logout-btn">Logout</button>
              </>
            ) : (
              <button onClick={() => setShowAuthForms(true)} className="login-btn">Login / Sign Up</button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {showAuthForms && !isAuthenticated ? (
          <AuthForms onClose={() => setShowAuthForms(false)} />
        ) : (
          <>
            <section className="ingredient-input-section">
              <h2>Generate Your Next Meal</h2>
              
              <div className="connection-status">
                <p>Backend: {getBackendUrl()}</p>
                {errorIngredients && (
                  <p className="error-message">⚠️ {errorIngredients}</p>
                )}
                {loadingIngredients && (
                  <p className="loading">Loading ingredients...</p>
                )}
              </div>

              <div className="ingredient-input-container">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter ingredients you have..."
                    value={ingredientInput}
                    onChange={handleIngredientInputChange}
                    onFocus={() => setShowIngredientSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowIngredientSuggestions(false), 100)}
                    className="ingredient-input"
                  />
                  <button onClick={() => addIngredient(ingredientInput)} className="add-ingredient-btn">Add Ingredient</button>
                </div>
                {showIngredientSuggestions && filteredIngredients.length > 0 && (
                  <ul className="ingredient-suggestions">
                    {filteredIngredients.map(ing => (
                      <li key={ing._id} onMouseDown={() => addIngredient(ing.name)} className="suggestion-item">
                        {ing.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="selected-ingredients">
                <h3>Selected Ingredients:</h3>
                <div className="ingredient-tags">
                  {userIngredients.map(ing => (
                    <span key={ing} className="ingredient-tag">
                      {ing}
                      <button onClick={() => removeIngredient(ing)} className="remove-ingredient-btn">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="generate-section">
                <button 
                  onClick={generateRecipe} 
                  disabled={loadingRecipe || userIngredients.length === 0}
                  className="generate-recipe-btn"
                >
                  {loadingRecipe ? 'Generating...' : 'Generate Recipe'}
                </button>
              </div>

              {errorRecipe && <p className="error-message">{errorRecipe}</p>}

              {generatedRecipe && (
                <div className="generated-recipe-card">
                  <h3>{generatedRecipe.name}</h3>
                  <p className="recipe-description">{generatedRecipe.description}</p>
                  <div className="recipe-info">
                    <div className="recipe-meta">
                      <span>Cooking Time: {generatedRecipe.cookingTime}</span>
                      <span>Difficulty: {generatedRecipe.difficulty}</span>
                    </div>
                    {generatedRecipe.missingIngredients && generatedRecipe.missingIngredients.length > 0 && (
                      <div className="ingredient-match-info">
                        <h4>Missing Ingredients:</h4>
                        <div className="missing-ingredient-tags">
                          {generatedRecipe.missingIngredients.map((ing, index) => (
                            <span key={index} className="missing-ingredient-tag">{ing}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="recipe-components">
                    <h4>Ingredients:</h4>
                    <div className="components-grid">
                      {generatedRecipe.ingredients.map((ing, index) => (
                        <div key={index} className="component-item"><strong>{ing.quantity} {ing.unit}</strong> {ing.item}</div>
                      ))}
                    </div>
                  </div>
                  <div className="recipe-instructions">
                    <h4>Instructions:</h4>
                    <ol className="instructions-list">
                      {generatedRecipe.instructions.map((step, index) => (
                        <li key={index} className="instruction-step">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </section>

            <section className="meal-planning-section">
              <h2>Your Meal Plans</h2>
              <div className="create-meal-plan">
                <h3>Create New Meal Plan</h3>
                <div className="create-meal-plan-form">
                  <input
                    type="text"
                    placeholder="New Meal Plan Name"
                    value={newMealPlanName}
                    onChange={(e) => setNewMealPlanName(e.target.value)}
                    className="meal-plan-name-input"
                  />
                  <button onClick={addMealPlan} className="create-plan-btn">Add Meal Plan</button>
                </div>
              </div>
              {loadingMealPlans && <p className="loading">Loading meal plans...</p>}
              {errorMealPlans && <p className="error-message">{errorMealPlans}</p>}
              <div className="meal-plans-grid">
                {mealPlans.length === 0 && !loadingMealPlans && <p className="empty-plan">No meal plans yet. Add one!</p>}
                {mealPlans.map(plan => (
                  <div key={plan._id} className="meal-plan-card">
                    <div className="meal-plan-header">
                      <h3>{plan.name}</h3>
                      <button className="delete-plan-btn">Delete</button>
                    </div>
                    <div className="meal-plan-content">
                      <ul className="meals-list">
                        {plan.meals && plan.meals.length > 0 ? (
                          plan.meals.map((meal, mealIndex) => (
                            <li key={mealIndex} className="meal-item">
                              <div className="meal-info">
                                <span className="meal-title">{meal.recipeName}</span>
                                <span className="meal-meta">{meal.mealType} - {new Date(meal.date).toLocaleDateString()}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="empty-plan">No meals added yet.</li>
                        )}
                      </ul>
                    </div>
                    <div className="meal-plan-stats">
                      <span className="meal-count">{plan.meals ? plan.meals.length : 0} meals</span>
                    </div>
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
