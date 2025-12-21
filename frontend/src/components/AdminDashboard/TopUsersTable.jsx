import React, { useMemo } from "react";
import { Users, Mail, ShieldCheck } from "lucide-react";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import { formatRelative, getInitials } from "./utils";

export default function TopUsersTable({
  users,
  limit = 25,
  loading = false,
  error = null,
  title = "Top users",
}) {
  const list = Array.isArray(users) ? users : [];

  const rows = useMemo(() => list.slice(0, limit), [list, limit]);

  const metaText = useMemo(() => {
    if (loading) return "Loading…";
    if (error) return "Error";
    if (list.length === 0) return "No users";
    return `Showing latest ${rows.length}`;
  }, [loading, error, list.length, rows.length]);

  const showTable = !loading && !error && rows.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
            <Users className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 truncate">
              {title}
            </h3>
            <p className="text-xs font-medium text-slate-500">{metaText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="blue">Latest</Badge>
          <Badge variant="slate">{list.length}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="border-t border-slate-100">
        {loading ? (
          <div className="p-5 space-y-3">
            <div className="h-4 w-56 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
          </div>
        ) : error ? (
          <EmptyState title="Failed to load users" subtitle={String(error)} />
        ) : showTable ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3 max-lg:hidden">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 max-md:hidden">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((u, idx) => {
                    const id =
                      u?._id || u?.id || `${u?.email || "user"}-${idx}`;
                    const createdAt = u?.createdAt || u?.created_at || null;

                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-extrabold text-white">
                              {getInitials(u?.name)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {u?.name || "Unknown"}
                              </p>
                              <p className="truncate text-xs text-slate-500 lg:hidden">
                                {u?.email || "—"}
                              </p>
                              <p className="truncate text-[11px] text-slate-400 max-sm:hidden">
                                {u?._id || u?.id || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3 text-slate-700 max-lg:hidden">
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            {u?.email || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                            <Badge variant="slate">
                              {String(u?.role || "user")}
                            </Badge>
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <Badge
                            variant={u?.isActive === false ? "rose" : "emerald"}
                          >
                            {u?.isActive === false ? "Inactive" : "Active"}
                          </Badge>
                        </td>

                        <td className="px-5 py-3 text-slate-600 max-md:hidden">
                          {createdAt ? formatRelative(createdAt) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 text-xs text-slate-500">
              <span>Total users: {list.length}</span>
              <span className="font-semibold text-slate-700">
                Showing: {rows.length}
              </span>
            </div>
          </>
        ) : (
          <EmptyState
            title="No users found"
            subtitle="Users will appear here once added."
          />
        )}

        {/* Dev-only hint: remove later */}
        {import.meta.env.DEV && !loading && !error && (
          <div className="px-5 pb-4 text-[11px] text-slate-400">
            Debug: users prop type ={" "}
            {Array.isArray(users) ? "array" : typeof users}, length ={" "}
            {Array.isArray(users) ? users.length : "n/a"}
          </div>
        )}
      </div>
    </section>
  );
}
