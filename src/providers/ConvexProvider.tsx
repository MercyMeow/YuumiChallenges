'use client';

import {
  ConvexProvider as ConvexReactProvider,
  ConvexReactClient,
} from 'convex/react';
import { createContext, ReactNode, useContext, useMemo } from 'react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Context to check if Convex is available
const ConvexAvailableContext = createContext<boolean>(false);

export function useConvexAvailable() {
  return useContext(ConvexAvailableContext);
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    if (!convexUrl) {
      return null;
    }
    return new ConvexReactClient(convexUrl);
  }, []);

  // If Convex URL is not configured, render children without Convex context
  if (!client) {
    return (
      <ConvexAvailableContext.Provider value={false}>
        {children}
      </ConvexAvailableContext.Provider>
    );
  }

  return (
    <ConvexAvailableContext.Provider value={true}>
      <ConvexReactProvider client={client}>{children}</ConvexReactProvider>
    </ConvexAvailableContext.Provider>
  );
}
