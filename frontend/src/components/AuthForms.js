// src/components/AuthForms.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import './AuthForms.css';

// ---------- helpers ----------
const noop = () => {};               // safe default for onClose
const isFn = (f) => typeof f === 'function';

// ---------- component ----------
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
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);

  // ------------- handlers -------------
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
            role : result.role || 'user'
          });
          setShowWelcome(true);

          // hide modal after 3 s
          setTimeout(safeClose, 3000);
        } else {
          setError(result.message || 'Login failed');
        }
      } else {
        const result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.role
        );

        if (result.success) {
          setSuccess('Registration successful! You can now log in.');
          setIsLogin(true);
          setFormData({ name: '', email: '', password: '', role: 'user' });
        } else {
          setError(result.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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

  // ------------- render -------------
  if (showWelcome && welcomeUser) {
    /* ——— trimmed for brevity ——— */
    /* keep your existing welcome‑screen JSX here (unchanged) */
  }

  /* ——— keep the remainder of your JSX unchanged,      ———
     ——— except replace every plain onClose use with     ———
     ———   onClick={safeClose} and setTimeout(safeClose) ——— */

  return (
    /* … existing modal markup … */
    <button className="auth-close-btn" onClick={safeClose}>
      {/* svg */}
    </button>
    /* … rest unchanged … */
  );
};

AuthForms.propTypes = { onClose: PropTypes.func };

export default AuthForms;
