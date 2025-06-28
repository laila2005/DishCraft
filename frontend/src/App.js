import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './components/HomePage';
import ChefDashboard from './components/ChefDashboard';
import AuthForms from './components/AuthForms';
import './App.css';

function AppRoutes() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/dashboard" 
        element={isAuthenticated && user?.role === 'chef' ? (
          <ChefDashboard />
        ) : (
          <Navigate to="/" />
        )} 
      />
      <Route path="/auth" element={<AuthForms />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
