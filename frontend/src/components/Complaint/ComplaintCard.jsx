import React from "react";
import { Link } from "react-router-dom";
import { FiClock, FiUser, FiTag } from "react-icons/fi";
import { STATUS_COLORS, PRIORITY_COLORS } from "../../utils/constants";

const ComplaintCard = ({ complaint }) => {
  // Format date to readable format
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Link to={`/complaint/${complaint._id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl cursor-pointer transition-all duration-200 border border-gray-100">
        {/* Title and Description */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
              {complaint.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Status, Priority, Category Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              STATUS_COLORS[complaint.status]
            }`}
          >
            {complaint.status}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              PRIORITY_COLORS[complaint.priority]
            }`}
          >
            {complaint.priority}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {complaint.category}
          </span>
        </div>

        {/* Footer with Date and Contact */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
          <div className="flex items-center space-x-1">
            <FiClock className="h-4 w-4" />
            <span>{formatDate(complaint.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiUser className="h-4 w-4" />
            <span>{complaint.contactInfo?.name || "Anonymous"}</span>
          </div>
        </div>

        {/* Assigned To (if exists) */}
        {complaint.assignedTo && (
          <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
            <FiTag className="h-3 w-3" />
            <span>Assigned to: {complaint.assignedTo.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ComplaintCard;
