/**
 * ================================================================
 * 🎯 APPLICATION CONSTANTS - Central configuration
 * ================================================================
 */

// ============================================================================
// COMPLAINT STATUS
// ============================================================================

export const COMPLAINT_STATUS = Object.freeze({
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  REJECTED: "rejected",
  CLOSED: "closed",
});

export const STATUS_LABELS = Object.freeze({
  pending: "Pending Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
  closed: "Closed",
});

export const STATUS_STYLES = Object.freeze({
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-300",
    icon: "clock",
  },
  in_progress: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
    icon: "activity",
  },
  resolved: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
    icon: "check-circle",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    icon: "x-circle",
  },
  closed: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
    icon: "archive",
  },
});

export const STATUS_OPTIONS = Object.freeze(
  Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
);

// ============================================================================
// COMPLAINT PRIORITY
// ============================================================================

export const COMPLAINT_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
});

export const PRIORITY_LABELS = Object.freeze({
  low: "Low Priority",
  medium: "Medium Priority",
  high: "High Priority",
  urgent: "Urgent",
});

export const PRIORITY_STYLES = Object.freeze({
  low: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
  },
  medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-300",
  },
  high: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-300",
  },
  urgent: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
  },
});

export const PRIORITY_ORDER = Object.freeze({
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
});

export const PRIORITY_OPTIONS = Object.freeze(
  Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))
);

// ============================================================================
// COMPLAINT CATEGORIES
// ============================================================================

export const COMPLAINT_CATEGORY = Object.freeze({
  TECHNICAL: "technical",
  BILLING: "billing",
  SERVICE: "service",
  PRODUCT: "product",
  HARASSMENT: "harassment",
  SAFETY: "safety",
  OTHER: "other",
});

export const CATEGORY_LABELS = Object.freeze({
  technical: "Technical Issue",
  billing: "Billing & Payment",
  service: "Service Quality",
  product: "Product Issue",
  harassment: "Harassment",
  safety: "Safety Concern",
  other: "Other",
});

export const CATEGORY_ICONS = Object.freeze({
  technical: "monitor",
  billing: "dollar-sign",
  service: "users",
  product: "package",
  harassment: "alert-triangle",
  safety: "shield",
  other: "more-horizontal",
});

export const CATEGORY_OPTIONS = Object.freeze(
  Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
);

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLE = Object.freeze({
  ADMIN: "admin",
  STAFF: "staff",
  USER: "user",
});

export const ROLE_LABELS = Object.freeze({
  admin: "Administrator",
  staff: "Staff Member",
  user: "User",
});

export const ROLE_PERMISSIONS = Object.freeze({
  admin: {
    canViewAll: true,
    canEdit: true,
    canDelete: true,
    canAssign: true,
    canExport: true,
    canManageUsers: true,
    canManageSettings: true,
  },
  staff: {
    canViewAll: true,
    canEdit: true,
    canDelete: false,
    canAssign: true,
    canExport: true,
    canManageUsers: false,
    canManageSettings: false,
  },
  user: {
    canViewAll: false,
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canExport: false,
    canManageUsers: false,
    canManageSettings: false,
  },
});

export const ROLE_OPTIONS = Object.freeze(
  Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))
);

export const DASHBOARD_ROUTES = Object.freeze({
  admin: "/admin/dashboard",
  staff: "/staff/dashboard",
  user: "/dashboard",
});

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================

// File type categories
export const FILE_TYPES = Object.freeze({
  IMAGE: "image",
  DOCUMENT: "document",
  AVATAR: "avatar",
  COVER: "cover",
  ATTACHMENT: "attachment",
});

// Base image config
export const IMAGE_CONFIG = Object.freeze({
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
});

// Higher-level image upload presets (avatar + cover)
export const IMAGE_UPLOAD = Object.freeze({
  AVATAR: {
    MAX_SIZE_MB: 5,
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
    DIMENSIONS: { width: 400, height: 400 },
  },
  COVER: {
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
    DIMENSIONS: { width: 1920, height: 480 },
  },
});

