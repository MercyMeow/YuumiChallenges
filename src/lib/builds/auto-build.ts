// Auto-scraped Yuumi build stored in Convex guideMetadata['autoBuild'] by
// convex/scraper.ts:autoUpdateBuild (daily cron). Everything here is
// fail-soft: any error yields null and callers fall back to static data.
//
// Schema/types live in ./auto-build-shared (pure, Convex-safe); this module
// adds the browser/server fetch and re-exports the schema pieces for
// back-compat so callers keep importing from '@/lib/builds/auto-build'.

import { fetchMetadataValue } from '../convex/http';
import {
  AUTO_BUILD_METADATA_KEY,
  parseAutoBuild,
  type AutoBuild,
} from './auto-build-shared';

export {
  autoBuildSchema,
  parseAutoBuild,
  AUTO_BUILD_METADATA_KEY,
  RUNE_STYLE_NAMES,
  type AutoBuild,
} from './auto-build-shared';

/**
 * Server-side fetch (generateMetadata, OG image). Returns null when Convex
 * is not configured, unreachable, or holds no/invalid auto build.
 */
export async function fetchAutoBuild(): Promise<AutoBuild | null> {
  return parseAutoBuild(await fetchMetadataValue(AUTO_BUILD_METADATA_KEY));
}
