import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Users,
} from "lucide-react";
import apiClient from "../../api/apiClient";

const ENDPOINTS = {
  rolesList: "/roles",
  permsList: "/permissions",
  patchRolePerms: (roleId) => `/roles/${roleId}/permissions`,
};

// Adjust to your backend: { success: true, data: [...] }
const normalizeArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  if (Array.isArray(payload.roles)) return payload.roles;
  if (Array.isArray(payload.permissions)) return payload.permissions;
  if (Array.isArray(payload.data?.roles)) return payload.data.roles;
  if (Array.isArray(payload.data?.permissions)) return payload.data.permissions;
  return [];
};

const toLower = (v) => String(v || "").toLowerCase();

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);
  const [activeRoleId, setActiveRoleId] = useState(null);

  const [draft, setDraft] = useState(() => new Set());

  const [roleQuery, setRoleQuery] = useState("");
  const [permQuery, setPermQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [usingMock, setUsingMock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [rRes, pRes] = await Promise.all([
        apiClient.get(ENDPOINTS.rolesList),
        apiClient.get(ENDPOINTS.permsList),
      ]);

      const rolesList = normalizeArray(rRes.data);
      const permsList = normalizeArray(pRes.data);

      setRoles(rolesList);
      setPerms(permsList);
      setActiveRoleId((prev) => prev || rolesList?.[0]?._id || null);
      setUsingMock(false);
    } catch (e) {
      setUsingMock(true);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to load roles and permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeRole = useMemo(
    () => roles.find((r) => r._id === activeRoleId) || null,
    [roles, activeRoleId]
  );

  // Sync draft with active role
  useEffect(() => {
    if (!activeRole) {
      setDraft(new Set());
      return;
    }
    setDraft(
      new Set(
        Array.isArray(activeRole.permissions) ? activeRole.permissions : []
      )
    );
  }, [activeRole]);

  const filteredRoles = useMemo(() => {
    const q = toLower(roleQuery).trim();
    if (!q) return roles;
    return roles.filter((r) => toLower(r.name).includes(q));
  }, [roles, roleQuery]);

  const groupedPerms = useMemo(() => {
    const q = toLower(permQuery).trim();
    const filtered = perms.filter(
      (p) => !q || toLower(p.name).includes(q) || toLower(p.key).includes(q)
    );
    return filtered.reduce((acc, p) => {
      const cat = p.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});
  }, [perms, permQuery]);

  const toggle = (key) => {
    setDraft((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setDraft(new Set(perms.map((p) => p.key)));
  const clearAll = () => setDraft(new Set());

  const selectAllInCategory = (category) => {
    const keys = (groupedPerms[category] || []).map((p) => p.key);
    setDraft((prev) => new Set([...prev, ...keys]));
  };

  const clearCategory = (category) => {
    const keys = new Set((groupedPerms[category] || []).map((p) => p.key));
    setDraft((prev) => new Set([...prev].filter((k) => !keys.has(k))));
  };

  const save = async () => {
    if (!activeRole) return;

    // Optimistic UI
    setSaving(true);
    setError("");
    const previousPermissions = activeRole.permissions || [];

    setRoles((rs) =>
      rs.map((r) =>
        r._id === activeRole._id ? { ...r, permissions: [...draft] } : r
      )
    );

    try {
      await apiClient.patch(ENDPOINTS.patchRolePerms(activeRole._id), {
        permissions: [...draft],
      });
    } catch (e) {
      // Revert on error
      setRoles((rs) =>
        rs.map((r) =>
          r._id === activeRole._id
            ? { ...r, permissions: previousPermissions }
            : r
        )
      );
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to save permissions."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-gray-600">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 shadow-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          <span>Loading roles and permissions…</span>
        </div>
      </div>
    );
  }

  const totalPerms = perms.length;
  const grantedCount = activeRole ? (activeRole.permissions || []).length : 0;

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
      {/* Left: Roles list */}
      <aside className="rounded-2xl border bg-white shadow-sm lg:col-span-4 xl:col-span-3">
        <div className="sticky top-0 z-10 space-y-3 rounded-t-2xl border-b bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Users size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Roles</div>
              <div className="text-xs text-gray-500">
                Select a role to edit permissions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
              placeholder="Search roles"
              className="w-full text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <ul className="max-h-[70vh] divide-y overflow-auto">
          {filteredRoles.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-gray-500">
              No roles match your search.
            </li>
          ) : (
            filteredRoles.map((r) => {
              const isActive = r._id === activeRoleId;
              return (
                <li
                  key={r._id}
                  onClick={() => setActiveRoleId(r._id)}
                  className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors ${
                    isActive ? "bg-emerald-50" : "hover:bg-emerald-50/70"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="truncate text-xs text-gray-500">
                      {r.description || "No description"}
                    </div>
                  </div>
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-700">
                    <ShieldCheck size={12} />
                    {r.permissions?.length || 0}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      {/* Right: Permissions */}
      <section className="rounded-2xl border bg-white shadow-sm lg:col-span-8 xl:col-span-9">
        <div className="sticky top-0 z-10 space-y-3 rounded-t-2xl border-b bg-white/95 p-4 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">
                    {activeRole ? activeRole.name : "Select a role"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeRole
                      ? `${grantedCount} of ${totalPerms} permissions granted`
                      : "Choose a role from the left panel"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-2 md:max-w-xs">
              <div className="flex w-full items-center gap-2 rounded-lg border px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  value={permQuery}
                  onChange={(e) => setPermQuery(e.target.value)}
                  placeholder="Search permissions"
                  className="w-full text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={14} />
                Reload
              </button>

              <button
                onClick={selectAll}
                disabled={!activeRole}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Select all
              </button>

              <button
                onClick={clearAll}
                disabled={!activeRole}
                className="rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Clear all
              </button>

              <button
                onClick={save}
                disabled={saving || !activeRole}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-1 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={16} className="mt-0.5" />
              <div>{error}</div>
            </div>
          )}
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-auto p-4">
          {Object.keys(groupedPerms).length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed bg-gray-50 text-xs text-gray-500">
              No permissions found for this filter.
            </div>
          ) : (
            Object.entries(groupedPerms).map(([category, list]) => {
              const checkedCount = list.filter((p) => draft.has(p.key)).length;
              const allInCat = list.length > 0 && checkedCount === list.length;

              return (
                <div
                  key={category}
                  className="rounded-xl border bg-white shadow-xs transition hover:shadow-sm"
                >
                  <div className="flex items-center justify-between border-b bg-gray-50 px-3 py-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                      {category}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => selectAllInCategory(category)}
                        className="rounded border px-2 py-1 text-[10px] font-medium hover:bg-white"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => clearCategory(category)}
                        className="rounded border px-2 py-1 text-[10px] font-medium hover:bg-white"
                      >
                        Clear
                      </button>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] ${
                          allInCat
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {allInCat ? <Check size={12} /> : <X size={12} />}
                        {checkedCount}/{list.length}
                      </span>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 gap-1 p-3 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((p) => (
                      <li key={p.key}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={draft.has(p.key)}
                            onChange={() => toggle(p.key)}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            disabled={!activeRole}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-900">
                              {p.name}
                            </div>
                            <div className="truncate text-xs text-gray-500">
                              {p.key}
                            </div>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
