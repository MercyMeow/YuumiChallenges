import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RiotAPI } from '@/lib/apis/riot';
import { createServerSupabaseClient } from '@/lib/supabase';
import { formatSecondsToTime } from '@/lib/utils/match-timeline-utils';

const riotApi = new RiotAPI(process.env.RIOT_API_KEY || '');

// Helper function to get region from match ID
function getRegionFromMatchId(matchId: string): string {
  // Match IDs follow format: REGION_GAMEID
  const regionCode = matchId.split('_')[0];
  
  // Map region codes to API regions
  const regionMap: Record<string, string> = {
    'NA1': 'na1',
    'EUW1': 'euw1',
    'EUN1': 'eun1',
    'KR': 'kr',
    'JP1': 'jp1',
    'BR1': 'br1',
    'LA1': 'la1',
    'LA2': 'la2',
    'OC1': 'oc1',
    'RU': 'ru',
    'TR1': 'tr1',
    'PH2': 'ph2',
    'SG2': 'sg2',
    'TH2': 'th2',
    'TW2': 'tw2',
    'VN2': 'vn2'
  };
  
  return regionCode ? (regionMap[regionCode] || 'na1') : 'na1'; // Default to NA1 if unknown
}


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify user has access to this match (they must have a summoner that played in it)
    const { data: hasAccess } = await supabase
      .from('match_history')
      .select('match_id')
      .eq('match_id', matchId)
      .eq('summoner_id', 
        supabase
          .from('summoners')
          .select('puuid')
          .eq('user_id', session.user.id)
          .single()
      )
      .single();

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied - you did not participate in this match' },
        { status: 403 }
      );
    }

    // Get region from match ID
    const region = getRegionFromMatchId(matchId);


    // Fetch detailed match data from Riot API
    try {
      const matchDetails = await riotApi.getMatchDetails(matchId, region);
      
      if (!matchDetails || !matchDetails.info) {
        return NextResponse.json(
          { error: 'Match details not found' },
          { status: 404 }
        );
      }

      // Process participants with enhanced data
      const processedParticipants = matchDetails.info.participants.map((p: any) => {
        
        return {
          // Player identity
          puuid: p.puuid,
          summonerId: p.summonerId,
          summonerName: p.summonerName,
          summonerLevel: p.summonerLevel,
          riotIdName: p.riotIdGameName || p.riotIdName || p.summonerName,
          
          // Champion info
          championId: p.championId,
          championName: p.championName,
          champLevel: p.champLevel,
          championTransform: p.championTransform || 0,
          
          // Team info
          teamId: p.teamId,
          teamPosition: p.teamPosition || '',
          individualPosition: p.individualPosition || '',
          
          // Summoner spells
          spell1Id: p.spell1Id,
          spell2Id: p.spell2Id,
          
          // Items (0-6: items, 6 is trinket)
          items: [
            p.item0 || 0,
            p.item1 || 0,
            p.item2 || 0,
            p.item3 || 0,
            p.item4 || 0,
            p.item5 || 0,
            p.item6 || 0
          ],
          
          // Core stats
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          win: p.win,
          
          // Combat stats
          totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
          totalDamageDealt: p.totalDamageDealt || 0,
          totalDamageTaken: p.totalDamageTaken || 0,
          magicDamageDealtToChampions: p.magicDamageDealtToChampions || 0,
          physicalDamageDealtToChampions: p.physicalDamageDealtToChampions || 0,
          trueDamageDealtToChampions: p.trueDamageDealtToChampions || 0,
          totalHeal: p.totalHeal || 0,
          totalUnitsHealed: p.totalUnitsHealed || 0,
          damageSelfMitigated: p.damageSelfMitigated || 0,
          
          // Economy stats
          goldEarned: p.goldEarned || 0,
          goldSpent: p.goldSpent || 0,
          totalMinionsKilled: p.totalMinionsKilled || 0,
          neutralMinionsKilled: p.neutralMinionsKilled || 0,
          
          // Vision stats
          visionScore: p.visionScore || 0,
          visionWardsBoughtInGame: p.visionWardsBoughtInGame || 0,
          wardsPlaced: p.wardsPlaced || 0,
          wardsKilled: p.wardsKilled || 0,
          detectorWardsPlaced: p.detectorWardsPlaced || 0,
          
          // Objectives
          turretKills: p.turretKills || 0,
          turretTakedowns: p.turretTakedowns || 0,
          inhibitorKills: p.inhibitorKills || 0,
          inhibitorTakedowns: p.inhibitorTakedowns || 0,
          baronKills: p.baronKills || 0,
          dragonKills: p.dragonKills || 0,
          
          // CC & utility
          totalTimeCCDealt: p.totalTimeCCDealt || 0,
          timeCCingOthers: p.timeCCingOthers || 0,
          totalTimeSpentDead: p.totalTimeSpentDead || 0,
          timePlayed: p.timePlayed || 0,
          
          // Multi-kills
          doubleKills: p.doubleKills || 0,
          tripleKills: p.tripleKills || 0,
          quadraKills: p.quadraKills || 0,
          pentaKills: p.pentaKills || 0,
          unrealKills: p.unrealKills || 0,
          
          // First events
          firstBloodKill: p.firstBloodKill || false,
          firstBloodAssist: p.firstBloodAssist || false,
          firstTowerKill: p.firstTowerKill || false,
          firstTowerAssist: p.firstTowerAssist || false,
          
          // Other stats
          bountyLevel: p.bountyLevel || 0,
          totalAllyJungleMinionsKilled: p.totalAllyJungleMinionsKilled || 0,
          totalEnemyJungleMinionsKilled: p.totalEnemyJungleMinionsKilled || 0,
          consumablesPurchased: p.consumablesPurchased || 0,
          itemsPurchased: p.itemsPurchased || 0,
          
          // Challenges and other
          challenges: p.challenges || {},
          profileIcon: p.profileIcon || 0,
          gameEndedInEarlySurrender: p.gameEndedInEarlySurrender || false,
          gameEndedInSurrender: p.gameEndedInSurrender || false,
          eligibleForProgression: p.eligibleForProgression || true,
          
          // Additional calculated stats
          kda: p.deaths > 0 ? Number(((p.kills + p.assists) / p.deaths).toFixed(2)) : 99,
          killParticipation: 0, // Will be calculated after processing teams
          damagePerMinute: matchDetails.info.gameDuration > 0 
            ? Math.round((p.totalDamageDealtToChampions || 0) / (matchDetails.info.gameDuration / 60))
            : 0,
          visionScorePerMinute: matchDetails.info.gameDuration > 0
            ? Number(((p.visionScore || 0) / (matchDetails.info.gameDuration / 60)).toFixed(1))
            : 0,
          csPerMinute: matchDetails.info.gameDuration > 0
            ? Number(((p.totalMinionsKilled || 0) / (matchDetails.info.gameDuration / 60)).toFixed(1))
            : 0
        };
      });

      // Calculate kill participation for each participant
      const teamKills = new Map();
      matchDetails.info.teams.forEach((team: any) => {
        teamKills.set(team.teamId, team.objectives.champion.kills || 0);
      });

      processedParticipants.forEach((p: any) => {
        const teamTotalKills = teamKills.get(p.teamId) || 0;
        p.killParticipation = teamTotalKills > 0 
          ? Math.round(((p.kills + p.assists) / teamTotalKills) * 100)
          : 0;
      });

      // Process teams with enhanced objectives data
      const processedTeams = matchDetails.info.teams.map((team: any) => ({
        teamId: team.teamId,
        win: team.win,
        bans: team.bans || [],
        objectives: {
          baron: team.objectives?.baron || { first: false, kills: 0 },
          champion: team.objectives?.champion || { first: false, kills: 0 },
          dragon: team.objectives?.dragon || { first: false, kills: 0 },
          inhibitor: team.objectives?.inhibitor || { first: false, kills: 0 },
          riftHerald: team.objectives?.riftHerald || { first: false, kills: 0 },
          tower: team.objectives?.tower || { first: false, kills: 0 }
        }
      }));

      // Structure the comprehensive match data response
      const matchDetailsResponse = {
        // Basic match info
        matchId: matchDetails.metadata.matchId,
        gameCreation: matchDetails.info.gameCreation,
        gameDuration: matchDetails.info.gameDuration,
        gameStartTimestamp: matchDetails.info.gameStartTimestamp,
        gameEndTimestamp: matchDetails.info.gameEndTimestamp,
        gameMode: matchDetails.info.gameMode,
        gameType: matchDetails.info.gameType,
        gameVersion: matchDetails.info.gameVersion,
        mapId: matchDetails.info.mapId,
        platformId: matchDetails.info.platformId,
        queueId: matchDetails.info.queueId,
        tournamentCode: matchDetails.info.tournamentCode,
        
        // Processed participants with enhanced data
        participants: processedParticipants,
        
        // Team information
        teams: processedTeams,
        
        // Match metadata
        metadata: {
          dataVersion: matchDetails.metadata.dataVersion,
          participants: matchDetails.metadata.participants
        },
        
        // Additional computed information
        gameStats: {
          totalKills: processedParticipants.reduce((sum: number, p: any) => sum + p.kills, 0),
          averageLevel: Math.round(processedParticipants.reduce((sum: number, p: any) => sum + p.champLevel, 0) / processedParticipants.length),
          totalGold: processedParticipants.reduce((sum: number, p: any) => sum + p.goldEarned, 0),
          firstBloodTime: null, // Could be calculated from timeline if needed
          winningTeam: processedTeams.find((t: any) => t.win)?.teamId || null,
          gameLength: {
            minutes: Math.floor(matchDetails.info.gameDuration / 60),
            seconds: matchDetails.info.gameDuration % 60,
            formatted: formatSecondsToTime(matchDetails.info.gameDuration)
          }
        }
      };
      
      return NextResponse.json({
        success: true,
        data: matchDetailsResponse
      });
      
    } catch (riotError: any) {
      console.error('Riot API error:', riotError);
      
      // Check if it's a rate limit error
      if (riotError.message?.includes('429') || riotError.message?.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a few moments.' },
          { status: 429 }
        );
      }
      
      // Check if it's a not found error
      if (riotError.message?.includes('404') || riotError.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Match not found. It may be too old or unavailable.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch match details from Riot API. Please try again later.' },
        { status: 503 }
      );
    }
    
  } catch (error: any) {
    console.error('Match details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}