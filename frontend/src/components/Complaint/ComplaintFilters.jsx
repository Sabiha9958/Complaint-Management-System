import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiSearch,
  FiX,
} from "react-icons/fi";
import {
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  COMPLAINT_CATEGORY,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
} from "../../utils/constants";

const cx = (...c) => c.filter(Boolean).join(" ");

const buildOptions = (enumObj, labels) =>
  Object.values(enumObj).map((value) => ({
    value,
    label: labels?.[value] || value,
  }));

const countActive = (v) =>
  Number(Boolean(v.search?.trim())) +
  Number(Boolean(v.status)) +
  Number(Boolean(v.category)) +
  Number(Boolean(v.priority));

const Chip = memo(function Chip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-1 hover:bg-blue-100"
        aria-label="Remove filter"
      >
        <FiX className="h-3.5 w-3.5" />
      </button>
    </span>
  );
});

const FieldLabel = memo(function FieldLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-gray-600"
    >
      {children}
    </label>
  );
});

const SelectField = memo(function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
}) {
  const has = Boolean(value);

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cx(
            "w-full appearance-none rounded-2xl border-2 px-4 py-3 text-sm font-semibold outline-none transition",
            "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
            has
              ? "border-blue-400 bg-blue-50/50"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
          aria-label={`Filter by ${label}`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {has ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-500 hover:bg-gray-100"
            aria-label={`Clear ${label}`}
          >
            <FiX className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
});

const SearchField = memo(function SearchField({
  value,
  onChange,
  placeholder = "Search by title, description…",
}) {
  const has = Boolean(value?.trim());

  return (
    <div>
      <FieldLabel htmlFor="complaint-search">Search</FieldLabel>
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          id="complaint-search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cx(
            "w-full rounded-2xl border-2 py-3 pl-12 pr-12 text-sm font-semibold outline-none transition",
            "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
            has
              ? "border-blue-400 bg-blue-50/50"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
          type="search"
          aria-label="Search complaints"
          autoComplete="off"
        />
        {has ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Clear search"
          >
            <FiX className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
});

function ComplaintFilters({
  value,
  onChange,
  className = "",
  debounceMs = 350,
  showActiveChips = true,
  defaultOpen = true,
  open, // optional controlled
  onOpenChange, // optional controlled
}) {
  const activeCount = useMemo(() => countActive(value), [value]);

  const statusOptions = useMemo(
    () => buildOptions(COMPLAINT_STATUS, STATUS_LABELS),
    []
  );
  const categoryOptions = useMemo(
    () => buildOptions(COMPLAINT_CATEGORY, CATEGORY_LABELS),
    []
  );
  const priorityOptions = useMemo(
    () => buildOptions(COMPLAINT_PRIORITY, PRIORITY_LABELS),
    []
  );

  const isControlled = typeof open === "boolean";
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = (next) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const clearAll = () =>
    onChange({ search: "", status: "", category: "", priority: "" });

  // Debounced search
  const [searchDraft, setSearchDraft] = useState(value.search || "");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) return;
    setSearchDraft(value.search || "");
  }, [value.search]);

  useEffect(() => {
    first.current = false;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((value.search || "") !== searchDraft)
        onChange({ ...value, search: searchDraft });
    }, debounceMs);
    return () => clearTimeout(t);
  }, [searchDraft, debounceMs, onChange, value]);

  const set = (key) => (next) => onChange({ ...value, [key]: next });

  return (
    <section
      aria-label="Complaint filters"
      className={cx(
        "rounded-3xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5",
        className
      )}
    >
      <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setOpen(!isOpen)}
          className="flex items-center gap-3 text-left"
          aria-expanded={isOpen}
          aria-controls="filters-body"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <FiFilter className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-gray-900">Filters</h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-extrabold text-gray-600">
                {activeCount}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-gray-500">
              {activeCount ? `${activeCount} active` : "No filters applied"}
            </p>
          </div>

          <span className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-extrabold text-gray-700 hover:bg-gray-50">
            {isOpen ? "Hide" : "Show"}
            {isOpen ? (
              <FiChevronUp className="h-4 w-4" />
            ) : (
              <FiChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={clearAll}
            disabled={!activeCount}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
              activeCount
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            )}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      </div>

      <div id="filters-body" className={cx("px-6 py-6", !isOpen && "hidden")}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <SearchField value={searchDraft} onChange={setSearchDraft} />

          <SelectField
            id="filter-status"
            label="Status"
            value={value.status}
            options={statusOptions}
            onChange={set("status")}
            placeholder="All statuses"
          />

          <SelectField
            id="filter-category"
            label="Category"
            value={value.category}
            options={categoryOptions}
            onChange={set("category")}
            placeholder="All categories"
          />

          <SelectField
            id="filter-priority"
            label="Priority"
            value={value.priority}
            options={priorityOptions}
            onChange={set("priority")}
            placeholder="All priorities"
          />
        </div>

        {showActiveChips && activeCount ? (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              {value.search?.trim() ? (
                <Chip onRemove={() => onChange({ ...value, search: "" })}>
                  Search: “{value.search.trim()}”
                </Chip>
              ) : null}

              {value.status ? (
                <Chip onRemove={() => onChange({ ...value, status: "" })}>
                  Status: {STATUS_LABELS?.[value.status] || value.status}
                </Chip>
              ) : null}

              {value.category ? (
                <Chip onRemove={() => onChange({ ...value, category: "" })}>
                  Category:{" "}
                  {CATEGORY_LABELS?.[value.category] || value.category}
                </Chip>
              ) : null}

              {value.priority ? (
                <Chip onRemove={() => onChange({ ...value, priority: "" })}>
                  Priority:{" "}
                  {PRIORITY_LABELS?.[value.priority] || value.priority}
                </Chip>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default memo(ComplaintFilters);
