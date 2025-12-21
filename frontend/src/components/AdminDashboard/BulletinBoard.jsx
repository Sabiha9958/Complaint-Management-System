import React, { useMemo } from "react";
import { AlertTriangle, FileText, ShieldCheck, Users } from "lucide-react";
import Badge from "./ui/Badge";
import { formatValue } from "./utils";

const toNumberOrNull = (v) => {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const cleaned = String(v).replace("%", "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const line = (label, value) =>
  value == null ? `${label}: —` : `${label}: ${formatValue(value)}`;

export default function BulletinBoard({ totals, userStats, stats, loading }) {
  const vm = useMemo(() => {
    const open = toNumberOrNull(stats?.openCount);
    const completion = toNumberOrNull(stats?.completionRate);

    const totalComplaints = toNumberOrNull(totals?.totalComplaints);
    const resolvedToday = toNumberOrNull(stats?.resolvedToday);

    // IMPORTANT: prefer userStats.totalUsers if available
    const totalUsers =
      toNumberOrNull(userStats?.totalUsers) ??
      toNumberOrNull(totals?.totalUsers);

    const admins = toNumberOrNull(userStats?.admins);

    const opsBadge =
      open != null && open > 10
        ? { text: "Attention", variant: "rose" }
        : { text: "Stable", variant: "amber" };

    return {
      opsBadge,
      open,
      completion,
      totalComplaints,
      resolvedToday,
      totalUsers,
      admins,
    };
  }, [totals, userStats, stats]);

  const items = [
    {
      key: "ops",
      title: "Operations",
      icon: AlertTriangle,
      badge: vm.opsBadge.text,
      badgeVariant: vm.opsBadge.variant,
      lines: [
        line("Open items", vm.open),
        vm.completion == null
          ? "Completion rate: —"
          : `Completion rate: ${vm.completion.toFixed(0)}%`,
      ],
    },
    {
      key: "complaints",
      title: "Complaints",
      icon: FileText,
      badge: "Live",
      badgeVariant: "emerald",
      lines: [
        line("Total complaints", vm.totalComplaints),
        line("Resolved today", vm.resolvedToday),
      ],
    },
    {
      key: "users",
      title: "Users",
      icon: Users,
      badge: "Directory",
      badgeVariant: "blue",
      lines: [line("Total users", vm.totalUsers), line("Admins", vm.admins)],
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
                {loading ? (
                  <>
                    <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
                    <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                  </>
                ) : (
                  it.lines.map((txt, idx) => (
                    <p key={idx} className="text-sm text-gray-600">
                      {txt}
                    </p>
                  ))
                )}
              </div>
            </div>

            <Badge variant={it.badgeVariant}>{it.badge}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
