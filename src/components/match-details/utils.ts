/**
 * Match Details - Utility functions
 * Helper functions extracted from the original match details page
 */

import {
  RawTimelineData,
  RawTimelineEvent,
} from '@/lib/types/item-timeline-new';
import {
  DetailedMatchParticipant,
  ParticipantChallenges,
  ParticipantPerks,
  isDetailedMatchData,
} from '@/lib/types';
import { MatchDetailsSuccessPayload, MatchDetailsResponse } from './types';

/**
 * Helper to get object keys with proper typing
 */
export const objectKeys = <T extends Record<string, unknown | undefined>>(
  obj: T
) => Object.keys(obj) as Array<keyof T>;

/**
 * Convert raw events array to typed RawTimelineEvent array
 */
export const toRawTimelineEvents = (
  events: Array<Record<string, unknown>> | undefined
): RawTimelineEvent[] => {
  if (!events) {
    return [];
  }

  return events
    .filter((event): event is RawTimelineEvent => {
      if (typeof event !== 'object' || event === null) {
        return false;
      }
      const typed = event as RawTimelineEvent;
      return (
        typeof typed.type === 'string' && typeof typed.timestamp === 'number'
      );
    })
    .map((event) => ({ ...event }));
};

/**
 * Type guard for RawTimelineData
 */
export const isRawTimelineData = (value: unknown): value is RawTimelineData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const info = (value as RawTimelineData).info;
  return (
    !!info &&
    typeof info.frameInterval === 'number' &&
    Array.isArray(info.frames)
  );
};

/**
 * Type guard for successful match details response
 */
export const isMatchDetailsSuccess = (
  payload: MatchDetailsResponse
): payload is MatchDetailsSuccessPayload => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    (payload as { success?: boolean }).success !== true
  ) {
    return false;
  }

  const candidate = payload as MatchDetailsSuccessPayload;
  if (!isDetailedMatchData(candidate.matchData)) {
    return false;
  }

  const timeline = candidate.timelineData;
  return timeline == null || isRawTimelineData(timeline);
};

/**
 * Compute rune metrics for a participant
 */
export function computeRuneMetrics(
  participant?: DetailedMatchParticipant | null
) {
  const metrics: Record<string, { label: string; value: string }> = {};
  if (!participant) {
    return metrics;
  }

  const perks: ParticipantPerks | undefined = participant.perks;
  const primary = perks?.styles?.find(
    (style) => style.description === 'primaryStyle'
  );
  const keystone = primary?.selections?.[0];
  if (keystone?.perk != null) {
    const kVar1 = Number.isFinite(keystone.var1) ? keystone.var1 : null;
    const kVar2 = Number.isFinite(keystone.var2) ? keystone.var2 : null;
    const kVar3 = Number.isFinite(keystone.var3) ? keystone.var3 : null;

    const keystoneParts: string[] = [];
    if (kVar1 != null) keystoneParts.push(`v1:${kVar1}`);
    if (kVar2 != null) keystoneParts.push(`v2:${kVar2}`);
    if (kVar3 != null) keystoneParts.push(`v3:${kVar3}`);

    metrics[`keystone_${keystone.perk}`] = {
      label: 'Keystone Vars',
      value: keystoneParts.length > 0 ? keystoneParts.join(' ') : 'n/a',
    };
  }

  const challenges: ParticipantChallenges | undefined = participant.challenges;
  const totals = [
    ['triumphHealing', 'Triumph Heal'],
    ['cheapShotDamage', 'Cheap Shot Dmg'],
    ['shieldBashDamage', 'Shield Bash Dmg'],
    ['scorchDamage', 'Scorch Dmg'],
    ['lastStandDamage', 'Last Stand Dmg'],
    ['timeCCingOthers', 'CC Time'],
    ['totalHealsOnTeammates', 'Heals on Allies'],
    ['totalDamageShieldedOnTeammates', 'Shields on Allies'],
  ] as const;

  if (challenges) {
    for (const [key, label] of totals) {
      const value = challenges[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        const formatted =
          key === 'timeCCingOthers'
            ? `${Math.round(value)} s`
            : `${Math.round(value)}`;
        metrics[key] = { label, value: formatted };
      }
    }
  }

  const shards = perks?.statPerks;
  if (shards) {
    metrics.shards = {
      label: 'Shards',
      value: `O:${shards.offense ?? 0} F:${shards.flex ?? 0} D:${shards.defense ?? 0}`,
    };
  }

  return metrics;
}

/**
 * Get KDA color based on K/D/A values
 */
export const getKDAColor = (
  kills: number,
  deaths: number,
  assists: number
): string => {
  const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  if (kda >= 5) return 'text-yellow-400';
  if (kda >= 3) return 'text-green-400';
  if (kda >= 2) return 'text-blue-400';
  return 'text-white/70';
};

/**
 * Format large numbers with K/M suffix
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format match duration from seconds
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
