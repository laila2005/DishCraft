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

  // Get backend URL with fallback
  const getBackendUrl = () => {
    return process.env.REACT_APP_BACKEND_URL || 'https://dishcraft-backend-3tk2.onrender.com';
  };

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
        const backendUrl = getBackendUrl();
        console.log('Checking auth with backend:', `${backendUrl}/api/auth/me`);
        
        const response = await axios.get(`${backendUrl}/api/auth/me`);
        setUser(response.data.user);
        console.log("Auth check successful:", response.data.user);
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
  }, [token]);

  // Run auth check on component mount and when token changes
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const backendUrl = getBackendUrl();
      console.log('Attempting login with backend:', `${backendUrl}/api/auth/login`);
      
      const response = await axios.post(`${backendUrl}/api/auth/login`, { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('dishcraft_token', token);
      setToken(token);
      setUser(user);
      console.log("Login successful:", user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message };
    }
  }, []);

  // Signup function
  const signup = useCallback(async (name, email, password, role) => {
    try {
      const backendUrl = getBackendUrl();
      console.log('Attempting signup with backend:', `${backendUrl}/api/auth/signup`);
      
      const response = await axios.post(`${backendUrl}/api/auth/signup`, { name, email, password, role });
      const { token, user } = response.data;
      
      localStorage.setItem('dishcraft_token', token);
      setToken(token);
      setUser(user);
      console.log("Signup successful:", user);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, message };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('dishcraft_token');
    setToken(null);
    setUser(null);
    console.log("Logged out");
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    token,
    backendUrl: getBackendUrl(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
