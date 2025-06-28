import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './components/HomePage';
import ChefDashboard from './components/ChefDashboard';
import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="App"><p>Loading...</p></div>;

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {user?.role === 'chef' && (
        <Route path="/dashboard" element={<ChefDashboard />} />
      )}
      <Route path="*" element={<div className="App">404 - Page Not Found</div>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

