import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComplaintAPI } from "../../api/complaints";
import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiX,
  FiArchive,
  FiAlertTriangle,
  FiPackage,
} from "react-icons/fi";

/* ================================================================
   CONFIGURATION
   ================================================================ */

const LIMIT = 50;
const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/complaints";
const WS_RECONNECT_INTERVAL = 5000;
const WS_MAX_RETRIES = 5;

const STATUS_META = {
  pending: {
    label: "Pending",
    Icon: FiClock,
    chip: "bg-amber-50 text-amber-800 border-amber-300",
    dot: "bg-amber-500",
    colRing: "ring-amber-300/50",
    colBg: "bg-gradient-to-br from-amber-50 to-orange-50",
    accent: "text-amber-600",
  },
  in_progress: {
    label: "In Progress",
    Icon: FiRefreshCw,
    chip: "bg-blue-50 text-blue-800 border-blue-300",
    dot: "bg-blue-500",
    colRing: "ring-blue-300/50",
    colBg: "bg-gradient-to-br from-blue-50 to-cyan-50",
    accent: "text-blue-600",
  },
  resolved: {
    label: "Resolved",
    Icon: FiCheckCircle,
    chip: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dot: "bg-emerald-500",
    colRing: "ring-emerald-300/50",
    colBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    accent: "text-emerald-600",
  },
  rejected: {
    label: "Rejected",
    Icon: FiX,
    chip: "bg-rose-50 text-rose-800 border-rose-300",
    dot: "bg-rose-500",
    colRing: "ring-rose-300/50",
    colBg: "bg-gradient-to-br from-rose-50 to-pink-50",
    accent: "text-rose-600",
  },
  closed: {
    label: "Closed",
    Icon: FiArchive,
    chip: "bg-slate-50 text-slate-800 border-slate-300",
    dot: "bg-slate-500",
    colRing: "ring-slate-300/50",
    colBg: "bg-gradient-to-br from-slate-50 to-gray-50",
    accent: "text-slate-600",
  },
};

const BOARD_ORDER = [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
  "closed",
];

/* ================================================================
   UTILITIES
   ================================================================ */

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diff = Math.max(0, now - past);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const safeStatus = (status) => (STATUS_META[status] ? status : "pending");

const normalizeList = (list) => {
  const safe = Array.isArray(list) ? list : [];
  const sorted = [...safe].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return sorted.slice(0, LIMIT);
};

/* ================================================================
   COMPONENTS
   ================================================================ */

const ComplaintCard = React.forwardRef(function ComplaintCard(
  { complaint, index },
  ref
) {
  const status = safeStatus(complaint?.status);
  const meta = STATUS_META[status];
  const StatusIcon = meta.Icon;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group rounded-2xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 p-4 cursor-default"
      role="article"
      aria-label="Complaint card"
    >
      {/* Header with status badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
            {complaint?.title || "Untitled complaint"}
          </h4>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-bold ${meta.chip}`}
        >
          <span className={`h-2 w-2 rounded-full ${meta.dot} animate-pulse`} />
          {meta.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-3">
        {complaint?.description || "No description provided."}
      </p>

      {/* Footer metadata */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
          <FiCalendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-medium">
            {formatDateTime(complaint?.createdAt)}
          </span>
        </span>

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${meta.accent}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {timeAgo(complaint?.createdAt)}
        </span>
      </div>
    </motion.article>
  );
});

const SkeletonCard = () => (
  <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 animate-pulse">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-6 w-20 bg-gray-200 rounded-full" />
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="h-3 bg-gray-200 rounded w-24" />
      <div className="h-3 bg-gray-200 rounded w-16" />
    </div>
  </div>
);

