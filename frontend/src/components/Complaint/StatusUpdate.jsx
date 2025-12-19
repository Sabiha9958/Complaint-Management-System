import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiX, FiAlertCircle, FiCheckCircle, FiLoader } from "react-icons/fi";
import { toast } from "react-toastify";
import { STATUS_LABELS, getStatusStyle } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import { ComplaintAPI } from "../../api/complaints";

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

const cx = (...classes) => classes.filter(Boolean).join(" ");

const ModalBackdrop = memo(({ onClick, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    role="dialog"
    aria-modal="true"
    onClick={onClick}
  >
    {children}
  </div>
));

const ModalHeader = memo(({ title, onClose, disabled }) => (
  <header className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-white p-2 shadow-sm">
        <FiCheckCircle className="h-5 w-5 text-blue-600" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>

    <button
      type="button"
      onClick={onClose}
      disabled={disabled}
      className="rounded-lg p-2 transition-colors hover:bg-white disabled:opacity-50"
      aria-label="Close modal"
    >
      <FiX className="h-5 w-5 text-gray-500" />
    </button>
  </header>
));

const CurrentStatusBadge = memo(({ status }) => {
  const style = getStatusStyle(status) || {};
  const label = STATUS_LABELS?.[status] || String(status || "—");
  const dotColor = (style.text || "text-gray-600").replace("text-", "bg-");

  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
        style.bg,
        style.text,
        style.border
      )}
    >
      <span className={cx("h-2 w-2 rounded-full", dotColor)} />
      {label}
    </span>
  );
});

const FieldError = memo(({ children }) => {
  if (!children) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-red-600">
      <FiAlertCircle className="h-4 w-4" />
      {children}
    </p>
  );
});

const StatusUpdateModal = memo(function StatusUpdateModal({
  complaint,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();

  const selectRef = useRef(null);
  const inFlightRef = useRef(false); // avoid double submit

  const role = user?.role || "user";
  const complaintId = complaint?._id || complaint?.id;

  const allowedStatuses = useMemo(() => {
    const current = complaint?.status;
    return STATUS_TRANSITIONS?.[role]?.[current] || [];
  }, [role, complaint?.status]);

  const canUpdateStatus = allowedStatuses.length > 0;

  const [selectedStatus, setSelectedStatus] = useState(complaint?.status || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setSelectedStatus(complaint?.status || "");
    setNotes("");
    setFormError("");
    inFlightRef.current = false;
    setSubmitting(false);
  }, [complaintId, complaint?.status]);

  useEffect(() => {
    if (canUpdateStatus) selectRef.current?.focus();
  }, [canUpdateStatus]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [submitting, onClose]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget && !submitting) onClose?.();
    },
    [submitting, onClose]
  );

  const hasChanges =
    selectedStatus !== (complaint?.status || "") || Boolean(notes.trim());
  const canSubmit =
    canUpdateStatus &&
    Boolean(selectedStatus) &&
    selectedStatus !== complaint?.status &&
    !submitting &&
    hasChanges;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError("");

      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (!canUpdateStatus) {
        toast.error("You don't have permission to update this status");
        inFlightRef.current = false;
        onClose?.();
        return;
      }
      if (!complaintId) {
        setFormError("Missing complaint ID");
        inFlightRef.current = false;
        return;
      }
      if (!selectedStatus) {
        setFormError("Please select a status");
        inFlightRef.current = false;
        return;
      }
      if (selectedStatus === complaint?.status) {
        setFormError("Please select a different status");
        inFlightRef.current = false;
        return;
      }

      setSubmitting(true);

      try {
        const response = await ComplaintAPI.updateStatus(
          complaintId,
          selectedStatus,
          notes.trim()
        );
        const body = response?.data ?? response; // axios response body is in data [web:22]

        const updated =
          body?.data?.complaint || body?.complaint || body?.data || body;

        if (body?.success === false)
          throw new Error(body?.message || "Failed to update status");
        if (!updated?._id)
          throw new Error("Updated complaint not returned from server");

        toast.success("Status updated successfully!", {
          toastId: "status-updated",
        });
        onSuccess?.(updated);
        onClose?.();
      } catch (err) {
        const status = err?.response?.status;

        if (status === 429) {
          const ra = err?.response?.headers?.["retry-after"];
          toast.error(
            `Too many requests. Please wait ${ra ? `${ra}s` : "a moment"} and try again.`
          );
          return;
        }

        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update status";
        setFormError(msg);
        toast.error(msg, { toastId: "status-error" });
      } finally {
        setSubmitting(false);
        inFlightRef.current = false;
      }
    },
    [
      canUpdateStatus,
      complaintId,
      selectedStatus,
      notes,
      complaint?.status,
      onClose,
      onSuccess,
    ]
  );

  if (!complaint) return null;

  if (!canUpdateStatus) {
    return (
      <ModalBackdrop onClick={handleBackdropClick}>
        <div
          className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader
            title="Update Status"
            onClose={onClose}
            disabled={submitting}
          />
          <div className="p-6">
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-800">
              You don't have permission to update this complaint's status.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          title="Update Status"
          onClose={onClose}
          disabled={submitting}
        />

        <form onSubmit={handleSubmit} className="space-y-5 p-6" noValidate>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                Complaint
              </p>
              <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                {complaint.title || "—"}
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-gray-500">
                Current Status
              </p>
              <CurrentStatusBadge status={complaint.status} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              New Status <span className="text-red-500">*</span>
            </label>

            <select
              ref={selectRef}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setFormError("");
              }}
              disabled={submitting}
              className={cx(
                "w-full rounded-lg border bg-white px-4 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
                formError
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
              )}
              aria-invalid={Boolean(formError)}
              required
            >
              <option value="">Select new status...</option>
              {allowedStatuses.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS?.[st] || st}
                </option>
              ))}
            </select>

            <FieldError>{formError}</FieldError>
            {!hasChanges ? (
              <p className="text-xs font-semibold text-gray-500">
                No changes yet.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={submitting}
              placeholder="Add notes about this status change (optional)..."
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition-all hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Stored for audit trail</span>
              <span className="text-gray-400">{notes.length}/500</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <FiLoader className="h-5 w-5 animate-spin" />
                  Updating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FiCheckCircle className="h-4 w-4" />
                  Update Status
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
});

export default StatusUpdateModal;
