// Remembers the last player profile the visitor opened (localStorage) so
// the ladder page can offer a "continue where you left off" pin. Written
// by the profile page, read by the players page; both fail silently when
// storage is unavailable (SSR, private mode, disabled cookies).

const STORAGE_KEY = 'yq:lastViewedProfile';

export type LastViewedProfile = {
  puuid: string;
  platform: string;
  gameName: string;
  tagLine: string;
};

// Snapshot cache so useSyncExternalStore consumers get a referentially
// stable value (a fresh JSON.parse per getSnapshot would loop forever).
let cached: LastViewedProfile | null | undefined;

/** Stable snapshot for useSyncExternalStore; null during SSR. */
export function getLastViewedProfileSnapshot(): LastViewedProfile | null {
  if (cached === undefined) cached = readLastViewedProfile();
  return cached;
}

export function readLastViewedProfile(): LastViewedProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).puuid !== 'string' ||
      typeof (parsed as Record<string, unknown>).platform !== 'string' ||
      typeof (parsed as Record<string, unknown>).gameName !== 'string' ||
      typeof (parsed as Record<string, unknown>).tagLine !== 'string'
    ) {
      return null;
    }
    return parsed as LastViewedProfile;
  } catch {
    return null;
  }
}

export function writeLastViewedProfile(profile: LastViewedProfile): void {
  cached = profile;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or blocked — the pin is a nicety, not a requirement.
  }
}
