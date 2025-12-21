import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ComplaintAPI } from "../../api/complaints";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  FileText,
  Image as ImageIcon,
  Download,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Archive,
  Tag,
  Flag,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  X,
} from "lucide-react";

/* --- Configuration & Helpers --- */
const CONFIG = {
  status: {
    pending: {
      label: "Pending",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      icon: Clock,
    },
    in_progress: {
      label: "In Progress",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      icon: Loader2,
    },
    resolved: {
      label: "Resolved",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      icon: CheckCircle,
    },
    rejected: {
      label: "Rejected",
      color: "text-rose-600 bg-rose-50 border-rose-200",
      icon: XCircle,
    },
    closed: {
      label: "Closed",
      color: "text-slate-600 bg-slate-50 border-slate-200",
      icon: Archive,
    },
  },
  priority: {
    urgent: {
      label: "Urgent",
      color: "text-rose-700 bg-rose-50 border-rose-200",
    },
    high: {
      label: "High",
      color: "text-orange-700 bg-orange-50 border-orange-200",
    },
    medium: {
      label: "Medium",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    low: { label: "Low", color: "text-slate-700 bg-slate-50 border-slate-200" },
  },
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";
const getVal = (obj, key, def) => obj?.[key] || def;

/* --- Sub-Components --- */

const StatusBadge = ({ status, type = "status" }) => {
  const cfg = getVal(
    CONFIG[type],
    status,
    CONFIG[type].pending || CONFIG[type].medium
  );
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {cfg.label}
    </span>
  );
};

const InfoItem = ({ icon: Icon, label, value, sub, onClick, copyable }) => (
  <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
    <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm text-gray-500">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-gray-900 truncate" title={value}>
          {value || "—"}
        </p>
        {copyable && (
          <button
            onClick={onClick}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-500 transition-all"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const ImageModal = ({ src, onClose }) => (
  <AnimatePresence>
    {src && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
        >
          <X className="w-6 h-6" />
        </button>
        <motion.img
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          src={src}
          alt="Preview"
          className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
        />
      </motion.div>
    )}
  </AnimatePresence>
);

const CommentThread = ({ comments }) => {
  if (!comments?.length) return null;
  return (
    <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
      {comments.map((c, i) => (
        <div key={i} className="relative pl-10">
          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-blue-700 z-10">
            {(c.user?.name?.[0] || "U").toUpperCase()}
          </div>
          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-semibold text-sm text-gray-900">
                {c.user?.name || "User"}
              </span>
              <span className="text-xs text-gray-400">
                {formatDate(c.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {c.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* --- Main Page Component --- */
export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState({ current: null, list: [] });
  const [uiState, setUiState] = useState({
    loading: true,
    error: null,
    viewingImage: null,
  });

  // Fetch Logic
  const fetchData = useCallback(async () => {
    setUiState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await ComplaintAPI.getById(id);
      const complaint = res?.data?.complaint || res?.data || res;

      if (!complaint?._id) throw new Error("Complaint data unavailable");

      // Background fetch for list navigation (optional)
      let list = [];
      try {
        const listRes = await ComplaintAPI.getAll();
        const rawList = listRes?.data?.data || listRes?.data || listRes;
        if (Array.isArray(rawList))
          list = rawList.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
      } catch (e) {
        console.warn("Nav list fetch failed", e);
      }

      setData({ current: complaint, list });
    } catch (err) {
      setUiState((prev) => ({
        ...prev,
        error: err.message || "Failed to load complaint",
      }));
    } finally {
      setUiState((prev) => ({ ...prev, loading: false }));
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [fetchData, id]);

  // Navigation Logic
  const currentIndex = data.list.findIndex((c) => c._id === id);
  const handleNav = (dir) => {
    const target = data.list[currentIndex + dir];
    if (target)
      navigate(`/complaints/${target._id}`, { state: location.state });
  };

  const copyId = () => {
    navigator.clipboard.writeText(data.current?._id);
    // Ideally trigger a toast here
  };

  if (uiState.loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-500">
          Retrieving details...
        </p>
      </div>
    );

  if (uiState.error || !data.current)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Unavailable</h3>
          <p className="text-gray-500 mb-6">{uiState.error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  const c = data.current;
  const isResolved = c.status === "resolved";
  const isRejected = c.status === "rejected";

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 font-sans pb-12">
      <ImageModal
        src={uiState.viewingImage}
        onClose={() => setUiState((p) => ({ ...p, viewingImage: null }))}
      />

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(location.state?.from || "/complaints")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              disabled={currentIndex <= 0}
              onClick={() => handleNav(-1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={
                currentIndex < 0 || currentIndex === data.list.length - 1
              }
              onClick={() => handleNav(1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* LEFT: Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60 relative overflow-hidden">
              <div className="flex flex-wrap gap-2 mb-4">
                <StatusBadge status={c.status} type="status" />
                <StatusBadge status={c.priority} type="priority" />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  <Tag className="w-3 h-3" /> {c.category || "General"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
                {c.title}
              </h1>
              <div
                className="flex items-center gap-2 text-xs text-gray-500 font-mono cursor-pointer hover:text-blue-600 transition-colors w-fit"
                onClick={copyId}
              >
                #{c._id} <Copy className="w-3 h-3" />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Description
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                {c.description}
              </p>
            </div>

            {/* Official Outcome (Resolved/Rejected) */}
            {(isResolved || isRejected) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl p-6 border ${isResolved ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}
              >
                <h3
                  className={`text-sm font-bold uppercase tracking-wide mb-2 flex items-center gap-2 ${isResolved ? "text-emerald-800" : "text-rose-800"}`}
                >
                  {isResolved ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {isResolved ? "Resolution Note" : "Rejection Reason"}
                </h3>
                <p
                  className={`text-sm ${isResolved ? "text-emerald-900" : "text-rose-900"}`}
                >
                  {isResolved ? c.resolutionNote : c.rejectionReason}
                </p>
                <p className="text-xs mt-3 opacity-60 font-medium">
                  {isResolved
                    ? `Resolved on ${formatDate(c.resolvedAt)}`
                    : `Rejected on ${formatDate(c.rejectedAt)}`}
                </p>
              </motion.div>
            )}

            {/* Attachments */}
            {c.attachments?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400" /> Attachments
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {c.attachments.map((f, i) => {
                    const url = f.url || f.secure_url;
                    const isImg = f.mimetype?.startsWith("image");
                    return (
                      <div
                        key={i}
                        className="group relative aspect-square rounded-xl bg-gray-50 border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      >
                        {isImg ? (
                          <img
                            src={url}
                            alt="att"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onClick={() =>
                              setUiState((p) => ({ ...p, viewingImage: url }))
                            }
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                            <FileText className="w-8 h-8 mb-2" />
                            <span className="text-[10px] truncate w-full">
                              {f.originalName || "File"}
                            </span>
                          </div>
                        )}
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isImg ? (
                            <ExternalLink className="w-3.5 h-3.5" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" /> Discussion
                History
              </h2>
              {c.comments?.length ? (
                <CommentThread comments={c.comments} />
              ) : (
                <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">
                    No comments recorded on this ticket yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase">
                  Ticket Details
                </h3>
              </div>
              <div className="p-3 space-y-1">
                <InfoItem
                  icon={User}
                  label="Reporter"
                  value={c.user?.name}
                  sub={c.user?.email}
                />
                <InfoItem
                  icon={Building2}
                  label="Department"
                  value={c.department}
                />
                <InfoItem
                  icon={Calendar}
                  label="Created"
                  value={formatDate(c.createdAt)}
                />
                <InfoItem
                  icon={Clock}
                  label="Updated"
                  value={formatDate(c.updatedAt)}
                />
              </div>
            </div>

            {c.contactInfo && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 uppercase">
                    Contact Information
                  </h3>
                </div>
                <div className="p-3 space-y-1">
                  <InfoItem
                    icon={User}
                    label="Name"
                    value={c.contactInfo.name}
                  />
                  <InfoItem
                    icon={Mail}
                    label="Email"
                    value={c.contactInfo.email}
                    copyable
                    onClick={() =>
                      navigator.clipboard.writeText(c.contactInfo.email)
                    }
                  />
                  <InfoItem
                    icon={Phone}
                    label="Phone"
                    value={c.contactInfo.phone}
                    copyable
                    onClick={() =>
                      navigator.clipboard.writeText(c.contactInfo.phone)
                    }
                  />
                </div>
              </div>
            )}

            {c.notes && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 shadow-sm">
                <h3 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-2">
                  <Flag className="w-3 h-3" /> Internal Notes
                </h3>
                <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
                  {c.notes}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
