import { REGIONS } from '@/lib/utils/constants';

export type RiotRegion = (typeof REGIONS)[keyof typeof REGIONS];
export type RiotPlatform = keyof typeof REGIONS;

export type ParsedRiotMatchId = {
  matchId: string;
  platform: RiotPlatform;
  region: RiotRegion;
  matchNumber: string;
};

export const MIN_RIOT_MATCH_NUMBER_LENGTH = 6;

const VALID_REGIONS = new Set<RiotRegion>(Object.values(REGIONS));
const RIOT_MATCH_ID_PATTERN = /^([A-Z0-9]{2,4})_(\d{6,})$/;

export function isRiotRegion(region: string): region is RiotRegion {
  return VALID_REGIONS.has(region as RiotRegion);
}

export function normalizeRiotMatchId(matchId: string): string {
  const trimmed = matchId.trim();
  const underscoreIndex = trimmed.indexOf('_');

  if (underscoreIndex < 0) {
    return trimmed;
  }

  const platform = trimmed.slice(0, underscoreIndex).toUpperCase();
  const matchNumber = trimmed.slice(underscoreIndex + 1);
  return `${platform}_${matchNumber}`;
}

export function getRiotMatchNumberValidationError(
  matchNumber: string
): string | null {
  const normalizedMatchNumber = matchNumber.trim();

  if (!normalizedMatchNumber) {
    return 'Match ID is required.';
  }

  if (!/^\d+$/.test(normalizedMatchNumber)) {
    return 'Match number must contain digits only.';
  }

  if (normalizedMatchNumber.length < MIN_RIOT_MATCH_NUMBER_LENGTH) {
    return `Match ID looks too short. Enter at least ${MIN_RIOT_MATCH_NUMBER_LENGTH} digits.`;
  }

  return null;
}

export function getRiotMatchIdValidationError(matchId: string): string | null {
  const normalizedMatchId = normalizeRiotMatchId(matchId);

  if (!normalizedMatchId) {
    return 'Match ID is required.';
  }

  if (!normalizedMatchId.includes('_')) {
    return 'Match ID must include a platform prefix like EUW1_123456.';
  }

  const matchParts = normalizedMatchId.match(/^([A-Z0-9]{2,4})_(\d+)$/);
  if (!matchParts) {
    return 'Enter a valid match ID.';
  }

  const [, platform, matchNumber] = matchParts;
  if (!platform || !matchNumber) {
    return 'Enter a valid match ID.';
  }

  const normalizedPlatform = platform.toUpperCase();
  if (!(normalizedPlatform in REGIONS)) {
    return `Unsupported region prefix: ${normalizedPlatform}.`;
  }

  return getRiotMatchNumberValidationError(matchNumber);
}

export function parseRiotMatchId(matchId: string): ParsedRiotMatchId | null {
  const normalizedMatchId = normalizeRiotMatchId(matchId);
  const matchParts = normalizedMatchId.match(RIOT_MATCH_ID_PATTERN);

  if (!matchParts) {
    return null;
  }

  const [, rawPlatform, matchNumber] = matchParts;
  if (!rawPlatform || !matchNumber) {
    return null;
  }

  const platform = rawPlatform.toUpperCase() as RiotPlatform;
  const region = REGIONS[platform];
  if (!region || !isRiotRegion(region)) {
    return null;
  }

  return {
    matchId: `${platform}_${matchNumber}`,
    platform,
    region,
    matchNumber,
  };
}
