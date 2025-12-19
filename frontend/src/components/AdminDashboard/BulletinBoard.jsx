import React, { memo, useMemo } from "react";
import { AlertTriangle, FileText, ShieldCheck, Users } from "lucide-react";
import Badge from "./ui/Badge";
import { formatValue } from "./utils";

export default memo(function BulletinBoard({ totals, userStats, stats }) {
  const items = useMemo(() => {
    const open = Number(stats?.openCount || 0);
    const completion = Number(stats?.completionRate || 0);

    return [
      {
        key: "ops",
        title: "Operations",
        icon: AlertTriangle,
        badge: open > 10 ? "Attention" : "Stable",
        badgeVariant: open > 10 ? "rose" : "amber",
        lines: [
          `Open items: ${formatValue(open)}`,
          `Completion rate: ${completion.toFixed(0)}%`,
        ],
      },
      {
        key: "complaints",
        title: "Complaints",
        icon: FileText,
        badge: "Live",
        badgeVariant: "emerald",
        lines: [
          `Total complaints: ${formatValue(totals?.totalComplaints ?? 0)}`,
          `Resolved today: ${formatValue(stats?.resolvedToday ?? 0)}`,
        ],
      },
      {
        key: "users",
        title: "Users",
        icon: Users,
        badge: "Directory",
        badgeVariant: "blue",
        lines: [
          `Total users: ${formatValue(totals?.totalUsers ?? 0)}`,
          userStats?.admins != null
            ? `Admins: ${formatValue(Number(userStats.admins || 0))}`
            : "Admins: —",
        ],
      },
      {
        key: "policy",
        title: "Guidelines",
        icon: ShieldCheck,
        badge: "Policy",
        badgeVariant: "slate",
        lines: [
          "Resolve only after adding a resolution note.",
          "Prioritize urgent tickets under 48h.",
        ],
      },
    ];
  }, [totals, userStats, stats]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.key}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <it.icon className="h-5 w-5 text-gray-700" />
                <p className="text-sm font-extrabold text-gray-900">
                  {it.title}
                </p>
              </div>

              <div className="mt-3 space-y-1">
                {it.lines.map((line, idx) => (
                  <p key={idx} className="text-sm text-gray-600">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <Badge variant={it.badgeVariant}>{it.badge}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
});
