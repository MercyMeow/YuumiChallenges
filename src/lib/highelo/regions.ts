// Riot platform id <-> human region label helpers shared by the high-elo
// games feed, the ladder, and profile URLs.

export const PLATFORM_LABELS: Record<string, string> = {
  br1: 'BR',
  eun1: 'EUNE',
  euw1: 'EUW',
  jp1: 'JP',
  kr: 'KR',
  la1: 'LAN',
  la2: 'LAS',
  me1: 'ME',
  na1: 'NA',
  oc1: 'OCE',
  ru: 'RU',
  sg2: 'SEA',
  tr1: 'TR',
  tw2: 'TW',
  vn2: 'VN',
};

export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform.toUpperCase();
}

/** URL slug for a platform, e.g. 'euw1' -> 'euw'. */
export function regionSlug(platform: string): string {
  return platformLabel(platform).toLowerCase();
}

/** Reverse of {@link regionSlug}; returns null for unknown slugs. */
export function platformFromSlug(slug: string): string | null {
  const entry = Object.entries(PLATFORM_LABELS).find(
    ([, label]) => label.toLowerCase() === slug.toLowerCase()
  );
  return entry ? entry[0] : null;
}
