import React, { memo } from "react";
import { Download, Activity } from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

export default memo(function ReportsHeader({
  dateRangeDays,
  setDateRangeDays,
  onExport,
  totalComplaints,
  totalUsers,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-gray-900">
          <Activity className="text-blue-600" />
          Analytics Dashboard
        </h1>
        <p className="mt-1 text-sm font-semibold text-gray-600">
          Real-time totals: {totalComplaints} complaints, {totalUsers} users.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        {[30, 90, 180].map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setDateRangeDays(day)}
            className={cx(
              "rounded-xl px-4 py-2 text-sm font-extrabold transition",
              dateRangeDays === day
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Last {day} days
          </button>
        ))}

        <div className="mx-1 h-7 w-px bg-gray-200" />

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
});
