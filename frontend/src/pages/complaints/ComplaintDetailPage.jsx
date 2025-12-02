// src/pages/complaints/ComplaintDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ComplaintAPI } from "../../api/api";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Image as ImageIcon,
  Download,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw,
  Archive,
} from "lucide-react";

/* ================================================================
   🎨 CONSTANTS & CONFIGS
   ================================================================ */

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: RefreshCw,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  closed: {
    label: "Closed",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Archive,
  },
};

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-500 text-white" },
  high: { label: "High", color: "bg-orange-500 text-white" },
  medium: { label: "Medium", color: "bg-blue-500 text-white" },
  low: { label: "Low", color: "bg-gray-500 text-white" },
};

const CATEGORY_CONFIG = {
  IT: { color: "bg-purple-100 text-purple-700", icon: "💻" },
  Facilities: { color: "bg-green-100 text-green-700", icon: "🏢" },
  HR: { color: "bg-yellow-100 text-yellow-700", icon: "👥" },
  Finance: { color: "bg-blue-100 text-blue-700", icon: "💰" },
  Security: { color: "bg-red-100 text-red-700", icon: "🔒" },
};

/* ================================================================
   🛠️ UTILITY FUNCTIONS
   ================================================================ */

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTimeAgo = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

/* ================================================================
   🎨 SUB-COMPONENTS
   ================================================================ */

const AttachmentViewer = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  const handleDownloadAll = () => {
    attachments.forEach((file) => {
      if (!file.url) return;
      const a = document.createElement("a");
      a.href = file.url;
      a.download = file.originalName || file.filename || "attachment";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Attachments ({attachments.length})
        </h3>
        {attachments.length > 1 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {attachments.map((file, idx) => {
          const isImage =
            file.mimetype?.startsWith("image/") ||
            file.type?.startsWith("image/");
          const url = file.url || file.path || file.secure_url;
          const name =
            file.originalName || file.filename || `Attachment ${idx + 1}`;

          if (!url) return null;

          return (
            <div key={file._id || idx} className="group relative">
              {isImage ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-400 transition-colors"
                >
                  <img
                    src={url}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </a>
              ) : (
                <a
                  href={url}
                  download={name}
                  className="flex flex-col items-center justify-center aspect-square rounded-lg bg-gray-100 border border-gray-200 p-3 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <Download className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 text-center truncate w-full px-1">
                    {name}
                  </p>
                </a>
              )}
              {file.size && (
                <p className="text-[10px] text-gray-500 mt-1 text-center">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CommentsSection = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No comments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment, idx) => (
        <div
          key={comment._id || idx}
          className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 text-sm">
                {comment.user?.name || "Anonymous"}
              </p>
              <span className="text-xs text-gray-500">
                {getTimeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {comment.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ================================================================
   🚀 MAIN COMPONENT
   ================================================================ */

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allComplaints, setAllComplaints] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Fetch single complaint details
  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ComplaintAPI.getById(id);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Complaint not found");
      }
      setComplaint(res.data);
    } catch (err) {
      setError(err.message || "Failed to fetch complaint");
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch all complaints for navigation (without limit parameter)
  const fetchAllComplaints = useCallback(async () => {
    try {
      const res = await ComplaintAPI.getAll(); // ✅ Removed limit parameter
      if (!res.success) return;

      const list = Array.isArray(res.data) ? res.data : [];
      // Sort by creation date (newest first)
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllComplaints(list);
      const idx = list.findIndex((c) => c._id === id);
      setCurrentIndex(idx);
    } catch (err) {
      // Silent fail - navigation will just be disabled
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
    fetchAllComplaints();
  }, [fetchComplaint, fetchAllComplaints]);

  const handleBack = () => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else {
      navigate("/complaints");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && allComplaints[currentIndex - 1]) {
      navigate(`/complaints/${allComplaints[currentIndex - 1]._id}`, {
        state: { from: location.pathname },
      });
    }
  };

  const handleNext = () => {
    if (
      currentIndex >= 0 &&
      currentIndex < allComplaints.length - 1 &&
      allComplaints[currentIndex + 1]
    ) {
      navigate(`/complaints/${allComplaints[currentIndex + 1]._id}`, {
        state: { from: location.pathname },
      });
    }
  };

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allComplaints.length - 1;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Loading complaint details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Complaint Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">
            The complaint you are looking for does not exist or has been
            removed.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Complaints
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const priorityConfig =
    PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.medium;
  const categoryConfig =
    CATEGORY_CONFIG[complaint.department || complaint.category] || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Complaints
          </button>

          {/* Pagination Controls */}
          {allComplaints.length > 1 && currentIndex >= 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600 font-medium">
                {currentIndex + 1} of {allComplaints.length}
              </span>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 break-words">
                  {complaint.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${statusConfig.color}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${priorityConfig.color}`}
                  >
                    {priorityConfig.label} Priority
                  </span>

                  {(complaint.department || complaint.category) && (
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        categoryConfig.color || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {categoryConfig.icon}{" "}
                      {complaint.department || complaint.category}
                    </span>
                  )}

                  {complaint.visibility && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                      {complaint.visibility === "public"
                        ? "🌐 Public"
                        : "🔒 Private"}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Complaint ID
                </p>
                <p className="text-sm font-mono font-bold text-gray-900">
                  #{complaint._id?.slice(-8) || complaint._id}
                </p>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">
                    Submitted
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-900">
                  {formatDate(complaint.createdAt)}
                </p>
                <p className="text-[10px] text-gray-500">
                  {getTimeAgo(complaint.createdAt)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">
                    Last Updated
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-900">
                  {formatDate(complaint.updatedAt)}
                </p>
                <p className="text-[10px] text-gray-500">
                  {getTimeAgo(complaint.updatedAt)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">
                    Reporter
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {complaint.user?.name || complaint.studentName || "Anonymous"}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {complaint.user?.email || "N/A"}
                </p>
              </div>

              {complaint.location && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">
                      Location
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900">
                    {complaint.location}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Description
              </h2>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  Attachments
                </h2>
                <AttachmentViewer attachments={complaint.attachments} />
              </div>
            )}

            {/* Student Information */}
            {(complaint.studentId || complaint.rollNumber) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  Student Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {complaint.studentName && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Name</p>
                      <p className="font-semibold text-gray-900">
                        {complaint.studentName}
                      </p>
                    </div>
                  )}
                  {complaint.studentId && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Student ID</p>
                      <p className="font-semibold text-gray-900 font-mono">
                        {complaint.studentId}
                      </p>
                    </div>
                  )}
                  {complaint.rollNumber && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Roll Number</p>
                      <p className="font-semibold text-gray-900 font-mono">
                        {complaint.rollNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            {complaint.comments && complaint.comments.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Comments ({complaint.comments.length})
                </h2>
                <CommentsSection comments={complaint.comments} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        {allComplaints.length > 1 && currentIndex >= 0 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Complaint
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next Complaint
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ComplaintDetailPage;
