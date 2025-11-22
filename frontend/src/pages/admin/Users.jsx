import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    role: "",
    isActive: "",
    search: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams(filters);

      const response = await axios.get(
        `http://localhost:5000/api/users?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(response.data.data);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/users/${editingUser._id}`,
        editingUser,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowEditModal(false);
      fetchUsers();
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to ${
          currentStatus ? "deactivate" : "activate"
        } this user?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/users/${userId}/status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchUsers();
      alert("User status updated successfully!");
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchUsers();
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading && !users.length) {
    return (
      <div className="users-container">
        <div className="loading-spinner">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>👥 Users Management</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <p className="stat-number">{stats.active}</p>
          </div>
          <div className="stat-card">
            <h3>Admins</h3>
            <p className="stat-number">{stats.admins}</p>
          </div>
          <div className="stat-card">
            <h3>Staff</h3>
            <p className="stat-number">{stats.staff}</p>
          </div>
          <div className="stat-card">
            <h3>Regular Users</h3>
            <p className="stat-number">{stats.users}</p>
          </div>
          <div className="stat-card">
            <h3>Inactive</h3>
            <p className="stat-number">{stats.inactive}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="search-input"
        />

        <select
          value={filters.role}
          onChange={(e) => handleFilterChange("role", e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="user">User</option>
        </select>

        <select
          value={filters.isActive}
          onChange={(e) => handleFilterChange("isActive", e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={() =>
            setFilters({
              role: "",
              isActive: "",
              search: "",
              page: 1,
              limit: 10,
            })
          }
          className="btn-secondary"
        >
          Clear Filters
        </button>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge badge-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.department || "-"}</td>
                <td>{user.phone || "-"}</td>
                <td>
                  <span
                    className={`badge ${
                      user.isActive ? "badge-active" : "badge-inactive"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="btn-action btn-edit"
                    title="Edit User"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user._id, user.isActive)}
                    className="btn-action btn-toggle"
                    title={user.isActive ? "Deactivate" : "Activate"}
                  >
                    {user.isActive ? "🔒" : "🔓"}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="btn-action btn-delete"
                    title="Delete User"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && <div className="no-data">No users found</div>}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                  required
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={editingUser.department || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      department: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editingUser.phone || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, phone: e.target.value })
                  }
                  pattern="[0-9]{10}"
                  title="Phone number must be 10 digits"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        isActive: e.target.checked,
                      })
                    }
                  />
                  Active
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
