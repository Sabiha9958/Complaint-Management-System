// src/api/apiClient.js

/**
 * Simple Axios client with:
 * - Base URL
 * - JWT injection
 * - Refresh-token handling on 401
 * - Optional global logout callback
 */

import axios from "axios";
import { clearAuth, TokenManager } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_TIMEOUT = 30000;

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// endpoints that should NOT trigger refresh logic
const NO_REFRESH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
];

let globalLogoutCallback = null;
let isRefreshing = false;
let refreshQueue = [];

/**
 * Register a callback that runs when refresh fails (e.g. redirect to login)
 */
export const setupInterceptors = (onLogout) => {
  if (typeof onLogout !== "function") return () => {};
  globalLogoutCallback = onLogout;
  return () => {
    globalLogoutCallback = null;
  };
};

const enqueueRequest = () =>
  new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });

const resolveQueue = (error, token) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

// REQUEST: add Authorization header + handle FormData
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) =>
    Promise.reject({
      success: false,
      message: "Failed to send request",
      code: "REQUEST_ERROR",
      originalError: error,
    })
);

// RESPONSE: return backend JSON directly; handle refresh on 401
apiClient.interceptors.response.use(
  // success -> return backend body as-is
  (response) => response.data,

  // error -> possibly refresh, then rethrow normalized error
  async (error) => {
    const originalRequest = error.config;

    // No response at all (network/timeout)
    if (!error.response) {
      const isTimeout = error.code === "ECONNABORTED";
      return Promise.reject({
        success: false,
        status: 0,
        code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        message: isTimeout
          ? "Request timeout. Please try again."
          : "Network error. Please check your connection.",
      });
    }

    const { status, data } = error.response;

    // 401 -> try refresh if not on excluded endpoints
    const shouldTryRefresh =
      status === 401 &&
      !originalRequest._retry &&
      !NO_REFRESH_ENDPOINTS.some((path) => originalRequest.url?.includes(path));

    if (shouldTryRefresh) {
      // if already refreshing, wait in queue
      if (isRefreshing) {
        try {
          const newToken = await enqueueRequest();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        } catch (e) {
          return Promise.reject(e);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = TokenManager.getRefresh();
        if (!refreshToken) throw new Error("No refresh token available");

        const refreshRes = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
            withCredentials: true,
          }
        );

        const payload = refreshRes.data?.data || refreshRes.data || {};
        const newAccess = payload.accessToken || payload.token;
        const newRefresh = payload.refreshToken;

        if (!newAccess || !newRefresh)
          throw new Error("Invalid refresh response");

        TokenManager.set(newAccess);
        TokenManager.setRefresh(newRefresh);

        apiClient.defaults.headers.Authorization = `Bearer ${newAccess}`;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        resolveQueue(null, newAccess);
        return apiClient(originalRequest);
      } catch (refreshError) {
        resolveQueue(refreshError, null);
        clearAuth();

        if (typeof globalLogoutCallback === "function") {
          try {
            globalLogoutCallback();
          } catch {
            // ignore
          }
        }

        return Promise.reject({
          success: false,
          status: 401,
          code: "TOKEN_EXPIRED",
          message: "Session expired. Please log in again.",
        });
      } finally {
        isRefreshing = false;
      }
    }

    // Non-401 errors
    const message =
      data?.message ||
      {
        400: "Invalid request data",
        403: "Access denied",
        404: "Resource not found",
        409: "Resource already exists",
        413: "File size too large",
        415: "Unsupported file type",
        422: "Validation failed",
        423: "Account locked",
        429: "Too many requests. Please slow down.",
        500: "Server error. Please try again later.",
        502: "Bad gateway",
        503: "Service unavailable",
        504: "Gateway timeout",
      }[status] ||
      "An unexpected error occurred";

    return Promise.reject({
      success: false,
      status,
      code: data?.code || `HTTP_${status}`,
      message,
      errors: data?.errors || null,
    });
  }
);

export default apiClient;
