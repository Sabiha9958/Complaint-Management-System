import React, { memo } from "react";
import { Users, Mail, ShieldCheck } from "lucide-react";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import { formatRelative, getInitials } from "./utils";

export default memo(function TopUsersTable({ users = [], limit = 25 }) {
  const rows = users.slice(0, limit);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Top users
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Showing latest {Math.min(limit, users.length)}
            </p>
          </div>
        </div>

        <Badge variant="blue">Latest</Badge>
      </div>

      {rows.length ? (
        <div className="border-t border-slate-100">
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
                {rows.map((u) => {
                  const id = u._id || u.id;

                  return (
                    <tr key={id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-extrabold text-white">
                            {getInitials(u.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {u.name || "Unknown"}
                            </p>
                            {/* On small screens show email here instead of a separate column */}
                            <p className="truncate text-xs text-slate-500 lg:hidden">
                              {u.email || "—"}
                            </p>
                            <p className="truncate text-[11px] text-slate-400 max-sm:hidden">
                              {id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-slate-700 max-lg:hidden">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {u.email || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-slate-400" />
                          <Badge variant="slate">
                            {String(u.role || "user")}
                          </Badge>
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <Badge
                          variant={u.isActive === false ? "rose" : "emerald"}
                        >
                          {u.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </td>

                      <td className="px-5 py-3 text-slate-600 max-md:hidden">
                        {formatRelative(u.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 text-xs text-slate-500">
            <span>Users: {users.length}</span>
            <span className="font-semibold text-slate-700">
              Showing: {rows.length}
            </span>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100">
          <EmptyState
            title="No users found"
            subtitle="Users will appear here once added."
          />
        </div>
      )}
    </section>
  );
});
