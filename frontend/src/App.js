import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import HomePage from './components/HomePage';
import ChefDashboard from './components/ChefDashboard';
import ChefProfile from './components/ChefProfile';
import AuthForms from './components/AuthForms';
import './App.css';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import Footer from './components/Footer';
import UserProfile from './components/UserProfile';
import Contact from './components/Contact';
import About from './components/About';

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthRoutes />} />
              <Route path="/dashboard" element={<ProtectedRoutes />} />
              {/* forgot‑password & reset‑password */}
              <Route path="/forgot-password" element={<ForgotPasswordForm />} />
              <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/chef/:chefId" element={<ChefProfile />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AlertProvider>
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
