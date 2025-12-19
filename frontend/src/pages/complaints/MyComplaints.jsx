import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import {
  FiFileText,
  FiPlus,
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiX,
  FiCalendar,
  FiMessageSquare,
  FiPaperclip,
  FiEye,
  FiRefreshCw,
  FiTrash2,
  FiEdit2,
  FiAlertCircle,
  FiLock,
} from "react-icons/fi";

/* ================================================================
  CONFIG (backend-aligned)
================================================================ */
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    chip: "bg-amber-50 text-amber-800 border-amber-200",
    tab: "text-amber-700 data-[active=true]:bg-amber-50 data-[active=true]:border-amber-200",
    Icon: FiClock,
  },
  in_progress: {
    label: "In Progress",
    chip: "bg-blue-50 text-blue-800 border-blue-200",
    tab: "text-blue-700 data-[active=true]:bg-blue-50 data-[active=true]:border-blue-200",
    Icon: FiRefreshCw,
  },
  resolved: {
    label: "Resolved",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    tab: "text-emerald-700 data-[active=true]:bg-emerald-50 data-[active=true]:border-emerald-200",
    Icon: FiCheckCircle,
  },
  rejected: {
    label: "Rejected",
    chip: "bg-rose-50 text-rose-800 border-rose-200",
    tab: "text-rose-700 data-[active=true]:bg-rose-50 data-[active=true]:border-rose-200",
    Icon: FiX,
  },
  closed: {
    label: "Closed",
    chip: "bg-slate-50 text-slate-800 border-slate-200",
    tab: "text-slate-700 data-[active=true]:bg-slate-50 data-[active=true]:border-slate-200",
    Icon: FiLock,
  },
};

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", chip: "bg-rose-50 text-rose-700 border-rose-200" },
  high: {
    label: "High",
    chip: "bg-orange-50 text-orange-700 border-orange-200",
  },
  medium: { label: "Medium", chip: "bg-blue-50 text-blue-700 border-blue-200" },
  low: { label: "Low", chip: "bg-slate-50 text-slate-700 border-slate-200" },
};

const safeStatus = (s) => (STATUS_CONFIG[s] ? s : "pending");
const safePriority = (p) => (PRIORITY_CONFIG[p] ? p : "medium");

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const parseApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.complaints)) return payload.complaints;
  return [];
};

/* ================================================================
  SMALL HOOKS
================================================================ */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ================================================================
  UI PRIMITIVES
================================================================ */
const StatCard = ({ title, value, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-50 border-slate-200 text-slate-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    rose: "bg-rose-50 border-rose-200 text-rose-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {title}
      </p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
};

const Chip = ({ Icon, children, className = "" }) => (
  <span
    className={[
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
      className,
    ].join(" ")}
  >
    {Icon ? <Icon className="h-4 w-4" /> : null}
    {children}
  </span>
);

const IconButton = ({ title, onClick, tone = "slate", children, disabled }) => {
  const tones = {
    slate:
      "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900",
    blue: "border-blue-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700",
    rose: "border-rose-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        tones[tone] || tones.slate,
      ].join(" ")}
    >
      {children}
    </button>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="h-6 w-28 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-5 w-14 bg-gray-100 rounded-lg animate-pulse" />
    </div>
    <div className="mt-4 h-5 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
    <div className="mt-3 space-y-2">
      <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-4 w-5/6 bg-gray-100 rounded-lg animate-pulse" />
    </div>
    <div className="mt-5 flex gap-2">
      <div className="h-7 w-24 bg-gray-100 rounded-full animate-pulse" />
      <div className="h-7 w-28 bg-gray-100 rounded-full animate-pulse" />
    </div>
  </div>
);

