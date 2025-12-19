import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toaster, toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ComplaintForm from "../../components/Complaint/ComplaintForm";

import {
  CheckCircle,
  Info,
  Clock,
  Mail,
  X,
  Eye,
  AlertCircle,
  FileText,
  Paperclip,
  Lock,
  Download,
  Tag,
  Flag,
  CheckCircle2,
} from "lucide-react";

/* Backend-aligned options (must match enum exactly) */
export const CATEGORY_OPTIONS = [
  "technical",
  "billing",
  "service",
  "product",
  "harassment",
  "safety",
  "other",
];

export const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

/* ================================================================
   CONFIG
================================================================ */
const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/complaints";
const AUTO_REDIRECT_MS = 1200;

/* ================================================================
   MOTION VARIANTS
================================================================ */
const modalVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.97, y: 14, transition: { duration: 0.18 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/* ================================================================
   HELPERS
================================================================ */
const labelize = (str) =>
  String(str || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const safeText = (v, fallback = "N/A") => (v ? String(v) : fallback);

const isImageLike = (file) => {
  const mime = String(
    file?.mimeType || file?.mimetype || file?.type || ""
  ).toLowerCase();
  return mime.startsWith("image/");
};

const getFileName = (file, idx) =>
  file?.name || file?.originalName || file?.filename || `Attachment ${idx + 1}`;

const getFileUrl = (file) => file?.url || file?.secure_url || file?.path || "";

/* Lock body scroll when modal is open */
function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/* ================================================================
   PREVIEW MODAL (backend aligned)
================================================================ */
function ComplaintPreviewModal({ open, complaint, onClose }) {
  useLockBodyScroll(open);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Create object URLs for File attachments; keep index stable
  const objectUrlsRef = useRef([]);
  useEffect(() => {
    if (!open) return;

    const list = Array.isArray(complaint?.attachments)
      ? complaint.attachments
      : [];
    objectUrlsRef.current = list.map((f) =>
      f instanceof File ? URL.createObjectURL(f) : null
    );

    return () => {
      objectUrlsRef.current.forEach((u) => u && URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
    };
  }, [open, complaint]);

  if (!open || !complaint) return null;

  const priorityClass =
    {
      urgent: "bg-rose-50 text-rose-700 border-rose-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      medium: "bg-blue-50 text-blue-700 border-blue-200",
      low: "bg-slate-50 text-slate-700 border-slate-200",
    }[String(complaint.priority || "medium")] ||
    "bg-blue-50 text-blue-700 border-blue-200";

  // Backend enum: technical/billing/service/product/harassment/safety/other
  const categoryClass =
    {
      technical: "bg-purple-50 text-purple-700 border-purple-200",
      billing: "bg-amber-50 text-amber-800 border-amber-200",
      service: "bg-blue-50 text-blue-700 border-blue-200",
      product: "bg-indigo-50 text-indigo-700 border-indigo-200",
      harassment: "bg-rose-50 text-rose-700 border-rose-200",
      safety: "bg-emerald-50 text-emerald-700 border-emerald-200",
      other: "bg-slate-50 text-slate-700 border-slate-200",
    }[String(complaint.category || "other").toLowerCase()] ||
    "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-8"
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Overlay */}
        <motion.button
          type="button"
          aria-label="Close preview"
          variants={overlayVariants}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          variants={modalVariants}
          role="dialog"
          aria-modal="true"
          aria-label="Complaint preview"
          className="relative z-[101] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">
                  Complaint preview
                </h2>
                <p className="text-xs text-gray-600 truncate">
                  Review backend-saved fields
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-500 hover:bg-white hover:text-gray-800 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title + meta */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
                  {safeText(complaint.title, "Untitled complaint")}
                </h3>

                {complaint._id ? (
                  <span className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-mono text-gray-700">
                    ID: {complaint._id.slice(-8)}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${priorityClass}`}
                >
                  {safeText(complaint.priority, "medium")} priority
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${categoryClass}`}
                >
                  {labelize(complaint.category || "other")}
                </span>

                {complaint.status ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 uppercase">
                    {String(complaint.status).replaceAll("_", " ")}
                  </span>
                ) : null}

                {complaint.department ? (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                    Dept: {safeText(complaint.department)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Description
              </h4>
              <p className="mt-2 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {safeText(complaint.description, "No description provided.")}
              </p>
            </div>

            {/* Contact Info (exists in your schema) */}
            {complaint.contactInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Contact name
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-gray-900">
                    {safeText(complaint.contactInfo?.name)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Contact email
                  </p>
                  <p className="mt-2 text-sm font-mono font-extrabold text-gray-900 break-all">
                    {safeText(complaint.contactInfo?.email)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Contact phone
                  </p>
                  <p className="mt-2 text-sm font-mono font-extrabold text-gray-900">
                    {safeText(complaint.contactInfo?.phone, "—")}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Attachments */}
            {Array.isArray(complaint.attachments) &&
            complaint.attachments.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-blue-600" />
                  Attachments ({complaint.attachments.length})
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.attachments.map((file, idx) => {
                    const name = getFileName(file, idx);
                    const url =
                      getFileUrl(file) || objectUrlsRef.current[idx] || "";
                    const img = isImageLike(file);

                    return (
                      <a
                        key={`${idx}-${name}`}
                        href={url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition"
                        onClick={(e) => {
                          if (!url) e.preventDefault();
                        }}
                        title={name}
                      >
                        <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                          {img && url ? (
                            <img
                              src={url}
                              alt={name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="p-4 text-center">
                              <Download className="h-10 w-10 text-gray-400 mx-auto" />
                              <p className="mt-2 text-xs font-semibold text-gray-700 line-clamp-2">
                                {name}
                              </p>
                            </div>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Timestamps */}
            {complaint.createdAt ? (
              <div className="border-t border-gray-200 pt-4 text-xs text-gray-600 space-y-1">
                <p>Submitted: {formatDateTime(complaint.createdAt)}</p>
                {complaint.updatedAt &&
                complaint.updatedAt !== complaint.createdAt ? (
                  <p>Last updated: {formatDateTime(complaint.updatedAt)}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-[0.99]"
            >
              Close preview
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ================================================================
   MAIN PAGE
================================================================ */
export default function SubmitComplaint() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState({
    status: "idle", // idle | submitting | success | error
    complaintData: null,
    message: "",
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const redirectTimerRef = useRef(null);

  const isSubmitting = state.status === "submitting";

  // Staff-only websocket toasts
  useEffect(() => {
    const isStaff = ["admin", "staff"].includes(user?.role);
    if (!isStaff) return;

    let socket;
    try {
      socket = new WebSocket(WS_URL);
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === "NEW_COMPLAINT") {
            toast.success("New complaint received", {
              duration: 2500,
              position: "bottom-right",
            });
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [user?.role]);

  // Auto redirect after success (unless preview open)
  useEffect(() => {
    if (state.status !== "success") return;

    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = setTimeout(() => {
      if (!previewOpen) navigate("/complaints/my");
    }, AUTO_REDIRECT_MS);

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [state.status, navigate, previewOpen]);

  const onSubmitStart = useCallback(() => {
    setState({ status: "submitting", complaintData: null, message: "" });
  }, []);

  const onSubmitSuccess = useCallback((complaintData) => {
    setState({
      status: "success",
      complaintData,
      message: "Submitted successfully. Staff will review it shortly.",
    });

    toast.success("Complaint submitted", {
      duration: 2000,
      position: "top-center",
    });
  }, []);

  const onSubmitError = useCallback((errorMessage) => {
    setState({
      status: "error",
      complaintData: null,
      message: errorMessage || "Failed to submit complaint. Please try again.",
    });

    toast.error("Submission failed", {
      duration: 3500,
      position: "top-center",
    });
  }, []);

  if (!isAuthenticated) {
    return (
      <>
        <Toaster />
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 px-4">
          <div className="max-w-md w-full rounded-3xl border border-gray-200 bg-white shadow-sm p-8 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Lock className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Login required
            </h1>
            <p className="text-sm text-gray-600">
              Log in to submit a complaint so it can be tracked to your account.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-blue-700 transition"
            >
              Go to login
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Toaster />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <header className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Submit a complaint
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Provide clear details and attachments so staff can resolve it
              faster.
            </p>
          </header>

          {/* Success / Error banners */}
          <AnimatePresence mode="wait">
            {state.status === "success" ? (
              <motion.section
                key="success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm"
                role="alert"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-7 w-7 text-emerald-600 shrink-0" />
                    <div>
                      <h2 className="text-lg font-extrabold text-emerald-900">
                        Submitted successfully
                      </h2>
                      <p className="mt-1 text-sm text-emerald-800">
                        Redirecting to “My Complaints”… (or open preview below)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        state.complaintData && setPreviewOpen(true)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-extrabold text-emerald-800 hover:bg-emerald-50 transition"
                      disabled={!state.complaintData}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/complaints/my")}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 transition"
                    >
                      Go now
                    </button>
                  </div>
                </div>
              </motion.section>
            ) : null}

            {state.status === "error" ? (
              <motion.section
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-6 shadow-sm"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
                  <div>
                    <h2 className="text-lg font-extrabold text-rose-900">
                      Submission failed
                    </h2>
                    <p className="mt-1 text-sm text-rose-800">
                      {state.message}
                    </p>
                  </div>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>

          {/* Form Card */}
          <section
            className={[
              "relative rounded-3xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8 md:p-10 transition",
              isSubmitting
                ? "opacity-70 pointer-events-none"
                : "hover:shadow-lg",
            ].join(" ")}
          >
            {isSubmitting ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  <p className="text-sm sm:text-base font-extrabold text-gray-800">
                    Submitting…
                  </p>
                  <p className="mt-1 text-xs text-gray-600">Please wait.</p>
                </div>
              </div>
            ) : null}

            {/* IMPORTANT: ComplaintForm must send category values from CATEGORY_OPTIONS (lowercase). */}
            <ComplaintForm
              currentUser={user}
              categoryOptions={CATEGORY_OPTIONS}
              priorityOptions={PRIORITY_OPTIONS}
              onSubmitStart={onSubmitStart}
              onSubmitSuccess={onSubmitSuccess}
              onSubmitError={onSubmitError}
              isSubmitting={isSubmitting}
            />
          </section>

          {/* After-submit info (kept as-is, just slightly more consistent) */}
          <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center">
                <Info className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-blue-900">
                What happens next
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm text-blue-900">
              <div className="rounded-2xl border border-blue-200 bg-white/70 p-4">
                <p className="font-extrabold">Instant save</p>
                <p className="mt-1 text-blue-800">
                  Your complaint is stored immediately with attachments.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-white/70 p-4">
                <p className="font-extrabold">Real-time visibility</p>
                <p className="mt-1 text-blue-800">
                  Staff can see new submissions quickly in their dashboard.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-white/70 p-4 flex gap-3">
                <Mail className="h-5 w-5 text-blue-700 mt-0.5" />
                <div>
                  <p className="font-extrabold">Notifications</p>
                  <p className="mt-1 text-blue-800">
                    Status updates appear in “My Complaints”.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-white/70 p-4 flex gap-3">
                <Clock className="h-5 w-5 text-blue-700 mt-0.5" />
                <div>
                  <p className="font-extrabold">Response time</p>
                  <p className="mt-1 text-blue-800">
                    Most complaints get an initial response within 24–48
                    business hours.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ComplaintPreviewModal
        open={previewOpen}
        complaint={state.complaintData}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
