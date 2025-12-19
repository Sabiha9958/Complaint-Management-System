// src/pages/NotificationsPage.jsx
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

// ---- REALISTIC DUMMY DATA ----
const DUMMY_NOTIFICATIONS = [
  {
    id: "notif-1",
    complaintId: "CMP-2025-089",
    category: "Internet/WiFi",
    status: "resolved",
    summary:
      "Your complaint regarding Block-B WiFi connectivity has been resolved.",
    details:
      "The IT support team has replaced the faulty router on the 2nd floor of Block-B. Signal strength has been restored to optimal levels. Please reconnect your devices.",
    adminComment: "Ticket closed by Admin (Rajesh Kumar).",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    isRead: false,
  },
  {
    id: "notif-2",
    complaintId: "CMP-2025-082",
    category: "Hostel Maintenance",
    status: "in_progress",
    summary: "Maintenance team has been assigned to your request.",
    details:
      "Your request regarding the broken window latch in Room 304 has been acknowledged. A carpenter has been assigned and will visit your room tomorrow between 10:00 AM and 12:00 PM.",
    adminComment: "Assigned to Maintenance Staff: Suresh Singh.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    isRead: false,
  },
  {
    id: "notif-3",
    complaintId: "CMP-2025-075",
    category: "Mess/Canteen",
    status: "rejected",
    summary: "Complaint regarding lunch quality rejected.",
    details:
      "Your complaint was reviewed. However, it was rejected because it lacked specific details (date of incident, specific food item). Please file a new complaint with more evidence or details.",
    adminComment: "Rejection Reason: Insufficient Information.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
  },
  {
    id: "notif-4",
    complaintId: "CMP-2025-060",
    category: "Academic",
    status: "on_hold",
    summary: "Request for re-evaluation put on hold.",
    details:
      "We are currently waiting for the Exam Cell to release the official answer keys before processing re-evaluation requests. Your ticket is in the queue.",
    adminComment: "Status: Awaiting Dept Approval.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    isRead: true,
  },
  {
    id: "notif-5",
    complaintId: "CMP-2025-055",
    category: "Electrical",
    status: "resolved",
    summary: "Fan repair in Library Reading Room completed.",
    details:
      "The noisy ceiling fan in the main reading room has been oiled and serviced. Thank you for bringing this to our attention.",
    adminComment: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    isRead: true,
  },
];

export default function NotificationsPage() {
  const { user } = useAuth(); // Keeping user check just in case
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const [filter, setFilter] = useState("all"); // all | unread | read

  // Derived state
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    let data = notifications;
    if (filter === "unread") data = notifications.filter((n) => !n.isRead);
    if (filter === "read") data = notifications.filter((n) => n.isRead);

    // Sort by newest first
    return data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filter]);

  // ---- HANDLERS (Local Only) ----

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      setNotifications([]);
      toast.info("Notifications cleared");
    }
  };

  const handleToggleRead = (id, currentStatus) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !currentStatus } : n))
    );
  };

  const handleDeleteOne = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Updates on your complaints and administrative responses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Mark all read
          </button>
          <span className="h-4 w-px bg-gray-300"></span>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <FilterTab
          label="All"
          count={notifications.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterTab
          label="Unread"
          count={unreadCount}
          active={filter === "unread"}
          onClick={() => setFilter("unread")}
        />
        <FilterTab
          label="Read"
          active={filter === "read"}
          onClick={() => setFilter("read")}
        />
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {filteredNotifications.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              data={notif}
              onToggleRead={() => handleToggleRead(notif.id, notif.isRead)}
              onDelete={() => handleDeleteOne(notif.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------
// Sub-components
// --------------------------------------------------

function FilterTab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] ${
            active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function NotificationItem({ data, onToggleRead, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { statusConfig } = getStatusDetails(data.status);

  // Stop propagation to prevent expanding when clicking actions
  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md ${
        data.isRead
          ? "border-gray-200 bg-white"
          : "border-blue-100 bg-blue-50/50"
      }`}
    >
      {/* Unread Indicator Dot */}
      {!data.isRead && (
        <div className="absolute left-3 top-4 h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
      )}

      <div className="p-4 pl-8 sm:p-5 sm:pl-8">
        <div className="flex items-start justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusConfig.badge}`}
              >
                {statusConfig.icon} {statusConfig.label}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-semibold text-gray-500">
                {data.complaintId}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{data.category}</span>
            </div>

            <h3
              className={`text-sm font-semibold ${data.isRead ? "text-gray-800" : "text-gray-900"}`}
            >
              {data.summary}
            </h3>

            <p className="text-xs text-gray-500">
              {new Date(data.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          {/* Chevron / Toggle Icon */}
          <div
            className="text-gray-400 transition-transform duration-300"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Expanded Details Section */}
        {expanded && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 ring-1 ring-gray-200">
              <p className="mb-2 font-medium text-gray-900">Details:</p>
              <p className="mb-4 leading-relaxed text-gray-600">
                {data.details}
              </p>

              {data.adminComment && (
                <div className="flex items-start gap-2 border-t border-gray-200 pt-3">
                  <span className="mt-0.5 text-xs">👮‍♂️</span>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">
                      Admin Note:
                    </span>{" "}
                    {data.adminComment}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons (Only visible when expanded) */}
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={(e) => handleAction(e, onToggleRead)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {data.isRead ? "Mark as unread" : "Mark as read"}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={(e) => handleAction(e, onDelete)}
                className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ filter }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
        <span className="text-xl">📭</span>
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          No notifications found
        </h3>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          {filter === "all"
            ? "You have no notifications right now."
            : `You have no ${filter} notifications.`}
        </p>
      </div>
    </div>
  );
}

// ---- Helpers ----

function getStatusDetails(status) {
  switch (status) {
    case "resolved":
      return {
        statusConfig: {
          label: "Resolved",
          badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
          icon: "✓",
        },
      };
    case "in_progress":
      return {
        statusConfig: {
          label: "In Progress",
          badge: "bg-sky-50 text-sky-700 ring-sky-600/20",
          icon: "⚡",
        },
      };
    case "rejected":
      return {
        statusConfig: {
          label: "Rejected",
          badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
          icon: "✕",
        },
      };
    case "on_hold":
      return {
        statusConfig: {
          label: "On Hold",
          badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
          icon: "⏸",
        },
      };
    default:
      return {
        statusConfig: {
          label: "Pending",
          badge: "bg-gray-50 text-gray-700 ring-gray-500/10",
          icon: "•",
        },
      };
  }
}
