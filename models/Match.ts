import { ObjectId } from 'mongodb';

export interface Match {
  _id?: ObjectId;
  matchId: string;
  gameMode: string;
  gameDuration: number;
  gameCreation: number;
  platformId: string;
  participants: MatchParticipant[];
  teams: MatchTeam[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchParticipant {
  puuid: string;
  summonerId: string;
  summonerName: string;
  championId: number;
  championName: string;
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  goldEarned: number;
  items: number[];
  summoner1Id: number;
  summoner2Id: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  champLevel: number;
  visionScore: number;
  role: string;
  lane: string;
  challenges?: Record<string, number>;
}

export interface MatchTeam {
  teamId: number;
  win: boolean;
  objectives: {
    baron: { first: boolean; kills: number };
    champion: { first: boolean; kills: number };
    dragon: { first: boolean; kills: number };
    inhibitor: { first: boolean; kills: number };
    riftHerald: { first: boolean; kills: number };
    tower: { first: boolean; kills: number };
  };
  bans: { championId: number; pickTurn: number }[];
}

export const MatchCollection = 'matches';

// Helper functions for match operations
export const matchHelpers = {
  // Format match data for client-side consumption
  formatMatch: (match: Match): Omit<Match, '_id'> & { id: string } => {
    const { _id, ...matchData } = match;
    return {
      id: _id?.toString() || '',
      ...matchData,
    };
  },
  
  // Create a new match object from Riot API data
  createMatchFromRiotData: (riotMatch: any): Omit<Match, '_id'> => {
    const now = new Date();
    
    // Map participants data
    const participants = riotMatch.info.participants.map((p: any) => ({
      puuid: p.puuid,
      summonerId: p.summonerId,
      summonerName: p.summonerName,
      championId: p.championId,
      championName: p.championName,
      teamId: p.teamId,
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      totalDamageDealt: p.totalDamageDealt,
      totalDamageDealtToChampions: p.totalDamageDealtToChampions,
      goldEarned: p.goldEarned,
      items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].filter(item => item !== 0),
      summoner1Id: p.summoner1Id,
      summoner2Id: p.summoner2Id,
      totalMinionsKilled: p.totalMinionsKilled,
      neutralMinionsKilled: p.neutralMinionsKilled || 0,
      champLevel: p.champLevel,
      visionScore: p.visionScore,
      role: p.role,
      lane: p.lane,
      challenges: p.challenges,
    }));
    
    // Map teams data
    const teams = riotMatch.info.teams.map((t: any) => ({
      teamId: t.teamId,
      win: t.win,
      objectives: t.objectives,
      bans: t.bans,
    }));
    
    return {
      matchId: riotMatch.metadata.matchId,
      gameMode: riotMatch.info.gameMode,
      gameDuration: riotMatch.info.gameDuration,
      gameCreation: riotMatch.info.gameCreation,
      platformId: riotMatch.info.platformId,
      participants,
      teams,
      createdAt: now,
      updatedAt: now,
    };
  },
};
