/**
 * ================================================================
 * 📝 REGISTRATION PAGE - Email/Google signup + auto-login
 * ================================================================
 */

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

// ================================================================
// HELPERS
// ================================================================

const getHomeRoute = (role = "user") => {
  const routes = {
    admin: "/admin/dashboard",
    staff: "/staff/dashboard",
    user: "/",
  };
  return routes[role] || "/";
};

// ================================================================
// SUB-COMPONENTS
// ================================================================

const ErrorAlert = ({ message, onDismiss }) => (
  <div
    role="alert"
    className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl shadow-sm"
  >
    <div className="flex items-start gap-3">
      <div className="p-2 bg-red-100 rounded-xl">
        <FiAlertCircle className="w-5 h-5 text-red-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-black text-red-900 mb-1">
          Registration Failed
        </p>
        <p className="text-sm text-red-700 leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-red-100 rounded-lg transition-colors"
        >
          ×
        </button>
      )}
    </div>
  </div>
);

const Divider = ({ text }) => (
  <div className="relative my-8">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t-2 border-gray-200" />
    </div>
    <div className="relative flex justify-center">
      <span className="px-4 bg-white text-xs font-black text-gray-500 uppercase tracking-widest">
        {text}
      </span>
    </div>
  </div>
);

const FormField = ({ label, error, required, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-black text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-sm text-red-600 font-bold flex items-center gap-2">
        <FiAlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: "" };

    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;

    if (strength <= 2)
      return { level: strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 3)
      return { level: strength, label: "Medium", color: "bg-yellow-500" };
    return { level: strength, label: "Strong", color: "bg-green-500" };
  };

  const strength = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full ${
              level <= strength.level ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-semibold ${strength.color.replace(
          "bg-",
          "text-"
        )}`}
      >
        Password strength: {strength.label}
      </p>
    </div>
  );
};

// ================================================================
// MAIN COMPONENT
// ================================================================

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, user } = useAuth();

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

  // Redirect already logged in users to their home
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomeRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateField = (name, value) => {
    const fieldErrors = {};

    switch (name) {
      case "name":
        if (!value.trim()) {
          fieldErrors.name = "Full name is required";
        } else if (value.trim().length < 2) {
          fieldErrors.name = "Name must be at least 2 characters";
        }
        break;

      case "email":
        if (!value.trim()) {
          fieldErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          fieldErrors.email = "Please enter a valid email address";
        }
        break;

      case "phone":
        if (!value.trim()) {
          fieldErrors.phone = "Phone number is required";
        } else if (!/^[0-9]{10}$/.test(value.trim())) {
          fieldErrors.phone = "Phone must be exactly 10 digits";
        }
        break;

      case "password":
        if (!value) {
          fieldErrors.password = "Password is required";
        } else if (value.length < 6) {
          fieldErrors.password = "Password must be at least 6 characters";
        }
        break;

      case "confirmPassword":
        if (!value) {
          fieldErrors.confirmPassword = "Please confirm your password";
        } else if (value !== formData.password) {
          fieldErrors.confirmPassword = "Passwords do not match";
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

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

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldErrors = validateField(name, value);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
    }
  };

  // ============================================================
  // GOOGLE REGISTRATION (same flow as Google login)
  // ============================================================

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
        );

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await axios.post(`${API_URL}/api/auth/google`, {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.sub,
          token: tokenResponse.access_token,
        });

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Google registration failed"
          );
        }

        const {
          accessToken = response.data.token,
          refreshToken,
          user: userData,
        } = response.data;

        if (accessToken) TokenManager.set(accessToken);
        if (refreshToken) TokenManager.setRefresh(refreshToken);
        if (userData) UserManager.set(userData);

        toast.success(`Welcome, ${userData.name}! 🎉`, {
          toastId: "google-register-success",
        });

        const home = getHomeRoute(userData.role);
        window.location.href = home;
      } catch (error) {
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Google sign-up failed";
        setServerError(errorMsg);
        toast.error(errorMsg, { toastId: "google-register-error" });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      toast.error("Google sign-up was cancelled", {
        toastId: "google-register-cancelled",
      });
      setIsGoogleLoading(false);
    },
    flow: "implicit",
  });

  // ============================================================
  // EMAIL REGISTRATION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      toast.error("Please fix all errors before submitting", {
        toastId: "register-validation-error",
      });
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

      if (result.success && result.user) {
        toast.success("Account created successfully! 🎉", {
          toastId: "register-success",
        });

        const home = getHomeRoute(result.user.role);
        navigate(home, { replace: true });
      } else {
        const errorMessage = result.message || "Registration failed";
        setServerError(errorMessage);
        toast.error(errorMessage, { toastId: "register-error" });

        if (Array.isArray(result.errors)) {
          const backendErrors = {};
          result.errors.forEach((err) => {
            const field = err.path || err.param;
            if (field) {
              backendErrors[field] = err.msg || err.message;
            }
          });
          setErrors((prev) => ({ ...prev, ...backendErrors }));
        }
      }
    } catch (error) {
      const errorMsg = "An unexpected error occurred";
      setServerError(errorMsg);
      toast.error(errorMsg, { toastId: "register-unexpected-error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl">
            <FiUser className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-gray-600 font-medium">Join ComplaintMS today</p>
        </div>

        {serverError && (
          <ErrorAlert
            message={serverError}
            onDismiss={() => setServerError("")}
          />
        )}

        <button
          type="button"
          onClick={() => googleRegister()}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-2xl font-black text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all mb-6"
        >
          {isGoogleLoading ? (
            <>
              <FiLoader className="w-6 h-6 animate-spin text-blue-600" />
              <span>Signing up...</span>
            </>
          ) : (
            <>
              <FcGoogle className="w-6 h-6" />
              <span>Sign up with Google</span>
            </>
          )}
        </button>

        <Divider text="Or sign up with email" />

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField label="Full Name" error={errors.name} required>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                disabled={isLoading}
                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                  errors.name
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
            </div>
          </FormField>

          <FormField label="Email Address" error={errors.email} required>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
                disabled={isLoading}
                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                  errors.email
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
            </div>
          </FormField>

          <FormField label="Phone Number" error={errors.phone} required>
            <div className="relative">
              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                  errors.phone
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
            </div>
          </FormField>

          <FormField label="Password" error={errors.password} required>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full pl-12 pr-14 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                  errors.password
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPassword ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
            <PasswordStrength password={formData.password} />
          </FormField>

          <FormField
            label="Confirm Password"
            error={errors.confirmPassword}
            required
          >
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full pl-12 pr-14 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                  errors.confirmPassword
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </FormField>

          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (errors.terms) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.terms;
                    return newErrors;
                  });
                }
              }}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              I agree to the{" "}
              <Link
                to="/terms"
                className="text-blue-600 font-bold hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-blue-600 font-bold hover:underline"
              >
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-600 font-bold flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4" />
              {errors.terms}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <FiLoader className="w-5 h-5 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-700">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-black text-blue-600 hover:underline"
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
