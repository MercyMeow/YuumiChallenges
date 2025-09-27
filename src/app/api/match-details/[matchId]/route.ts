import { NextRequest, NextResponse } from 'next/server';
import { RiotAPI } from '@/lib/apis/riot';
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
import { readFile } from 'fs/promises';
import path from 'path';

type TimelinePayload = unknown;

type MatchCacheEntry = {
  matchData: DetailedMatchData;
  timelineData: TimelinePayload;
};

function shouldUseExampleData(req: NextRequest, riotApiKey?: string) {
  const envToggle = process.env.NEXT_PUBLIC_USE_EXAMPLE_DATA === 'true';
  const noKey = !riotApiKey;
  const url = new URL(req.url);
  const queryToggle = url.searchParams.get('useExample') === '1';
  return envToggle || noKey || queryToggle;
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;
    const cache = getMatchCache();

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    const riotApiKey = process.env.RIOT_API_KEY;

    // Check cache first (works for both example and live)
    const cacheKey = generateCacheKey(CACHE_KEYS.MATCH_DETAILS, matchId);
    const cachedData = cache.get<MatchCacheEntry>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        ...cachedData,
        matchId,
        cached: true,
      });
    }

    // If example mode, read from root JSON files and return
    if (shouldUseExampleData(request, riotApiKey)) {
      try {
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

        // Normalize like live code does
        normalizeParticipants(matchData);

        const dataToCache = { matchData, timelineData };
        cache.set(cacheKey, dataToCache, CACHE_TTL.MATCH_DETAILS);

        return NextResponse.json({
          success: true,
          ...dataToCache,
          matchId: matchData?.metadata?.matchId ?? matchId,
          cached: false,
          example: true,
        });
      } catch (fileErr) {
        console.error('Failed to read example data files:', fileErr);
        return NextResponse.json(
          { error: 'Failed to load example data files' },
          { status: 500 }
        );
      }
    }

    // Live mode requires API key
    if (!riotApiKey) {
      return NextResponse.json(
        { error: 'Riot API key not configured' },
        { status: 500 }
      );
    }

    // Extract region from match ID (format: REGION_MATCHID)
    const regionMatch = matchId.match(/^([A-Z0-9]+)_/);
    if (!regionMatch) {
      return NextResponse.json(
        { error: 'Invalid match ID format' },
        { status: 400 }
      );
    }

    // Map platform to region codes (must match database region_type enum)
    const platformToRegion: Record<string, string> = {
      BR1: 'br1',
      EUN1: 'eun1',
      EUW1: 'euw1',
      JP1: 'jp1',
      KR: 'kr',
      LA1: 'la1',
      LA2: 'la2',
      NA1: 'na1',
      OC1: 'oc1',
      PH2: 'ph2',
      RU: 'ru',
      SG2: 'sg2',
      TH2: 'th2',
      TR1: 'tr1',
      TW2: 'tw2',
      VN2: 'vn2',
    };

    const platform = regionMatch[1];
    if (!platform) {
      console.error('Failed to extract platform from match ID:', matchId);
      return NextResponse.json(
        { error: 'Invalid match ID format - no platform found' },
        { status: 400 }
      );
    }

    const region = platformToRegion[platform];
    if (!region) {
      console.error(
        'Unsupported platform:',
        platform,
        'Available platforms:',
        Object.keys(platformToRegion)
      );
      return NextResponse.json(
        { error: `Unsupported region: ${platform}` },
        { status: 400 }
      );
    }

    console.log('Processing match request:', { matchId, platform, region });

    const riotAPI = new RiotAPI(riotApiKey);

    try {
      // Fetch match details
      const matchDataRaw = await riotAPI.getMatchDetails(matchId, region);
      if (!isDetailedMatchData(matchDataRaw)) {
        throw new Error('Riot API returned unexpected match shape');
      }

      const matchData = matchDataRaw;

      // Normalize participants
      normalizeParticipants(matchData);

      // Fetch timeline data as well
      let timelineData = null;
      try {
        timelineData = (await riotAPI.getMatchTimeline(
          matchId,
          region
        )) as TimelinePayload;
      } catch (timelineError) {
        console.warn('Failed to fetch match timeline:', timelineError);
        // Timeline is optional
      }

      // Cache the data
      const dataToCache = { matchData, timelineData };
      cache.set(cacheKey, dataToCache, CACHE_TTL.MATCH_DETAILS);

      return NextResponse.json({
        success: true,
        matchData,
        timelineData,
        matchId,
        cached: false,
      });
    } catch (riotError: unknown) {
      console.error('Error fetching match from Riot API:', riotError);

      const status =
        typeof riotError === 'object' && riotError && 'status' in riotError
          ? Number((riotError as { status?: number }).status)
          : undefined;

      // Handle specific Riot API errors
      if (status === 404) {
        return NextResponse.json(
          {
            error: 'Match not found. Please check the match ID and try again.',
          },
          { status: 404 }
        );
      }
      if (status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (status === 403) {
        return NextResponse.json(
          { error: 'API access denied. Invalid API key.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch match data from Riot API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in match details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
