import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import logo from '../assets/logo.png';

const HomePage = () => {
  const { user, isAuthenticated, logout, token } = useAuth();
  const { showSuccess, showError, showWarning } = useAlert();
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

  // Removed recipe options - now using ingredient-based matching

  const getBackendUrl = useCallback(() => {
    return process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
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

  // Removed recipe option change handler - no longer needed

  const generateRecipe = useCallback(async () => {
    if (userIngredients.length === 0) {
      showError('Please add at least one ingredient');
      return;
    }
    try {
      setLoadingRecipe(true);
      setErrorRecipe(null);

      // Fetch all public chef recipes from the backend
      const response = await axios.get(`${getBackendUrl()}/api/recipes?isPublic=true&limit=1000`);
      const allChefRecipes = response.data && Array.isArray(response.data.data) ? response.data.data : [];

      // Debug: Log the API response
      console.log('Debug: API Response:', response.data);
      console.log('Debug: Total recipes fetched:', allChefRecipes.length);

      // Debug: Log all recipe names and their ingredients
      allChefRecipes.forEach((recipe, index) => {
        console.log(`Debug: Recipe ${index + 1}:`, recipe.name);
        console.log(`Debug: Recipe ${index + 1} ingredients:`, recipe.ingredients.map(ing => ing.name));
        console.log(`Debug: Recipe ${index + 1} isPublic:`, recipe.isPublic);
      });

      // Score recipes based on ingredient matching with improved logic
      const scoredRecipes = allChefRecipes.map(recipe => {
        const recipeIngredientNames = recipe.ingredients.map(ing => ing.name.toLowerCase());
        const userIngredientNames = userIngredients.map(ing => ing.toLowerCase());

        // Calculate match score with improved matching
        let matchCount = 0;
        let totalIngredients = recipeIngredientNames.length;

        // Debug: Log the matching process for this recipe
        console.log(`Debug: Matching for recipe "${recipe.name}":`);
        console.log(`Debug: User ingredients:`, userIngredientNames);
        console.log(`Debug: Recipe ingredients:`, recipeIngredientNames);

        userIngredientNames.forEach(userIng => {
          const userIngLower = userIng.toLowerCase();
          // Check for exact match first (case-insensitive)
          if (recipeIngredientNames.some(recipeIng => recipeIng.toLowerCase() === userIngLower)) {
            console.log(`Debug: Exact match found for "${userIng}"`);
            matchCount++;
          } else {
            // Check for partial matches (user ingredient is part of recipe ingredient, case-insensitive)
            const hasPartialMatch = recipeIngredientNames.some(recipeIng =>
              recipeIng.toLowerCase().includes(userIngLower) || userIngLower.includes(recipeIng.toLowerCase())
            );
            if (hasPartialMatch) {
              console.log(`Debug: Partial match found for "${userIng}"`);
              matchCount++;
            } else {
              console.log(`Debug: No match found for "${userIng}"`);
            }
          }
        });

        console.log(`Debug: Final match count for "${recipe.name}": ${matchCount}/${userIngredientNames.length}`);

        // Calculate percentage match based on user's input ingredients
        const matchPercentage = userIngredientNames.length > 0 ? (matchCount / userIngredientNames.length) * 100 : 0;

        return {
          ...recipe,
          matchScore: matchCount,
          matchPercentage,
          matchedIngredients: matchCount,
          totalUserIngredients: userIngredientNames.length
        };
      });

      // Filter recipes with at least 50% ingredient match and sort by match score
      const filtered = scoredRecipes
        .filter(recipe => recipe.matchPercentage >= 50)
        .sort((a, b) => {
          if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
          if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
          return a.name.localeCompare(b.name);
        });

      if (filtered.length > 0) {
        // Remove duplicates based on recipe name and ingredients to handle true duplicates
        const uniqueRecipes = filtered.filter((recipe, index, self) => {
          const recipeKey = `${recipe.name.toLowerCase()}-${recipe.ingredients.map(ing => ing.name.toLowerCase()).sort().join(',')}`;
          return index === self.findIndex(r => {
            const rKey = `${r.name.toLowerCase()}-${r.ingredients.map(ing => ing.name.toLowerCase()).sort().join(',')}`;
            return rKey === recipeKey;
          });
        });
        setGeneratedRecipes(uniqueRecipes.slice(0, 5)); // Show up to 5 best matches
        showSuccess(`Found ${uniqueRecipes.length} unique recipes matching your ingredients!`);
      } else {
        // Debug: Log what ingredients are available in recipes
        console.log('Debug: User ingredients:', userIngredients);
        console.log('Debug: Available recipes:', allChefRecipes.length);
        if (allChefRecipes.length > 0) {
          console.log('Debug: Sample recipe ingredients:', allChefRecipes[0].ingredients.map(ing => ing.name));
        }
        setGeneratedRecipes([]);
        showWarning('No chef recipes found with your ingredients. Try adding more ingredients or different ones.');
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      showError('Failed to find chef recipes. Please try again.');
    } finally {
      setLoadingRecipe(false);
    }
  }, [userIngredients, getBackendUrl, showSuccess, showWarning, showError]);

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
      showError('Failed to like recipe.');
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

      showSuccess(`Recipe rated ${rating} stars!`);
      return response.data;
    } catch (err) {
      console.error('Error rating recipe:', err);
      showError('Failed to rate recipe.');
    }
  };

  // Handle add feedback
  const handleAddFeedback = async (recipeId, feedbackText) => {
    if (!user) {
      showWarning('Please log in to add feedback.');
      navigate('/auth');
      return;
    }

    if (!feedbackText || feedbackText.trim() === '') {
      showError('Please enter a feedback comment.');
      return;
    }

    try {
      const response = await axios.post(`${getBackendUrl()}/api/chef-recipes/${recipeId}/feedback`, {
        text: feedbackText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the recipe in the generatedRecipes array
      setGeneratedRecipes(prev => prev.map(recipe => {
        if (recipe._id === recipeId) {
          return {
            ...recipe,
            feedbacks: response.data.feedbacks
          };
        }
        return recipe;
      }));

      showSuccess('Feedback added successfully!');
      return response.data;
    } catch (err) {
      console.error('Error adding feedback:', err);
      showError('Failed to add feedback.');
    }
  };

  // Save recipe to user profile
  const saveRecipe = async (recipe) => {
    if (!user) {
      showWarning('Please log in to save recipes.');
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
          showSuccess('Recipe saved! You can view it in your profile.');
        } else {
          showError('Failed to save recipe.');
        }
      } else {
        await axios.post(`${backend}/api/chef-recipes/${recipe._id}/save`, {}, {
          headers: { Authorization: `Bearer ${user.token || sessionStorage.getItem('dishcraft_token')}` }
        });
        showSuccess('Recipe saved! You can view it in your profile.');
      }
    } catch (err) {
      showError('Failed to save recipe.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={logo}
              alt="DishCraft Logo"
              style={{ maxHeight: '70px', width: 'auto', marginBottom: '8px' }}
            />
            <p style={{ margin: 0, textAlign: 'center', marginLeft: '-4px' }}>Craft Your Own Dish</p>
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
          <h2>Turn Ingredients into Inspiration</h2>

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

          {/* Recipe options removed - now using ingredient-based matching */}

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
                  {/* Recipe Image */}
                  {generatedRecipe.image && (
                    <div className="recipe-image-container" style={{ textAlign: 'center', marginBottom: 16 }}>
                      <img
                        src={generatedRecipe.image}
                        alt={generatedRecipe.name}
                        style={{
                          width: '100%',
                          maxWidth: 400,
                          maxHeight: 220,
                          objectFit: 'cover',
                          borderRadius: 10,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                        }}
                        onError={e => { e.target.onerror = null; e.target.src = '/logo192.png'; }}
                      />
                    </div>
                  )}
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
                      <strong>Match Score:</strong> {generatedRecipe.matchedIngredients}/{generatedRecipe.totalIngredients} ingredients ({Math.round(generatedRecipe.matchPercentage)}% match)
                    </div>
                    <div className="detail-item">
                      <strong>Cooking Time:</strong> {generatedRecipe.prepTime + generatedRecipe.cookTime} minutes
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

                  {(generatedRecipe.chefNotes || (generatedRecipe.tips && generatedRecipe.tips.length > 0) || (generatedRecipe.equipment && generatedRecipe.equipment.length > 0)) && (
                    <div className="extra-recipe-info" style={{ marginTop: 18 }}>
                      {generatedRecipe.chefNotes && (
                        <div className="chef-notes" style={{ marginBottom: 10 }}>
                          <h4>💭 Chef Notes</h4>
                          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 10, fontStyle: 'italic', color: '#444' }}>{generatedRecipe.chefNotes}</div>
                        </div>
                      )}
                      {generatedRecipe.tips && generatedRecipe.tips.length > 0 && generatedRecipe.tips.some(tip => tip && tip.trim()) && (
                        <div className="recipe-tips" style={{ marginBottom: 10 }}>
                          <h4>Tips</h4>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {generatedRecipe.tips.filter(tip => tip && tip.trim()).map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {generatedRecipe.equipment && generatedRecipe.equipment.length > 0 && generatedRecipe.equipment.some(eq => eq && eq.trim()) && (
                        <div className="recipe-equipment">
                          <h4>Equipment Needed</h4>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {generatedRecipe.equipment.filter(eq => eq && eq.trim()).map((eq, idx) => (
                              <li key={idx}>{eq}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Section */}
                  <div className="recipe-feedback">
                    <h4>💬 Feedback ({generatedRecipe.feedbacks?.length || 0})</h4>

                    {/* Display existing feedbacks */}
                    {generatedRecipe.feedbacks && generatedRecipe.feedbacks.length > 0 ? (
                      <div className="feedbacks-list">
                        {generatedRecipe.feedbacks.map((feedback, index) => (
                          <div key={index} className="feedback-item">
                            <div className="feedback-content">
                              <p>"{feedback.text}"</p>
                              <small className="feedback-user">
                                — {feedback.userName || 'Anonymous User'}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-feedback">No feedback yet. Be the first to share your thoughts!</p>
                    )}

                    {/* Add feedback form - only for logged-in users */}
                    {user ? (
                      <div className="add-feedback">
                        <textarea
                          placeholder="Share your thoughts about this recipe..."
                          className="feedback-input"
                          rows="3"
                          maxLength="500"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const feedbackInput = e.target.parentNode.querySelector('.feedback-input');
                            const feedbackText = feedbackInput.value;
                            if (feedbackText.trim()) {
                              handleAddFeedback(generatedRecipe._id, feedbackText);
                              feedbackInput.value = '';
                            }
                          }}
                        >
                          💬 Add Feedback
                        </button>
                      </div>
                    ) : (
                      <div className="login-prompt" style={{
                        textAlign: 'center',
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        marginTop: '15px'
                      }}>
                        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                          💬 <strong>Want to share your thoughts?</strong><br />
                          Please <button
                            onClick={() => navigate('/auth')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#667eea',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            log in
                          </button> to add feedback.
                        </p>
                      </div>
                    )}
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
