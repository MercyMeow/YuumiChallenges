import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RiotAPI } from '@/lib/apis/riot';
import { supabase } from '@/lib/supabase';

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

    // First check if we have basic match data in our database
    const { data: existingMatch, error: dbError } = await supabase
      .from('match_history')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to check match data' },
        { status: 500 }
      );
    }

    // Get region from match ID
    const region = getRegionFromMatchId(matchId);

    // Fetch detailed match data from Riot API
    try {
      const matchDetails = await riotApi.getMatchDetails(matchId, region);
      
      // Process and structure the comprehensive match data
      const processedMatch = {
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
        
        // Participants with full stats
        participants: matchDetails.info.participants.map((p: {
          puuid: string;
          summonerId: string;
          summonerName: string;
          summonerLevel: number;
          riotIdName: string;
          riotIdTagline: string;
          championId: number;
          championName: string;
          champLevel: number;
          championTransform: number;
          teamId: number;
          teamPosition: string;
          individualPosition: string;
          spell1Id: number;
          spell2Id: number;
          item0: number;
          item1: number;
          item2: number;
          item3: number;
          item4: number;
          item5: number;
          item6: number;
          kills: number;
          deaths: number;
          assists: number;
          win: boolean;
          totalDamageDealtToChampions: number;
          totalDamageDealt: number;
          totalDamageTaken: number;
          magicDamageDealtToChampions: number;
          physicalDamageDealtToChampions: number;
          trueDamageDealtToChampions: number;
          totalHeal: number;
          totalUnitsHealed: number;
          damageSelfMitigated: number;
          damageDealtToObjectives: number;
          damageDealtToTurrets: number;
          largestKillingSpree: number;
          largestMultiKill: number;
          killingSprees: number;
          goldEarned: number;
          goldSpent: number;
          totalMinionsKilled: number;
          neutralMinionsKilled: number;
          visionScore: number;
          visionWardsBoughtInGame: number;
          wardsPlaced: number;
          wardsKilled: number;
          detectorWardsPlaced: number;
          turretKills: number;
          turretTakedowns: number;
          inhibitorKills: number;
          inhibitorTakedowns: number;
          baronKills: number;
          dragonKills: number;
          totalTimeCCDealt: number;
          timeCCingOthers: number;
          totalTimeSpentDead: number;
          timePlayed: number;
          doubleKills: number;
          tripleKills: number;
          quadraKills: number;
          pentaKills: number;
          unrealKills: number;
          firstBloodKill: boolean;
          firstBloodAssist: boolean;
          firstTowerKill: boolean;
          firstTowerAssist: boolean;
          bountyLevel: number;
          totalAllyJungleMinionsKilled: number;
          totalEnemyJungleMinionsKilled: number;
          consumablesPurchased: number;
          itemsPurchased: number;
          challenges?: Record<string, unknown>;
          profileIcon: number;
          gameEndedInEarlySurrender: boolean;
          gameEndedInSurrender: boolean;
          eligibleForProgression: boolean;
        }) => ({
          // Player identity
          puuid: p.puuid,
          summonerId: p.summonerId,
          summonerName: p.summonerName,
          summonerLevel: p.summonerLevel,
          riotIdName: p.riotIdName,
          riotIdTagline: p.riotIdTagline,
          
          // Champion info
          championId: p.championId,
          championName: p.championName,
          champLevel: p.champLevel,
          championTransform: p.championTransform,
          
          // Team info
          teamId: p.teamId,
          teamPosition: p.teamPosition,
          individualPosition: p.individualPosition,
          
          // Summoner spells
          spell1Id: p.spell1Id,
          spell2Id: p.spell2Id,
          
          // Items
          item0: p.item0,
          item1: p.item1,
          item2: p.item2,
          item3: p.item3,
          item4: p.item4,
          item5: p.item5,
          item6: p.item6,
          
          // Core stats
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          win: p.win,
          
          // Combat stats
          totalDamageDealtToChampions: p.totalDamageDealtToChampions,
          totalDamageDealt: p.totalDamageDealt,
          totalDamageTaken: p.totalDamageTaken,
          magicDamageDealtToChampions: p.magicDamageDealtToChampions,
          physicalDamageDealtToChampions: p.physicalDamageDealtToChampions,
          trueDamageDealtToChampions: p.trueDamageDealtToChampions,
          totalHeal: p.totalHeal,
          totalUnitsHealed: p.totalUnitsHealed,
          damageSelfMitigated: p.damageSelfMitigated,
          damageDealtToObjectives: p.damageDealtToObjectives,
          damageDealtToTurrets: p.damageDealtToTurrets,
          largestKillingSpree: p.largestKillingSpree,
          largestMultiKill: p.largestMultiKill,
          killingSprees: p.killingSprees,
          
          // Economy stats
          goldEarned: p.goldEarned,
          goldSpent: p.goldSpent,
          totalMinionsKilled: p.totalMinionsKilled,
          neutralMinionsKilled: p.neutralMinionsKilled,
          
          // Vision stats
          visionScore: p.visionScore,
          visionWardsBoughtInGame: p.visionWardsBoughtInGame,
          wardsPlaced: p.wardsPlaced,
          wardsKilled: p.wardsKilled,
          detectorWardsPlaced: p.detectorWardsPlaced,
          
          // Objectives
          turretKills: p.turretKills,
          turretTakedowns: p.turretTakedowns,
          inhibitorKills: p.inhibitorKills,
          inhibitorTakedowns: p.inhibitorTakedowns,
          baronKills: p.baronKills,
          dragonKills: p.dragonKills,
          
          // CC & utility
          totalTimeCCDealt: p.totalTimeCCDealt,
          timeCCingOthers: p.timeCCingOthers,
          totalTimeSpentDead: p.totalTimeSpentDead,
          timePlayed: p.timePlayed,
          
          // Multi-kills
          doubleKills: p.doubleKills,
          tripleKills: p.tripleKills,
          quadraKills: p.quadraKills,
          pentaKills: p.pentaKills,
          unrealKills: p.unrealKills,
          
          // First bloods
          firstBloodKill: p.firstBloodKill,
          firstBloodAssist: p.firstBloodAssist,
          firstTowerKill: p.firstTowerKill,
          firstTowerAssist: p.firstTowerAssist,
          
          // Bounties
          bountyLevel: p.bountyLevel,
          
          // Additional stats
          totalAllyJungleMinionsKilled: p.totalAllyJungleMinionsKilled,
          totalEnemyJungleMinionsKilled: p.totalEnemyJungleMinionsKilled,
          consumablesPurchased: p.consumablesPurchased,
          itemsPurchased: p.itemsPurchased,
          
          // Challenges (if available)
          challenges: p.challenges || {},
          
          // Other
          profileIcon: p.profileIcon,
          gameEndedInEarlySurrender: p.gameEndedInEarlySurrender,
          gameEndedInSurrender: p.gameEndedInSurrender,
          eligibleForProgression: p.eligibleForProgression,
        })),
        
        // Team stats
        teams: matchDetails.info.teams.map((team: {
          teamId: number;
          win: boolean;
          bans: Array<{ championId: number; pickTurn: number }>;
          objectives: {
            baron: { first: boolean; kills: number };
            champion: { first: boolean; kills: number };
            dragon: { first: boolean; kills: number };
            inhibitor: { first: boolean; kills: number };
            riftHerald: { first: boolean; kills: number };
            tower: { first: boolean; kills: number };
          };
        }) => ({
          teamId: team.teamId,
          win: team.win,
          bans: team.bans,
          objectives: {
            baron: team.objectives.baron,
            champion: team.objectives.champion,
            dragon: team.objectives.dragon,
            inhibitor: team.objectives.inhibitor,
            riftHerald: team.objectives.riftHerald,
            tower: team.objectives.tower,
          },
        })),
        
        // Match metadata
        metadata: {
          dataVersion: matchDetails.metadata.dataVersion,
          participants: matchDetails.metadata.participants,
        },
        
        // From our database (if exists)
        localData: existingMatch || null,
      };
      
      return NextResponse.json({
        success: true,
        match: processedMatch,
      });
      
    } catch (riotError: unknown) {
      console.error('Riot API error:', riotError);
      
      // If Riot API fails, return basic data from database if available
      if (existingMatch) {
        return NextResponse.json({
          success: true,
          match: {
            localData: existingMatch,
            error: 'Full match details unavailable',
          },
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch match details' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Match details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}