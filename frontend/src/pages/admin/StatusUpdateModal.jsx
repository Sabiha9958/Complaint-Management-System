// src/pages/admin/StatusUpdateModal.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { FiX, FiAlertCircle, FiCheckCircle, FiLoader } from "react-icons/fi";
import { toast } from "react-toastify";
import {
  COMPLAINT_STATUS,
  STATUS_LABELS,
  STATUS_STYLES,
  getStatusStyle,
} from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import { ComplaintAPI } from "../../api/api";

// ROLE-BASED STATUS PERMISSIONS
const STATUS_TRANSITIONS = Object.freeze({
  admin: {
    pending: ["in_progress", "resolved", "rejected", "closed"],
    in_progress: ["pending", "resolved", "rejected", "closed"],
    resolved: ["pending", "in_progress", "closed"],
    rejected: ["pending", "in_progress", "closed"],
    closed: ["pending", "in_progress", "resolved"],
  },
  staff: {
    pending: ["in_progress", "resolved", "rejected"],
    in_progress: ["pending", "resolved", "rejected"],
    resolved: ["closed"],
    rejected: ["pending"],
    closed: [],
  },
  user: {
    pending: [],
    in_progress: [],
    resolved: [],
    rejected: [],
    closed: [],
  },
});

// SUB-COMPONENTS
const ModalBackdrop = ({ onClick, children }) => (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    onClick={onClick}
  >
    {children}
  </div>
);

const ModalHeader = ({ title, onClose }) => (
  <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <FiCheckCircle className="w-5 h-5 text-blue-600" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="p-2 hover:bg-white rounded-lg transition-colors"
      aria-label="Close modal"
    >
      <FiX className="w-5 h-5 text-gray-500" />
    </button>
  </header>
);

const CurrentStatusBadge = ({ status }) => {
  const style = getStatusStyle(status);
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${style.text.replace("text-", "bg-")}`}
      />
      {label}
    </span>
  );
};

const FormField = ({ label, required, error, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-sm text-red-600 flex items-center gap-1.5">
        <FiAlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

// MAIN COMPONENT
const StatusUpdateModal = ({ complaint, onClose, onSuccess }) => {
  const { user } = useAuth();

  const [selectedStatus, setSelectedStatus] = useState(complaint.status);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectRef = useRef(null);

  // Allowed transitions for this user/complaint
  const allowedStatuses = useMemo(() => {
    const role = user?.role || "user";
    const currentStatus = complaint.status;
    const transitions = STATUS_TRANSITIONS[role]?.[currentStatus] || [];
    return transitions;
  }, [user?.role, complaint.status]);

  const canUpdateStatus = allowedStatuses.length > 0;

  useEffect(() => {
    if (!canUpdateStatus) {
      toast.error("You don't have permission to update this status");
      onClose();
      return;
    }
    selectRef.current?.focus();
  }, [canUpdateStatus, onClose]);

  // Close on Esc
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [loading, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setError(null);
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedStatus) {
      setError("Please select a status");
      return;
    }

    if (selectedStatus === complaint.status) {
      setError("Please select a different status");
      return;
    }

    setLoading(true);

    try {
      // Adjust complaint._id vs complaint.id to match your API data
      const id = complaint._id || complaint.id;
      const response = await ComplaintAPI.updateStatus(
        id,
        selectedStatus,
        notes.trim()
      );

      if (response.success) {
        toast.success("Status updated successfully!", {
          toastId: "status-updated",
        });
        onSuccess?.(response.data);
        onClose();
      }
    } catch (err) {
      const message = err.message || "Failed to update status";
      setError(message);
      toast.error(message, { toastId: "status-error" });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = selectedStatus !== complaint.status || notes.trim();

  if (!canUpdateStatus) return null;

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader title="Update Status" onClose={onClose} />

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {/* Complaint Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                Complaint
              </p>
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                {complaint.title}
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-gray-500">
                Current Status
              </p>
              <CurrentStatusBadge status={complaint.status} />
            </div>
          </div>

          {/* Status Select */}
          <FormField label="New Status" required error={error}>
            <select
              ref={selectRef}
              value={selectedStatus}
              onChange={handleStatusChange}
              disabled={loading}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              aria-invalid={!!error}
              required
            >
              <option value="">Select new status...</option>
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </FormField>

          {/* Notes */}
          <FormField label="Notes (Optional)">
            <textarea
              value={notes}
              onChange={handleNotesChange}
              rows={4}
              disabled={loading}
              placeholder="Add notes about this status change (optional)..."
              maxLength={500}
              className="w-full resize-none px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition-all hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Optional notes for audit trail
              </p>
              <span className="text-xs text-gray-400">{notes.length}/500</span>
            </div>
          </FormField>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex-1 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FiCheckCircle className="h-4 w-4" />
                  Update Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
};

export default StatusUpdateModal;
