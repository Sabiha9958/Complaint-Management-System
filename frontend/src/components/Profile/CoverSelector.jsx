import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Sparkles, Check } from "lucide-react";
import {
  COVER_IMAGES,
  COVER_CATEGORIES,
  getThumbCoverUrl,
  getFullCoverUrl,
  preloadImage,
} from "../../utils/coverImages";

const CategoryPill = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition",
      "ring-1 ring-inset",
      active
        ? "bg-indigo-600 text-white ring-indigo-600"
        : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
    ].join(" ")}
  >
    {label}
  </button>
);

const CoverSelector = ({
  isOpen,
  onClose,
  currentCoverId,
  onSelect,
  onPreview,
}) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(currentCoverId);
  const [isSaving, setIsSaving] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedId(currentCoverId);
    setSearchQuery("");
    setActiveCategory("all");

    const t = setTimeout(() => searchRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen, currentCoverId]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) onPreview?.(null);
  }, [isOpen, onPreview]);

  const filteredImages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return COVER_IMAGES.filter((img) => {
      const okCat = activeCategory === "all" || img.category === activeCategory;
      const okSearch = !q || img.name.toLowerCase().includes(q);
      return okCat && okSearch;
    });
  }, [activeCategory, searchQuery]);

  const pick = (img) => {
    setSelectedId(img.id);
    onPreview?.(img.url);
    preloadImage(getFullCoverUrl(img.url));
  };

  const randomPick = () => {
    const pool =
      activeCategory === "all"
        ? COVER_IMAGES
        : COVER_IMAGES.filter((i) => i.category === activeCategory);

    const img = pool[Math.floor(Math.random() * pool.length)];
    if (img) pick(img);
  };

  const save = async () => {
    try {
      setIsSaving(true);
      await onSelect?.(selectedId);
      onPreview?.(null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const onBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const selectedMeta = COVER_IMAGES.find((i) => i.id === selectedId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={onBackdropMouseDown}
    >
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        {/* Header (sticky) */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Select cover
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Pick a cover and preview it instantly. Save to apply.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search covers…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={randomPick}
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Sparkles className="h-4 w-4" />
              <span>Random</span>
            </button>
          </div>

          {/* Category pills */}
          <div className="mt-3 flex w-full gap-2 overflow-x-auto pb-1">
            {COVER_CATEGORIES.map((c) => (
              <CategoryPill
                key={c.id}
                active={activeCategory === c.id}
                label={c.label}
                onClick={() => setActiveCategory(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {filteredImages.length === 0 ? (
            <div className="grid h-full place-items-center">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-800">
                  No images found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try another keyword or category.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredImages.map((img) => {
                const active = selectedId === img.id;

                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => pick(img)}
                    onMouseEnter={() => preloadImage(getFullCoverUrl(img.url))}
                    aria-label={`Choose ${img.name}`}
                    className={[
                      "group relative overflow-hidden rounded-2xl text-left",
                      "border bg-white shadow-sm transition",
                      active
                        ? "border-indigo-600 ring-2 ring-indigo-200"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    ].join(" ")}
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getThumbCoverUrl(img.url)}
                        alt={img.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3">
                      <p className="truncate text-xs font-semibold text-white">
                        {img.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-white/70">
                        {img.category}
                      </p>
                    </div>

                    {active && (
                      <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-1 text-white shadow">
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold">Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer (sticky) */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {selectedMeta ? selectedMeta.name : "No cover selected"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {selectedMeta
                ? `Category: ${selectedMeta.category}`
                : "Choose one from the grid"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Cancel
            </button>

            <button
              onClick={save}
              type="button"
              disabled={isSaving}
              className={[
                "rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition",
                "bg-indigo-600 hover:bg-indigo-700",
                "disabled:cursor-not-allowed disabled:opacity-70",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              ].join(" ")}
            >
              {isSaving ? "Applying…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverSelector;
