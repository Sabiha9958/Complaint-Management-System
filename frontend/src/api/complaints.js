// src/api/complaints.js
import api from "./apiClient";
import { API_ENDPOINTS, buildEndpoint } from "./endPoints";

export const ComplaintAPI = {
  getAll: (params = {}) =>
    api.get(buildEndpoint(API_ENDPOINTS.COMPLAINTS.LIST, params)),
  getById: (id) => api.get(API_ENDPOINTS.COMPLAINTS.GET_BY_ID(id)),
  create: (data) => api.post(API_ENDPOINTS.COMPLAINTS.CREATE, data),
  update: (id, data) => api.put(API_ENDPOINTS.COMPLAINTS.UPDATE(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.COMPLAINTS.DELETE(id)),

  updateStatus: (id, status, notes) =>
    api.patch(API_ENDPOINTS.COMPLAINTS.UPDATE_STATUS(id), { status, notes }),

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
  getHistory: (id) => api.get(API_ENDPOINTS.COMPLAINTS.HISTORY(id)),
};
