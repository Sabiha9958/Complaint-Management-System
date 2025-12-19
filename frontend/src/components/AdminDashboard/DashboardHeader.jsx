import React, { memo } from "react";
import { Activity, Download, RefreshCw } from "lucide-react";
import { formatRelative } from "./utils";
import Badge from "./ui/Badge";

export default memo(function DashboardHeader({
  title = "Admin Dashboard",
  subtitle = "System overview",
  lastUpdated,
  error,
  onRefresh,
  onExport,
  exporting = false,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <Activity className="h-4 w-4 text-indigo-600" />
          {subtitle}
          {lastUpdated ? (
            <span className="text-gray-400">
              • Updated {formatRelative(lastUpdated)}
            </span>
          ) : null}
        </p>

        {error ? (
          <div className="mt-2">
            <Badge variant="rose">{error}</Badge>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-extrabold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

        <button
          onClick={onExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </div>
  );
});
