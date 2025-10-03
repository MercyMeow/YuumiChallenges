/**
 * Match Details - Shared TypeScript types
 * Extracted from the original 3092-line match details page
 */

import {
  DetailedMatchData,
  DetailedMatchParticipant,
  DetailedMatchTeam,
} from '@/lib/types';
import { RawTimelineData } from '@/lib/types/item-timeline-new';

export type TeamObjectiveExtra = { first: boolean; kills: number };

export type ExtendedTeamObjectives = DetailedMatchTeam['objectives'] &
  Record<string, TeamObjectiveExtra | undefined>;

export interface ParticipantRuneDetailLike {
  runeId?: unknown;
  statType?: unknown;
  value?: unknown;
}

export interface ParticipantRunesLike {
  details?: ParticipantRuneDetailLike[];
}

export type ExtendedMatchParticipant = DetailedMatchParticipant & {
  runes?: ParticipantRunesLike;
};

export interface ExtendedMatchTeam extends DetailedMatchTeam {
  objectives: ExtendedTeamObjectives;
  feats?: Record<string, { featState: number }>;
}

export type ExtendedMatchInfo = DetailedMatchData['info'] & {
  participants: ExtendedMatchParticipant[];
  teams: ExtendedMatchTeam[];
};

export type ExtendedMatchData = DetailedMatchData & {
  info: ExtendedMatchInfo;
};

export type TeamTotals = {
  damage: number;
  taken: number;
  gold: number;
  kills: number;
};

export type TeamTotalsBySide = {
  blue: TeamTotals;
  red: TeamTotals;
};

export interface MatchDetailsSuccessPayload {
  success: true;
  matchData: ExtendedMatchData;
  timelineData: RawTimelineData | null;
  matchId: string;
  cached?: boolean;
  example?: boolean;
}

export type MatchDetailsErrorPayload = {
  success?: false;
  error?: string;
};

export type MatchDetailsResponse =
  | MatchDetailsSuccessPayload
  | MatchDetailsErrorPayload
  | Record<string, unknown>;

export const CRITICAL_TIMELINE_EVENT_TYPES: ReadonlySet<string> = new Set([
  'CHAMPION_KILL',
  'ELITE_MONSTER_KILL',
  'BUILDING_KILL',
  'DRAGON_SOUL_GIVEN',
] as const);

export type SupportItemTier = 'tier1' | 'tier2' | 'tier3';
export type SupportItemCompletionTimes = Record<SupportItemTier, number | null>;
