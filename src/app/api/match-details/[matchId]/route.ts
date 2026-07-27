import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { RiotAPI, RiotApiError } from '@/lib/apis/riot';
import {
  getRiotMatchIdValidationError,
  parseRiotMatchId,
} from '@/lib/riot-match-id';
import {
  getMatchCache,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
} from '@/lib/cache/match-cache';
import {
  DetailedMatchData,
  DetailedMatchParticipant,
  isDetailedMatchData,
} from '@/lib/types';

type TimelinePayload = unknown;

type MatchCacheEntry = {
  matchData: DetailedMatchData;
  timelineData: TimelinePayload;
};

type MatchErrorResponseOptions = {
  status: number;
  retryAfterSeconds?: number | null | undefined;
  code?: string | undefined;
};

function shouldUseExampleData(req: NextRequest) {
  const envToggle = process.env.NEXT_PUBLIC_USE_EXAMPLE_DATA === 'true';
  const url = new URL(req.url);
  const queryToggle = url.searchParams.get('useExample') === '1';
  return envToggle || queryToggle;
}

function normalizeParticipants(matchData: DetailedMatchData) {
  const participants = matchData?.info?.participants;
  if (!participants || !Array.isArray(participants)) {
    return;
  }

  const normalized = participants.map<DetailedMatchParticipant>(
    (participant) => ({
      ...participant,
      spell1Casts:
        typeof participant.spell1Casts === 'number'
          ? participant.spell1Casts
          : 0,
      spell2Casts:
        typeof participant.spell2Casts === 'number'
          ? participant.spell2Casts
          : 0,
      spell3Casts:
        typeof participant.spell3Casts === 'number'
          ? participant.spell3Casts
          : 0,
      spell4Casts:
        typeof participant.spell4Casts === 'number'
          ? participant.spell4Casts
          : 0,
      summoner1Casts:
        typeof participant.summoner1Casts === 'number'
          ? participant.summoner1Casts
          : 0,
      summoner2Casts:
        typeof participant.summoner2Casts === 'number'
          ? participant.summoner2Casts
          : 0,
    })
  );

  matchData.info.participants = normalized;
}

function createErrorResponse(
  error: string,
  options: MatchErrorResponseOptions
) {
  const headers = new Headers();

  if (
    typeof options.retryAfterSeconds === 'number' &&
    options.retryAfterSeconds >= 0
  ) {
    headers.set('Retry-After', String(options.retryAfterSeconds));
  }

  return NextResponse.json(
    {
      success: false,
      error,
      status: options.status,
      retryAfterSeconds: options.retryAfterSeconds ?? null,
      code: options.code,
    },
    {
      status: options.status,
      headers,
    }
  );
}

