/**
 * ================================================================
 * 📋 COMPLAINT DETAILS COMPONENT
 * ================================================================
 * Comprehensive complaint details view with:
 * - Status and priority badges
 * - Activity timeline
 * - Contact information
 * - Assignment details
 * - Resolution notes
 * ================================================================
 */

import React, { useMemo } from "react";
import {
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiTag,
  FiFlag,
  FiMapPin,
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
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return formatDate(dateStr);
  } catch (error) {
    return "";
  }
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
 * Reusable Section Container
 */
const Section = ({ title, icon: Icon, children, className = "" }) => (
  <section
    className={`bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all ${className}`}
  >
    <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3 pb-4 border-b-2 border-gray-100">
      {Icon && (
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="text-blue-600 w-5 h-5" />
        </div>
      )}
      {title}
    </h2>
    {children}
  </section>
);

/**
 * Status Badge Component
 */
const StatusBadge = ({ status }) => {
  const style = getStatusStyle(status);
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border-2 ${style.bg} ${style.text} ${style.border}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${style.text.replace("text-", "bg-")}`}
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
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border-2 ${style.bg} ${style.text} ${style.border}`}
    >
      <FiFlag className="w-4 h-4" />
      {label}
    </span>
  );
};

/**
 * Info Row Component
 */
const InfoRow = ({ icon: Icon, label, value, href, badge }) => {
  if (!value && !badge) return null;

  return (
    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="p-2 bg-gray-100 rounded-lg text-gray-600 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </p>
        {badge ? (
          badge
        ) : href ? (
          <a
            href={href}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-semibold text-gray-900 break-words">
            {value}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Contact Card Component
 */
const ContactCard = ({ contactInfo }) => {
  if (!contactInfo) return null;

  return (
    <div className="space-y-2">
      {contactInfo.name && (
        <InfoRow icon={FiUser} label="Name" value={contactInfo.name} />
      )}
      {contactInfo.email && (
        <InfoRow
          icon={FiMail}
          label="Email"
          value={contactInfo.email}
          href={`mailto:${contactInfo.email}`}
        />
      )}
      {contactInfo.phone && (
        <InfoRow
          icon={FiPhone}
          label="Phone"
          value={contactInfo.phone}
          href={`tel:${contactInfo.phone}`}
        />
      )}
    </div>
  );
};

/**
 * Assigned Staff Card Component
 */
const AssignedStaffCard = ({ staff }) => {
  if (!staff) return null;

  const initials = getInitials(staff.name);

  return (
    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shrink-0">
        {staff.profilePicture ? (
          <img
            src={staff.profilePicture}
            alt={staff.name}
            className="w-full h-full rounded-xl object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-base mb-1">{staff.name}</h4>
        {staff.email && (
          <a
            href={`mailto:${staff.email}`}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline block mb-2"
          >
            {staff.email}
          </a>
        )}
        {staff.department && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-xs font-bold text-blue-700 rounded-lg border border-blue-200">
            <FiTag className="w-3 h-3" />
            {staff.department}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Activity Timeline Component
 */
const ActivityTimeline = ({ history }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-6">
      {history.map((item, idx) => {
        const isFirst = idx === 0;
        const statusStyle = getStatusStyle(item.newStatus);

        return (
          <div key={item._id || idx} className="relative pl-8">
            {/* Timeline Line */}
            {!isFirst && (
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-200 -translate-y-6" />
            )}

            {/* Timeline Dot */}
            <div
              className={`absolute left-0 top-2 w-6 h-6 rounded-full border-4 border-white shadow-lg ${statusStyle.bg}`}
            />

            {/* Content */}
            <div className="pb-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Status changed to{" "}
                    <span className={`${statusStyle.text}`}>
                      {STATUS_LABELS[item.newStatus] || item.newStatus}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatRelativeTime(item.timestamp)} by{" "}
                    <span className="font-semibold text-gray-700">
                      {item.changedBy?.name || "System"}
                    </span>
                  </p>
                </div>
                <StatusBadge status={item.newStatus} />
              </div>

              {item.notes && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Resolution Notes Component
 */
const ResolutionNotes = ({ notes, resolvedAt }) => {
  if (!notes) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
      {/* Background Icon */}
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <FiCheckCircle className="w-32 h-32 text-green-600" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-500 rounded-xl">
            <FiCheckCircle className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-black text-green-900">
            Resolution Details
          </h3>
        </div>

        <p className="text-green-900 leading-relaxed whitespace-pre-wrap mb-4">
          {notes}
        </p>

        {resolvedAt && (
          <div className="flex items-center gap-2 pt-4 border-t-2 border-green-200">
            <FiClock className="w-4 h-4 text-green-700" />
            <p className="text-sm font-semibold text-green-800">
              Resolved on {formatDate(resolvedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Empty State Component
 */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center p-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <FiAlertCircle className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">
      No Complaint Details Available
    </h3>
    <p className="text-sm text-gray-500">
      Unable to load complaint information at this time.
    </p>
  </div>
);

// ================================================================
// 🚀 MAIN COMPONENT
// ================================================================

const ComplaintDetails = ({ complaint, history = [] }) => {
  // Memoized values
  const complaintId = useMemo(
    () => complaint?.complaintId?.slice(-8).toUpperCase() || "N/A",
    [complaint?.complaintId]
  );

  const createdAt = useMemo(
    () => formatDate(complaint?.createdAt),
    [complaint?.createdAt]
  );

  const categoryLabel = useMemo(
    () => CATEGORY_LABELS[complaint?.category] || complaint?.category,
    [complaint?.category]
  );

  // Early return for missing data
  if (!complaint) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ============================================ */}
      {/* HEADER SECTION */}
      {/* ============================================ */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border-2 border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
          {/* Left: Title and ID */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-mono font-bold rounded-lg">
                <FiFileText className="w-3 h-3" />#{complaintId}
              </span>
              <span className="text-sm text-gray-500">
                {formatRelativeTime(complaint.createdAt)}
              </span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 leading-tight break-words">
              {complaint.title}
            </h1>
          </div>

          {/* Right: Badges */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t-2 border-gray-100">
          <InfoRow icon={FiCalendar} label="Created" value={createdAt} />
          <InfoRow icon={FiTag} label="Category" value={categoryLabel} />
          {complaint.location && (
            <InfoRow
              icon={FiMapPin}
              label="Location"
              value={complaint.location}
            />
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* CONTENT GRID */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Section title="Complaint Description" icon={FiFileText}>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {complaint.description || "No description provided."}
              </p>
            </div>
          </Section>

          {/* Resolution Notes */}
          {complaint.resolutionNotes && (
            <ResolutionNotes
              notes={complaint.resolutionNotes}
              resolvedAt={complaint.resolvedAt}
            />
          )}

          {/* Activity History */}
          {history.length > 0 && (
            <Section title="Activity Timeline" icon={FiClock}>
              <ActivityTimeline history={history} />
            </Section>
          )}
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Section title="Contact Information" icon={FiUser}>
            <ContactCard contactInfo={complaint.contactInfo} />
          </Section>

          {/* Assigned Staff */}
          {complaint.assignedTo && (
            <Section title="Assigned To" icon={FiUser}>
              <AssignedStaffCard staff={complaint.assignedTo} />
            </Section>
          )}

          {/* Additional Info */}
          {complaint.updatedAt && (
            <Section title="Last Updated" icon={FiClock}>
              <p className="text-sm text-gray-700">
                {formatDate(complaint.updatedAt)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatRelativeTime(complaint.updatedAt)}
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;
