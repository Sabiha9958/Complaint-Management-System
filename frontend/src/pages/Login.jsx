// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { TokenManager, UserManager } from "../utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

// Role-based routing
const getHomeRoute = (role = "user") => {
  const routes = {
    admin: "/admin",
    staff: "/staff",
    user: "/",
  };
  return routes[role?.toLowerCase()] || "/";
};

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, updateUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomeRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Handle successful authentication (common logic)
  const handleAuthSuccess = (userData, accessToken, refreshToken) => {
    // Store tokens and user data
    TokenManager.set(accessToken);
    if (refreshToken) TokenManager.setRefresh(refreshToken);
    UserManager.set(userData);
    updateUser(userData);

    toast.success(`Welcome, ${userData.name}!`, {
      autoClose: 2000,
      hideProgressBar: false,
    });

    // Reload the page to clear any OAuth-related warnings and ensure clean state
    setTimeout(() => {
      window.location.href = getHomeRoute(userData.role);
    }, 500);
  };

  // Google OAuth handler with popup flow
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setServerError("");

      try {
        // Get user info from Google
        const { data: googleUser } = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );

        // Send to backend
        const { data } = await axios.post(`${API_URL}/api/auth/google`, {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.sub,
        });

        if (!data.success) {
          throw new Error(data.message || "Google authentication failed");
        }

        // Extract tokens and user data
        const accessToken = data.accessToken || data.token;
        const refreshToken = data.refreshToken;
        const userData = data.user || data.data;

        if (!accessToken || !userData) {
          throw new Error("Invalid response from server");
        }

        // Handle successful authentication
        handleAuthSuccess(userData, accessToken, refreshToken);
      } catch (err) {
        console.error("Google login error:", err);
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Google sign-in failed. Please try again.";
        setServerError(errorMessage);
        toast.error(errorMessage);
        setIsGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
      const errorMsg =
        error?.error_description || "Google sign-in was cancelled or failed";
      setServerError(errorMsg);
      toast.error(errorMsg);
      setIsGoogleLoading(false);
    },
    flow: "implicit", // Use implicit flow for better popup compatibility
  });

  // Email/password login handler
  const onSubmit = async (formData) => {
    setServerError("");

    try {
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        setServerError(result.message || "Login failed");
        toast.error(result.message || "Login failed");
        return;
      }

      // Handle successful authentication
      handleAuthSuccess(
        result.user,
        result.accessToken || result.token,
        result.refreshToken
      );
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred";
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const isLoading = isSubmitting || isGoogleLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <FiLock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-sm text-red-800">{serverError}</p>
              </div>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <>
                <FiLoader className="h-5 w-5 animate-spin text-gray-600" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <FcGoogle className="h-5 w-5" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-xs font-medium text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
                    errors.email
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <FiAlertCircle className="h-3.5 w-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className={`block w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
                    errors.password
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <FiAlertCircle className="h-3.5 w-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="mt-4 text-center text-xs text-gray-500">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="text-blue-600 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
