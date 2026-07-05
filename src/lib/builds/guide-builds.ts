// Guide builds curated in Convex (seeded via convex/seed.ts, edited in
// /admin/builds). Fail-soft: any error yields null and callers fall back to
// the static build data. Uses ConvexHttpClient so public pages don't depend
// on the React provider being configured.

import type { FunctionReturnType } from 'convex/server';
import { api } from '../../../convex/_generated/api';
import { queryConvex } from '../convex/http';

export type GuideBuildDoc = FunctionReturnType<
  typeof api.guide.getBuilds
>[number];

export async function fetchGuideBuilds(): Promise<GuideBuildDoc[] | null> {
  const builds = await queryConvex(api.guide.getBuilds, {});
  return builds && builds.length > 0 ? builds : null;
}
