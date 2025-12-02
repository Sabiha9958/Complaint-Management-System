import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../api/apiClient";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMail,
  FiBriefcase,
} from "react-icons/fi";

// ====================== Helpers ======================
const getRoleBadgeStyle = (role) => {
  switch (role?.toLowerCase()) {
    case "admin":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "staff":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

const getRandomColor = (name) => {
  const colors = [
    "bg-red-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-pink-500",
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  return colors[charCode % colors.length];
};

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  let cleanUrl = url;
  if (cleanUrl.startsWith("/api/")) cleanUrl = cleanUrl.replace("/api/", "/");
  if (cleanUrl.startsWith("/")) return `${apiBaseUrl}${cleanUrl}`;
  return `${apiBaseUrl}/uploads/${cleanUrl}`;
};

// ====================== Components ======================
const Avatar = ({ user, size = "md" }) => {
  const sizeClasses =
    size === "lg" ? "h-16 w-16 text-2xl" : "h-10 w-10 text-sm";
  const rawImage =
    user?.avatarPreview ||
    user?.profilePicture ||
    user?.avatarUrl ||
    user?.avatar ||
    user?.image ||
    null;
  const src = normalizeImageUrl(rawImage);
  if (src) {
    return (
      <img
        src={src}
        alt={user?.name || "User avatar"}
        crossOrigin="anonymous"
        className={`${sizeClasses} rounded-full object-cover border border-gray-200 shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses} ${getRandomColor(user?.name)} flex items-center justify-center rounded-full text-white font-bold border border-white shadow-sm`}
    >
      {user?.name?.charAt(0).toUpperCase() || "U"}
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value || 0}</h3>
      </div>
      <div className={`rounded-xl bg-opacity-10 p-3 ${colorClass}`}>
        <Icon className={`h-6 w-6 ${colorClass.replace("bg-", "text-")}`} />
      </div>
    </div>
  </div>
);

const UserRow = ({ user, onEdit, onDelete, onToggleStatus }) => (
  <tr className="group border-b border-gray-100 transition-colors last:border-none hover:bg-gray-50/80">
    <td className="px-6 py-4">
      <div className="flex items-center gap-4">
        <Avatar user={user} />
        <div>
          <div className="font-semibold text-gray-900">{user.name}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FiMail className="h-3 w-3" /> {user.email}
          </div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeStyle(user.role)}`}
      >
        {user.role === "admin" && <FiShield className="mr-1 h-3 w-3" />}
        {user.role?.toUpperCase()}
      </span>
    </td>
    <td className="px-6 py-4">
      <div className="text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <FiBriefcase className="h-3.5 w-3.5 text-gray-400" />
          {user.department || (
            <span className="italic text-gray-400">No department</span>
          )}
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <button
        onClick={() => onToggleStatus(user._id, user.isActive)}
        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          user.isActive ? "bg-green-500" : "bg-gray-300"
        }`}
        type="button"
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            user.isActive ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(user)}
          className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
          title="Edit Details"
          type="button"
        >
          <FiEdit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(user._id)}
          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
          title="Delete User"
          type="button"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>
    </td>
  </tr>
);

