import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { fetchSession, joinRoom } from '../lib/api';
import {
  clearSession,
  loadPrefill,
  loadToken,
  savePrefill,
  saveSession,
} from '../lib/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null); // { room, user }
  const [token, setToken] = useState(() => loadToken());
  const [isRestoring, setIsRestoring] = useState(Boolean(loadToken()));

  // On first load, a surviving 60-day token is exchanged for the session so the
  // user lands straight back in their room without typing anything.
  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setIsRestoring(false);
      return undefined;
    }

    (async () => {
      try {
        const data = await fetchSession();
        if (!cancelled) setSession({ room: data.room, user: data.user });
      } catch (error) {
        // Network blips must not throw away a token that is still good.
        if (!cancelled && error.code !== 'NETWORK') {
          clearSession();
          setToken(null);
          setSession(null);
        }
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally runs once: later token changes come from login/logout,
    // which already set the session themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async ({ roomId, password, name }) => {
    const data = await joinRoom({ roomId, password, name });

    saveSession(data.token, data.expiresInDays);
    savePrefill({ roomId: data.room.displayName, name: data.user.name });

    setToken(data.token);
    setSession({ room: data.room, user: data.user });

    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      session,
      room: session?.room ?? null,
      user: session?.user ?? null,
      isAuthenticated: Boolean(token && session),
      isRestoring,
      login,
      logout,
      prefill: loadPrefill(),
    }),
    [token, session, isRestoring, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
};
