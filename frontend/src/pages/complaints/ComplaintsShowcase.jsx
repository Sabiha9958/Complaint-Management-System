import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
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
  FiSearch,
  FiWifi,
  FiWifiOff,
  FiMaximize2,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

const buildWsUrl = () => {
  if (!API_URL) throw new Error("VITE_API_URL is missing");
  const u = new URL(API_URL);
  const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${u.host}/ws/complaints`;
};

const WS_URL = import.meta.env.VITE_WS_URL?.trim() || buildWsUrl();

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    Icon: FiClock,
    badge: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In Progress",
    Icon: FiRefreshCw,
    badge: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  resolved: {
    label: "Resolved",
    Icon: FiCheckCircle,
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    Icon: FiX,
    badge: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  closed: {
    label: "Closed",
    Icon: FiArchive,
    badge: "bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20",
    border: "border-slate-200",
    dot: "bg-slate-500",
  },
};

const BOARD_COLUMNS = Object.keys(STATUS_CONFIG);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getSafeStatus = (status) => (STATUS_CONFIG[status] ? status : "pending");

function extractComplaintList(res) {
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.complaints)) return d.complaints;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  if (Array.isArray(d?.data?.complaints)) return d.data.complaints;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

function normalizeList(list) {
  return list
    .filter((x) => x && x._id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 200);
}

function upsertById(prev, item) {
  const idx = prev.findIndex((x) => x._id === item._id);
  if (idx === -1) return [item, ...prev];
  const copy = [...prev];
  copy[idx] = item;
  return copy;
}

function computeNextDelay(attempt) {
  const base = Math.min(15000, 1000 * Math.pow(2, attempt));
  const jitter = Math.floor(Math.random() * 300);
  return base + jitter;
}

function useRealTimeComplaints() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("loading");
  const [socketStatus, setSocketStatus] = useState("disconnected");

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const aliveRef = useRef(false);
  const attemptRef = useRef(0);

  const cleanup = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await ComplaintAPI.getAll();
      const list = extractComplaintList(res);
      setData(normalizeList(list));
      setStatus("success");
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setStatus("error");
    }
  }, []);

  const handleMessage = useCallback((raw) => {
    try {
      const msg = JSON.parse(raw);
      const payload = msg?.data;
      const type = msg?.type;

      if (!payload?._id) return;

      setData((prev) => {
        const base = normalizeList(prev);

        const createdTypes = new Set(["complaint_created", "NEW_COMPLAINT"]);
        const updatedTypes = new Set([
          "complaint_updated",
          "UPDATED_COMPLAINT",
        ]);
        const deletedTypes = new Set([
          "complaint_deleted",
          "DELETED_COMPLAINT",
        ]);

        if (createdTypes.has(type) || updatedTypes.has(type)) {
          return normalizeList(upsertById(base, payload));
        }

        if (deletedTypes.has(type)) {
          return normalizeList(base.filter((c) => c._id !== payload._id));
        }

        return base;
      });
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
    }
  }, []);

  const connect = useCallback(() => {
    if (!aliveRef.current) return;

    cleanup();
    setSocketStatus("connecting");

    let ws;
    try {
      ws = new WebSocket(WS_URL);
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setSocketStatus("disconnected");
      reconnectRef.current = setTimeout(
        connect,
        computeNextDelay(attemptRef.current++)
      );
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      if (!aliveRef.current) return;
      attemptRef.current = 0;
      setSocketStatus("connected");
      try {
        ws.send(JSON.stringify({ type: "subscribe", channel: "complaints" }));
      } catch (err) {
        console.error("Failed to send subscribe message:", err);
      }
    };

    ws.onmessage = (e) => handleMessage(e.data);

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      try {
        ws.close();
      } catch {}
    };

    ws.onclose = () => {
      if (!aliveRef.current) return;
      setSocketStatus("disconnected");
      reconnectRef.current = setTimeout(
        connect,
        computeNextDelay(attemptRef.current++)
      );
    };
  }, [cleanup, handleMessage]);

  useEffect(() => {
    aliveRef.current = true;
    refresh();
    connect();

    return () => {
      aliveRef.current = false;
      cleanup();
    };
  }, [cleanup, connect, refresh]);

  return { data, status, socketStatus, refresh };
}

const StatusBadge = React.memo(function StatusBadge({ status, size = "sm" }) {
  const cfg = STATUS_CONFIG[getSafeStatus(status)];
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ring-1 ${cfg.badge} ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span
        className={`rounded-full animate-pulse ${cfg.dot} ${
          size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
        }`}
      />
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {cfg.label}
    </span>
  );
});

function DetailModal({ complaint, onClose }) {
  if (!complaint) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {complaint.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              ID: {complaint._id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <StatusBadge status={complaint.status} size="md" />
          <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100">
            {complaint.description || "No description provided."}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FiCalendar className="w-4 h-4" />
            Created on {formatDate(complaint.createdAt)}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const ComplaintCard = forwardRef(function ComplaintCard(
  { data, onClick },
  ref
) {
  const handleClick = () => onClick(data);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(data);
    }
  };

  return (
    <motion.div
      ref={ref}
      layoutId={data._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer transition-all duration-200 hover:border-indigo-200"
      role="button"
      tabIndex={0}
      aria-label={`View complaint: ${data.title}`}
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <StatusBadge status={data.status} />
        <time
          className="text-[10px] text-gray-400 font-medium font-mono shrink-0"
          dateTime={data.createdAt}
        >
          {formatDate(data.createdAt).split(",")[0]}
        </time>
      </div>

      <h4 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
        {data.title}
      </h4>

      <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
        {data.description || "No description provided."}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex -space-x-2">
          <div
            className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white"
            aria-hidden="true"
          />
        </div>
        <span
          className="text-gray-400 group-hover:text-indigo-600 transition-colors"
          aria-label="Expand"
        >
          <FiMaximize2 className="w-3.5 h-3.5" />
        </span>
      </div>
    </motion.div>
  );
});

const KanbanColumn = React.memo(function KanbanColumn({
  status,
  items,
  onCardClick,
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.Icon;

  return (
    <div className="flex flex-col h-full min-w-[280px] w-full sm:w-[320px] shrink-0">
      <div
        className={`flex items-center justify-between p-3 mb-3 rounded-lg border bg-white/50 backdrop-blur-sm ${cfg.border}`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 opacity-70" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-wider opacity-80">
            {cfg.label}
          </h2>
        </div>
        <span
          className="bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100"
          aria-label={`${items.length} items`}
        >
          {items.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-20">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <ComplaintCard key={item._id} data={item} onClick={onCardClick} />
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <FiArchive className="w-6 h-6 mb-2 opacity-50" aria-hidden="true" />
            <span className="text-xs font-medium">No items</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default function ComplaintsBoard() {
  const { data, status, socketStatus, refresh } = useRealTimeComplaints();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const grouped = useMemo(() => {
    const groups = BOARD_COLUMNS.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});
    filteredData.forEach((c) => {
      groups[getSafeStatus(c.status)].push(c);
    });
    return groups;
  }, [filteredData]);

  const stats = useMemo(() => {
    const initial = { total: data.length, pending: 0, resolved: 0 };
    return data.reduce((acc, c) => {
      if (c.status === "pending") acc.pending++;
      if (c.status === "resolved") acc.resolved++;
      return acc;
    }, initial);
  }, [data]);

  return (
    <div className="h-screen w-full bg-[#f8fafc] text-gray-900 flex flex-col overflow-hidden font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-20">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 flex items-center gap-2">
            <FiActivity className="text-indigo-600" aria-hidden="true" />
            ComplaintOps
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Real-time Issue Tracking System
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="hidden lg:flex items-center gap-2 mr-4 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"
            role="status"
            aria-live="polite"
          >
            <span>
              Total: <strong className="text-gray-900">{stats.total}</strong>
            </span>
            <span className="w-px h-3 bg-gray-300 mx-1" aria-hidden="true" />
            <span className="text-amber-600">Pending: {stats.pending}</span>
            <span className="w-px h-3 bg-gray-300 mx-1" aria-hidden="true" />
            <span className="text-emerald-600">Resolved: {stats.resolved}</span>
          </div>

          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none" />
            <input
              type="search"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-100 border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg text-sm w-48 transition-all outline-none"
              aria-label="Search complaints"
            />
          </div>

          <div
            title={
              socketStatus === "connected" ? "Live updates active" : "Offline"
            }
            className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-colors ${
              socketStatus === "connected"
                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : socketStatus === "connecting"
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
            role="status"
            aria-label={`Connection status: ${socketStatus}`}
          >
            {socketStatus === "connected" ? (
              <FiWifi className="w-4 h-4" />
            ) : (
              <FiWifiOff className="w-4 h-4" />
            )}
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={status === "loading"}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-gray-200"
            title="Refresh complaints"
            aria-label="Refresh complaints"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${status === "loading" ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {status === "error" ? (
          <div
            className="h-full flex flex-col items-center justify-center text-center"
            role="alert"
          >
            <div className="bg-red-50 p-4 rounded-full mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Failed to load board
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={refresh}
              className="text-indigo-600 font-semibold text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex h-full gap-6 min-w-max pb-4">
            {BOARD_COLUMNS.map((colKey) => (
              <KanbanColumn
                key={colKey}
                status={colKey}
                items={grouped[colKey]}
                onCardClick={setSelected}
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selected && (
          <DetailModal complaint={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
