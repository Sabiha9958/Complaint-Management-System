import React, { useState } from "react";
import { toast } from "react-toastify";
import ReportsHeader from "../../components/Reports/ReportsHeader.jsx";
import KPIGrid from "../../components/Reports/KPIGrid.jsx";
import TrendChart from "../../components/Reports/TrendChart.jsx";
import CategoryBar from "../../components/Reports/CategoryBar.jsx";
import StatusDonut from "../../components/Reports/StatusDonut.jsx";
import InsightsPanel from "../../components/Reports/InsightsPanel.jsx";
import { exportComplaintsCsv } from "../../components/Reports/exportCsv.js";
import { useReportsData } from "../../components/Reports/useReportsData.js";

export default function Reports() {
  const [dateRangeDays, setDateRangeDays] = useState(90);

  const {
    loading,
    refreshing,
    error,
    complaints,
    totals,
    userStats,
    analytics,
    refetch,
  } = useReportsData({
    dateRangeDays,
    refreshMs: 60000,
  });

  const onExport = () => {
    const ok = exportComplaintsCsv(complaints, "analytics-report");
    if (!ok) toast.info("No data available to export.");
    else toast.success("CSV exported.");
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-800">
          <p className="text-sm font-extrabold">Failed to load reports</p>
          <p className="mt-1 text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 bg-gray-50/50 p-6">
      <ReportsHeader
        dateRangeDays={dateRangeDays}
        setDateRangeDays={setDateRangeDays}
        onExport={onExport}
        totalComplaints={totals.totalComplaints}
        totalUsers={totals.totalUsers}
        refreshing={refreshing}
      />

      <KPIGrid
        analytics={analytics}
        dateRangeDays={dateRangeDays}
        userStats={userStats}
        totals={totals}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={analytics.trendData} />
        </div>
        <InsightsPanel
          insights={analytics.insights}
          completionRate={analytics.completionRate}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryBar data={analytics.categoryData} />
        <StatusDonut data={analytics.statusData} />
      </div>
    </div>
  );
}
