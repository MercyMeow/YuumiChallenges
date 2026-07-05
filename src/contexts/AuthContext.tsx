'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useSyncExternalStore,
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

// Session token store backed by localStorage, read via useSyncExternalStore.
// The server snapshot is `null` so SSR and the first client paint render the
// logged-out state; the stored token is picked up right after hydration
// (same timing as the previous read-localStorage-on-mount effect).
const sessionTokenListeners = new Set<() => void>();

function subscribeToSessionToken(onStoreChange: () => void): () => void {
  sessionTokenListeners.add(onStoreChange);
  return () => {
    sessionTokenListeners.delete(onStoreChange);
  };
}

function getSessionTokenSnapshot(): string | null {
  // `|| null` treats an empty stored value as "no session", matching the old
  // `if (stored) setSessionToken(stored)` behavior.
  return localStorage.getItem(SESSION_KEY) || null;
}

function getServerSessionTokenSnapshot(): null {
  return null;
}

function setStoredSessionToken(token: string | null): void {
  if (token === null) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, token);
  }
  sessionTokenListeners.forEach((listener) => listener());
}

// Hydration flag: `false` on the server / during hydration, `true` right
// after — mirrors the old `isLoading` state that flipped in a mount effect.
const subscribeToNothing = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

// Auth provider that uses Convex for authentication
function AuthProviderWithConvex({ children }: { children: ReactNode }) {
  const sessionToken = useSyncExternalStore(
    subscribeToSessionToken,
    getSessionTokenSnapshot,
    getServerSessionTokenSnapshot
  );
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );

  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  // Verify session
  const sessionData = useQuery(
    api.auth.verifySession,
    sessionToken ? { sessionToken } : 'skip'
  );

  const user = sessionData?.user ?? null;

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginMutation({ username, password });
      setStoredSessionToken(result.token);
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    if (sessionToken) {
      await logoutMutation({ sessionToken });
    }
    setStoredSessionToken(null);
  }, [sessionToken, logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading:
          !isHydrated || (sessionToken !== null && sessionData === undefined),
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
