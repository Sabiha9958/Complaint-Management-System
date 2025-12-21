import React, { memo, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  Hash,
  AlertCircle,
  CheckCircle2,
  ArrowUpCircle,
  Siren,
  Tag,
  Copy,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utils ---
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// --- Configuration ---

// Centralized Design System for Priorities
const PRIORITY_THEME = {
  urgent: {
    label: "Critical",
    color: "rose",
    icon: Siren,
    styles: "bg-rose-50 border-l-rose-500 hover:border-rose-300",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    iconColor: "text-rose-600",
  },
  high: {
    label: "High",
    color: "orange",
    icon: ArrowUpCircle,
    styles: "bg-orange-50/50 border-l-orange-500 hover:border-orange-300",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    iconColor: "text-orange-600",
  },
  medium: {
    label: "Medium",
    color: "amber",
    icon: AlertCircle,
    styles: "bg-amber-50/50 border-l-amber-400 hover:border-amber-300",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    iconColor: "text-amber-600",
  },
  low: {
    label: "Low",
    color: "slate",
    icon: CheckCircle2,
    styles: "bg-white border-l-slate-300 hover:border-slate-400",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    iconColor: "text-slate-500",
  },
};

// Status Design System
const STATUS_THEME = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

// --- Sub-Components ---

const UserInfo = ({ name, email }) => {
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
        {initials}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-700">{name}</span>
        <span className="text-[10px] text-slate-400 max-w-[120px] truncate">
          {email}
        </span>
      </div>
    </div>
  );
};

const CategoryBadge = ({ category }) => (
  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 shadow-sm">
    <Tag className="w-3 h-3 text-indigo-500" />
    <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
      {category || "General"}
    </span>
  </div>
);

// --- Main Component ---

const ComplaintCard = ({ complaint, onUpdateStatus, className }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Normalize Data
  const data = useMemo(() => {
    if (!complaint) return null;
    return {
      id: complaint._id || complaint.id,
      shortId: (complaint._id || complaint.id || "").slice(-6).toUpperCase(),
      title: complaint.title || "Untitled Issue",
      desc: complaint.description || "No details provided.",
      category: complaint.category || "General",
      priority: (complaint.priority || "low").toLowerCase(),
      status: (complaint.status || "pending").toLowerCase(),
      created: complaint.createdAt,
      author: {
        name: complaint.user?.name || "Anonymous",
        email: complaint.user?.email || "",
      },
      metrics: {
        comments: complaint.commentsCount || 0,
        files: complaint.attachments?.length || 0,
      },
    };
  }, [complaint]);

  if (!data) return null;

  // Get Theme based on Priority
  const theme = PRIORITY_THEME[data.priority] || PRIORITY_THEME.low;
  const PriorityIcon = theme.icon;

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(data.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => navigate(`/admin/complaints/${data.id}`)}
      className={cn(
        "group relative flex flex-col w-full bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300",
        "hover:shadow-md hover:-translate-y-1 cursor-pointer overflow-hidden",
        // The thick colored border on the left
        `border-l-4 ${theme.styles.split(" ")[1]}`,
        className
      )}
    >
      {/* Top Meta Row */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* ID Badge */}
          <div
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            title="Copy ID"
          >
            <Hash className="w-3 h-3" />
            {data.shortId}
            {copied ? (
              <span className="text-emerald-500 font-bold">✓</span>
            ) : (
              <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>

          <CategoryBadge category={data.category} />
        </div>

        {/* Priority Badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
            theme.badge
          )}
        >
          <PriorityIcon className="w-3.5 h-3.5" />
          {theme.label}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-5 py-2 flex-1">
        <h3 className="font-bold text-slate-800 text-base mb-1.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {data.title}
        </h3>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
          {data.desc}
        </p>
      </div>

      {/* Metrics & Date Divider */}
      <div className="px-5 mt-2">
        <div className="h-px bg-slate-100 w-full" />
      </div>

      {/* Metrics Row */}
      <div className="px-5 py-2 flex items-center gap-4">
        <div className="flex items-center gap-3 text-slate-400">
          {/* Comments */}
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              data.metrics.comments > 0 ? "text-slate-600" : ""
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="font-medium">{data.metrics.comments}</span>
          </div>
          {/* Attachments */}
          {data.metrics.files > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="font-medium">{data.metrics.files}</span>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <CalendarDays className="w-3.5 h-3.5" />
          {formatRelativeTime(data.created)}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="bg-slate-50/80 px-5 py-3 flex items-center justify-between border-t border-slate-100 group-hover:bg-slate-50 transition-colors">
        <UserInfo name={data.author.name} email={data.author.email} />

        <div className="flex items-center gap-3">
          {/* Status Pill */}
          <div
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border shadow-sm",
              STATUS_THEME[data.status] || STATUS_THEME.pending
            )}
          >
            {data.status.replace("-", " ")}
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus && onUpdateStatus(complaint);
            }}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm hover:text-indigo-600 text-slate-400 transition-all border border-transparent hover:border-slate-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(ComplaintCard);
