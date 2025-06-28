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
  const [loading, setLoading] = useState(true); // Initial loading state for auth check
  const [token, setToken] = useState(localStorage.getItem('dishcraft_token'));

  // Get backend URL with fallback
  const getBackendUrl = () => {
    // Use process.env.REACT_APP_BACKEND_URL if defined, otherwise fallback to Render URL
    return process.env.REACT_APP_BACKEND_URL || 'https://dishcraft-backend-3tk2.onrender.com';
  };

  // Set axios default header for authorization whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // Remove Authorization header if no token
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Function to check authentication status and fetch user data
  const checkAuth = useCallback(async () => {
    setLoading(true); // Start loading when checking auth
    const storedToken = localStorage.getItem('dishcraft_token');
    if (storedToken) {
      try {
        const backendUrl = getBackendUrl();
        console.log('AuthContext: Checking auth with backend:', `${backendUrl}/api/auth/me`);

        // Make a request to the /api/auth/me endpoint to validate the token
        const response = await axios.get(`${backendUrl}/api/auth/me`, {
  headers: {
    Authorization: `Bearer ${storedToken}`,
  },
});

        setUser(response.data.user); // Set user data if token is valid
        setToken(storedToken); // Ensure token state is consistent with localStorage
        console.log('AuthContext: Auth check successful, user:', response.data.user.email);
      } catch (error) {
        console.error('AuthContext: Auth check failed:', error.response?.data?.message || error.message);
        // If token is invalid or expired, clear user data and token
        setUser(null);
        setToken(null);
        localStorage.removeItem('dishcraft_token');
      } finally {
        setLoading(false); // End loading after auth check
      }
    } else {
      // No token found, so not authenticated
      setUser(null);
      setToken(null);
      setLoading(false); // End loading if no token
    }
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await axios.post(`${backendUrl}/api/login`, {
        username: email, // Backend expects 'username' field
        password,
      });

      const { token: newToken, role } = response.data;
      setToken(newToken);
      localStorage.setItem('dishcraft_token', newToken);

      // Fetch user data after successful login
      await checkAuth();

      return { success: true, role };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      const backendUrl = getBackendUrl();
      const response = await axios.post(`${backendUrl}/api/register`, {
        username: email, // Backend expects 'username' field
        password,
        role,
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dishcraft_token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
