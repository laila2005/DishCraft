import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ChefDashboard.css';

const ChefDashboard = () => {
  const { user } = useAuth();
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
      alert('Please enter a recipe name.');
      return;
    }
    if (!cookingMethod || !cookingMethod.trim()) {
      alert('Please enter a cooking method.');
      return;
    }
    if (!category || !category.trim()) {
      alert('Please select a category.');
      return;
    }
    if (!servings || isNaN(servings) || servings < 1) {
      alert('Please enter a valid number of servings.');
      return;
    }
    if (!prepTime || isNaN(prepTime) || prepTime < 1) {
      alert('Please enter a valid prep time.');
      return;
    }
    if (!cookTime || isNaN(cookTime) || cookTime < 1) {
      alert('Please enter a valid cook time.');
      return;
    }

    // Calculate totalTime safely
    const totalTime = prepTime + cookTime;
    if (isNaN(totalTime) || totalTime < 1) {
      alert('Total time must be a valid positive number.');
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
        await axios.put(`${BACKEND_URL}/api/chef-recipes/${editingRecipe._id}`, cleanedForm);
        alert('Recipe updated successfully!');
      } else {
        await axios.post(`${BACKEND_URL}/api/chef-recipes`, cleanedForm);
        alert('Recipe created successfully!');
      }
      resetForm();
      fetchMyRecipes();
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert('Failed to save recipe. Please try again.');
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
        alert('Recipe deleted successfully!');
        fetchMyRecipes();
      } catch (err) {
        console.error('Error deleting recipe:', err);
        alert('Failed to delete recipe.');
      }
    }
  };

  // Save recipe
  const handleSaveRecipe = async (recipeId) => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/chef-recipes/${recipeId}/save`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Recipe saved! You can view it in your profile.');
    } catch (err) {
      alert('Failed to save recipe.');
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
                handleSaveRecipe={handleSaveRecipe}
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

const RecipeCapsuleList = ({ recipes, missingIngredients, handleEditRecipe, handleDeleteRecipe, handleSaveRecipe }) => {
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
          handleSaveRecipe={handleSaveRecipe}
        />
      ))}
    </div>
  );
};

const RecipeCapsule = ({ recipe, expanded, onClick, handleEditRecipe, handleDeleteRecipe, handleSaveRecipe }) => {
  const { user } = useAuth();
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
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      // Optionally show error
    } finally {
      setLikeLoading(false);
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
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}
            title={liked ? 'Unlike' : 'Love this recipe'}
          >
            {liked ? '❤️' : '🤍'} {likesCount}
          </button>
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
            <span>⭐ {recipe.averageRating || 0} ({recipe.ratings?.length || 0} ratings)</span>
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
            <button
              onClick={() => handleSaveRecipe(recipe._id)}
              className="save-btn"
            >
              💾 Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;
