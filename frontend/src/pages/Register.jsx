// src/pages/Register.jsx
// Registration with email and Google + auto-login

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../context/AuthContext";
import { TokenManager, UserManager } from "../utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// get home route by role
const getHomeRoute = (role = "user") => {
  const routes = {
    admin: "/admin",
    staff: "/staff",
    user: "/",
  };
  return routes[role?.toLowerCase()] || "/";
};

// inline error alert
const ErrorAlert = ({ message, onDismiss }) =>
  !message ? null : (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
      <div className="flex items-start gap-2">
        <FiAlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
        <p className="flex-1 text-red-800">{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );

// small divider
const Divider = ({ text }) => (
  <div className="my-5 flex items-center gap-3">
    <div className="h-px flex-1 bg-gray-200" />
    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
      {text}
    </span>
    <div className="h-px flex-1 bg-gray-200" />
  </div>
);

// field wrapper
const FormField = ({ label, error, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600">
        <FiAlertCircle className="h-3.5 w-3.5" />
        {error}
      </p>
    )}
  </div>
);

// simple password strength indicator
const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const calc = (pwd) => {
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 10) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^a-zA-Z\d]/.test(pwd)) s++;
    if (s <= 2) return { level: s, label: "Weak", color: "bg-red-500" };
    if (s <= 3) return { level: s, label: "Medium", color: "bg-yellow-500" };
    return { level: s, label: "Strong", color: "bg-green-500" };
  };

  const strength = calc(password);

  return (
    <div className="mt-1">
      <div className="mb-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((lv) => (
          <div
            key={lv}
            className={`h-1 flex-1 rounded-full ${
              lv <= strength.level ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${
          strength.color.replace("bg-", "text-") || "text-gray-500"
        }`}
      >
        Password strength: {strength.label}
      </p>
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const {
    register: registerUser,
    isAuthenticated,
    user,
    updateUser,
  } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isLoading = isSubmitting || isGoogleLoading;

  // redirect authenticated user
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomeRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // field validation
  const validateField = (name, value) => {
    const fieldErrors = {};
    const val = value?.trim?.() ?? value;

    if (name === "name") {
      if (!val) fieldErrors.name = "Full name is required";
      else if (val.length < 2)
        fieldErrors.name = "Name must be at least 2 characters";
    }

    if (name === "email") {
      if (!val) fieldErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
        fieldErrors.email = "Please enter a valid email";
    }

    if (name === "phone") {
      if (!val) fieldErrors.phone = "Phone number is required";
      else if (!/^[0-9]{10}$/.test(val))
        fieldErrors.phone = "Phone must be exactly 10 digits";
    }

    if (name === "password") {
      if (!value) fieldErrors.password = "Password is required";
      else if (value.length < 6)
        fieldErrors.password = "Password must be at least 6 characters";
    }

    if (name === "confirmPassword") {
      if (!value) fieldErrors.confirmPassword = "Please confirm your password";
      else if (value !== formData.password)
        fieldErrors.confirmPassword = "Passwords do not match";
    }

    return fieldErrors;
  };

  // full form validation
  const validateForm = () => {
    const allErrors = {};
    Object.keys(formData).forEach((field) => {
      Object.assign(allErrors, validateField(field, formData[field]));
    });
    if (!agreedToTerms) {
      allErrors.terms = "You must agree to the terms and conditions";
    }
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  // on change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // on blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldErrors = validateField(name, value);
    if (Object.keys(fieldErrors).length) {
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
    }
  };

  // shared success handler
  const handleAuthSuccess = (userData, accessToken, refreshToken) => {
    if (!userData || !accessToken) {
      setServerError("Invalid server response");
      toast.error("Invalid server response");
      return;
    }

    TokenManager.set(accessToken);
    if (refreshToken) TokenManager.setRefresh(refreshToken);
    UserManager.set(userData);
    if (updateUser) updateUser(userData);

    toast.success(`Welcome, ${userData.name || "User"}!`, {
      autoClose: 1500,
    });

    setTimeout(() => {
      window.location.href = getHomeRoute(userData.role);
    }, 400);
  };

  // Google sign-up
  const googleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setServerError("");

      try {
        const { data: googleUser } = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        ); // [web:19][web:21]

        const { data } = await axios.post(`${API_URL}/api/auth/google`, {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.sub,
          token: tokenResponse.access_token,
        }); // [web:19][web:20]

        if (!data?.success) {
          throw new Error(data?.message || "Google registration failed");
        }

        const accessToken = data.accessToken || data.token;
        const refreshToken = data.refreshToken;
        const userData = data.user || data.data;

        handleAuthSuccess(userData, accessToken, refreshToken);
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Google sign-up failed";
        setServerError(msg);
        toast.error(msg);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (error) => {
      const msg =
        error?.error_description || "Google sign-up was cancelled or failed";
      toast.error(msg);
      setServerError(msg);
      setIsGoogleLoading(false);
    },
    flow: "implicit",
  }); // [web:19][web:29]

  // email registration submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      toast.error("Please fix errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: "user",
      };

      const result = await registerUser(payload);

      if (result?.success && result.user) {
        handleAuthSuccess(
          result.user,
          result.accessToken || result.token,
          result.refreshToken
        );
      } else {
        const msg = result?.message || "Registration failed";
        setServerError(msg);
        toast.error(msg);

        if (Array.isArray(result?.errors)) {
          const backendErrors = {};
          result.errors.forEach((err) => {
            const field = err.path || err.param;
            if (field) backendErrors[field] = err.msg || err.message;
          });
          setErrors((prev) => ({ ...prev, ...backendErrors }));
        }
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5">
        {/* heading */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <FiUser className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-600">Join ComplaintMS today</p>
        </div>

        {/* server error */}
        <ErrorAlert
          message={serverError}
          onDismiss={() => setServerError("")}
        />

        {/* Google button */}
        <button
          type="button"
          onClick={() => googleRegister()}
          disabled={isLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <>
              <FiLoader className="h-5 w-5 animate-spin text-gray-600" />
              <span>Signing up with Google...</span>
            </>
          ) : (
            <>
              <FcGoogle className="h-5 w-5" />
              <span>Sign up with Google</span>
            </>
          )}
        </button>

        <Divider text="Or sign up with email" />

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* name */}
          <FormField label="Full name" error={errors.name} required>
            <div className="relative">
              <FiUser className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                disabled={isLoading}
                className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                  errors.name
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
            </div>
          </FormField>

          {/* email */}
          <FormField label="Email address" error={errors.email} required>
            <div className="relative">
              <FiMail className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
                disabled={isLoading}
                className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                  errors.email
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
            </div>
          </FormField>

          {/* phone */}
          <FormField label="Phone number" error={errors.phone} required>
            <div className="relative">
              <FiPhone className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  if (
                    e.target.value === "" ||
                    /^[0-9]+$/.test(e.target.value)
                  ) {
                    handleChange(e);
                  }
                }}
                onBlur={handleBlur}
                placeholder="9876543210"
                maxLength={10}
                disabled={isLoading}
                className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                  errors.phone
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
            </div>
          </FormField>

          {/* password */}
          <FormField label="Password" error={errors.password} required>
            <div className="relative">
              <FiLock className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                  errors.password
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
                className="absolute inset-y-0 right-3 my-auto text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
            <PasswordStrength password={formData.password} />
          </FormField>

          {/* confirm password */}
          <FormField
            label="Confirm password"
            error={errors.confirmPassword}
            required
          >
            <div className="relative">
              <FiLock className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                  errors.confirmPassword
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                disabled={isLoading}
                className="absolute inset-y-0 right-3 my-auto text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {showConfirmPassword ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </FormField>

          {/* terms */}
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (errors.terms) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.terms;
                      return next;
                    });
                  }
                }}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-xs text-gray-700">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <FiAlertCircle className="h-3.5 w-3.5" />
                {errors.terms}
              </p>
            )}
          </div>

          {/* submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </form>

        {/* footer */}
        <p className="mt-5 text-center text-xs text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
