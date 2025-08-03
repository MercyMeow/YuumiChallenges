export type UserRole = 'owner' | 'admin' | 'member';

export interface User {
  discord_id: string; // Primary key
  username: string;
  avatar: string | null;
  user_role: UserRole;
  is_yuumi_member: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUserAction {
  id: string;
  admin_user_id: string | null; // References users.discord_id
  target_user_id: string; // References users.discord_id
  action_type: string;
  previous_value?: string;
  new_value?: string;
  reason?: string;
  created_at: Date;
  admin_user?: User;
  target_user?: User;
}

export interface Summoner {
  puuid: string; // Primary key
  user_id: string;
  game_name: string;
  tag_line: string;
  region: string;
  level: number;
  profile_icon_id: number;
  last_refreshed_at?: string;
  last_manual_refresh_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  criteria: ChallengeCriteria;
  reward_points: number;
  active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  max_progress: number;
  completed: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type ChallengeType = 
  | 'kda'
  | 'winstreak'
  | 'champion_mastery'
  | 'ranked_climb'
  | 'games_played'
  | 'perfect_game';

export interface ChallengeCriteria {
  champion?: string;
  rank?: string;
  kda_threshold?: number;
  win_count?: number;
  games_count?: number;
  time_period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface MatchParticipant {
  championName: string;
  gameName: string;
  tagLine: string;
  teamId: number;
}

export interface MatchData {
  id?: string;
  match_id: string;
  summoner_id: string; // References summoners.puuid
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  duration: number;
  game_mode: string;
  queue_id: number;
  game_creation: Date;
  analyzed_for_challenges?: boolean;
  created_at: Date;
  // New fields
  gold?: number;
  cs?: number;
  vision_score?: number;
  champion_level?: number;
  items?: number[];
  summoner_spells?: {
    spell1Id: number;
    spell2Id: number;
  };
  runes?: {
    primaryStyle: number;
    subStyle: number;
    statPerks: {
      defense: number;
      flex: number;
      offense: number;
    };
    primarySelections: {
      perk: number;
      var1: number;
      var2: number;
      var3: number;
    }[];
    subSelections: {
      perk: number;
      var1: number;
      var2: number;
      var3: number;
    }[];
  };
  all_participants?: MatchParticipant[];
}

// Enhanced types for detailed match data
export interface DetailedMatchParticipant {
  puuid: string;
  summonerName: string;
  championName: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  level: number;
  goldEarned: number;
  totalMinionsKilled: number;
  visionScore: number;
  teamId: number;
  win: boolean;
  items: number[]; // Array of 7 item IDs (6 items + trinket)
  summoner1Id: number;
  summoner2Id: number;
  perks: {
    statPerks: {
      defense: number;
      flex: number;
      offense: number;
    };
    styles: {
      description: string;
      selections: {
        perk: number;
        var1: number;
        var2: number;
        var3: number;
      }[];
      style: number;
    }[];
  };
}

export interface DetailedMatchTeam {
  teamId: number;
  win: boolean;
  bans: {
    championId: number;
    pickTurn: number;
  }[];
  objectives: {
    baron: { first: boolean; kills: number };
    champion: { first: boolean; kills: number };
    dragon: { first: boolean; kills: number };
    inhibitor: { first: boolean; kills: number };
    riftHerald: { first: boolean; kills: number };
    tower: { first: boolean; kills: number };
  };
}

export interface DetailedMatchData {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[]; // Array of PUUIDs
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: DetailedMatchParticipant[];
    platformId: string;
    queueId: number;
    teams: DetailedMatchTeam[];
    tournamentCode?: string;
  };
}

export interface ProcessedMatchData extends MatchData {
  detailedData?: DetailedMatchData;
  userParticipant?: DetailedMatchParticipant;
  userTeam?: DetailedMatchTeam;
  enemyTeam?: DetailedMatchTeam;
}

export interface RankedInfo {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  queue_type: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data?: {
    summoner_updated: boolean;
    ranked_updated: boolean;
    matches_added: number;
    matches_removed: number;
    errors: string[];
    warnings: string[];
    partial_success?: boolean;
  };
  next_refresh_available?: Date;
}

export interface RefreshStatus {
  can_refresh: boolean;
  can_manual_refresh: boolean;
  last_refreshed_at?: string | null;
  last_manual_refresh_at?: string | null;
  next_auto_refresh?: string | null;
  next_manual_refresh?: string | null;
  total_matches?: number;
  last_match_date?: string | null;
}

// Enhanced typed interfaces for dashboard components

export interface RankedQueueInfo {
  queue_type: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT';
  tier: string;
  rank_level: string;
  league_points: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  fresh_blood: boolean;
  hot_streak: boolean;
}

export interface EnhancedSummoner extends Summoner {
  ranked_info: RankedQueueInfo[];
}

export interface ChallengeProgress {
  id: string;
  title: string;
  type: ChallengeType;
  progress: number;
  maxProgress: number;
  progressPercentage: number;
  completed: boolean;
}

export interface LeaderboardUser {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  position: number;
  points: number;
}

export interface LeaderboardData {
  topUsers: LeaderboardUser[];
  currentUser?: {
    position: number;
    points: number;
  };
  totalUsers: number;
}

export interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  onlineMembers: number;
  activeChallenges: number;
  challengesCompleted: number;
  totalGamesTracked: number;
  gamesToday: number;
}

export interface TeamObjective {
  first: boolean;
  kills: number;
}

export interface TeamObjectives {
  baron?: TeamObjective;
  champion?: TeamObjective;
  dragon?: TeamObjective;
  inhibitor?: TeamObjective;
  riftHerald?: TeamObjective;
  tower?: TeamObjective;
}

export interface SafeDetailedMatchTeam {
  teamId: 100 | 200;
  win: boolean;
  bans: Array<{
    championId: number;
    pickTurn: number;
  }>;
  objectives: TeamObjectives;
}

// Type guard utilities
export const isRankedQueueInfo = (obj: unknown): obj is RankedQueueInfo => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'queue_type' in obj &&
    'tier' in obj &&
    'rank_level' in obj &&
    'league_points' in obj &&
    'wins' in obj &&
    'losses' in obj
  );
};

