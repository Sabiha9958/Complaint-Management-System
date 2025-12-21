import axios from "axios";
import { TokenManager, clearAuth } from "../utils/storage";

const ROOT_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
if (!ROOT_URL) throw new Error("Missing VITE_API_URL");

export const API_BASE_URL = `${ROOT_URL}/api`;
export const FILE_BASE_URL = ROOT_URL;

export const fileUrl = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return `${FILE_BASE_URL}${p.startsWith("/") ? "" : "/"}${p}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

const setHeader = (headers, key, value) => {
  if (!headers) return;
  if (typeof headers.set === "function") headers.set(key, value);
  else headers[key] = value;
};

const deleteHeader = (headers, key) => {
  if (!headers) return;
  if (typeof headers.delete === "function") headers.delete(key);
  else delete headers[key];
};

const normalize = (r) => {
  const { data, status, headers } = r;
  const success = data?.success ?? (status >= 200 && status < 300);
  return {
    success,
    status,
    message: data?.message,
    data: data?.data ?? data,
    pagination: data?.pagination,
    stats: data?.stats,
    headers,
  };
};

let refreshPromise = null;
let queue = [];

const flushQueue = (err, token = null) => {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)));
  queue = [];
};

const tryRefresh = async () => {
  try {
    const r = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const accessToken =
      r.data?.accessToken || r.data?.token || r.data?.data?.accessToken;
    const refreshToken = r.data?.refreshToken || r.data?.data?.refreshToken;
    if (accessToken) return { accessToken, refreshToken };
  } catch {}

  const refreshToken = TokenManager.getRefresh?.();
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

  const r2 = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    {
      withCredentials: true,
      headers: { Authorization: `Bearer ${refreshToken}` },
    }
  );

  const accessToken =
    r2.data?.accessToken || r2.data?.token || r2.data?.data?.accessToken;
  const newRefreshToken = r2.data?.refreshToken || r2.data?.data?.refreshToken;
  if (!accessToken) throw new Error("REFRESH_NO_ACCESS_TOKEN");
  return { accessToken, refreshToken: newRefreshToken };
};

api.interceptors.request.use(
  (config) => {
    const token = TokenManager.get();
    config.headers = config.headers || {};
    if (token) setHeader(config.headers, "Authorization", `Bearer ${token}`);
    if (config.data instanceof FormData)
      deleteHeader(config.headers, "Content-Type");
    return config;
  },
  (e) => Promise.reject(e)
);

api.interceptors.response.use(
  (res) => normalize(res),
  async (error) => {
    const req = error?.config;

    if (!error?.response) {
      return Promise.reject({
        success: false,
        message: "Network error",
        code: "NETWORK_ERROR",
      });
    }

    const { status, data } = error.response;

    if (status === 401 && req && !req._retry) {
      req._retry = true;

      if (refreshPromise) {
        return new Promise((resolve, reject) =>
          queue.push({ resolve, reject })
        ).then((newToken) => {
          req.headers = req.headers || {};
          setHeader(req.headers, "Authorization", `Bearer ${newToken}`);
          return api(req);
        });
      }

      refreshPromise = (async () => {
        const { accessToken, refreshToken } = await tryRefresh();
        TokenManager.set(accessToken);
        if (refreshToken && TokenManager.setRefresh)
          TokenManager.setRefresh(refreshToken);
        return accessToken;
      })();

      try {
        const newToken = await refreshPromise;
        flushQueue(null, newToken);
        req.headers = req.headers || {};
        setHeader(req.headers, "Authorization", `Bearer ${newToken}`);
        return api(req);
      } catch (e) {
        flushQueue(e, null);
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
