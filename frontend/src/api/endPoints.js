/**
 * ================================================================
 * 🌐 API ENDPOINTS CONFIGURATION
 * ================================================================
 * Centralized API endpoint definitions for the application.
 * Provides type-safe, organized access to all API routes.
 *
 * Usage:
 *   import { API_ENDPOINTS } from './config/apiEndpoints';
 *   const url = API_ENDPOINTS.AUTH.LOGIN;
 *   const userUrl = API_ENDPOINTS.USERS.GET_BY_ID('123');
 * ================================================================
 */

// ================================================================
// 📋 BASE PATHS
// ================================================================

const BASE_PATHS = {
  AUTH: "/auth",
  USERS: "/users",
  COMPLAINTS: "/complaints",
  REPORTS: "/reports",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
  STAFF: "/staff",
  FILES: "/files",
  NOTIFICATIONS: "/notifications",
  SETTINGS: "/settings",
};

// ================================================================
// 🔐 AUTHENTICATION ENDPOINTS
// ================================================================

export const AUTH_ENDPOINTS = {
  // Basic Auth
  LOGIN: `${BASE_PATHS.AUTH}/login`,
  REGISTER: `${BASE_PATHS.AUTH}/register`,
  LOGOUT: `${BASE_PATHS.AUTH}/logout`,
  REFRESH_TOKEN: `${BASE_PATHS.AUTH}/refresh`,

  // Profile Management
  ME: `${BASE_PATHS.AUTH}/me`,
  UPDATE_ME: `${BASE_PATHS.AUTH}/me`,
  DELETE_ME: `${BASE_PATHS.AUTH}/me`,

  // Avatar & Cover Images
  AVATAR: {
    UPLOAD: `${BASE_PATHS.AUTH}/me/avatar`,
    DELETE: `${BASE_PATHS.AUTH}/me/avatar`,
  },
  COVER: {
    UPLOAD: `${BASE_PATHS.AUTH}/me/cover`,
    DELETE: `${BASE_PATHS.AUTH}/me/cover`,
  },

  // Password Management
  CHANGE_PASSWORD: `${BASE_PATHS.AUTH}/change-password`,
  FORGOT_PASSWORD: `${BASE_PATHS.AUTH}/forgot-password`,
  RESET_PASSWORD: (token) => `${BASE_PATHS.AUTH}/reset-password/${token}`,
  VERIFY_RESET_TOKEN: (token) => `${BASE_PATHS.AUTH}/verify-token/${token}`,

  // Email Verification
  VERIFY_EMAIL: (token) => `${BASE_PATHS.AUTH}/verify-email/${token}`,
  RESEND_VERIFICATION: `${BASE_PATHS.AUTH}/resend-verification`,

  // OAuth
  GOOGLE_LOGIN: `${BASE_PATHS.AUTH}/google`,
  GOOGLE_CALLBACK: `${BASE_PATHS.AUTH}/google/callback`,

  // Session Management
  ACTIVE_SESSIONS: `${BASE_PATHS.AUTH}/sessions`,
  REVOKE_SESSION: (sessionId) => `${BASE_PATHS.AUTH}/sessions/${sessionId}`,
  REVOKE_ALL_SESSIONS: `${BASE_PATHS.AUTH}/sessions/revoke-all`,

  // Team
  TEAM: `${BASE_PATHS.AUTH}/team`,
};

// ================================================================
// 👥 USER MANAGEMENT ENDPOINTS
// ================================================================

export const USER_ENDPOINTS = {
  // CRUD Operations
  LIST: BASE_PATHS.USERS,
  CREATE: BASE_PATHS.USERS,
  GET_BY_ID: (id) => `${BASE_PATHS.USERS}/${id}`,
  UPDATE: (id) => `${BASE_PATHS.USERS}/${id}`,
  DELETE: (id) => `${BASE_PATHS.USERS}/${id}`,

  // Bulk Operations
  BULK_CREATE: `${BASE_PATHS.USERS}/bulk`,
  BULK_UPDATE: `${BASE_PATHS.USERS}/bulk/update`,
  BULK_DELETE: `${BASE_PATHS.USERS}/bulk/delete`,

  // User Search & Filters
  SEARCH: `${BASE_PATHS.USERS}/search`,
  FILTER: `${BASE_PATHS.USERS}/filter`,

  // User Statistics
  STATS: `${BASE_PATHS.USERS}/stats`,
  ACTIVITY: (id) => `${BASE_PATHS.USERS}/${id}/activity`,

  // User Roles & Permissions
  UPDATE_ROLE: (id) => `${BASE_PATHS.USERS}/${id}/role`,
  GET_PERMISSIONS: (id) => `${BASE_PATHS.USERS}/${id}/permissions`,

  // User Status
  ACTIVATE: (id) => `${BASE_PATHS.USERS}/${id}/activate`,
  DEACTIVATE: (id) => `${BASE_PATHS.USERS}/${id}/deactivate`,
  SUSPEND: (id) => `${BASE_PATHS.USERS}/${id}/suspend`,

  // Export
  EXPORT_CSV: `${BASE_PATHS.USERS}/export/csv`,
  EXPORT_EXCEL: `${BASE_PATHS.USERS}/export/excel`,
  EXPORT_PDF: `${BASE_PATHS.USERS}/export/pdf`,
};

