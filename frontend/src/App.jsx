// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Activity, AlertCircle } from "lucide-react";

// === Public Pages ===
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/settings/ForgotPassword";
import ResetPassword from "./pages/settings/ResetPassword";

// === User Pages ===
import ProfilePage from "./pages/settings/ProfilePage";
import SettingsPage from "./pages/Settings";
import Complaints from "./pages/Complaints";

// === Admin Pages ===
import Admin from "./pages/Admin";

// === Layout Components ===
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

/* ================================================================
   🎨 UTILITY COMPONENTS
   ================================================================ */

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

const LoadingSpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <div className="text-center">
      <div className="relative mx-auto mb-6 h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <Activity
          className="absolute inset-0 m-auto text-indigo-600"
          size={32}
        />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-900 animate-pulse">
        Loading...
      </h2>
      <p className="text-sm text-gray-600">Please wait a moment</p>
    </div>
  </div>
);

const ErrorBoundary = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-6">
        {error || "You don't have permission to access this page."}
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Go to Home
      </a>
    </div>
  </div>
);

/* ================================================================
   📐 LAYOUT COMPONENTS
   ================================================================ */

const MainLayout = () => (
  <div className="flex min-h-screen flex-col bg-gray-50">
    <ScrollToTop />
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

/* ================================================================
   🎣 CUSTOM HOOKS
   ================================================================ */

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

/* ================================================================
   🔒 ROUTE GUARDS
   ================================================================ */

/**
 * ProtectedRoute - Wraps routes that require authentication
 * @param {ReactNode} children - Child components
 * @param {Array} allowedRoles - Array of allowed user roles
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isInitialized } = useAuth();
  const location = useLocation();
  const checkingAuth = loading || !isInitialized;
  const showSpinner = useDelayedSpinner(checkingAuth);

  // Show loading spinner while checking authentication
  if (checkingAuth && showSpinner) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user && isInitialized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <ErrorBoundary error="You don't have permission to access this area." />
    );
  }

  return children;
};

/**
 * PublicRoute - Wraps routes that should only be accessible when NOT logged in
 * @param {ReactNode} children - Child components
 */
const PublicRoute = ({ children }) => {
  const { user, loading, isInitialized } = useAuth();
  const location = useLocation();
  const checkingAuth = loading || !isInitialized;
  const showSpinner = useDelayedSpinner(checkingAuth);

  if (checkingAuth && showSpinner) {
    return <LoadingSpinner />;
  }

  // Redirect authenticated users away from auth pages
  if (user && isInitialized) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return children;
};

/* ================================================================
   🚀 MAIN APPLICATION
   ================================================================ */

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route path="/" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ==================== AUTH ROUTES ==================== */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* ==================== USER ROUTES ==================== */}
        {/* Profile - View only, public info */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Settings - Edit user info, private settings */}
        <Route
          path="/settings/*"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Complaints Management */}
        <Route
          path="/complaints/*"
          element={
            <ProtectedRoute>
              <Complaints />
            </ProtectedRoute>
          }
        />

        {/* ==================== ADMIN ROUTES ==================== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* ==================== FALLBACK ==================== */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
