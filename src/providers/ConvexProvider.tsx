'use client';

import {
  ConvexProvider as ConvexReactProvider,
  ConvexReactClient,
} from 'convex/react';
import { ReactNode, useMemo } from 'react';

// NEXT_PUBLIC_* values are inlined at BUILD time; a build environment
// without the variable (e.g. Cloudflare Workers Builds) would otherwise
// crash prerendering ("Could not find Convex client") and, even if it
// built, ship a bundle with Convex permanently disabled. The deployment
// URL is public anyway — fall back to production.
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  'https://convex-yuumi-challenges.veiledcat.de';

export function ConvexProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), []);

  return <ConvexReactProvider client={client}>{children}</ConvexReactProvider>;
}
