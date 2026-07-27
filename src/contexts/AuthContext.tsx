'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  advanceAdminSessionEpoch,
  AdminClientError,
  fetchAdminSession,
  getAdminSessionEpoch,
  loginAdminRequest,
  logoutAdminRequest,
  subscribeToAdminAuthorizationFailures,
} from '@/lib/admin/client';
import type { AdminUser } from '@/lib/admin/types';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AdminUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LEGACY_SESSION_KEY = 'yuumi_guide_session';
const ADMIN_AUTH_CHANNEL = 'yuumi-guide-admin-auth';

type AdminAuthMessage = {
  type: 'session-changed' | 'signed-out';
};

function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AdminClientError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<AdminUser | null>(null);
  const authChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearSession = useCallback(() => {
    advanceAdminSessionEpoch();
    userRef.current = null;
    setUser(null);
    setIsLoading(false);
  }, []);

  const broadcastAuthMessage = useCallback((message: AdminAuthMessage) => {
    authChannelRef.current?.postMessage(message);
  }, []);

  const invalidateSession = useCallback(() => {
    clearSession();
    broadcastAuthMessage({ type: 'signed-out' });
  }, [broadcastAuthMessage, clearSession]);

  const refreshSession = useCallback(async (): Promise<AdminUser | null> => {
    const requestEpoch = getAdminSessionEpoch();
    try {
      const sessionUser = await fetchAdminSession();
      if (requestEpoch === getAdminSessionEpoch()) {
        userRef.current = sessionUser;
        setUser(sessionUser);
        return sessionUser;
      }
      return null;
    } catch (error) {
      if (requestEpoch === getAdminSessionEpoch()) {
        if (
          error instanceof AdminClientError &&
          (error.status === 401 || error.status === 403)
        ) {
          userRef.current = null;
          setUser(null);
          return null;
        }
        // A network failure or 5xx is not evidence that the cookie is
        // invalid. Preserve the last authoritative session.
        return userRef.current;
      }
      return null;
    } finally {
      if (requestEpoch === getAdminSessionEpoch()) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(
    () => subscribeToAdminAuthorizationFailures(invalidateSession),
    [invalidateSession]
  );

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(ADMIN_AUTH_CHANNEL);
    authChannelRef.current = channel;
    channel.onmessage = (event: MessageEvent<AdminAuthMessage>) => {
      if (event.data?.type === 'signed-out') {
        clearSession();
        return;
      }
      if (event.data?.type === 'session-changed') {
        advanceAdminSessionEpoch();
        void refreshSession();
      }
    };

    return () => {
      authChannelRef.current = null;
      channel.close();
    };
  }, [clearSession, refreshSession]);

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      // Ignore storage access errors; session auth no longer relies on it.
    }

    const timeoutId = window.setTimeout(() => {
      void refreshSession();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshSession]);

  useEffect(() => {
    const refreshOnFocus = () => {
      void refreshSession();
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      const nextUser = await loginAdminRequest(username, password);
      advanceAdminSessionEpoch();
      userRef.current = nextUser;
      setUser(nextUser);
      setIsLoading(false);
      broadcastAuthMessage({ type: 'session-changed' });
    },
    [broadcastAuthMessage]
  );

  const logout = useCallback(async () => {
    try {
      await logoutAdminRequest();
      advanceAdminSessionEpoch();
      userRef.current = null;
      setUser(null);
      setIsLoading(false);
      broadcastAuthMessage({ type: 'signed-out' });
    } catch (error) {
      throw new Error(readErrorMessage(error, 'Unable to log out right now.'));
    }
  }, [broadcastAuthMessage]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshSession,
    }),
    [isLoading, login, logout, refreshSession, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
