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
  last_refreshed_at?: Date;
  last_manual_refresh_at?: Date;
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
  last_refreshed_at?: Date | null;
  last_manual_refresh_at?: Date | null;
  next_auto_refresh?: Date | null;
  next_manual_refresh?: Date | null;
  total_matches?: number;
  last_match_date?: Date | null;
}