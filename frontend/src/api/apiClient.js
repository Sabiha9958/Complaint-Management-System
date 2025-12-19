// src/api/apiClient.js
import axios from "axios";
import { TokenManager, clearAuth } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// IMPORTANT: VITE_API_URL should be "http://localhost:5000" (no /api)
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  withCredentials: true,
});

// ---------- header helpers ----------
const setHeader = (headers, key, value) => {
  if (!headers) return;
  if (typeof headers.set === "function")
    headers.set(key, value); // AxiosHeaders (v1+)
  else headers[key] = value;
};

const deleteHeader = (headers, key) => {
  if (!headers) return;
  if (typeof headers.delete === "function") headers.delete(key);
  else delete headers[key];
};

// ---------- response normalization ----------
const normalizeResponse = (response) => {
  const { data, status, headers } = response;

  const success = data?.success ?? (status >= 200 && status < 300);

  return {
    success,
    status,
    message: data?.message,
    data: data?.data ?? data, // unwrap {success, data} OR return raw payload
    pagination: data?.pagination,
    stats: data?.stats,
    headers,
  };
};

let refreshPromise = null;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// ---------- request interceptor (ONLY config work here) ----------
api.interceptors.request.use(
  (config) => {
    const token = TokenManager.get();

    config.headers = config.headers || {};

    if (token) {
      setHeader(config.headers, "Authorization", `Bearer ${token}`);
    }

    // Let browser/axios set boundary for FormData
    if (config.data instanceof FormData) {
      deleteHeader(config.headers, "Content-Type");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- refresh helper ----------
const tryRefresh = async () => {
  // 1) Cookie-based refresh
  try {
    const r1 = await axios.post(
      `${API_BASE_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );

    const t1 =
      r1.data?.accessToken || r1.data?.token || r1.data?.data?.accessToken;
    const rt1 = r1.data?.refreshToken || r1.data?.data?.refreshToken;

    if (t1) return { accessToken: t1, refreshToken: rt1 };
  } catch {
    // ignore and fallback
  }

  // 2) Body/header-based refresh
  const refreshToken = TokenManager.getRefresh?.();
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

  const r2 = await axios.post(
    `${API_BASE_URL}/api/auth/refresh`,
    { refreshToken },
    {
      withCredentials: true,
      headers: { Authorization: `Bearer ${refreshToken}` },
    }
  );

  const t2 =
    r2.data?.accessToken || r2.data?.token || r2.data?.data?.accessToken;
  const rt2 = r2.data?.refreshToken || r2.data?.data?.refreshToken;

  if (!t2) throw new Error("REFRESH_NO_ACCESS_TOKEN");

  return { accessToken: t2, refreshToken: rt2 };
};

// ---------- response interceptor (normalize + refresh on 401) ----------
api.interceptors.response.use(
  (response) => normalizeResponse(response),
  async (error) => {
    const originalRequest = error?.config;

    // No response means network/CORS/etc.
    if (!error?.response) {
      return Promise.reject({
        success: false,
        message: "Network error",
        code: "NETWORK_ERROR",
      });
    }

    const { status, data } = error.response;

    // Only attempt refresh once per request
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // If refresh already running, wait and retry
      if (refreshPromise) {
        return new Promise((resolve, reject) =>
          failedQueue.push({ resolve, reject })
        )
          .then((newToken) => {
            originalRequest.headers = originalRequest.headers || {};
            setHeader(
              originalRequest.headers,
              "Authorization",
              `Bearer ${newToken}`
            );
            return api(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }

      refreshPromise = (async () => {
        const { accessToken, refreshToken } = await tryRefresh();
        TokenManager.set(accessToken);
        if (refreshToken && TokenManager.setRefresh) {
          TokenManager.setRefresh(refreshToken);
        }
        return accessToken;
      })();

      try {
        const newAccessToken = await refreshPromise;
        processQueue(null, newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        setHeader(
          originalRequest.headers,
          "Authorization",
          `Bearer ${newAccessToken}`
        );

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuth();
        window.dispatchEvent(new CustomEvent("auth:logout"));

        return Promise.reject({
          success: false,
          message: "Session expired. Please login again.",
          code: "TOKEN_EXPIRED",
        });
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject({
      success: false,
      status,
      message: data?.message || "Request failed",
      errors: data?.errors,
      code: data?.code || `HTTP_${status}`,
    });
  }
);

export default api;
