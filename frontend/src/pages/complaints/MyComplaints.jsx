import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
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
  FiArrowRight,
  FiRefreshCw,
  FiTrash2,
  FiEdit3,
  FiAlertCircle,
  FiLock,
  FiFilter,
} from "react-icons/fi";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_URL = import.meta.env.VITE_API_URL;

const buildWsUrl = () => {
  if (!API_URL) throw new Error("VITE_API_URL is missing");
  const u = new URL(API_URL);
  const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${u.host}/ws/complaints`;
};

const WS_URL = import.meta.env.VITE_WS_URL?.trim() || buildWsUrl();

const TOAST = {
  success: (msg) =>
    toast.success(msg, { position: "top-left", autoClose: 1500 }),
  error: (msg) => toast.error(msg, { position: "top-left", autoClose: 2500 }),
  info: (msg) => toast.info(msg, { position: "top-left", autoClose: 1500 }),
};

const VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
};

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    Icon: FiClock,
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    Icon: FiRefreshCw,
  },
  resolved: {
    label: "Resolved",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    Icon: FiCheckCircle,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    Icon: FiX,
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    Icon: FiLock,
  },
};

const PRIORITY_STYLES = {
  urgent: "bg-rose-50 text-rose-600 border-rose-200 ring-rose-500/20",
  high: "bg-orange-50 text-orange-600 border-orange-200 ring-orange-500/20",
  medium: "bg-blue-50 text-blue-600 border-blue-200 ring-blue-500/20",
  low: "bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/20",
};

const FILTER_KEYS = [
  "all",
  "pending",
  "in_progress",
  "resolved",
  "rejected",
  "closed",
];

const getStatusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.pending;
const getPriorityStyle = (p) => PRIORITY_STYLES[p] || PRIORITY_STYLES.medium;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function Badge({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        className
      )}
    >
      {children}
    </span>
  );
}

function StatItem({ label, value, colorClass }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <span className={cn("text-2xl font-bold mt-0.5", colorClass)}>
        {value}
      </span>
    </div>
  );
}

function DeleteModal({ isOpen, onClose, onConfirm, isDeleting }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close delete modal"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Delete complaint"
          >
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
                <FiTrash2
                  className="h-8 w-8 text-rose-500"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Delete Complaint?
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                This action cannot be undone.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isDeleting ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ComplaintCard({ data, onEdit, onDelete }) {
  const status = getStatusStyle(data.status);
  const priorityClass = getPriorityStyle(data.priority);
  const isEditable = (data.status || "pending") === "pending";
  const StatusIcon = status.Icon;

  return (
    <motion.div
      variants={VARIANTS.item}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <Badge className={cn(status.bg, status.text, status.border)}>
            <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {status.label}
          </Badge>

          {isEditable && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(data._id)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Edit"
              >
                <FiEdit3 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(data._id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Delete"
              >
                <FiTrash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <Link
          to={`/complaints/${data._id}`}
          className="block group-hover:text-blue-600 transition-colors"
        >
          <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 line-clamp-1">
            {data.title}
          </h3>
        </Link>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
          {data.description || "No description provided."}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={priorityClass}>{data.priority || "Medium"}</Badge>
          <Badge className="bg-slate-50 text-slate-600 border-slate-200">
            {data.department || "General"}
          </Badge>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
          <span className="flex items-center gap-1">
            <FiCalendar className="w-3.5 h-3.5" aria-hidden="true" />
            {formatDate(data.createdAt)}
          </span>

          {(data.attachments?.length > 0 || data.comments?.length > 0) && (
            <div className="flex gap-3 pl-3 border-l border-slate-200">
              {data.attachments?.length > 0 && (
                <span className="flex items-center gap-1">
                  <FiPaperclip className="w-3.5 h-3.5" aria-hidden="true" />
                  {data.attachments.length}
                </span>
              )}
              {data.comments?.length > 0 && (
                <span className="flex items-center gap-1">
                  <FiMessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                  {data.comments.length}
                </span>
              )}
            </div>
          )}
        </div>

        <Link
          to={`/complaints/${data._id}`}
          className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:gap-2 transition-all"
        >
          View <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </motion.div>
  );
}

function StatusFilters({ filter, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 max-w-full">
      {FILTER_KEYS.map((key) => {
        const isActive = filter === key;
        const label = key === "all" ? "All Tickets" : getStatusStyle(key).label;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all border",
              isActive
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function MyComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const fetchComplaints = useCallback(async () => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get("/complaints/my", {
        signal: controller.signal,
      });
      const list = Array.isArray(res?.data)
        ? res.data
        : res?.data?.complaints || [];
      setComplaints(list);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      setError("Unable to load complaints");
      TOAST.error("Network error");
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cleanup = null;
    (async () => {
      cleanup = await fetchComplaints();
    })();
    return () => cleanup?.();
  }, [fetchComplaints]);

  useEffect(() => {
    const userId = user?._id;
    if (!userId) return;

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
          const msg = JSON.parse(e.data);
          const payload = msg?.data;
          if (!payload) return;
          if (payload.user && payload.user !== userId) return;

          if (msg.type === "UPDATED_COMPLAINT") {
            setComplaints((prev) =>
              prev.map((c) => (c._id === payload._id ? payload : c))
            );
          } else if (msg.type === "NEW_COMPLAINT") {
            setComplaints((prev) => [payload, ...prev]);
          } else if (msg.type === "DELETED_COMPLAINT") {
            setComplaints((prev) => prev.filter((c) => c._id !== payload._id));
          }
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
  }, [user?._id]);

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let resolved = 0;
    let rejected = 0;

    for (const c of complaints) {
      total += 1;
      const s = c.status || "pending";
      if (s === "pending") pending += 1;
      if (s === "resolved") resolved += 1;
      if (s === "rejected") rejected += 1;
    }

    return { total, pending, resolved, rejected };
  }, [complaints]);

  const filteredData = useMemo(() => {
    let res = complaints.slice();

    if (filter !== "all")
      res = res.filter((c) => (c.status || "pending") === filter);

    const q = search.trim().toLowerCase();
    if (q) {
      res = res.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) || c._id?.toLowerCase().includes(q)
      );
    }

    res.sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return sort === "oldest" ? tA - tB : tB - tA;
    });

    return res;
  }, [complaints, filter, search, sort]);

  const handleDelete = useCallback(async () => {
    const id = deleteModal.id;
    if (!id) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/complaints/${id}`);
      setComplaints((p) => p.filter((c) => c._id !== id));
      setDeleteModal({ open: false, id: null });
      TOAST.success("Deleted");
    } catch (err) {
      TOAST.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.id]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 overflow-x-hidden">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <span className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                  <FiFileText
                    className="text-white w-5 h-5"
                    aria-hidden="true"
                  />
                </span>
                My Complaints
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage and track your submissions
              </p>
            </div>

            <div className="flex items-center gap-6 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <StatItem
                label="Total"
                value={stats.total}
                colorClass="text-slate-900"
              />
              <div className="w-px h-8 bg-slate-200" />
              <StatItem
                label="Pending"
                value={stats.pending}
                colorClass="text-amber-600"
              />
              <div className="w-px h-8 bg-slate-200" />
              <StatItem
                label="Resolved"
                value={stats.resolved}
                colorClass="text-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          <StatusFilters filter={filter} onChange={setFilter} />

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative group flex-1 sm:w-80">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>

              <Link
                to="/complaints/new"
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 transition-all"
              >
                <FiPlus className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline">New Complaint</span>
                <span className="sm:hidden">New</span>
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="w-20 h-6 bg-slate-100 rounded-full" />
                  <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                </div>
                <div className="mt-4 w-3/4 h-6 bg-slate-100 rounded-md" />
                <div className="mt-3 w-full h-4 bg-slate-100 rounded-md" />
                <div className="mt-2 w-2/3 h-4 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-rose-100">
            <div className="p-4 bg-rose-50 rounded-full mb-4">
              <FiAlertCircle
                className="w-8 h-8 text-rose-500"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{error}</h3>
            <button
              type="button"
              onClick={fetchComplaints}
              className="mt-4 px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Try Again
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300"
          >
            <div className="p-6 bg-slate-50 rounded-full mb-6">
              <FiFilter
                className="w-10 h-10 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              No complaints found
            </h3>
            <p className="text-slate-500 mt-2 max-w-xs text-center">
              No results for the current filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setSearch("");
              }}
              className="mt-6 text-blue-600 font-semibold text-sm hover:underline"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={VARIANTS.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredData.map((item) => (
              <ComplaintCard
                key={item._id}
                data={item}
                onEdit={(id) => navigate(`/complaints/${id}/edit`)}
                onDelete={(id) => setDeleteModal({ open: true, id })}
              />
            ))}
          </motion.div>
        )}
      </main>

      <DeleteModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
