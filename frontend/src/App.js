import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './components/HomePage';
import ChefDashboard from './components/ChefDashboard';
import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="App"><p>Loading...</p></div>;

  return (
    <Routes>
      {/* Home page available to everyone */}
      <Route path="/" element={<HomePage />} />

      {/* Dashboard only for chefs */}
      {user?.role === 'chef' && (
        <Route path="/dashboard" element={<ChefDashboard />} />
      )}

      {/* Optional: fallback route if needed */}
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
