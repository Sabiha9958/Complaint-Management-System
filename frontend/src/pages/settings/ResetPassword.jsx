// src/pages/settings/ResetPassword.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiArrowLeft,
} from "react-icons/fi";
import apiClient from "../../api/apiClient";

// -----------------------------
// Password helpers (UI + rules)
// -----------------------------
const getPasswordRules = (pwd = "") => {
  const value = String(pwd);

  // Keep rules realistic and user-friendly.
  const rules = {
    minLength: value.length >= 8,
    hasLower: /[a-z]/.test(value),
    hasUpper: /[A-Z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSpecial: /[^a-zA-Z0-9]/.test(value),
    noSpaces: !/\s/.test(value),
  };

  const score = Object.values(rules).filter(Boolean).length; // 0..6

  let label = "Very weak";
  let barClass = "bg-red-500";
  if (score >= 5) {
    label = "Strong";
    barClass = "bg-emerald-400";
  } else if (score >= 4) {
    label = "Good";
    barClass = "bg-yellow-400";
  } else if (score >= 2) {
    label = "Weak";
    barClass = "bg-orange-400";
  }

  return { rules, score, max: 6, label, barClass };
};

const RuleItem = ({ ok, children }) => {
  return (
    <li className="flex items-start gap-2 text-xs text-slate-300">
      <span
        className={`mt-0.5 inline-block h-2 w-2 rounded-full ${
          ok ? "bg-emerald-400" : "bg-slate-600"
        }`}
        aria-hidden="true"
      />
      <span className={ok ? "text-slate-100" : ""}>{children}</span>
    </li>
  );
};

const PasswordStrength = ({ password }) => {
  const meta = useMemo(() => getPasswordRules(password), [password]);

  if (!password) return null;

  const pct = Math.round((meta.score / meta.max) * 100);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] text-slate-400">Strength</p>
        <p className="text-[11px] font-semibold text-slate-200">
          {meta.label} ({pct}%)
        </p>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700">
        <div
          className={`h-full ${meta.barClass} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
        <RuleItem ok={meta.rules.minLength}>At least 8 characters</RuleItem>
        <RuleItem ok={meta.rules.noSpaces}>No spaces</RuleItem>
        <RuleItem ok={meta.rules.hasUpper}>Uppercase letter (A–Z)</RuleItem>
        <RuleItem ok={meta.rules.hasLower}>Lowercase letter (a–z)</RuleItem>
        <RuleItem ok={meta.rules.hasNumber}>A number (0–9)</RuleItem>
        <RuleItem ok={meta.rules.hasSpecial}>A special character</RuleItem>
      </ul>
    </div>
  );
};

// -----------------------------
// Component
// -----------------------------
const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const tokenPresent = Boolean(token);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [errorBanner, setErrorBanner] = useState("");
  const [loading, setLoading] = useState(false);

  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!tokenPresent) {
      setTokenValid(false);
      toast.error("Invalid or missing reset token", { toastId: "reset-token" });
      return;
    }
    // Focus improves UX on arrival.
    firstInputRef.current?.focus();
  }, [tokenPresent]);

  const passwordMeta = useMemo(() => getPasswordRules(password), [password]);

  const inlineErrors = useMemo(() => {
    const e = {};

    if (touched.password) {
      if (!password) e.password = "New password is required.";
      else if (password.length < 8) e.password = "Use at least 8 characters.";
      else if (!passwordMeta.rules.noSpaces)
        e.password = "Password cannot include spaces.";
    }

    if (touched.confirm) {
      if (!confirmPassword) e.confirm = "Please confirm your new password.";
      else if (confirmPassword !== password)
        e.confirm = "Passwords do not match.";
    }

    return e;
  }, [password, confirmPassword, touched, passwordMeta.rules.noSpaces]);

  const canSubmit = useMemo(() => {
    if (!tokenPresent || !tokenValid) return false;
    if (!password || !confirmPassword) return false;
    if (confirmPassword !== password) return false;

    // Require a baseline quality: 4/6 rules is a good balance for UX/security.
    // Adjust based on your backend policy.
    if (passwordMeta.score < 4) return false;

    return true;
  }, [tokenPresent, tokenValid, password, confirmPassword, passwordMeta.score]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ password: true, confirm: true });
    setErrorBanner("");

    if (!tokenPresent) {
      setTokenValid(false);
      setErrorBanner("Invalid or missing reset token.");
      return;
    }

    if (!canSubmit) {
      toast.error("Please fix the highlighted issues.", {
        toastId: "reset-fix",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/reset-password", {
        token,
        password: password,
      });

      if (res?.success) {
        setResetSuccess(true);
        toast.success("Password reset successfully. Please log in.", {
          toastId: "reset-ok",
        });
      } else {
        throw new Error(res?.message || "Password reset failed.");
      }
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to reset password.";

      setErrorBanner(msg);

      // If server tells token invalid/expired, show invalid state.
      const lowered = String(msg).toLowerCase();
      if (lowered.includes("expired") || lowered.includes("invalid")) {
        setTokenValid(false);
      }

      toast.error(msg, { toastId: "reset-err" });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Success state
  // -----------------------------
  if (resetSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
        <section className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl shadow-blue-900/40 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center">
            <FiCheckCircle className="w-10 h-10 text-emerald-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-2">
            Password updated
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Your password has been changed successfully. You can now log in with
            your new password.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-slate-50 font-semibold py-3 text-sm shadow-lg shadow-blue-900/40 transition-transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Go to login
          </button>
        </section>
      </main>
    );
  }

  // -----------------------------
  // Invalid token state
  // -----------------------------
  if (!tokenValid) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
        <section className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl shadow-blue-900/40 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-400/40 flex items-center justify-center">
            <FiAlertCircle className="w-10 h-10 text-red-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-2">
            Link expired or invalid
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            This reset link is no longer valid. Please request a new password
            reset email.
          </p>

          <Link
            to="/forgot-password"
            className="block w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-slate-50 font-semibold py-3 text-sm shadow-lg shadow-blue-900/40 transition-transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Request a new link
          </Link>

          <Link
            to="/login"
            className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200 hover:underline"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </section>
      </main>
    );
  }

  // -----------------------------
  // Form state
  // -----------------------------
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 w-72 h-72 bg-blue-500/40 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute -bottom-40 -left-28 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl opacity-40 animate-pulse [animation-delay:1500ms]" />
      </div>

      <section className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl shadow-blue-900/40 p-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg px-1 py-1"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to login</span>
        </Link>

        <header className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-xl shadow-blue-900/40">
            <FiLock className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-2">
            Reset password
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Choose a strong new password. Avoid using old or reused passwords.
            [web:41]
          </p>
        </header>

        {errorBanner && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
            <FiAlertCircle
              className="mt-0.5 h-5 w-5 text-red-400"
              aria-hidden="true"
            />
            <p className="text-xs sm:text-sm font-medium text-red-200">
              {errorBanner}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-300"
            >
              New password
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <FiLock className="h-4 w-4 text-slate-500" aria-hidden="true" />
              </span>

              <input
                ref={firstInputRef}
                id="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                disabled={loading}
                placeholder="Enter a new password"
                className={`w-full rounded-xl border bg-slate-900/80 py-3 pl-10 pr-12 text-sm text-slate-50 shadow-inner outline-none transition
                  placeholder:text-slate-500
                  focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                  disabled:cursor-not-allowed disabled:opacity-60
                  ${
                    inlineErrors.password
                      ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                      : "border-slate-700 hover:border-slate-500"
                  }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 my-1 inline-flex items-center justify-center rounded-lg px-3 text-slate-300 hover:text-slate-50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                aria-controls="newPassword"
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>

            {inlineErrors.password && (
              <p className="mt-2 text-xs font-medium text-red-300">
                {inlineErrors.password}
              </p>
            )}

            <PasswordStrength password={password} />
          </div>

          {/* Confirm */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-300"
            >
              Confirm new password
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <FiLock className="h-4 w-4 text-slate-500" aria-hidden="true" />
              </span>

              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, confirm: true }))}
                disabled={loading}
                placeholder="Re-enter the new password"
                className={`w-full rounded-xl border bg-slate-900/80 py-3 pl-10 pr-12 text-sm text-slate-50 shadow-inner outline-none transition
                  placeholder:text-slate-500
                  focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                  disabled:cursor-not-allowed disabled:opacity-60
                  ${
                    inlineErrors.confirm
                      ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                      : "border-slate-700 hover:border-slate-500"
                  }`}
              />

              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-2 my-1 inline-flex items-center justify-center rounded-lg px-3 text-slate-300 hover:text-slate-50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label={
                  showConfirm
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                aria-pressed={showConfirm}
                aria-controls="confirmPassword"
              >
                {showConfirm ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>

            {inlineErrors.confirm && (
              <p className="mt-2 text-xs font-medium text-red-300">
                {inlineErrors.confirm}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3 text-sm font-semibold text-slate-50 shadow-lg shadow-blue-900/40 transition-transform hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {loading ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Resetting...</span>
              </>
            ) : (
              <span>Reset password</span>
            )}
          </button>
        </form>

        <footer className="mt-6 text-center text-xs text-slate-400">
          Remember your password?{" "}
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

export default ResetPassword;
