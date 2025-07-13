-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE challenge_type AS ENUM ('kda', 'winstreak', 'champion_mastery', 'ranked_climb', 'games_played', 'perfect_game');
CREATE TYPE region_type AS ENUM ('na1', 'euw1', 'eun1', 'kr', 'jp1', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'ph2', 'sg2', 'th2', 'tw2', 'vn2');

-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    discriminator TEXT,
    avatar TEXT,
    email TEXT,
    roles TEXT[] DEFAULT '{}',
    user_role user_role DEFAULT 'member',
    joined_discord_at TIMESTAMPTZ,
    is_yuumi_member BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summoners table
CREATE TABLE summoners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    puuid TEXT UNIQUE NOT NULL,
    summoner_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tag_line TEXT NOT NULL,
    region region_type NOT NULL,
    level INTEGER DEFAULT 1,
    profile_icon_id INTEGER DEFAULT 1,
    verified BOOLEAN DEFAULT false,
    verification_code TEXT,
    verification_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(summoner_id, region)
);

-- Challenges table
CREATE TABLE challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type challenge_type NOT NULL,
    criteria JSONB NOT NULL,
    reward_points INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User challenges progress table
CREATE TABLE user_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    max_progress INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- Match history table
CREATE TABLE match_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    summoner_id UUID REFERENCES summoners(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    champion TEXT NOT NULL,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    win BOOLEAN NOT NULL,
    duration INTEGER NOT NULL,
    game_mode TEXT NOT NULL,
    queue_id INTEGER NOT NULL,
    game_creation TIMESTAMPTZ NOT NULL,
    analyzed_for_challenges BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(summoner_id, match_id)
);

-- Ranked information table
CREATE TABLE ranked_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    summoner_id UUID REFERENCES summoners(id) ON DELETE CASCADE,
    queue_type TEXT NOT NULL,
    tier TEXT NOT NULL,
    rank_level TEXT NOT NULL,
    league_points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    hot_streak BOOLEAN DEFAULT false,
    veteran BOOLEAN DEFAULT false,
    fresh_blood BOOLEAN DEFAULT false,
    inactive BOOLEAN DEFAULT false,
    season TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(summoner_id, queue_type, season)
);

-- User points and leaderboard
CREATE TABLE user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    rank_position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_summoners_user_id ON summoners(user_id);
CREATE INDEX idx_summoners_puuid ON summoners(puuid);
CREATE INDEX idx_summoners_region ON summoners(region);
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX idx_user_challenges_completed ON user_challenges(completed);
CREATE INDEX idx_match_history_summoner_id ON match_history(summoner_id);
CREATE INDEX idx_match_history_game_creation ON match_history(game_creation);
CREATE INDEX idx_match_history_analyzed ON match_history(analyzed_for_challenges);
CREATE INDEX idx_ranked_info_summoner_id ON ranked_info(summoner_id);
CREATE INDEX idx_user_points_total_points ON user_points(total_points DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summoners_updated_at BEFORE UPDATE ON summoners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at BEFORE UPDATE ON user_challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ranked_info_updated_at BEFORE UPDATE ON ranked_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();