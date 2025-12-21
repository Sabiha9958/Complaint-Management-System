import React, {
  memo,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  Tag,
  AlertCircle,
  LayoutGrid,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  COMPLAINT_CATEGORY,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
} from "../../utils/constants";

const cn = (...inputs) => twMerge(clsx(inputs));
const normalize = (str) =>
  String(str || "")
    .toLowerCase()
    .trim();

// Custom debounce hook for better performance
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const FilterSelect = memo(
  ({
    label,
    value,
    options,
    onChange,
    icon: Icon,
    placeholder = "Select...",
  }) => {
    return (
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon className="w-4 h-4" />
        </div>

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-11 pl-10 pr-10 appearance-none outline-none text-sm font-medium rounded-xl border transition-all cursor-pointer bg-slate-50",
            value
              ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 shadow-sm"
              : "border-slate-200 text-slate-600 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>

        <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all group-focus-within:text-indigo-500">
          {label}
        </label>
      </div>
    );
  }
);

const FilterPill = memo(({ label, value, onRemove }) => (
  <button
    onClick={onRemove}
    className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
  >
    <span className="font-semibold text-slate-400 group-hover:text-rose-400">
      {label}:
    </span>
    <span className="font-bold">{value}</span>
    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 group-hover:bg-rose-200 text-slate-400 group-hover:text-rose-600 transition-colors">
      <X className="w-2.5 h-2.5" />
    </div>
  </button>
));

const ComplaintFilters = memo(
  ({ value = {}, onChange, className, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [localSearch, setLocalSearch] = useState(value.search || "");

    const debouncedSearch = useDebounce(localSearch, 400);

    // Memoized options with better safety
    const options = useMemo(() => {
      const mapOptions = (src, labels) =>
        Object.values(src || {}).map((val) => ({
          value: normalize(val),
          label: labels?.[normalize(val)] || val,
        }));

      return {
        status: mapOptions(COMPLAINT_STATUS, STATUS_LABELS),
        priority: mapOptions(COMPLAINT_PRIORITY, PRIORITY_LABELS),
        category: mapOptions(COMPLAINT_CATEGORY, CATEGORY_LABELS),
      };
    }, []);

    // Sync debounced search with parent
    useEffect(() => {
      if (debouncedSearch !== (value.search || "")) {
        onChange({ ...value, search: debouncedSearch });
      }
    }, [debouncedSearch, value, onChange]);

    // Sync external search changes
    useEffect(() => {
      if (value.search !== localSearch) {
        setLocalSearch(value.search || "");
      }
    }, [value.search]);

    const updateFilter = useCallback(
      (key, val) => {
        onChange({ ...value, [key]: val });
      },
      [value, onChange]
    );

    const clearFilters = useCallback(() => {
      setLocalSearch("");
      onChange({ search: "", status: "", category: "", priority: "" });
    }, [onChange]);

    const activeFiltersCount = useMemo(
      () =>
        [value.status, value.category, value.priority].filter(Boolean).length,
      [value.status, value.category, value.priority]
    );

    const hasActiveFilters = activeFiltersCount > 0 || !!localSearch;

    const filterPills = useMemo(
      () => [
        { key: "status", label: "Status", dict: STATUS_LABELS },
        { key: "priority", label: "Priority", dict: PRIORITY_LABELS },
        { key: "category", label: "Category", dict: CATEGORY_LABELS },
      ],
      []
    );

    return (
      <div className={cn("w-full space-y-4", className)}>
        {/* Search & Toggle Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by ID, title, or description..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch("")}
                className="absolute inset-y-0 right-2 flex items-center justify-center px-2 text-slate-400 hover:text-slate-600"
              >
                <div className="p-1 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-3 h-3" />
                </div>
              </button>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center justify-center gap-2 px-5 h-11 rounded-xl border text-sm font-bold transition-all whitespace-nowrap shadow-sm active:scale-95",
              isOpen || activeFiltersCount > 0
                ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-indigo-500 text-white text-[10px] rounded-full ml-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Grid */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out overflow-hidden",
            isOpen
              ? "grid-rows-[1fr] opacity-100 pb-2"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="min-h-0 grid grid-cols-1 sm:grid-cols-3 gap-4 p-1">
            <FilterSelect
              label="Current Status"
              placeholder="Any Status"
              value={value.status || ""}
              options={options.status}
              onChange={(v) => updateFilter("status", v)}
              icon={LayoutGrid}
            />
            <FilterSelect
              label="Priority Level"
              placeholder="Any Priority"
              value={value.priority || ""}
              options={options.priority}
              onChange={(v) => updateFilter("priority", v)}
              icon={AlertCircle}
            />
            <FilterSelect
              label="Category"
              placeholder="All Categories"
              value={normalize(value.category) || ""}
              options={options.category}
              onChange={(v) => updateFilter("category", v)}
              icon={Tag}
            />
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
              <Filter className="w-3 h-3" /> Active:
            </div>

            {localSearch && (
              <FilterPill
                label="Search"
                value={localSearch}
                onRemove={() => setLocalSearch("")}
              />
            )}

            {filterPills.map(({ key, label, dict }) => {
              const val = value[key];
              if (!val) return null;
              return (
                <FilterPill
                  key={key}
                  label={label}
                  value={dict?.[normalize(val)] || val}
                  onRemove={() => updateFilter(key, "")}
                />
              );
            })}

            <button
              onClick={clearFilters}
              className="ml-auto text-xs font-bold text-slate-500 hover:text-rose-600 hover:underline decoration-2 underline-offset-4 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    );
  }
);

ComplaintFilters.displayName = "ComplaintFilters";

export default ComplaintFilters;
