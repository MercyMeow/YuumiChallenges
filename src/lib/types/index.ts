export interface User {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  roles: string[];
  joined_discord_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Summoner {
  id: string;
  user_id: string;
  puuid: string;
  summoner_id: string;
  account_id: string;
  name: string;
  tag_line: string;
  region: string;
  level: number;
  profile_icon_id: number;
  verified: boolean;
  verification_code: string | null;
  created_at: Date;
  updated_at: Date;
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

export interface MatchData {
  match_id: string;
  summoner_id: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  duration: number;
  game_mode: string;
  created_at: Date;
}

export interface RankedInfo {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  queue_type: string;
}