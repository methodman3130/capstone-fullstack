import axios from 'axios';

/**
 * One axios instance for the whole app.
 *
 * Why not call axios.get('http://localhost:5000/...') everywhere?
 * Because then the base URL and the auth header are copy-pasted into
 * every component, and changing either means editing twenty files.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

export const TOKEN_KEY = 'capstone2_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked (private mode) - the app still works for this session */
  }
}

/**
 * REQUEST interceptor: attach the JWT to every outgoing request.
 * Reading from storage each time means a logout in another tab takes effect here.
 */
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * RESPONSE interceptor: handle expired/invalid tokens in one place.
 *
 * A 401 means the token is dead. Clear it and bounce to login rather than
 * letting every page render its own broken state.
 */
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      setStoredToken(null);
      if (onUnauthorized) onUnauthorized();
    }

    // Normalise the error so components can always read error.message,
    // whether the API replied with JSON or the network died entirely.
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.join('. ') ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the API. Is the server running on port 5000?'
        : error.message) ||
      'Something went wrong';

    return Promise.reject(Object.assign(new Error(message), { status }));
  }
);

export default api;
