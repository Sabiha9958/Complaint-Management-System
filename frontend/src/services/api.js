import axios from "axios";

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API CALLS
// ============================================

export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });

export const registerUser = (userData) => api.post("/auth/register", userData);

export const getCurrentUser = () => api.get("/auth/me");

// ============================================
// COMPLAINT API CALLS
// ============================================

export const createComplaint = (complaintData) =>
  api.post("/complaints", complaintData);

export const getAllComplaints = (params) => api.get("/complaints", { params });

export const getComplaintById = (id) => api.get(`/complaints/${id}`);

export const getUserComplaints = (userId) =>
  api.get(`/complaints/user/${userId}`);

export const updateComplaintStatus = (id, statusData) =>
  api.put(`/complaints/${id}/status`, statusData);

export const assignComplaint = (id, userId) =>
  api.put(`/complaints/${id}/assign`, { userId });

export const resolveComplaint = (id, resolutionNotes) =>
  api.put(`/complaints/${id}/resolve`, { resolutionNotes });

export const deleteComplaint = (id) => api.delete(`/complaints/${id}`);

export const uploadAttachments = (id, formData) =>
  api.post(`/complaints/${id}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getComplaintStats = () => api.get("/complaints/stats/dashboard");

// ============================================
// USER API CALLS
// ============================================

export const getAllUsers = () => api.get("/users");

export const getStaffUsers = () => api.get("/users/staff");

export default api;
