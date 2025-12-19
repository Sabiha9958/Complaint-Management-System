// src/api/notifications.js
import api from "./apiClient";
import { API_ENDPOINTS, buildEndpoint } from "./endPoints";

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
