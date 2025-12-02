// src/context/AuthContext.jsx

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { toast } from "react-toastify";
import apiClient, { setupInterceptors } from "../api/apiClient";
import {
  TokenManager,
  UserManager,
  FileManager,
  clearAuth as clearStorage,
} from "../utils/storage";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ----------------- INIT FROM STORAGE (no auto-clear) -----------------
  useEffect(() => {
    try {
      const token = TokenManager.get();
      const savedUser = UserManager.get();

      // If both exist, restore auth state
      if (token && savedUser) {
        setUser(savedUser);
      }
      // If not, just start as logged-out; do NOT clear storage here
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // ----------------- 401 HANDLER (via apiClient) -----------------
  useEffect(() => {
    const handleLogout = () => {
      clearStorage();
      setUser(null);
      toast.error("Session expired. Please log in again.", {
        toastId: "session-expired",
      });
    };
    return setupInterceptors(handleLogout);
  }, []);

  // Helper: store tokens + user in one place
  const applyAuth = useCallback((payload) => {
    const accessToken = payload.accessToken || payload.token;
    const refreshToken = payload.refreshToken;
    const userData = payload.user || payload.data;

    if (!accessToken || !userData) {
      throw new Error("Invalid auth response from server");
    }

    TokenManager.set(accessToken);
    if (refreshToken) TokenManager.setRefresh(refreshToken);
    UserManager.set(userData);
    setUser(userData);

    return userData;
  }, []);

  // ----------------- EMAIL/PASSWORD LOGIN -----------------
  const login = useCallback(
    async (email, password) => {
      if (!email?.trim() || !password?.trim()) {
        const msg = "Email and password are required";
        toast.error(msg, { toastId: "login-validation-error" });
        return { success: false, message: msg };
      }

      setLoading(true);
      try {
        const data = await apiClient.post("/auth/login", {
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });

        if (!data.success) {
          throw new Error(data.message || "Login failed");
        }

        const userData = applyAuth(data);

        toast.success(`Welcome back, ${userData.name || "User"}!`, {
          toastId: "login-success",
        });

        return { success: true, user: userData };
      } catch (err) {
        const message =
          err?.message ||
          err?.response?.data?.message ||
          "Login failed. Please try again.";

        toast.error(message, { toastId: "login-error" });
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [applyAuth]
  );

  // ----------------- REGISTER -----------------
  const register = useCallback(
    async (formData) => {
      setLoading(true);
      try {
        const { confirmPassword, ...payload } = formData;
        const data = await apiClient.post("/auth/register", payload);

        if (!data.success) {
          throw new Error(data.message || "Registration failed");
        }

        const userData = applyAuth(data);

        toast.success("Account created successfully!", {
          toastId: "register-success",
        });

        return { success: true, user: userData };
      } catch (err) {
        const message =
          err?.message || err?.response?.data?.message || "Registration failed";

        toast.error(message, { toastId: "register-error" });

        return {
          success: false,
          message,
          errors: err?.response?.data?.errors || [],
        };
      } finally {
        setLoading(false);
      }
    },
    [applyAuth]
  );

  // ----------------- LOGOUT -----------------
  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout").catch(() => {});
    } finally {
      clearStorage();
      setUser(null);
      toast.info("Logged out successfully", { toastId: "logout" });
    }
  }, []);

  // ----------------- SYNC /auth/me -----------------
  const refreshUser = useCallback(async () => {
    const token = TokenManager.get();
    if (!token) {
      return { success: false, message: "No token available" };
    }

    try {
      const data = await apiClient.get("/auth/me");

      if (!data.success || !data.data) {
        throw new Error(data.message || "Failed to fetch user");
      }

      UserManager.set(data.data);
      setUser(data.data);
      return { success: true, user: data.data };
    } catch (err) {
      // If /auth/me fails, do NOT eagerly nuke auth unless you know token is bad.
      // Let the 401 interceptor handle real expiry.
      return { success: false, message: err.message || "Auth error" };
    }
  }, []);

  // ----------------- PROFILE UPDATE (text only) -----------------
  const updateProfile = useCallback(
    async (updates) => {
      if (!user) {
        toast.error("Please log in", { toastId: "auth-required" });
        return { success: false, message: "Not authenticated" };
      }

      setLoading(true);
      try {
        const data = await apiClient.put("/auth/me", updates);

        if (!data.success) {
          throw new Error(data.message || "Update failed");
        }

        const serverUser = data.data || data.user;
        UserManager.set(serverUser);
        setUser(serverUser);

        toast.success("Profile updated successfully!", {
          toastId: "profile-updated",
        });

        return { success: true, user: serverUser };
      } catch (err) {
        const message =
          err?.message ||
          err?.response?.data?.message ||
          "Failed to update profile";

        toast.error(message, { toastId: "profile-error" });
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // ----------------- AVATAR UPLOAD/DELETE -----------------
  const uploadAvatar = useCallback(
    async (file) => {
      if (!user) {
        toast.error("Please log in", { toastId: "auth-required" });
        return { success: false };
      }

      const previewOk = await FileManager.setAvatarPreview(file);
      if (previewOk) {
        const preview = FileManager.getAvatarPreview();
        setUser((prev) => ({ ...prev, avatarPreview: preview?.url }));
      }

      const formData = new FormData();
      formData.append("profilePicture", file);

      setLoading(true);
      try {
        const data = await apiClient.put("/auth/me/profile-picture", formData);

        if (!data.success) {
          throw new Error(data.message || "Avatar upload failed");
        }

        const serverUser = data.data || data.user;
        const updated = {
          ...serverUser,
          avatarVersion: Date.now(),
          avatarPreview: null,
        };

        FileManager.removeAvatarPreview();
        UserManager.set(updated);
        setUser(updated);

        toast.success("Profile picture updated!", {
          toastId: "avatar-updated",
        });

        return { success: true, user: updated };
      } catch (err) {
        FileManager.removeAvatarPreview();
        setUser(UserManager.get() || user);

        const message =
          err?.message ||
          err?.response?.data?.message ||
          "Failed to upload profile picture";

        toast.error(message, { toastId: "avatar-error" });
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const deleteAvatar = useCallback(async () => {
    if (!user) {
      toast.error("Please log in", { toastId: "auth-required" });
      return { success: false };
    }

    setLoading(true);
    try {
      const data = await apiClient.delete("/auth/me/profile-picture");

      if (!data.success) {
        throw new Error(data.message || "Failed to remove avatar");
      }

      const serverUser = data.data || data.user;
      const updated = {
        ...serverUser,
        avatarVersion: Date.now(),
        avatarPreview: null,
      };

      FileManager.removeAvatarPreview();
      UserManager.set(updated);
      setUser(updated);

      toast.success("Profile picture removed!", {
        toastId: "avatar-removed",
      });

      return { success: true, user: updated };
    } catch (err) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to remove profile picture";

      toast.error(message, { toastId: "avatar-delete-error" });
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ----------------- COVER UPLOAD/DELETE -----------------
  const uploadCover = useCallback(
    async (file) => {
      if (!user) {
        toast.error("Please log in", { toastId: "auth-required" });
        return { success: false };
      }

      const previewOk = await FileManager.setCoverPreview(file);
      if (previewOk) {
        const preview = FileManager.getCoverPreview();
        setUser((prev) => ({ ...prev, coverPreview: preview?.url }));
      }

      const formData = new FormData();
      formData.append("coverImage", file);

      setLoading(true);
      try {
        const data = await apiClient.put("/auth/me/cover-image", formData);

        if (!data.success) {
          throw new Error(data.message || "Cover upload failed");
        }

        const serverUser = data.data || data.user;
        const updated = {
          ...serverUser,
          coverPreview: null,
        };

        FileManager.removeCoverPreview();
        UserManager.set(updated);
        setUser(updated);

        toast.success("Cover image updated!", {
          toastId: "cover-updated",
        });

        return { success: true, user: updated };
      } catch (err) {
        FileManager.removeCoverPreview();
        setUser(UserManager.get() || user);

        const message =
          err?.message ||
          err?.response?.data?.message ||
          "Failed to upload cover image";

        toast.error(message, { toastId: "cover-error" });
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const deleteCover = useCallback(async () => {
    if (!user) {
      toast.error("Please log in", { toastId: "auth-required" });
      return { success: false };
    }

    setLoading(true);
    try {
      const data = await apiClient.delete("/auth/me/cover-image");

      if (!data.success) {
        throw new Error(data.message || "Failed to remove cover");
      }

      const serverUser = data.data || data.user;
      const updated = {
        ...serverUser,
        coverPreview: null,
      };

      FileManager.removeCoverPreview();
      UserManager.set(updated);
      setUser(updated);

      toast.success("Cover image removed!", {
        toastId: "cover-removed",
      });

      return { success: true, user: updated };
    } catch (err) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to remove cover image";

      toast.error(message, { toastId: "cover-delete-error" });
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ----------------- CHANGE PASSWORD -----------------
  const changePassword = useCallback(
    async (currentPassword, newPassword, confirmPassword) => {
      if (!user) {
        toast.error("Please log in", { toastId: "auth-required" });
        return { success: false, message: "Not authenticated" };
      }

      if (newPassword !== confirmPassword) {
        const msg = "New passwords don't match";
        toast.error(msg, { toastId: "password-mismatch" });
        return { success: false, message: msg };
      }

      setLoading(true);
      try {
        const data = await apiClient.put("/auth/change-password", {
          currentPassword,
          newPassword,
          confirmPassword,
        });

        if (!data.success) {
          throw new Error(data.message || "Password change failed");
        }

        toast.success("Password changed successfully!", {
          toastId: "password-changed",
        });

        return { success: true };
      } catch (err) {
        const message =
          err?.message ||
          err?.response?.data?.message ||
          "Failed to change password";

        toast.error(message, { toastId: "password-error" });
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // ----------------- CONTEXT VALUE -----------------
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      isInitialized,

      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      uploadAvatar,
      deleteAvatar,
      uploadCover,
      deleteCover,
      changePassword,

      updateUser: setUser, // for Google login
    }),
    [
      user,
      loading,
      isInitialized,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      uploadAvatar,
      deleteAvatar,
      uploadCover,
      deleteCover,
      changePassword,
    ]
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-lg">
            Loading your account...
          </p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
