// Guide builds curated in Convex (seeded via convex/seed.ts, edited in
// /admin/builds). Fail-soft: any error yields null and callers fall back to
// the static build data. Uses ConvexHttpClient so public pages don't depend
// on the React provider being configured.

import { ConvexHttpClient } from 'convex/browser';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../../convex/_generated/api';

export type GuideBuildDoc = FunctionReturnType<
  typeof api.guide.getBuilds
>[number];

export async function fetchGuideBuilds(): Promise<GuideBuildDoc[] | null> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  try {
    const client = new ConvexHttpClient(convexUrl);
    const builds = await client.query(api.guide.getBuilds, {});
    return builds.length > 0 ? builds : null;
  } catch {
    return null;
  }
}
