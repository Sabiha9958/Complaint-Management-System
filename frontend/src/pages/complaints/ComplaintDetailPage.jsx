import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ComplaintAPI } from "../../api/complaints";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
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
  Tag,
  Flag,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";

/* ================================================================
   BACKEND-ALIGNED CONFIG
================================================================ */
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    chip: "bg-amber-50 text-amber-800 border-amber-200",
    Icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    chip: "bg-blue-50 text-blue-800 border-blue-200",
    Icon: RefreshCw,
  },
  resolved: {
    label: "Resolved",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    chip: "bg-rose-50 text-rose-800 border-rose-200",
    Icon: XCircle,
  },
  closed: {
    label: "Closed",
    chip: "bg-slate-50 text-slate-800 border-slate-200",
    Icon: Archive,
  },
};

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", chip: "bg-rose-600 text-white" },
  high: { label: "High", chip: "bg-orange-600 text-white" },
  medium: { label: "Medium", chip: "bg-blue-600 text-white" },
  low: { label: "Low", chip: "bg-slate-600 text-white" },
};

const CATEGORY_CONFIG = {
  technical: {
    chip: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "💻",
  },
  billing: { chip: "bg-amber-50 text-amber-800 border-amber-200", icon: "💳" },
  service: { chip: "bg-blue-50 text-blue-700 border-blue-200", icon: "🧰" },
  product: {
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "📦",
  },
  harassment: { chip: "bg-rose-50 text-rose-700 border-rose-200", icon: "🚫" },
  safety: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "🛡️",
  },
  other: { chip: "bg-slate-50 text-slate-700 border-slate-200", icon: "📌" },
};

const safeStatus = (s) => (STATUS_CONFIG[s] ? s : "pending");
const safePriority = (p) => (PRIORITY_CONFIG[p] ? p : "medium");
const safeCategory = (c) => (CATEGORY_CONFIG[c] ? c : "other");

const labelize = (str) =>
  String(str || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diff = Math.max(0, now - past);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const getAttachmentUrl = (f) => f?.url || f?.secure_url || f?.path || "";
const getAttachmentName = (f, idx) =>
  f?.originalName || f?.filename || `Attachment ${idx + 1}`;
const isImageAttachment = (f) =>
  String(f?.mimetype || f?.mimeType || f?.type || "")
    .toLowerCase()
    .startsWith("image/");

/** IMPORTANT: unwrap axios response + unwrap {success,data} wrapper */
function unwrapApi(res) {
  const r = res?.data ?? res;
  if (r?.success && r?.data) return r.data; // { success, data }
  if (r?.data?.complaint) return r.data.complaint;
  if (r?.complaint) return r.complaint;
  return r;
}

/* ================================================================
   UI PRIMITIVES
================================================================ */
const Chip = ({ className = "", children }) => (
  <span
    className={[
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
      className,
    ].join(" ")}
  >
    {children}
  </span>
);

const MetaCard = ({ Icon, label, value, sub }) => (
  <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
    <div className="flex items-center gap-2 text-gray-500">
      <Icon className="h-4 w-4" />
      <span className="text-[11px] font-extrabold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <p className="mt-2 text-sm font-bold text-gray-900 break-words">{value}</p>
    {sub ? <p className="mt-1 text-[11px] text-gray-500">{sub}</p> : null}
  </div>
);

const SoftButton = ({ onClick, disabled, children, tone = "slate" }) => {
  const tones = {
    slate:
      "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
    blue: "bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition shadow-sm",
        tones[tone] || tones.slate,
      ].join(" ")}
    >
      {children}
    </button>
  );
};

