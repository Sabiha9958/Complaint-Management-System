import React, { memo, useMemo } from "react";
import { Search, RotateCcw } from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");

const CONTROL =
  "h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition " +
  "focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-200";

export default memo(function FilterBar({
  filters,
  setFilters,
  onReset,
  resultsCount,
}) {
  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All status" },
      { value: "open", label: "Open" },
      { value: "pending", label: "Pending" },
      { value: "in-progress", label: "In progress" },
      { value: "resolved", label: "Resolved" },
      { value: "rejected", label: "Rejected" },
      { value: "closed", label: "Closed" },
    ],
    []
  );

  const priorityOptions = useMemo(
    () => [
      { value: "all", label: "All priority" },
      { value: "urgent", label: "Urgent" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
    []
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search || ""}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
              placeholder="Search title, user, email, id…"
              aria-label="Search complaints"
              className={cn(CONTROL, "w-full pl-10")}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status || "all"}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
              aria-label="Filter by status"
              className={cn(CONTROL, "min-w-[160px]")}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={filters.priority || "all"}
              onChange={(e) =>
                setFilters((p) => ({ ...p, priority: e.target.value }))
              }
              aria-label="Filter by priority"
              className={cn(CONTROL, "min-w-[160px]")}
            >
              {priorityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onReset}
              className={cn(
                "h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700",
                "inline-flex items-center gap-2 transition",
                "hover:bg-slate-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:border-indigo-400"
              )}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        {resultsCount != null && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-extrabold text-slate-900">
                {resultsCount}
              </span>{" "}
              result{resultsCount === 1 ? "" : "s"}.
            </p>

            {/* Small hint (optional but nice UX) */}
            <span className="text-xs font-semibold text-slate-400">
              Tip: Press Tab to jump filters
            </span>
          </div>
        )}
      </div>
    </section>
  );
});
