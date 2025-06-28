import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('dishcraft_token'));
  const navigate = useNavigate();

  const getBackendUrl = useCallback(() => {
    return process.env.REACT_APP_BACKEND_URL || 'https://dishcraft-backend-3tk2.onrender.com';
  }, []);

  // Set axios default headers when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('dishcraft_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('dishcraft_token');
    }
  }, [token]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const storedToken = localStorage.getItem('dishcraft_token');
    
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const backendUrl = getBackendUrl();
      const response = await axios.get(`${backendUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      
      setUser(response.data.user);
      setToken(storedToken);
    } catch (error) {
      console.error('Auth check failed:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, [getBackendUrl]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async (email, password) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await axios.post(`${backendUrl}/api/login`, {
        username: email,
        password
      });

      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const handleRegister = async (name, email, password, role = 'user') => {
    try {
      const backendUrl = getBackendUrl();
      await axios.post(`${backendUrl}/api/register`, {
        username: email,
        password,
        role,
        name
      });
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dishcraft_token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/');
  }, [navigate]);

  const value = {
    user,
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
