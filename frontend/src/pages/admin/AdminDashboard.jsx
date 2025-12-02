import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  FileText,
  Activity,
  Download,
  Bell,
  Info,
} from "lucide-react";

/* ================================================================
   🎯 MOCK DATA & CONFIGURATION
   ================================================================ */

const MOCK_STATS = {
  totalComplaints: 156,
  openComplaints: 23,
  resolvedToday: 8,
  avgResponseTime: "2h 15m",
  completionRate: 92,
  userGrowth: "+12%",
};

const MOCK_COMPLAINTS = Array.from({ length: 25 }).map((_, i) => ({
  _id: `CMP-${1000 + i}`,
  title: [
    "Login issues on mobile app",
    "Payment gateway timeout error",
    "Profile picture upload failed",
    "Dashboard not loading properly",
    "Feature request: Dark mode support",
    "Account locked after password reset",
    "Error 504 on checkout page",
    "Security question not updating",
    "Slow performance on dashboard",
    "Broken notification links",
    "Cannot reset password via email",
    "Missing transaction in history",
    "API returning 500 error",
    "Incorrect billing amount",
    "Profile data not saving",
  ][i % 15],
  description: "Detailed description of the complaint issue...",
  category: ["Technical", "Billing", "UX", "Account", "Feature", "Security"][
    i % 6
  ],
  priority: ["urgent", "high", "medium", "low"][i % 4],
  status: ["open", "in-progress", "resolved", "closed"][i % 4],
  user: {
    name: [
      "Alice Johnson",
      "Bob Smith",
      "Charlie Brown",
      "Diana Prince",
      "Evan Wright",
      "Fiona Green",
      "George Wilson",
      "Hannah Lee",
    ][i % 8],
    email: [
      "alice@example.com",
      "bob@example.com",
      "charlie@example.com",
      "diana@example.com",
      "evan@example.com",
      "fiona@example.com",
      "george@example.com",
      "hannah@example.com",
    ][i % 8],
    role: "user",
  },
  actionRequired: i % 5 === 0,
  verified: i % 3 === 0,
  commentsCount: Math.floor(Math.random() * 8),
  attachmentsCount: i % 4 === 0 ? Math.floor(Math.random() * 3) + 1 : 0,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
}));

const FILTER_OPTIONS = {
  status: ["all", "open", "in-progress", "resolved", "closed"],
  priority: ["all", "urgent", "high", "medium", "low"],
};

const STATUS_CONFIG = {
  open: { color: "rose", label: "Open", icon: AlertCircle },
  "in-progress": { color: "blue", label: "In Progress", icon: Activity },
  resolved: { color: "emerald", label: "Resolved", icon: CheckCircle2 },
  closed: { color: "slate", label: "Closed", icon: FileText },
};

const PRIORITY_CONFIG = {
  urgent: { color: "rose", label: "Urgent" },
  high: { color: "orange", label: "High" },
  medium: { color: "amber", label: "Medium" },
  low: { color: "emerald", label: "Low" },
};

/* ================================================================
   🎨 UTILITY FUNCTIONS
   ================================================================ */

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name) => {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-pink-600",
  ];
  const index = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
};

/* ================================================================
   🧩 UI COMPONENTS
   ================================================================ */

const Badge = ({ children, variant = "default", size = "md" }) => {
  const colorSchemes = {
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    default: "bg-gray-50 text-gray-700 border-gray-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${
        colorSchemes[variant] || colorSchemes.default
      } ${sizes[size]}`}
    >
      {children}
    </span>
  );
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${
      onClick ? "cursor-pointer hover:border-indigo-300 hover:scale-[1.02]" : ""
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
        <Icon className="text-indigo-600" size={24} />
      </div>
    </div>
    {(trend || subtitle) && (
      <div className="flex items-center gap-2 text-sm">
        {trend && (
          <>
            {trendUp ? (
              <TrendingUp size={16} className="text-emerald-600" />
            ) : (
              <TrendingDown size={16} className="text-rose-600" />
            )}
            <span
              className={`font-semibold ${
                trendUp ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend}
            </span>
          </>
        )}
        {subtitle && <span className="text-gray-500">{subtitle}</span>}
      </div>
    )}
  </div>
);

