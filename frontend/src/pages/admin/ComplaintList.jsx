/**
 * ================================================================
 * 📋 COMPLAINT LIST - Grid view with filters and detailed modal
 * ================================================================
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ComplaintAPI } from "../../api/api";
import {
  FiTrash2,
  FiEye,
  FiSearch,
  FiFilter,
  FiX,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiClock,
  FiPaperclip,
  FiMessageSquare,
} from "react-icons/fi";
import {
  getStatusStyle,
  getPriorityStyle,
  CATEGORY_LABELS,
} from "../../utils/constants";

const ITEMS_PER_PAGE = 12;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const LoadingState = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600" />
  </div>
);

const EmptyState = ({ hasFilters, onClearFilters }) => (
  <section className="bg-white rounded-xl shadow-md p-12 text-center">
    <FiAlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      No complaints found
    </h3>
    <p className="text-gray-500 mb-6">
      {hasFilters
        ? "Try adjusting your filters to see more results"
        : "No complaints have been submitted yet"}
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Clear Filters
      </button>
    )}
  </section>
);

// Detailed View Modal
const ComplaintDetailModal = ({ complaint, onClose, onDelete }) => {
  const statusStyle = getStatusStyle(complaint.status);
  const priorityStyle = getPriorityStyle(complaint.priority);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {complaint.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Priority */}
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} capitalize`}
            >
              {complaint.status.replace(/_/g, " ")}
            </span>
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${priorityStyle.bg} ${priorityStyle.text} capitalize`}
            >
              {complaint.priority}
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              DESCRIPTION
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <FiUser className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  SUBMITTED BY
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {complaint.contactInfo?.name || complaint.user?.name || "N/A"}
                </p>
                <p className="text-xs text-gray-500">
                  {complaint.contactInfo?.email ||
                    complaint.user?.email ||
                    "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  CREATED ON
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(complaint.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  LOCATION
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {complaint.location?.city || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <FiFileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  CATEGORY
                </p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {CATEGORY_LABELS[complaint.category] || complaint.category}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <FiPaperclip className="h-4 w-4" />
                ATTACHMENTS ({complaint.attachments.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {complaint.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FiPaperclip className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 truncate">
                      {file.originalName || `Attachment ${idx + 1}`}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {complaint.comments && complaint.comments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <FiMessageSquare className="h-4 w-4" />
                COMMENTS ({complaint.comments.length})
              </h3>
              <div className="space-y-3">
                {complaint.comments.map((comment, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {comment.user?.name || "User"}
                        {comment.isStaffComment && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Staff
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <Link
              to={`/complaint/${complaint._id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <FiEye className="h-4 w-4" />
              View Full Details
            </Link>
            <button
              onClick={() => onDelete(complaint._id, complaint.title)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <FiTrash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ComplaintList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: ITEMS_PER_PAGE,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        ),
      };

      const response = await ComplaintAPI.getAll(params);

      if (response.success) {
        setComplaints(response.data?.complaints || []);
        setPagination({
          currentPage: response.data?.page || 1,
          totalPages: response.data?.pages || 1,
          total: response.data?.total || 0,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch complaints", { toastId: "fetch-error" });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Delete complaint
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;

    setDeletingId(id);
    setSelectedComplaint(null);

    try {
      await ComplaintAPI.delete(id);
      toast.success("Complaint deleted", { toastId: "delete-success" });
      fetchComplaints();
    } catch (error) {
      toast.error("Failed to delete complaint", { toastId: "delete-error" });
    } finally {
      setDeletingId(null);
    }
  };

  // Pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ status: "", category: "", priority: "", search: "" });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((val) => val !== ""),
    [filters]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiFileText className="h-8 w-8 text-blue-600" />
            All Complaints
          </h1>
          <p className="text-gray-600 mt-2">
            Showing {complaints.length} of {pagination.total} complaints
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchComplaints}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => window.open("/api/complaints/export/csv", "_blank")}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiDownload className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            <FiFilter className="h-5 w-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                Active
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <FiX className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div className="p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="search"
                placeholder="Search complaints..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="service">Service</option>
              <option value="product">Product</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}
      </section>

      {/* Content */}
      {loading && !complaints.length ? (
        <LoadingState />
      ) : complaints.length ? (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint) => {
              const statusStyle = getStatusStyle(complaint.status);
              const priorityStyle = getPriorityStyle(complaint.priority);

              return (
                <article
                  key={complaint._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 pr-2">
                        {complaint.title}
                      </h3>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} capitalize shrink-0`}
                      >
                        {complaint.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {complaint.description}
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {complaint.category}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Priority</p>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text} capitalize`}
                        >
                          {complaint.priority}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiClock className="h-3.5 w-3.5" />
                      {new Date(complaint.createdAt).toLocaleDateString(
                        "en-IN"
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(pagination.currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(
                  pagination.currentPage * ITEMS_PER_PAGE,
                  pagination.total
                )}{" "}
                of {pagination.total} results
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default ComplaintList;
