import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Paperclip,
  FileText,
  Tag,
  Flag,
  Activity,
  Info,
} from "lucide-react";
import { ComplaintAPI } from "../../api/complaints";
import { useAuth } from "../../context/AuthContext";

const OPTIONS = {
  category: [
    "technical",
    "billing",
    "service",
    "product",
    "harassment",
    "safety",
    "other",
  ],
  priority: ["low", "medium", "high", "urgent"],
  status: ["pending", "in_progress", "resolved", "rejected", "closed"],
};

const STEPS = [
  { id: "pending", label: "Received" },
  { id: "in_progress", label: "Investigation" },
  { id: "resolved", label: "Resolution" },
];

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const capitalize = (s) =>
  s?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// --- UI Components ---

const LoadingSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6 space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
      <div className="h-96 bg-gray-200 rounded-2xl" />
    </div>
  </div>
);

const FormLabel = ({ icon: Icon, label, required }) => (
  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label}
    {required && <span className="text-rose-500">*</span>}
  </label>
);

const StatusVisualizer = ({ status }) => {
  const isRejected = status === "rejected";
  const stepIndex = STEPS.findIndex((s) => s.id === status);
  const percent = Math.max(0, (stepIndex / (STEPS.length - 1)) * 100);

  if (isRejected) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3 text-rose-800">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">Ticket marked as Rejected</span>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Background Line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full -z-10" />
      {/* Progress Line */}
      <div
        className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full transition-all duration-500 -z-10"
        style={{ width: `${stepIndex < 0 ? 0 : percent}%` }}
      />

      <div className="flex justify-between">
        {STEPS.map((step, idx) => {
          const active = idx <= stepIndex;
          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-2 bg-white px-2"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  active
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                    : "border-gray-200 text-gray-300"
                }`}
              >
                {active ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-emerald-700" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Page ---

export default function ComplaintEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = ["admin", "staff"].includes(user?.role);

  const [initLoad, setInitLoad] = useState(true);
  const [complaint, setComplaint] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm();

  const watchedStatus = watch("status");
  const descCount = (watch("description") || "").length;

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await ComplaintAPI.getById(id);
        const data = res?.data?.complaint || res?.data || res;
        if (!data) throw new Error("Not found");

        setComplaint(data);
        reset({
          title: data.title,
          description: data.description,
          category: data.category?.toLowerCase() || "other",
          priority: data.priority || "medium",
          status: data.status || "pending",
        });
      } catch (err) {
        toast.error("Failed to load complaint details");
        navigate("/complaints");
      } finally {
        setInitLoad(false);
      }
    };
    loadData();
  }, [id, navigate, reset]);

  // Prompt on tab close if dirty
  useEffect(() => {
    const handler = (e) => isDirty && (e.returnValue = "");
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const onSubmit = async (data) => {
    try {
      await ComplaintAPI.update(id, data);
      toast.success("Complaint updated successfully");
      reset(data);
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  };

  if (initLoad) return <LoadingSkeleton />;
  if (!complaint) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Edit Ticket
                <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-mono">
                  #{id.slice(-6).toUpperCase()}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => reset()}
              disabled={!isDirty}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30"
            >
              Discard
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isDirty}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Main Editing (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Status Flow Card */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between mb-6">
                <FormLabel icon={Activity} label="Workflow Status" />

                {/* DIAGRAM TRIGGER: 
                  Context: User is editing status. 
                  Rationale: Helps user understand the implications of moving from Pending -> In Progress -> Resolved.
                */}
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="hidden group-hover:block absolute right-0 top-6 z-50 w-64 p-2 bg-white border border-gray-200 rounded-lg shadow-xl text-xs text-gray-500">
                    <p className="mt-2 text-center text-[10px] text-gray-400">
                      Standard Resolution Lifecycle
                    </p>
                  </div>
                </div>
              </div>

              <StatusVisualizer status={watchedStatus} />
            </section>

            {/* Core Details Card */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60 space-y-6">
              <div>
                <FormLabel icon={FileText} label="Subject" required />
                <input
                  {...register("title", {
                    required: "Title is required",
                    minLength: 5,
                  })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-gray-900 placeholder:text-gray-400"
                  placeholder="Summary of the issue..."
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-baseline">
                  <FormLabel icon={FileText} label="Description" required />
                  <span
                    className={`text-[10px] font-mono ${descCount > 1800 ? "text-rose-500 font-bold" : "text-gray-400"}`}
                  >
                    {descCount}/2000
                  </span>
                </div>
                <textarea
                  rows={8}
                  {...register("description", {
                    required: "Required",
                    minLength: 10,
                    maxLength: 2000,
                  })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm leading-relaxed resize-y"
                  placeholder="Detailed explanation..."
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </section>

            {/* Attachments Card (Read-only) */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
              <FormLabel
                icon={Paperclip}
                label={`Attachments (${complaint.attachments?.length || 0})`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {complaint.attachments?.map((file, i) => (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-700">
                        {file.originalName || `File ${i + 1}`}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">
                        Click to view
                      </p>
                    </div>
                  </a>
                ))}
                {!complaint.attachments?.length && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-sm text-gray-400">
                      No documents attached.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Metadata Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Properties Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase">
                  Ticket Properties
                </h3>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <FormLabel icon={Tag} label="Category" />
                  <select
                    {...register("category")}
                    className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    {OPTIONS.category.map((c) => (
                      <option key={c} value={c}>
                        {capitalize(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FormLabel icon={Flag} label="Priority" />
                  <select
                    {...register("priority")}
                    className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    {OPTIONS.priority.map((p) => (
                      <option key={p} value={p}>
                        {capitalize(p)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FormLabel icon={Activity} label="Current Status" />
                  <select
                    {...register("status")}
                    disabled={!canManage}
                    className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {OPTIONS.status.map((s) => (
                      <option key={s} value={s}>
                        {capitalize(s)}
                      </option>
                    ))}
                  </select>
                  {!canManage && (
                    <p className="mt-1.5 text-[10px] text-gray-400">
                      Only staff can update status.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Reporter Info Panel */}
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <FormLabel icon={User} label="Reporter Details" />
              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center shadow-sm">
                  {(complaint.user?.name?.[0] || "U").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {complaint.user?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-blue-600/80 truncate">
                    {complaint.user?.email || "No email"}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-blue-400 uppercase font-bold mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Created
                  </p>
                  <p className="text-xs font-medium text-blue-900">
                    {formatDate(complaint.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 uppercase font-bold mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Updated
                  </p>
                  <p className="text-xs font-medium text-blue-900">
                    {formatDate(complaint.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Save Bar (Mobile/Desktop) */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-gray-900 text-white pl-4 pr-2 py-2 rounded-full shadow-2xl border border-gray-700"
          >
            <span className="text-xs font-semibold whitespace-nowrap">
              Unsaved changes
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => reset()}
                className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white transition"
              >
                Reset
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                className="px-4 py-1.5 text-xs font-bold bg-white text-gray-900 rounded-full hover:bg-gray-100 transition"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
