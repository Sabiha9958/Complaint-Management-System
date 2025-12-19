import React, { useMemo } from "react";
import { Shield, Briefcase, User } from "lucide-react";

const ROLE_META = {
  admin: {
    label: "Administrator",
    Icon: Shield,
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  staff: {
    label: "Staff Member",
    Icon: Briefcase,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  user: {
    label: "Team Member",
    Icon: User,
    className: "bg-sky-50 text-sky-700 ring-sky-200",
  },
};

const RoleBadge = ({ role }) => {
  const meta = useMemo(() => ROLE_META[role] || ROLE_META.user, [role]);
  const Icon = meta.Icon;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
        "text-xs font-bold ring-1 ring-inset",
        meta.className,
      ].join(" ")}
      title={meta.label}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
};

export default RoleBadge;
