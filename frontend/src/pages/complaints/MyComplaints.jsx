import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import apiClient from "../../api/apiClient";
import {
  FiFileText,
  FiPlus,
  FiFilter,
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiMessageSquare,
  FiPaperclip,
  FiEye,
  FiRefreshCw,
  FiArchive,
  FiTrash2,
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

/* ================================================================
   🎨 CONFIGURATION
   ================================================================ */

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: FiClock,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FiRefreshCw,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: FiCheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: FiX,
  },
};

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    color: "text-red-600 bg-red-50 border-red-200",
  },
  high: {
    label: "High",
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  medium: {
    label: "Medium",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  low: {
    label: "Low",
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
};

/* ================================================================
   🧩 HELPERS
   ================================================================ */

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ================================================================
   🗑️ DELETE CONFIRMATION MODAL
   ================================================================ */

const DeleteModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <FiAlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
          Delete Complaint?
        </h3>
        <p className="text-center text-gray-600 text-sm mb-6">
          Are you sure you want to delete this complaint? This action cannot be
          undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FiTrash2 />
            )}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ================================================================
   🎴 COMPLAINT CARD
   ================================================================ */

const ComplaintCard = ({ complaint, onDeleteClick, onEditClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    _id,
    title,
    description,
    status,
    priority,
    category,
    location,
    createdAt,
    updatedAt,
    attachments = [],
    comments = [],
  } = complaint;

  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const priorityInfo = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = statusInfo.icon;

  // Only allow edit/delete while pending
  const canEditOrDelete = status === "pending";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full"
    >
      {/* Top: status + priority */}
      <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${statusInfo.color}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${priorityInfo.color}`}
          >
            {priorityInfo.label} Priority
          </span>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          #{_id.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
              {title}
            </h3>
            {category && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                <FiFileText className="w-3 h-3" /> {category}
              </span>
            )}
          </div>
        </div>

        {/* Description (expandable) */}
        <div className="mb-4">
          <p
            className={`text-gray-600 text-sm leading-relaxed ${
              !isExpanded && "line-clamp-3"
            }`}
          >
            {description}
          </p>
          {description && description.length > 150 && (
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-blue-600 text-xs font-medium mt-1 flex items-center gap-1 hover:underline"
            >
              {isExpanded ? (
                <>
                  Show Less <FiChevronUp />
                </>
              ) : (
                <>
                  Read More <FiChevronDown />
                </>
              )}
            </button>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <span>Submitted: {formatDate(createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiMapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">
              {location || "No location specified"}
            </span>
          </div>
          {updatedAt && updatedAt !== createdAt && (
            <div className="flex items-center gap-2 col-span-2">
              <FiRefreshCw className="w-4 h-4 text-gray-400" />
              <span>Updated: {formatDate(updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Attachments & comments badges */}
        {(attachments.length > 0 || comments.length > 0) && (
          <div className="flex gap-3 mt-4">
            {attachments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                <FiPaperclip /> {attachments.length} file
                {attachments.length > 1 ? "s" : ""}
              </span>
            )}
            {comments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                <FiMessageSquare /> {comments.length} comment
                {comments.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center gap-2">
        <div className="flex gap-2">
          {canEditOrDelete && (
            <>
              <button
                onClick={() => onEditClick(_id)}
                className="flex items-center justify-center w-8 h-8 rounded text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition border border-gray-200 bg-white"
                title="Edit complaint"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteClick(_id)}
                className="flex items-center justify-center w-8 h-8 rounded text-gray-600 hover:text-red-600 hover:bg-red-50 transition border border-gray-200 bg-white"
                title="Delete complaint"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <Link
          to={`/complaints/${_id}`}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-blue-600 transition shadow-sm"
        >
          <FiEye className="w-4 h-4" />
          View details
        </Link>
      </div>
    </motion.article>
  );
};

/* ================================================================
   🚀 MAIN COMPONENT: MY COMPLAINTS
   ================================================================ */

const MyComplaints = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest

  // delete state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch "my" complaints
  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/complaints/my");
        const list = Array.isArray(data) ? data : data.data || [];
        setComplaints(list);
      } catch (error) {
        console.error("Error fetching complaints:", error);
        toast.error("Failed to load your complaints.");
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  // WebSocket live updates for this user
  useEffect(() => {
    if (!user) return;
    const wsUrl =
      import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws/complaints";
    let socket;

    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "UPDATED_COMPLAINT" && msg.data?.user === user._id) {
            setComplaints((prev) =>
              prev.map((c) => (c._id === msg.data._id ? msg.data : c))
            );
          } else if (
            msg.type === "NEW_COMPLAINT" &&
            msg.data?.user === user._id
          ) {
            setComplaints((prev) => [msg.data, ...prev]);
          }
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };
    } catch (err) {
      console.error("WebSocket error:", err);
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user]);

  // Edit handler: go to dedicated edit page
  const handleEditClick = (id) => {
    navigate(`/complaints/${id}/edit`);
  };

  // Delete flow
  const initiateDelete = (id) => {
    const target = complaints.find((c) => c._id === id);
    if (target && target.status !== "pending") {
      toast.error("You can only delete complaints that are still pending.");
      return;
    }
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      const target = complaints.find((c) => c._id === deleteModal.id);
      if (target && target.status !== "pending") {
        throw new Error(
          "You can only delete complaints that are still pending."
        );
      }

      await apiClient.delete(`/complaints/${deleteModal.id}`);
      setComplaints((prev) => prev.filter((c) => c._id !== deleteModal.id));
      toast.success("Complaint deleted.");
      setDeleteModal({ isOpen: false, id: null });
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete complaint."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter + sort
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(search) ||
          c.description?.toLowerCase().includes(search) ||
          c._id?.toLowerCase().includes(search)
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return result;
  }, [complaints, filterStatus, searchTerm, sortBy]);

  // Stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Loading your complaints...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiFileText className="text-blue-600" /> My Complaints
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your submitted complaints and track their progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-4 mr-4 text-sm text-gray-600">
              <span>
                Total: <b>{stats.total}</b>
              </span>
              <span className="text-yellow-600">
                Pending: <b>{stats.pending}</b>
              </span>
              <span className="text-green-600">
                Resolved: <b>{stats.resolved}</b>
              </span>
            </div>
            <Link
              to="/complaints/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              <FiPlus className="w-5 h-5" /> New Complaint
            </Link>
          </div>
        </header>

        {/* Filters */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, description or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 md:w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 md:w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </section>

        {/* List */}
        <AnimatePresence mode="wait">
          {filteredComplaints.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiFilter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No complaints found
              </h3>
              <p className="text-gray-500 mt-1">
                Try adjusting your filters or submit a new complaint.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComplaints.map((complaint) => (
                <ComplaintCard
                  key={complaint._id}
                  complaint={complaint}
                  onDeleteClick={initiateDelete}
                  onEditClick={handleEditClick}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </main>
  );
};

export default MyComplaints;
