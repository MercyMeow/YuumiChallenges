// Auto-scraped Yuumi build stored in Convex guideMetadata['autoBuild']
// by convex/scraper.ts:autoUpdateBuild (daily cron). Everything here is
// fail-soft: any error yields null and callers fall back to static data.

import { z } from 'zod';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

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
  } catch {
    return null;
  }
}

/**
 * Server-side fetch (generateMetadata, OG image). Returns null when Convex
 * is not configured, unreachable, or holds no/invalid auto build.
 */
export async function fetchAutoBuild(): Promise<AutoBuild | null> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  try {
    const client = new ConvexHttpClient(convexUrl);
    const metadata: Record<string, string> = await client.query(
      api.guide.getMetadata,
      {}
    );
    return parseAutoBuild(metadata[AUTO_BUILD_METADATA_KEY]);
  } catch {
    return null;
  }
}

export const AUTO_BUILD_METADATA_KEY = 'autoBuild';

/** Riot rune style (tree) IDs -> display names. */
export const RUNE_STYLE_NAMES: Record<number, string> = {
  8000: 'Precision',
  8100: 'Domination',
  8200: 'Sorcery',
  8300: 'Inspiration',
  8400: 'Resolve',
};
