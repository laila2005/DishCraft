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
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('dishcraft_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getBackendUrl = useCallback(
    () => process.env.REACT_APP_BACKEND_URL || 'https://dishcraft-backend-3tk2.onrender.com',
    []
  );

  // attach / detach token to axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('dishcraft_token', token);
    } else {
      delete axios.defaults.headers.common.Authorization;
      localStorage.removeItem('dishcraft_token');
    }
  }, [token]);

  // ---------- API calls ----------
  const handleLogin = async (email, password) => {
    try {
      const backend = getBackendUrl();
      const { data } = await axios.post(`${backend}/api/login`, {
        username: email,
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
        username: email,
        password,
        role,
        name
      });
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return {
        success : false,
        message : err.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dishcraft_token');
    delete axios.defaults.headers.common.Authorization;
    navigate('/');
  }, [navigate]);

  // ---------- auth check on mount ----------
  const checkAuth = useCallback(async () => {
    setLoading(true);
    const stored = localStorage.getItem('dishcraft_token');

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
    token,
    loading,
    isAuthenticated: !!user,
    login   : handleLogin,
    register: handleRegister,
    logout  : handleLogout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
