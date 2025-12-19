import React, { useMemo } from "react";
import { AlertCircle } from "lucide-react";

const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  rows = 1,
  icon: Icon,
  required = false,
  disabled = false,
  type = "text",
  name,
  autoComplete,
}) => {
  const Component = rows > 1 ? "textarea" : "input";

  const remaining = useMemo(() => {
    if (!maxLength) return null;
    return maxLength - String(value || "").length;
  }, [maxLength, value]);

  const counterTone =
    remaining == null
      ? "text-slate-500"
      : remaining < 20
        ? "text-rose-600 font-bold"
        : "text-slate-500";

  const baseField =
    "w-full rounded-xl border px-4 py-3 text-sm transition shadow-sm outline-none";

  const enabledField =
    "bg-white text-slate-900 border-slate-200 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-300";

  const disabledField =
    "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed";

  const errorField =
    "border-rose-300 bg-rose-50/30 text-slate-900 focus-visible:ring-2 focus-visible:ring-rose-500";

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
          {Icon && <Icon className="h-4 w-4 text-indigo-600" />}
          <span className="truncate">{label}</span>
          {required && <span className="text-rose-600">*</span>}
        </span>

        {maxLength != null && (
          <span className={["text-xs font-medium", counterTone].join(" ")}>
            {remaining} left
          </span>
        )}
      </label>

      <Component
        name={name}
        type={rows > 1 ? undefined : type}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows > 1 ? rows : undefined}
        disabled={disabled}
        autoComplete={autoComplete}
        className={[
          baseField,
          rows > 1 ? "resize-none" : "",
          disabled ? disabledField : error ? errorField : enabledField,
        ].join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name || label}-error` : undefined}
      />

      {error && (
        <p
          id={`${name || label}-error`}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-600"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
