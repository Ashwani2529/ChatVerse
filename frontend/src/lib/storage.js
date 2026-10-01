const TOKEN_KEY = 'chatverse.token';
const EXPIRY_KEY = 'chatverse.token.expiresAt';
const PREFILL_KEY = 'chatverse.prefill';
const NOTIFY_KEY = 'chatverse.notifications';

const DAY_MS = 24 * 60 * 60 * 1000;

// localStorage throws in Safari private mode and when the quota is full, so
// every access is guarded — a storage failure must never break the app.
const safeGet = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore — session simply will not persist */
  }
};

const safeRemove = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

/** Saves the token and the moment it stops being valid (60 days out). */
export const saveSession = (token, expiresInDays = 60) => {
  safeSet(TOKEN_KEY, token);
  safeSet(EXPIRY_KEY, String(Date.now() + expiresInDays * DAY_MS));
};

/** Returns the stored token, or null if it is missing or already expired. */
export const loadToken = () => {
  const token = safeGet(TOKEN_KEY);
  if (!token) return null;

  const expiresAt = Number(safeGet(EXPIRY_KEY));

  if (expiresAt && Date.now() > expiresAt) {
    clearSession();
    return null;
  }

  return token;
};

export const clearSession = () => {
  safeRemove(TOKEN_KEY);
  safeRemove(EXPIRY_KEY);
};

/** Room id and display name are remembered to prefill the join form. */
export const savePrefill = ({ roomId, name }) => {
  safeSet(PREFILL_KEY, JSON.stringify({ roomId, name }));
};

export const loadPrefill = () => {
  try {
    return JSON.parse(safeGet(PREFILL_KEY)) || {};
  } catch {
    return {};
  }
};

const DEFAULT_NOTIFY_PREFS = { muted: false, bannerDismissed: false };

export const loadNotificationPrefs = () => {
  try {
    return { ...DEFAULT_NOTIFY_PREFS, ...(JSON.parse(safeGet(NOTIFY_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_NOTIFY_PREFS };
  }
};

export const saveNotificationPrefs = (prefs) => {
  safeSet(NOTIFY_KEY, JSON.stringify({ ...loadNotificationPrefs(), ...prefs }));
};
