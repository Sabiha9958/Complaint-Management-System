import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  Tag,
  User,
  Mail,
  Phone,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  MapPin,
  Download,
  Shield,
  Copy,
  Hash,
  Timer,
  Building2,
} from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const cx = (...classes) => classes.filter(Boolean).join(" ");
const normalizeStatus = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]/g, "_");

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const dt = new Date(dateString);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatBytes = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const STATUS_UI = {
  pending: {
    label: "Pending",
    Icon: Clock,
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  in_progress: {
    label: "In progress",
    Icon: RefreshCw,
    pill: "border-blue-200 bg-blue-50 text-blue-700",
  },
  resolved: {
    label: "Resolved",
    Icon: CheckCircle,
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    Icon: XCircle,
    pill: "border-red-200 bg-red-50 text-red-700",
  },
  closed: {
    label: "Closed",
    Icon: Shield,
    pill: "border-gray-200 bg-gray-50 text-gray-700",
  },
};

const PRIORITY_UI = {
  urgent: "border-red-200 bg-red-50 text-red-700 ring-red-500/10",
  high: "border-orange-200 bg-orange-50 text-orange-700 ring-orange-500/10",
  medium: "border-blue-200 bg-blue-50 text-blue-700 ring-blue-500/10",
  low: "border-gray-200 bg-gray-50 text-gray-700 ring-gray-500/10",
};

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <PageShell>
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-gray-500">
            Loading complaint…
          </p>
        </div>
      </div>
    </PageShell>
  );
}

function ErrorView({ message, onBack }) {
  return (
    <PageShell>
      <div className="flex h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-50 ring-1 ring-red-100">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">
            Unable to load complaint
          </h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Go back
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
        className
      )}
    >
      {children}
    </span>
  );
}

