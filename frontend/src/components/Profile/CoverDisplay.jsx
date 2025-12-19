import React, { useMemo } from "react";
import { AlertCircle, Camera, Loader2 } from "lucide-react";
import { getCoverById, getFullCoverUrl } from "../../utils/coverImages";
import usePreloadedImage from "../../hooks/usePreloadedImage";

const Skeleton = () => (
  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
);

const CoverDisplay = ({
  coverId = 1,
  isEditing = false,
  onOpenSelector,
  previewUrl = null,
  heightClass = "h-56 sm:h-72 md:h-80 lg:h-96",
}) => {
  const fullSrc = useMemo(() => {
    const base =
      previewUrl || getCoverById(coverId)?.url || getCoverById(1)?.url;
    return getFullCoverUrl(base);
  }, [coverId, previewUrl]);

  const { displaySrc, isLoading, hasError } = usePreloadedImage(fullSrc);

  const canEdit = Boolean(isEditing && !hasError && onOpenSelector);

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm",
        "group isolate",
        heightClass,
      ].join(" ")}
    >
      {!displaySrc && !hasError && <Skeleton />}

      {displaySrc && !hasError && (
        <img
          key={displaySrc}
          src={displaySrc}
          alt="Profile cover"
          className={[
            "h-full w-full object-cover",
            "transition-transform duration-500 will-change-transform",
            canEdit ? "group-hover:scale-[1.03]" : "",
          ].join(" ")}
        />
      )}

      {/* Gradient overlay for readability + nice depth */}
      {!hasError && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
      )}

      {isLoading && !hasError && (
        <div className="absolute inset-0 grid place-items-center bg-black/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-slate-800 shadow-lg ring-1 ring-black/5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-semibold">Loading cover…</span>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 grid place-items-center bg-slate-50">
          <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-500" />
            <p className="mt-2 text-sm font-semibold text-slate-800">
              Couldn’t load the cover
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Check your connection or try another image.
            </p>
          </div>
        </div>
      )}

      {/* Top-right edit control */}
      {canEdit && (
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {previewUrl && (
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow ring-1 ring-black/5">
              Preview
            </span>
          )}

          <button
            type="button"
            onClick={onOpenSelector}
            aria-label="Change cover image"
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2",
              "bg-white/95 text-slate-900 shadow-lg ring-1 ring-black/5",
              "transition",
              "hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              "active:scale-[0.98]",
              "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
            ].join(" ")}
          >
            <Camera className="h-4 w-4" />
            <span className="text-sm font-semibold">Change cover</span>
          </button>
        </div>
      )}

      {/* Bottom hint (only while editing) */}
      {canEdit && (
        <div className="pointer-events-none absolute top-4 left-4 hidden sm:block">
          <div className="rounded-xl bg-black/35 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
            Tip: Hover and click “Change cover”
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverDisplay;
