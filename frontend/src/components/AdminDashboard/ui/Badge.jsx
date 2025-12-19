import React, { memo } from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const VARIANT_CLASSES = {
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
  gray: "bg-gray-50 text-gray-700 border-gray-200",
};

const SIZE_CLASSES = {
  sm: "text-[11px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

const Badge = memo(function Badge({
  children,
  variant = "gray",
  size = "md",
  pill = true,
  className,
  title,
}) {
  const colors = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.gray;
  const sizeCls = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 border font-extrabold select-none",
        pill ? "rounded-full" : "rounded-lg",
        colors,
        sizeCls,
        className
      )}
    >
      {children}
    </span>
  );
});

export default Badge;
