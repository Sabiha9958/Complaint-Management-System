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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required").min(6),
});

const getHomeRoute = (role = "user") => {
  const routes = {
    admin: "/admin/dashboard",
    staff: "/staff/dashboard",
    user: "/",
  };
  return routes[role.toLowerCase()] || "/";
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

  // redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomeRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // -------- GOOGLE LOGIN --------
  const handleGoogleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setServerError("");

      try {
        // 1) get Google profile
        const { data: googleUser } = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        // 2) send to backend
        const { data } = await axios.post(`${API_URL}/api/auth/google`, {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.sub,
          token: tokenResponse.access_token,
        });

        if (!data.success) {
          throw new Error(data.message || "Google login failed");
        }

        const accessToken = data.accessToken || data.token;
        const refreshToken = data.refreshToken;
        const userData = data.user || data.data;

        if (!accessToken || !userData) {
          throw new Error("Invalid response from server");
        }

        // 3) persist + update context
        TokenManager.set(accessToken);
        if (refreshToken) TokenManager.setRefresh(refreshToken);
        UserManager.set(userData);
        updateUser(userData);

        toast.success(`Welcome back, ${userData.name}!`, {
          toastId: "google-login-success",
        });

        navigate(getHomeRoute(userData.role), { replace: true });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Google sign-in failed. Please try again.";
        setServerError(msg);
        toast.error(msg, { toastId: "google-login-error" });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.error("Google OAuth error:", err);
      toast.error("Google sign-in was cancelled or failed", {
        toastId: "google-cancelled",
      });
      setIsGoogleLoading(false);
    },
  });

  // -------- EMAIL/PASSWORD LOGIN --------
  const onSubmit = async (formData) => {
    setServerError("");
    const result = await login(formData.email, formData.password);

    if (!result.success) {
      const msg = result.message || "Login failed";
      setServerError(msg);
      return;
    }

    const homeRoute = getHomeRoute(result.user?.role);
    navigate(homeRoute, { replace: true });
  };

  const isLoading = isSubmitting || isGoogleLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiLock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to continue</p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">
                  {serverError}
                </p>
              </div>
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
          >
            {isGoogleLoading ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <FcGoogle className="w-6 h-6" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500 bg-white"
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500 bg-white"
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Signup link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6 px-4">
          By signing in, you agree to our{" "}
          <Link
            to="/terms"
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