const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    role: user.role || "user",
    phone: user.phone || "",
    department: user.department || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      _id: user._id,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      phone: formData.phone?.trim() || "",
      department: formData.department?.trim() || "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Edit User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-600"
            type="button"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="mb-2 flex items-center gap-4">
            <Avatar user={user} size="lg" />
            <div>
              <h4 className="font-semibold text-gray-900">{user.name}</h4>
              <p className="text-xs text-gray-500">ID: {user._id}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-700">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-700">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91..."
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase text-gray-700">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Engineering"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ====================== Main Component ======================
const Users = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const sortByLatest = useCallback(
    (list) =>
      [...list].sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || 0) -
          new Date(a.createdAt || a.updatedAt || 0)
      ),
    []
  );

  const fetchUsers = useCallback(
    async (page = pagination.currentPage) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 10 });
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (activeTab !== "all") params.append("role", activeTab);
        const res = await apiClient.get(`/auth/users?${params.toString()}`);
        if (!res.success) throw res;
        const payload = res.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.data || payload?.users || [];
        setUsers(sortByLatest(list));
        // Set pagination (default fallback)
        setPagination({
          currentPage: page,
          totalPages: payload?.pagination?.pages || 1,
        });
        setStats(payload?.stats || null);
      } catch (error) {
        if (error.code === "TOKEN_EXPIRED" || error.status === 401) return;
        toast.error(error.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, searchQuery, sortByLatest]
  );

  useEffect(() => {
    fetchUsers(1); // Reset to first page on filter/search change
  }, [activeTab, searchQuery, fetchUsers]);

  // For page navigation (Next, Prev)
  const handlePageChange = (newPage) => {
    if (
      newPage === pagination.currentPage ||
      newPage < 1 ||
      newPage > pagination.totalPages
    )
      return;
    fetchUsers(newPage);
  };

  // Handle user update: only send editable fields
  const handleSaveUser = async (updatedData) => {
    try {
      // Only send editable user fields
      const allowedFields = [
        "name",
        "email",
        "role",
        "phone",
        "department",
        "isActive",
      ];
      const updatedUser = allowedFields.reduce((obj, key) => {
        if (updatedData[key] !== undefined) obj[key] = updatedData[key];
        return obj;
      }, {});
      const res = await apiClient.put(
        `/auth/users/${updatedData._id}`,
        updatedUser
      );
      if (!res.success) throw res;
      const newUser = res.data || { ...updatedData, ...updatedUser };
      setUsers((prev) =>
        sortByLatest(prev.map((u) => (u._id === newUser._id ? newUser : u)))
      );
      toast.success("User updated successfully");
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This user will be permanently deleted."))
      return;
    try {
      const res = await apiClient.delete(`/auth/users/${id}`);
      if (!res.success) throw res;
      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      toast.error(err.message || "Deletion failed");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await apiClient.put(`/auth/users/${id}`, {
        isActive: !currentStatus,
      });
      if (!res.success) throw res;
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: !currentStatus } : u))
      );
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error(err.message || "Status update failed");
    }
  };

  const TabButton = ({ id, label, count }) => (
    <button
      onClick={() => {
        setActiveTab(id);
      }}
      className={`whitespace-nowrap px-1 pb-3 text-sm font-medium border-b-2 transition-all ${
        activeTab === id
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      }`}
      type="button"
    >
      {label}{" "}
      {typeof count === "number" ? (
        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {count}
        </span>
      ) : null}
    </button>
  );

  // For pagination
  const { currentPage, totalPages } = pagination;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-900 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <FiUsers className="text-blue-600" /> User Directory
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage system access, roles, and user profiles.
            </p>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Users"
              value={stats.total}
              icon={FiUsers}
              colorClass="bg-blue-500"
            />
            <StatsCard
              title="Active"
              value={stats.active}
              icon={FiUserCheck}
              colorClass="bg-green-500"
            />
            <StatsCard
              title="Administrators"
              value={stats.admins}
              icon={FiShield}
              colorClass="bg-purple-500"
            />
            <StatsCard
              title="Inactive"
              value={stats.inactive}
              icon={FiUserX}
              colorClass="bg-red-500"
            />
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-gray-100 p-4">
            <div className="hide-scrollbar flex gap-6 overflow-x-auto border-b border-gray-100">
              <TabButton id="all" label="All Members" count={stats?.total} />
              <TabButton
                id="admin"
                label="Administrators"
                count={stats?.admins}
              />
              <TabButton id="staff" label="Staff" count={stats?.staff} />
              <TabButton id="user" label="Regular Users" count={stats?.users} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="relative w-full md:w-80">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-10 py-2.5 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-gray-200" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 rounded bg-gray-200" />
                            <div className="h-3 w-20 rounded bg-gray-100" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-16 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-10 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      onEdit={(u) => {
                        setEditingUser(u);
                        setShowModal(true);
                      }}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 rounded-full bg-gray-100 p-4">
                          <FiSearch className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                          No users found
                        </p>
                        <p className="text-sm">
                          Try adjusting your filters or search query.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Enhanced Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                type="button"
              >
                <FiChevronLeft /> Previous
              </button>
              <span className="text-sm text-gray-600">
                Page{" "}
                <span className="font-semibold text-gray-900">
                  {currentPage}
                </span>{" "}
                of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                type="button"
              >
                Next <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
      {showModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

export default Users;
