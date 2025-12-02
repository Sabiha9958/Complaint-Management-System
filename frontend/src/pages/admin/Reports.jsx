import React, { useState, useEffect, useMemo, useCallback } from "react";
import apiClient from "../../api/apiClient.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  FileText,
  PieChart as PieIcon,
  BarChart2,
  Users,
} from "lucide-react";

// --- MOCK DATA GENERATOR (Fallback) ---
const generateMockData = () => {
  const categories = ["IT Support", "Facility", "HR", "Finance", "Security"];
  const priorities = ["low", "medium", "high", "urgent"];
  const statuses = ["pending", "in_progress", "resolved", "rejected"];
  return Array.from({ length: 150 })
    .map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 90));
      const priority =
        priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      return {
        _id: `RPT-${1000 + i}`,
        title: `Issue Report #${1000 + i}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        priority,
        status,
        createdAt: date.toISOString(),
        resolutionTime:
          status === "resolved" ? Math.floor(Math.random() * 72) + 2 : 0,
        user: { name: `User ${i}` },
      };
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// --- COLORS ---
const COLORS = {
  blue: "#3B82F6",
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
  slate: "#64748B",
};
const STATUS_COLORS = [COLORS.yellow, COLORS.blue, COLORS.green, COLORS.red];

// --- MAIN COMPONENT ---
const Reports = () => {
  const [complaints, setComplaints] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRangeDays, setDateRangeDays] = useState(90);
  const [useMockData, setUseMockData] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch complaints with pagination
      let allComplaints = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore && page <= 10) {
        try {
          const complaintsRes = await apiClient.get(
            `/complaints?page=${page}&limit=${limit}`
          );
          const payload = complaintsRes.data;
          const list = Array.isArray(payload)
            ? payload
            : payload?.data || payload?.complaints || [];

          if (list.length === 0) {
            hasMore = false;
          } else {
            allComplaints = [...allComplaints, ...list];
            const totalPages =
              payload?.pagination?.pages || payload?.meta?.pages || 1;
            hasMore = page < totalPages;
            page++;
          }
        } catch (pageError) {
          console.warn(`Error fetching complaints page ${page}:`, pageError);
          hasMore = false;
        }
      }

      if (allComplaints.length > 0) {
        setComplaints(allComplaints);
        setUseMockData(false);
      } else {
        setComplaints(generateMockData());
        setUseMockData(true);
      }

      // Fetch user stats - try multiple possible endpoints
      try {
        // First try: GET /auth/users with limit to get stats from response
        const usersRes = await apiClient.get("/auth/users?page=1&limit=1");
        const userData = usersRes.data;

        // Extract stats from pagination/meta or calculate from full user list
        if (userData?.stats) {
          setUserStats(userData.stats);
        } else if (userData?.pagination) {
          // If pagination info available, use total counts
          setUserStats({
            total: userData.pagination.total || 0,
            active: null, // Not available without full list
            admins: null,
            staff: null,
            users: null,
          });
        } else {
          // Fallback: fetch all users and calculate stats manually
          const allUsersRes = await apiClient.get(
            "/auth/users?page=1&limit=1000"
          );
          const allUsers = Array.isArray(allUsersRes.data)
            ? allUsersRes.data
            : allUsersRes.data?.data || allUsersRes.data?.users || [];

          if (allUsers.length > 0) {
            setUserStats({
              total: allUsers.length,
              active: allUsers.filter((u) => u.isActive).length,
              admins: allUsers.filter((u) => u.role === "admin").length,
              staff: allUsers.filter((u) => u.role === "staff").length,
              users: allUsers.filter((u) => u.role === "user").length,
            });
          } else {
            setUserStats({
              total: 0,
              active: 0,
              admins: 0,
              staff: 0,
              users: 0,
            });
          }
        }
      } catch (userError) {
        console.warn("User stats unavailable:", userError);
        setUserStats({ total: 0, active: 0, admins: 0, staff: 0, users: 0 });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setComplaints(generateMockData());
      setUseMockData(true);
      setUserStats({ total: 0, active: 0, admins: 0, staff: 0, users: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + periodic refresh (every 60s)
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // --- ANALYTICS COMPUTATION ---
  const analytics = useMemo(() => {
    const rawData = complaints;
    if (!rawData.length) {
      return {
        total: 0,
        resolvedCount: 0,
        urgentCount: 0,
        avgTime: 0,
        trendData: [],
        categoryData: [],
        statusData: [],
        insights: ["No data available for the selected period."],
      };
    }

    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - dateRangeDays);
    const data = rawData.filter((item) => new Date(item.createdAt) >= cutoff);

    if (!data.length) {
      return {
        total: 0,
        resolvedCount: 0,
        urgentCount: 0,
        avgTime: 0,
        trendData: [],
        categoryData: [],
        statusData: [],
        insights: ["No records fall inside the selected date range."],
      };
    }

    const total = data.length;
    const resolved = data.filter((d) => d.status === "resolved");
    const urgent = data.filter((d) => d.priority === "urgent");
    const avgTime =
      resolved.reduce((acc, curr) => acc + (curr.resolutionTime || 0), 0) /
      (resolved.length || 1);

    // Trend per day (last 14 days)
    const trendMap = data.reduce((acc, curr) => {
      const date = new Date(curr.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      if (!acc[date]) acc[date] = { date, total: 0, resolved: 0, urgent: 0 };
      acc[date].total += 1;
      if (curr.status === "resolved") acc[date].resolved += 1;
      if (curr.priority === "urgent") acc[date].urgent += 1;
      return acc;
    }, {});
    const trendData = Object.values(trendMap).slice(-14);

    // Category distribution
    const categoryMap = data.reduce((acc, curr) => {
      const key = curr.category || "Uncategorized";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Status distribution
    const statusMap = data.reduce((acc, curr) => {
      const key = (curr.status || "unknown").replace("_", " ").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const statusData = Object.entries(statusMap).map(([name, value]) => ({
      name,
      value,
    }));

    const topCategory = categoryData[0]?.name || "N/A";
    const completionRate = ((resolved.length / total) * 100).toFixed(1);
    const insights = [
      `${topCategory} is currently receiving the highest number of reports (${categoryData[0]?.value || 0}).`,
      `Overall completion rate is ${completionRate}% for the selected period.`,
      urgent.length > 5
        ? "High volume of urgent tickets detected; consider allocating more staff."
        : "Urgent ticket volume is under control.",
      resolved.length
        ? `Average resolution time is ${avgTime.toFixed(1)} hours for resolved complaints.`
        : "No resolved complaints available to calculate resolution time.",
    ];

    return {
      total,
      resolvedCount: resolved.length,
      urgentCount: urgent.length,
      avgTime,
      trendData,
      categoryData,
      statusData,
      insights,
    };
  }, [complaints, dateRangeDays]);

  // --- CSV EXPORT ---
  const handleExport = () => {
    if (!complaints.length) {
      alert("No data available to export.");
      return;
    }
    const headers = [
      "Title",
      "Category",
      "Status",
      "Priority",
      "Created By",
      "Date",
    ];
    const rows = complaints.map((c) => [
      `"${(c.title || "").replace(/"/g, '""')}"`,
      c.category || "N/A",
      c.status || "N/A",
      c.priority || "N/A",
      c.user?.name || "Anonymous",
      new Date(c.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="font-medium text-gray-500">
            Crunching the numbers for your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 bg-gray-50/50 p-6">
      {/* Header + Controls */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900">
            <Activity className="text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live overview of users and complaints with trends and status
            breakdowns.
            {useMockData && (
              <span className="ml-2 text-orange-600 font-semibold">
                (Using Mock Data)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {[30, 90, 180].map((day) => (
            <button
              key={day}
              onClick={() => setDateRangeDays(day)}
              type="button"
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                dateRangeDays === day
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Last {day} Days
            </button>
          ))}
          <div className="mx-1 h-6 w-px bg-gray-200" />
          <button
            onClick={handleExport}
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total Complaints"
          value={analytics.total}
          subtext={`${dateRangeDays}-day period`}
          icon={FileText}
          color="blue"
        />
        <KPICard
          title="Resolved"
          value={analytics.resolvedCount}
          subtext={
            analytics.total
              ? `${((analytics.resolvedCount / analytics.total) * 100).toFixed(0)}% completion`
              : "No data"
          }
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Avg Resolution"
          value={
            analytics.resolvedCount ? `${analytics.avgTime.toFixed(1)}h` : "N/A"
          }
          subtext="Target: under 48 hours"
          icon={Clock}
          color="purple"
        />
        <KPICard
          title="Critical Issues"
          value={analytics.urgentCount}
          subtext={
            analytics.urgentCount > 5
              ? "High urgent load"
              : "Urgent volume is stable"
          }
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="Total Users"
          value={userStats?.total || 0}
          subtext={
            userStats &&
            (userStats.active !== null || userStats.admins !== null)
              ? `${userStats.active || 0} active, ${userStats.admins || 0} admins`
              : "User data loaded"
          }
          icon={Users}
          color="blue"
        />
      </div>

      {/* Trend + Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend chart */}
        <div className="lg:col-span-2 min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Intake vs Resolution Trend
              </h3>
              <p className="text-sm text-gray-500">
                Daily comparison of new complaints versus resolved ones.
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.trendData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.blue}
                    stopOpacity={0.15}
                  />
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.green}
                    stopOpacity={0.15}
                  />
                  <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" />
              <Area
                type="monotone"
                dataKey="total"
                name="Incoming"
                stroke={COLORS.blue}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke={COLORS.green}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorResolved)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Activity className="h-5 w-5 text-blue-400" />
              Key Insights
            </h3>
            <div className="space-y-4">
              {analytics.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/10 p-3 backdrop-blur-sm"
                >
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                  <p className="text-sm leading-relaxed text-slate-200">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Overall Health
            </p>
            <div className="h-2.5 w-full rounded-full bg-slate-700">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-green-400"
                style={{
                  width:
                    analytics.total && analytics.resolvedCount
                      ? `${Math.min(100, (analytics.resolvedCount / analytics.total) * 100).toFixed(0)}%`
                      : "0%",
                }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-slate-400">
              Based on completion rate and urgency mix.
            </p>
          </div>
        </div>
      </div>

      {/* Category + Status charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
            <BarChart2 className="h-5 w-5 text-purple-500" />
            Volume by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.categoryData}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid
                horizontal
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 12, fill: "#475569" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#F1F5F9" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar
                dataKey="value"
                fill={COLORS.purple}
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
            <PieIcon className="h-5 w-5 text-orange-500" />
            Current Status Distribution
          </h3>
          <div className="flex items-center justify-center">
            {analytics.statusData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.statusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">No status data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const KPICard = ({ title, value, subtext, icon: Icon, color }) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </h3>
        </div>
        <div className={`rounded-xl p-3 ${colorStyles[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colorStyles[color]} bg-opacity-20`}
        >
          Analytics
        </span>
        <span className="text-xs text-gray-400">{subtext}</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
        <p className="mb-2 text-sm font-bold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="mb-1 flex items-center gap-2 text-xs">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500 capitalize">{entry.name}:</span>
            <span className="font-bold text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default Reports;
