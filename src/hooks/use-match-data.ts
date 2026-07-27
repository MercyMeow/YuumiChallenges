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
  getRiotMatchIdValidationError,
  normalizeRiotMatchId,
} from '@/lib/apis/riot';
import {
  getGameModeDisplayName,
  getGameModeCategoryColor,
} from '@/lib/utils/game-modes';
import {
  RawTimelineData,
  RawTimelineFrame,
  RawTimelineEvent,
} from '@/lib/types/item-timeline-new';

function getMatchRequestError(
  payload: MatchDetailsResponse,
  fallbackMessage: string
) {
  const errorMessage =
    typeof payload === 'object' && payload && 'error' in payload
      ? String(payload.error)
      : fallbackMessage;

  if (
    typeof payload === 'object' &&
    payload &&
    'retryAfterSeconds' in payload &&
    typeof payload.retryAfterSeconds === 'number'
  ) {
    return `${errorMessage} Retry after ${payload.retryAfterSeconds} seconds.`;
  }

  return errorMessage;
}

export function useMatchData(matchId: string) {
  const normalizedMatchId = normalizeRiotMatchId(matchId);
  const validationError = normalizedMatchId
    ? getRiotMatchIdValidationError(normalizedMatchId)
    : null;
  const [data, setData] = useState<MatchDetailsSuccessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (!normalizedMatchId || validationError) {
      return;
    }

    const abortController = new AbortController();
    let ignoreResponse = false;

    const fetchMatchDetails = async () => {
      setLoading(true);
      setRequestError(null);
      setData(null);

      try {
        const url = new URL(window.location.href);
        const useExample = url.searchParams.get('useExample') === '1';
        const apiUrl = `/api/match-details/${encodeURIComponent(normalizedMatchId)}${useExample ? '?useExample=1' : ''}`;

        const response = await fetch(apiUrl, {
          cache: 'no-store',
          signal: abortController.signal,
        });
        const payload = (await response.json()) as MatchDetailsResponse;

        if (ignoreResponse) {
          return;
        }

        if (!response.ok || !isMatchDetailsSuccess(payload)) {
          throw new Error(
            getMatchRequestError(payload, 'Failed to fetch match details')
          );
        }

        setData(payload);
      } catch (err) {
        if (
          ignoreResponse ||
          abortController.signal.aborted ||
          (err instanceof DOMException && err.name === 'AbortError')
        ) {
          return;
        }

        console.error('Error fetching match details:', err);
        setRequestError(
          err instanceof Error ? err.message : 'Unknown error occurred'
        );
      } finally {
        if (!ignoreResponse) {
          setLoading(false);
        }
      }
    };

    fetchMatchDetails();

    return () => {
      ignoreResponse = true;
      abortController.abort();
    };
  }, [normalizedMatchId, validationError]);

  const resolvedData = !normalizedMatchId || validationError ? null : data;
  const error = validationError ?? requestError;
  const isLoading = normalizedMatchId && !validationError ? loading : false;

  // Calculate team totals
  const teamTotals = useMemo<TeamTotalsBySide>(() => {
    if (!resolvedData?.matchData?.info?.participants) {
      return {
        blue: { damage: 0, taken: 0, gold: 0, kills: 0 },
        red: { damage: 0, taken: 0, gold: 0, kills: 0 },
      };
    }

    const blueTeam = resolvedData.matchData.info.participants.filter(
      (p) => p.teamId === 100
    );
    const redTeam = resolvedData.matchData.info.participants.filter(
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
  }, [resolvedData]);

  // Process raw timeline data
  const timelineData = resolvedData?.timelineData;
  const rawTimelineData = useMemo<RawTimelineData | null>(() => {
    if (
      !timelineData?.info ||
      !Array.isArray(timelineData.info.frames) ||
      timelineData.info.frames.length === 0
    ) {
      return null;
    }

    return {
      info: {
        frameInterval: timelineData.info.frameInterval,
        frames: timelineData.info.frames.map<RawTimelineFrame>((frame) => ({
          timestamp: frame.timestamp,
          events: (frame.events || []) as RawTimelineEvent[],
        })),
      },
    };
  }, [timelineData]);

  // Game mode information
  const queueId = resolvedData?.matchData?.info?.queueId;
  const gameModeInfo = useMemo(() => {
    if (!queueId) {
      return { gameMode: 'Unknown', gameModeColor: 'text-white' };
    }

    const gameMode = getGameModeDisplayName(queueId);
    const gameModeColor = getGameModeCategoryColor(
      queueId === 420 || queueId === 440
        ? 'ranked'
        : queueId === 450
          ? 'aram'
          : 'normal'
    );

    return { gameMode, gameModeColor };
  }, [queueId]);

  // Team data
  const matchInfo = resolvedData?.matchData?.info;
  const teams = useMemo(() => {
    if (!matchInfo) {
      return {
        blueTeam: [],
        redTeam: [],
        blueTeamData: undefined,
        redTeamData: undefined,
      };
    }

    const blueTeam = matchInfo.participants.filter((p) => p.teamId === 100);
    const redTeam = matchInfo.participants.filter((p) => p.teamId === 200);
    const blueTeamData = matchInfo.teams.find(
      (team): team is ExtendedMatchTeam => team.teamId === 100
    );
    const redTeamData = matchInfo.teams.find(
      (team): team is ExtendedMatchTeam => team.teamId === 200
    );

    return { blueTeam, redTeam, blueTeamData, redTeamData };
  }, [matchInfo]);

  return {
    data: resolvedData,
    loading: isLoading,
    error,
    teamTotals,
    rawTimelineData,
    gameModeInfo,
    teams,
  };
}
