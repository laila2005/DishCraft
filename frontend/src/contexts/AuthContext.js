// src/contexts/AuthContext.js
import React, {
  createContext, useContext, useState, useEffect, useCallback
} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem('dishcraft_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getBackendUrl = useCallback(
    () => process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'),
    []
  );

  // attach / detach token to axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      sessionStorage.setItem('dishcraft_token', token);
    } else {
      delete axios.defaults.headers.common.Authorization;
      sessionStorage.removeItem('dishcraft_token');
    }
  }, [token]);

  // ---------- API calls ----------
  const handleLogin = async (email, password) => {
    try {
      const backend = getBackendUrl();
      const { data } = await axios.post(`${backend}/api/login`, {
        email,
        password
      });

      setToken(data.token);
      setUser(data.user);
      navigate('/');                       // keep or remove as suits your UX
      return { success: true, role: data.user?.role };
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const handleRegister = async (name, email, password, role = 'user') => {
    try {
      const backend = getBackendUrl();
      await axios.post(`${backend}/api/register`, {
        email,
        password,
        role,
        name
      });
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      // Optionally call backend to invalidate token (if implemented)
      const backend = getBackendUrl();
      await axios.post(`${backend}/api/logout`);
    } catch (e) {
      // Ignore errors, just clear session
    }
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('dishcraft_token');
    delete axios.defaults.headers.common.Authorization;
    navigate('/');
  }, [navigate, getBackendUrl]);

  // ---------- auth check on mount ----------
  const checkAuth = useCallback(async () => {
    setLoading(true);
    const stored = sessionStorage.getItem('dishcraft_token');

    if (!stored) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const backend = getBackendUrl();
      const { data } = await axios.get(`${backend}/api/auth/me`, {
        headers: { Authorization: `Bearer ${stored}` }
      });

      setUser(data.user);
      setToken(stored);
    } catch (err) {
      console.error('Auth check failed:', err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, [getBackendUrl, handleLogout]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // ---------- context value ----------
  const value = {
    user,
    setUser, // <-- add setUser to context value
    token,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
