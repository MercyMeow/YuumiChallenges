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

  const invalidateSession = useCallback(() => {
    sessionGenerationRef.current += 1;
    setUser(null);
    setIsLoading(false);
  }, []);

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

  const login = useCallback(async (username: string, password: string) => {
    const nextUser = await loginAdminRequest(username, password);
    sessionGenerationRef.current += 1;
    setUser(nextUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAdminRequest();
      sessionGenerationRef.current += 1;
      setUser(null);
      setIsLoading(false);
    } catch (error) {
      throw new Error(readErrorMessage(error, 'Unable to log out right now.'));
    }
  }, []);

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