const FilterBar = ({ filters, setFilters, onReset, resultsCount }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by ID, user, email, or issue..."
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          {FILTER_OPTIONS.status.map((status) => (
            <option key={status} value={status}>
              {status === "all"
                ? "All Status"
                : STATUS_CONFIG[status]?.label || status}
            </option>
          ))}
        </select>

        <select
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
          value={filters.priority}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, priority: e.target.value }))
          }
        >
          {FILTER_OPTIONS.priority.map((priority) => (
            <option key={priority} value={priority}>
              {priority === "all"
                ? "All Priority"
                : PRIORITY_CONFIG[priority]?.label || priority}
            </option>
          ))}
        </select>

        <button
          onClick={onReset}
          className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors"
        >
          Reset
        </button>
      </div>
    </div>

    {resultsCount !== undefined && (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">{resultsCount}</span>{" "}
          result{resultsCount !== 1 ? "s" : ""}
        </p>
      </div>
    )}
  </div>
);

const ComplaintRow = ({ complaint, onClick }) => {
  const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.open;
  const priorityConfig =
    PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.low;

  return (
    <tr
      onClick={onClick}
      className="hover:bg-gray-50 transition-colors cursor-pointer group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-gray-900">
            #{complaint._id?.slice(-4) || "N/A"}
          </span>
          {complaint.actionRequired && (
            <Bell size={14} className="text-rose-500 animate-pulse" />
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(
              complaint.user?.name
            )} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
          >
            {getInitials(complaint.user?.name)}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {complaint.user?.name || "Unknown"}
            </p>
            <p className="text-xs text-gray-500">
              {complaint.user?.email || "N/A"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="max-w-xs">
          <p
            className="font-medium text-gray-900 truncate"
            title={complaint.title}
          >
            {complaint.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            {complaint.category}
            {complaint.commentsCount > 0 && (
              <span className="flex items-center gap-1">
                • {complaint.commentsCount} comments
              </span>
            )}
          </p>
        </div>
      </td>

      <td className="px-6 py-4">
        <Badge variant={priorityConfig.color} size="sm">
          {priorityConfig.label}
        </Badge>
      </td>

      <td className="px-6 py-4">
        <Badge variant={statusConfig.color} size="sm">
          <statusConfig.icon size={12} />
          {statusConfig.label}
        </Badge>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock size={14} className="text-gray-400" />
          {formatDate(complaint.createdAt)}
        </div>
      </td>

      <td className="px-6 py-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <MoreHorizontal size={18} />
        </button>
      </td>
    </tr>
  );
};

const EmptyState = ({
  message = "No complaints found",
  icon: Icon = Filter,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="p-4 bg-gray-100 rounded-full mb-4">
      <Icon size={32} className="text-gray-400" />
    </div>
    <p className="text-gray-600 font-medium">{message}</p>
    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
  </div>
);

const LoadingSpinner = ({ message = "Loading dashboard..." }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <Activity className="absolute inset-0 m-auto text-indigo-600" size={24} />
    </div>
    <p className="text-gray-600 font-medium mt-4">{message}</p>
  </div>
);

const DemoModeBanner = () => (
  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
    <div className="p-2 bg-amber-100 rounded-lg">
      <Info className="text-amber-700" size={20} />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-amber-900 mb-1">Demo Mode Active</h3>
      <p className="text-sm text-amber-700">
        You're viewing sample data. Connect your backend API to see real
        complaints and statistics.
      </p>
    </div>
  </div>
);

/* ================================================================
   🎣 CUSTOM HOOKS
   ================================================================ */

const useDashboardData = () => {
  const [state, setState] = useState({
    stats: MOCK_STATS,
    complaints: MOCK_COMPLAINTS,
    loading: true,
    lastUpdated: null,
    usingMockData: true,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    // Simulate API delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 600));

    setState({
      stats: MOCK_STATS,
      complaints: MOCK_COMPLAINTS,
      loading: false,
      lastUpdated: new Date(),
      usingMockData: true,
    });
  }, []);

  return { ...state, refetch: fetchData };
};

const useFilters = (initialFilters) => {
  const [filters, setFilters] = useState(initialFilters);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return { filters, setFilters, resetFilters };
};

/* ================================================================
   🚀 MAIN COMPONENT
   ================================================================ */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { stats, complaints, loading, lastUpdated, usingMockData, refetch } =
    useDashboardData();
  const { filters, setFilters, resetFilters } = useFilters({
    status: "all",
    priority: "all",
    search: "",
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchStatus =
        filters.status === "all" || complaint.status === filters.status;
      const matchPriority =
        filters.priority === "all" || complaint.priority === filters.priority;

      const searchLower = filters.search.toLowerCase();
      const matchSearch =
        !searchLower ||
        complaint.title?.toLowerCase().includes(searchLower) ||
        complaint.user?.name?.toLowerCase().includes(searchLower) ||
        complaint.user?.email?.toLowerCase().includes(searchLower) ||
        complaint._id?.toLowerCase().includes(searchLower);

      return matchStatus && matchPriority && matchSearch;
    });
  }, [complaints, filters]);

  const dashboardStats = useMemo(() => {
    const openCount = complaints.filter((c) => c.status === "open").length;
    const resolvedToday = complaints.filter((c) => {
      const today = new Date().toDateString();
      return (
        c.status === "resolved" &&
        new Date(c.updatedAt).toDateString() === today
      );
    }).length;

    return [
      {
        title: "Total Complaints",
        value: complaints.length.toLocaleString(),
        subtitle: "all time",
        icon: FileText,
        onClick: () =>
          setFilters({ status: "all", priority: "all", search: "" }),
      },
      {
        title: "Open Issues",
        value: openCount.toLocaleString(),
        subtitle: "need attention",
        trend:
          openCount > 0
            ? `${Math.round((openCount / complaints.length) * 100)}%`
            : "0%",
        trendUp: false,
        icon: AlertCircle,
        onClick: () => setFilters({ ...filters, status: "open" }),
      },
      {
        title: "Resolved Today",
        value: resolvedToday.toLocaleString(),
        subtitle: "completed",
        trend: resolvedToday > 0 ? "+12%" : "0%",
        trendUp: true,
        icon: CheckCircle2,
        onClick: () => setFilters({ ...filters, status: "resolved" }),
      },
      {
        title: "Avg Response",
        value: stats?.avgResponseTime || "2h 15m",
        subtitle: "response time",
        trend: "-23m",
        trendUp: true,
        icon: Clock,
      },
    ];
  }, [stats, complaints, filters, setFilters]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 flex items-center gap-2 text-sm">
              <Activity size={16} className="text-indigo-600" />
              System Overview
              {lastUpdated && <span>• Updated {formatDate(lastUpdated)}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => {
                const dataStr = JSON.stringify(filteredComplaints, null, 2);
                const dataBlob = new Blob([dataStr], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `complaints-${new Date().toISOString()}.json`;
                link.click();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-semibold"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Demo Mode Banner */}
        {usingMockData && <DemoModeBanner />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Complaints Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutDashboard size={22} className="text-indigo-600" />
              Recent Complaints
            </h2>
          </div>

          <FilterBar
            filters={filters}
            setFilters={setFilters}
            onReset={resetFilters}
            resultsCount={filteredComplaints.length}
          />

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "ID",
                      "User",
                      "Issue",
                      "Priority",
                      "Status",
                      "Created",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredComplaints.length > 0 ? (
                    filteredComplaints.map((complaint) => (
                      <ComplaintRow
                        key={complaint._id}
                        complaint={complaint}
                        onClick={() =>
                          navigate(`/admin/complaints/${complaint._id}`)
                        }
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <EmptyState />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