// Document config
export const DOCUMENT_CONFIG = Object.freeze({
  ALLOWED_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
  ALLOWED_EXTENSIONS: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"],
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
});

// Avatar upload configuration
export const AVATAR_CONFIG = Object.freeze({
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  RECOMMENDED_DIMENSIONS: { width: 400, height: 400 },
  MIN_DIMENSIONS: { width: 100, height: 100 },
  MAX_DIMENSIONS: { width: 2000, height: 2000 },
});

// Cover image configuration
export const COVER_CONFIG = Object.freeze({
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  RECOMMENDED_DIMENSIONS: { width: 1920, height: 480 },
  MIN_DIMENSIONS: { width: 800, height: 200 },
  MAX_DIMENSIONS: { width: 3840, height: 1080 },
});

// Complaint attachment configuration
export const ATTACHMENT_CONFIG = Object.freeze({
  ALLOWED_TYPES: [
    ...IMAGE_CONFIG.ALLOWED_TYPES,
    ...DOCUMENT_CONFIG.ALLOWED_TYPES,
  ],
  ALLOWED_EXTENSIONS: [
    ...IMAGE_CONFIG.ALLOWED_EXTENSIONS,
    ...DOCUMENT_CONFIG.ALLOWED_EXTENSIONS,
  ],
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_FILES: 10,
  TOTAL_MAX_SIZE_MB: 50,
  TOTAL_MAX_SIZE_BYTES: 50 * 1024 * 1024,
});

// Backwards-compatible alias for general file uploads (complaint form, etc.)
export const FILE_UPLOAD = Object.freeze({
  ...ATTACHMENT_CONFIG,
});

// Grouped upload config for easier imports
export const UPLOAD_CONFIG = Object.freeze({
  AVATAR: AVATAR_CONFIG,
  COVER: COVER_CONFIG,
  ATTACHMENT: ATTACHMENT_CONFIG,
});

// File type labels for UI
export const FILE_TYPE_LABELS = Object.freeze({
  "image/jpeg": "JPEG Image",
  "image/jpg": "JPG Image",
  "image/png": "PNG Image",
  "image/webp": "WebP Image",
  "image/gif": "GIF Image",
  "application/pdf": "PDF Document",
  "application/msword": "Word Document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word Document",
  "application/vnd.ms-excel": "Excel Spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "Excel Spreadsheet",
  "text/plain": "Text File",
});

// File type icons
export const FILE_TYPE_ICONS = Object.freeze({
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "application/pdf": "file-text",
  "application/msword": "file-text",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "file-text",
  "application/vnd.ms-excel": "file-spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "file-spreadsheet",
  "text/plain": "file",
});

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
});

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = Object.freeze({
  DISPLAY: "MMM DD, YYYY",
  DISPLAY_WITH_TIME: "MMM DD, YYYY hh:mm A",
  ISO: "YYYY-MM-DD",
  SHORT: "MM/DD/YYYY",
  LONG: "MMMM DD, YYYY",
});

// ============================================================================
// THEME
// ============================================================================

export const THEME = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
});

export const THEME_COLORS = Object.freeze({
  PRIMARY: "#3B82F6",
  SECONDARY: "#6366F1",
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",
  INFO: "#3B82F6",
});

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_TIMEOUTS = Object.freeze({
  DEFAULT: 30000,
  UPLOAD: 120000,
  DOWNLOAD: 180000,
});

export const API_RETRY = Object.freeze({
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
});

// ============================================================================
// NOTIFICATION
// ============================================================================

export const NOTIFICATION_TYPE = Object.freeze({
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
});

