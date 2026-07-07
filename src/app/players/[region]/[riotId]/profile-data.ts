import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import { platformFromSlug } from '@/lib/highelo/regions';

export type ProfileParams = {
  platform: string;
  gameName: string;
  tagLine: string;
};

/**
 * Splits `/players/[region]/[riotId]` params into query args. Riot game
 * names may contain hyphens; tag lines cannot, so split on the last one.
 */
export function parseProfileParams(
  region: string,
  riotId: string
): ProfileParams | null {
  const platform = platformFromSlug(region);
  let decoded: string;
  try {
    decoded = decodeURIComponent(riotId);
  } catch {
    return null;
  }
  const sep = decoded.lastIndexOf('-');
  if (!platform || sep <= 0) return null;
  return {
    platform,
    gameName: decoded.slice(0, sep),
    tagLine: decoded.slice(sep + 1),
  };
}

/** Server-side profile fetch for metadata and the OG card. */
export async function fetchProfile(params: { region: string; riotId: string }) {
  const parsed = parseProfileParams(params.region, params.riotId);
  if (!parsed) return null;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  try {
    const client = new ConvexHttpClient(url);
    return await client.query(api.highelo.getPlayerProfile, parsed);
  } catch {
    return null;
  }
}
