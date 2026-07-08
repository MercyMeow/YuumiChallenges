// Home route (server component). Fetches the guide builds and the auto-scraped
// build metadata from Convex on the server so the recommended build — with the
// daily scraped runes/core/boots/skill order already applied by the cron/seed —
// renders without a client round-trip or hardcoded-then-live flash. Falls back
// to static builds when Convex is unreachable. Interactivity lives in
// ./guide-client.

import {
  fetchGuideBuilds,
  type GuideBuildDoc,
} from '@/lib/builds/guide-builds';
import { fetchAutoBuild } from '@/lib/builds/auto-build';
import type { DefaultBuild } from '@/lib/builds/default-builds';
import { YuumiGuide } from './guide-client';

function docToBuild(doc: GuideBuildDoc): DefaultBuild {
  return {
    id: doc._id,
    name: doc.name,
    description: doc.description,
    icon: doc.icon,
    isRecommended: doc.isRecommended,
    runes: doc.runes,
    items: doc.items,
    skillOrder: doc.skillOrder,
  };
}

export default async function Page() {
  const [docs, autoBuild] = await Promise.all([
    fetchGuideBuilds(),
    fetchAutoBuild(),
  ]);
  const initialBuilds = docs ? docs.map(docToBuild) : null;
  return <YuumiGuide initialBuilds={initialBuilds} autoBuild={autoBuild} />;
}