// ================================================================
// 📝 COMPLAINT MANAGEMENT ENDPOINTS
// ================================================================

export const COMPLAINT_ENDPOINTS = {
  // CRUD Operations
  LIST: BASE_PATHS.COMPLAINTS,
  CREATE: BASE_PATHS.COMPLAINTS,
  GET_BY_ID: (id) => `${BASE_PATHS.COMPLAINTS}/${id}`,
  UPDATE: (id) => `${BASE_PATHS.COMPLAINTS}/${id}`,
  DELETE: (id) => `${BASE_PATHS.COMPLAINTS}/${id}`,

  // Status Management
  UPDATE_STATUS: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/status`,
  UPDATE_PRIORITY: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/priority`,
  ASSIGN: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/assign`,
  REASSIGN: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/reassign`,

  // Comments & Communication
  COMMENTS: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/comments`,
  ADD_COMMENT: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/comments`,
  UPDATE_COMMENT: (id, commentId) =>
    `${BASE_PATHS.COMPLAINTS}/${id}/comments/${commentId}`,
  DELETE_COMMENT: (id, commentId) =>
    `${BASE_PATHS.COMPLAINTS}/${id}/comments/${commentId}`,

  // Attachments
  ATTACHMENTS: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/attachments`,
  UPLOAD_ATTACHMENT: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/attachments`,
  DELETE_ATTACHMENT: (id, attachmentId) =>
    `${BASE_PATHS.COMPLAINTS}/${id}/attachments/${attachmentId}`,

  // Activity & History
  HISTORY: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/history`,
  ACTIVITY_LOG: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/activity`,

  // User-Specific
  MY_COMPLAINTS: `${BASE_PATHS.COMPLAINTS}/my`,
  MY_ASSIGNED: `${BASE_PATHS.COMPLAINTS}/assigned`,

  // Statistics & Reports
  STATS: `${BASE_PATHS.COMPLAINTS}/stats`,
  COUNT_BY_STATUS: `${BASE_PATHS.COMPLAINTS}/count/by-status`,
  COUNT_BY_CATEGORY: `${BASE_PATHS.COMPLAINTS}/count/by-category`,
  COUNT_BY_PRIORITY: `${BASE_PATHS.COMPLAINTS}/count/by-priority`,

  // Search & Filter
  SEARCH: `${BASE_PATHS.COMPLAINTS}/search`,
  FILTER: `${BASE_PATHS.COMPLAINTS}/filter`,
  ADVANCED_SEARCH: `${BASE_PATHS.COMPLAINTS}/advanced-search`,

  // Export
  EXPORT_CSV: `${BASE_PATHS.COMPLAINTS}/export/csv`,
  EXPORT_EXCEL: `${BASE_PATHS.COMPLAINTS}/export/excel`,
  EXPORT_PDF: (id) => `${BASE_PATHS.COMPLAINTS}/${id}/export/pdf`,

  // Bulk Operations
  BULK_UPDATE_STATUS: `${BASE_PATHS.COMPLAINTS}/bulk/status`,
  BULK_ASSIGN: `${BASE_PATHS.COMPLAINTS}/bulk/assign`,
  BULK_DELETE: `${BASE_PATHS.COMPLAINTS}/bulk/delete`,
};

// ================================================================
// 📊 REPORTS & ANALYTICS ENDPOINTS
// ================================================================

