import React, { memo, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
} from "lucide-react";

const nf = new Intl.NumberFormat("en-IN");
const cx = (...c) => c.filter(Boolean).join(" ");

const tone = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  purple: "bg-purple-50 text-purple-700 ring-purple-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-50 text-slate-700 ring-slate-100",
};

const formatValue = (v) => {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number") return nf.format(v);
  return String(v);
};

const KPICard = memo(function KPICard({
  title,
  value,
  subtext,
  badge,
  icon: Icon,
  color = "slate",
}) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-500">{title}</p>
            {badge ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-extrabold text-gray-600">
                {badge}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
            {formatValue(value)}
          </p>

          {subtext ? (
            <p className="mt-2 text-xs font-semibold text-gray-500">
              {subtext}
            </p>
          ) : null}
        </div>

        <div className={cx("shrink-0 rounded-2xl p-3 ring-1", tone[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
});

export default memo(function KPIGrid({
  analytics,
  dateRangeDays,
  userStats,
  totals,
}) {
  const cards = useMemo(() => {
    const completion = Number(analytics?.completionRate ?? 0);
    const resolvedCount = Number(analytics?.resolvedCount ?? 0);
    const totalInRange = Number(analytics?.totalInRange ?? 0);
    const urgentCount = Number(analytics?.urgentCount ?? 0);

    const totalComplaints = Number(totals?.totalComplaints ?? 0);
    const totalUsers = Number(totals?.totalUsers ?? 0);

    const activeUsers = Number(userStats?.activeUsers ?? 0);
    const admins = Number(userStats?.admins ?? 0);

    return [
      {
        key: "totalComplaints",
        title: "Total complaints",
        value: totalComplaints,
        subtext: "All-time (API total)",
        icon: FileText,
        color: "blue",
      },
      {
        key: "rangeComplaints",
        title: "Complaints in range",
        value: totalInRange,
        subtext: `${dateRangeDays}-day window`,
        badge: "Range",
        icon: FileText,
        color: "blue",
      },
      {
        key: "resolved",
        title: "Resolved (range)",
        value: resolvedCount,
        subtext: `${Number.isFinite(completion) ? completion.toFixed(0) : "0"}% completion`,
        badge: "Range",
        icon: CheckCircle,
        color: "green",
      },
      {
        key: "avgResolution",
        title: "Avg resolution",
        value: resolvedCount
          ? `${Number(analytics?.avgTime ?? 0).toFixed(1)}h`
          : "N/A",
        subtext: "Resolved only (range)",
        badge: resolvedCount ? "Range" : undefined,
        icon: Clock,
        color: "purple",
      },
      {
        key: "totalUsers",
        title: "Total users",
        value: totalUsers,
        subtext: `${nf.format(activeUsers)} active, ${nf.format(admins)} admins`,
        icon: Users,
        color: "blue",
      },
      {
        key: "urgent",
        title: "Urgent (range)",
        value: urgentCount,
        subtext: urgentCount > 5 ? "High urgent load" : "Urgent volume stable",
        badge: "Range",
        icon: AlertTriangle,
        color: "red",
      },
    ];
  }, [analytics, dateRangeDays, totals, userStats]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ key, ...rest }) => (
        <KPICard key={key} {...rest} />
      ))}
    </div>
  );
});
