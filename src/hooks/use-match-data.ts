/**
 * Custom hook for managing match data fetching and processing
 * Consolidates data transformation and derived values
 */

import { useState, useEffect, useMemo } from 'react';
import {
  MatchDetailsSuccessPayload,
  MatchDetailsResponse,
  TeamTotalsBySide,
  ExtendedMatchTeam,
  isMatchDetailsSuccess,
} from '@/components/match-details';
import {
  getGameModeDisplayName,
  getGameModeCategoryColor,
} from '@/lib/utils/game-modes';
import {
  RawTimelineData,
  RawTimelineFrame,
  RawTimelineEvent,
} from '@/lib/types/item-timeline-new';

export function useMatchData(matchId: string) {
  const [data, setData] = useState<MatchDetailsSuccessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const fetchMatchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(window.location.href);
        const useExample = url.searchParams.get('useExample') === '1';
        const apiUrl = `/api/match-details/${matchId}${useExample ? '?useExample=1' : ''}`;

        const response = await fetch(apiUrl, { cache: 'no-store' });
        const payload = (await response.json()) as MatchDetailsResponse;

        if (!response.ok || !isMatchDetailsSuccess(payload)) {
          const errorMessage =
            (typeof payload === 'object' && payload && 'error' in payload
              ? String(payload.error)
              : undefined) || 'Failed to fetch match details';
          throw new Error(errorMessage);
        }

        setData(payload);
      } catch (err) {
        console.error('Error fetching match details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  // Calculate team totals
  const teamTotals = useMemo<TeamTotalsBySide>(() => {
    if (!data?.matchData?.info?.participants) {
      return {
        blue: { damage: 0, taken: 0, gold: 0, kills: 0 },
        red: { damage: 0, taken: 0, gold: 0, kills: 0 },
      };
    }

    const blueTeam = data.matchData.info.participants.filter(
      (p) => p.teamId === 100
    );
    const redTeam = data.matchData.info.participants.filter(
      (p) => p.teamId === 200
    );

    const blueTotals = {
      damage: blueTeam.reduce(
        (sum, p) => sum + p.totalDamageDealtToChampions,
        0
      ),
      taken: blueTeam.reduce((sum, p) => sum + p.totalDamageTaken, 0),
      gold: blueTeam.reduce((sum, p) => sum + p.goldEarned, 0),
      kills: blueTeam.reduce((sum, p) => sum + p.kills, 0),
    };
    const redTotals = {
      damage: redTeam.reduce(
        (sum, p) => sum + p.totalDamageDealtToChampions,
        0
      ),
      taken: redTeam.reduce((sum, p) => sum + p.totalDamageTaken, 0),
      gold: redTeam.reduce((sum, p) => sum + p.goldEarned, 0),
      kills: redTeam.reduce((sum, p) => sum + p.kills, 0),
    };
    return { blue: blueTotals, red: redTotals };
  }, [data]);

  // Process raw timeline data
  const rawTimelineData = useMemo<RawTimelineData | null>(() => {
    if (
      !data?.timelineData?.info ||
      !Array.isArray(data.timelineData.info.frames) ||
      data.timelineData.info.frames.length === 0
    ) {
      return null;
    }

    return {
      info: {
        frameInterval: data.timelineData.info.frameInterval,
        frames: data.timelineData.info.frames.map<RawTimelineFrame>(
          (frame) => ({
            timestamp: frame.timestamp,
            events: (frame.events || []) as RawTimelineEvent[],
          })
        ),
      },
    };
  }, [data?.timelineData]);

  // Game mode information
  const gameModeInfo = useMemo(() => {
    if (!data?.matchData?.info?.queueId) {
      return { gameMode: 'Unknown', gameModeColor: 'text-white' };
    }

    const queueId = data.matchData.info.queueId;
    const gameMode = getGameModeDisplayName(queueId);
    const gameModeColor = getGameModeCategoryColor(
      queueId === 420 || queueId === 440
        ? 'ranked'
        : queueId === 450
          ? 'aram'
          : 'normal'
    );

    return { gameMode, gameModeColor };
  }, [data?.matchData?.info?.queueId]);

  // Team data
  const teams = useMemo(() => {
    if (!data?.matchData?.info) {
      return {
        blueTeam: [],
        redTeam: [],
        blueTeamData: undefined,
        redTeamData: undefined,
      };
    }

    const blueTeam = data.matchData.info.participants.filter(
      (p) => p.teamId === 100
    );
    const redTeam = data.matchData.info.participants.filter(
      (p) => p.teamId === 200
    );
    const blueTeamData = data.matchData.info.teams.find(
      (team): team is ExtendedMatchTeam => team.teamId === 100
    );
    const redTeamData = data.matchData.info.teams.find(
      (team): team is ExtendedMatchTeam => team.teamId === 200
    );

    return { blueTeam, redTeam, blueTeamData, redTeamData };
  }, [data?.matchData?.info]);

  return {
    data,
    loading,
    error,
    teamTotals,
    rawTimelineData,
    gameModeInfo,
    teams,
  };
}
