/**
 * ================================================================
 * 🔑 FORGOT PASSWORD PAGE
 * ================================================================
 * Request password reset email
 * ================================================================
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiMail,
  FiArrowLeft,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import apiClient from "../../api/apiClient";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address";
    }
    return null;
  };

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        setEmailSent(true);
        toast.success("Password reset email sent! Check your inbox.");
      } else {
        throw new Error(response.message || "Failed to send reset email");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to send reset email";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER SUCCESS STATE
  // ============================================================

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              Email Sent!
            </h1>
            <p className="text-gray-600 leading-relaxed">
              We've sent a password reset link to{" "}
              <span className="font-bold text-gray-900">{email}</span>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
            <h3 className="font-black text-blue-900 mb-2">Next Steps:</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Check your email inbox for the reset link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Click the link to reset your password</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Create a new strong password</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setEmailSent(false)}
              className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all"
            >
              Resend Email
            </button>
            <Link
              to="/login"
              className="block text-center py-3 text-blue-600 font-bold hover:underline"
            >
              Back to Login
            </Link>
          </div>

          {/* Support */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Didn't receive the email? Check your spam folder or{" "}
            <Link
              to="/support"
              className="text-blue-600 font-bold hover:underline"
            >
              contact support
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER FORM
  // ============================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
        {/* Back Button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold mb-6 group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl">
            <FiMail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 leading-relaxed">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={loading}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all text-base ${
                  error
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
                autoFocus
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <FiSend className="w-5 h-5" />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-gray-600">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-black text-blue-600 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
