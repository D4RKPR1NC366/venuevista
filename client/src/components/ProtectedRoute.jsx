import React from 'react';
import { Navigate } from 'react-router-dom';

// Check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Get user role from localStorage
const getUserRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || 'customer';
  } catch {
    return null;
  }
};

// Protected Route Component for Admin
export const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Protected Route Component for Client (Customer/Supplier)
export const ClientRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Protected Route Component for any authenticated user
export const AuthenticatedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Redirect authenticated users away from login/signup
export const PublicOnlyRoute = ({ children }) => {
  if (isAuthenticated()) {
    const role = getUserRole();
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};
