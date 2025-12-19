// src/pages/settings/ForgotPassword.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiMail,
  FiArrowLeft,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import api from "../../api/apiClient";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (!touched) setTouched(true);
    if (error) setError("");
  };

  const handleBlur = () => {
    if (!touched) setTouched(true);
    const validationError = validateEmail(email);
    if (validationError) setError(validationError);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (response?.success) {
        setEmailSent(true);
        toast.success("Password reset email sent. Please check your inbox.", {
          toastId: "forgot-success",
        });
      } else {
        throw new Error(
          response?.message || "Unable to send reset email. Please try again."
        );
      }
    } catch (err) {
      const errorMsg =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to send reset email. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg, { toastId: "forgot-error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setTouched(false);
    setError("");
  };

  // ===========================
  // SUCCESS STATE
  // ===========================
  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
        <section className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl shadow-blue-900/40 p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center">
              <FiCheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-2">
              Email sent
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              A password reset link has been sent to{" "}
              <span className="font-semibold text-slate-50 break-all">
                {email}
              </span>
              . It may take a minute to arrive.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">
              What happens next
            </h2>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="font-semibold text-slate-400">1.</span>
                <span>Open the email we just sent to you.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-slate-400">2.</span>
                <span>Click on the secure reset link.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-slate-400">3.</span>
                <span>Choose a new strong password and confirm.</span>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleResend}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-slate-50 font-semibold py-3 text-sm shadow-lg shadow-blue-900/40 transition-transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <FiSend className="w-4 h-4" />
              <span>Send reset link again</span>
            </button>

            <Link
              to="/login"
              className="block text-center text-sm font-semibold text-blue-300 hover:text-blue-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg py-2"
            >
              Back to login
            </Link>
          </div>

          <p className="mt-6 text-[11px] text-center text-slate-400">
            Not seeing the email? Check your spam folder or{" "}
            <Link
              to="/support"
              className="font-semibold text-blue-300 hover:text-blue-200 hover:underline"
            >
              contact support
            </Link>
            .
          </p>
        </section>
      </main>
    );
  }

  // ===========================
  // FORM STATE
  // ===========================
  const showInlineError = (touched && !!error) || !!error;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 relative overflow-hidden">
      {/* Soft blobs background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 w-72 h-72 bg-blue-500/40 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute -bottom-40 -left-28 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl opacity-40 animate-pulse [animation-delay:1500ms]" />
      </div>

      <section className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl shadow-blue-900/40 p-8">
        {/* Back */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg px-1 py-1"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to login</span>
        </Link>

        {/* Header */}
        <header className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-xl shadow-blue-900/40">
            <FiMail className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-2">
            Forgot password?
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            Enter the email associated with your account. A secure reset link
            will be sent if the account exists.
          </p>
        </header>

        {/* Error banner */}
        {showInlineError && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
            <FiAlertCircle
              className="mt-0.5 h-5 w-5 text-red-400"
              aria-hidden="true"
            />
            <p className="text-xs sm:text-sm font-medium text-red-200">
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-300"
            >
              Email address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <FiMail className="h-4 w-4 text-slate-500" aria-hidden="true" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                placeholder="you@example.com"
                className={`w-full rounded-xl border bg-slate-900/80 py-3 pl-10 pr-3 text-sm text-slate-50 shadow-inner outline-none transition
                  placeholder:text-slate-500
                  focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                  disabled:cursor-not-allowed disabled:opacity-60
                  ${
                    showInlineError
                      ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                      : "border-slate-700 hover:border-slate-500"
                  }`}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              You will receive a one‑time secure link to reset your password.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3 text-sm font-semibold text-slate-50 shadow-lg shadow-blue-900/40 transition-transform hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {loading ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Sending reset link...</span>
              </>
            ) : (
              <>
                <FiSend className="h-4 w-4" aria-hidden="true" />
                <span>Send reset link</span>
              </>
            )}
          </button>
        </form>

        <footer className="mt-6 text-center text-xs text-slate-400">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-300 hover:text-blue-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg px-1"
          >
            Log in
          </Link>
        </footer>
      </section>
    </main>
  );
};

export default ForgotPassword;
