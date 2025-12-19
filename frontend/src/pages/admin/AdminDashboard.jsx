import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAdminDashboardData } from "../../components/AdminDashboard/useAdminDashboardData";
import DashboardHeader from "../../components/AdminDashboard/DashboardHeader";
import StatCards from "../../components/AdminDashboard/StatCards";
import BulletinBoard from "../../components/AdminDashboard/BulletinBoard";
import FilterBar from "../../components/AdminDashboard/FilterBar";
import RecentComplaintsTable from "../../components/AdminDashboard/RecentComplaintsTable";
import TopUsersTable from "../../components/AdminDashboard/TopUsersTable";
import LoadingScreen from "../../components/AdminDashboard/ui/LoadingScreen";

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replaceAll("_", "-");

export default function AdminDashboard() {
  const navigate = useNavigate();

  const {
    loading,
    refreshing,
    error,
    lastUpdated,
    totals,
    userStats,
    complaints,
    users,
    stats,
    refetch,
  } = useAdminDashboardData({ refreshMs: 60000 });

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    search: "",
  });

  const resetFilters = () =>
    setFilters({ status: "all", priority: "all", search: "" });

  const filteredComplaints = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return (complaints || []).filter((c) => {
      const status = normalize(c.status);
      const priority = normalize(c.priority);

      const okStatus =
        filters.status === "all" ||
        status === normalize(filters.status) ||
        (filters.status === "open" &&
          (status === "pending" ||
            status === "open" ||
            status === "inprogress" ||
            status === "in-progress"));

      const okPriority =
        filters.priority === "all" || priority === normalize(filters.priority);

      const okSearch =
        !q ||
        String(c.title || "")
          .toLowerCase()
          .includes(q) ||
        String(c.category || "")
          .toLowerCase()
          .includes(q) ||
        String(c._id || c.id || "")
          .toLowerCase()
          .includes(q) ||
        String(c.user?.name || "")
          .toLowerCase()
          .includes(q) ||
        String(c.user?.email || "")
          .toLowerCase()
          .includes(q);

      return okStatus && okPriority && okSearch;
    });
  }, [complaints, filters]);

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      totals,
      userStats,
      stats,
      filters,
      complaints: filteredComplaints,
      topUsers: users?.slice?.(0, 25) || [],
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50/60 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          lastUpdated={lastUpdated}
          error={error}
          refreshing={refreshing}
          onRefresh={refetch}
          onExport={handleExport}
        />

        <StatCards
          totals={totals}
          userStats={userStats}
          stats={stats}
          onQuickFilter={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        />

        <BulletinBoard totals={totals} userStats={userStats} stats={stats} />

        <div className="space-y-4">
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            onReset={resetFilters}
            resultsCount={filteredComplaints.length}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <TopUsersTable users={users} />
            <RecentComplaintsTable
              complaints={filteredComplaints}
              onOpen={(id) => navigate(`/complaints/${id}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
