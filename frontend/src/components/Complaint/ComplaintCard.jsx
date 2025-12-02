/**
 * ================================================================
 * 🎴 COMPLAINT CARD COMPONENT
 * ================================================================
 * Compact complaint card with:
 * - Status and priority badges
 * - Hover effects
 * - Truncated text with line clamps
 * - Responsive design
 * - Accessibility features
 * ================================================================
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiClock,
  FiUser,
  FiTag,
  FiHash,
  FiAlertCircle,
  FiCheckCircle,
  FiFlag,
  FiMessageSquare,
} from "react-icons/fi";
import {
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  STATUS_LABELS,
  STATUS_STYLES,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  CATEGORY_LABELS,
  getStatusStyle,
  getPriorityStyle,
} from "../../utils/constants";

// ================================================================
// 🛠️ UTILITY FUNCTIONS
// ================================================================

/**
 * Format date to readable string
 */
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";

  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(dateStr);
  } catch (error) {
    return "";
  }
};

/**
 * Truncate text with ellipsis
 */
const truncate = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

/**
 * Get initials from name
 */
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ================================================================
// 🎨 SUB-COMPONENTS
// ================================================================

/**
 * Status Badge Component
 */
const StatusBadge = ({ status }) => {
  const style = getStatusStyle(status);
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 ${style.bg} ${style.text} ${style.border}`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full ${style.text.replace("text-", "bg-")}`}
      />
      {label}
    </span>
  );
};

/**
 * Priority Badge Component
 */
const PriorityBadge = ({ priority }) => {
  const style = getPriorityStyle(priority);
  const label = PRIORITY_LABELS[priority] || priority;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 ${style.bg} ${style.text} ${style.border}`}
    >
      <FiFlag className="w-2.5 h-2.5" />
      {label}
    </span>
  );
};

/**
 * Category Badge Component
 */
const CategoryBadge = ({ category }) => {
  const label = CATEGORY_LABELS[category] || category;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border-2 border-gray-200">
      <FiTag className="w-2.5 h-2.5" />
      {label}
    </span>
  );
};

/**
 * User Avatar Component
 */
const UserAvatar = ({ name, size = "sm" }) => {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
  };

  const initials = getInitials(name);

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-sm`}
      title={name}
    >
      {initials}
    </div>
  );
};

/**
 * Empty State Component
 */
const EmptyCard = () => (
  <div className="h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-center">
    <FiAlertCircle className="w-10 h-10 text-gray-400 mb-2" />
    <p className="text-sm text-gray-500 font-medium">Data unavailable</p>
  </div>
);

// ================================================================
// 🚀 MAIN COMPONENT
// ================================================================

const ComplaintCard = ({ complaint }) => {
  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const complaintId = useMemo(
    () => complaint?.complaintId?.slice(-8).toUpperCase() || "N/A",
    [complaint?.complaintId]
  );

  const formattedDate = useMemo(
    () => formatDate(complaint?.createdAt),
    [complaint?.createdAt]
  );

  const relativeTime = useMemo(
    () => formatRelativeTime(complaint?.createdAt),
    [complaint?.createdAt]
  );

  const truncatedDescription = useMemo(
    () => truncate(complaint?.description, 120),
    [complaint?.description]
  );

  // ============================================================
  // RENDER
  // ============================================================

  // Early return for missing data
  if (!complaint) {
    return <EmptyCard />;
  }

  return (
    <Link
      to={`/complaint/${complaint._id}`}
      className="group block h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 rounded-2xl"
      aria-label={`View complaint: ${complaint.title}`}
    >
      <article className="bg-white rounded-2xl p-5 h-full flex flex-col border-2 border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 active:translate-y-0">
        {/* ============================================ */}
        {/* HEADER: ID and Date */}
        {/* ============================================ */}
        <div className="flex items-center justify-between mb-4">
          {/* Complaint ID */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
            <FiHash className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-mono font-bold text-gray-700">
              {complaintId}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FiClock className="w-3 h-3" />
            <time
              dateTime={complaint.createdAt}
              title={formattedDate}
              className="font-medium"
            >
              {relativeTime}
            </time>
          </div>
        </div>

        {/* ============================================ */}
        {/* CONTENT: Title and Description */}
        {/* ============================================ */}
        <div className="flex-grow mb-4">
          <h3 className="text-base font-black text-gray-900 mb-2 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
            {complaint.title || "Untitled Complaint"}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {truncatedDescription || "No description provided."}
          </p>
        </div>

        {/* ============================================ */}
        {/* BADGES: Status, Priority, Category */}
        {/* ============================================ */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          {complaint.category && (
            <CategoryBadge category={complaint.category} />
          )}
        </div>

        {/* ============================================ */}
        {/* FOOTER: User Info and Assignment */}
        {/* ============================================ */}
        <div className="pt-4 border-t-2 border-gray-100 flex items-center justify-between gap-3">
          {/* User Info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <UserAvatar name={complaint.contactInfo?.name} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-700 truncate">
                {complaint.contactInfo?.name || "Anonymous"}
              </p>
              {complaint.contactInfo?.email && (
                <p className="text-[10px] text-gray-500 truncate">
                  {complaint.contactInfo.email}
                </p>
              )}
            </div>
          </div>

          {/* Assignment Badge */}
          {complaint.assignedTo && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200 shrink-0">
              <FiCheckCircle className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Assigned
              </span>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* OPTIONAL: Comment Count */}
        {/* ============================================ */}
        {complaint.commentsCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
            <FiMessageSquare className="w-3 h-3" />
            <span className="font-medium">
              {complaint.commentsCount} comment
              {complaint.commentsCount > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </article>
    </Link>
  );
};

export default ComplaintCard;

/**
 * ================================================================
 * 📖 USAGE EXAMPLE
 * ================================================================
 *
 * import ComplaintCard from './ComplaintCard';
 *
 * const ComplaintsList = ({ complaints }) => (
 *   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 *     {complaints.map((complaint) => (
 *       <ComplaintCard key={complaint._id} complaint={complaint} />
 *     ))}
 *   </div>
 * );
 * ================================================================
 */