function Card({ title, icon: Icon, children, right }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-gray-500" /> : null}
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-600">
            {title}
          </h3>
        </div>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-gray-50 text-gray-500 ring-1 ring-gray-100">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        {href ? (
          <a
            href={href}
            className="block truncate text-sm font-semibold text-emerald-700 hover:underline"
          >
            {value || "—"}
          </a>
        ) : (
          <p className="truncate text-sm font-semibold text-gray-900">
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchComplaint = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const liveToken = localStorage.getItem("token");
      if (!liveToken) {
        navigate("/login", { replace: true });
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/complaints/${id}`, {
        headers: { Authorization: `Bearer ${liveToken}` },
      });

      const payload = res?.data ?? res;
      const data = payload?.complaint || payload?.data || payload;

      if (!data || !data._id)
        throw new Error("Invalid complaint data received.");

      setComplaint(data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load complaint details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const ui = useMemo(() => {
    if (!complaint) return null;

    const reporter =
      complaint.user || complaint.createdBy || complaint.reporter || {};
    const location = complaint.location || {};
    const attachments = Array.isArray(complaint.attachments)
      ? complaint.attachments
      : [];
    const comments = Array.isArray(complaint.comments)
      ? complaint.comments
      : [];
    const statusHistory = Array.isArray(complaint.statusHistory)
      ? complaint.statusHistory
      : [];

    const statusKey = normalizeStatus(complaint.status);
    const status = STATUS_UI[statusKey] || STATUS_UI.pending;

    const priorityKey = String(complaint.priority || "low").toLowerCase();
    const priorityClass = PRIORITY_UI[priorityKey] || PRIORITY_UI.low;

    const shortId = String(complaint._id).slice(-6).toUpperCase();

    const timeline = [
      ...statusHistory.map((h) => ({
        type: "status",
        at: h.at || h.createdAt || null,
        title: `Status changed to ${String(h.status || "").replace(/[_-]/g, " ")}`,
        by: h.by?.name || h.by?.email || "System",
        note: h.note || "",
      })),
      ...comments.map((c) => ({
        type: "comment",
        at: c.createdAt || null,
        title: c.user?.name || "Comment",
        by: c.user?.email || "",
        note: c.text || "",
      })),
    ].sort(
      (a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()
    );

    return {
      reporter,
      location,
      attachments,
      status,
      priorityKey,
      priorityClass,
      shortId,
      timeline,
    };
  }, [complaint]);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  if (loading) return <Skeleton />;
  if (error)
    return (
      <ErrorView message={error} onBack={() => navigate("/admin/complaints")} />
    );
  if (!complaint || !ui) return null;

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/complaints")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
            aria-label="Back to complaints"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-extrabold text-gray-900">
                {complaint.title || "Complaint"}
              </h1>
              <Pill className={cx("shadow-sm", ui.status.pill)}>
                <ui.status.Icon className="h-4 w-4" />
                {ui.status.label}
              </Pill>
              <Pill className={cx("ring-1", ui.priorityClass)}>
                {String(ui.priorityKey).toUpperCase()}
              </Pill>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {complaint.location?.city || "—"}
              </span>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateTime(complaint.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchComplaint}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={() => copyText(complaint._id)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Hash className="h-4 w-4" />
            {ui.shortId}
            <Copy className="h-4 w-4 opacity-90" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-600">
              Description
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {complaint.description || "—"}
            </p>
          </section>

          <Card
            title={`Attachments (${ui.attachments.length})`}
            icon={FileText}
            right={
              ui.attachments.length ? (
                <span className="text-xs font-semibold text-gray-400">
                  Click to open
                </span>
              ) : null
            }
          >
            {ui.attachments.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ui.attachments.map((file, idx) => (
                  <a
                    key={file._id || idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-100 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {file.originalName || file.filename || "Attachment"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size ? formatBytes(file.size) : "Open file"}
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-gray-300 group-hover:text-emerald-600" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                No attachments.
              </div>
            )}
          </Card>

          <Card
            title="Activity"
            icon={MessageSquare}
            right={
              <span className="text-xs font-semibold text-gray-400">
                {ui.timeline.length} items
              </span>
            }
          >
            {ui.timeline.length ? (
              <div className="space-y-4">
                {ui.timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-700 ring-1 ring-gray-100">
                      <Timer className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <span className="text-xs font-semibold text-gray-400">
                          {formatDateTime(item.at)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        {item.by ? (
                          <span className="font-semibold text-gray-900">
                            {item.by}
                          </span>
                        ) : null}
                        {item.by && item.note ? (
                          <span className="text-gray-300"> • </span>
                        ) : null}
                        {item.note ? (
                          <span className="break-words">{item.note}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                No activity yet.
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Reporter" icon={User}>
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-lg font-extrabold text-emerald-700">
                {(ui.reporter?.name || "U").charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-gray-900">
                  {ui.reporter?.name || "Unknown user"}
                </p>
                <p className="truncate text-xs font-semibold text-gray-500">
                  {ui.reporter?.role || "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 divide-y divide-gray-100">
              <InfoRow
                icon={Mail}
                label="Email"
                value={ui.reporter?.email}
                href={
                  ui.reporter?.email ? `mailto:${ui.reporter.email}` : undefined
                }
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={ui.reporter?.phone}
                href={
                  ui.reporter?.phone ? `tel:${ui.reporter.phone}` : undefined
                }
              />
              <InfoRow icon={Hash} label="User ID" value={ui.reporter?._id} />
            </div>
          </Card>

          <Card title="Location" icon={Building2}>
            <div className="divide-y divide-gray-100">
              <InfoRow
                icon={MapPin}
                label="City"
                value={complaint.location?.city}
              />
              <InfoRow
                icon={Building2}
                label="Building"
                value={complaint.location?.building}
              />
              <InfoRow
                icon={Tag}
                label="Room / Area"
                value={complaint.location?.room || complaint.location?.area}
              />
              <InfoRow
                icon={Tag}
                label="Landmark"
                value={complaint.location?.landmark}
              />
            </div>
          </Card>

          <Card title="Details" icon={Tag}>
            <div className="divide-y divide-gray-100">
              <InfoRow icon={Tag} label="Category" value={complaint.category} />
              <InfoRow
                icon={Tag}
                label="Subcategory"
                value={complaint.subCategory}
              />
              <InfoRow
                icon={Calendar}
                label="Submitted"
                value={formatDateTime(complaint.createdAt)}
              />
              <InfoRow
                icon={RefreshCw}
                label="Updated"
                value={formatDateTime(complaint.updatedAt)}
              />
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
