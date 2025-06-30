import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import './AuthForms.css';

const noop = () => {};
const isFn = (f) => typeof f === 'function';

const AuthForms = ({ onClose = noop }) => {
  const { login, register, isLoading, error } = useAuth();

  const [formType, setFormType] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, name } = formData;

    if (formType === 'login') {
      await login(email, password);
    } else {
      const result = await register(name, email, password);
      if (result.success) {
        setSuccessMessage('Registered successfully! Redirecting...');
        setTimeout(() => isFn(onClose) && onClose(), 3000);
      }
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-form-container">
        <button className="close-btn" onClick={onClose}>×</button>

        <h2>{formType === 'login' ? 'Login' : 'Sign Up'}</h2>

        <form onSubmit={handleSubmit}>
          {formType === 'signup' && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Please wait...' : formType === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        {error && <p className="error-msg">⚠️ {error}</p>}
        {successMessage && <p className="success-msg">✅ {successMessage}</p>}

        <p className="toggle-text">
          {formType === 'login' ? (
            <>
              Don't have an account?{' '}
              <span onClick={() => setFormType('signup')}>Sign Up</span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span onClick={() => setFormType('login')}>Login</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

AuthForms.propTypes = {
  onClose: PropTypes.func,
};

export default AuthForms;
