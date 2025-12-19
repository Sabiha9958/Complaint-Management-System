import { useCallback, useEffect, useRef, useState } from "react";
import { ComplaintAPI } from "../../api/complaints";
import { UserAPI } from "../../api/users";

const asNum = (v, fallback = 0) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;
const asArray = (v) => (Array.isArray(v) ? v : []);

export function useAdminDashboardData({ refreshMs = 60000 } = {}) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);

  const [totals, setTotals] = useState({ totalUsers: 0, totalComplaints: 0 });
  const [userStats, setUserStats] = useState(null);
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const inFlightRef = useRef(false);

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setError("");
    silent ? setRefreshing(true) : setInitialLoading(true);

    try {
      const [cRes, uRes, uStatsRes, cStatsRes] = await Promise.all([
        ComplaintAPI.getAll({ page: 1, limit: 25, sort: "-createdAt" }),
        UserAPI.getAll({ page: 1, limit: 25, sort: "-createdAt" }),
        UserAPI.getStats(),
        ComplaintAPI.getStats(),
      ]);

      const cPayload = cRes?.data ?? cRes;
      const recentComplaints = asArray(
        cPayload?.data?.complaints ?? cPayload?.complaints ?? cPayload
      );

      const uPayload = uRes?.data ?? uRes;
      const recentUsers = asArray(
        uPayload?.data?.users ?? uPayload?.users ?? uPayload
      );

      const uStatsPayload = uStatsRes?.data ?? uStatsRes;
      const us = uStatsPayload?.stats ?? uStatsPayload ?? {};

      const cStatsPayload = cStatsRes?.data ?? cStatsRes;
      const cs =
        cStatsPayload?.stats ?? cStatsPayload?.data ?? cStatsPayload ?? {};

      const totalUsers = asNum(us.totalUsers ?? us.total ?? 0, 0);
      const totalComplaints = asNum(
        cs.totalComplaints ?? cs.total ?? 0,
        recentComplaints.length
      );

      setComplaints(recentComplaints);
      setUsers(recentUsers);

      setUserStats({
        totalUsers,
        activeUsers: us.activeUsers ?? us.active ?? null,
        admins: us.admins ?? us.adminCount ?? null,
        staff: us.staff ?? us.staffCount ?? null,
        users: us.users ?? us.userCount ?? null,
      });

      setStats({
        openCount: asNum(cs.openCount, 0),
        pendingCount: asNum(cs.pendingCount, 0),
        inProgressCount: asNum(cs.inProgressCount, 0),
        resolvedCount: asNum(cs.resolvedCount, 0),
        rejectedCount: asNum(cs.rejectedCount, 0),
        closedCount: asNum(cs.closedCount, 0),
        resolvedToday: asNum(cs.resolvedToday, 0),
        completionRate: asNum(cs.completionRate, 0),
      });

      setTotals({ totalUsers, totalComplaints });
      setLastUpdated(new Date());
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load dashboard data"
      );
      if (!silent) {
        setComplaints([]);
        setUsers([]);
        setTotals({ totalUsers: 0, totalComplaints: 0 });
        setUserStats(null);
        setStats(null);
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAll({ silent: false });
    const id = setInterval(() => fetchAll({ silent: true }), refreshMs);
    return () => clearInterval(id);
  }, [fetchAll, refreshMs]); // interval cleanup prevents leaks [web:116]

  return {
    loading: initialLoading,
    refreshing,
    error,
    lastUpdated,
    totals,
    userStats,
    complaints,
    users,
    stats,
    refetch: () => fetchAll({ silent: false }),
    refetchSilent: () => fetchAll({ silent: true }),
  };
}
