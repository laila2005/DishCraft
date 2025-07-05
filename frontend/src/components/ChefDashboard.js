import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ChefDashboard.css';

const ChefDashboard = () => {
  const { user, token } = useAuth();
  const { showSuccess, showError, showWarning } = useAlert();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalViews: 0,
    totalLikes: 0,
    averageRating: 0
  });

  const BACKEND_URL = 'http://localhost:5000';

  // Form state for creating/editing recipes
  const [recipeForm, setRecipeForm] = useState({
    name: '', // was title
    description: '',
    category: 'main-course',
    cuisine: 'american',
    difficulty: 'medium',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    cookingMethod: '', // new required field
    ingredients: [{ name: '', quantity: '', unit: '', notes: '' }],
    instructions: [{ stepNumber: 1, instruction: '', duration: '', temperature: '' }],
    dietaryTags: [],
    chefNotes: '',
    tips: [''],
    equipment: [''],
    tags: ['']
  });

  // Fetch chef's recipes
  const fetchMyRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/my-recipes`);
      const recipesArr = response.data.data || [];
      setRecipes(recipesArr);
      // Calculate stats
      const totalRecipes = recipesArr.length;
      const totalViews = recipesArr.reduce((sum, recipe) => sum + (recipe.views || 0), 0);
      const totalLikes = recipesArr.reduce((sum, recipe) => sum + (recipe.likes ? recipe.likes.length : 0), 0);
      let totalRatings = 0;
      let ratingSum = 0;
      recipesArr.forEach(recipe => {
        totalRatings += recipe.ratings ? recipe.ratings.length : 0;
        ratingSum += recipe.ratings ? recipe.ratings.reduce((sum, rating) => sum + (rating.value || rating.rating || 0), 0) : 0;
      });
      const averageRating = totalRatings > 0 ? Math.round((ratingSum / totalRatings) * 10) / 10 : 0;
      setStats({
        totalRecipes,
        totalViews,
        totalLikes,
        averageRating
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load your recipes');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'chef') {
      fetchMyRecipes();
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle array field changes (ingredients, instructions, etc.)
  const handleArrayFieldChange = (fieldName, index, subField, value) => {
    setRecipeForm(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) =>
        i === index ? { ...item, [subField]: value } : item
      )
    }));
  };

  // Add new array item
  const addArrayItem = (fieldName, defaultItem) => {
    setRecipeForm(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], defaultItem]
    }));
  };

  // Remove array item
  const removeArrayItem = (fieldName, index) => {
    setRecipeForm(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  // Handle dietary tags
  const handleDietaryTagChange = (tag) => {
    setRecipeForm(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag]
    }));
  };

  // Submit recipe (create or update)
  const handleSubmitRecipe = async (e) => {
    e.preventDefault();
    // Validate and sanitize numeric fields
    const prepTime = Number(recipeForm.prepTime);
    const cookTime = Number(recipeForm.cookTime);
    const servings = Number(recipeForm.servings);
    const category = recipeForm.category;
    const name = recipeForm.name;
    const cookingMethod = recipeForm.cookingMethod;

    if (!name || !name.trim()) {
      showError('Please enter a recipe name.');
      return;
    }
    if (!cookingMethod || !cookingMethod.trim()) {
      showError('Please enter a cooking method.');
      return;
    }
    if (!category || !category.trim()) {
      showError('Please select a category.');
      return;
    }
    if (!servings || isNaN(servings) || servings < 1) {
      showError('Please enter a valid number of servings.');
      return;
    }
    if (!prepTime || isNaN(prepTime) || prepTime < 1) {
      showError('Please enter a valid prep time.');
      return;
    }
    if (!cookTime || isNaN(cookTime) || cookTime < 1) {
      showError('Please enter a valid cook time.');
      return;
    }

    // Calculate totalTime safely
    const totalTime = prepTime + cookTime;
    if (isNaN(totalTime) || totalTime < 1) {
      showError('Total time must be a valid positive number.');
      return;
    }

    try {
      // Clean up form data and map fields
      const cleanedForm = {
        ...recipeForm,
        name,
        category,
        servings,
        prepTime,
        cookTime,
        totalTime,
        ingredients: recipeForm.ingredients.filter(ing => ing.name && ing.name.trim()),
        instructions: recipeForm.instructions.filter(inst => inst.instruction && inst.instruction.trim()),
        tips: recipeForm.tips.filter(tip => tip && tip.trim()),
        equipment: recipeForm.equipment.filter(eq => eq && eq.trim()),
        tags: recipeForm.tags.filter(tag => tag && tag.trim())
      };
      if (editingRecipe) {
        console.log('Updating recipe:', editingRecipe._id, cleanedForm);
        const response = await axios.put(`${BACKEND_URL}/api/chef-recipes/${editingRecipe._id}`, cleanedForm, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Update response:', response.data);
        showSuccess('Recipe updated successfully!');
      } else {
        console.log('Creating new recipe:', cleanedForm);
        const response = await axios.post(`${BACKEND_URL}/api/chef-recipes`, cleanedForm, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Create response:', response.data);
        showSuccess('Recipe created successfully!');
      }
      resetForm();
      fetchMyRecipes();
    } catch (err) {
      console.error('Error saving recipe:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      showError(`Failed to save recipe: ${err.response?.data?.message || err.message}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setRecipeForm({
      name: '',
      description: '',
      category: 'main-course',
      cuisine: 'american',
      difficulty: 'medium',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      cookingMethod: '',
      ingredients: [{ name: '', quantity: '', unit: '', notes: '' }],
      instructions: [{ stepNumber: 1, instruction: '', duration: '', temperature: '' }],
      dietaryTags: [],
      chefNotes: '',
      tips: [''],
      equipment: [''],
      tags: ['']
    });
    setEditingRecipe(null);
    setShowCreateForm(false);
  };

  // Edit recipe
  const handleEditRecipe = (recipe) => {
    setRecipeForm({
      name: recipe.name || recipe.title || '',
      description: recipe.description,
      category: recipe.category,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      cookingMethod: recipe.cookingMethod || '',
      ingredients: recipe.ingredients && recipe.ingredients.length ? recipe.ingredients : [{ name: '', quantity: '', unit: '', notes: '' }],
      instructions: recipe.instructions && recipe.instructions.length ? recipe.instructions : [{ stepNumber: 1, instruction: '', duration: '', temperature: '' }],
      dietaryTags: recipe.dietaryTags || [],
      chefNotes: recipe.chefNotes || '',
      tips: recipe.tips && recipe.tips.length ? recipe.tips : [''],
      equipment: recipe.equipment && recipe.equipment.length ? recipe.equipment : [''],
      tags: recipe.tags && recipe.tags.length ? recipe.tags : ['']
    });
    setEditingRecipe(recipe);
    setShowCreateForm(true);
  };

  // Delete recipe
  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`${BACKEND_URL}/api/chef-recipes/${recipeId}`);
        // Optimistically update UI
        setRecipes(prev => prev.filter(r => String(r._id) !== String(recipeId)));
        showSuccess('Recipe deleted successfully!');
        // Optionally re-fetch for consistency
        setTimeout(fetchMyRecipes, 500);
      } catch (err) {
        console.error('Error deleting recipe:', err);
        showError('Failed to delete recipe.');
      }
    }
  };



  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      case 'draft': return 'status-draft';
      default: return 'status-draft';
    }
  };

  // Show dashboard header for all users
  return (
    <div className="chef-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <h1>👨‍🍳 Chef Dashboard</h1>
          <div className="header-buttons">
            <button onClick={() => navigate('/')} className="nav-btn">🏠 Home</button>
            <button onClick={() => navigate('/profile')} className="profile-btn">👤 Profile</button>
          </div>
        </div>
        {user?.role === 'chef' ? (
          <p>Welcome back, Chef {user.name}! Manage your recipes and track your culinary impact.</p>
        ) : (
          <p>Welcome, {user.name}! You can view your saved recipes and profile here.</p>
        )}
      </div>

      {/* Main Content */}
      {user?.role === 'chef' ? (
        <>
          {/* Chef Statistics */}
          <div className="chef-stats">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h3>{stats.totalRecipes}</h3>
                <p>Total Recipes</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👀</div>
              <div className="stat-info">
                <h3>{stats.totalViews.toLocaleString()}</h3>
                <p>Total Views</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❤️</div>
              <div className="stat-info">
                <h3>{stats.totalLikes}</h3>
                <p>Total Likes</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <h3>{stats.averageRating}</h3>
                <p>Avg Rating</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="dashboard-actions">
            <button
              onClick={() => setShowCreateForm(true)}
              className="create-recipe-btn"
            >
              ➕ Create New Recipe
            </button>
            <button
              onClick={fetchMyRecipes}
              className="refresh-btn"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Recipe Creation/Edit Form */}
          {showCreateForm && (
            <div className="recipe-form-modal">
              <div className="recipe-form-container">
                <div className="form-header">
                  <h2>{editingRecipe ? '✏️ Edit Recipe' : '➕ Create New Recipe'}</h2>
                  <button onClick={resetForm} className="close-form-btn">✕</button>
                </div>

                <form onSubmit={handleSubmitRecipe} className="recipe-form">
                  {/* Basic Information */}
                  <div className="form-section">
                    <h3>📝 Basic Information</h3>

                    <div className="form-group">
                      <label>Recipe Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={recipeForm.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter recipe name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cooking Method *</label>
                      <input
                        type="text"
                        name="cookingMethod"
                        value={recipeForm.cookingMethod}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Baking, Frying, Boiling, etc."
                      />
                    </div>

                    <div className="form-group">
                      <label>Description *</label>
                      <ReactQuill
                        theme="snow"
                        value={recipeForm.description}
                        onChange={value => setRecipeForm(prev => ({ ...prev, description: value }))}
                        placeholder="Describe your recipe, use bullets, numbers, formatting, etc."
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ]
                        }}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Category *</label>
                        <select name="category" value={recipeForm.category} onChange={handleInputChange}>
                          <option value="appetizer">🥗 Appetizer</option>
                          <option value="main-course">🍽️ Main Course</option>
                          <option value="dessert">🍰 Dessert</option>
                          <option value="soup">🍲 Soup</option>
                          <option value="salad">🥙 Salad</option>
                          <option value="breakfast">🌅 Breakfast</option>
                          <option value="lunch">☀️ Lunch</option>
                          <option value="dinner">🌙 Dinner</option>
                          <option value="snack">🍿 Snack</option>
                          <option value="beverage">🥤 Beverage</option>
                          <option value="side-dish">🍚 Side Dish</option>
                          <option value="sauce">🥄 Sauce</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Cuisine *</label>
                        <select name="cuisine" value={recipeForm.cuisine} onChange={handleInputChange}>
                          <option value="american">🇺🇸 American</option>
                          <option value="italian">🇮🇹 Italian</option>
                          <option value="mexican">🇲🇽 Mexican</option>
                          <option value="asian">🥢 Asian</option>
                          <option value="mediterranean">🫒 Mediterranean</option>
                          <option value="indian">🇮🇳 Indian</option>
                          <option value="french">🇫🇷 French</option>
                          <option value="chinese">🇨🇳 Chinese</option>
                          <option value="japanese">🇯🇵 Japanese</option>
                          <option value="thai">🇹🇭 Thai</option>
                          <option value="greek">🇬🇷 Greek</option>
                          <option value="spanish">🇪🇸 Spanish</option>
                          <option value="middle-eastern">🕌 Middle Eastern</option>
                          <option value="african">🌍 African</option>
                          <option value="fusion">🌐 Fusion</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Difficulty *</label>
                        <select name="difficulty" value={recipeForm.difficulty} onChange={handleInputChange}>
                          <option value="easy">😊 Easy</option>
                          <option value="medium">😐 Medium</option>
                          <option value="hard">😰 Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Prep Time (minutes) *</label>
                        <input
                          type="number"
                          name="prepTime"
                          value={recipeForm.prepTime}
                          onChange={handleInputChange}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Cook Time (minutes) *</label>
                        <input
                          type="number"
                          name="cookTime"
                          value={recipeForm.cookTime}
                          onChange={handleInputChange}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Servings *</label>
                        <input
                          type="number"
                          name="servings"
                          value={recipeForm.servings}
                          onChange={handleInputChange}
                          min="1"
                          max="50"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="form-section">
                    <h3>🥘 Ingredients</h3>
                    {recipeForm.ingredients.map((ingredient, index) => (
                      <div key={index} className="ingredient-row">
                        <input
                          type="text"
                          placeholder="Ingredient name"
                          value={ingredient.name}
                          onChange={(e) => handleArrayFieldChange('ingredients', index, 'name', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Quantity"
                          value={ingredient.quantity}
                          onChange={(e) => handleArrayFieldChange('ingredients', index, 'quantity', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={ingredient.unit}
                          onChange={(e) => handleArrayFieldChange('ingredients', index, 'unit', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={ingredient.notes}
                          onChange={(e) => handleArrayFieldChange('ingredients', index, 'notes', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('ingredients', index)}
                          className="remove-btn"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('ingredients', { name: '', quantity: '', unit: '', notes: '' })}
                      className="add-btn"
                    >
                      ➕ Add Ingredient
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="form-section">
                    <h3>📋 Instructions</h3>
                    {recipeForm.instructions.map((instruction, index) => (
                      <div key={index} className="instruction-row">
                        <span className="step-number">{index + 1}</span>
                        <textarea
                          placeholder="Instruction step"
                          value={instruction.instruction}
                          onChange={(e) => handleArrayFieldChange('instructions', index, 'instruction', e.target.value)}
                          required
                          rows="2"
                        />
                        <input
                          type="text"
                          placeholder="Duration (optional)"
                          value={instruction.duration}
                          onChange={(e) => handleArrayFieldChange('instructions', index, 'duration', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Temperature (optional)"
                          value={instruction.temperature}
                          onChange={(e) => handleArrayFieldChange('instructions', index, 'temperature', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('instructions', index)}
                          className="remove-btn"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('instructions', {
                        stepNumber: recipeForm.instructions.length + 1,
                        instruction: '',
                        duration: '',
                        temperature: ''
                      })}
                      className="add-btn"
                    >
                      ➕ Add Step
                    </button>
                  </div>

                  {/* Dietary Tags */}
                  <div className="form-section">
                    <h3>🏷️ Dietary Tags</h3>
                    <div className="dietary-tags">
                      {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo', 'low-sodium', 'high-protein', 'low-fat', 'sugar-free'].map(tag => (
                        <label key={tag} className="tag-checkbox">
                          <input
                            type="checkbox"
                            checked={recipeForm.dietaryTags.includes(tag)}
                            onChange={() => handleDietaryTagChange(tag)}
                          />
                          <span>{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Chef Notes */}
                  <div className="form-section">
                    <h3>💭 Chef Notes & Tips</h3>

                    <div className="form-group">
                      <label>Chef Notes</label>
                      <textarea
                        name="chefNotes"
                        value={recipeForm.chefNotes}
                        onChange={handleInputChange}
                        placeholder="Share your professional tips and insights"
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Tips</label>
                      {recipeForm.tips.map((tip, index) => (
                        <div key={index} className="tip-row">
                          <input
                            type="text"
                            placeholder="Cooking tip"
                            value={tip}
                            onChange={(e) => handleArrayFieldChange('tips', index, null, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('tips', index)}
                            className="remove-btn"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('tips', '')}
                        className="add-btn"
                      >
                        ➕ Add Tip
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Equipment Needed</label>
                      {recipeForm.equipment.map((item, index) => (
                        <div key={index} className="equipment-row">
                          <input
                            type="text"
                            placeholder="Equipment item"
                            value={item}
                            onChange={(e) => handleArrayFieldChange('equipment', index, null, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('equipment', index)}
                            className="remove-btn"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('equipment', '')}
                        className="add-btn"
                      >
                        ➕ Add Equipment
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Tags (for search)</label>
                      {recipeForm.tags.map((tag, index) => (
                        <div key={index} className="tag-row">
                          <input
                            type="text"
                            placeholder="Search tag"
                            value={tag}
                            onChange={(e) => handleArrayFieldChange('tags', index, null, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('tags', index)}
                            className="remove-btn"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('tags', '')}
                        className="add-btn"
                      >
                        ➕ Add Tag
                      </button>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button type="button" onClick={resetForm} className="cancel-btn">
                      ❌ Cancel
                    </button>
                    <button type="submit" className="save-btn">
                      {editingRecipe ? '💾 Update Recipe' : '✨ Create Recipe'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Recipes List */}
          <div className="recipes-section">
            <h2>📚 Your Recipes</h2>
            {loading ? (
              <div className="loading">Loading your recipes...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : recipes.length === 0 ? (
              <div className="empty-state">
                <h3>🍳 No recipes yet!</h3>
                <p>Start creating your first recipe to share with the DishCraft community.</p>
                <button onClick={() => setShowCreateForm(true)} className="create-first-recipe-btn">
                  ✨ Create Your First Recipe
                </button>
              </div>
            ) : (
              <RecipeCapsuleList
                recipes={recipes}
                handleEditRecipe={handleEditRecipe}
                handleDeleteRecipe={handleDeleteRecipe}
                showSuccess={showSuccess}
                showError={showError}
                showWarning={showWarning}
                navigate={navigate}
              />
            )}
          </div>
        </>
      ) : (
        <div className="access-denied">
          <h2>👤 User Dashboard</h2>
          <p>You are logged in as a user. Visit your <button className="profile-btn" onClick={() => navigate('/profile')}>Profile</button> to view your saved recipes and account info.</p>
        </div>
      )}
    </div>
  );
};

const RecipeCapsuleList = ({ recipes, missingIngredients, handleEditRecipe, handleDeleteRecipe, showSuccess, showError, showWarning, navigate }) => {
  const [expandedIndex, setExpandedIndex] = React.useState(null);

  // If there are missing ingredients, show message and do not show recipes
  if (missingIngredients && missingIngredients.length > 0) {
    return (
      <div className="missing-ingredients-message">
        <h3>Missing Ingredients</h3>
        <p>Some required ingredients are missing. Please add all required ingredients to generate recipes.</p>
      </div>
    );
  }

  return (
    <div className="recipes-list">
      {recipes.map((recipe, idx) => (
        <RecipeCapsule
          key={recipe._id}
          recipe={recipe}
          expanded={expandedIndex === idx}
          onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
          handleEditRecipe={handleEditRecipe}
          handleDeleteRecipe={handleDeleteRecipe}
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showWarning}
          navigate={navigate}
        />
      ))}
    </div>
  );
};

const RecipeCapsule = ({ recipe, expanded, onClick, handleEditRecipe, handleDeleteRecipe, showSuccess, showError, showWarning, navigate }) => {
  const { user, token } = useAuth();
  const [likesCount, setLikesCount] = React.useState(recipe.likes ? recipe.likes.length : 0);
  const [liked, setLiked] = React.useState(recipe.likes ? recipe.likes.some(id => id === user?._id) : false);
  const [likeLoading, setLikeLoading] = React.useState(false);

  React.useEffect(() => {
    setLikesCount(recipe.likes ? recipe.likes.length : 0);
    setLiked(recipe.likes ? recipe.likes.some(id => id === user?._id) : false);
  }, [recipe.likes, user]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;
    setLikeLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/chef-recipes/${recipe._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      // Optionally show error
    } finally {
      setLikeLoading(false);
    }
  };

  const handleRate = async (e, rating) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/chef-recipes/${recipe._id}/rate`,
        { value: rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update the recipe ratings in the parent component
      // This will trigger a re-render with updated ratings
    } catch (err) {
      console.error('Error rating recipe:', err);
    }
  };

  const handleAddFeedback = async (e, feedbackText) => {
    e.stopPropagation();
    if (!user) {
      showWarning('Please log in to add feedback.');
      return;
    }
    if (!feedbackText || feedbackText.trim() === '') {
      showError('Please enter a feedback comment.');
      return;
    }
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/chef-recipes/${recipe._id}/feedback`,
        { text: feedbackText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess('Feedback added successfully!');
      // Update the recipe feedbacks in the parent component
      // This will trigger a re-render with updated feedbacks
    } catch (err) {
      console.error('Error adding feedback:', err);
      showError('Failed to add feedback.');
    }
  };

  return (
    <div className="recipe-capsule">
      <div className="capsule-header" onClick={onClick}>
        <h3>{recipe.name || recipe.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="like-btn"
            onClick={handleLike}
            disabled={likeLoading}
            title={liked ? 'Unlike' : 'Love this recipe'}
          >
            {liked ? '💖' : '🤍'} <span style={{ color: '#333', fontWeight: '500' }}>{likesCount}</span>
          </button>

          {/* Rating Stars */}
          <div className="rating-stars" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map((star) => {
              const userRating = recipe.ratings?.find(r => r.user === user?._id)?.value || 0;
              const isRated = userRating >= star;
              return (
                <button
                  key={star}
                  onClick={(e) => handleRate(e, star)}
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
              ({recipe.ratings?.length || 0})
            </span>
          </div>
          <button className="expand-btn" tabIndex={-1}>{expanded ? '▲' : '▼'}</button>
        </div>
      </div>
      {expanded && (
        <div className="capsule-details">
          <div className="capsule-meta">
            <span>🍽️ {recipe.category}</span>
            <span>🌍 {recipe.cuisine}</span>
            <span>⏱️ {recipe.prepTime + recipe.cookTime}m</span>
            <span>👥 {recipe.servings}</span>
            <span>⭐ {
              recipe.ratings && recipe.ratings.length > 0
                ? (recipe.ratings.reduce((sum, rating) => sum + (rating.value || rating.rating || 0), 0) / recipe.ratings.length).toFixed(1)
                : '0.0'
            } ({recipe.ratings?.length || 0} ratings)</span>
          </div>
          <div className="capsule-description" dangerouslySetInnerHTML={{ __html: recipe.description }} />
          <div className="capsule-section">
            <strong>Ingredients:</strong>
            <ul>
              {recipe.ingredients?.map((ing, i) => (
                <li key={i}>{ing.quantity ? ing.quantity + ' ' : ''}{ing.unit ? ing.unit + ' ' : ''}{ing.name}{ing.notes ? ' (' + ing.notes + ')' : ''}</li>
              ))}
            </ul>
          </div>
          <div className="capsule-section">
            <strong>Instructions:</strong>
            <ol>
              {recipe.instructions?.map((inst, i) => (
                <li key={i}>{inst.instruction} {inst.duration && (<span>({inst.duration})</span>)} {inst.temperature && (<span>[{inst.temperature}]</span>)}</li>
              ))}
            </ol>
          </div>
          {recipe.chefNotes && (
            <div className="capsule-section"><strong>Chef Notes:</strong> {recipe.chefNotes}</div>
          )}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="capsule-section"><strong>Tips:</strong> <ul>{recipe.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul></div>
          )}
          {recipe.equipment && recipe.equipment.length > 0 && (
            <div className="capsule-section"><strong>Equipment:</strong> <ul>{recipe.equipment.map((eq, i) => <li key={i}>{eq}</li>)}</ul></div>
          )}
          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <div className="capsule-section"><strong>Dietary Tags:</strong> {recipe.dietaryTags.join(', ')}</div>
          )}

          {/* Feedback Section */}
          <div className="capsule-section">
            <strong>💬 Feedback ({recipe.feedbacks?.length || 0})</strong>

            {/* Display existing feedbacks */}
            {recipe.feedbacks && recipe.feedbacks.length > 0 ? (
              <div className="feedbacks-list">
                {recipe.feedbacks.map((feedback, index) => (
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
              <p className="no-feedback">
                No feedback yet. Be the first to share your thoughts!
              </p>
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
                      handleAddFeedback(e, feedbackText);
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

          {/* Recipe Actions */}
          <div className="recipe-actions">
            <button
              onClick={() => handleEditRecipe(recipe)}
              className="edit-btn"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleDeleteRecipe(recipe._id)}
              className="delete-btn"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;
