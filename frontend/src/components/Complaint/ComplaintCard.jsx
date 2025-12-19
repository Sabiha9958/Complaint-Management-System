import React, { memo, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiHash,
  FiTag,
  FiFlag,
  FiCheckCircle,
  FiMessageSquare,
  FiAlertCircle,
  FiEdit3,
} from "react-icons/fi";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  getPriorityStyle,
  getStatusStyle,
} from "../../utils/constants";

const cx = (...c) => c.filter(Boolean).join(" ");

const safeStr = (v, fallback = "—") =>
  v == null || v === "" ? fallback : String(v);
const clamp = (text, max = 120) => {
  const s = String(text || "").trim();
  return s.length > max ? `${s.slice(0, max).trim()}…` : s;
};

const formatDateShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatRelative = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDateShort(iso);
};

const initials = (name) => {
  const s = String(name || "").trim();
  if (!s) return "?";
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
};

const Badge = ({ children, className = "" }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
      className
    )}
  >
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  const style = getStatusStyle(status);
  const label = STATUS_LABELS?.[status] || safeStr(status, "Pending");
  const dot = style?.text ? style.text.replace("text-", "bg-") : "bg-gray-400";

  return (
    <Badge className={cx("border-2", style?.bg, style?.text, style?.border)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
};

const PriorityBadge = ({ priority }) => {
  const style = getPriorityStyle(priority);
  const label = PRIORITY_LABELS?.[priority] || safeStr(priority, "Low");

  return (
    <Badge className={cx("border-2", style?.bg, style?.text, style?.border)}>
      <FiFlag className="h-3 w-3" />
      {label}
    </Badge>
  );
};

const CategoryBadge = ({ category }) => {
  const label = CATEGORY_LABELS?.[category] || safeStr(category);
  return (
    <Badge className="border-2 border-gray-200 bg-gray-100 text-gray-700">
      <FiTag className="h-3 w-3" />
      {label}
    </Badge>
  );
};

const Avatar = ({ name }) => (
  <div
    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-xs font-black text-white shadow-sm ring-1 ring-black/5"
    title={safeStr(name, "User")}
  >
    {initials(name)}
  </div>
);

const EmptyCard = memo(function EmptyCard() {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <FiAlertCircle className="mb-2 h-9 w-9 text-gray-400" />
      <p className="text-sm font-semibold text-gray-600">No data</p>
      <p className="mt-1 text-xs text-gray-500">
        Complaint information unavailable.
      </p>
    </div>
  );
});

const ComplaintCard = memo(function ComplaintCard({
  complaint,
  to, // (complaint) => string OR string
  onUpdateStatus, // (complaint) => void
  canUpdateStatus = false, // pass from parent based on role
}) {
  const navigate = useNavigate();

  const href = useMemo(() => {
    if (to) return typeof to === "function" ? to(complaint) : to;
    return complaint?._id ? `/complaints/${complaint._id}` : "#";
  }, [complaint, to]);

  const ui = useMemo(() => {
    if (!complaint) return null;

    const id = complaint._id || complaint.complaintId;
    const shortId = id ? String(id).slice(-8).toUpperCase() : "—";

    const title = safeStr(complaint.title, "Untitled complaint");
    const description =
      clamp(complaint.description, 120) || "No description provided.";
    const createdAt = complaint.createdAt || null;

    const name =
      complaint.contactInfo?.name ||
      complaint.user?.name ||
      complaint.createdBy?.name ||
      "Anonymous";

    const email =
      complaint.contactInfo?.email ||
      complaint.user?.email ||
      complaint.createdBy?.email ||
      "";

    const assigned = Boolean(complaint.assignedTo);
    const commentsCount = Number(complaint.commentsCount || 0);

    return {
      shortId,
      title,
      description,
      createdAt,
      name,
      email,
      assigned,
      commentsCount,
    };
  }, [complaint]);

  const onCardClick = useCallback(() => {
    if (href && href !== "#") navigate(href);
  }, [href, navigate]);

  const onStatusClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation(); // prevent navigation from card click
      onUpdateStatus?.(complaint);
    },
    [onUpdateStatus, complaint]
  );

  if (!complaint || !ui) return <EmptyCard />;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) =>
        e.key === "Enter" || e.key === " " ? onCardClick() : null
      }
      className={cx(
        "relative h-full overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm",
        "transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl active:translate-y-0",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      )}
      aria-label={`Open complaint: ${ui.title}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
            <FiHash className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-black text-gray-700">
              {ui.shortId}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FiClock className="h-3.5 w-3.5" />
            <time
              dateTime={ui.createdAt || undefined}
              title={formatDateShort(ui.createdAt)}
              className="font-semibold"
            >
              {formatRelative(ui.createdAt)}
            </time>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 line-clamp-2 text-base font-black leading-tight text-gray-900">
            {ui.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">
            {ui.description}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          {complaint.category ? (
            <CategoryBadge category={complaint.category} />
          ) : null}

          {canUpdateStatus ? (
            <button
              type="button"
              onClick={onStatusClick}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
              aria-label="Update complaint status"
            >
              <FiEdit3 className="h-3.5 w-3.5" />
              Update
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t-2 border-gray-100 pt-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar name={ui.name} />
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-gray-800">
                {ui.name}
              </p>
              {ui.email ? (
                <p className="truncate text-[11px] font-medium text-gray-500">
                  {ui.email}
                </p>
              ) : null}
            </div>
          </div>

          {ui.assigned ? (
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <FiCheckCircle className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Assigned
              </span>
            </div>
          ) : (
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Unassigned
              </span>
            </div>
          )}
        </div>

        {ui.commentsCount > 0 ? (
          <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <FiMessageSquare className="h-3.5 w-3.5" />
            <span className="font-semibold">
              {ui.commentsCount} comment{ui.commentsCount > 1 ? "s" : ""}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
});

export default ComplaintCard;
