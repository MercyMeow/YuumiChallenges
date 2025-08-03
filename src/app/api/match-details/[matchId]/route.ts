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

    // Map platform to region codes (must match database region_type enum)
    const platformToRegion: Record<string, string> = {
      'BR1': 'br1',
      'EUN1': 'eun1',
      'EUW1': 'euw1', 
      'JP1': 'jp1',
      'KR': 'kr',
      'LA1': 'la1',
      'LA2': 'la2',
      'NA1': 'na1',
      'OC1': 'oc1',
      'PH2': 'ph2',
      'RU': 'ru',
      'SG2': 'sg2',
      'TH2': 'th2',
      'TR1': 'tr1',
      'TW2': 'tw2',
      'VN2': 'vn2'
    };

    const platform = regionMatch[1];
    if (!platform) {
      console.error('Failed to extract platform from match ID:', matchId);
      return NextResponse.json({ error: 'Invalid match ID format - no platform found' }, { status: 400 });
    }
    
    const region = platformToRegion[platform];
    if (!region) {
      console.error('Unsupported platform:', platform, 'Available platforms:', Object.keys(platformToRegion));
      return NextResponse.json({ error: `Unsupported region: ${platform}` }, { status: 400 });
    }

    console.log('Processing match request:', { matchId, platform, region });

    const riotAPI = new RiotAPI(riotApiKey);
    
    try {
      // Fetch match details
      console.log('Fetching match details from Riot API:', { matchId, region });
      const matchData = await riotAPI.getMatchDetails(matchId, region);
      console.log('Successfully fetched match details');
      
      // Fetch timeline data as well
      let timelineData = null;
      try {
        console.log('Fetching match timeline from Riot API:', { matchId, region });
        timelineData = await riotAPI.getMatchTimeline(matchId, region);
        console.log('Successfully fetched match timeline');
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