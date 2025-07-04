import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const ChefProfile = () => {
  const { user, isAuthenticated } = useAuth();
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
        const res = await axios.get(`http://localhost:5000/api/chef/profile`, {
          headers: { Authorization: `Bearer ${user.token}` }
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
              <h3>{recipe.name}</h3>
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
                <strong>Ratings:</strong> {recipe.ratings?.length || 0}
              </div>
              <div className="chef-recipe-section">
                <strong>Feedbacks:</strong>
                <ul>
                  {recipe.feedbacks && recipe.feedbacks.length > 0 ? (
                    recipe.feedbacks.map((fb, idx) => (
                      <li key={idx}>{fb.text} <span style={{color:'#888'}}>({fb.userName || 'User'})</span></li>
                    ))
                  ) : (
                    <li>No feedback yet.</li>
                  )}
                </ul>
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
