// ================================================================
// 🚀 APPLICATION ENTRY POINT
// ================================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

// ================================================================
// 🔧 ENVIRONMENT CONFIGURATION
// ================================================================

const ENV = {
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  API_URL: import.meta.env.VITE_API_URL,
  IS_DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
};

/**
 * Validate required environment variables
 * Only runs in development mode
 */
const validateEnvironment = () => {
  const requiredVars = {
    VITE_GOOGLE_CLIENT_ID: ENV.GOOGLE_CLIENT_ID,
    VITE_API_URL: ENV.API_URL,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0 && ENV.IS_DEV) {
    // ✅ Removed console.error
    alert(
      `⚠️ Configuration Error\n\n` +
        `Missing environment variables:\n${missing.join("\n")}\n\n` +
        `Please check your .env file and restart the dev server.`
    );
  }
};

// Run validation
validateEnvironment();

// ================================================================
// 🎨 TOAST NOTIFICATION CONFIGURATION
// ================================================================

const TOAST_CONFIG = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "colored",
};

// ================================================================
// 🚀 RENDER APPLICATION
// ================================================================

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Failed to find root element. Make sure your HTML has a div with id='root'"
  );
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID || ""}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <App />
        <ToastContainer {...TOAST_CONFIG} />
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
