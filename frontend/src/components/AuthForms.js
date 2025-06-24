import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthForms.css';

const AuthForms = ({ onClose }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          // Show welcome message with user info
          setWelcomeUser({
            email: formData.email,
            role: result.role
          });
          setShowWelcome(true);
          
          // Close the form after showing welcome message for 3 seconds
          setTimeout(() => {
            onClose();
          }, 3000);
        } else {
          setError(result.message || 'Login failed');
        }
      } else {
        const result = await register(formData.name, formData.email, formData.password, formData.role);
        if (result.success) {
          setSuccess('Registration successful! You can now log in.');
          setIsLogin(true);
          setFormData({ name: '', email: '', password: '', role: 'user' });
        } else {
          setError(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ name: '', email: '', password: '', role: 'user' });
  };

  // Welcome screen after successful login
  if (showWelcome && welcomeUser) {
    return (
      <div className="auth-overlay">
        <div className="auth-container">
          <div className="welcome-card">
            <div className="welcome-header">
              <div className="welcome-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h1>Welcome to DishCraft!</h1>
              <p>Login successful</p>
            </div>
            
            <div className="welcome-content">
              <div className="welcome-user-info">
                <div className="user-avatar">
                  {welcomeUser.role === 'chef' ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <line x1="10" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="2"/>
                      <line x1="14" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  )}
                </div>
                <div className="user-details">
                  <h3>Welcome back!</h3>
                  <p className="user-email">{welcomeUser.email}</p>
                  <p className="user-role">
                    Logged in as: <span className="role-badge">{welcomeUser.role === 'chef' ? 'Chef' : 'User'}</span>
                  </p>
                </div>
              </div>
              
              <div className="welcome-features">
                {welcomeUser.role === 'chef' ? (
                  <div className="feature-list">
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                      </svg>
                      <span>Access Chef Dashboard</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      <span>Create & Share Recipes</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      <span>Manage Your Recipes</span>
                    </div>
                  </div>
                ) : (
                  <div className="feature-list">
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                      </svg>
                      <span>Generate Amazing Recipes</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      <span>Save Favorite Recipes</span>
                    </div>
                    <div className="feature-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      <span>Create Meal Plans</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="welcome-footer">
                <p>Redirecting you to the homepage...</p>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <button className="auth-close-btn" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <h1>DishCraft</h1>
            </div>
            <div className="auth-tabs">
              <button 
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button 
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="auth-content">
            <div className="auth-welcome">
              <h2>{isLogin ? 'Welcome back!' : 'Join DishCraft'}</h2>
              <p>{isLogin ? 'Sign in to your account to continue' : 'Create an account to start generating amazing recipes'}</p>
            </div>

            {error && (
              <div className="auth-message error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="auth-message success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="role">Account Type</label>
                  <div className="role-selection">
                    <label className={`role-option ${formData.role === 'user' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={formData.role === 'user'}
                        onChange={handleInputChange}
                      />
                      <div className="role-content">
                        <div className="role-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                          </svg>
                        </div>
                        <div className="role-info">
                          <h4>User</h4>
                          <p>Generate and discover recipes</p>
                        </div>
                      </div>
                    </label>
                    <label className={`role-option ${formData.role === 'chef' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value="chef"
                        checked={formData.role === 'chef'}
                        onChange={handleInputChange}
                      />
                      <div className="role-content">
                        <div className="role-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <line x1="10" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="2"/>
                            <line x1="12" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="2"/>
                            <line x1="14" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="role-info">
                          <h4>Chef</h4>
                          <p>Create and share your recipes</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <div className="loading-spinner">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12a9 9 0 11-6.219-8.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button type="button" onClick={toggleForm} className="auth-link">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForms;