/* ================================================================
   ATTACHMENTS
================================================================ */
const AttachmentGrid = ({ attachments }) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
        <ImageIcon className="h-10 w-10 mx-auto text-gray-300" />
        <p className="mt-3 text-sm font-semibold text-gray-700">
          No attachments
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Files will appear here if uploaded.
        </p>
      </div>
    );
  }

  const downloadAll = () => {
    attachments.forEach((file, idx) => {
      const url = getAttachmentUrl(file);
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.download = getAttachmentName(file, idx);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-blue-600" />
          Attachments{" "}
          <span className="text-xs font-semibold text-gray-500">
            ({attachments.length})
          </span>
        </h3>

        {attachments.length > 1 && (
          <button
            type="button"
            onClick={downloadAll}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            <Download className="h-4 w-4" />
            Download all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {attachments.map((file, idx) => {
          const url = getAttachmentUrl(file);
          const name = getAttachmentName(file, idx);
          if (!url) return null;

          const img = isImageAttachment(file);

          return (
            <a
              key={file._id || `${name}-${idx}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition"
              title={name}
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {img ? (
                  <img
                    src={url}
                    alt={name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <Download className="h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-xs font-semibold text-gray-700 line-clamp-2">
                      {name}
                    </p>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-600 truncate">{name}</p>
                {file?.size ? (
                  <p className="text-[10px] text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                ) : null}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================
   COMMENTS (view-only)
================================================================ */
const Comments = ({ comments }) => {
  if (!Array.isArray(comments) || comments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
        <MessageSquare className="h-10 w-10 mx-auto text-gray-300" />
        <p className="mt-3 text-sm font-semibold text-gray-700">
          No comments yet
        </p>
        <p className="mt-1 text-xs text-gray-500">Updates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((c, idx) => (
        <div
          key={c._id || idx}
          className="rounded-3xl border border-gray-200 bg-white p-4 flex gap-3"
        >
          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold">
            {(c.user?.name?.[0] || "U").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900 truncate">
                {c.user?.name || "Anonymous"}
              </p>
              <span className="text-[11px] text-gray-500">
                {timeAgo(c.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {c.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ================================================================
   MAIN (VIEW ONLY)
================================================================ */
export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [complaint, setComplaint] = useState(null);
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) {
      setError("Route param :id is missing. Check your Route path.");
      setComplaint(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1) Always fetch single complaint first (so detail page can render even if getAll fails)
      const singleRes = await ComplaintAPI.getById(id);
      const single = unwrapApi(singleRes);
      if (!single?._id) throw new Error("Complaint not found.");
      setComplaint(single);

      // 2) Optional: fetch all for prev/next
      try {
        const allRes = await ComplaintAPI.getAll();
        const all = unwrapApi(allRes);
        const list = Array.isArray(all) ? all : [];
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setAllComplaints(sorted);
      } catch {
        setAllComplaints([]);
      }
    } catch (e) {
      setError(e?.message || "Failed to fetch complaint.");
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const currentIndex = useMemo(
    () => allComplaints.findIndex((c) => c._id === id),
    [allComplaints, id]
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allComplaints.length - 1;

  const goBack = () => {
    const from = location.state?.from;
    navigate(from || "/complaints");
  };

  const goPrev = () => {
    if (!hasPrev) return;
    navigate(`/complaints/${allComplaints[currentIndex - 1]._id}`, {
      state: { from: location.pathname },
    });
  };

  const goNext = () => {
    if (!hasNext) return;
    navigate(`/complaints/${allComplaints[currentIndex + 1]._id}`, {
      state: { from: location.pathname },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-800">
            Loading complaint…
          </p>
          <p className="mt-1 text-xs text-gray-600">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (!complaint || error) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-3xl mx-auto rounded-3xl border border-gray-200 bg-white shadow-sm p-10 text-center">
          <AlertCircle className="h-14 w-14 text-rose-600 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-gray-900">
            {error || "Complaint not found"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The complaint may have been removed, or access may be restricted.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={goBack}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-blue-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold text-gray-800 hover:bg-gray-50 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusKey = safeStatus(complaint.status);
  const priorityKey = safePriority(complaint.priority);
  const categoryKey = safeCategory(
    String(complaint.category || "other").toLowerCase()
  );

  const status = STATUS_CONFIG[statusKey];
  const priority = PRIORITY_CONFIG[priorityKey];
  const category = CATEGORY_CONFIG[categoryKey];
  const StatusIcon = status.Icon;

  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          {allComplaints.length > 1 && currentIndex >= 0 && (
            <div className="flex items-center gap-3">
              <SoftButton onClick={goPrev} disabled={!hasPrev} tone="blue">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </SoftButton>
              <span className="text-xs font-semibold text-gray-600">
                {currentIndex + 1} / {allComplaints.length}
              </span>
              <SoftButton onClick={goNext} disabled={!hasNext} tone="blue">
                Next
                <ChevronRight className="h-4 w-4" />
              </SoftButton>
            </div>
          )}
        </div>

        {/* Main card */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 break-words">
                  {complaint.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Chip className={status.chip}>
                    <StatusIcon className="h-4 w-4" />
                    {status.label}
                  </Chip>

                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ${priority.chip}`}
                  >
                    <Flag className="h-3.5 w-3.5 mr-1" />
                    {priority.label} Priority
                  </span>

                  <Chip className={`${category.chip} border`}>
                    <span>{category.icon}</span>
                    <Tag className="h-3.5 w-3.5" />
                    {labelize(categoryKey)}
                  </Chip>

                  <Chip className="bg-white/70 text-gray-700 border-gray-200">
                    View only
                  </Chip>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  Complaint ID
                </p>
                <p className="mt-1 text-sm font-mono font-extrabold text-gray-900">
                  #{complaint._id?.slice(-8) || complaint._id}
                </p>
              </div>
            </div>

            {/* Meta cards (schema-aligned) */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetaCard
                Icon={Calendar}
                label="Submitted"
                value={formatDateTime(complaint.createdAt)}
                sub={timeAgo(complaint.createdAt)}
              />
              <MetaCard
                Icon={Clock}
                label="Last updated"
                value={formatDateTime(complaint.updatedAt)}
                sub={timeAgo(complaint.updatedAt)}
              />
              <MetaCard
                Icon={Building2}
                label="Department"
                value={complaint.department || "General"}
              />
              <MetaCard
                Icon={User}
                label="Reporter"
                value={complaint.user?.name || "User"}
                sub={complaint.user?.email || "—"}
              />
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Description */}
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Description
              </h2>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>
            </section>

            {/* Contact Info (exists in schema) */}
            {complaint.contactInfo ? (
              <section className="space-y-3">
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Contact info
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MetaCard
                    Icon={User}
                    label="Name"
                    value={complaint.contactInfo?.name || "—"}
                  />
                  <MetaCard
                    Icon={Mail}
                    label="Email"
                    value={complaint.contactInfo?.email || "—"}
                  />
                  <MetaCard
                    Icon={Phone}
                    label="Phone"
                    value={complaint.contactInfo?.phone || "—"}
                  />
                </div>
              </section>
            ) : null}

            {/* Notes (schema) */}
            {complaint.notes ? (
              <section className="space-y-3">
                <h2 className="text-lg font-extrabold text-gray-900">Notes</h2>
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {complaint.notes}
                  </p>
                </div>
              </section>
            ) : null}

            {/* Resolution / Rejection (schema) */}
            {complaint.status === "resolved" &&
            (complaint.resolutionNote || complaint.resolvedAt) ? (
              <section className="space-y-3">
                <h2 className="text-lg font-extrabold text-gray-900">
                  Resolution
                </h2>
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-900">
                    Resolved at: {formatDateTime(complaint.resolvedAt)}
                  </p>
                  {complaint.resolutionNote ? (
                    <p className="mt-2 text-sm text-emerald-900 whitespace-pre-wrap">
                      {complaint.resolutionNote}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {complaint.status === "rejected" &&
            (complaint.rejectionReason || complaint.rejectedAt) ? (
              <section className="space-y-3">
                <h2 className="text-lg font-extrabold text-gray-900">
                  Rejection
                </h2>
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
                  <p className="text-sm font-semibold text-rose-900">
                    Rejected at: {formatDateTime(complaint.rejectedAt)}
                  </p>
                  {complaint.rejectionReason ? (
                    <p className="mt-2 text-sm text-rose-900 whitespace-pre-wrap">
                      {complaint.rejectionReason}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* Attachments */}
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Attachments
              </h2>
              <AttachmentGrid attachments={complaint.attachments} />
            </section>

            {/* Comments */}
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Comments{" "}
                <span className="text-sm text-gray-500 font-semibold">
                  ({complaint.comments?.length || 0})
                </span>
              </h2>
              <Comments comments={complaint.comments} />
            </section>
          </div>
        </div>

        {/* Bottom nav */}
        {allComplaints.length > 1 && currentIndex >= 0 && (
          <div className="flex items-center justify-center gap-3">
            <SoftButton onClick={goPrev} disabled={!hasPrev} tone="blue">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </SoftButton>
            <SoftButton onClick={goNext} disabled={!hasNext} tone="blue">
              Next
              <ChevronRight className="h-4 w-4" />
            </SoftButton>
          </div>
        )}
      </div>
    </motion.main>
  );
}
