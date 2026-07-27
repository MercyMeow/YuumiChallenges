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
  AdminClientError,
  fetchAdminSession,
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
  const sessionGenerationRef = useRef(0);
  const authChannelRef = useRef<BroadcastChannel | null>(null);

  const clearSession = useCallback(() => {
    sessionGenerationRef.current += 1;
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
    const requestGeneration = sessionGenerationRef.current;
    try {
      const sessionUser = await fetchAdminSession();
      if (requestGeneration === sessionGenerationRef.current) {
        setUser(sessionUser);
        return sessionUser;
      }
      return null;
    } catch {
      if (requestGeneration === sessionGenerationRef.current) {
        setUser(null);
      }
      return null;
    } finally {
      if (requestGeneration === sessionGenerationRef.current) {
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
      sessionGenerationRef.current += 1;
      setUser(nextUser);
      setIsLoading(false);
      broadcastAuthMessage({ type: 'session-changed' });
    },
    [broadcastAuthMessage]
  );

  const logout = useCallback(async () => {
    try {
      await logoutAdminRequest();
      sessionGenerationRef.current += 1;
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
