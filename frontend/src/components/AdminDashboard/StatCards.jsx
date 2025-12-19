import React, { memo, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
} from "lucide-react";
import { formatValue } from "./utils";

const TONES = {
  indigo: "from-indigo-50 to-purple-50 text-indigo-700",
  emerald: "from-emerald-50 to-teal-50 text-emerald-700",
  rose: "from-rose-50 to-orange-50 text-rose-700",
  slate: "from-slate-50 to-gray-50 text-slate-700",
};

const cx = (...c) => c.filter(Boolean).join(" ");

const StatCard = memo(function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  tone = "indigo",
  onClick,
}) {
  const clickable = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className={cx(
        "rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition",
        clickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
          : "cursor-default"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
            {formatValue(value)}
          </p>
          {subtext ? (
            <p className="mt-2 text-xs font-semibold text-gray-500">
              {subtext}
            </p>
          ) : null}
        </div>

        <div
          className={cx(
            "rounded-2xl bg-gradient-to-br p-3",
            TONES[tone] || TONES.indigo
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </button>
  );
});

export default memo(function StatCards({
  totals,
  userStats,
  stats,
  onQuickFilter,
}) {
  const cards = useMemo(() => {
    const totalComplaints = totals?.totalComplaints ?? 0;
    const totalUsers = totals?.totalUsers ?? 0;

    const open = Number(stats?.openCount ?? 0);
    const pending = Number(stats?.pendingCount ?? 0);
    const inProgress = Number(stats?.inProgressCount ?? 0);
    const openPending = open + pending + inProgress;

    const resolvedToday = Number(stats?.resolvedToday ?? 0);
    const completion = Number(stats?.completionRate ?? 0);

    const activeUsers = Number(userStats?.activeUsers ?? 0);
    const admins = Number(userStats?.admins ?? 0);

    return [
      {
        key: "totalComplaints",
        title: "Total complaints",
        value: totalComplaints,
        subtext: "All-time",
        icon: FileText,
        tone: "indigo",
        onClick: () =>
          onQuickFilter?.({ status: "all", priority: "all", search: "" }),
      },
      {
        key: "openPending",
        title: "Open / pending",
        value: openPending,
        subtext: "All-time",
        icon: AlertCircle,
        tone: openPending > 10 ? "rose" : "slate",
        onClick: () =>
          onQuickFilter?.({ status: "pending", priority: "all", search: "" }),
      },
      {
        key: "resolvedToday",
        title: "Resolved today",
        value: resolvedToday,
        subtext: `${completion.toFixed(0)}% completion`,
        icon: CheckCircle2,
        tone: "emerald",
        onClick: () =>
          onQuickFilter?.({ status: "resolved", priority: "all", search: "" }),
      },
      {
        key: "users",
        title: "Total users",
        value: totalUsers,
        subtext: `${formatValue(activeUsers)} active, ${formatValue(admins)} admins`,
        icon: Users,
        tone: "indigo",
      },
      {
        key: "sla",
        title: "Response SLA",
        value: stats?.slaHours != null ? `${stats.slaHours}h` : "—",
        subtext:
          stats?.slaHours != null ? "Configured" : "Add backend SLA later",
        icon: Clock,
        tone: "slate",
      },
    ];
  }, [totals, userStats, stats, onQuickFilter]);

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, ...rest }) => (
        <StatCard key={key} {...rest} />
      ))}
    </div>
  );
});
