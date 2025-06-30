import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './components/HomePage';
import ChefDashboard from './components/ChefDashboard';
import AuthForms from './components/AuthForms';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthRoutes />} />
        <Route path="/dashboard" element={<ProtectedRoutes />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

function AuthRoutes() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return isAuthenticated ? (
    <Navigate to="/" />
  ) : (
    <AuthForms onClose={() => navigate('/')} />
  );
}

function ProtectedRoutes() {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated && user?.role === 'chef' ? (
    <ChefDashboard />
  ) : (
    <Navigate to="/" />
  );
}

export default App;
