import { NextRequest, NextResponse } from 'next/server';
import { RiotAPI } from '@/lib/apis/riot';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    
    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const riotApiKey = process.env.RIOT_API_KEY;
    if (!riotApiKey) {
      return NextResponse.json({ error: 'Riot API key not configured' }, { status: 500 });
    }

    // Extract region from match ID (format: REGION_MATCHID)
    const regionMatch = matchId.match(/^([A-Z0-9]+)_/);
    if (!regionMatch) {
      return NextResponse.json({ error: 'Invalid match ID format' }, { status: 400 });
    }

    // Map platform to region for API calls
    const platformToRegion: Record<string, string> = {
      'BR1': 'americas',
      'EUN1': 'europe',
      'EUW1': 'europe', 
      'JP1': 'asia',
      'KR': 'asia',
      'LA1': 'americas',
      'LA2': 'americas',
      'NA1': 'americas',
      'OC1': 'sea',
      'PH2': 'sea',
      'RU': 'europe',
      'SG2': 'sea',
      'TH2': 'sea',
      'TR1': 'europe',
      'TW2': 'sea',
      'VN2': 'sea'
    };

    const platform = regionMatch[1];
    if (!platform) {
      return NextResponse.json({ error: 'Invalid match ID format - no platform found' }, { status: 400 });
    }
    
    const region = platformToRegion[platform];
    if (!region) {
      return NextResponse.json({ error: 'Unsupported region' }, { status: 400 });
    }

    const riotAPI = new RiotAPI(riotApiKey);
    
    try {
      // Fetch match details
      const matchData = await riotAPI.getMatchDetails(matchId, region);
      
      // Fetch timeline data as well
      let timelineData = null;
      try {
        timelineData = await riotAPI.getMatchTimeline(matchId, region);
      } catch (timelineError) {
        console.warn('Failed to fetch match timeline:', timelineError);
        // Timeline is optional, continue without it
      }

      return NextResponse.json({
        success: true,
        matchData,
        timelineData,
        matchId
      });

    } catch (riotError: any) {
      console.error('Error fetching match from Riot API:', riotError);
      
      // Handle specific Riot API errors
      if (riotError.status === 404) {
        return NextResponse.json({ 
          error: 'Match not found. Please check the match ID and try again.' 
        }, { status: 404 });
      }
      
      if (riotError.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }, { status: 429 });
      }
      
      if (riotError.status === 403) {
        return NextResponse.json({ 
          error: 'API access denied. Invalid API key.' 
        }, { status: 403 });
      }

      return NextResponse.json({ 
        error: 'Failed to fetch match data from Riot API' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in match details API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}