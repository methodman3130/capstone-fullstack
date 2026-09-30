import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth';
import { getStoredToken, setStoredToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  // `loading` guards the first paint: without it, a logged-in user sees
  // the login screen flash before /auth/me resolves.
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // Let the axios interceptor log us out when the API returns 401.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  // On boot, exchange a stored token for the real user.
  // Never trust a decoded token payload for display - ask the server.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const stored = getStoredToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        if (!cancelled) {
          setUser(res.data);
          setToken(stored);
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.data);
    return res.data;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.data);
    return res.data;
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
