import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const ChefProfile = () => {
  const { user, isAuthenticated, token } = useAuth();
  const { showSuccess, showError, showWarning } = useAlert();
  const navigate = useNavigate();
  const [chefData, setChefData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'chef') {
      navigate('/');
      return;
    }
    const fetchChefProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/chef/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChefData(res.data);
      } catch (err) {
        setError('Failed to load chef profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchChefProfile();
  }, [user, navigate]);

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!chefData) return null;

  // Handle like/unlike recipe
  const handleLikeRecipe = async (recipeId, currentLikes = []) => {
    if (!user) {
      showWarning('Please log in to like recipes.');
      navigate('/auth');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/chef-recipes/${recipeId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the recipe in the chefData
      setChefData(prev => ({
        ...prev,
        recipes: prev.recipes.map(recipe => {
          if (recipe._id === recipeId) {
            return {
              ...recipe,
              likedBy: response.data.liked ? [...(recipe.likedBy || []), user._id] : (recipe.likedBy || []).filter(id => id !== user._id)
            };
          }
          return recipe;
        })
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
      showWarning('Please log in to rate recipes.');
      navigate('/auth');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/chef-recipes/${recipeId}/rate`, { value: rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the recipe in the chefData
      setChefData(prev => ({
        ...prev,
        recipes: prev.recipes.map(recipe => {
          if (recipe._id === recipeId) {
            return {
              ...recipe,
              ratings: response.data.ratings
            };
          }
          return recipe;
        })
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
      const response = await axios.post(`http://localhost:5000/api/chef-recipes/${recipeId}/feedback`, {
        text: feedbackText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the recipe in the chefData
      setChefData(prev => ({
        ...prev,
        recipes: prev.recipes.map(recipe => {
          if (recipe._id === recipeId) {
            return {
              ...recipe,
              feedbacks: response.data.feedbacks
            };
          }
          return recipe;
        })
      }));

      showSuccess('Feedback added successfully!');
      return response.data;
    } catch (err) {
      console.error('Error adding feedback:', err);
      showError('Failed to add feedback.');
    }
  };

  return (
    <div className="chef-profile-page">
      <div className="chef-profile-header">
        <img
          src={chefData.profilePhoto || '/default-profile.png'}
          alt="Chef Profile"
          className="chef-profile-photo"
        />
        <div className="chef-profile-info">
          <h2>{chefData.name}</h2>
          <p className="chef-role">Chef</p>
          <p className="chef-recipe-count">Recipes: {chefData.recipes.length}</p>
        </div>
        {user.role === 'chef' && (
          <button className="nav-btn" onClick={() => navigate('/create-recipe')}>Create Recipe</button>
        )}
      </div>
      <div className="chef-recipes-list">
        {chefData.recipes.length === 0 ? (
          <div className="no-ingredients">No recipes yet.</div>
        ) : (
          chefData.recipes.map((recipe) => (
            <div className="chef-recipe-card" key={recipe._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>{recipe.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="like-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeRecipe(recipe._id, recipe.likedBy || []);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '22px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    title={recipe.likedBy?.some(id => id === user?._id) ? 'Unlike' : 'Like this recipe'}
                  >
                    {recipe.likedBy?.some(id => id === user?._id) ? '💖' : '🤍'} <span style={{ color: '#333', fontWeight: '500' }}>{recipe.likedBy?.length || 0}</span>
                  </button>

                  {/* Rating Stars */}
                  <div className="rating-stars" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const userRating = recipe.ratings?.find(r => r.user === user?._id)?.value || 0;
                      const isRated = userRating >= star;
                      return (
                        <button
                          key={star}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateRecipe(recipe._id, star);
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
                      ({recipe.ratings?.length || 0})
                    </span>
                  </div>
                </div>
              </div>
              <div className="chef-recipe-section">
                <strong>Ingredients:</strong>
                <ul>
                  {recipe.ingredients.map((ing, idx) => (
                    <li key={idx}>{ing.quantity} {ing.name}</li>
                  ))}
                </ul>
              </div>
              <div className="chef-recipe-section">
                <strong>Instructions:</strong>
                <ol>
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx}>{typeof step === 'object' && step.text ? step.text : step}</li>
                  ))}
                </ol>
              </div>
              <div className="chef-recipe-section">
                <strong>Average Rating:</strong> {
                  recipe.ratings && recipe.ratings.length > 0
                    ? (recipe.ratings.reduce((sum, rating) => sum + (rating.value || rating.rating || 0), 0) / recipe.ratings.length).toFixed(1)
                    : '0.0'
                } ⭐ ({recipe.ratings?.length || 0} ratings)
              </div>
              <div className="chef-recipe-section">
                <strong>💬 Feedbacks ({recipe.feedbacks?.length || 0}):</strong>
                <ul>
                  {recipe.feedbacks && recipe.feedbacks.length > 0 ? (
                    recipe.feedbacks.map((fb, idx) => (
                      <li key={idx}>"{fb.text}" <span style={{ color: '#888' }}>— {fb.userName || 'User'}</span></li>
                    ))
                  ) : (
                    <li>No feedback yet.</li>
                  )}
                </ul>

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
                          handleAddFeedback(recipe._id, feedbackText);
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
              <div className="chef-recipe-section">
                <strong>Likes:</strong> {recipe.likedBy?.length || 0}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChefProfile;
