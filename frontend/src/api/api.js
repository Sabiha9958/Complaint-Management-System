/**
 * ================================================================
 * 🌐 API SERVICE - Centralized API client with interceptors
 * ================================================================
 */

import axios from "axios";
import { API_ENDPOINTS, buildEndpoint } from "./endPoints";
import { TokenManager } from "../utils/storage";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_TIMEOUT = 30000;

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// ============================================================================
// TOKEN REFRESH STATE
// ============================================================================

let isRefreshing = false;
let refreshPromise = null;

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

api.interceptors.request.use(
  (config) => {
    // Attach access token
    const token = TokenManager.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    // Add request metadata for debugging
    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    return Promise.reject({
      success: false,
      message: "Failed to send request",
      status: 0,
      code: "REQUEST_ERROR",
    });
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR WITH TOKEN REFRESH
// ============================================================================

api.interceptors.response.use(
  (response) => {
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Success",
      status: response.status,
    };
  },

  async (error) => {
    const originalRequest = error.config;

    // Network error
    if (!error.response) {
      const errorResponse = {
        success: false,
        status: 0,
        message:
          error.code === "ECONNABORTED"
            ? "Request timeout. Please try again."
            : "Network error. Please check your connection.",
        code: error.code === "ECONNABORTED" ? "TIMEOUT" : "NETWORK_ERROR",
      };
      return Promise.reject(errorResponse);
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized with token refresh
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, wait for that to complete
      if (isRefreshing && refreshPromise) {
        try {
          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Start refresh process
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const refreshToken = TokenManager.getRefresh();

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          // Call refresh endpoint (using raw axios to avoid interceptor loop)
          const { data: refreshData } = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken }, // Send in body
            {
              headers: { "Content-Type": "application/json" },
              withCredentials: true,
            }
          );

          // Extract tokens from response
          const newAccessToken =
            refreshData.data?.accessToken || refreshData.accessToken;
          const newRefreshToken =
            refreshData.data?.refreshToken || refreshData.refreshToken;

          if (!newAccessToken) {
            throw new Error("No access token in refresh response");
          }

          // Store new tokens
          TokenManager.set(newAccessToken);
          if (newRefreshToken) {
            TokenManager.setRefresh(newRefreshToken);
          }

          // Update axios default header
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

          return newAccessToken;
        } catch (refreshError) {
          // Clear tokens and notify app
          TokenManager.clear();
          window.dispatchEvent(new CustomEvent("auth:session-expired"));

          throw {
            success: false,
            message: "Session expired. Please log in again.",
            status: 401,
            code: "TOKEN_EXPIRED",
          };
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();

      try {
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // Handle other status codes
    const errorMessages = {
      400: data?.message || "Invalid request data",
      403: data?.message || "Access denied. Insufficient permissions.",
      404: data?.message || "Resource not found",
      409: data?.message || "Resource already exists",
      422: data?.message || "Validation failed",
      423: data?.message || "Account locked. Contact support.",
      429: data?.message || "Too many requests. Please slow down.",
      500: "Server error. Please try again later.",
      502: "Bad gateway. Please try again later.",
      503: "Service unavailable. Please try again later.",
      504: "Gateway timeout. Please try again later.",
    };

    const message =
      errorMessages[status] || data?.message || "An unexpected error occurred";

    return Promise.reject({
      success: false,
      status,
      message,
      errors: data?.errors || null,
      code: data?.code || `HTTP_${status}`,
    });
  }
);

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const AuthAPI = {
  login: async (email, password) => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });

    const { accessToken, refreshToken, user } = response.data;

    if (accessToken) {
      TokenManager.set(accessToken);
      TokenManager.setRefresh(refreshToken);
      TokenManager.setUser(user);
    }

    return response;
  },

  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);

    const { accessToken, refreshToken, user } = response.data;

    if (accessToken) {
      TokenManager.set(accessToken);
      TokenManager.setRefresh(refreshToken);
      TokenManager.setUser(user);
    }

    return response;
  },

  getProfile: () => api.get(API_ENDPOINTS.AUTH.ME),

  updateProfile: (profileData) =>
    api.put(API_ENDPOINTS.AUTH.UPDATE_ME, profileData),

  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      TokenManager.clear();
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
  },

  changePassword: (passwordData) =>
    api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData),

  forgotPassword: (email) =>
    api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),

  resetPassword: (token, password, confirmPassword) =>
    api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password,
      confirmPassword,
    }),

  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.put(API_ENDPOINTS.AUTH.AVATAR.UPLOAD, formData);
  },

  deleteAvatar: () => api.delete(API_ENDPOINTS.AUTH.AVATAR.DELETE),

  uploadCover: (file) => {
    const formData = new FormData();
    formData.append("cover", file);
    return api.post(API_ENDPOINTS.AUTH.COVER.UPLOAD, formData);
  },

  getTeam: () => api.get(API_ENDPOINTS.AUTH.TEAM),
};

// ============================================================================
// USER MANAGEMENT API
// ============================================================================

