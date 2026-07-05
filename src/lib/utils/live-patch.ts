// Server-side helper for the current League patch via Data Dragon.
// Cached for an hour so metadata/OG images auto-follow new patches.

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

/** Single source of truth for the emergency Data Dragon fallback version. */
export const FALLBACK_DDRAGON_VERSION = '16.13.1';

export async function getLiveDdragonVersion(): Promise<string> {
  try {
    const res = await fetch(VERSIONS_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return FALLBACK_DDRAGON_VERSION;
    const versions: string[] = await res.json();
    return versions?.[0] ?? FALLBACK_DDRAGON_VERSION;
  } catch {
    return FALLBACK_DDRAGON_VERSION;
  }
}

/** '16.13.1' -> '16.13' (the patch label shown in the guide). */
export function toGuidePatch(version: string): string {
  const [major, minor] = version.split('.');
  return major && minor ? `${major}.${minor}` : version;
}
