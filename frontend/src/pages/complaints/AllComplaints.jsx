// src/pages/complaints/AllComplaints.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { ComplaintAPI } from "../../api/api";
import {
  FiFileText,
  FiFilter,
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiArchive,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiMessageSquare,
  FiPaperclip,
  FiEye,
  FiAlertCircle,
} from "react-icons/fi";

/* ================================================================
   🎨 CONSTANTS & CONFIGS
   ================================================================ */

const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/complaints";
const WS_RECONNECT_INTERVAL = 5000;
const WS_MAX_RETRIES = 5;
const ADMIN_PAGE_SIZE = 12;
const USER_SHOWCASE_LIMIT = 12;

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: FiClock,
    gradient: "from-yellow-50 to-yellow-100",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: FiRefreshCw,
    gradient: "from-blue-50 to-blue-100",
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: FiCheckCircle,
    gradient: "from-green-50 to-green-100",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: FiX,
    gradient: "from-red-50 to-red-100",
  },
  closed: {
    label: "Closed",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: FiArchive,
    gradient: "from-gray-50 to-gray-100",
  },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-500 text-white" },
  medium: { label: "Medium", color: "bg-blue-500 text-white" },
  high: { label: "High", color: "bg-orange-500 text-white" },
  urgent: { label: "Urgent", color: "bg-red-500 text-white" },
};

const CATEGORY_COLORS = {
  IT: "bg-purple-100 text-purple-700 border-purple-200",
  Facilities: "bg-green-100 text-green-700 border-green-200",
  HR: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Finance: "bg-blue-100 text-blue-700 border-blue-200",
  Security: "bg-red-100 text-red-700 border-red-200",
};

/* ================================================================
   🛠️ UTILITY FUNCTIONS
   ================================================================ */

const formatDate = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: options.includeYear !== false ? "numeric" : undefined,
    ...options,
  });
};

const getTimeAgo = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const isOldComplaint = (dateString) => {
  if (!dateString) return false;
  const created = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return diffDays > 30;
};

