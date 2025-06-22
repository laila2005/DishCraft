import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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
  const [token, setToken] = useState(localStorage.getItem('dishcraft_token'));

  // Use environment variable for backend URL
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Set axios default header for authorization
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Function to check authentication status and fetch user data
  const checkAuth = useCallback(async () => {
    if (token) {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`); // Corrected endpoint to /api/auth/me
        setUser(response.data.user);
        // console.log("Auth check successful:", response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setToken(null);
        localStorage.removeItem('dishcraft_token');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [token, BACKEND_URL]);

  // Run auth check on component mount and when token changes
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem('dishcraft_token', token);
      setToken(token);
      setUser(user);
      // console.log("Login successful:", user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  }, [BACKEND_URL]);

  // Signup function
  const signup = useCallback(async (name, email, password, role) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/signup`, { name, email, password, role }); // Corrected endpoint to /api/auth/signup
      const { token, user } = response.data;
      localStorage.setItem('dishcraft_token', token);
      setToken(token);
      setUser(user);
      // console.log("Signup successful:", user);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  }, [BACKEND_URL]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('dishcraft_token');
    setToken(null);
    setUser(null);
    // console.log("Logged out");
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
