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
        const response = await axios.get(`${backendUrl}/api/auth/me`);
        setUser(response.data.user); // Set user data if token is valid
        setToken(storedToken); // Ensure token state is consistent with localStorage
        console.log("AuthContext: Auth check successful, user:", response.data.user.email);
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
  }, []); // No dependency on token here, as we read from localStorage directly

  // Run auth check on component mount (once)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]); // Dependency array ensures it runs when checkAuth is stable

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const backendUrl = getBackendUrl();
      console.log('AuthContext: Attempting login with backend:', `${backendUrl}/api/auth/login`);
      
      const response = await axios.post(`${backendUrl}/api/auth/login`, { email, password });
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('dishcraft_token', newToken);
      setToken(newToken); // Update token state, which triggers checkAuth
      setUser(newUser); // Set user immediately for faster UI update
      console.log("AuthContext: Login successful for user:", newUser.email);
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error.response?.data?.message || error.message);
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message };
    }
  }, []);

  // Signup function
  const signup = useCallback(async (name, email, password, role) => {
    try {
      const backendUrl = getBackendUrl();
      console.log('AuthContext: Attempting signup with backend:', `${backendUrl}/api/auth/signup`);
      
      const response = await axios.post(`${backendUrl}/api/auth/signup`, { name, email, password, role });
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('dishcraft_token', newToken);
      setToken(newToken); // Update token state, which triggers checkAuth
      setUser(newUser); // Set user immediately for faster UI update
      console.log("AuthContext: Signup successful for user:", newUser.email);
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Registration error:', error.response?.data?.message || error.message);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, message };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('dishcraft_token');
    setToken(null);
    setUser(null);
    console.log("AuthContext: Logged out");
  }, []);

  const value = {
    user,
    isAuthenticated: !!user, // True if user object exists
    loading, // Auth loading state
    login,
    signup,
    logout,
    token,
    backendUrl: getBackendUrl(), // Expose backend URL for debugging/info
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
