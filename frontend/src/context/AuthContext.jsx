import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import api from "../api/apiClient";
import {
  TokenManager,
  UserManager,
  onAuthChanged,
  clearAuth,
} from "../utils/storage";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const API_URL = import.meta.env.VITE_API_URL;

const getOrigin = (url) => {
  const u = String(url || "").trim();
  if (!u) throw new Error("VITE_API_URL is missing");
  return new URL(u).origin;
};

const ASSET_ORIGIN = getOrigin(API_URL);

const TOAST_SUCCESS_MS = 1500;
const TOAST_ERROR_MS = 2500;
const TOAST_INFO_MS = 1500;

const notifySuccess = (msg) =>
  toast.success(msg, { position: "top-left", autoClose: TOAST_SUCCESS_MS });
const notifyError = (msg) =>
  toast.error(msg, { position: "top-left", autoClose: TOAST_ERROR_MS });
const notifyInfo = (msg) =>
  toast.info(msg, { position: "top-left", autoClose: TOAST_INFO_MS });

const isProbablyUser = (obj) =>
  obj && typeof obj === "object" && (obj._id || obj.id || obj.email);

const unwrapPayload = (resLike) => resLike?.data ?? resLike;

const unwrapUser = (resLike) => {
  const payload = unwrapPayload(resLike);
  if (!payload) return null;

  if (isProbablyUser(payload)) return payload;
  if (isProbablyUser(payload.user)) return payload.user;

  const d = payload.data;
  if (isProbablyUser(d)) return d;
  if (isProbablyUser(d?.user)) return d.user;

  return null;
};

const stripQuery = (s) => (typeof s === "string" ? s.split("?")[0] : s);

const toAssetUrl = (value) => {
  if (!value) return null;

  if (typeof value === "object") {
    if (typeof value.url === "string") value = value.url;
    else return null;
  }
  if (typeof value !== "string") return null;

  if (value.startsWith("http") || value.startsWith("blob:")) return value;

  const path = value.startsWith("/") ? value : `/${value}`;
  return new URL(path, ASSET_ORIGIN).toString();
};

const withCacheVersion = (absoluteUrl, version) => {
  if (!absoluteUrl || absoluteUrl.startsWith("blob:")) return absoluteUrl;
  const base = stripQuery(absoluteUrl);
  if (!version) return base;
  return `${base}?v=${encodeURIComponent(String(version))}`;
};

const getErrorMessage = (err, fallback) => {
  const payload = err?.response?.data;
  return (
    payload?.message || payload?.error || err?.message || fallback || "Failed"
  );
};

const mergeUserSafe = (prev, next) => {
  if (!prev) return next;
  if (!next) return next;

  const merged = { ...prev, ...next };
  if (next.coverId === undefined && prev.coverId !== undefined)
    merged.coverId = prev.coverId;
  if (next.role === undefined && prev.role !== undefined)
    merged.role = prev.role;
  return merged;
};

