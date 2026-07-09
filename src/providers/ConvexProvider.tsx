'use client';

import {
  ConvexProvider as ConvexReactProvider,
  ConvexReactClient,
} from 'convex/react';
import { createContext, ReactNode, useContext, useMemo } from 'react';

// NEXT_PUBLIC_* values are inlined at BUILD time; a build environment
// without the variable (e.g. Cloudflare Workers Builds) would otherwise
// crash prerendering ("Could not find Convex client") and, even if it
// built, ship a bundle with Convex permanently disabled. The deployment
// URL is public anyway — fall back to production.
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  'https://convex-yuumi-challenges.veiledcat.de';

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