export const REPORT_ENDPOINTS = {
  // Overview & Summary
  OVERVIEW: `${BASE_PATHS.REPORTS}/overview`,
  SUMMARY: `${BASE_PATHS.REPORTS}/summary`,
  DASHBOARD_STATS: `${BASE_PATHS.REPORTS}/dashboard`,

  // Breakdown Reports
  BY_CATEGORY: `${BASE_PATHS.REPORTS}/by-category`,
  BY_STATUS: `${BASE_PATHS.REPORTS}/by-status`,
  BY_PRIORITY: `${BASE_PATHS.REPORTS}/by-priority`,
  BY_LOCATION: `${BASE_PATHS.REPORTS}/by-location`,
  BY_DEPARTMENT: `${BASE_PATHS.REPORTS}/by-department`,
  BY_USER: `${BASE_PATHS.REPORTS}/by-user`,

  // Time-Based Reports
  TRENDS: `${BASE_PATHS.REPORTS}/trends`,
  DAILY: `${BASE_PATHS.REPORTS}/daily`,
  WEEKLY: `${BASE_PATHS.REPORTS}/weekly`,
  MONTHLY: `${BASE_PATHS.REPORTS}/monthly`,
  QUARTERLY: `${BASE_PATHS.REPORTS}/quarterly`,
  YEARLY: `${BASE_PATHS.REPORTS}/yearly`,

  // Performance Reports
  PERFORMANCE: `${BASE_PATHS.REPORTS}/performance`,
  RESOLUTION_TIME: `${BASE_PATHS.REPORTS}/resolution-time`,
  RESPONSE_TIME: `${BASE_PATHS.REPORTS}/response-time`,
  SLA_COMPLIANCE: `${BASE_PATHS.REPORTS}/sla-compliance`,

  // User Performance
  USER_PERFORMANCE: (userId) => `${BASE_PATHS.REPORTS}/user/${userId}`,
  TEAM_PERFORMANCE: `${BASE_PATHS.REPORTS}/team`,

  // Custom Reports
  CUSTOM: `${BASE_PATHS.REPORTS}/custom`,
  SAVED_REPORTS: `${BASE_PATHS.REPORTS}/saved`,

  // Export
  EXPORT: `${BASE_PATHS.REPORTS}/export`,
  EXPORT_PDF: `${BASE_PATHS.REPORTS}/export/pdf`,
  EXPORT_EXCEL: `${BASE_PATHS.REPORTS}/export/excel`,
  SCHEDULE_REPORT: `${BASE_PATHS.REPORTS}/schedule`,
};

// ================================================================
// 📁 FILE MANAGEMENT ENDPOINTS
// ================================================================

export const FILE_ENDPOINTS = {
  UPLOAD: `${BASE_PATHS.FILES}/upload`,
  UPLOAD_MULTIPLE: `${BASE_PATHS.FILES}/upload/multiple`,
  GET_BY_ID: (id) => `${BASE_PATHS.FILES}/${id}`,
  DELETE: (id) => `${BASE_PATHS.FILES}/${id}`,
  DOWNLOAD: (id) => `${BASE_PATHS.FILES}/${id}/download`,
  GET_SIGNED_URL: (id) => `${BASE_PATHS.FILES}/${id}/signed-url`,
};

// ================================================================
// 🔔 NOTIFICATION ENDPOINTS
// ================================================================

export const NOTIFICATION_ENDPOINTS = {
  LIST: BASE_PATHS.NOTIFICATIONS,
  GET_BY_ID: (id) => `${BASE_PATHS.NOTIFICATIONS}/${id}`,
  MARK_READ: (id) => `${BASE_PATHS.NOTIFICATIONS}/${id}/read`,
  MARK_ALL_READ: `${BASE_PATHS.NOTIFICATIONS}/read-all`,
  DELETE: (id) => `${BASE_PATHS.NOTIFICATIONS}/${id}`,
  DELETE_ALL: `${BASE_PATHS.NOTIFICATIONS}/delete-all`,
  UNREAD_COUNT: `${BASE_PATHS.NOTIFICATIONS}/unread-count`,
  PREFERENCES: `${BASE_PATHS.NOTIFICATIONS}/preferences`,
};

// ================================================================
// ⚙️ SETTINGS ENDPOINTS
// ================================================================

export const SETTINGS_ENDPOINTS = {
  GET_ALL: BASE_PATHS.SETTINGS,
  UPDATE: BASE_PATHS.SETTINGS,
  GET_BY_KEY: (key) => `${BASE_PATHS.SETTINGS}/${key}`,
  UPDATE_BY_KEY: (key) => `${BASE_PATHS.SETTINGS}/${key}`,
  RESET_TO_DEFAULT: `${BASE_PATHS.SETTINGS}/reset`,
};

// ================================================================
// 👔 ADMIN-SPECIFIC ENDPOINTS
// ================================================================

