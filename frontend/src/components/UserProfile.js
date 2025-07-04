import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ChefDashboard.css';

const UserProfile = () => {
    const { user, setUser } = useAuth(); // use setUser from context
    const navigate = useNavigate(); // Add navigate
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef();

    // Hoist fetchSavedRecipes so it is defined before useEffect and delete button
    const fetchSavedRecipes = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Always get token from context or sessionStorage
            let token = null;
            if (user && user.token) {
                token = user.token;
            } else {
                token = sessionStorage.getItem('dishcraft_token');
            }
            if (!token) {
                setError('No authentication token found. Please log in again.');
                setLoading(false);
                return;
            }
            const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/user/saved-recipes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedRecipes(res.data.savedRecipes || []);
            setError('');
        } catch (err) {
            console.error('Saved recipes fetch error:', err, err?.response?.data);
            let backendMsg = err?.response?.data?.message || err?.message || 'Failed to load saved recipes.';
            setError('Failed to load saved recipes. ' + backendMsg);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSavedRecipes();
    }, [user, fetchSavedRecipes]);

    // Handle profile photo upload
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadError('');
        const formData = new FormData();
        formData.append('profilePhoto', file);
        try {
            // Always get token from context or sessionStorage
            let token = null;
            if (user && user.token) {
                token = user.token;
            } else {
                token = sessionStorage.getItem('dishcraft_token');
            }
            const res = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/user/profile`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            if (res.data && res.data.user) {
                setUser(res.data.user); // update user context
            }
        } catch (err) {
            setUploadError('Failed to upload photo.');
        } finally {
            setUploading(false);
        }
    };

    if (!user) {
        return <div className="chef-dashboard"><div className="access-denied"><h2>🚫 Access Denied</h2><p>Please log in to view your profile.</p></div></div>;
    }

    return (
        <div className="user-profile-page">
            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ margin: 0 }}>User Profile</h2>
                <button
                    className="nav-btn"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}
                    onClick={() => navigate('/')}
                >
                    🏠 Home
                </button>
            </div>
            <div className="dashboard-header">
                <div className="dashboard-header-top">
                    <h1>👤 User Profile</h1>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={user.profilePhoto || '/logo192.png'}
                            alt="Profile"
                            className="profile-avatar"
                            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '4px solid #764ba2' }}
                        />
                        <button
                            style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                background: '#764ba2',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                fontSize: 18
                            }}
                            title="Change profile photo"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            disabled={uploading}
                        >
                            <span role="img" aria-label="Edit">✏️</span>
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                        />
                    </div>
                    {uploading && <div style={{ color: '#764ba2', marginTop: 6 }}>Uploading...</div>}
                    {uploadError && <div style={{ color: 'red', marginTop: 6 }}>{uploadError}</div>}
                    <h2 style={{ margin: 0 }}>{user.name}</h2>
                    <p style={{ color: '#888', margin: 0 }}>{user.email}</p>
                </div>
            </div>
            <div className="recipes-section">
                <h2>💾 Saved Recipes</h2>
                {loading ? (
                    <div className="loading">Loading saved recipes...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : savedRecipes.length === 0 ? (
                    <div className="empty-state">
                        <h3>No saved recipes yet!</h3>
                        <p>Click the save button on any recipe to add it here.</p>
                    </div>
                ) : (
                    <div className="recipes-list">
                        {savedRecipes.map((recipe, recipeIdx) => (
                            <div className="generated-recipe" key={recipe._id}>
                                <h3>{recipe.name}</h3>
                                {/* No missingIngredients for saved recipes */}
                                <div className="recipe-details">
                                    <div className="detail-item">
                                        <strong>Cooking Time:</strong> {recipe.prepTime}
                                    </div>
                                    <div className="detail-item">
                                        <strong>Difficulty:</strong> {recipe.difficulty}
                                    </div>
                                    <div className="detail-item">
                                        <strong>Cuisine:</strong> {recipe.cuisine}
                                    </div>
                                    <div className="detail-item">
                                        <strong>Cooking Method:</strong> {recipe.cookingMethod}
                                    </div>
                                    {recipe.servings && (
                                        <div className="detail-item">
                                            <strong>Servings:</strong> {recipe.servings}
                                        </div>
                                    )}
                                    {recipe.calories && (
                                        <div className="detail-item">
                                            <strong>Calories:</strong> {recipe.calories}
                                        </div>
                                    )}
                                </div>
                                <div className="recipe-ingredients">
                                    <h4>Ingredients:</h4>
                                    <div className="ingredient-list">
                                        {(recipe.ingredients || []).map((ingredient, index) => (
                                            <div key={index} className="ingredient-item">
                                                <span className="ingredient-quantity">{ingredient.quantity}</span>
                                                <span className="ingredient-name">{ingredient.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="recipe-instructions">
                                    <h4>Instructions:</h4>
                                    <ul className="instructions-list">
                                        {(recipe.instructions || [])
                                            .map((instruction, index) => ({ instruction, index }))
                                            .sort((a, b) => {
                                                if (a.instruction && typeof a.instruction === 'object' && a.instruction.stepNumber !== undefined && b.instruction && typeof b.instruction === 'object' && b.instruction.stepNumber !== undefined) {
                                                    return a.instruction.stepNumber - b.instruction.stepNumber;
                                                }
                                                return a.index - b.index;
                                            })
                                            .map(({ instruction }, index) => (
                                                <li key={index} className="instruction-step">
                                                    {typeof instruction === 'object' && instruction.instruction ? instruction.instruction : instruction}
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                                <button
                                    className="delete-btn"
                                    style={{ marginTop: 12, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}
                                    onClick={async () => {
                                        if (!window.confirm('Remove this recipe from your saved recipes?')) return;
                                        setLoading(true);
                                        setError('');
                                        try {
                                            // Always send recipe._id as a string
                                            const recipeId = recipe && recipe._id ? String(recipe._id) : '';
                                            if (!recipeId) throw new Error('Invalid recipe ID');
                                            let token = user && user.token ? user.token : sessionStorage.getItem('dishcraft_token');
                                            await axios.delete(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/user/saved-recipes/${recipeId}`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            // Remove from UI immediately for responsiveness
                                            setSavedRecipes(prev => prev.filter(r => String(r._id) !== recipeId));
                                            // Optionally re-fetch from backend for consistency
                                            setTimeout(fetchSavedRecipes, 500);
                                        } catch (err) {
                                            console.error('Delete recipe error:', err, err?.response?.data);
                                            let backendMsg = err?.response?.data?.message || err?.message || 'Failed to remove recipe.';
                                            setError('Failed to remove recipe. ' + backendMsg);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    title="Remove from saved recipes"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
