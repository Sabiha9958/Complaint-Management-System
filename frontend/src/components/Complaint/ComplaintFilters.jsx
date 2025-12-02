/**
 * ================================================================
 * 🔍 COMPLAINT FILTERS COMPONENT
 * ================================================================
 * Advanced filtering interface with:
 * - Search functionality
 * - Status/Category/Priority filters
 * - Active filter indicators
 * - Reset functionality
 * - Responsive design
 * ================================================================
 */

import React, { useMemo } from "react";
import { FiSearch, FiX, FiFilter } from "react-icons/fi";
import {
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  COMPLAINT_CATEGORY,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
} from "../../utils/constants";

// ================================================================
// 🛠️ UTILITY FUNCTIONS
// ================================================================

/**
 * Count active filters
 */
const countActiveFilters = (filters) => {
  let count = 0;
  if (filters.search) count++;
  if (filters.status) count++;
  if (filters.category) count++;
  if (filters.priority) count++;
  return count;
};

// ================================================================
// 🎨 SUB-COMPONENTS
// ================================================================

/**
 * Filter Select Component
 */
const FilterSelect = ({
  label,
  name,
  value,
  options,
  onChange,
  placeholder,
}) => {
  const hasValue = Boolean(value);

  return (
    <div className="relative">
      <label
        htmlFor={name}
        className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white transition-all ${
          hasValue
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        <option value="">{placeholder || `All ${label}`}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasValue && (
        <div className="absolute right-3 top-9 pointer-events-none">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
};

/**
 * Search Input Component
 */
const SearchInput = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <label
        htmlFor="search"
        className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2"
      >
        Search
      </label>
      <div className="relative">
        <FiSearch
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="search"
          type="search"
          name="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder || "Search complaints..."}
          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${
            value
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          aria-label="Search complaints"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange({ target: { name: "search", value: "" } })}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Active Filter Badge
 */
const ActiveFilterBadge = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border-2 border-blue-200">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
      aria-label={`Remove ${label} filter`}
    >
      <FiX className="w-3 h-3" />
    </button>
  </span>
);

// ================================================================
// 🚀 MAIN COMPONENT
// ================================================================

const ComplaintFilters = ({ filters, setFilters, className = "" }) => {
  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters]
  );

  const statusOptions = useMemo(
    () =>
      Object.values(COMPLAINT_STATUS).map((status) => ({
        value: status,
        label: STATUS_LABELS[status],
      })),
    []
  );

  const categoryOptions = useMemo(
    () =>
      Object.values(COMPLAINT_CATEGORY).map((category) => ({
        value: category,
        label: CATEGORY_LABELS[category],
      })),
    []
  );

  const priorityOptions = useMemo(
    () =>
      Object.values(COMPLAINT_PRIORITY).map((priority) => ({
        value: priority,
        label: PRIORITY_LABELS[priority],
      })),
    []
  );

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ status: "", category: "", priority: "", search: "" });
  };

  const removeFilter = (filterName) => {
    setFilters((prev) => ({ ...prev, [filterName]: "" }));
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section
      aria-labelledby="filter-heading"
      className={`bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <FiFilter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3
              id="filter-heading"
              className="text-lg font-black text-gray-900"
            >
              Filter Complaints
            </h3>
            {activeFilterCount > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {activeFilterCount} active filter
                {activeFilterCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            aria-label="Reset all filters"
          >
            <FiX className="w-4 h-4" />
            Reset All
          </button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search */}
        <SearchInput
          value={filters.search}
          onChange={handleChange}
          placeholder="Search by title, description..."
        />

        {/* Status */}
        <FilterSelect
          label="Status"
          name="status"
          value={filters.status}
          options={statusOptions}
          onChange={handleChange}
          placeholder="All Statuses"
        />

        {/* Category */}
        <FilterSelect
          label="Category"
          name="category"
          value={filters.category}
          options={categoryOptions}
          onChange={handleChange}
          placeholder="All Categories"
        />

        {/* Priority */}
        <FilterSelect
          label="Priority"
          name="priority"
          value={filters.priority}
          options={priorityOptions}
          onChange={handleChange}
          placeholder="All Priorities"
        />
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-6 pt-6 border-t-2 border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Active Filters:
            </span>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <ActiveFilterBadge
                  label={`Search: "${filters.search}"`}
                  onRemove={() => removeFilter("search")}
                />
              )}
              {filters.status && (
                <ActiveFilterBadge
                  label={`Status: ${STATUS_LABELS[filters.status]}`}
                  onRemove={() => removeFilter("status")}
                />
              )}
              {filters.category && (
                <ActiveFilterBadge
                  label={`Category: ${CATEGORY_LABELS[filters.category]}`}
                  onRemove={() => removeFilter("category")}
                />
              )}
              {filters.priority && (
                <ActiveFilterBadge
                  label={`Priority: ${PRIORITY_LABELS[filters.priority]}`}
                  onRemove={() => removeFilter("priority")}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ComplaintFilters;

/**
 * ================================================================
 * 📖 USAGE EXAMPLE
 * ================================================================
 *
 * import ComplaintFilters from './ComplaintFilters';
 *
 * const ComplaintsPage = () => {
 *   const [filters, setFilters] = useState({
 *     search: '',
 *     status: '',
 *     category: '',
 *     priority: '',
 *   });
 *
 *   return (
 *     <ComplaintFilters
 *       filters={filters}
 *       setFilters={setFilters}
 *     />
 *   );
 * };
 * ================================================================
 */
