import React from "react";
import {
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiFileText,
} from "react-icons/fi";
import { STATUS_COLORS, PRIORITY_COLORS } from "../../utils/constants";

const ComplaintDetails = ({ complaint, history }) => {
  // Format date with time
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {complaint.title}
            </h1>
            <p className="text-sm text-gray-500">ID: {complaint.complaintId}</p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <FiCalendar className="h-4 w-4" />
            <span>
              Category: <strong>{complaint.category}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <FiClock className="h-4 w-4" />
            <span>Created: {formatDate(complaint.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
          <FiFileText className="h-5 w-5" />
          <span>Description</span>
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap">
          {complaint.description}
        </p>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Contact Information
        </h2>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-700">
            <FiUser className="h-4 w-4" />
            <span>{complaint.contactInfo?.name}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-700">
            <FiMail className="h-4 w-4" />
            <span>{complaint.contactInfo?.email}</span>
          </div>
          {complaint.contactInfo?.phone && (
            <div className="flex items-center space-x-2 text-gray-700">
              <FiPhone className="h-4 w-4" />
              <span>{complaint.contactInfo.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Assigned To Section */}
      {complaint.assignedTo && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Assigned To
          </h2>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <FiUser className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {complaint.assignedTo.name}
              </p>
              <p className="text-sm text-gray-600">
                {complaint.assignedTo.email}
              </p>
              {complaint.assignedTo.department && (
                <p className="text-xs text-gray-500">
                  {complaint.assignedTo.department}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolution Notes Section */}
      {complaint.resolutionNotes && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-3">
            Resolution Notes
          </h2>
          <p className="text-gray-700">{complaint.resolutionNotes}</p>
          {complaint.resolvedAt && (
            <p className="text-sm text-gray-600 mt-2">
              Resolved on: {formatDate(complaint.resolvedAt)}
            </p>
          )}
        </div>
      )}

      {/* Status History Section */}
      {history && history.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Activity History
          </h2>
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={item._id} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="bg-blue-600 rounded-full h-3 w-3"></div>
                  {index !== history.length - 1 && (
                    <div className="w-0.5 bg-gray-300 h-full"></div>
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-800">
                      {item.previousStatus} → {item.newStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    by {item.changedBy?.name || "System"}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;