export const AuthProvider = ({ children }) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const normalizeUser = useCallback((u, opts = {}) => {
    if (!u) return null;

    const profileAbs = toAssetUrl(u.profilePicture);
    const coverAbs = toAssetUrl(u.coverImage);

    const avatarV =
      opts.avatarVersion || u.profilePictureUpdatedAt || u.updatedAt || null;
    const coverV =
      opts.coverVersion || u.coverImageUpdatedAt || u.updatedAt || null;

    return {
      ...u,
      profilePicture: opts.bustAvatar
        ? withCacheVersion(profileAbs, avatarV)
        : stripQuery(profileAbs),
      coverImage: opts.bustCover
        ? withCacheVersion(coverAbs, coverV)
        : stripQuery(coverAbs),
      coverVersion: u.coverVersion || u.updatedAt || Date.now(),
    };
  }, []);

  const persistUser = useCallback((u) => {
    if (!u) return;
    UserManager.set({
      ...u,
      profilePicture: stripQuery(u.profilePicture),
      coverImage: stripQuery(u.coverImage),
    });
  }, []);

  const applyUser = useCallback(
    (u) => {
      setUser(u);
      if (u) persistUser(u);
      else UserManager.set(null);
    },
    [persistUser]
  );

  const updateUser = useCallback(
    (userData) => {
      const normalized = normalizeUser(userData);
      if (!normalized) return;
      applyUser(normalized);
    },
    [applyUser, normalizeUser]
  );

  const clearAuthStorage = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!TokenManager.get()) return null;

    try {
      const res = await api.get("/auth/me");
      const u = unwrapUser(res);
      if (!u) return null;

      const normalized = normalizeUser(u);
      applyUser(normalized);
      return normalized;
    } catch {
      return null;
    }
  }, [applyUser, normalizeUser]);

  useEffect(() => {
    (async () => {
      try {
        const cached = UserManager.get() || null;
        if (cached) setUser(normalizeUser(cached));
        if (TokenManager.get()) await refreshMe();
      } catch {
        clearAuthStorage();
      } finally {
        if (mountedRef.current) setIsInitialized(true);
      }
    })();
  }, [clearAuthStorage, normalizeUser, refreshMe]);

  useEffect(() => {
    return onAuthChanged(() => {
      const latest = UserManager.get();
      if (!latest) return setUser(null);

      const normalized = normalizeUser(latest);
      setUser((prev) => mergeUserSafe(prev, normalized));
    });
  }, [normalizeUser]);

  useEffect(() => {
    const handleLogout = () => {
      clearAuthStorage();
      notifyError("Session expired");
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [clearAuthStorage]);

  const login = useCallback(
    async (email, password) => {
      const e = String(email || "")
        .trim()
        .toLowerCase();
      const p = String(password || "").trim();

      if (!e || !p) {
        notifyError("Email & password required");
        return { success: false, message: "Email & password required" };
      }

      setLoading(true);
      try {
        const res = await api.post("/auth/login", { email: e, password: p });

        const payload = unwrapPayload(res);
        const accessToken = payload?.accessToken;
        const refreshToken = payload?.refreshToken;
        const u = unwrapUser(res) || payload?.user;

        if (!accessToken || !u) throw new Error("Invalid response");

        TokenManager.set(accessToken);
        if (refreshToken && TokenManager.setRefresh)
          TokenManager.setRefresh(refreshToken);

        const normalized = normalizeUser(u);
        applyUser(normalized);

        notifySuccess("Logged in");
        return { success: true, user: normalized, accessToken, refreshToken };
      } catch (e2) {
        const msg = getErrorMessage(e2, "Login failed");
        notifyError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [applyUser, normalizeUser]
  );

  const register = useCallback(
    async (formData) => {
      setLoading(true);
      try {
        const { confirmPassword, ...payload } = formData || {};
        const res = await api.post("/auth/register", payload);

        const data = unwrapPayload(res);
        const accessToken = data?.accessToken;
        const refreshToken = data?.refreshToken;
        const u = unwrapUser(res) || data?.user;

        if (!accessToken || !u) throw new Error("Invalid response");

        TokenManager.set(accessToken);
        if (refreshToken && TokenManager.setRefresh)
          TokenManager.setRefresh(refreshToken);

        const normalized = normalizeUser(u);
        applyUser(normalized);

        notifySuccess("Registered");
        return { success: true, user: normalized, accessToken, refreshToken };
      } catch (e) {
        const msg = getErrorMessage(e, "Register failed");
        notifyError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [applyUser, normalizeUser]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
    } finally {
      clearAuthStorage();
      notifyInfo("Logged out");
    }
  }, [clearAuthStorage]);

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) {
        notifyError("Login required");
        return { success: false, message: "Login required" };
      }

      const previous = user;

      const optimistic = {
        ...user,
        ...updates,
        ...(updates?.coverId ? { coverVersion: Date.now() } : null),
      };
      applyUser(optimistic);

      setLoading(true);
      try {
        const res = await api.put("/auth/me", updates);
        const u = unwrapUser(res) || (await refreshMe());
        if (!u) throw new Error("Invalid response");

        const normalized = normalizeUser(u, {
          coverVersion: updates?.coverId ? Date.now() : undefined,
        });

        applyUser(normalized);
        notifySuccess("Updated");
        return { success: true, user: normalized };
      } catch (e) {
        applyUser(previous);
        const msg = getErrorMessage(e, "Update failed");
        notifyError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [applyUser, normalizeUser, refreshMe, user]
  );

  const uploadAvatar = useCallback(
    async (file) => {
      if (!user) {
        notifyError("Login required");
        return { success: false, message: "Login required" };
      }
      if (!file) return { success: false, message: "No file" };

      const previous = user;
      const previewUrl = URL.createObjectURL(file);
      applyUser({ ...user, profilePicture: previewUrl });

      const formData = new FormData();
      formData.append("profilePicture", file);

      setLoading(true);
      try {
        const res = await api.put("/auth/me/profile-picture", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const u = unwrapUser(res) || (await refreshMe());
        if (!u) throw new Error("Invalid response");

        const normalized = normalizeUser(u, { bustAvatar: true });
        applyUser(normalized);

        notifySuccess("Avatar updated");
        return { success: true, user: normalized };
      } catch (e) {
        applyUser(previous);
        const msg = getErrorMessage(e, "Upload failed");
        notifyError(msg);
        return { success: false, message: msg };
      } finally {
        URL.revokeObjectURL(previewUrl);
        setLoading(false);
      }
    },
    [applyUser, normalizeUser, refreshMe, user]
  );

  const uploadCover = useCallback(
    async (file) => {
      if (!user) {
        notifyError("Login required");
        return { success: false, message: "Login required" };
      }
      if (!file) return { success: false, message: "No file" };

      const previous = user;
      const previewUrl = URL.createObjectURL(file);
      applyUser({ ...user, coverImage: previewUrl });

      const formData = new FormData();
      formData.append("coverImage", file);

      setLoading(true);
      try {
        const res = await api.put("/auth/me/cover-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const u = unwrapUser(res) || (await refreshMe());
        if (!u) throw new Error("Invalid response");

        const normalized = normalizeUser(u, { bustCover: true });
        applyUser(normalized);

        notifySuccess("Cover updated");
        return { success: true, user: normalized };
      } catch (e) {
        applyUser(previous);
        const msg = getErrorMessage(e, "Upload failed");
        notifyError(msg);
        return { success: false, message: msg };
      } finally {
        URL.revokeObjectURL(previewUrl);
        setLoading(false);
      }
    },
    [applyUser, normalizeUser, refreshMe, user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      isInitialized,
      login,
      register,
      logout,
      refreshMe,
      updateUser,
      updateProfile,
      uploadAvatar,
      uploadCover,
    }),
    [
      user,
      loading,
      isInitialized,
      login,
      register,
      logout,
      refreshMe,
      updateUser,
      updateProfile,
      uploadAvatar,
      uploadCover,
    ]
  );

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-lg font-semibold text-gray-700">Loading</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
