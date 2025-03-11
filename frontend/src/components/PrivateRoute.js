import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

// Component to protect routes that require authentication
const PrivateRoute = ({ children, requiredRole }) => {
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  
  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If a specific role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  // User is authenticated and has required role if any
  return children;
};

export default PrivateRoute; 