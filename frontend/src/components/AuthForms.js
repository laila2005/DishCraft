import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import './AuthForms.css';

const noop = () => {};
const isFn = (f) => typeof f === 'function';

const AuthForms = ({ onClose = noop }) => {
  const safeClose = () => { if (isFn(onClose)) onClose(); };

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          setWelcomeUser({
            email: formData.email,
            role: result.role || 'user'
          });
          setShowWelcome(true);
          setTimeout(safeClose, 3000);
        } else {
          setError(result.message || 'Login failed');
        }
      } else {
        const res = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.role
        );
        if (res.success) {
          setSuccess('Registration successful! You can now log in.');
          setIsLogin(true);
          setFormData({ name: '', email: '', password: '', role: 'user' });
        } else {
          setError(res.message || 'Registration failed');
        }
      }
    } catch {
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
    setError('');
    setSuccess('');
    setFormData({ name: '', email: '', password: '', role: 'user' });
  };

  if (showWelcome && welcomeUser) {
    return (
      <div className="auth-overlay">
        <div className="auth-container">
          <div className="welcome-card">
            <div className="welcome-header">
              <div className="welcome-icon">🎉</div>
              <h1>Welcome!</h1>
              <p>You have successfully logged in</p>
            </div>
            <div className="welcome-content">
              <div className="welcome-user-info">
                <div className="user-avatar">👤</div>
                <div className="user-details">
                  <h3>{welcomeUser.email}</h3>
                  <p className="user-role">
                    Role: <span className="role-badge">{welcomeUser.role}</span>
                  </p>
                </div>
              </div>
              <div className="welcome-footer">
                <p>Redirecting to dashboard...</p>
                <div className="loading-dots">
                  <span></span><span></span><span></span>
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
        <button className="auth-close-btn" onClick={safeClose}>
          ✖
        </button>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">🔐</div>
              <h1>DishCraft</h1>
            </div>
            <div className="auth-tabs">
              <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</button>
              <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Sign Up</button>
            </div>
          </div>

          <div className="auth-content">
            <div className="auth-welcome">
              <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
              <p>{isLogin ? 'Please login to continue' : 'Fill in the details to register'}</p>
            </div>

            {error && <div className="auth-message error">{error}</div>}
            {success && <div className="auth-message success">{success}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group">
                  <label>Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
 {isLogin && (
    <div style={{ textAlign: 'right', marginTop: '8px' }}>
      <Link to="/forgot-password" className="auth-forgot-link">
        Forgot Password?
      </Link>
    </div>
  )}
              </div>

              {!isLogin && (
                <div className="role-selection">
                  <div
                    className={`role-option ${formData.role === 'user' ? 'selected' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, role: 'user' }))}
                  >
                    <input type="radio" name="role" value="user" checked={formData.role === 'user'} readOnly />
                    <div className="role-content">
                      <div className="role-icon">👨‍🍳</div>
                      <div className="role-info">
                        <h4>User</h4>
                        <p>Explore and generate recipes</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`role-option ${formData.role === 'chef' ? 'selected' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, role: 'chef' }))}
                  >
                    <input type="radio" name="role" value="chef" checked={formData.role === 'chef'} readOnly />
                    <div className="role-content">
                      <div className="role-icon">👩‍🍳</div>
                      <div className="role-info">
                        <h4>Chef</h4>
                        <p>Create and manage your own recipes</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span className="loading-spinner">⏳</span> : isLogin ? 'Login' : 'Sign Up'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button className="auth-link" onClick={toggleForm}>
                  {isLogin ? 'Sign up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AuthForms.propTypes = { onClose: PropTypes.func };
export default AuthForms;
