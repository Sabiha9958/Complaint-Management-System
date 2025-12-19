import React, { useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";

const InfoCard = ({
  icon: Icon,
  label,
  value,
  copyValue,
  onCopy, // optional override
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const doCopy = useCallback(async () => {
    const text = String(copyValue ?? value ?? "").trim();
    if (!text) return;

    try {
      if (onCopy) {
        await onCopy(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore (toast can be handled in parent if needed)
    }
  }, [copyValue, value, onCopy]);

  const shown = value ?? "—";

  return (
    <div
      className={[
        "group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        "transition hover:shadow-md",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
            <Icon className="h-4 w-4 text-indigo-600" />
          </span>

          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {shown}
            </p>
          </div>
        </div>

        {(copyValue ?? value) && (
          <button
            type="button"
            onClick={doCopy}
            className={[
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              "text-slate-500 ring-1 ring-slate-200 transition",
              "hover:bg-slate-50 hover:text-slate-900",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            ].join(" ")}
            aria-label={`Copy ${label}`}
            title={`Copy ${label}`}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InfoCard;