export const isChallengeProgress = (obj: unknown): obj is ChallengeProgress => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'type' in obj &&
    'progress' in obj &&
    'maxProgress' in obj
  );
};

export const isLeaderboardUser = (obj: unknown): obj is LeaderboardUser => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'user' in obj &&
    'position' in obj &&
    'points' in obj &&
    typeof (obj as LeaderboardUser).user === 'object' &&
    (obj as LeaderboardUser).user !== null
  );
};

// Utility types for better type safety
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  message?: string;
};

export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Brand types for better domain modeling
export type SummonerId = string & { readonly brand: unique symbol };
export type MatchId = string & { readonly brand: unique symbol };
export type ChampionId = string & { readonly brand: unique symbol };

// Additional type guards for better runtime safety
export const isCommunityStats = (obj: unknown): obj is CommunityStats => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'totalMembers' in obj &&
    'activeMembers' in obj &&
    'onlineMembers' in obj &&
    'activeChallenges' in obj &&
    'challengesCompleted' in obj &&
    'totalGamesTracked' in obj &&
    'gamesToday' in obj &&
    typeof (obj as CommunityStats).totalMembers === 'number' &&
    typeof (obj as CommunityStats).activeMembers === 'number' &&
    typeof (obj as CommunityStats).onlineMembers === 'number'
  );
};

export const isDetailedMatchTeam = (obj: unknown): obj is SafeDetailedMatchTeam => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'teamId' in obj &&
    'win' in obj &&
    'bans' in obj &&
    'objectives' in obj &&
    ((obj as SafeDetailedMatchTeam).teamId === 100 || (obj as SafeDetailedMatchTeam).teamId === 200) &&
    typeof (obj as SafeDetailedMatchTeam).win === 'boolean' &&
    Array.isArray((obj as SafeDetailedMatchTeam).bans) &&
    typeof (obj as SafeDetailedMatchTeam).objectives === 'object'
  );
};

export const isDetailedMatchParticipant = (obj: unknown): obj is DetailedMatchParticipant => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'puuid' in obj &&
    'summonerName' in obj &&
    'championName' in obj &&
    'kills' in obj &&
    'deaths' in obj &&
    'assists' in obj &&
    'teamId' in obj &&
    typeof (obj as DetailedMatchParticipant).puuid === 'string' &&
    typeof (obj as DetailedMatchParticipant).kills === 'number' &&
    typeof (obj as DetailedMatchParticipant).deaths === 'number' &&
    typeof (obj as DetailedMatchParticipant).assists === 'number'
  );
};

// Utility functions for safe data access
export const safeArrayAccess = <T>(arr: T[] | undefined | null, index: number): T | null => {
  return arr && Array.isArray(arr) && index >= 0 && index < arr.length ? (arr[index] ?? null) : null;
};

export const safeObjectAccess = <T, K extends keyof T>(
  obj: T | undefined | null, 
  key: K
): T[K] | null => {
  return obj && typeof obj === 'object' && key in obj ? obj[key] : null;
};

// Type narrowing helpers
export const assertIsNumber = (value: unknown): asserts value is number => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Expected number but received: ' + typeof value);
  }
};

export const assertIsString = (value: unknown): asserts value is string => {
  if (typeof value !== 'string') {
    throw new Error('Expected string but received: ' + typeof value);
  }
};

export const assertIsArray = <T>(value: unknown): asserts value is T[] => {
  if (!Array.isArray(value)) {
    throw new Error('Expected array but received: ' + typeof value);
  }
};

// Safe numeric operations
export const safeCalculateWinRate = (wins: number, losses: number): number => {
  const totalGames = wins + losses;
  return totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
};

export const safeCalculateKDA = (kills: number, deaths: number, assists: number): number => {
  return deaths > 0 ? Number(((kills + assists) / deaths).toFixed(2)) : 99;
};

// Type-safe array filtering
export const filterValidChallenges = (challenges: unknown[]): ChallengeProgress[] => {
  return challenges.filter(isChallengeProgress);
};

export const filterValidLeaderboardUsers = (users: unknown[]): LeaderboardUser[] => {
  return users.filter(isLeaderboardUser);
};