const StatusTabs = ({ value, onChange, counts }) => {
  const tabs = [
    { key: "all", label: "All" },
    ...Object.keys(STATUS_CONFIG).map((k) => ({
      key: k,
      label: STATUS_CONFIG[k].label,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = value === t.key;
        const cfg = STATUS_CONFIG[t.key];
        return (
          <button
            key={t.key}
            type="button"
            data-active={active}
            onClick={() => onChange(t.key)}
            className={[
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
              "bg-white hover:bg-gray-50",
              active ? "border-gray-300" : "border-gray-200",
              cfg?.tab ||
                "text-gray-700 data-[active=true]:bg-gray-50 data-[active=true]:border-gray-200",
            ].join(" ")}
          >
            {cfg?.Icon ? <cfg.Icon className="h-4 w-4" /> : null}
            <span>{t.label}</span>
            <span className="ml-1 rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
              {counts?.[t.key] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* ================================================================
  DELETE MODAL
================================================================ */
const DeleteModal = ({ isOpen, onClose, onConfirm, isDeleting }) => (
  <AnimatePresence>
    {isOpen ? (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          <div className="p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 border border-rose-200">
              <FiAlertCircle className="h-6 w-6 text-rose-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center">
              Delete complaint?
            </h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              This action cannot be undone.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <FiTrash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

/* ================================================================
  CARD (location removed)
================================================================ */
const ComplaintCard = ({ complaint, onEdit, onDelete }) => {
  const statusKey = safeStatus(complaint?.status);
  const priorityKey = safePriority(complaint?.priority);

  const status = STATUS_CONFIG[statusKey];
  const priority = PRIORITY_CONFIG[priorityKey];

  const canEditOrDelete = statusKey === "pending";

  const attachmentCount = complaint?.attachments?.length || 0;
  const commentCount = complaint?.comments?.length || 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col"
    >
      {/* Top bar */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip Icon={status.Icon} className={status.chip}>
            {status.label}
          </Chip>
          <Chip className={priority.chip}>{priority.label} priority</Chip>
          {complaint?.category ? (
            <Chip className="bg-indigo-50 text-indigo-700 border-indigo-200">
              {String(complaint.category).replaceAll("_", " ")}
            </Chip>
          ) : null}
          {complaint?.department ? (
            <Chip className="bg-slate-50 text-slate-700 border-slate-200">
              {complaint.department}
            </Chip>
          ) : null}
        </div>

        <span className="text-[11px] font-mono text-gray-400">
          #
          {String(complaint?._id || "")
            .slice(-6)
            .toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1">
        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
          {complaint?.title || "Untitled"}
        </h3>

        <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
          {complaint?.description || "No description provided."}
        </p>

        {/* Date info */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
          <FiCalendar className="h-4 w-4 text-gray-400" />
          <span>Submitted: {formatDate(complaint?.createdAt)}</span>
        </div>

        {(attachmentCount > 0 || commentCount > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachmentCount > 0 && (
              <Chip className="bg-blue-50 text-blue-700 border-blue-200">
                <FiPaperclip className="h-4 w-4" />
                {attachmentCount} file{attachmentCount > 1 ? "s" : ""}
              </Chip>
            )}
            {commentCount > 0 && (
              <Chip className="bg-purple-50 text-purple-700 border-purple-200">
                <FiMessageSquare className="h-4 w-4" />
                {commentCount} comment{commentCount > 1 ? "s" : ""}
              </Chip>
            )}
          </div>
        )}

        {complaint?.updatedAt &&
        complaint?.updatedAt !== complaint?.createdAt ? (
          <p className="mt-3 text-[11px] text-gray-400">
            Last updated: {formatDate(complaint.updatedAt)}
          </p>
        ) : null}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {canEditOrDelete && (
            <>
              <IconButton
                title="Edit"
                onClick={() => onEdit(complaint._id)}
                tone="blue"
              >
                <FiEdit2 className="h-4 w-4" />
              </IconButton>
              <IconButton
                title="Delete"
                onClick={() => onDelete(complaint._id)}
                tone="rose"
              >
                <FiTrash2 className="h-4 w-4" />
              </IconButton>
            </>
          )}
        </div>

        <Link
          to={`/complaints/${complaint._id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition"
        >
          <FiEye className="h-4 w-4" />
          View
        </Link>
      </div>
    </motion.article>
  );
};

/* ================================================================
  MAIN PAGE
================================================================ */
export default function MyComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const [sortBy, setSortBy] = useState("newest");

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await apiClient.get("/complaints/my");
      const list = parseApiList(res?.data ?? res);
      setComplaints(list);
    } catch (err) {
      console.error(err);
      setLoadError("Failed to load your complaints.");
      toast.error("Failed to load your complaints.");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Optional: websocket sync
  useEffect(() => {
    if (!user) return;
    const wsUrl =
      import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/complaints";
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "UPDATED_COMPLAINT" && msg.data?.user === user._id) {
          setComplaints((prev) =>
            prev.map((c) => (c._id === msg.data._id ? msg.data : c))
          );
        }

        if (msg.type === "NEW_COMPLAINT" && msg.data?.user === user._id) {
          setComplaints((prev) => [msg.data, ...prev]);
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    return () => socket.close();
  }, [user]);

  const counts = useMemo(() => {
    const by = { all: complaints.length };
    Object.keys(STATUS_CONFIG).forEach((k) => {
      by[k] = complaints.filter((c) => safeStatus(c.status) === k).length;
    });
    return by;
  }, [complaints]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(
      (c) => safeStatus(c.status) === "pending"
    ).length;
    const resolved = complaints.filter(
      (c) => safeStatus(c.status) === "resolved"
    ).length;
    const rejected = complaints.filter(
      (c) => safeStatus(c.status) === "rejected"
    ).length;
    return { total, pending, resolved, rejected };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    if (filterStatus !== "all") {
      result = result.filter((c) => safeStatus(c.status) === filterStatus);
    }

    if (debouncedSearch.trim()) {
      const s = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s) ||
          c._id?.toLowerCase().includes(s) ||
          c.department?.toLowerCase().includes(s) ||
          c.category?.toLowerCase().includes(s)
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortBy === "oldest" ? da - db : db - da;
    });

    return result;
  }, [complaints, filterStatus, debouncedSearch, sortBy]);

  const onEdit = (id) => navigate(`/complaints/${id}/edit`);

  const onDeleteStart = (id) => {
    const target = complaints.find((c) => c._id === id);
    if (target && safeStatus(target.status) !== "pending") {
      toast.error("You can only delete complaints that are still pending.");
      return;
    }
    setDeleteModal({ isOpen: true, id });
  };

  const onDeleteConfirm = async () => {
    if (!deleteModal.id) return;

    setIsDeleting(true);
    try {
      const target = complaints.find((c) => c._id === deleteModal.id);
      if (target && safeStatus(target.status) !== "pending") {
        throw new Error(
          "You can only delete complaints that are still pending."
        );
      }

      await apiClient.delete(`/complaints/${deleteModal.id}`);
      setComplaints((prev) => prev.filter((c) => c._id !== deleteModal.id));
      toast.success("Complaint deleted.");
      setDeleteModal({ isOpen: false, id: null });
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete complaint."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setSearchTerm("");
    setSortBy("newest");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <FiFileText className="text-blue-600" />
                My Complaints
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track progress, edit pending items, and manage your submissions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
                <StatCard title="Total" value={stats.total} tone="slate" />
                <StatCard title="Pending" value={stats.pending} tone="amber" />
                <StatCard
                  title="Resolved"
                  value={stats.resolved}
                  tone="emerald"
                />
                <StatCard title="Rejected" value={stats.rejected} tone="rose" />
              </div>

              <Link
                to="/complaints/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                <FiPlus className="h-5 w-5" />
                New complaint
              </Link>
            </div>
          </div>
        </header>

        {/* Filters */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <StatusTabs
              value={filterStatus}
              onChange={setFilterStatus}
              counts={counts}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Clear
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, description, ID, category, department..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white border border-rose-200">
              <FiAlertCircle className="h-7 w-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-rose-900">{loadError}</h3>
            <p className="mt-1 text-sm text-rose-800">
              Try again or check your connection.
            </p>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredComplaints.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 border border-gray-200">
                  <FiAlertCircle className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  No complaints found
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Try clearing filters or create a new complaint.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-100 transition"
                  >
                    Clear filters
                  </button>
                  <Link
                    to="/complaints/new"
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition"
                  >
                    Create complaint
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredComplaints.map((c) => (
                  <ComplaintCard
                    key={c._id}
                    complaint={c}
                    onEdit={onEdit}
                    onDelete={onDeleteStart}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
      />
    </main>
  );
}