function toClientError(error: RiotApiError) {
  if (error.status === 404) {
    return createErrorResponse(
      'Match not found. Please check the match ID and try again.',
      {
        status: 404,
        code: error.code,
      }
    );
  }

  if (error.status === 429) {
    return createErrorResponse('Rate limit exceeded. Please try again later.', {
      status: 429,
      retryAfterSeconds: error.retryAfterSeconds,
      code: error.code,
    });
  }

  if (error.status === 403) {
    return createErrorResponse('API access denied. Invalid API key.', {
      status: 403,
      code: error.code,
    });
  }

  if (error.status === 400) {
    return createErrorResponse(error.message, {
      status: 400,
      code: error.code,
    });
  }

  if (error.status === 503 && error.code === 'MISSING_RIOT_API_KEY') {
    return createErrorResponse(
      'Live match lookup is not configured. Add a Riot API key or explicitly enable example data.',
      {
        status: 503,
        code: error.code,
      }
    );
  }

  return createErrorResponse('Failed to fetch match data from Riot API', {
    status: error.status ?? 500,
    retryAfterSeconds: error.retryAfterSeconds,
    code: error.code,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;
    const cache = getMatchCache();

    if (!matchId) {
      return createErrorResponse('Match ID is required.', {
        status: 400,
        code: 'INVALID_MATCH_ID',
      });
    }

    const riotApiKey = process.env.RIOT_API_KEY;
    const matchIdError = getRiotMatchIdValidationError(matchId);
    if (matchIdError) {
      return createErrorResponse(matchIdError, {
        status: 400,
        code: 'INVALID_MATCH_ID',
      });
    }

    const parsedMatchId = parseRiotMatchId(matchId);
    if (!parsedMatchId) {
      return createErrorResponse('Enter a valid match ID.', {
        status: 400,
        code: 'INVALID_MATCH_ID',
      });
    }

    const useExample = shouldUseExampleData(request);
    const cacheKey = generateCacheKey(
      CACHE_KEYS.MATCH_DETAILS,
      useExample ? 'example' : 'live',
      parsedMatchId.matchId
    );

    // Check cache first
    const cachedData = cache.get<MatchCacheEntry>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        ...cachedData,
        matchId:
          cachedData.matchData.metadata?.matchId ?? parsedMatchId.matchId,
        cached: true,
        example: useExample,
      });
    }

    try {
      const dataToCache = await cache.getOrCreateInFlight(
        cacheKey,
        async (): Promise<MatchCacheEntry> => {
          if (useExample) {
            const rootDir = process.cwd();
            const matchPath = path.join(rootDir, 'exampleMatchData.json');
            const timelinePath = path.join(rootDir, 'exampleTimelineData.json');

            const [matchRaw, timelineRaw] = await Promise.all([
              readFile(matchPath, 'utf-8'),
              readFile(timelinePath, 'utf-8').catch(() => null),
            ]);

            const parsedMatch = JSON.parse(matchRaw) as unknown;
            if (!isDetailedMatchData(parsedMatch)) {
              throw new Error('Example match data is malformed');
            }

            const matchData = parsedMatch;
            const timelineData = timelineRaw
              ? (JSON.parse(timelineRaw) as TimelinePayload)
              : null;

            normalizeParticipants(matchData);

            const nextEntry = { matchData, timelineData };
            cache.set(cacheKey, nextEntry, CACHE_TTL.MATCH_DETAILS);
            return nextEntry;
          }

          if (!riotApiKey) {
            throw new RiotApiError('Riot API key not configured', {
              status: 503,
              code: 'MISSING_RIOT_API_KEY',
            });
          }

          const riotAPI = new RiotAPI(riotApiKey);
          const matchDataRaw = await riotAPI.getMatchDetails(
            parsedMatchId.matchId,
            parsedMatchId.region
          );

          if (!isDetailedMatchData(matchDataRaw)) {
            throw new RiotApiError('Riot API returned unexpected match shape', {
              status: 502,
              code: 'INVALID_MATCH_PAYLOAD',
            });
          }

          const matchData = matchDataRaw;
          normalizeParticipants(matchData);

          let timelineData: TimelinePayload = null;
          try {
            timelineData = (await riotAPI.getMatchTimeline(
              parsedMatchId.matchId,
              parsedMatchId.region
            )) as TimelinePayload;
          } catch (timelineError) {
            if (timelineError instanceof RiotApiError) {
              console.warn('Failed to fetch match timeline:', {
                matchId: parsedMatchId.matchId,
                message: timelineError.message,
                status: timelineError.status,
                retryAfterSeconds: timelineError.retryAfterSeconds,
                code: timelineError.code,
              });
            } else {
              console.warn('Failed to fetch match timeline:', timelineError);
            }
          }

          const nextEntry = { matchData, timelineData };
          cache.set(cacheKey, nextEntry, CACHE_TTL.MATCH_DETAILS);
          return nextEntry;
        }
      );

      return NextResponse.json({
        success: true,
        ...dataToCache,
        matchId:
          dataToCache.matchData.metadata?.matchId ?? parsedMatchId.matchId,
        cached: false,
        example: useExample,
      });
    } catch (error) {
      if (error instanceof RiotApiError) {
        console.error('Error fetching match from Riot API:', {
          matchId: parsedMatchId.matchId,
          message: error.message,
          status: error.status,
          retryAfterSeconds: error.retryAfterSeconds,
          code: error.code,
        });
        return toClientError(error);
      }

      if (useExample) {
        console.error('Failed to read example data files:', error);
        return createErrorResponse('Failed to load example data files', {
          status: 500,
          code: 'EXAMPLE_DATA_ERROR',
        });
      }

      console.error('Error in match details data pipeline:', error);
      return createErrorResponse('Failed to fetch match data from Riot API', {
        status: 500,
        code: 'MATCH_DATA_FETCH_FAILED',
      });
    }
  } catch (error) {
    console.error('Error in match details API:', error);
    return createErrorResponse('Internal server error', {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
