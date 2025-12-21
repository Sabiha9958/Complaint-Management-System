import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Download,
  FileText,
  Hash,
  RefreshCw,
  AlertCircle,
  User,
  Mail,
  Phone,
  Tag,
  Paperclip,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { ComplaintAPI } from "../../api/complaints";
import { fileUrl } from "../../api/apiClient";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "../../utils/constants";

// --- Utils ---
const cn = (...inputs) => twMerge(clsx(inputs));

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// --- Sub-Components ---

const DetailCard = ({ title, icon: Icon, children, className, action }) => (
  <div
    className={cn(
      "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden",
      className
    )}
  >
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wide">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        {title}
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const LabelValue = ({ label, value, icon: Icon, isLink }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3" />} {label}
    </span>
    {isLink ? (
      <a
        href={`mailto:${value}`}
        className="text-sm font-semibold text-indigo-600 hover:underline truncate"
      >
        {value || "N/A"}
      </a>
    ) : (
      <span className="text-sm font-semibold text-slate-800 truncate">
        {value || "N/A"}
      </span>
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    closed: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const s = String(status || "pending").toLowerCase();

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-xs font-bold border capitalize flex items-center gap-1.5",
        styles[s] || styles.pending
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          s === "resolved"
            ? "bg-emerald-500"
            : s === "pending"
              ? "bg-amber-500"
              : "bg-current"
        )}
      />
      {STATUS_LABELS[s] || s.replace("_", " ")}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const p = String(priority || "low").toLowerCase();
  const colors = {
    high: "text-rose-600 bg-rose-50 ring-rose-500/10",
    medium: "text-orange-600 bg-orange-50 ring-orange-500/10",
    low: "text-slate-600 bg-slate-50 ring-slate-500/10",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ring-1 ring-inset",
        colors[p] || colors.low
      )}
    >
      {PRIORITY_LABELS[p] || p} Priority
    </span>
  );
};

const SkeletonLoader = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
    <div className="h-8 w-1/3 bg-slate-200 rounded-lg mb-4" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="h-40 bg-slate-200 rounded-2xl" />
      </div>
      <div className="space-y-6">
        <div className="h-80 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  </div>
);

// --- Main Page ---

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ComplaintAPI.getById(id);
      const complaintData = res?.data?.complaint || res?.data || res;

      if (!complaintData) throw new Error("Complaint not found");
      setData(complaintData);
    } catch (err) {
      setError(err.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Ticket ID copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (loading) return <SkeletonLoader />;

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-rose-50 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button
          onClick={() => navigate("/complaints")}
          className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
            <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md">
              {data.title}
            </h1>
            <StatusBadge status={data.status} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchComplaint}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ticket ID & Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <span className="font-mono bg-slate-200/60 px-2 py-0.5 rounded text-slate-600 text-xs">
                #
                {String(data._id || data.id)
                  .slice(-6)
                  .toUpperCase()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Created{" "}
                {formatDate(data.createdAt)}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {data.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <PriorityBadge priority={data.priority} />
            <button
              onClick={() => copyToClipboard(data._id || data.id)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" /> Copy ID
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Details & Attachments */}
          <div className="lg:col-span-2 space-y-6">
            <DetailCard title="Issue Description" icon={FileText}>
              <div className="prose prose-sm prose-slate max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                  {data.description || (
                    <span className="italic text-slate-400">
                      No description provided.
                    </span>
                  )}
                </p>
              </div>
            </DetailCard>

            <DetailCard
              title={`Attachments (${data.attachments?.length || 0})`}
              icon={Paperclip}
              action={
                data.attachments?.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium">
                    Click to download
                  </span>
                )
              }
            >
              {data.attachments && data.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={fileUrl(file.path || file.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/30 transition-all duration-200 bg-slate-50/30"
                    >
                      <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700">
                          {file.originalName ||
                            file.filename ||
                            `Attachment ${idx + 1}`}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {formatBytes(file.size || 0)}
                        </p>
                      </div>
                      <div className="ml-2 p-1.5 rounded-full text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  <div className="bg-white p-3 rounded-full inline-flex mb-2 shadow-sm">
                    <Paperclip className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    No files attached to this ticket.
                  </p>
                </div>
              )}
            </DetailCard>
          </div>

          {/* Right Column: Meta Info */}
          <div className="space-y-6">
            {/* Ticket Info Card */}
            <DetailCard title="Ticket Information" icon={Hash}>
              <div className="space-y-4">
                <LabelValue
                  label="Category"
                  icon={Tag}
                  value={
                    CATEGORY_LABELS[String(data.category).toLowerCase()] ||
                    data.category
                  }
                />
                <div className="h-px bg-slate-100" />
                <LabelValue
                  label="Last Updated"
                  icon={Clock}
                  value={formatDate(data.updatedAt)}
                />
                <div className="h-px bg-slate-100" />
                <LabelValue
                  label="Created At"
                  icon={Calendar}
                  value={formatDate(data.createdAt)}
                />
              </div>
            </DetailCard>

            {/* Reporter Info Card */}
            <DetailCard title="Reporter Details" icon={User}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                  {(data.contactInfo?.name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {data.contactInfo?.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-slate-500">Ticket Requester</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <LabelValue
                  label="Email Address"
                  icon={Mail}
                  value={data.contactInfo?.email}
                  isLink
                />
                <LabelValue
                  label="Phone Number"
                  icon={Phone}
                  value={data.contactInfo?.phone}
                />
              </div>
            </DetailCard>

            {/* Quick Actions (Example) */}
            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
              <h3 className="text-indigo-900 font-bold text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Need to close this?
              </h3>
              <p className="text-xs text-indigo-700/80 mb-3 leading-relaxed">
                Review the details and ensure all tasks are completed before
                updating status.
              </p>
              {/* You can add your <StatusUpdateModal> trigger button here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
