// src/utils/storage.js

// Very simple key names
const APP_PREFIX = "cms_v1_";

export const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: `${APP_PREFIX}auth_token`,
  REFRESH_TOKEN: `${APP_PREFIX}refresh_token`,
  USER_DATA: `${APP_PREFIX}user_data`,
  THEME: `${APP_PREFIX}theme`,
  LANGUAGE: `${APP_PREFIX}language`,
  PREFERENCES: `${APP_PREFIX}preferences`,
  AVATAR_PREVIEW: `${APP_PREFIX}avatar_preview`,
  COVER_PREVIEW: `${APP_PREFIX}cover_preview`,
  TEMP_FILES: `${APP_PREFIX}temp_files`,
  CACHE_PREFIX: `${APP_PREFIX}cache_`,
  LAST_SYNC: `${APP_PREFIX}last_sync`,
});

// ---------------------------------------------------------------------------
// BASE STORAGE (thin wrapper around localStorage)
// ---------------------------------------------------------------------------

const safeStorage = (() => {
  try {
    const testKey = "__test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    // Fallback in very old/locked environments
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, v),
      removeItem: (k) => mem.delete(k),
      clear: () => mem.clear(),
      key: (i) => Array.from(mem.keys())[i] ?? null,
      get length() {
        return mem.size;
      },
    };
  }
})();

