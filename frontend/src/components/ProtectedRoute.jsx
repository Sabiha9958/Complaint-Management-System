// src/routes/ProtectedRoute.jsx

import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <div className="text-center">
      <div className="relative mx-auto mb-6 h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <div className="absolute inset-2 rounded-full border-4 border-indigo-200" />
        <div
          className="absolute inset-2 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"
          style={{ animationDirection: "reverse", animationDuration: "1s" }}
        />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-900 animate-pulse">
        Loading...
      </h2>
      <p className="text-sm text-gray-600">Verifying authentication</p>
    </div>
  </div>
);

// Delayed Spinner Hook
const useDelayedSpinner = (loading, delay = 300) => {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowSpinner(false);
      return;
    }
    const timer = setTimeout(() => setShowSpinner(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return showSpinner;
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isInitialized } = useAuth();
  const location = useLocation();

  const checkingAuth = loading || !isInitialized;
  const showSpinner = useDelayedSpinner(checkingAuth);

  // Show spinner while initializing auth
  if (checkingAuth && showSpinner) {
    return <LoadingSpinner />;
  }

  // Not logged in → redirect to login
  if (!user && isInitialized) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role check when allowedRoles provided
  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" state={{ error: "Access denied" }} replace />;
  }

  return children;
};

export default ProtectedRoute;