export const ADMIN_ENDPOINTS = {
  DASHBOARD: `${BASE_PATHS.ADMIN}/dashboard`,

  // User Management
  USERS: `${BASE_PATHS.ADMIN}/users`,
  CREATE_USER: `${BASE_PATHS.ADMIN}/users`,
  UPDATE_USER: (id) => `${BASE_PATHS.ADMIN}/users/${id}`,
  DELETE_USER: (id) => `${BASE_PATHS.ADMIN}/users/${id}`,

  // Role Management
  ROLES: `${BASE_PATHS.ADMIN}/roles`,
  CREATE_ROLE: `${BASE_PATHS.ADMIN}/roles`,
  UPDATE_ROLE: (id) => `${BASE_PATHS.ADMIN}/roles/${id}`,
  DELETE_ROLE: (id) => `${BASE_PATHS.ADMIN}/roles/${id}`,

  // System Settings
  SETTINGS: `${BASE_PATHS.ADMIN}/settings`,
  UPDATE_SETTINGS: `${BASE_PATHS.ADMIN}/settings`,

  // System Logs
  LOGS: `${BASE_PATHS.ADMIN}/logs`,
  AUDIT_LOGS: `${BASE_PATHS.ADMIN}/audit-logs`,

  // Reports
  REPORTS: `${BASE_PATHS.ADMIN}/reports`,
  SYSTEM_HEALTH: `${BASE_PATHS.ADMIN}/health`,
};

// ================================================================
// 👨‍💼 STAFF-SPECIFIC ENDPOINTS
// ================================================================

export const STAFF_ENDPOINTS = {
  DASHBOARD: `${BASE_PATHS.STAFF}/dashboard`,
  ASSIGNED_COMPLAINTS: `${BASE_PATHS.STAFF}/complaints`,
  PERFORMANCE: `${BASE_PATHS.STAFF}/performance`,
  WORKLOAD: `${BASE_PATHS.STAFF}/workload`,
};

// ================================================================
// 🎯 UNIFIED API_ENDPOINTS EXPORT
// ================================================================

export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USERS: USER_ENDPOINTS,
  COMPLAINTS: COMPLAINT_ENDPOINTS,
  REPORTS: REPORT_ENDPOINTS,
  FILES: FILE_ENDPOINTS,
  NOTIFICATIONS: NOTIFICATION_ENDPOINTS,
  SETTINGS: SETTINGS_ENDPOINTS,
  ADMIN: ADMIN_ENDPOINTS,
  STAFF: STAFF_ENDPOINTS,
};

// ================================================================
// 🛠️ UTILITY FUNCTIONS
// ================================================================

/**
 * Build query string from parameters object
 * @param {Object} params - Query parameters
 * @returns {string} - Query string
 *
 * @example
 * buildQueryString({ page: 1, limit: 10 })
 * // Returns: "?page=1&limit=10"
 */
export const buildQueryString = (params) => {
  if (!params || typeof params !== "object") return "";

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.append(key, item));
      } else {
        queryParams.append(key, value);
      }
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Build endpoint with query parameters
 * @param {string} endpoint - Base endpoint
 * @param {Object} params - Query parameters
 * @returns {string} - Full URL with query string
 *
 * @example
 * buildEndpoint('/users', { page: 1, limit: 10 })
 * // Returns: "/users?page=1&limit=10"
 */
export const buildEndpoint = (endpoint, params = {}) => {
  return `${endpoint}${buildQueryString(params)}`;
};

/**
 * Build pagination parameters
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination parameters
 */
export const buildPagination = (page = 1, limit = 10) => ({
  page: Math.max(1, page),
  limit: Math.min(100, Math.max(1, limit)),
});

/**
 * Build sort parameters
 * @param {string} field - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Object} - Sort parameters
 */
export const buildSort = (field, order = "asc") => ({
  sortBy: field,
  sortOrder: order.toLowerCase() === "desc" ? "desc" : "asc",
});

// ================================================================
// 📖 USAGE EXAMPLES
// ================================================================

/**
 * Example 1: Simple endpoint
 * const url = API_ENDPOINTS.AUTH.LOGIN;
 * // Result: "/auth/login"
 *
 * Example 2: Dynamic endpoint with ID
 * const url = API_ENDPOINTS.USERS.GET_BY_ID('123');
 * // Result: "/users/123"
 *
 * Example 3: With query parameters
 * const url = buildEndpoint(API_ENDPOINTS.USERS.LIST, {
 *   page: 1,
 *   limit: 10,
 *   role: 'admin'
 * });
 * // Result: "/users?page=1&limit=10&role=admin"
 *
 * Example 4: With pagination and sort
 * const url = buildEndpoint(API_ENDPOINTS.COMPLAINTS.LIST, {
 *   ...buildPagination(2, 20),
 *   ...buildSort('createdAt', 'desc'),
 *   status: 'open'
 * });
 * // Result: "/complaints?page=2&limit=20&sortBy=createdAt&sortOrder=desc&status=open"
 */

export default API_ENDPOINTS;
