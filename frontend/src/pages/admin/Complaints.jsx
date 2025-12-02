// src/pages/admin/Complaints.jsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import apiClient from "../../api/apiClient";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  ChevronDown,
  User,
  Tag,
  Calendar,
  Download,
} from "lucide-react";
import StatusUpdateModal from "./StatusUpdateModal";

// --- CONFIGURATION ---
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-yellow-700 bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    icon: RefreshCw,
  },
  resolved: {
    label: "Resolved",
    color: "text-green-700 bg-green-50 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700 bg-red-50 border-red-200",
    icon: XCircle,
  },
};

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "text-red-600 bg-red-100 border-red-200" },
  high: {
    label: "High",
    color: "text-orange-600 bg-orange-100 border-orange-200",
  },
  medium: {
    label: "Medium",
    color: "text-blue-600 bg-blue-100 border-blue-200",
  },
  low: { label: "Low", color: "text-gray-600 bg-gray-100 border-gray-200" },
};

const INITIAL_FILTERS = { status: "", priority: "", category: "", search: "" };
const INITIAL_PAGINATION = { page: 1, limit: 10, total: 0, pages: 0 };

// --- DETAIL MODAL ---
const ComplaintDetailModal = ({ complaint, onClose }) => {
  if (!complaint) return null;

  const StatusIcon = STATUS_CONFIG[complaint.status]?.icon || Clock;
  const statusCfg = STATUS_CONFIG[complaint.status];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {complaint.title}
            </h2>
            <p className="mt-1 text-xs text-gray-500 font-mono">
              ID: {complaint._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            type="button"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Status + meta */}
          <div className="flex flex-wrap items-center gap-3">
            {statusCfg && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusCfg.color}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {statusCfg.label}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Priority:{" "}
              <span className="text-gray-900">
                {PRIORITY_CONFIG[complaint.priority]?.label ||
                  complaint.priority}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Category:{" "}
              <span className="capitalize text-gray-900">
                {complaint.category}
              </span>
            </span>
          </div>

          {/* Description */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
              <FileText className="h-3 w-3" /> Description
            </h3>
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800">
              {complaint.description}
            </div>
          </section>

          {/* Attachments */}
          {Array.isArray(complaint.attachments) &&
            complaint.attachments.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <Tag className="h-3 w-3" /> Attachments (
                  {complaint.attachments.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {complaint.attachments.map((file, idx) => (
                    <a
                      key={file._id || idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-blue-600 hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="truncate">
                        <p className="truncate font-medium">
                          {file.originalName || file.filename || "Attachment"}
                        </p>
                        {file.size && (
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <FileText className="h-4 w-4 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </section>
            )}

          {/* Reporter + timeline */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                Reporter
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                  {complaint.user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {complaint.user?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {complaint.user?.email || "No email provided"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                Timeline
              </h3>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  <span className="font-semibold">Created:</span>
                  <span>{new Date(complaint.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                  <span className="font-semibold">Last Updated:</span>
                  <span>{new Date(complaint.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusModalComplaint, setStatusModalComplaint] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const sortByLatest = useCallback(
    (items) =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt) -
          new Date(a.createdAt || a.updatedAt)
      ),
    []
  );

  const handleStatusUpdateSuccess = (updatedComplaint) => {
    setComplaints((prev) =>
      sortByLatest(
        prev.map((c) =>
          (c._id || c.id) === (updatedComplaint._id || updatedComplaint.id)
            ? { ...c, ...updatedComplaint }
            : c
        )
      )
    );
  };

  // Fetch complaints from backend
  const fetchComplaints = useCallback(
    async (pageOverride) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", pageOverride || pagination.page);
        params.set("limit", pagination.limit);

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (filters.status) params.set("status", filters.status);
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.category) params.set("category", filters.category);

        const response = await apiClient.get(
          `/complaints?${params.toString()}`
        );

        const data = response.data?.data || response.data || [];
        const meta = response.data?.pagination ||
          response.data?.meta || {
            total: data.length,
            pages: 1,
            page: pagination.page,
            limit: pagination.limit,
          };

        setComplaints(sortByLatest(data));
        setPagination((prev) => ({
          ...prev,
          total: meta.total,
          pages: meta.pages,
          page: meta.page || prev.page,
        }));
      } catch (error) {
        toast.error("Failed to load complaints data.");
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearch,
      filters.status,
      filters.priority,
      filters.category,
      pagination.page,
      pagination.limit,
      sortByLatest,
    ]
  );

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // WebSocket: real-time live update
  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/complaints";

    let socket;
    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (!msg?.type) return;

          setComplaints((prev) => {
            if (msg.type === "NEW_COMPLAINT") {
              return sortByLatest([msg.data, ...prev]);
            }
            if (msg.type === "UPDATED_COMPLAINT") {
              return sortByLatest(
                prev.map((c) => (c._id === msg.data._id ? msg.data : c))
              );
            }
            if (msg.type === "DELETED_COMPLAINT") {
              return prev.filter((c) => c._id !== msg.data._id);
            }
            return prev;
          });

          if (msg.type === "NEW_COMPLAINT") {
            setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
          }
        } catch {
          // ignore malformed messages
        }
      };
    } catch {
      // ignore connection errors
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [sortByLatest]);

  // --- HANDLERS ---
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== "search") {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setDebouncedSearch("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDeleteConfirm = async () => {
    if (!complaintToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/complaints/${complaintToDelete._id}`);
      setComplaints((prev) =>
        prev.filter((c) => c._id !== complaintToDelete._id)
      );
      toast.success("Complaint deleted successfully");
      setShowDeleteModal(false);
      setComplaintToDelete(null);

      // If last row on page removed, move page back if possible, and reload
      if (complaints.length === 1 && pagination.page > 1) {
        const newPage = pagination.page - 1;
        setPagination((prev) => ({ ...prev, page: newPage }));
        fetchComplaints(newPage);
      } else {
        fetchComplaints();
      }
    } catch {
      toast.error("Failed to delete complaint.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (directionOrPage) => {
    setPagination((prev) => {
      let nextPage = prev.page;

      if (directionOrPage === "prev") {
        nextPage = Math.max(1, prev.page - 1);
      } else if (directionOrPage === "next") {
        nextPage = Math.min(prev.pages, prev.page + 1);
      } else if (typeof directionOrPage === "number") {
        nextPage = Math.min(Math.max(1, directionOrPage), prev.pages);
      }

      if (nextPage === prev.page) return prev;

      fetchComplaints(nextPage);
      return { ...prev, page: nextPage };
    });
  };

  const handleRefresh = () => fetchComplaints();

  const renderPriorityBadge = (priority) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
    return (
      <span
        className={`rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const isInitialLoading = loading && complaints.length === 0;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Complaint Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor, track, and resolve user submitted grievances in real
              time.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                toast.info("Connect this to /complaints/export for CSV")
              }
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              type="button"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <button
              onClick={handleRefresh}
              className={`flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 ${
                loading ? "cursor-not-allowed opacity-80" : ""
              }`}
              type="button"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="relative lg:col-span-5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, title, or user..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="lg:col-span-7 flex flex-wrap gap-3">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="min-w-[140px] flex-1 rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="min-w-[140px] flex-1 rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="min-w-[140px] flex-1 rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="IT">IT</option>
                <option value="Facility">Facility</option>
                <option value="Food">Food</option>
                <option value="Maintenance">Maintenance</option>
              </select>

              <button
                onClick={clearFilters}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                type="button"
              >
                <Filter className="mr-2 h-4 w-4" /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* List / Empty / Skeleton */}
        {isInitialLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="flex justify-between">
                  <div className="mb-4 h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-8 w-24 rounded bg-gray-200" />
                </div>
                <div className="mb-2 h-3 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mb-6 rounded-full bg-blue-50 p-6">
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              No complaints found
            </h3>
            <p className="mb-8 max-w-sm text-sm text-gray-500">
              No records match your current filters or search. Try adjusting or
              clearing them.
            </p>
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              type="button"
            >
              Clear all active filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const statusCfg = STATUS_CONFIG[complaint.status];
              const StatusIcon = statusCfg?.icon || Clock;

              return (
                <div
                  key={complaint._id}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      {/* Left: info */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          {renderPriorityBadge(complaint.priority)}
                          <span className="rounded border border-gray-100 bg-gray-50 px-2 py-0.5 font-mono text-[11px] tracking-wider text-gray-400">
                            {complaint._id.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        <h3 className="mb-1 text-lg font-bold leading-tight text-gray-900 line-clamp-1">
                          {complaint.title}
                        </h3>
                        <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                          {complaint.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            <span>{complaint.user?.name || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-gray-400" />
                            <span className="capitalize">
                              {complaint.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>
                              {new Date(
                                complaint.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: status + actions */}
                      <div
                        className="mt-4 flex flex-row gap-4 border-t border-gray-100 pt-4 sm:items-center lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-start gap-2">
                          {/* Status chip */}
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase ${
                              statusCfg?.color ||
                              "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusCfg?.label || complaint.status}
                          </span>

                          {/* Open status modal */}
                          <button
                            type="button"
                            onClick={() => setStatusModalComplaint(complaint)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <ChevronDown className="h-3 w-3" />
                            Change Status
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedComplaint(complaint)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="View Details"
                            type="button"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setComplaintToDelete(complaint);
                              setShowDeleteModal(true);
                            }}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                            type="button"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center text-sm text-gray-600 sm:text-left">
              Showing{" "}
              <span className="font-bold text-gray-900">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-900">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-900">
                {pagination.total}
              </span>{" "}
              entries
            </div>
            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <button
                onClick={() => handlePageChange("prev")}
                disabled={pagination.page === 1}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Prev
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange("next")}
                disabled={pagination.page === pagination.pages}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-900 bg-opacity-40 backdrop-blur-sm transition-opacity"
                onClick={() => setShowDeleteModal(false)}
              />
              <span
                className="hidden h-screen sm:inline-block sm:align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block w-full max-w-md transform overflow-hidden rounded-2xl border border-gray-100 bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:align-middle">
                <div className="bg-white px-6 pb-6 pt-6">
                  <div className="flex gap-4 sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-50 sm:mx-0">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-bold leading-6 text-gray-900">
                        Delete Complaint?
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm leading-relaxed text-gray-500">
                          You are about to permanently delete the complaint
                          <span className="font-semibold text-gray-800">
                            {" "}
                            &quot;{complaintToDelete?.title}&quot;{" "}
                          </span>
                          . This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteConfirm}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm transition-all hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-70"
                  >
                    {isDeleting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Yes, Delete It"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedComplaint && (
          <ComplaintDetailModal
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
          />
        )}

        {/* Status Update Modal */}
        {statusModalComplaint && (
          <StatusUpdateModal
            complaint={statusModalComplaint}
            onClose={() => setStatusModalComplaint(null)}
            onSuccess={handleStatusUpdateSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Complaints;
