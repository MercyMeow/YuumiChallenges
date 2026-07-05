// Pure schema + types for the auto-scraped Yuumi build. No Convex-client or
// React deps, so this is safe to bundle into Convex functions (convex/seed.ts,
// convex/scraper.ts) alongside the browser/server code. The Convex HTTP fetch
// lives in ./auto-build, which re-exports everything here for back-compat.

import { z } from 'zod';

const runeSchema = z.object({
  id: z.number(),
  name: z.string(),
  key: z.string(),
  icon: z.string(),
});

export const autoBuildSchema = z.object({
  version: z.literal(1),
  patch: z.string(),
  updatedAt: z.number(),
  source: z.string(),
  runes: z.object({
    primaryStyleId: z.number().nullable(),
    secondaryStyleId: z.number().nullable(),
    keystone: runeSchema,
    primary: z.array(runeSchema).min(3),
    secondary: z.array(runeSchema).min(2),
    shardKeys: z.array(z.string()),
  }),
  coreItems: z.array(z.object({ id: z.number(), name: z.string() })).min(2),
  boots: z.object({ id: z.number(), name: z.string() }).nullable(),
  skillPriority: z.array(z.string()).length(3),
  skillOrder: z.array(z.string()).length(18).nullable(),
});

export type AutoBuild = z.infer<typeof autoBuildSchema>;

export function parseAutoBuild(
  json: string | undefined | null
): AutoBuild | null {
  if (!json) return null;
  try {
    return autoBuildSchema.parse(JSON.parse(json));
  } catch (error) {
    // Surface schema regressions / corrupt payloads instead of failing
    // silently — callers still fall back to static data.
    console.error('[auto-build] Failed to parse stored autoBuild JSON:', error);
    return null;
  }
}

/** guideMetadata key the auto build JSON is stored under. */
export const AUTO_BUILD_METADATA_KEY = 'autoBuild';

/** Riot rune style (tree) IDs -> display names. */
export const RUNE_STYLE_NAMES: Record<number, string> = {
  8000: 'Precision',
  8100: 'Domination',
  8200: 'Sorcery',
  8300: 'Inspiration',
  8400: 'Resolve',
};
