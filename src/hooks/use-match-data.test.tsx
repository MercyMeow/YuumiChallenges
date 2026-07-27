import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/match-details', () => ({
  isMatchDetailsSuccess: (payload: unknown) =>
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { success?: boolean }).success === true &&
    typeof (payload as { matchData?: unknown }).matchData === 'object',
}));

import { useMatchData } from './use-match-data';

function createSuccessfulPayload() {
  return {
    success: true as const,
    matchId: 'EUW1_123456',
    cached: false,
    example: true,
    matchData: {
      metadata: {
        matchId: 'EUW1_123456',
      },
      info: {
        queueId: 420,
        participants: [
          {
            teamId: 100,
            totalDamageDealtToChampions: 100,
            totalDamageTaken: 40,
            goldEarned: 500,
            kills: 4,
          },
          {
            teamId: 200,
            totalDamageDealtToChampions: 60,
            totalDamageTaken: 90,
            goldEarned: 300,
            kills: 2,
          },
        ],
        teams: [
          { teamId: 100, objectives: {} },
          { teamId: 200, objectives: {} },
        ],
      },
    },
    timelineData: {
      info: {
        frameInterval: 60000,
        frames: [{ timestamp: 60000, events: [] }],
      },
    },
  };
}

describe('useMatchData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.history.replaceState({}, '', '/match/EUW1_123456');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns validation errors without issuing a network request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useMatchData('bad-match-id'));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      'Match ID must include a platform prefix like EUW1_123456.'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the example query flag and exposes derived team data on success', async () => {
    window.history.pushState({}, '', '/match/EUW1_123456?useExample=1');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createSuccessfulPayload(),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useMatchData('euw1_123456'));

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/match-details/EUW1_123456?useExample=1',
      expect.objectContaining({
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      })
    );
    expect(result.current.teamTotals).toEqual({
      blue: { damage: 100, taken: 40, gold: 500, kills: 4 },
      red: { damage: 60, taken: 90, gold: 300, kills: 2 },
    });
    expect(result.current.teams.blueTeam).toHaveLength(1);
    expect(result.current.teams.redTeam).toHaveLength(1);
    expect(result.current.rawTimelineData?.info.frames).toHaveLength(1);
  });

  it('clears every derived view when navigation changes to an invalid id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createSuccessfulPayload(),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ matchId }) => useMatchData(matchId),
      { initialProps: { matchId: 'EUW1_123456' } }
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    rerender({ matchId: 'bad-match-id' });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.rawTimelineData).toBeNull();
    expect(result.current.teamTotals).toEqual({
      blue: { damage: 0, taken: 0, gold: 0, kills: 0 },
      red: { damage: 0, taken: 0, gold: 0, kills: 0 },
    });
    expect(result.current.teams.blueTeam).toEqual([]);
    expect(result.current.teams.redTeam).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('appends retry-after guidance to API errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfterSeconds: 12,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useMatchData('EUW1_123456'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(
      'Rate limit exceeded. Please try again later. Retry after 12 seconds.'
    );
  });
});
