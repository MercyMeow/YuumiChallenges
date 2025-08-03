export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_user_actions: {
        Row: {
          action_type: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          new_value: string | null
          previous_value: string | null
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action_type: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          new_value?: string | null
          previous_value?: string | null
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          new_value?: string | null
          previous_value?: string | null
          reason?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_actions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_actions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "admin_user_actions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_user_actions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "admin_user_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "admin_user_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_user_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      challenges: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          criteria: Json
          description: string
          featured: boolean | null
          id: string
          reward_points: number | null
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          criteria: Json
          description: string
          featured?: boolean | null
          id?: string
          reward_points?: number | null
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json
          description?: string
          featured?: boolean | null
          id?: string
          reward_points?: number | null
          title?: string
          type?: Database["public"]["Enums"]["challenge_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      match_history: {
        Row: {
          all_participants: Json | null
          analyzed_for_challenges: boolean | null
          assists: number | null
          champion: string
          champion_level: number | null
          created_at: string | null
          cs: number | null
          deaths: number | null
          duration: number
          game_creation: string
          game_mode: string
          gold: number | null
          id: string
          items: Json | null
          kills: number | null
          match_id: string
          queue_id: number
          summoner_id: string
          summoner_spells: Json | null
          vision_score: number | null
          win: boolean
        }
        Insert: {
          all_participants?: Json | null
          analyzed_for_challenges?: boolean | null
          assists?: number | null
          champion: string
          champion_level?: number | null
          created_at?: string | null
          cs?: number | null
          deaths?: number | null
          duration: number
          game_creation: string
          game_mode: string
          gold?: number | null
          id?: string
          items?: Json | null
          kills?: number | null
          match_id: string
          queue_id: number
          summoner_id: string
          summoner_spells?: Json | null
          vision_score?: number | null
          win: boolean
        }
        Update: {
          all_participants?: Json | null
          analyzed_for_challenges?: boolean | null
          assists?: number | null
          champion?: string
          champion_level?: number | null
          created_at?: string | null
          cs?: number | null
          deaths?: number | null
          duration?: number
          game_creation?: string
          game_mode?: string
          gold?: number | null
          id?: string
          items?: Json | null
          kills?: number | null
          match_id?: string
          queue_id?: number
          summoner_id?: string
          summoner_spells?: Json | null
          vision_score?: number | null
          win?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "match_history_summoner_id_fkey"
            columns: ["summoner_id"]
            isOneToOne: false
            referencedRelation: "summoners"
            referencedColumns: ["puuid"]
          },
          {
            foreignKeyName: "match_history_summoner_id_fkey"
            columns: ["summoner_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["puuid"]
          },
          {
            foreignKeyName: "match_history_summoner_id_fkey"
            columns: ["summoner_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["summoner_id"]
          },
        ]
      }
      ranked_info: {
        Row: {
          created_at: string | null
          fresh_blood: boolean | null
          hot_streak: boolean | null
          id: string
          inactive: boolean | null
          league_points: number | null
          losses: number | null
          queue_type: string
          rank_level: string
          season: string
          summoner_id: string
          tier: string
          updated_at: string | null
          veteran: boolean | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          fresh_blood?: boolean | null
          hot_streak?: boolean | null
          id?: string
          inactive?: boolean | null
          league_points?: number | null
          losses?: number | null
          queue_type: string
          rank_level: string
          season: string
          summoner_id: string
          tier: string
          updated_at?: string | null
          veteran?: boolean | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          fresh_blood?: boolean | null
          hot_streak?: boolean | null
          id?: string
          inactive?: boolean | null
          league_points?: number | null
          losses?: number | null
          queue_type?: string
          rank_level?: string
          season?: string
          summoner_id?: string
          tier?: string
          updated_at?: string | null
          veteran?: boolean | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ranked_info_summoner_id_fkey"
            columns: ["summoner_id"]
            isOneToOne: false
            referencedRelation: "summoners"
            referencedColumns: ["puuid"]
          },
          {
            foreignKeyName: "ranked_info_summoner_id_fkey"
            columns: ["summoner_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["puuid"]
          },
          {
            foreignKeyName: "ranked_info_summoner_id_fkey"
            columns: ["summoner_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["summoner_id"]
          },
        ]
      }
      summoners: {
        Row: {
          created_at: string | null
          game_name: string
          last_manual_refresh_at: string | null
          last_refreshed_at: string | null
          level: number | null
          profile_icon_id: number | null
          puuid: string
          region: Database["public"]["Enums"]["region_type"]
          tag_line: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_name: string
          last_manual_refresh_at?: string | null
          last_refreshed_at?: string | null
          level?: number | null
          profile_icon_id?: number | null
          puuid: string
          region: Database["public"]["Enums"]["region_type"]
          tag_line?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_name?: string
          last_manual_refresh_at?: string | null
          last_refreshed_at?: string | null
          level?: number | null
          profile_icon_id?: number | null
          puuid?: string
          region?: Database["public"]["Enums"]["region_type"]
          tag_line?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summoners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summoners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "summoners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "summoners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      summoners_backup_multi_account: {
        Row: {
          created_at: string | null
          game_name: string | null
          last_manual_refresh_at: string | null
          last_refreshed_at: string | null
          level: number | null
          profile_icon_id: number | null
          puuid: string | null
          region: Database["public"]["Enums"]["region_type"] | null
          tag_line: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          game_name?: string | null
          last_manual_refresh_at?: string | null
          last_refreshed_at?: string | null
          level?: number | null
          profile_icon_id?: number | null
          puuid?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          tag_line?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          game_name?: string | null
          last_manual_refresh_at?: string | null
          last_refreshed_at?: string | null
          level?: number | null
          profile_icon_id?: number | null
          puuid?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          tag_line?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          max_progress: number
          progress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          max_progress: number
          progress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          max_progress?: number
          progress?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      user_points: {
        Row: {
          challenges_completed: number | null
          created_at: string | null
          id: string
          rank_position: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenges_completed?: number | null
          created_at?: string | null
          id?: string
          rank_position?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenges_completed?: number | null
          created_at?: string | null
          id?: string
          rank_position?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string | null
          discord_id: string
          is_yuumi_member: boolean | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          username: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          discord_id: string
          is_yuumi_member?: boolean | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          username: string
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          discord_id?: string
          is_yuumi_member?: boolean | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      challenges_with_stats: {
        Row: {
          active: boolean | null
          completion_rate: number | null
          created_at: string | null
          created_by: string | null
          criteria: Json | null
          description: string | null
          featured: boolean | null
          id: string | null
          reward_points: number | null
          title: string | null
          total_completions: number | null
          total_participants: number | null
          type: Database["public"]["Enums"]["challenge_type"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_summoner_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          avatar: string | null
          badge_tier: string | null
          challenges_completed: number | null
          id: string | null
          rank_position: number | null
          total_points: number | null
          username: string | null
        }
        Relationships: []
      }
      user_summoner_overview: {
        Row: {
          avatar: string | null
          discord_id: string | null
          display_name: string | null
          game_name: string | null
          has_summoner: boolean | null
          level: number | null
          profile_icon_id: number | null
          puuid: string | null
          region: Database["public"]["Enums"]["region_type"] | null
          summoner_created_at: string | null
          summoner_id: string | null
          tag_line: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_refresh_summoner: {
        Args: {
          summoner_puuid: string
          manual_refresh?: boolean
          auto_refresh_minutes?: number
          manual_refresh_minutes?: number
        }
        Returns: boolean
      }
      cleanup_old_match_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_participant_names: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_summoner_refresh_status: {
        Args: {
          summoner_puuid: string
          auto_refresh_minutes?: number
          manual_refresh_minutes?: number
        }
        Returns: {
          can_auto_refresh: boolean
          can_manual_refresh: boolean
          last_refreshed_at: string
          last_manual_refresh_at: string
          next_auto_refresh: string
          next_manual_refresh: string
          total_matches: number
          last_match_date: string
        }[]
      }
      validate_participants_data: {
        Args: { participants: Json }
        Returns: boolean
      }
    }
    Enums: {
      challenge_type:
        | "kda"
        | "winstreak"
        | "champion_mastery"
        | "ranked_climb"
        | "games_played"
        | "perfect_game"
      region_type:
        | "na1"
        | "euw1"
        | "eun1"
        | "kr"
        | "jp1"
        | "br1"
        | "la1"
        | "la2"
        | "oc1"
        | "tr1"
        | "ru"
        | "ph2"
        | "sg2"
        | "th2"
        | "tw2"
        | "vn2"
      user_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      challenge_type: [
        "kda",
        "winstreak",
        "champion_mastery",
        "ranked_climb",
        "games_played",
        "perfect_game",
      ],
      region_type: [
        "na1",
        "euw1",
        "eun1",
        "kr",
        "jp1",
        "br1",
        "la1",
        "la2",
        "oc1",
        "tr1",
        "ru",
        "ph2",
        "sg2",
        "th2",
        "tw2",
        "vn2",
      ],
      user_role: ["owner", "admin", "member"],
    },
  },
} as const