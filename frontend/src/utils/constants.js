// Complaint Status Options
export const COMPLAINT_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  CLOSED: "Closed",
};

// Complaint Priority Levels
export const COMPLAINT_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

// Complaint Categories
export const COMPLAINT_CATEGORIES = [
  "Infrastructure",
  "Academic",
  "Hostel",
  "Transport",
  "Canteen",
  "Library",
  "Other",
];

// Status Badge Colors
export const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Resolved: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
  Closed: "bg-gray-100 text-gray-800 border-gray-200",
};

// Priority Badge Colors
export const PRIORITY_COLORS = {
  Low: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Critical: "bg-red-100 text-red-800 border-red-200",
};
