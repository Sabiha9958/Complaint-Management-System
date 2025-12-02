// src/pages/NotificationsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { NotificationAPI } from "../../api/api"; // ✅ use centralized API

// Local demo notifications (fallback / always shown if API empty)
const initialNotifications = [
  {
    id: "n1",
    title: "New complaint assigned",
    message: "You have been assigned complaint CMP-1023.",
    type: "info",
    createdAt: "2025-11-30T08:05:00Z",
    isRead: false,
  },
  {
    id: "n2",
    title: "Complaint resolved",
    message: "Complaint CMP-1018 has been marked as resolved.",
    type: "success",
    createdAt: "2025-11-30T07:40:00Z",
    isRead: false,
  },
  {
    id: "n3",
    title: "High priority complaint",
    message: "Complaint CMP-1015 is waiting for your response.",
    type: "warning",
    createdAt: "2025-11-29T20:15:00Z",
    isRead: true,
  },
  {
    id: "n4",
    title: "System update",
    message: "Background maintenance was completed successfully.",
    type: "info",
    createdAt: "2025-11-29T18:00:00Z",
    isRead: true,
  },
];

export default function NotificationsPage() {
  const { user, isInitialized } = useAuth();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("all"); // all | unread | read
  const [loading, setLoading] = useState(false);

  // ---- LOAD REAL NOTIFICATIONS FROM API ----
  const fetchNotifications = useCallback(async () => {
    if (!user) return; // ProtectedRoute should already guard this

    setLoading(true);
    try {
      const res = await NotificationAPI.getAll(); // ✅ uses correct endpoint
      if (!res.success) {
        throw new Error(res.message || "Failed to load notifications");
      }

      const raw = res.data;
      const apiData = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

      if (!apiData.length) {
        // No API data: keep existing (demo) notifications
        setLoading(false);
        return;
      }

      const mappedApi = apiData.map((n) => ({
        id: n.id || n._id || `api-${n.createdAt || Date.now()}`,
        title: n.title || n.subject || "Notification",
        message: n.message || n.body || "",
        type: n.type || n.level || "info", // "info" | "success" | "warning" | "error"
        createdAt: n.createdAt || new Date().toISOString(),
        isRead:
          typeof n.isRead === "boolean" ? n.isRead : n.readAt ? true : false,
      }));

      // Prefer backend data; you can prepend demo notifications if you want
      setNotifications(mappedApi);
    } catch (error) {
      toast.error(error.message || "Failed to load notifications.", {
        toastId: "notif-load-error",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isInitialized && user) {
      fetchNotifications();
    }
  }, [isInitialized, user, fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    if (filter === "read") return notifications.filter((n) => n.isRead);
    return notifications;
  }, [notifications, filter]);

  const handleMarkAllRead = async () => {
    if (!notifications.length) return;
    try {
      // Best-effort backend update
      await NotificationAPI.markAllAsRead().catch(() => {});
    } finally {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleClearAll = async () => {
    if (!notifications.length) return;
    try {
      await NotificationAPI.deleteAll().catch(() => {});
    } finally {
      setNotifications([]);
    }
  };

  const handleToggleRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );

    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) {
      // Only call backend when marking as read
      try {
        await NotificationAPI.markAsRead(id).catch(() => {});
      } catch {
        // ignore errors, UI already updated optimistically
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600">
            Stay up to date with the latest activity and alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-blue-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {unreadCount} unread
          </span>

          <button
            onClick={handleMarkAllRead}
            className="rounded-md border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
          <button
            onClick={handleClearAll}
            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            disabled={notifications.length === 0}
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
        <div className="inline-flex gap-1 rounded-md bg-gray-100 p-1 text-xs">
          <FilterChip
            label="All"
            isActive={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label="Unread"
            isActive={filter === "unread"}
            onClick={() => setFilter("unread")}
            badge={unreadCount}
          />
          <FilterChip
            label="Read"
            isActive={filter === "read"}
            onClick={() => setFilter("read")}
          />
        </div>
        <p className="text-[11px] text-gray-500">
          {loading
            ? "Loading your latest notifications..."
            : "Notifications are ordered from newest to oldest."}
        </p>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          filteredNotifications
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onToggleRead={() => handleToggleRead(n.id)}
              />
            ))
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------
// Sub‑components (light theme)
// --------------------------------------------------

function FilterChip({ label, isActive, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "bg-transparent text-gray-600 hover:bg-gray-200"
      }`}
    >
      <span>{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span
          className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full text-[10px] ${
            isActive ? "bg-white text-blue-700" : "bg-gray-300 text-gray-800"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function NotificationItem({ notification, onToggleRead }) {
  const { title, message, type, createdAt, isRead } = notification;
  const { icon, iconBg, borderColor, dotColor } = getTypeConfig(type);

  const timeString = new Date(createdAt).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3 transition-colors shadow-sm ${
        isRead ? "border-gray-200 bg-white" : "border-blue-200 bg-blue-50"
      }`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${iconBg}`}
      >
        <span className="text-xs">{icon}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-gray-900">
                {title}
              </h2>
              {!isRead && (
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-700">{message}</p>
          </div>
          <span className="whitespace-nowrap text-[10px] text-gray-500">
            {timeString}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${borderColor} text-gray-700 bg-white`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            {typeLabel(type)}
          </span>

          <button
            onClick={onToggleRead}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {isRead ? "Mark as unread" : "Mark as read"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 border border-gray-200">
        🔔
      </div>
      <h2 className="text-sm font-medium text-gray-900">
        You are all caught up
      </h2>
      <p className="max-w-sm text-xs text-gray-600">
        There are no notifications to show right now. Any new activity will
        appear here instantly.
      </p>
    </div>
  );
}

function getTypeConfig(type) {
  switch (type) {
    case "success":
      return {
        icon: "✔",
        iconBg: "bg-emerald-50 text-emerald-600",
        borderColor: "border-emerald-200",
        dotColor: "bg-emerald-500",
      };
    case "warning":
      return {
        icon: "⚠",
        iconBg: "bg-amber-50 text-amber-600",
        borderColor: "border-amber-200",
        dotColor: "bg-amber-500",
      };
    case "error":
      return {
        icon: "✖",
        iconBg: "bg-rose-50 text-rose-600",
        borderColor: "border-rose-200",
        dotColor: "bg-rose-500",
      };
    default:
      return {
        icon: "ℹ",
        iconBg: "bg-sky-50 text-sky-600",
        borderColor: "border-sky-200",
        dotColor: "bg-sky-500",
      };
  }
}

function typeLabel(type) {
  switch (type) {
    case "success":
      return "Success";
    case "warning":
      return "Important";
    case "error":
      return "Error";
    default:
      return "Information";
  }
}
