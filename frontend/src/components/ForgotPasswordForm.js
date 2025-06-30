import React, { useState } from 'react';
import axios from 'axios';
import './AuthForms.css';
import { FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordForm = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || 'https://dishcraft-backend-3tk2.onrender.com'}/api/forgot-password`,
        { email }
      );
      setMessage(res.data.message || 'Check your email for reset link');
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        {/* ❌ This button now ONLY handles return to login */}
        <button className="auth-close-btn" onClick={() => navigate('/auth')}>✕</button>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">🔐</div>
              <h1>Reset Password</h1>
            </div>
            <p>We'll send you a link to reset your password</p>
          </div>

          <div className="auth-content">
            {message && <div className="auth-message success">{message}</div>}
            {error && <div className="auth-message error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FaEnvelope /></span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
