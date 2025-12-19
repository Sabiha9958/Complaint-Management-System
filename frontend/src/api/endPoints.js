// src/api/apiEndpoints.js

const BASE = {
  AUTH: "/auth",
  USERS: "/users",
  COMPLAINTS: "/complaints",
  REPORTS: "/reports",
  NOTIFICATIONS: "/notifications",
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE.AUTH}/login`,
    REGISTER: `${BASE.AUTH}/register`,
    LOGOUT: `${BASE.AUTH}/logout`,
    REFRESH: `${BASE.AUTH}/refresh`,
    ME: `${BASE.AUTH}/me`,
    UPDATE_ME: `${BASE.AUTH}/me`,
    CHANGE_PASSWORD: `${BASE.AUTH}/change-password`,
    FORGOT_PASSWORD: `${BASE.AUTH}/forgot-password`,
    RESET_PASSWORD: `${BASE.AUTH}/reset-password`,
    AVATAR: {
      UPLOAD: `${BASE.AUTH}/me/profile-picture`,
      DELETE: `${BASE.AUTH}/me/profile-picture`,
    },
    COVER: {
      UPLOAD: `${BASE.AUTH}/me/cover-image`,
      DELETE: `${BASE.AUTH}/me/cover-image`,
    },
    TEAM: `${BASE.AUTH}/team`,
  },

  USERS: {
    LIST: BASE.USERS,
    CREATE: BASE.USERS,
    GET_BY_ID: (id) => `${BASE.USERS}/${id}`,
    UPDATE: (id) => `${BASE.USERS}/${id}`,
    DELETE: (id) => `${BASE.USERS}/${id}`,
    STATS: `${BASE.USERS}/stats`,
    SEARCH: `${BASE.USERS}/search`,
    BULK_DELETE: `${BASE.USERS}/bulk`,
    EXPORT_CSV: `${BASE.USERS}/export`,
  },

  COMPLAINTS: {
    LIST: BASE.COMPLAINTS,
    CREATE: BASE.COMPLAINTS,
    GET_BY_ID: (id) => `${BASE.COMPLAINTS}/${id}`,
    UPDATE: (id) => `${BASE.COMPLAINTS}/${id}`,
    DELETE: (id) => `${BASE.COMPLAINTS}/${id}`,
    UPDATE_STATUS: (id) => `${BASE.COMPLAINTS}/${id}/status`,
    UPDATE_PRIORITY: (id) => `${BASE.COMPLAINTS}/${id}/priority`,
    ASSIGN: (id) => `${BASE.COMPLAINTS}/${id}/assign`,
    MY_COMPLAINTS: `${BASE.COMPLAINTS}/my`,
    MY_ASSIGNED: `${BASE.COMPLAINTS}/assigned`,
    COMMENTS: (id) => `${BASE.COMPLAINTS}/${id}/comments`,
    ADD_COMMENT: (id) => `${BASE.COMPLAINTS}/${id}/comments`,
    UPLOAD_ATTACHMENT: (id) => `${BASE.COMPLAINTS}/${id}/attachments`,
    DELETE_ATTACHMENT: (id, attachmentId) =>
      `${BASE.COMPLAINTS}/${id}/attachments/${attachmentId}`,
    STATS: `${BASE.COMPLAINTS}/stats`,
    SEARCH: `${BASE.COMPLAINTS}/search`,
    HISTORY: (id) => `${BASE.COMPLAINTS}/${id}/history`,
    BULK_UPDATE_STATUS: `${BASE.COMPLAINTS}/bulk/status`,
    BULK_ASSIGN: `${BASE.COMPLAINTS}/bulk/assign`,
    BULK_DELETE: `${BASE.COMPLAINTS}/bulk/delete`,
    EXPORT_CSV: `${BASE.COMPLAINTS}/export`,
  },

  REPORTS: {
    OVERVIEW: `${BASE.REPORTS}/overview`,
    DASHBOARD: `${BASE.REPORTS}/dashboard`,
    SUMMARY: `${BASE.REPORTS}/summary`,
    BY_CATEGORY: `${BASE.REPORTS}/by-category`,
    BY_STATUS: `${BASE.REPORTS}/by-status`,
    BY_PRIORITY: `${BASE.REPORTS}/by-priority`,
    TRENDS: `${BASE.REPORTS}/trends`,
    PERFORMANCE: `${BASE.REPORTS}/performance`,
    USER_PERFORMANCE: (userId) => `${BASE.REPORTS}/user/${userId}`,
    EXPORT: `${BASE.REPORTS}/export`,
  },

  NOTIFICATIONS: {
    LIST: BASE.NOTIFICATIONS,
    UNREAD_COUNT: `${BASE.NOTIFICATIONS}/unread-count`,
    MARK_READ: (id) => `${BASE.NOTIFICATIONS}/${id}/read`,
    MARK_ALL_READ: `${BASE.NOTIFICATIONS}/read-all`,
    DELETE: (id) => `${BASE.NOTIFICATIONS}/${id}`,
    DELETE_ALL: `${BASE.NOTIFICATIONS}/delete-all`,
    PREFERENCES: `${BASE.NOTIFICATIONS}/preferences`,
  },
};

// Build URL with query params
export const buildEndpoint = (endpoint, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      Array.isArray(value)
        ? value.forEach((v) => query.append(key, v))
        : query.append(key, value);
    }
  });
  return query.toString() ? `${endpoint}?${query}` : endpoint;
};

export default API_ENDPOINTS;
