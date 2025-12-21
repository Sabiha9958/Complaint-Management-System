import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Activity, AlertCircle } from "lucide-react";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import ForgotPasswordPage from "./pages/settings/ForgotPassword";
import ResetPasswordPage from "./pages/settings/ResetPassword";

import ProfilePage from "./pages/settings/ProfilePage";
import SettingsPage from "./pages/Settings";
import Complaints from "./pages/Complaint";
import Admin from "./pages/Admin";

import FAQ from "./pages/Docs/FAQ";
import About from "./pages/Docs/About";
import PrivacyPolicy from "./pages/Docs/PrivacyPolicy";
import TermsOfService from "./pages/Docs/TermsOfService";
import CookiePolicy from "./pages/Docs/CookiePolicy";
import Accessibility from "./pages/Docs/Accessibility";
import PublicDashboard from "./pages/Docs/PublicDashboard";

// UX helpers
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

const LoadingSpinner = () => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-white/80 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-xl">
      <div className="relative mx-auto mb-5 h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <Activity
          className="absolute inset-0 m-auto text-indigo-600"
          size={26}
        />
      </div>
      <h2 className="text-lg font-extrabold text-slate-900">Loading</h2>
      <p className="mt-1 text-sm text-slate-600">Preparing your workspace…</p>
    </div>
  </div>
);

const AccessDenied = ({ message }) => (
  <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-50 ring-1 ring-red-100">
        <AlertCircle className="h-7 w-7 text-red-600" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900">Access denied</h2>
      <p className="mt-2 text-slate-600">
        {message || "You don't have permission to access this page."}
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
      >
        Go to Home
      </a>
    </div>
  </div>
);

const useDelayedSpinner = (loading, delay = 250) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return show;
};

// Route guards
const RequireAuth = ({ allowedRoles }) => {
  const { user, loading, isInitialized } = useAuth();
  const location = useLocation();

  const checking = loading || !isInitialized;
  const showSpinner = useDelayedSpinner(checking);

  if (checking && showSpinner) return <LoadingSpinner />;

  if (!user && isInitialized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return (
      <AccessDenied message="You don't have permission to access this area." />
    );
  }

  return <Outlet />;
};

const RequireGuest = () => {
  const { user, loading, isInitialized } = useAuth();
  const location = useLocation();

  const checking = loading || !isInitialized;
  const showSpinner = useDelayedSpinner(checking);

  if (checking && showSpinner) return <LoadingSpinner />;

  if (user && isInitialized) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};

// Layout
const MainLayout = () => (
  <div className="flex min-h-screen flex-col bg-slate-50">
    <ScrollToTop />

    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-extrabold focus:text-white"
    >
      Skip to content
    </a>

    <Navbar />

    <main id="main-content" className="flex-1">
      <Outlet />
    </main>

    <Footer />

    {/* Toast container should be inside layout, not inside <Routes> children */}
    <ToastContainer />
  </div>
);

function App() {
  const docsRoutes = useMemo(
    () => [
      { path: "/help", element: <PublicDashboard /> },
      { path: "/faq", element: <FAQ /> },
      { path: "/about", element: <About /> },
      { path: "/privacy-policy", element: <PrivacyPolicy /> },
      { path: "/terms-of-service", element: <TermsOfService /> },
      { path: "/cookie-policy", element: <CookiePolicy /> },
      { path: "/accessibility", element: <Accessibility /> },
    ],
    []
  );

  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public pages */}
        <Route path="/" element={<Home />} />

        {docsRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}

        {/* Public auth utility pages */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Guest-only routes */}
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Auth-required routes */}
        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/complaints/*" element={<Complaints />} />
        </Route>

        {/* Role-protected routes */}
        <Route element={<RequireAuth allowedRoles={["admin", "staff"]} />}>
          <Route path="/admin/*" element={<Admin />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
