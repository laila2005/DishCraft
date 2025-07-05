import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const HomePage = () => {
  const { user, isAuthenticated, logout, token } = useAuth();
  // Debug: Log user state to help diagnose why name is not shown
  useEffect(() => {
    // eslint-disable-next-line
    console.log('DEBUG Auth user:', user);
  }, [user]);
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [errorIngredients, setErrorIngredients] = useState(null);

  const [ingredientInput, setIngredientInput] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [showIngredientSuggestions, setShowIngredientSuggestions] = useState(false);
  const [userIngredients, setUserIngredients] = useState([]);

  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [errorRecipe, setErrorRecipe] = useState(null);

  const [recipeOptions, setRecipeOptions] = useState({
    cookingMethod: 'Stir-frying',
    cuisine: 'Italian',
    difficulty: 'Medium',
    prepTime: '20-30 minutes'
  });

  const getBackendUrl = useCallback(() => {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
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
      // Fetch all public chef recipes from the backend
      const response = await axios.get(`${getBackendUrl()}/api/recipes?isPublic=true&limit=1000`);
      const allChefRecipes = response.data && Array.isArray(response.data.data) ? response.data.data : [];
      // Filter recipes that match ALL selected ingredients
      const filtered = allChefRecipes.filter(recipe => {
        const recipeIngredientNames = recipe.ingredients.map(ing => ing.name.toLowerCase());
        // Check if every user ingredient is in the recipe's ingredients
        return userIngredients.every(ing => recipeIngredientNames.includes(ing.toLowerCase()));
      });
      if (filtered.length > 0) {
        setGeneratedRecipes(filtered.slice(0, 5)); // Show up to 5 matches
      } else {
        setGeneratedRecipes([]);
        setErrorRecipe('No chef recipes found with all selected ingredients.');
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      setErrorRecipe('Failed to find chef recipes. Please try again.');
    } finally {
      setLoadingRecipe(false);
    }
  }, [userIngredients, getBackendUrl]);

  // Handle like/unlike recipe
  const handleLikeRecipe = async (recipeId, currentLikes = [], currentLiked = false) => {
    if (!user) {
      alert('Please log in to like recipes.');
      navigate('/auth');
      return;
    }

    try {
      const response = await axios.post(`${getBackendUrl()}/api/chef-recipes/${recipeId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the recipe in the generatedRecipes array
      setGeneratedRecipes(prev => prev.map(recipe => {
        if (recipe._id === recipeId) {
          return {
            ...recipe,
            likes: response.data.liked ? [...(recipe.likes || []), user._id] : (recipe.likes || []).filter(id => id !== user._id),
            likesCount: response.data.likesCount
          };
        }
        return recipe;
      }));

      return response.data;
    } catch (err) {
      console.error('Error liking recipe:', err);
      alert('Failed to like recipe.');
    }
  };

  // Handle rate recipe
  const handleRateRecipe = async (recipeId, rating) => {
    if (!user) {
      alert('Please log in to rate recipes.');
      navigate('/auth');
      return;
    }

    try {
      const response = await axios.post(`${getBackendUrl()}/api/chef-recipes/${recipeId}/rate`, { value: rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the recipe in the generatedRecipes array
      setGeneratedRecipes(prev => prev.map(recipe => {
        if (recipe._id === recipeId) {
          return {
            ...recipe,
            ratings: response.data.ratings
          };
        }
        return recipe;
      }));

      alert(`Recipe rated ${rating} stars!`);
      return response.data;
    } catch (err) {
      console.error('Error rating recipe:', err);
      alert('Failed to rate recipe.');
    }
  };

  // Save recipe to user profile
  const saveRecipe = async (recipe) => {
    if (!user) {
      alert('Please log in to save recipes.');
      navigate('/auth');
      return;
    }
    try {
      const backend = getBackendUrl();
      // If recipe has no _id, persist it first
      if (!recipe._id) {
        // Transform instructions to array of objects
        let instructions = recipe.instructions || [];
        if (instructions.length > 0 && typeof instructions[0] === 'string') {
          instructions = instructions.map((inst, idx) => ({ stepNumber: idx + 1, instruction: inst }));
        } else if (instructions.length > 0 && typeof instructions[0] === 'object' && instructions[0].instruction) {
          instructions = instructions.map((inst, idx) => ({ ...inst, stepNumber: inst.stepNumber || idx + 1 }));
        }
        // Lowercase cuisine and difficulty
        const cuisine = (recipe.cuisine || '').toLowerCase();
        const difficulty = (recipe.difficulty || '').toLowerCase();
        // Lowercase category if present
        const category = recipe.category ? recipe.category.toLowerCase() : 'main-course';
        // Numeric prepTime/cookTime/servings
        const prepTime = parseInt(recipe.prepTime) || 10;
        const cookTime = parseInt(recipe.cookTime) || 10;
        const servings = parseInt(recipe.servings) || 4;
        const payload = {
          ...recipe,
          instructions,
          cuisine,
          difficulty,
          category,
          prepTime,
          cookTime,
          servings
        };
        const response = await axios.post(`${backend}/api/chef-recipes/save-generated`, payload, {
          headers: { Authorization: `Bearer ${user.token || sessionStorage.getItem('dishcraft_token')}` }
        });
        if (response.data && response.data.recipe && response.data.recipe._id) {
          alert('Recipe saved! You can view it in your profile.');
        } else {
          alert('Failed to save recipe.');
        }
      } else {
        await axios.post(`${backend}/api/chef-recipes/${recipe._id}/save`, {}, {
          headers: { Authorization: `Bearer ${user.token || sessionStorage.getItem('dishcraft_token')}` }
        });
        alert('Recipe saved! You can view it in your profile.');
      }
    } catch (err) {
      alert('Failed to save recipe.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1>DishCraft</h1>
            <p>Generate Your Next Meal</p>
          </div>
          <div className="main-navigation">
            {user && user.name ? (
              <div className="user-info">
                <span className="user-name">Welcome, {user.name}!</span>
                {/* Profile Avatar Button */}
                <img
                  src={user.profilePhoto || '/logo192.png'}
                  alt="Profile"
                  className="profile-avatar"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginLeft: 16,
                    cursor: 'pointer',
                    border: '2px solid #764ba2',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  onClick={() => navigate('/profile')}
                  title="View Profile"
                />
                {user.role === 'chef' && (
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
              <div className="user-info">
                <span className="user-name guest">Welcome, Guest!</span>
                <button onClick={() => navigate('/auth')} className="nav-btn">Login / Register</button>
              </div>
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

          {generatedRecipes.length > 0 && (
            <div className="recipes-list">
              {generatedRecipes.map((generatedRecipe, recipeIdx) => (
                <div className="generated-recipe" key={recipeIdx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3>{generatedRecipe.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="like-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeRecipe(
                            generatedRecipe._id, 
                            generatedRecipe.likes || [], 
                            generatedRecipe.likes?.some(id => id === user?._id) || false
                          );
                        }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          fontSize: '24px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        title={generatedRecipe.likes?.some(id => id === user?._id) ? 'Unlike' : 'Like this recipe'}
                      >
                        {generatedRecipe.likes?.some(id => id === user?._id) ? '💖' : '🤍'} <span style={{ color: '#333', fontWeight: '500' }}>{generatedRecipe.likes?.length || 0}</span>
                      </button>
                      
                      {/* Rating Stars */}
                      <div className="rating-stars" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const userRating = generatedRecipe.ratings?.find(r => r.user === user?._id)?.value || 0;
                          const isRated = userRating >= star;
                          return (
                            <button
                              key={star}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRateRecipe(generatedRecipe._id, star);
                              }}
                                                             style={{
                                 background: 'none',
                                 border: 'none',
                                 cursor: 'pointer',
                                 fontSize: '24px',
                                 color: isRated ? '#FFD700' : '#ccc',
                                 transition: 'color 0.2s'
                               }}
                              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            >
                              {isRated ? '★' : '☆'}
                            </button>
                          );
                        })}
                        <span style={{ marginLeft: '4px', fontSize: '14px', color: '#666' }}>
                          ({generatedRecipe.ratings?.length || 0} ratings)
                        </span>
                      </div>
                    </div>
                  </div>
                  {generatedRecipe.missingIngredients && Array.isArray(generatedRecipe.missingIngredients) && generatedRecipe.missingIngredients.length > 0 && (
                    <div className="missing-ingredients">
                      <h4>Missing Ingredients:</h4>
                      <div className="missing-ingredient-tags">
                        {(generatedRecipe.missingIngredients || []).map((ingredient, index) => (
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
                      {(generatedRecipe.ingredients || []).map((ingredient, index) => (
                        <div key={index} className="ingredient-item">
                          <span className="ingredient-name">{ingredient.name}</span>
                          <span className="ingredient-quantity">{ingredient.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="recipe-instructions">
                    <h4>Instructions:</h4>
                    <ul className="instructions-list">
                      {(generatedRecipe.instructions || [])
                        .map((instruction, index) => ({ instruction, index }))
                        .sort((a, b) => {
                          // If instruction is an object with stepNumber, sort by it
                          if (a.instruction && typeof a.instruction === 'object' && a.instruction.stepNumber !== undefined && b.instruction && typeof b.instruction === 'object' && b.instruction.stepNumber !== undefined) {
                            return a.instruction.stepNumber - b.instruction.stepNumber;
                          }
                          // Otherwise, keep original order
                          return a.index - b.index;
                        })
                        .map(({ instruction }, index) => (
                          <li key={index} className="instruction-step">
                            {/* Fix: Render string if primitive, else render .instruction or .text */}
                            {typeof instruction === 'string' ? instruction : (instruction.instruction || instruction.text || JSON.stringify(instruction))}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <button
                    className="save-btn"
                    style={{ marginTop: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}
                    onClick={() => saveRecipe(generatedRecipe)}
                  >
                    💾 Save to My Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