export const filterValidRankedInfo = (rankedInfo: unknown[]): RankedQueueInfo[] => {
  return rankedInfo.filter(isRankedQueueInfo);
};

// Types for match details API and participant names caching
export interface MatchParticipantName {
  id?: string;
  match_id: string;
  puuid: string;
  game_name: string;
  tag_line: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface EnhancedMatchParticipant {
  // Player identity
  puuid: string;
  summonerId: string;
  summonerName: string;
  summonerLevel: number;
  riotIdName: string;
  riotIdTagline: string;
  
  // Champion info
  championId: number;
  championName: string;
  champLevel: number;
  championTransform: number;
  
  // Team info
  teamId: number;
  teamPosition: string;
  individualPosition: string;
  
  // Summoner spells & runes
  spell1Id: number;
  spell2Id: number;
  perks: Record<string, any>;
  
  // Items (0-6: items, 6 is trinket)
  items: number[];
  
  // Core stats
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  
  // Combat stats
  totalDamageDealtToChampions: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  magicDamageDealtToChampions: number;
  physicalDamageDealtToChampions: number;
  trueDamageDealtToChampions: number;
  totalHeal: number;
  totalUnitsHealed: number;
  damageSelfMitigated: number;
  
  // Economy stats
  goldEarned: number;
  goldSpent: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  
  // Vision stats
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsPlaced: number;
  wardsKilled: number;
  detectorWardsPlaced: number;
  
  // Objectives
  turretKills: number;
  turretTakedowns: number;
  inhibitorKills: number;
  inhibitorTakedowns: number;
  baronKills: number;
  dragonKills: number;
  
  // CC & utility
  totalTimeCCDealt: number;
  timeCCingOthers: number;
  totalTimeSpentDead: number;
  timePlayed: number;
  
  // Multi-kills
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  unrealKills: number;
  
  // First events
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  firstTowerKill: boolean;
  firstTowerAssist: boolean;
  
  // Other stats
  bountyLevel: number;
  totalAllyJungleMinionsKilled: number;
  totalEnemyJungleMinionsKilled: number;
  consumablesPurchased: number;
  itemsPurchased: number;
  
  // Challenges and meta
  challenges: Record<string, any>;
  profileIcon: number;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  eligibleForProgression: boolean;
  
  // Calculated stats
  kda: number;
  killParticipation: number;
  damagePerMinute: number;
  visionScorePerMinute: number;
  csPerMinute: number;
}

export interface EnhancedMatchTeam {
  teamId: number;
  win: boolean;
  bans: Array<{
    championId: number;
    pickTurn: number;
  }>;
  objectives: {
    baron: { first: boolean; kills: number };
    champion: { first: boolean; kills: number };
    dragon: { first: boolean; kills: number };
    inhibitor: { first: boolean; kills: number };
    riftHerald: { first: boolean; kills: number };
    tower: { first: boolean; kills: number };
  };
}

export interface MatchGameStats {
  totalKills: number;
  averageLevel: number;
  totalGold: number;
  firstBloodTime: number | null;
  winningTeam: number | null;
  gameLength: {
    minutes: number;
    seconds: number;
    formatted: string;
  };
}

export interface EnhancedMatchDetailsResponse {
  // Basic match info
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameStartTimestamp: number;
  gameEndTimestamp: number;
  gameMode: string;
  gameType: string;
  gameVersion: string;
  mapId: number;
  platformId: string;
  queueId: number;
  tournamentCode?: string;
  
  // Enhanced participants data
  participants: EnhancedMatchParticipant[];
  
  // Team information
  teams: EnhancedMatchTeam[];
  
  // Match metadata
  metadata: {
    dataVersion: string;
    participants: string[];
  };
  
  // Game statistics
  gameStats: MatchGameStats;
}

export interface MatchDetailsApiResponse {
  success: boolean;
  data?: EnhancedMatchDetailsResponse;
  error?: string;
}

// Type guards for new types
export const isMatchParticipantName = (obj: unknown): obj is MatchParticipantName => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'match_id' in obj &&
    'puuid' in obj &&
    'game_name' in obj &&
    'tag_line' in obj &&
    typeof (obj as MatchParticipantName).match_id === 'string' &&
    typeof (obj as MatchParticipantName).puuid === 'string' &&
    typeof (obj as MatchParticipantName).game_name === 'string' &&
    typeof (obj as MatchParticipantName).tag_line === 'string'
  );
};

export const isEnhancedMatchParticipant = (obj: unknown): obj is EnhancedMatchParticipant => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'puuid' in obj &&
    'championName' in obj &&
    'kills' in obj &&
    'deaths' in obj &&
    'assists' in obj &&
    'items' in obj &&
    Array.isArray((obj as EnhancedMatchParticipant).items) &&
    typeof (obj as EnhancedMatchParticipant).puuid === 'string' &&
    typeof (obj as EnhancedMatchParticipant).kills === 'number' &&
    typeof (obj as EnhancedMatchParticipant).deaths === 'number' &&
    typeof (obj as EnhancedMatchParticipant).assists === 'number'
  );
};