export const UserAPI = {
  getAll: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.USERS.LIST, params)),

  getById: (id) => api.get(API_ENDPOINTS.USERS.GET_BY_ID(id)),

  create: (userData) => api.post(API_ENDPOINTS.USERS.CREATE, userData),

  update: (id, userData) => api.put(API_ENDPOINTS.USERS.UPDATE(id), userData),

  delete: (id) => api.delete(API_ENDPOINTS.USERS.DELETE(id)),

  getStats: () => api.get(API_ENDPOINTS.USERS.STATS),

  search: (query, params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.USERS.SEARCH, { q: query, ...params })),

  updateRole: (id, role, reason) =>
    api.patch(API_ENDPOINTS.USERS.UPDATE_ROLE(id), { role, reason }),

  bulkDelete: (userIds) =>
    api.post(API_ENDPOINTS.USERS.BULK_DELETE, { userIds }),

  exportCSV: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.USERS.EXPORT_CSV, params), {
      responseType: "blob",
    }),
};

// ============================================================================
// COMPLAINT MANAGEMENT API
// ============================================================================

export const ComplaintAPI = {
  getAll: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.COMPLAINTS.LIST, params)),

  getById: (id) => api.get(API_ENDPOINTS.COMPLAINTS.GET_BY_ID(id)),

  create: (complaintData) =>
    api.post(API_ENDPOINTS.COMPLAINTS.CREATE, complaintData),

  update: (id, complaintData) =>
    api.put(API_ENDPOINTS.COMPLAINTS.UPDATE(id), complaintData),

  delete: (id) => api.delete(API_ENDPOINTS.COMPLAINTS.DELETE(id)),

  updateStatus: (id, status, note = "") =>
    api.patch(API_ENDPOINTS.COMPLAINTS.UPDATE_STATUS(id), { status, note }),

  updatePriority: (id, priority) =>
    api.patch(API_ENDPOINTS.COMPLAINTS.UPDATE_PRIORITY(id), { priority }),

  assign: (id, assignedTo) =>
    api.patch(API_ENDPOINTS.COMPLAINTS.ASSIGN(id), { assignedTo }),

  getMy: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.COMPLAINTS.MY_COMPLAINTS, params)),

  getAssigned: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.COMPLAINTS.MY_ASSIGNED, params)),

  addComment: (id, comment) =>
    api.post(API_ENDPOINTS.COMPLAINTS.ADD_COMMENT(id), { comment }),

  getComments: (id) => api.get(API_ENDPOINTS.COMPLAINTS.COMMENTS(id)),

  uploadAttachments: (id, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("attachments", file));
    return api.post(API_ENDPOINTS.COMPLAINTS.UPLOAD_ATTACHMENT(id), formData);
  },

  deleteAttachment: (id, attachmentId) =>
    api.delete(API_ENDPOINTS.COMPLAINTS.DELETE_ATTACHMENT(id, attachmentId)),

  getStats: () => api.get(API_ENDPOINTS.COMPLAINTS.STATS),

  search: (query, params = {}) =>
    api.get(
      buildEndpoint(API_ENDPOINTS.COMPLAINTS.SEARCH, { q: query, ...params })
    ),

  exportCSV: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.COMPLAINTS.EXPORT_CSV, params), {
      responseType: "blob",
    }),

  getHistory: (id) => api.get(API_ENDPOINTS.COMPLAINTS.HISTORY(id)),

  bulkUpdateStatus: (ids, status, note) =>
    api.put(API_ENDPOINTS.COMPLAINTS.BULK_UPDATE_STATUS, {
      ids,
      status,
      note,
    }),

  bulkAssign: (ids, assignedTo) =>
    api.put(API_ENDPOINTS.COMPLAINTS.BULK_ASSIGN, { ids, assignedTo }),

  bulkDelete: (ids) => api.post(API_ENDPOINTS.COMPLAINTS.BULK_DELETE, { ids }),
};

// ============================================================================
// REPORTS & ANALYTICS API
// ============================================================================

export const ReportAPI = {
  getOverview: () => api.get(API_ENDPOINTS.REPORTS.OVERVIEW),

  getDashboard: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.REPORTS.DASHBOARD, params)),

  getSummary: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.REPORTS.SUMMARY, params)),

  getByCategory: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.REPORTS.BY_CATEGORY, params)),

  getByStatus: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.REPORTS.BY_STATUS, params)),

  getByPriority: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.REPORTS.BY_PRIORITY, params)),

  getTrends: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.REPORTS.TRENDS, params)),

  getPerformance: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.REPORTS.PERFORMANCE, params)),

  getUserPerformance: (userId, params = {}) =>
    api.get(
      buildEndpoint(API_ENDPOINTS.REPORTS.USER_PERFORMANCE(userId), params)
    ),

  export: (type = "pdf", params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.REPORTS.EXPORT, { type, ...params }), {
      responseType: "blob",
    }),
};

// ============================================================================
// NOTIFICATION API
// ============================================================================

export const NotificationAPI = {
  getAll: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.NOTIFICATIONS.LIST, params)),

  getUnreadCount: () => api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT),

  markAsRead: (id) => api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),

  markAllAsRead: () => api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ),

  delete: (id) => api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id)),

  deleteAll: () => api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL),

  getPreferences: () => api.get(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES),

  updatePreferences: (preferences) =>
    api.put(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, preferences),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const checkApiHealth = async () => {
  try {
    await api.get("/health", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

export const getErrorMessage = (error) => {
  if (typeof error === "string") return error;
  return error?.message || "An unexpected error occurred";
};

export const isNetworkError = (error) => {
  return error?.code === "NETWORK_ERROR" || error?.code === "TIMEOUT";
};

export const isAuthError = (error) => {
  return error?.status === 401 || error?.code === "TOKEN_EXPIRED";
};

export const isValidationError = (error) => {
  return error?.status === 422 || error?.status === 400;
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default api;
