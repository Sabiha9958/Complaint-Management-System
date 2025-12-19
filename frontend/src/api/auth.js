// src/api/auth.js
import api from "./apiClient";
import { API_ENDPOINTS, buildEndpoint } from "./endPoints";
import { TokenManager } from "../utils/storage";

export const AuthAPI = {
  login: async (email, password) => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
    const { accessToken, refreshToken, user } = response.data || response;
    if (accessToken) {
      TokenManager.set(accessToken);
      TokenManager.setRefresh(refreshToken);
      TokenManager.setUser(user);
    }
    return response;
  },

  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    const { accessToken, refreshToken, user } = response.data || response;
    if (accessToken) {
      TokenManager.set(accessToken);
      TokenManager.setRefresh(refreshToken);
      TokenManager.setUser(user);
    }
    return response;
  },

  getProfile: () => api.get(API_ENDPOINTS.AUTH.ME),

  updateProfile: (data) => api.put(API_ENDPOINTS.AUTH.UPDATE_ME, data),

  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      TokenManager.clear();
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
  },

  changePassword: (data) => api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data),

  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("profilePicture", file);
    return api.put(API_ENDPOINTS.AUTH.AVATAR.UPLOAD, formData);
  },

  deleteAvatar: () => api.delete(API_ENDPOINTS.AUTH.AVATAR.DELETE),

  uploadCover: (file) => {
    const formData = new FormData();
    formData.append("coverImage", file);
    return api.put(API_ENDPOINTS.AUTH.COVER.UPLOAD, formData);
  },

  deleteCover: () => api.delete(API_ENDPOINTS.AUTH.COVER.DELETE),

  getTeam: () => api.get(API_ENDPOINTS.AUTH.TEAM),
};
