import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const HomePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [errorIngredients, setErrorIngredients] = useState(null);
  
  const [ingredientInput, setIngredientInput] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [showIngredientSuggestions, setShowIngredientSuggestions] = useState(false);
  const [userIngredients, setUserIngredients] = useState([]);

  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [errorRecipe, setErrorRecipe] = useState(null);

  const [recipeOptions, setRecipeOptions] = useState({
    cookingMethod: 'Stir-frying',
    cuisine: 'Italian',
    difficulty: 'Medium',
    prepTime: '20-30 minutes'
  });

  const getBackendUrl = useCallback(() => {
    return process.env.REACT_APP_BACKEND_URL || 'https://dishcraft-backend-3tk2.onrender.com';
  }, []);

  const fetchIngredients = useCallback(async () => {
    try {
      setLoadingIngredients(true);
      setErrorIngredients(null);
      const response = await axios.get(`${getBackendUrl()}/api/ingredients`);
      const data = response.data.data || response.data;
      if (Array.isArray(data)) {
        setIngredients(data);
      } else {
        setErrorIngredients('Invalid ingredients data format');
      }
    } catch (err) {
      console.error('Failed to fetch ingredients:', err);
      setErrorIngredients('Failed to load ingredients. Please check your connection.');
    } finally {
      setLoadingIngredients(false);
    }
  }, [getBackendUrl]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

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

  const handleRecipeOptionChange = useCallback((option, value) => {
    setRecipeOptions(prev => ({
      ...prev,
      [option]: value
    }));
  }, []);

  const generateRecipe = useCallback(async () => {
    if (userIngredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    try {
      setLoadingRecipe(true);
      setErrorRecipe(null);
      const response = await axios.post(`${getBackendUrl()}/api/generate-recipe`, {
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
  }, [userIngredients, recipeOptions, getBackendUrl]);

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
                {user?.role === 'chef' && (
                  <button 
                    onClick={() => navigate('/dashboard')} 
                    className="nav-btn"
                  >
                    Chef Dashboard
                  </button>
                )}
                <button onClick={logout} className="logout-btn">Logout</button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/auth')} 
                className="nav-btn"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="recipe-generator">
          <h2>Generate Your Next Meal</h2>
          
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
                disabled={loadingIngredients}
              />
              <button 
                onClick={() => addIngredient(ingredientInput)}
                className="nav-btn"
                style={{ marginLeft: '10px' }}
                disabled={loadingIngredients}
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

          <div className="recipe-options">
            <h3>Recipe Options:</h3>
            <div className="options-grid">
              <div className="option-item">
                <label>Cooking Method:</label>
                <select
                  value={recipeOptions.cookingMethod}
                  onChange={(e) => handleRecipeOptionChange('cookingMethod', e.target.value)}
                >
                  <option value="Stir-frying">Stir-frying</option>
                  <option value="Baking">Baking</option>
                  <option value="Grilling">Grilling</option>
                  <option value="Boiling">Boiling</option>
                  <option value="Steaming">Steaming</option>
                </select>
              </div>
              <div className="option-item">
                <label>Cuisine:</label>
                <select
                  value={recipeOptions.cuisine}
                  onChange={(e) => handleRecipeOptionChange('cuisine', e.target.value)}
                >
                  <option value="Italian">Italian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Indian">Indian</option>
                  <option value="American">American</option>
                </select>
              </div>
              <div className="option-item">
                <label>Difficulty:</label>
                <select
                  value={recipeOptions.difficulty}
                  onChange={(e) => handleRecipeOptionChange('difficulty', e.target.value)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="option-item">
                <label>Prep Time:</label>
                <select
                  value={recipeOptions.prepTime}
                  onChange={(e) => handleRecipeOptionChange('prepTime', e.target.value)}
                >
                  <option value="10-20 minutes">10-20 minutes</option>
                  <option value="20-30 minutes">20-30 minutes</option>
                  <option value="30-45 minutes">30-45 minutes</option>
                  <option value="45+ minutes">45+ minutes</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={generateRecipe}
            disabled={loadingRecipe || userIngredients.length === 0 || loadingIngredients}
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
      </main>
    </div>
  );
};

export default HomePage;