/* ================================================================
   🎨 UI COMPONENTS
   ================================================================ */

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  onClick,
  active,
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`text-left bg-white rounded-2xl shadow-sm border p-5 flex flex-col justify-between transition-all ${
      active
        ? "border-blue-500 ring-2 ring-blue-100"
        : "border-gray-100 hover:shadow-md hover:border-blue-100"
    } ${onClick ? "cursor-pointer" : "cursor-default"}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="mt-1 text-3xl font-extrabold text-gray-900">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {accent && (
      <div className="mt-3">
        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
          {accent}
        </span>
      </div>
    )}
  </motion.button>
);

const StatusDistributionBar = ({ stats }) => {
  const segments = useMemo(() => {
    const total =
      stats.pending + stats.inProgress + stats.resolved + stats.rejected;
    if (!total) return [];

    return [
      {
        key: "pending",
        label: "Pending",
        value: stats.pending,
        color: "bg-yellow-400",
      },
      {
        key: "in_progress",
        label: "In Progress",
        value: stats.inProgress,
        color: "bg-blue-400",
      },
      {
        key: "resolved",
        label: "Resolved",
        value: stats.resolved,
        color: "bg-emerald-500",
      },
      {
        key: "rejected",
        label: "Rejected",
        value: stats.rejected,
        color: "bg-rose-400",
      },
    ]
      .filter((s) => s.value > 0)
      .map((s) => ({
        ...s,
        percent: Math.round((s.value / total) * 100),
      }));
  }, [stats]);

  if (!segments.length) {
    return (
      <p className="text-xs text-gray-500">
        No complaints yet. Submit a complaint to see live statistics.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 border border-gray-200">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`${seg.color} h-full transition-all duration-500`}
            style={{ width: `${seg.percent}%` }}
            title={`${seg.label}: ${seg.percent}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-gray-600">
        {segments.map((seg) => (
          <div key={seg.key} className="inline-flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${seg.color}`}
            />
            <span className="font-semibold">{seg.label}</span>
            <span className="text-gray-400">
              {seg.value} ({seg.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ComplaintCard = ({ complaint, canEdit = false }) => {
  const {
    _id,
    title,
    description,
    status,
    priority,
    department,
    location,
    createdAt,
    updatedAt,
    attachments = [],
    comments = [],
    user,
  } = complaint;

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = statusConfig.icon;
  const isOld = isOldComplaint(createdAt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
        isOld ? "border-l-4 border-gray-400" : ""
      }`}
    >
      <div
        className={`bg-gradient-to-r ${statusConfig.gradient} border-b border-gray-200 p-4`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className="text-lg font-bold text-gray-900 truncate"
                title={title}
              >
                {title}
              </h3>
              {isOld && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-semibold">
                  <FiArchive className="w-3 h-3" />
                  Old
                </span>
              )}
            </div>
            <p
              className="text-sm text-gray-600 line-clamp-2"
              title={description}
            >
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${priorityConfig.color} shadow-sm`}
            >
              {priorityConfig.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          {department && (
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                CATEGORY_COLORS[department] ||
                "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              <FiFileText className="w-3 h-3" />
              {department}
            </span>
          )}
          {attachments.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200">
              <FiPaperclip className="w-3 h-3" />
              {attachments.length} file{attachments.length > 1 ? "s" : ""}
            </span>
          )}
          {comments.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200">
              <FiMessageSquare className="w-3 h-3" />
              {comments.length} comment{comments.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <FiCalendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-700">Submitted</p>
              <p className="text-gray-600">{formatDate(createdAt)}</p>
              <p className="text-gray-500 text-[10px]">
                {getTimeAgo(createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FiClock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-700">Last Updated</p>
              <p className="text-gray-600">
                {formatDate(updatedAt, { includeYear: false })}
              </p>
              <p className="text-gray-500 text-[10px]">
                {getTimeAgo(updatedAt)}
              </p>
            </div>
          </div>

          {location && (
            <div className="flex items-start gap-2 col-span-2">
              <FiMapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-700">Location</p>
                <p className="text-gray-600">{location}</p>
              </div>
            </div>
          )}

          {user && (
            <div className="flex items-start gap-2 col-span-2">
              <FiUser className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-700">Reporter</p>
                <p className="text-gray-600">{user.name || "Anonymous"}</p>
                {user.email && (
                  <p className="text-gray-500 text-[10px]">{user.email}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            Complaint ID
          </p>
          <p className="text-xs font-mono font-semibold text-gray-700">{_id}</p>
        </div>
      </div>

      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex justify-between items-center">
        <p className="text-[11px] text-gray-500">
          {canEdit
            ? "Admin / staff can edit this complaint."
            : "Read-only showcase view."}
        </p>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              to={`/complaints/${_id}/edit`}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FiFileText className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
          <Link
            to={`/complaints/${_id}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <FiEye className="w-4 h-4" />
            View Details
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

/* ================================================================
   🔌 WEBSOCKET HOOK
   ================================================================ */

const useWebSocket = (onMessage, enabled = true) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retriesRef = useRef(0);
  const mountedRef = useRef(true);
  const [wsStatus, setWsStatus] = useState("disconnected");

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      setWsStatus("connecting");

      const token = localStorage.getItem("accessToken");
      const wsUrl = `${WS_URL}${token ? `?token=${token}` : ""}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }

        setWsStatus("connected");
        retriesRef.current = 0;
        ws.send(JSON.stringify({ type: "subscribe", channel: "complaints" }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          // Silent error
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setWsStatus("error");
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;

        setWsStatus("disconnected");
        wsRef.current = null;

        if (
          event.code !== 1000 &&
          retriesRef.current < WS_MAX_RETRIES &&
          mountedRef.current
        ) {
          retriesRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, WS_RECONNECT_INTERVAL);
        } else if (retriesRef.current >= WS_MAX_RETRIES) {
          toast.error(
            "Real-time updates disconnected. Please refresh the page.",
            { toastId: "ws-max-retries" }
          );
        }
      };

      wsRef.current = ws;
    } catch (error) {
      setWsStatus("error");
    }
  }, [onMessage, enabled]);

  const disconnect = useCallback(() => {
    mountedRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Component unmounted");
      wsRef.current = null;
    }

    setWsStatus("disconnected");
  }, []);

  useEffect(() => {
    if (enabled) {
      mountedRef.current = true;
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return { wsStatus, reconnect: connect };
};

/* ================================================================
   🚀 MAIN COMPONENT
   ================================================================ */

const AllComplaints = () => {
  const { user, loading: authLoading } = useAuth();
  const isAdminOrStaff = user && ["admin", "staff"].includes(user.role);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await ComplaintAPI.getAll();

      if (!response.success) {
        throw new Error(response.message || "Failed to load complaints");
      }

      const list = Array.isArray(response.data) ? response.data : [];
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setComplaints(list);
    } catch (error) {
      if (error.status !== 401 && error.status !== 429) {
        toast.error(
          error.message || "Failed to load complaints. Please try again.",
          { toastId: "fetch-complaints-error" }
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // WebSocket handler
  const handleWebSocketMessage = useCallback((message) => {
    switch (message.type) {
      case "connection":
      case "subscribed":
      case "pong":
        break;

      case "complaint_created":
        setComplaints((prev) => {
          const exists = prev.some((c) => c._id === message.data._id);
          if (exists) return prev;

          toast.success("New complaint received!", {
            toastId: `new-${message.data._id}`,
          });

          return [message.data, ...prev].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        });
        break;

      case "complaint_updated":
        setComplaints((prev) =>
          prev.map((c) => (c._id === message.data._id ? message.data : c))
        );
        toast.info("Complaint updated", {
          toastId: `update-${message.data._id}`,
        });
        break;

      case "complaint_deleted":
        setComplaints((prev) => prev.filter((c) => c._id !== message.data._id));
        toast.info("Complaint deleted", {
          toastId: `delete-${message.data._id}`,
        });
        break;

      default:
        break;
    }
  }, []);

  // Initialize WebSocket only when user is authenticated
  const { wsStatus, reconnect } = useWebSocket(handleWebSocketMessage, !!user);

  // Fetch on mount
  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [fetchComplaints, user]);

  // ✅ Calculate statistics - THIS WAS MISSING
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === "pending").length;
    const inProgress = complaints.filter(
      (c) => c.status === "in_progress"
    ).length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const rejected = complaints.filter((c) => c.status === "rejected").length;
    const archived = complaints.filter((c) =>
      isOldComplaint(c.createdAt)
    ).length;

    const open = pending + inProgress;
    const solved = resolved;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      archived,
      open,
      solved,
      resolutionRate,
    };
  }, [complaints]);

  // Filter and search
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    if (filter !== "all") {
      result = result.filter((c) => c.status === filter);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(search) ||
          c.description?.toLowerCase().includes(search) ||
          c.department?.toLowerCase().includes(search) ||
          c._id?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [complaints, filter, searchTerm]);

  // Pagination
  const totalPages = isAdminOrStaff
    ? Math.max(1, Math.ceil(filteredComplaints.length / ADMIN_PAGE_SIZE))
    : 1;

  const safePage = Math.min(currentPage, totalPages);

  const displayComplaints = isAdminOrStaff
    ? filteredComplaints.slice(
        (safePage - 1) * ADMIN_PAGE_SIZE,
        safePage * ADMIN_PAGE_SIZE
      )
    : filteredComplaints.slice(0, USER_SHOWCASE_LIMIT);

  // Reset page when filters change
  useEffect(() => {
    if (isAdminOrStaff) {
      setCurrentPage(1);
      setPageInput("");
    }
  }, [filter, searchTerm, isAdminOrStaff]);

  const handleGoToPage = () => {
    const n = parseInt(pageInput, 10);
    if (!Number.isNaN(n)) {
      const clamped = Math.max(1, Math.min(totalPages, n));
      setCurrentPage(clamped);
    }
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <FiAlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to view and manage complaints.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiUser className="w-5 h-5" />
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Data loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* WebSocket Status */}
        {wsStatus !== "connected" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              wsStatus === "connecting"
                ? "bg-blue-50 border-blue-200"
                : wsStatus === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
            } border rounded-lg p-3 flex items-center justify-between`}
          >
            <div className="flex items-center gap-2 text-sm">
              <FiAlertCircle
                className={`w-4 h-4 ${
                  wsStatus === "connecting"
                    ? "text-blue-600"
                    : wsStatus === "error"
                      ? "text-red-600"
                      : "text-yellow-600"
                }`}
              />
              <span
                className={
                  wsStatus === "connecting"
                    ? "text-blue-800"
                    : wsStatus === "error"
                      ? "text-red-800"
                      : "text-yellow-800"
                }
              >
                {wsStatus === "connecting" && (
                  <>
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" />
                    Connecting to real-time updates...
                  </>
                )}
                {wsStatus === "error" && "Real-time connection error"}
                {wsStatus === "disconnected" &&
                  "Real-time updates disconnected"}
              </span>
            </div>
            {wsStatus === "error" && (
              <button
                onClick={reconnect}
                className="text-xs font-semibold text-red-700 hover:text-red-900 underline flex items-center gap-1"
              >
                <FiRefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </motion.div>
        )}

        {/* Billboard */}
        <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl text-white px-6 py-6 sm:px-10 sm:py-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase text-blue-100 tracking-[0.2em]">
                  Complaint Resolution Overview
                </p>
                {wsStatus === "connected" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-400/30 rounded-full text-[10px] font-semibold">
                    <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {stats.total > 0
                  ? "This portal is actively resolving complaints."
                  : "No complaints yet. Your portal is ready."}
              </h1>
              <p className="text-sm sm:text-base text-blue-100/90">
                Track how many complaints are raised, worked on, and
                successfully resolved across the system.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">
                  Total Complaints
                </p>
                <p className="mt-1 text-3xl font-extrabold">{stats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">
                  Solved
                </p>
                <p className="mt-1 text-3xl font-extrabold text-emerald-200">
                  {stats.solved}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 col-span-2 sm:col-span-1">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">
                  Resolution Rate
                </p>
                <p className="mt-1 text-3xl font-extrabold">
                  {stats.resolutionRate}%
                </p>
                <div className="mt-2 h-1.5 w-full bg-blue-900/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-300 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.resolutionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Open Complaints"
            value={stats.open}
            subtitle="Pending + In Progress"
            icon={FiRefreshCw}
            accent={
              stats.total > 0
                ? `${Math.round((stats.open / stats.total) * 100)}% of all complaints`
                : undefined
            }
            onClick={isAdminOrStaff ? () => setFilter("all") : undefined}
            active={isAdminOrStaff && filter === "all"}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for action"
            icon={FiClock}
            onClick={isAdminOrStaff ? () => setFilter("pending") : undefined}
            active={isAdminOrStaff && filter === "pending"}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            subtitle="Actively being resolved"
            icon={FiRefreshCw}
            onClick={
              isAdminOrStaff ? () => setFilter("in_progress") : undefined
            }
            active={isAdminOrStaff && filter === "in_progress"}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status Distribution
              </p>
              <span className="text-[11px] text-gray-400">
                All current complaints
              </span>
            </div>
            <StatusDistributionBar stats={stats} />
          </motion.div>
        </section>

        {/* Filters */}
        {isAdminOrStaff && (
          <section className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiFilter className="h-5 w-5 text-gray-500" />
                Filter & Search
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by title, department or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>

              <div className="flex flex-col justify-center text-xs text-gray-500">
                <p>
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {filteredComplaints.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-900">
                    {complaints.length}
                  </span>{" "}
                  complaints.
                </p>
                <p className="mt-1">
                  Last updated{" "}
                  <span className="font-semibold text-gray-700">
                    {complaints[0] ? getTimeAgo(complaints[0].updatedAt) : "—"}
                  </span>
                  .
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Complaints Grid */}
        <AnimatePresence mode="wait">
          {displayComplaints.length === 0 ? (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl shadow-md p-12 text-center"
            >
              <FiFileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Complaints Found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "No complaints have been submitted yet."}
              </p>
            </motion.section>
          ) : (
            <>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayComplaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint._id}
                    complaint={complaint}
                    canEdit={isAdminOrStaff}
                  />
                ))}
              </section>

              {/* Pagination */}
              {isAdminOrStaff && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      Page{" "}
                      <span className="font-semibold text-gray-900">
                        {safePage}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-gray-900">
                        {totalPages}
                      </span>
                    </span>
                    <span className="hidden sm:inline-block mx-1 text-gray-400">
                      |
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Go to page:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleGoToPage();
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={safePage.toString()}
                      />
                      <button
                        onClick={handleGoToPage}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Go
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safePage === totalPages}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              {!isAdminOrStaff && (
                <p className="pt-2 text-xs text-center text-gray-500">
                  Showing top {USER_SHOWCASE_LIMIT} recent complaints for
                  showcase. Log in as staff or admin to explore all complaints
                  in detail.
                </p>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default AllComplaints;
