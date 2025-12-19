import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComplaintAPI } from "../../api/complaints";
import { UserAPI } from "../../api/users";

const safeNum = (v, fallback = 0) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;
const pickMeta = (p) => p?.pagination || p?.meta || p?.data?.meta || {};
const pickList = (p) =>
  (Array.isArray(p) && p) ||
  (Array.isArray(p?.complaints) && p.complaints) ||
  (Array.isArray(p?.data?.complaints) && p.data.complaints) ||
  (Array.isArray(p?.data) && p.data) ||
  [];

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replaceAll("_", "-");

async function fetchAllComplaints({ pageSize = 50, maxPages = 60 }) {
  let page = 1;
  let all = [];
  let totalFromApi = null;
  let pagesFromApi = null;

  while (page <= maxPages) {
    const res = await ComplaintAPI.getAll({
      page,
      limit: pageSize,
      sort: "-createdAt",
    });
    const payload = res?.data ?? res;

    const list = pickList(payload);
    const meta = pickMeta(payload);

    if (totalFromApi == null)
      totalFromApi = safeNum(meta.total ?? payload?.total, null);
    if (pagesFromApi == null)
      pagesFromApi = safeNum(
        meta.pages ?? meta.totalPages ?? payload?.totalPages,
        null
      );

    if (!list.length) break;
    all = all.concat(list);

    if (pagesFromApi != null && page >= pagesFromApi) break;
    page += 1;
  }

  return { complaints: all, totalComplaints: totalFromApi ?? all.length };
}

async function fetchUsersSummary() {
  const res = await UserAPI.getStats();
  const payload = res?.data ?? res;
  const stats = payload?.stats || payload || {};

  return {
    totalUsers: safeNum(stats.total ?? stats.totalUsers, 0),
    activeUsers: safeNum(stats.active ?? stats.activeUsers, 0),
    admins: safeNum(stats.admins ?? stats.adminCount, 0),
    staff: safeNum(stats.staff ?? stats.staffCount, 0),
    users: safeNum(stats.users ?? stats.userCount, 0),
  };
}

export function useReportsData({ dateRangeDays = 90, refreshMs = 60000 } = {}) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [totals, setTotals] = useState({ totalComplaints: 0, totalUsers: 0 });
  const [userStats, setUserStats] = useState(null);
  const [error, setError] = useState("");

  const inFlight = useRef(false);

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    if (inFlight.current) return;
    inFlight.current = true;

    setError("");
    if (silent) setRefreshing(true);
    else setInitialLoading(true);

    try {
      const [c, u] = await Promise.all([
        fetchAllComplaints({ pageSize: 50, maxPages: 60 }),
        fetchUsersSummary(),
      ]);

      setComplaints(c.complaints);
      setTotals({
        totalComplaints: c.totalComplaints,
        totalUsers: u.totalUsers || 0,
      });
      setUserStats(u);
    } catch (e) {
      setError(e?.message || "Failed to load reports data");
      if (!silent) {
        setComplaints([]);
        setTotals({ totalComplaints: 0, totalUsers: 0 });
        setUserStats(null);
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAll({ silent: false });
    const id = setInterval(() => fetchAll({ silent: true }), refreshMs);
    return () => clearInterval(id);
  }, [fetchAll, refreshMs]);

  const analytics = useMemo(() => {
    const raw = complaints || [];
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - dateRangeDays);

    const inRange = raw.filter((c) => {
      const d = new Date(c.createdAt);
      return Number.isFinite(d.getTime()) && d >= cutoff;
    });

    const totalInRange = inRange.length;
    const resolved = inRange.filter((c) => norm(c.status) === "resolved");
    const urgent = inRange.filter((c) => norm(c.priority) === "urgent");

    const completionRate = totalInRange
      ? (resolved.length / totalInRange) * 100
      : 0;

    const avgTime =
      resolved.reduce((acc, c) => acc + (Number(c.resolutionTime) || 0), 0) /
      (resolved.length || 1);

    const trendMap = inRange.reduce((acc, c) => {
      const key = new Date(c.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      if (!acc[key]) acc[key] = { date: key, total: 0, resolved: 0, urgent: 0 };
      acc[key].total += 1;
      if (norm(c.status) === "resolved") acc[key].resolved += 1;
      if (norm(c.priority) === "urgent") acc[key].urgent += 1;
      return acc;
    }, {});
    const trendData = Object.values(trendMap).slice(-14);

    const categoryMap = inRange.reduce((acc, c) => {
      const k = String(c.category || "Uncategorized").trim() || "Uncategorized";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const statusMap = inRange.reduce((acc, c) => {
      const k = String(c.status || "unknown")
        .replaceAll("_", " ")
        .toUpperCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const statusData = Object.entries(statusMap).map(([name, value]) => ({
      name,
      value,
    }));

    const insights = [];
    insights.push(
      `Completion rate is ${completionRate.toFixed(0)}% in the last ${dateRangeDays} days.`
    );
    insights.push(`Urgent complaints: ${urgent.length} in the selected range.`);
    if (resolved.length)
      insights.push(
        `Average resolution time: ${avgTime.toFixed(1)}h (resolved only).`
      );
    if (!totalInRange)
      insights.push("No complaints found in the selected range.");

    const last = trendData[trendData.length - 1];
    const prev = trendData[trendData.length - 2];
    if (last && prev) {
      const delta = last.total - prev.total;
      insights.push(
        delta >= 0
          ? `Daily volume increased by ${delta}.`
          : `Daily volume decreased by ${Math.abs(delta)}.`
      );
    }

    return {
      totalInRange,
      resolvedCount: resolved.length,
      urgentCount: urgent.length,
      avgTime,
      trendData,
      categoryData, // ✅ for CategoryBar
      statusData, // ✅ for StatusDonut
      completionRate,
      insights,
    };
  }, [complaints, dateRangeDays]);

  return {
    loading: initialLoading,
    refreshing,
    error,
    complaints,
    totals,
    userStats,
    analytics,
    refetch: () => fetchAll({ silent: false }),
  };
}
