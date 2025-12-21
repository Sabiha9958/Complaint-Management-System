import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toaster, toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useBeforeUnload } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ComplaintForm from "../../components/Complaint/ComplaintForm";
import {
  CheckCircle2,
  Info,
  Clock,
  Mail,
  X,
  Eye,
  FileText,
  Paperclip,
  Lock,
  Download,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

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

const API_URL = import.meta.env.VITE_API_URL;

const buildWsUrl = () => {
  if (!API_URL) throw new Error("VITE_API_URL is missing");
  const u = new URL(API_URL);
  const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${u.host}/ws/complaints`;
};

const WS_URL = import.meta.env.VITE_WS_URL?.trim() || buildWsUrl();

const FADE_IN = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const hasDraftValues = (formEl) => {
  if (!formEl) return false;
  try {
    const fd = new FormData(formEl);
    for (const [, v] of fd.entries()) {
      if (typeof v === "string" && v.trim()) return true;
      if (v instanceof File && v.size > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
};

const ComplaintPreviewModal = ({ open, complaint, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "unset";
    };
  }, [open]);

  if (!open || !complaint) return null;

  const priorityColors = {
    urgent: "bg-rose-100 text-rose-700 border-rose-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    low: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Ticket Preview
              </h3>
              <p className="text-xs text-slate-500">
                Review details before closing
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  priorityColors[complaint.priority] || priorityColors.medium
                }`}
              >
                {complaint.priority || "Medium"}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-slate-200 bg-slate-100 text-slate-600">
                {complaint.category || "General"}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {complaint.title || "Untitled Ticket"}
              </h2>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDateTime(complaint.createdAt || new Date())}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {complaint.description || "No description provided."}
            </div>

            {complaint.attachments?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Attachments
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.attachments.map((file, i) => {
                    const url =
                      file.url ||
                      (file instanceof File ? URL.createObjectURL(file) : null);
                    const isImg =
                      file.type?.startsWith("image") ||
                      file.mimeType?.startsWith("image");

                    return (
                      <a
                        key={i}
                        href={url || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square rounded-lg border border-slate-200 bg-slate-50 overflow-hidden hover:shadow-md transition-all"
                      >
                        {isImg && url ? (
                          <img
                            src={url}
                            alt={file.name || "attachment"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-2">
                            <FileText className="w-8 h-8 mb-2" />
                            <span className="text-[10px] text-center truncate w-full">
                              {file.name || "File"}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Download className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-transform active:scale-[0.98]"
            >
              Close Preview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default function SubmitComplaint() {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const formHostRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const lastNotifyRef = useRef(0);

  const isStaff = useMemo(() => {
    const role = String(user?.role || "").toLowerCase();
    return role === "staff" || role === "admin";
  }, [user?.role]);

  useBeforeUnload(
    useCallback(
      (e) => {
        const formEl = formHostRef.current?.querySelector("form");
        const shouldWarn =
          status === "submitting" ||
          (status === "idle" && hasDraftValues(formEl));
        if (!shouldWarn) return;
        e.preventDefault();
        e.returnValue = "";
      },
      [status]
    )
  );

  useEffect(() => {
    if (!isStaff) return;

    let stopped = false;

    const cleanup = () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      reconnectRef.current = null;

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
      wsRef.current = null;
    };

    const connect = (attempt = 0) => {
      if (stopped) return;

      cleanup();

      let socket;
      try {
        socket = new WebSocket(WS_URL);
      } catch {
        return;
      }

      wsRef.current = socket;

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.type !== "NEW_COMPLAINT") return;

          const now = Date.now();
          if (now - lastNotifyRef.current < 1500) return;
          lastNotifyRef.current = now;

          toast("New ticket received", { duration: 1500, icon: "🔔" });
        } catch {}
      };

      socket.onclose = () => {
        if (stopped) return;
        const delay = Math.min(10000, 1000 * Math.pow(2, attempt));
        reconnectRef.current = setTimeout(() => connect(attempt + 1), delay);
      };

      socket.onerror = () => {
        try {
          socket.close();
        } catch {}
      };
    };

    connect(0);

    return () => {
      stopped = true;
      cleanup();
    };
  }, [isStaff]);

  const handleSubmitStart = useCallback(() => setStatus("submitting"), []);

  const handleSubmitSuccess = useCallback((data) => {
    setStatus("success");
    setResult(data);

    const id = String(data?._id || "");
    const shortId = id ? id.slice(-6).toUpperCase() : "—";

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">Submitted</p>
                <p className="mt-1 text-sm text-gray-500">
                  Ticket ID: #{shortId}
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 2000 }
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmitError = useCallback((msg) => {
    setStatus("error");
    toast.error(msg || "Failed", { duration: 2500 });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Login required
          </h2>
          <p className="text-slate-500 mb-8">
            Please sign in to submit a ticket.
          </p>
          <Link
            to="/login"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
          >
            Go to Login
          </Link>
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: { fontWeight: 600 },
        }}
      />

      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link
              to="/complaints/my"
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              <Sparkles className="w-3 h-3" />
              New Ticket
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 space-y-6 lg:sticky lg:top-24"
            >
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
                  <FileText className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
                  Submit a Complaint
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Provide details so the team can resolve the issue faster.
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-400" />
                  Next steps
                </h3>
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Dashboard</p>
                      <p className="text-xs mt-0.5">
                        Appears instantly in your tickets list.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Updates</p>
                      <p className="text-xs mt-0.5">
                        Get notified when staff replies.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Private</p>
                      <p className="text-xs mt-0.5">
                        Visible only to you and staff.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </motion.aside>

            <div className="lg:col-span-8" ref={formHostRef}>
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    variants={FADE_IN}
                    initial="hidden"
                    animate="visible"
                    className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
                  >
                    <div className="bg-emerald-500 p-10 text-center text-white relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: 0.2,
                        }}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                      >
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </motion.div>
                      <h2 className="text-3xl font-bold mb-2">Registered</h2>
                      <p className="text-emerald-100">
                        The team will review it shortly.
                      </p>
                    </div>

                    <div className="p-8">
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => setIsPreviewOpen(true)}
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <Link
                          to="/complaints/my"
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-transform active:scale-95 shadow-lg shadow-slate-200"
                        >
                          Dashboard
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    variants={FADE_IN}
                    initial="hidden"
                    animate="visible"
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300 relative"
                  >
                    {status === "submitting" && (
                      <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-slate-900 font-semibold">
                          Submitting...
                        </p>
                      </div>
                    )}

                    <div className="p-6 sm:p-10">
                      <ComplaintForm
                        currentUser={user}
                        categoryOptions={CATEGORY_OPTIONS}
                        priorityOptions={PRIORITY_OPTIONS}
                        onSubmitStart={handleSubmitStart}
                        onSubmitSuccess={handleSubmitSuccess}
                        onSubmitError={handleSubmitError}
                        isSubmitting={status === "submitting"}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <ComplaintPreviewModal
        open={isPreviewOpen}
        complaint={result}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