export const TOAST_CONFIG = Object.freeze({
  POSITION: "top-right",
  AUTO_CLOSE: 3000,
  HIDE_PROGRESS_BAR: false,
  CLOSE_ON_CLICK: true,
  PAUSE_ON_HOVER: true,
  DRAGGABLE: true,
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getStatusStyle = (status) => {
  return STATUS_STYLES[status] || STATUS_STYLES.pending;
};

export const getPriorityStyle = (priority) => {
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;
};

export const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.[permission] || false;
};

export const getDashboardRoute = (role) => {
  return DASHBOARD_ROUTES[role] || DASHBOARD_ROUTES.user;
};

// Single file validation
export const validateFile = (file, config) => {
  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  if (file.size > config.MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${config.MAX_SIZE_MB}MB limit`,
    };
  }

  if (!config.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${config.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
};

// Multiple files validation
export const validateFiles = (files, config) => {
  if (!files || files.length === 0) {
    return { valid: false, error: "No files selected" };
  }

  if (config.MAX_FILES && files.length > config.MAX_FILES) {
    return {
      valid: false,
      error: `Maximum ${config.MAX_FILES} files allowed`,
    };
  }

  const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);

  if (config.TOTAL_MAX_SIZE_BYTES && totalSize > config.TOTAL_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Total file size exceeds ${config.TOTAL_MAX_SIZE_MB}MB limit`,
    };
  }

  const invalidFiles = Array.from(files).filter(
    (file) => !config.ALLOWED_TYPES.includes(file.type)
  );

  if (invalidFiles.length > 0) {
    return {
      valid: false,
      error: `Invalid file types. Allowed: ${config.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
};

// Convenience aliases for consistency in components
export const validateFileUpload = (file, config) => validateFile(file, config);

export const validateFilesUpload = (files, config) =>
  validateFiles(files, config);

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Get file icon
export const getFileIcon = (mimeType) => {
  return FILE_TYPE_ICONS[mimeType] || "file";
};

// Get file type label
export const getFileTypeLabel = (mimeType) => {
  return FILE_TYPE_LABELS[mimeType] || "Unknown File";
};

// Check if file is image
export const isImageFile = (file) => file.type.startsWith("image/");

// Check if file is document
export const isDocumentFile = (file) =>
  DOCUMENT_CONFIG.ALLOWED_TYPES.includes(file.type);

// Get file extension
export const getFileExtension = (filename) =>
  filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);

// Validate image dimensions
export const validateImageDimensions = (file, config) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      const { MIN_DIMENSIONS, MAX_DIMENSIONS } = config;

      if (width < MIN_DIMENSIONS.width || height < MIN_DIMENSIONS.height) {
        resolve({
          valid: false,
          error: `Image must be at least ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}px`,
        });
      } else if (
        width > MAX_DIMENSIONS.width ||
        height > MAX_DIMENSIONS.height
      ) {
        resolve({
          valid: false,
          error: `Image must not exceed ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}px`,
        });
      } else {
        resolve({ valid: true, dimensions: { width, height } });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: "Invalid image file" });
    };

    img.src = url;
  });

// ============================================================================
// DEFAULT EXPORT (for optional bulk imports)
// ============================================================================

export default {
  COMPLAINT_STATUS,
  STATUS_LABELS,
  STATUS_STYLES,
  STATUS_OPTIONS,
  COMPLAINT_PRIORITY,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  PRIORITY_OPTIONS,
  COMPLAINT_CATEGORY,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  USER_ROLE,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROLE_OPTIONS,
  DASHBOARD_ROUTES,
  FILE_TYPES,
  IMAGE_CONFIG,
  IMAGE_UPLOAD,
  DOCUMENT_CONFIG,
  AVATAR_CONFIG,
  COVER_CONFIG,
  ATTACHMENT_CONFIG,
  FILE_UPLOAD,
  UPLOAD_CONFIG,
  FILE_TYPE_LABELS,
  FILE_TYPE_ICONS,
  PAGINATION,
  DATE_FORMATS,
  THEME,
  THEME_COLORS,
  API_TIMEOUTS,
  API_RETRY,
  NOTIFICATION_TYPE,
  TOAST_CONFIG,
  getStatusStyle,
  getPriorityStyle,
  hasPermission,
  getDashboardRoute,
  validateFile,
  validateFiles,
  validateFileUpload,
  validateFilesUpload,
  formatFileSize,
  getFileIcon,
  getFileTypeLabel,
  isImageFile,
  isDocumentFile,
  getFileExtension,
  validateImageDimensions,
};
