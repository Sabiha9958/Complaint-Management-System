import { useCallback, useEffect, useRef, useState } from "react";
import { ComplaintAPI } from "../../api/complaints";
import { UserAPI } from "../../api/users";

const asNum = (v, fallback = 0) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;
const asArray = (v) => (Array.isArray(v) ? v : []);

const pickFirstNonEmptyArray = (...values) => {
  for (const v of values) {
    const arr = asArray(v);
    if (arr.length > 0) return arr;
  }
  return [];
};

const pickTotalComplaints = (cs, cPayload, listLength = 0) => {
  const p = cPayload || {};
  const d = p.data || {};
  const pagination = d.pagination || {};
  const stats = cs || d.stats || p.stats || {};

  let metaTotal =
    stats.totalComplaints ??
    stats.total ??
    stats.count ??
    pagination.total ??
    d.totalComplaints ??
    p.totalComplaints ??
    p.total;

  return asNum(metaTotal, listLength);
};

const normalizeUserStats = (usRaw) => {
  const us = usRaw || {};
  let admins = us.admins ?? us.adminCount;
  let staff = us.staff ?? us.staffCount;
  let usersCount = us.users ?? us.userCount;
  let active = us.activeUsers ?? us.active;

  const roleCounts =
    us.roleCounts || us.byRole || us.roles || us.countByRole || {};
  if (admins == null) admins = roleCounts.admin;
  if (staff == null) staff = roleCounts.staff;
  if (usersCount == null)
    usersCount =
      roleCounts.user ??
      roleCounts.endUser ??
      roleCounts.customer ??
      roleCounts.student;

  const activeByStatus = us.activeByStatus || us.statusCounts || {};
  if (active == null) active = activeByStatus.active;

  let totalUsers =
    us.totalUsers ??
    us.total ??
    Object.values(roleCounts).reduce((sum, v) => sum + asNum(v), 0);

  return {
    totalUsers: asNum(totalUsers, 0),
    activeUsers: asNum(active, 0),
    admins: asNum(admins, 0),
    staff: asNum(staff, 0),
    users: asNum(usersCount, 0),
  };
};

export function useAdminDashboardData({
  refreshMs = 60000,
  unlimitedComplaints = false,
} = {}) {
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

  const fetchAll = useCallback(
    async ({ silent = false } = {}) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setError("");
      if (silent) setRefreshing(true);
      else setInitialLoading(true);

      try {
        const complaintParams = {
          page: 1,
          limit: unlimitedComplaints ? 0 : 25,
          sort: "-createdAt",
        };

        const [cRes, uRes, uStatsRes, cStatsRes] = await Promise.all([
          ComplaintAPI.getAll(complaintParams),
          UserAPI.getAll({ page: 1, limit: 25, sort: "-createdAt" }),
          UserAPI.getStats(),
          ComplaintAPI.getStats(),
        ]);

        const cPayload = cRes?.data ?? cRes ?? {};
        const complaintsList = pickFirstNonEmptyArray(
          cPayload.data?.complaints,
          cPayload.complaints,
          cPayload.items,
          cPayload.data
        );

        const uPayload = uRes?.data ?? uRes ?? {};
        const usersList = pickFirstNonEmptyArray(
          uPayload.data?.users,
          uPayload.users,
          uPayload.items,
          uPayload.data,
          uPayload
        );

        const cStatsPayload = cStatsRes?.data ?? cStatsRes ?? {};
        const cs =
          cStatsPayload.stats ?? cStatsPayload.data ?? cStatsPayload ?? {};
        const uStatsPayload = uStatsRes?.data ?? uStatsRes ?? {};
        const usRaw = uStatsPayload.stats ?? uStatsPayload ?? {};
        const normalizedUserStats = normalizeUserStats(usRaw);

        const totalComplaints = pickTotalComplaints(
          cs,
          cPayload,
          complaintsList.length
        );

        setComplaints(complaintsList);
        setUsers(usersList);
        setUserStats(normalizedUserStats);

        setStats({
          openCount: asNum(cs.openCount, 0),
          pendingCount: asNum(cs.pendingCount, 0),
          inProgressCount: asNum(cs.inProgressCount, 0),
          resolvedCount: asNum(cs.resolvedCount, 0),
          rejectedCount: asNum(cs.rejectedCount, 0),
          closedCount: asNum(cs.closedCount, 0),
          resolvedToday: asNum(cs.resolvedToday, 0),
          completionRate: asNum(cs.completionRate, 0),
          slaHours: cs.slaHours != null ? asNum(cs.slaHours, null) : null,
        });

        setTotals({
          totalUsers: normalizedUserStats.totalUsers,
          totalComplaints,
        });
        setLastUpdated(new Date());
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load dashboard data";
        setError(msg);

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
    },
    [unlimitedComplaints]
  );

  useEffect(() => {
    fetchAll({ silent: false });
    const id = setInterval(() => fetchAll({ silent: true }), refreshMs);
    return () => clearInterval(id);
  }, [fetchAll, refreshMs]);

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
