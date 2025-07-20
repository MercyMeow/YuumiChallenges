export type UserRole = 'owner' | 'admin' | 'member';

export interface User {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  roles: string[];
  user_role: UserRole;
  joined_discord_at: Date;
  is_yuumi_member: boolean;
  is_discord_owner: boolean;
  discord_guild_permissions: number;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUserAction {
  id: string;
  admin_user_id: string | null;
  target_user_id: string;
  action_type: string;
  previous_value?: string;
  new_value?: string;
  reason?: string;
  created_at: Date;
  admin_user?: User;
  target_user?: User;
}

export interface Summoner {
  id: string;
  user_id: string;
  puuid: string;
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
  summoner_id: string;
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
  };
  next_refresh_available?: Date;
}

export interface RefreshStatus {
  can_refresh: boolean;
  can_manual_refresh: boolean;
  last_refreshed_at?: Date;
  last_manual_refresh_at?: Date;
  next_auto_refresh?: Date;
  next_manual_refresh?: Date;
}