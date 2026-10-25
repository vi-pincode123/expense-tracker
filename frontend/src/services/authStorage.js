const AUTH_STORAGE_KEY = 'expense-tracker-auth';

export const getStoredAuth = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) {
      return null;
    }
    if (!parsed.user || typeof parsed.user.email !== 'string') {
      return null;
    }
    return { token: parsed.token, user: parsed.user };
  } catch (error) {
    return null;
  }
};

export const setStoredAuth = ({ token, user }) => {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
  } catch (error) {
    // The signed-in session still works in memory if storage is unavailable.
  }
};

export const clearStoredAuth = () => {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    // Storage is unavailable; there is nothing else to clear.
  }
};

export const getStoredToken = () => getStoredAuth()?.token || null;
