import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RiotAPI, RiotApiError } from '@/lib/apis/riot';
import { getMatchCache } from '@/lib/cache/match-cache';
import { GET } from './route';

const exampleMatchData: Record<string, unknown> = {
  metadata: {
    dataVersion: '2',
    matchId: 'EUW1_123456',
    participants: [],
  },
  info: {
    participants: [],
    queueId: 420,
    teams: [],
  },
};

const exampleTimelineData: Record<string, unknown> = {
  metadata: {
    dataVersion: '2',
    matchId: 'EUW1_123456',
    participants: [],
  },
  info: {
    frameInterval: 60000,
    frames: [],
  },
};

function createMatchFixture(matchId: string) {
  const matchData = structuredClone(exampleMatchData) as {
    metadata?: { matchId?: string };
  };
  if (matchData.metadata) {
    matchData.metadata.matchId = matchId;
  }
  return matchData;
}

function createRequest(url: string) {
  return new NextRequest(url);
}

function createContext(matchId: string) {
  return {
    params: Promise.resolve({ matchId }),
  };
}

async function createExampleDataDirectory(matchId: string) {
  const directory = await mkdtemp(path.join(tmpdir(), 'yuumi-match-test-'));
  await Promise.all([
    writeFile(
      path.join(directory, 'exampleMatchData.json'),
      JSON.stringify(createMatchFixture(matchId))
    ),
    writeFile(
      path.join(directory, 'exampleTimelineData.json'),
      JSON.stringify(exampleTimelineData)
    ),
  ]);
  return directory;
}

describe('match details route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    getMatchCache().clear();
    process.env.RIOT_API_KEY = 'test-riot-key';
    process.env.NEXT_PUBLIC_USE_EXAMPLE_DATA = 'false';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps example and live cache entries isolated for the same match id', async () => {
    const fixtureDirectory = await createExampleDataDirectory('EUW1_123456');
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(fixtureDirectory);

    const detailsSpy = vi
      .spyOn(RiotAPI.prototype, 'getMatchDetails')
      .mockResolvedValue(createMatchFixture('EUW1_123456'));
    const timelineSpy = vi
      .spyOn(RiotAPI.prototype, 'getMatchTimeline')
      .mockResolvedValue(exampleTimelineData);

    try {
      const exampleResponse = await GET(
        createRequest(
          'http://localhost/api/match-details/EUW1_123456?useExample=1'
        ),
        createContext('EUW1_123456')
      );
      const liveResponse = await GET(
        createRequest('http://localhost/api/match-details/EUW1_123456'),
        createContext('EUW1_123456')
      );
      const cachedExampleResponse = await GET(
        createRequest(
          'http://localhost/api/match-details/EUW1_123456?useExample=1'
        ),
        createContext('EUW1_123456')
      );
      const cachedLiveResponse = await GET(
        createRequest('http://localhost/api/match-details/EUW1_123456'),
        createContext('EUW1_123456')
      );

      const exampleBody = await exampleResponse.json();
      const liveBody = await liveResponse.json();
      const cachedExampleBody = await cachedExampleResponse.json();
      const cachedLiveBody = await cachedLiveResponse.json();

      expect(exampleBody).toMatchObject({
        success: true,
        example: true,
        cached: false,
      });
      expect(liveBody).toMatchObject({
        success: true,
        example: false,
        cached: false,
      });
      expect(cachedExampleBody.cached).toBe(true);
      expect(cachedLiveBody.cached).toBe(true);

      expect(detailsSpy).toHaveBeenCalledTimes(1);
      expect(timelineSpy).toHaveBeenCalledTimes(1);
      expect(getMatchCache().size()).toBe(2);
    } finally {
      cwdSpy.mockRestore();
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  it('coalesces concurrent live misses and tolerates timeline fetch failure', async () => {
    let releaseDetails!: () => void;
    const detailsBarrier = new Promise<void>((resolve) => {
      releaseDetails = resolve;
    });

    const detailsSpy = vi
      .spyOn(RiotAPI.prototype, 'getMatchDetails')
      .mockImplementation(async () => {
        await detailsBarrier;
        return createMatchFixture('EUW1_654321');
      });

    const timelineSpy = vi
      .spyOn(RiotAPI.prototype, 'getMatchTimeline')
      .mockRejectedValue(
        new RiotApiError('Timeline temporarily unavailable', {
          status: 429,
          retryAfterSeconds: 9,
          code: 'TIMELINE_RATE_LIMIT',
        })
      );

    const firstResponsePromise = GET(
      createRequest('http://localhost/api/match-details/EUW1_654321'),
      createContext('EUW1_654321')
    );
    const secondResponsePromise = GET(
      createRequest('http://localhost/api/match-details/EUW1_654321'),
      createContext('EUW1_654321')
    );

    releaseDetails();

    const [firstResponse, secondResponse] = await Promise.all([
      firstResponsePromise,
      secondResponsePromise,
    ]);
    const firstBody = await firstResponse.json();
    const secondBody = await secondResponse.json();

    expect(firstBody.success).toBe(true);
    expect(secondBody.success).toBe(true);
    expect(firstBody.timelineData).toBeNull();
    expect(secondBody.timelineData).toBeNull();
    expect(detailsSpy).toHaveBeenCalledTimes(1);
    expect(timelineSpy).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('returns retry metadata when Riot rate limits the match details request', async () => {
    vi.spyOn(RiotAPI.prototype, 'getMatchDetails').mockRejectedValue(
      new RiotApiError('Rate limited by Riot', {
        status: 429,
        retryAfterSeconds: 7,
        code: 'RIOT_HTTP_ERROR',
      })
    );
    const timelineSpy = vi.spyOn(RiotAPI.prototype, 'getMatchTimeline');

    const response = await GET(
      createRequest('http://localhost/api/match-details/EUW1_777777'),
      createContext('EUW1_777777')
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('7');
    expect(body).toMatchObject({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      retryAfterSeconds: 7,
      code: 'RIOT_HTTP_ERROR',
    });
    expect(timelineSpy).not.toHaveBeenCalled();
  });

  it('returns an explicit service error instead of silently using example data without a key', async () => {
    delete process.env.RIOT_API_KEY;
    const detailsSpy = vi.spyOn(RiotAPI.prototype, 'getMatchDetails');
    const cwdSpy = vi.spyOn(process, 'cwd');

    const response = await GET(
      createRequest('http://localhost/api/match-details/EUW1_888888'),
      createContext('EUW1_888888')
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      success: false,
      code: 'MISSING_RIOT_API_KEY',
    });
    expect(detailsSpy).not.toHaveBeenCalled();
    expect(cwdSpy).not.toHaveBeenCalled();
  });
});
