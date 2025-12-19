// src/api/users.js
import api from "./apiClient";
import { API_ENDPOINTS, buildEndpoint } from "./endPoints"; // ✅ Fixed import

export const UserAPI = {
  getAll: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.USERS.LIST, params)),
  getById: (id) => api.get(API_ENDPOINTS.USERS.GET_BY_ID(id)),
  create: (data) => api.post(API_ENDPOINTS.USERS.CREATE, data),
  update: (id, data) => api.put(API_ENDPOINTS.USERS.UPDATE(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.USERS.DELETE(id)),
  getStats: () => api.get(API_ENDPOINTS.USERS.STATS),
  search: (query, params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.USERS.SEARCH, { q: query, ...params })),
  bulkDelete: (userIds) =>
    api.post(API_ENDPOINTS.USERS.BULK_DELETE, { userIds, action: "delete" }),
};
