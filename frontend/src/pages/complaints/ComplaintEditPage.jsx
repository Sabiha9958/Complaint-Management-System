import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiFileText,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiFlag,
  FiPaperclip,
  FiUser,
  FiCalendar,
  FiClock,
  FiSave,
  FiActivity,
  FiCheck,
  FiTag,
} from "react-icons/fi";

import { ComplaintAPI } from "../../api/complaints";
import { useAuth } from "../../context/AuthContext";

const CATEGORY_OPTIONS = [
  "technical",
  "billing",
  "service",
  "product",
  "harassment",
  "safety",
  "other",
];
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const STATUS_OPTIONS = [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
  "closed",
];

const STATUS_STEPS = [
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
];

const labelize = (str) =>
  String(str || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function useBeforeUnload(shouldWarn) {
  useEffect(() => {
    const handler = (e) => {
      if (!shouldWarn) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [shouldWarn]);
}

/** Your API shape: { success: true, data: complaint } */
function unwrapComplaint(res) {
  const r = res?.data ?? res;
  if (r?.success && r?.data) return r.data;
  if (r?.data?.complaint) return r.data.complaint;
  if (r?.complaint) return r.complaint;
  return r;
}

function StatusTimeline({ currentStatus }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.id === currentStatus);
  const isRejected = currentStatus === "rejected";

  if (isRejected) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 flex items-center gap-3 text-rose-700">
        <FiAlertCircle className="h-5 w-5" />
        <span className="font-semibold">This complaint has been Rejected.</span>
      </div>
    );
  }

  const progress =
    currentIndex <= 0 ? 0 : (currentIndex / (STATUS_STEPS.length - 1)) * 100;

  return (
    <div className="px-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 -z-10"
          style={{ width: `${progress}%` }}
        />
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  isCompleted
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "bg-white border-2 border-gray-200 text-gray-400",
                  isCurrent ? "scale-110 ring-4 ring-emerald-100" : "",
                ].join(" ")}
              >
                {isCompleted ? <FiCheck className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={[
                  "text-xs font-semibold",
                  isCurrent ? "text-emerald-700" : "text-gray-400",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttachmentItem({ file }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition"
    >
      <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
        <FiFileText className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {file.originalName || file.filename || "Attachment"}
        </p>

        {file.url ? (
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View / Download
          </a>
        ) : (
          <p className="text-xs text-gray-400">No URL available</p>
        )}
      </div>
    </motion.div>
  );
}

export default function ComplaintEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEditStatus = ["admin", "staff"].includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      status: "pending",
    },
    mode: "onChange",
  });

  const currentStatus = watch("status");
  const descriptionLen = useMemo(
    () => String(watch("description") || "").length,
    [watch]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const res = await ComplaintAPI.getById(id);
        const data = unwrapComplaint(res);

        if (!data?._id) throw new Error("Complaint data not found");
        if (!mounted) return;

        setComplaint(data);
        setAttachments(Array.isArray(data.attachments) ? data.attachments : []);

        // IMPORTANT: Keep category lowercase to satisfy enum
        reset(
          {
            title: data.title ?? "",
            description: data.description ?? "",
            category: String(data.category ?? "other")
              .trim()
              .toLowerCase(),
            priority: data.priority ?? "medium",
            status: data.status ?? "pending",
          },
          { keepDirty: false }
        );
      } catch (e) {
        toast.error(e?.message || "Could not load complaint");
        navigate("/complaints");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, navigate, reset]);

  useBeforeUnload(isDirty);

  const onSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        category: String(values.category || "other")
          .trim()
          .toLowerCase(),
        priority: values.priority,
        ...(canEditStatus ? { status: values.status } : {}),
      };

      await ComplaintAPI.update(id, payload);
      toast.success("Complaint updated!");

      reset(values, { keepDirty: false });
      navigate(-1);
    } catch (e) {
      toast.error(e?.message || "Update failed");
    }
  };

  const onCancel = () => {
    if (isDirty) {
      const ok = window.confirm("You have unsaved changes. Discard them?");
      if (!ok) return;
    }
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600 gap-3">
        <FiLoader className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold">Loading complaint...</p>
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 bg-white rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition shadow-sm"
              title="Back"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  Edit Complaint
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 text-[10px] font-mono font-bold tracking-wider uppercase">
                  #{String(id).slice(-6)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Backend-safe fields only (category enum compatible).
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isDirty}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-extrabold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
            >
              {isSubmitting ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiSave />
              )}
              {isSubmitting ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <FiActivity className="text-blue-500" /> Lifecycle Status
              </h3>
              <StatusTimeline currentStatus={currentStatus} />
            </section>

            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900 mb-5">
                Complaint Details
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Subject / Title
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-3 text-gray-400" />
                    <input
                      className={[
                        "w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition font-semibold text-gray-800",
                        errors.title
                          ? "border-rose-300 bg-rose-50"
                          : "border-gray-200 bg-gray-50 focus:bg-white",
                        "focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
                      ].join(" ")}
                      placeholder="Brief summary..."
                      {...register("title", {
                        required: "Title is required",
                        minLength: { value: 5, message: "Min 5 characters" },
                      })}
                    />
                  </div>
                  {errors.title && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Detailed Description
                  </label>
                  <textarea
                    rows={7}
                    className={[
                      "w-full p-4 rounded-xl border outline-none transition text-sm leading-relaxed resize-none",
                      errors.description
                        ? "border-rose-300 bg-rose-50"
                        : "border-gray-200 bg-gray-50 focus:bg-white",
                      "focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
                    ].join(" ")}
                    placeholder="Explain the issue clearly..."
                    {...register("description", {
                      required: "Description is required",
                      minLength: { value: 10, message: "Min 10 characters" },
                      maxLength: {
                        value: 2000,
                        message: "Max 2000 characters",
                      },
                    })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">
                      {errors.description.message}
                    </p>
                  )}
                  <p className="text-right text-xs text-gray-400 mt-1">
                    {descriptionLen}/2000
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">
                Properties
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                    Category
                  </label>
                  <div className="relative">
                    <FiTag className="absolute left-3 top-3 text-gray-400" />
                    <select
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                      {...register("category", {
                        required: "Category is required",
                      })}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {labelize(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.category && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                    Priority
                  </label>
                  <div className="relative">
                    <FiFlag className="absolute left-3 top-3 text-gray-400" />
                    <select
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                      {...register("priority", {
                        required: "Priority is required",
                      })}
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {labelize(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">
                    Status
                  </label>
                  <div className="relative">
                    <FiCheckCircle className="absolute left-3 top-3 text-gray-400" />
                    <select
                      disabled={!canEditStatus}
                      className={[
                        "w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none",
                        canEditStatus
                          ? "bg-white focus:ring-2 focus:ring-blue-100"
                          : "bg-gray-100 text-gray-500 cursor-not-allowed",
                      ].join(" ")}
                      {...register("status")}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {labelize(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!canEditStatus && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Only staff can update status.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-blue-50 rounded-3xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <FiUser className="text-blue-600" />
                <span className="text-sm font-extrabold text-blue-900">
                  Submitted By
                </span>
              </div>

              <div className="bg-white/70 rounded-xl p-3 space-y-2 mb-3">
                <p className="text-sm font-bold text-gray-800">
                  {complaint.user?.name || "Unknown User"}
                </p>
                <p className="text-xs text-gray-600">
                  {complaint.user?.email || "No email provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-blue-500 font-semibold flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" /> Created
                  </span>
                  <span className="text-blue-950 font-bold">
                    {formatDate(complaint.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-blue-500 font-semibold flex items-center gap-1">
                    <FiClock className="w-3 h-3" /> Updated
                  </span>
                  <span className="text-blue-950 font-bold">
                    {formatDate(complaint.updatedAt)}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <FiPaperclip /> Attachments ({attachments.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <AnimatePresence>
                  {attachments.map((file) => (
                    <AttachmentItem key={file._id} file={file} />
                  ))}
                  {attachments.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-2">
                      No files attached.
                    </p>
                  )}
                </AnimatePresence>
              </div>

              <p className="mt-3 text-[11px] text-gray-400">
                Attachments are read-only on this page.
              </p>
            </section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 border border-gray-700"
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>

            <button
              type="button"
              onClick={() => reset()}
              className="px-3 py-1.5 text-xs font-extrabold text-gray-200 hover:text-white hover:bg-gray-800 rounded-lg transition"
              title="Reset back to last loaded/saved values"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="px-4 py-1.5 text-xs font-extrabold bg-white text-gray-900 rounded-lg hover:bg-gray-200 transition"
            >
              Save now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
