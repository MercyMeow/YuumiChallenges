'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useConvexAvailable } from '@/providers/ConvexProvider';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'editor';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sessionToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'yuumi_guide_session';

// Auth provider that uses Convex for authentication
function AuthProviderWithConvex({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      setSessionToken(stored);
    }
    setIsLoading(false);
  }, []);

  // Verify session
  const sessionData = useQuery(
    api.auth.verifySession,
    sessionToken ? { sessionToken } : 'skip'
  );

  const user = sessionData?.user ?? null;

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginMutation({ username, password });
      localStorage.setItem(SESSION_KEY, result.token);
      setSessionToken(result.token);
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    if (sessionToken) {
      await logoutMutation({ sessionToken });
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
  }, [sessionToken, logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading:
          isLoading || (sessionToken !== null && sessionData === undefined),
        isAuthenticated: !!user,
        login,
        logout,
        sessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Fallback auth provider when Convex is not available
function AuthProviderFallback({ children }: { children: ReactNode }) {
  const noopLogin = useCallback(async () => {
    throw new Error('Authentication not available: Convex is not configured');
  }, []);

  const noopLogout = useCallback(async () => {
    // No-op when Convex is not available
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: noopLogin,
        logout: noopLogout,
        sessionToken: null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isConvexAvailable = useConvexAvailable();

  if (!isConvexAvailable) {
    return <AuthProviderFallback>{children}</AuthProviderFallback>;
  }

  return <AuthProviderWithConvex>{children}</AuthProviderWithConvex>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
