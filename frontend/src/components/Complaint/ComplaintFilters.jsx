import React from "react";
import { FiSearch } from "react-icons/fi";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
} from "../../utils/constants";

const ComplaintFilters = ({ filters, setFilters }) => {
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  // Reset all filters
  const handleReset = () => {
    setFilters({
      status: "",
      category: "",
      priority: "",
      search: "",
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Filter Complaints
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search complaints..."
            className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Status Filter */}
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Status</option>
          {Object.values(COMPLAINT_STATUS).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Categories</option>
          {COMPLAINT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          name="priority"
          value={filters.priority}
          onChange={handleFilterChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Priorities</option>
          {Object.values(COMPLAINT_PRIORITY).map((pri) => (
            <option key={pri} value={pri}>
              {pri}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default ComplaintFilters;