const Column = ({ statusKey, items, loading }) => {
  const meta = STATUS_META[statusKey];
  const Icon = meta.Icon;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-3xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden ring-2 ${meta.colRing}`}
    >
      {/* Column Header */}
      <header className={`px-5 py-4 ${meta.colBg} border-b-2 border-gray-200`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`rounded-xl bg-white border-2 border-gray-200 p-2.5 shadow-sm ${meta.accent}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-gray-900 truncate uppercase tracking-wide">
                {meta.label}
              </h3>
              <p className="text-[11px] text-gray-600 font-medium">
                {items.length} {items.length === 1 ? "complaint" : "complaints"}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold ${meta.chip}`}
          >
            {items.length}
          </span>
        </div>
      </header>

      {/* Column Body with max height and scroll */}
      <div className="p-4 space-y-3 max-h-[60vh] sm:max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center"
          >
            <FiPackage className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-xs font-semibold text-gray-500">
              No complaints yet
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((c, idx) => (
              <ComplaintCard key={c._id} complaint={c} index={idx} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.section>
  );
};

const LiveStatusBadge = ({ wsStatus, onReconnect }) => {
  const config = {
    connected: {
      label: "Live",
      icon: FiActivity,
      style: "bg-emerald-50 text-emerald-800 border-emerald-300",
      dot: "bg-emerald-500 animate-pulse",
    },
    connecting: {
      label: "Connecting...",
      icon: FiRefreshCw,
      style: "bg-blue-50 text-blue-800 border-blue-300",
      dot: "bg-blue-500 animate-spin",
    },
    disconnected: {
      label: "Offline",
      icon: FiAlertTriangle,
      style: "bg-amber-50 text-amber-800 border-amber-300",
      dot: "bg-amber-500",
    },
    error: {
      label: "Error",
      icon: FiAlertCircle,
      style: "bg-rose-50 text-rose-800 border-rose-300",
      dot: "bg-rose-500",
    },
  };

  const current = config[wsStatus] || config.disconnected;
  const Icon = current.icon;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-bold ${current.style}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
        <Icon className="h-4 w-4" />
        {current.label}
      </span>

      {wsStatus === "error" && (
        <button
          onClick={onReconnect}
          className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
        >
          <FiRefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function ComplaintsShowcase() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState("disconnected");

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retriesRef = useRef(0);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ComplaintAPI.getAll();
      const payload = response?.data ?? response;
      const rawList =
        payload?.data ?? payload?.complaints ?? payload?.results ?? payload;
      setComplaints(normalizeList(rawList));
    } catch (err) {
      console.error("Fetch error:", err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

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
        setWsStatus("connected");
        retriesRef.current = 0;
        ws.send(JSON.stringify({ type: "subscribe", channel: "complaints" }));
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg?.type === "complaint_created" && msg?.data?._id) {
          setComplaints((prev) => normalizeList([msg.data, ...prev]));
        }

        if (msg?.type === "complaint_updated" && msg?.data?._id) {
          setComplaints((prev) =>
            normalizeList(
              prev.map((c) => (c._id === msg.data._id ? msg.data : c))
            )
          );
        }

        if (msg?.type === "complaint_deleted" && msg?.data?._id) {
          setComplaints((prev) =>
            normalizeList(prev.filter((c) => c._id !== msg.data._id))
          );
        }
      };

      ws.onerror = () => setWsStatus("error");

      ws.onclose = (event) => {
        setWsStatus("disconnected");
        wsRef.current = null;

        if (event.code !== 1000 && retriesRef.current < WS_MAX_RETRIES) {
          retriesRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(
            connectWS,
            WS_RECONNECT_INTERVAL
          );
        }
      };

      wsRef.current = ws;
    } catch {
      setWsStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    connectWS();
    return () => {
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close(1000, "Unmount");
      wsRef.current = null;
    };
  }, [connectWS]);

  const counts = useMemo(() => {
    const base = {
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      closed: 0,
    };
    for (const c of complaints) base[safeStatus(c.status)] += 1;
    return base;
  }, [complaints]);

  const grouped = useMemo(() => {
    const map = {
      pending: [],
      in_progress: [],
      resolved: [],
      rejected: [],
      closed: [],
    };
    for (const c of complaints) map[safeStatus(c.status)].push(c);

    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return map;
  }, [complaints]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border-2 border-gray-200 bg-white/90 backdrop-blur-lg p-6 shadow-xl"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                🗂️ Complaints Bulletin Board
              </h1>
              <p className="mt-2 text-sm text-gray-600 font-medium">
                Latest <span className="font-bold text-gray-900">{LIMIT}</span>{" "}
                complaints (newest first). Real-time updates enabled. Read-only
                showcase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LiveStatusBadge wsStatus={wsStatus} onReconnect={connectWS} />

              {BOARD_ORDER.map((k) => {
                const meta = STATUS_META[k];
                return (
                  <span
                    key={k}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold ${meta.chip}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    {meta.label}: {counts[k]}
                  </span>
                );
              })}
            </div>
          </div>
        </motion.header>

        {/* Board */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              {BOARD_ORDER.map((statusKey) => (
                <Column
                  key={statusKey}
                  statusKey={statusKey}
                  items={[]}
                  loading={true}
                />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border-2 border-gray-200 bg-white p-16 text-center shadow-xl"
            >
              <FiAlertCircle className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-bold text-gray-800 mb-2">
                No complaints found
              </p>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                If your backend returns data, verify the API response structure
                in the Network tab.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              {BOARD_ORDER.map((statusKey) => (
                <Column
                  key={statusKey}
                  statusKey={statusKey}
                  items={grouped[statusKey]}
                  loading={false}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
`}</style>
    </main>
  );
}
