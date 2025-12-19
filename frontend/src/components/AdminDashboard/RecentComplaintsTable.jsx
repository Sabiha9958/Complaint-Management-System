import React, { memo } from "react";
import { Clock, FileText, ChevronRight } from "lucide-react";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import { formatRelative, priorityVariant, statusVariant } from "./utils";

export default memo(function RecentComplaintsTable({
  complaints = [],
  onOpen,
  limit = 25,
}) {
  const rows = complaints.slice(0, limit);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Recent complaints
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Showing latest {Math.min(limit, complaints.length)}
            </p>
          </div>
        </div>

        <Badge variant="slate">Latest</Badge>
      </div>

      {/* Body */}
      {rows.length ? (
        <div className="border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3 max-sm:hidden">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 max-md:hidden">Created</th>
                  <th className="px-5 py-3 text-right"> </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((c) => {
                  const id = c.id || c._id;

                  return (
                    <tr
                      key={id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpen?.(id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onOpen?.(id);
                      }}
                      className={[
                        "group cursor-pointer",
                        "hover:bg-slate-50",
                        "focus-within:bg-slate-50",
                        "outline-none",
                      ].join(" ")}
                    >
                      <td className="px-5 py-3 align-top">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-extrabold text-slate-700">
                          {String(id || "")
                            .slice(-6)
                            .toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {c.title || "Untitled"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {c.category || "Uncategorized"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-3 max-sm:hidden">
                        <Badge variant={priorityVariant(c.priority)}>
                          {String(c.priority || "low")}
                        </Badge>
                      </td>

                      <td className="px-5 py-3">
                        <Badge variant={statusVariant(c.status)}>
                          {String(c.status || "unknown")}
                        </Badge>
                      </td>

                      <td className="px-5 py-3 text-slate-600 max-md:hidden">
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {formatRelative(c.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-slate-400 transition-colors group-hover:text-indigo-600">
                          View <ChevronRight className="h-4 w-4" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 text-xs text-slate-500">
            <span>Click a row to open details</span>
            <span className="font-semibold text-slate-700">
              Total: {complaints.length}
            </span>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100">
          <EmptyState
            title="No complaints yet"
            subtitle="New complaints will show up here."
          />
        </div>
      )}
    </section>
  );
});
