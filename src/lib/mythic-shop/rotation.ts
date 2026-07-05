// Current Mythic Shop rotation, stored in Convex guideMetadata['mythicShop'].
// Riot exposes no public shop API (research 2026-07: LCU is client-only,
// community trackers are manual blogs), so the rotation is curated via
// /admin/mythic-shop and rendered with Data Dragon assets. Fail-soft:
// anything invalid yields null and the UI shows the countdown-only state.

import { z } from 'zod';
import { fetchMetadataValue } from '../convex/http';
import type { MythicShopSectionId } from './types';

export const MYTHIC_SHOP_METADATA_KEY = 'mythicShop';

export const mythicItemSchema = z.object({
  name: z.string().min(1),
  /** Data Dragon champion id, e.g. "Pyke", "MissFortune". Empty for non-skin items. */
  champion: z.string(),
  /** Skin number for splash/loading art; 0 = base splash. */
  skinNum: z.number().int().min(0),
  costME: z.number().int().min(0),
  section: z.enum(['featured', 'biweekly', 'weekly', 'daily']),
  kind: z.enum(['skin', 'chroma', 'accessory']).default('skin'),
});

export const mythicRotationSchema = z.object({
  version: z.literal(1),
  updatedAt: z.number(),
  patch: z.string().optional(),
  items: z.array(mythicItemSchema),
});

export type MythicItem = z.infer<typeof mythicItemSchema>;
export type MythicRotation = z.infer<typeof mythicRotationSchema>;

export const SECTION_LABELS: Record<MythicShopSectionId, string> = {
  featured: 'Featured',
  biweekly: 'Bi-weekly',
  weekly: 'Weekly',
  daily: 'Daily',
};

export function parseMythicRotation(
  json: string | undefined | null
): MythicRotation | null {
  if (!json) return null;
  try {
    return mythicRotationSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}

/** Loading-screen card art for a skin via Data Dragon (no version needed). */
export function skinLoadingUrl(item: MythicItem): string | null {
  if (!item.champion) return null;
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${item.champion}_${item.skinNum}.jpg`;
}

/** Wide splash art via Data Dragon. */
export function skinSplashUrl(item: MythicItem): string | null {
  if (!item.champion) return null;
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${item.champion}_${item.skinNum}.jpg`;
}

/** Works on server and client; null when Convex is absent or data invalid. */
export async function fetchMythicRotation(): Promise<MythicRotation | null> {
  return parseMythicRotation(
    await fetchMetadataValue(MYTHIC_SHOP_METADATA_KEY)
  );
}
