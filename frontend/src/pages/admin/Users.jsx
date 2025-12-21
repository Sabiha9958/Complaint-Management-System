import React, { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../api/apiClient";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiShield,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiMail,
  FiBriefcase,
  FiFilter,
} from "react-icons/fi";

const getRoleBadgeStyle = (role) => {
  const styles = {
    admin: "bg-purple-100 text-purple-700 border-purple-300",
    staff: "bg-indigo-100 text-indigo-700 border-indigo-300",
    user: "bg-blue-100 text-blue-700 border-blue-300",
  };
  return styles[role?.toLowerCase()] || styles.user;
};

const getAvatarColor = (name) => {
  const colors = [
    "bg-gradient-to-br from-red-400 to-red-600",
    "bg-gradient-to-br from-yellow-400 to-yellow-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const apiBaseUrl = import.meta.env.VITE_API_URL;
  const cleanUrl = url.startsWith("/api/") ? url.replace("/api/", "/") : url;

  return cleanUrl.startsWith("/")
    ? `${apiBaseUrl}${cleanUrl}`
    : `${apiBaseUrl}/uploads/${cleanUrl}`;
};

function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

const Avatar = React.memo(function Avatar({ user, size = "md" }) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClass = size === "lg" ? "h-16 w-16 text-2xl" : "h-10 w-10 text-sm";
  const rawImage =
    user?.avatarPreview ||
    user?.profilePicture ||
    user?.avatarUrl ||
    user?.avatar ||
    user?.image;

  const src = !imgFailed ? normalizeImageUrl(rawImage) : null;

  if (src) {
    return (
      <img
        src={src}
        alt={user?.name || "User"}
        crossOrigin="anonymous"
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-md`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${getAvatarColor(
        user?.name
      )} flex items-center justify-center rounded-full text-white font-bold ring-2 ring-white shadow-md`}
      aria-label={user?.name || "User"}
    >
      {user?.name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
});

const Pagination = React.memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  const pageNumbers = useMemo(() => {
    const pages = [];
    const showPages = 5;

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    if (currentPage <= 3) {
      for (let i = 1; i <= showPages; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
      return pages;
    }

    if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - showPages + 1; i <= totalPages; i++)
        pages.push(i);
      return pages;
    }

    pages.push(1);
    pages.push("...");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
          title="First page"
        >
          <FiChevronsLeft className="h-4 w-4" />
        </button>

        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
        >
          <FiChevronLeft className="h-4 w-4" /> Previous
        </button>
      </div>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition ${
                currentPage === page
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
              type="button"
            >
              {page}
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
        >
          Next <FiChevronRight className="h-4 w-4" />
        </button>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
          title="Last page"
        >
          <FiChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

const UserTableRow = React.memo(function UserTableRow({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  return (
    <tr className="group border-b border-gray-50 transition-all hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {user.name}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <FiMail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeStyle(
            user.role
          )}`}
        >
          {user.role === "admin" && <FiShield className="h-3 w-3" />}
          {user.role?.toUpperCase()}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <FiBriefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">
            {user.department || (
              <span className="italic text-gray-400">Not assigned</span>
            )}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <button
          onClick={() => onToggleStatus(user._id, user.isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            user.isActive
              ? "bg-green-500 focus:ring-green-500"
              : "bg-gray-300 focus:ring-gray-400"
          }`}
          type="button"
          aria-label={`Toggle ${user.name} status`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              user.isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </td>

      <td className="px-6 py-4">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(user)}
            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit user"
            type="button"
          >
            <FiEdit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(user._id)}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete user"
            type="button"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const EditUserModal = React.memo(function EditUserModal({
  user,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "user",
    phone: user?.phone || "",
    department: user?.department || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key) => (e) =>
    setFormData((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        _id: user._id,
        ...formData,
        phone: formData.phone.trim(),
        department: formData.department.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slideUp overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FiEdit3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Edit User Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
            type="button"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <Avatar user={user} size="lg" />
            <div>
              <h4 className="font-semibold text-gray-900">{user.name}</h4>
              <p className="text-xs text-gray-500 font-mono">{user._id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={update("name")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={update("email")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={update("role")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={update("phone")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  placeholder="+91 xxxxx xxxxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={update("department")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                placeholder="Engineering, Sales, etc."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default function Users() {
  const usersPerPage = 25;

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 500);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const sortedUsers = useMemo(() => {
    return [...users].sort(
      (a, b) =>
        new Date(b.createdAt || b.updatedAt || 0) -
        new Date(a.createdAt || a.updatedAt || 0)
    );
  }, [users]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingUser(null);
  }, []);

  const openEdit = useCallback((u) => {
    setEditingUser(u);
    setShowModal(true);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const fetchUsers = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(usersPerPage),
        });

        if (debouncedSearch.trim())
          params.append("search", debouncedSearch.trim());
        if (activeTab !== "all") params.append("role", activeTab);

        const res = await apiClient.get(
          `/users?${params.toString()}`,
          signal ? { signal } : undefined
        );
        if (!res?.success) throw res;

        setUsers(res.data || []);
        setPagination({
          total: res.pagination?.total || 0,
          pages: res.pagination?.pages || 1,
        });

        if (res.stats) {
          setStats({
            total: res.stats.total,
            active: res.stats.active,
            inactive: res.stats.inactive,
            admins: res.stats.byRole?.admin || 0,
            staff: res.stats.byRole?.staff || 0,
            users: res.stats.byRole?.user || 0,
          });
        } else {
          setStats(null);
        }
      } catch (error) {
        if (error?.name !== "AbortError" && error?.code !== "ERR_CANCELED") {
          if (error?.code !== "TOKEN_EXPIRED" && error?.status !== 401) {
            toast.error(error?.message || "Failed to load users");
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [activeTab, currentPage, debouncedSearch]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearch]);

  const handleSaveUser = useCallback(
    async (updatedData) => {
      try {
        const payload = {
          name: updatedData.name,
          email: updatedData.email,
          role: updatedData.role,
          phone: updatedData.phone,
          department: updatedData.department,
        };

        const res = await apiClient.put(`/users/${updatedData._id}`, payload);
        if (!res?.success) throw res;

        const updatedUser = res.data || updatedData;
        setUsers((prev) =>
          prev.map((u) =>
            u._id === updatedUser._id ? { ...u, ...updatedUser } : u
          )
        );

        toast.success("User updated successfully");
        closeModal();

        fetchUsers();
      } catch (err) {
        toast.error(err?.message || "Failed to update user");
      }
    },
    [closeModal, fetchUsers]
  );

  const handleDelete = useCallback(
    async (id) => {
      const ok = window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      );
      if (!ok) return;

      try {
        const res = await apiClient.delete(`/users/${id}`);
        if (!res?.success) throw res;

        setUsers((prev) => prev.filter((u) => u._id !== id));
        toast.success("User deleted successfully");

        fetchUsers();
      } catch (err) {
        toast.error(err?.message || "Failed to delete user");
      }
    },
    [fetchUsers]
  );

  const handleToggleStatus = useCallback(
    async (id, currentStatus) => {
      try {
        const res = await apiClient.put(`/users/${id}`, {
          isActive: !currentStatus,
        });
        if (!res?.success) throw res;

        setUsers((prev) =>
          prev.map((u) =>
            u._id === id ? { ...u, isActive: !currentStatus } : u
          )
        );
        toast.success(`User ${!currentStatus ? "activated" : "deactivated"}`);

        fetchUsers();
      } catch (err) {
        toast.error(err?.message || "Failed to update status");
      }
    },
    [fetchUsers]
  );

  const TabButton = ({ id, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative whitespace-nowrap px-4 pb-3 text-sm font-semibold transition-all ${
        activeTab === id ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
      }`}
      type="button"
    >
      {label}
      {typeof count === "number" && (
        <span
          className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            activeTab === id
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {count}
        </span>
      )}
      {activeTab === id && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-2 shadow-lg">
                <FiUsers className="h-6 w-6 text-white" />
              </div>
              User Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 bg-gray-50/50 p-5 space-y-4">
            <div className="flex gap-6 overflow-x-auto border-b border-gray-200 -mb-px scrollbar-hide">
              <TabButton id="all" label="All Users" count={stats?.total} />
              <TabButton id="admin" label="Admins" count={stats?.admins} />
              <TabButton id="staff" label="Staff" count={stats?.staff} />
              <TabButton id="user" label="Users" count={stats?.users} />
            </div>

            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100"
                  type="button"
                >
                  <FiX className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 rounded bg-gray-200" />
                            <div className="h-3 w-24 rounded bg-gray-100" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-11 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))
                ) : sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => (
                    <UserTableRow
                      key={user._id}
                      user={user}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="mb-4 rounded-full bg-gray-100 p-6">
                          <FiFilter className="h-10 w-10 text-gray-300" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">
                          No users found
                        </p>
                        <p className="text-sm text-gray-500">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && pagination.pages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}

          {!loading && pagination.pages <= 1 && pagination.total > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
              <p className="text-sm text-gray-600 text-center">
                Showing all {pagination.total} user
                {pagination.total !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={closeModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