const storage = {
  get(key, defaultValue = null) {
    try {
      const raw = safeStorage.getItem(key);
      if (raw == null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      safeStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      safeStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  clearAll() {
    try {
      safeStorage.clear();
    } catch {
      // ignore
    }
  },
  keys() {
    const keys = [];
    for (let i = 0; i < safeStorage.length; i++) {
      const k = safeStorage.key(i);
      if (k && k.startsWith(APP_PREFIX)) keys.push(k);
    }
    return keys;
  },
};

export const localStorageService = storage;
export const sessionStorageService = storage; // kept only for compatibility

// ---------------------------------------------------------------------------
// TOKEN MANAGER
// ---------------------------------------------------------------------------

export const TokenManager = {
  get: () => {
    const stored = storage.get(STORAGE_KEYS.AUTH_TOKEN);
    if (!stored) return null;
    if (typeof stored === "string") return stored;
    return stored.token ?? null;
  },
  set: (token) => {
    if (!token || typeof token !== "string") return false;
    return storage.set(STORAGE_KEYS.AUTH_TOKEN, { token });
  },
  remove: () => storage.remove(STORAGE_KEYS.AUTH_TOKEN),

  getRefresh: () => {
    const stored = storage.get(STORAGE_KEYS.REFRESH_TOKEN);
    if (!stored) return null;
    if (typeof stored === "string") return stored;
    return stored.token ?? null;
  },
  setRefresh: (token) => {
    if (!token || typeof token !== "string") return false;
    return storage.set(STORAGE_KEYS.REFRESH_TOKEN, { token });
  },
  removeRefresh: () => storage.remove(STORAGE_KEYS.REFRESH_TOKEN),

  exists: () => Boolean(TokenManager.get()),

  clearAll: () => {
    TokenManager.remove();
    TokenManager.removeRefresh();
  },
};

// ---------------------------------------------------------------------------
// USER MANAGER
// ---------------------------------------------------------------------------

export const UserManager = {
  get: () => storage.get(STORAGE_KEYS.USER_DATA),
  set: (user) => {
    if (!user || typeof user !== "object") return false;
    return storage.set(STORAGE_KEYS.USER_DATA, user);
  },
  update: (updates) => {
    const current = UserManager.get() || {};
    return UserManager.set({ ...current, ...updates });
  },
  remove: () => storage.remove(STORAGE_KEYS.USER_DATA),
  exists: () => Boolean(UserManager.get()),
  getRole: () => UserManager.get()?.role ?? null,
};

// ---------------------------------------------------------------------------
// FILE MANAGER (only what AuthContext uses: avatar/cover previews & temp files)
// ---------------------------------------------------------------------------

export const FileManager = {
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File)) {
        reject(new Error("Invalid file"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  // Avatar preview
  async setAvatarPreview(file) {
    try {
      const url = await FileManager.fileToBase64(file);
      return storage.set(STORAGE_KEYS.AVATAR_PREVIEW, {
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    } catch {
      return false;
    }
  },
  getAvatarPreview() {
    return storage.get(STORAGE_KEYS.AVATAR_PREVIEW);
  },
  removeAvatarPreview() {
    return storage.remove(STORAGE_KEYS.AVATAR_PREVIEW);
  },

  // Cover preview
  async setCoverPreview(file) {
    try {
      const url = await FileManager.fileToBase64(file);
      return storage.set(STORAGE_KEYS.COVER_PREVIEW, {
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    } catch {
      return false;
    }
  },
  getCoverPreview() {
    return storage.get(STORAGE_KEYS.COVER_PREVIEW);
  },
  removeCoverPreview() {
    return storage.remove(STORAGE_KEYS.COVER_PREVIEW);
  },

  // Multiple temp file previews (used if you keep that UI)
  async setFilePreviews(files) {
    if (!files || !Array.isArray(files)) return false;
    try {
      const previews = await Promise.all(
        files.map(async (file) => ({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          url: await FileManager.fileToBase64(file),
          name: file.name,
          size: file.size,
          type: file.type,
        }))
      );
      return storage.set(STORAGE_KEYS.TEMP_FILES, previews);
    } catch {
      return false;
    }
  },
  getFilePreviews() {
    return storage.get(STORAGE_KEYS.TEMP_FILES, []);
  },
  clearFilePreviews() {
    return storage.remove(STORAGE_KEYS.TEMP_FILES);
  },
  removeFilePreview(id) {
    const all = FileManager.getFilePreviews();
    const next = all.filter((f) => f.id !== id);
    return storage.set(STORAGE_KEYS.TEMP_FILES, next);
  },

  clearPreviews() {
    FileManager.removeAvatarPreview();
    FileManager.removeCoverPreview();
    FileManager.clearFilePreviews();
  },

  formatFileSize(bytes) {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  },
};

// ---------------------------------------------------------------------------
// PREFERENCES MANAGER (theme, language, generic prefs)
// ---------------------------------------------------------------------------

export const PreferencesManager = {
  get: () => storage.get(STORAGE_KEYS.PREFERENCES, {}),
  set: (prefs) => storage.set(STORAGE_KEYS.PREFERENCES, prefs || {}),
  update: (updates) => {
    const current = PreferencesManager.get();
    return PreferencesManager.set({ ...current, ...updates });
  },
  remove: () => storage.remove(STORAGE_KEYS.PREFERENCES),

  getTheme: () => storage.get(STORAGE_KEYS.THEME, "light"),
  setTheme: (theme) => (theme ? storage.set(STORAGE_KEYS.THEME, theme) : false),

  getLanguage: () => storage.get(STORAGE_KEYS.LANGUAGE, "en"),
  setLanguage: (lang) =>
    lang ? storage.set(STORAGE_KEYS.LANGUAGE, lang) : false,
};

// ---------------------------------------------------------------------------
// CACHE MANAGER (simple key/value, no logs)
// ---------------------------------------------------------------------------

export const CacheManager = {
  set: (key, value) => storage.set(`${STORAGE_KEYS.CACHE_PREFIX}${key}`, value),
  get: (key, defaultValue = null) =>
    storage.get(`${STORAGE_KEYS.CACHE_PREFIX}${key}`, defaultValue),
  remove: (key) => storage.remove(`${STORAGE_KEYS.CACHE_PREFIX}${key}`),
  clear: () => {
    const keys = storage
      .keys()
      .filter((k) => k.startsWith(STORAGE_KEYS.CACHE_PREFIX));
    keys.forEach((k) => storage.remove(k));
  },
  setLastSync: () => storage.set(STORAGE_KEYS.LAST_SYNC, Date.now()),
  getLastSync: () => storage.get(STORAGE_KEYS.LAST_SYNC),
};

// ---------------------------------------------------------------------------
// AUTH UTILITIES (no console logs)
// ---------------------------------------------------------------------------

export const clearAuth = () => {
  TokenManager.clearAll();
  UserManager.remove();
  FileManager.clearPreviews();

  // legacy keys, removed silently
  try {
    safeStorage.removeItem("token");
    safeStorage.removeItem("refreshToken");
    safeStorage.removeItem("user");
    safeStorage.removeItem("userRole");
    safeStorage.removeItem("userName");
  } catch {
    // ignore
  }
};

export const getUserRole = () => UserManager.getRole();

export const hasRole = (role) => getUserRole() === role;

export const hasAnyRole = (roles) => roles.includes(getUserRole());

export const isAuthenticated = () =>
  TokenManager.exists() && UserManager.exists();

// ---------------------------------------------------------------------------
// LEGACY SHORTCUT EXPORTS (kept so existing imports keep working)
// ---------------------------------------------------------------------------

export const getToken = () => TokenManager.get();
export const setToken = (token) => TokenManager.set(token);
export const removeToken = () => TokenManager.remove();

export const getRefreshToken = () => TokenManager.getRefresh();
export const setRefreshToken = (token) => TokenManager.setRefresh(token);

export const getUser = () => UserManager.get();
export const setUser = (user) => UserManager.set(user);
export const removeUser = () => UserManager.remove(user);

// default export (for older code that imports `storage` directly)
export default storage;
