import React, { memo, useEffect, useMemo, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  FileText,
  Loader2,
  ShieldAlert,
  Ban,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { ComplaintAPI } from "../../api/complaints";
import { useAuth } from "../../context/AuthContext";

// --- Utils ---
const cn = (...inputs) => twMerge(clsx(inputs));

// Configuration for visual rendering of statuses
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Loader2,
  },
  resolved: {
    label: "Resolved",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: Ban,
  },
  closed: {
    label: "Closed",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: ShieldAlert,
  },
};

const STATUS_TRANSITIONS = {
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
    rejected: ["pending", "closed"],
    closed: [],
  },
  user: {
    pending: [],
    in_progress: [],
    resolved: [],
    rejected: [],
    closed: [],
  },
};

// --- Custom Hook for Logic ---
const useStatusLogic = (complaint, onClose, onSuccess) => {
  const { user } = useAuth();
  const role = user?.role || "user";
  const currentStatus = complaint?.status || "pending";
  const cid = complaint?._id || complaint?.id;

  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get allowed transitions
  const allowedStatuses = useMemo(
    () => STATUS_TRANSITIONS[role]?.[currentStatus] || [],
    [role, currentStatus]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await ComplaintAPI.updateStatus(cid, selectedStatus, notes);
      const data = res?.data || res;

      if (data?.success === false) throw new Error(data?.message);

      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">Status Updated</span>
          <span className="text-xs">
            Complaint is now {STATUS_CONFIG[selectedStatus]?.label}
          </span>
        </div>
      );

      onSuccess?.(data?.data?.complaint || data);
      onClose();
    } catch (error) {
      toast.error(error.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStatus,
    allowedStatuses,
    selectedStatus,
    setSelectedStatus,
    notes,
    setNotes,
    isSubmitting,
    handleSubmit,
    hasPermission: allowedStatuses.length > 0,
  };
};

// --- Sub-Components ---

const StatusBadge = ({ status, size = "md" }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold border transition-colors",
        config.bg,
        config.color,
        config.border,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
};

const RadioCard = ({ status, isSelected, onClick, disabled }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all duration-200 outline-none focus:ring-4 focus:ring-indigo-100",
        isSelected
          ? `border-${config.color.split("-")[1]}-500 bg-${config.color.split("-")[1]}-50/50`
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50",
        disabled && "opacity-50 cursor-not-allowed grayscale"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
          isSelected ? "bg-white shadow-sm" : "bg-slate-100"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            isSelected ? config.color : "text-slate-400"
          )}
        />
      </div>

      <div className="flex-1">
        <span
          className={cn(
            "block text-sm font-bold",
            isSelected ? "text-slate-900" : "text-slate-600"
          )}
        >
          {config.label}
        </span>
        <span className="text-[11px] text-slate-400 font-medium">
          Mark ticket as {config.label.toLowerCase()}
        </span>
      </div>

      <div
        className={cn(
          "h-4 w-4 rounded-full border-2 flex items-center justify-center",
          isSelected
            ? `border-${config.color.split("-")[1]}-500`
            : "border-slate-300"
        )}
      >
        {isSelected && (
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              `bg-${config.color.split("-")[1]}-500`
            )}
          />
        )}
      </div>
    </button>
  );
};

// --- Main Component ---

const StatusUpdateModal = ({ complaint, onClose, onSuccess }) => {
  const {
    currentStatus,
    allowedStatuses,
    selectedStatus,
    setSelectedStatus,
    notes,
    setNotes,
    isSubmitting,
    handleSubmit,
    hasPermission,
  } = useStatusLogic(complaint, onClose, onSuccess);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && !isSubmitting && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, isSubmitting]);

  if (!complaint) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-800">Update Status</h2>
            <span className="text-xs font-medium text-slate-500">
              Ticket #
              {String(complaint._id || "")
                .slice(-6)
                .toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!hasPermission ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-rose-100 p-3 rounded-full mb-3 text-rose-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800">Permission Denied</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              You do not have the necessary permissions to update the status of
              this complaint.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Visual Transition Header */}
            <div className="flex items-center justify-between bg-white px-6 py-5 border-b border-slate-100">
              <div className="flex flex-col gap-1.5 items-center w-1/3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Current
                </span>
                <StatusBadge status={currentStatus} />
              </div>
              <ArrowRight className="text-slate-300 w-5 h-5" />
              <div className="flex flex-col gap-1.5 items-center w-1/3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Target
                </span>
                {selectedStatus ? (
                  <StatusBadge status={selectedStatus} />
                ) : (
                  <span className="text-xs font-medium text-slate-400 italic">
                    Select...
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 p-6 overflow-y-auto max-h-[60vh]">
              {/* Radio Grid */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Select New Status
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {allowedStatuses.map((status) => (
                    <RadioCard
                      key={status}
                      status={status}
                      isSelected={selectedStatus === status}
                      onClick={() => setSelectedStatus(status)}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </div>

              {/* Notes Field */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="notes"
                    className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500"
                  >
                    <FileText className="w-3 h-3" /> Resolution Notes
                  </label>
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      notes.length > 450 ? "text-rose-500" : "text-slate-400"
                    )}
                  >
                    {notes.length}/500
                  </span>
                </div>
                <textarea
                  id="notes"
                  rows={3}
                  maxLength={500}
                  placeholder="Add context about this change (required for rejection)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedStatus || isSubmitting}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all",
                  !selectedStatus || isSubmitting
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isSubmitting ? "Updating..." : "Confirm Update"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default memo(StatusUpdateModal);
