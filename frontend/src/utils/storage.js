// src/utils/storage.js

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

const AUTH_EVENT = `${APP_PREFIX}auth_changed`;

export const emitAuthChanged = (detail = {}) => {
  try {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail }));
  } catch {
    // ignore
  }
};

export const onAuthChanged = (handler) => {
  const listener = (e) => handler?.(e.detail);
  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
};

const createSafeStorage = (engine) => {
  try {
    const testKey = `${APP_PREFIX}__test__`;
    engine.setItem(testKey, "1");
    engine.removeItem(testKey);
    return engine;
  } catch {
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
};

const safeLocal = createSafeStorage(window.localStorage);
const safeSession = createSafeStorage(window.sessionStorage);

const createStore = (engine) => ({
  get(key, defaultValue = null) {
    try {
      const raw = engine.getItem(key);
      if (raw == null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      engine.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      engine.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clearAllAppKeys() {
    try {
      const toRemove = [];
      for (let i = 0; i < engine.length; i += 1) {
        const k = engine.key(i);
        if (k && k.startsWith(APP_PREFIX)) toRemove.push(k);
      }
      toRemove.forEach((k) => engine.removeItem(k));
    } catch {
      // ignore
    }
  },
});

export const localStorageService = createStore(safeLocal);
export const sessionStorageService = createStore(safeSession);
export default localStorageService;

const normalizeToken = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.token === "string") return v.token;
  return null;
};

const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

const mergeUser = (prev, next) => {
  if (!prev) return next;
  if (!next) return next;

  const merged = { ...prev, ...next };

  // keep existing coverId if next doesn't have it
  if (next.coverId === undefined && prev.coverId !== undefined)
    merged.coverId = prev.coverId;

  return merged;
};

export const TokenManager = {
  get() {
    return normalizeToken(localStorageService.get(STORAGE_KEYS.AUTH_TOKEN));
  },

  set(token) {
    if (!token) {
      localStorageService.remove(STORAGE_KEYS.AUTH_TOKEN);
      emitAuthChanged({ type: "ACCESS_TOKEN_CLEARED" });
      return true;
    }
    if (typeof token !== "string") return false;

    const ok = localStorageService.set(STORAGE_KEYS.AUTH_TOKEN, { token });
    if (ok) emitAuthChanged({ type: "ACCESS_TOKEN_SET" });
    return ok;
  },

  remove() {
    const ok = localStorageService.remove(STORAGE_KEYS.AUTH_TOKEN);
    if (ok) emitAuthChanged({ type: "ACCESS_TOKEN_CLEARED" });
    return ok;
  },

  getRefresh() {
    return normalizeToken(localStorageService.get(STORAGE_KEYS.REFRESH_TOKEN));
  },

  setRefresh(token) {
    if (!token) {
      localStorageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
      emitAuthChanged({ type: "REFRESH_TOKEN_CLEARED" });
      return true;
    }
    if (typeof token !== "string") return false;

    const ok = localStorageService.set(STORAGE_KEYS.REFRESH_TOKEN, { token });
    if (ok) emitAuthChanged({ type: "REFRESH_TOKEN_SET" });
    return ok;
  },

  removeRefresh() {
    const ok = localStorageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
    if (ok) emitAuthChanged({ type: "REFRESH_TOKEN_CLEARED" });
    return ok;
  },

  exists() {
    return Boolean(TokenManager.get());
  },

  clearAll() {
    TokenManager.remove();
    TokenManager.removeRefresh();
  },

  getUser() {
    return UserManager.get();
  },
  setUser(user) {
    return UserManager.set(user);
  },
};

export const UserManager = {
  get() {
    return localStorageService.get(STORAGE_KEYS.USER_DATA);
  },

  set(user) {
    if (!user) {
      localStorageService.remove(STORAGE_KEYS.USER_DATA);
      emitAuthChanged({ type: "USER_CLEARED" });
      return true;
    }
    if (!isPlainObject(user)) return false;

    const current = UserManager.get();
    const next = mergeUser(current, user);

    if (next?.coverId === undefined) {
      console.warn("[UserManager.set] stored user has no coverId:", next);
    }

    const ok = localStorageService.set(STORAGE_KEYS.USER_DATA, next);
    if (ok) emitAuthChanged({ type: "USER_SET" });
    return ok;
  },

  update(updates) {
    return UserManager.set(updates);
  },

  remove() {
    return UserManager.set(null);
  },

  exists() {
    return Boolean(UserManager.get());
  },

  getRole() {
    return UserManager.get()?.role ?? null;
  },
};

export const FileManager = {
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File))
        return reject(new Error("Invalid file"));
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  async setAvatarPreview(file) {
    try {
      const url = await FileManager.fileToBase64(file);
      return localStorageService.set(STORAGE_KEYS.AVATAR_PREVIEW, {
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
    return localStorageService.get(STORAGE_KEYS.AVATAR_PREVIEW);
  },
  removeAvatarPreview() {
    return localStorageService.remove(STORAGE_KEYS.AVATAR_PREVIEW);
  },

  async setCoverPreview(file) {
    try {
      const url = await FileManager.fileToBase64(file);
      return localStorageService.set(STORAGE_KEYS.COVER_PREVIEW, {
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
    return localStorageService.get(STORAGE_KEYS.COVER_PREVIEW);
  },
  removeCoverPreview() {
    return localStorageService.remove(STORAGE_KEYS.COVER_PREVIEW);
  },

  async setFilePreviews(files) {
    if (!Array.isArray(files)) return false;
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
      return localStorageService.set(STORAGE_KEYS.TEMP_FILES, previews);
    } catch {
      return false;
    }
  },
  getFilePreviews() {
    return localStorageService.get(STORAGE_KEYS.TEMP_FILES, []);
  },
  clearFilePreviews() {
    return localStorageService.remove(STORAGE_KEYS.TEMP_FILES);
  },

  clearPreviews() {
    FileManager.removeAvatarPreview();
    FileManager.removeCoverPreview();
    FileManager.clearFilePreviews();
  },
};

export const PreferencesManager = {
  get: () => localStorageService.get(STORAGE_KEYS.PREFERENCES, {}),
  set: (prefs) =>
    localStorageService.set(STORAGE_KEYS.PREFERENCES, prefs || {}),
  update: (updates) =>
    PreferencesManager.set({ ...PreferencesManager.get(), ...(updates || {}) }),

  getTheme: () => localStorageService.get(STORAGE_KEYS.THEME, "light"),
  setTheme: (theme) =>
    theme ? localStorageService.set(STORAGE_KEYS.THEME, theme) : false,

  getLanguage: () => localStorageService.get(STORAGE_KEYS.LANGUAGE, "en"),
  setLanguage: (lang) =>
    lang ? localStorageService.set(STORAGE_KEYS.LANGUAGE, lang) : false,
};

export const CacheManager = {
  set: (key, value) =>
    localStorageService.set(`${STORAGE_KEYS.CACHE_PREFIX}${key}`, value),
  get: (key, def = null) =>
    localStorageService.get(`${STORAGE_KEYS.CACHE_PREFIX}${key}`, def),
  remove: (key) =>
    localStorageService.remove(`${STORAGE_KEYS.CACHE_PREFIX}${key}`),

  setLastSync: () =>
    localStorageService.set(STORAGE_KEYS.LAST_SYNC, Date.now()),
  getLastSync: () => localStorageService.get(STORAGE_KEYS.LAST_SYNC),
};

export const clearAuth = () => {
  TokenManager.clearAll();
  UserManager.remove();
  FileManager.clearPreviews();

  try {
    safeLocal.removeItem("token");
    safeLocal.removeItem("refreshToken");
    safeLocal.removeItem("user");
    safeLocal.removeItem("userRole");
    safeLocal.removeItem("userName");
  } catch {
    // ignore
  }

  emitAuthChanged({ type: "AUTH_CLEARED" });
};

export const getUserRole = () => UserManager.getRole();
export const hasRole = (role) => getUserRole() === role;
export const hasAnyRole = (roles) => roles.includes(getUserRole());
export const isAuthenticated = () =>
  TokenManager.exists() && UserManager.exists();

export const getToken = () => TokenManager.get();
export const setToken = (t) => TokenManager.set(t);
export const removeToken = () => TokenManager.remove();

export const getRefreshToken = () => TokenManager.getRefresh();
export const setRefreshToken = (t) => TokenManager.setRefresh(t);

export const getUser = () => UserManager.get();
export const setUser = (u) => UserManager.set(u);
export const removeUser = () => UserManager.remove();
