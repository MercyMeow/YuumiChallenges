-- Fresh Database Schema for Yuumi Challenges
-- This schema incorporates all features from previous migrations

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types with updated role system
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE challenge_type AS ENUM ('kda', 'winstreak', 'champion_mastery', 'ranked_climb', 'games_played', 'perfect_game');
CREATE TYPE region_type AS ENUM ('na1', 'euw1', 'eun1', 'kr', 'jp1', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'ph2', 'sg2', 'th2', 'tw2', 'vn2');

-- Users table with updated role system
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    discriminator TEXT,
    avatar TEXT,
    roles TEXT[] DEFAULT '{}',
    user_role user_role DEFAULT 'member',
    joined_discord_at TIMESTAMPTZ,
    is_yuumi_member BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summoners table with all modern fields (single account per user)
CREATE TABLE summoners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    puuid TEXT UNIQUE NOT NULL,
    game_name TEXT NOT NULL,
    tag_line TEXT NOT NULL,
    region region_type NOT NULL,
    level INTEGER DEFAULT 1,
    profile_icon_id INTEGER DEFAULT 1,
    last_refreshed_at TIMESTAMPTZ,
    last_manual_refresh_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_summoner UNIQUE (user_id),
    CONSTRAINT check_riot_id_complete CHECK (game_name != '' AND tag_line != '')
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

-- Admin actions table for audit logging
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin user actions table for role management audit
CREATE TABLE admin_user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table for user reports and moderation
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System settings table for configurable settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_summoners_user_id ON summoners(user_id);
CREATE INDEX idx_summoners_puuid ON summoners(puuid);
CREATE INDEX idx_summoners_region ON summoners(region);
CREATE INDEX idx_summoners_game_name ON summoners(game_name);
CREATE INDEX idx_summoners_last_refreshed ON summoners(last_refreshed_at);
CREATE INDEX idx_summoners_manual_refresh ON summoners(last_manual_refresh_at);
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX idx_user_challenges_completed ON user_challenges(completed);
CREATE INDEX idx_match_history_summoner_id ON match_history(summoner_id);
CREATE INDEX idx_match_history_game_creation ON match_history(game_creation);
CREATE INDEX idx_match_history_analyzed ON match_history(analyzed_for_challenges);
CREATE INDEX idx_match_history_cleanup ON match_history(summoner_id, game_creation DESC);
CREATE INDEX idx_ranked_info_summoner_id ON ranked_info(summoner_id);
CREATE INDEX idx_user_points_total_points ON user_points(total_points DESC);

-- Admin and audit indexes
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_target_type ON admin_actions(target_type);
CREATE INDEX idx_admin_user_actions_admin_user_id ON admin_user_actions(admin_user_id);
CREATE INDEX idx_admin_user_actions_target_user_id ON admin_user_actions(target_user_id);
CREATE INDEX idx_admin_user_actions_created_at ON admin_user_actions(created_at);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_assigned_to ON reports(assigned_to);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

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

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log role changes
CREATE OR REPLACE FUNCTION log_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.user_role IS DISTINCT FROM NEW.user_role THEN
        INSERT INTO admin_user_actions (
            target_user_id,
            action_type,
            previous_value,
            new_value
        ) VALUES (
            NEW.id,
            'role_change',
            OLD.user_role::text,
            NEW.user_role::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for role change logging
CREATE TRIGGER trigger_log_user_role_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_role_change();

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
    VALUES (p_admin_id, p_action_type, p_target_type, p_target_id, p_details)
    RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old match data
CREATE OR REPLACE FUNCTION cleanup_old_match_data()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER := 0;
    summoner_record RECORD;
    match_count INTEGER;
BEGIN
    FOR summoner_record IN SELECT id FROM summoners LOOP
        SELECT COUNT(*) INTO match_count 
        FROM match_history 
        WHERE summoner_id = summoner_record.id;
        
        IF match_count > 20 THEN
            DELETE FROM match_history 
            WHERE summoner_id = summoner_record.id 
            AND id NOT IN (
                SELECT id FROM match_history 
                WHERE summoner_id = summoner_record.id 
                ORDER BY game_creation DESC 
                LIMIT 20
            );
            
            GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
        END IF;
        
        DELETE FROM match_history 
        WHERE summoner_id = summoner_record.id 
        AND game_creation < NOW() - INTERVAL '30 days';
        
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    END LOOP;
    
    RETURN deleted_count;
END $$;

-- Function to check if refresh is allowed
CREATE OR REPLACE FUNCTION can_refresh_summoner(
    summoner_uuid UUID,
    manual_refresh BOOLEAN DEFAULT false,
    auto_refresh_minutes INTEGER DEFAULT 15,
    manual_refresh_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    last_refresh TIMESTAMPTZ;
    last_manual TIMESTAMPTZ;
    cooldown_minutes INTEGER;
BEGIN
    SELECT last_refreshed_at, last_manual_refresh_at 
    INTO last_refresh, last_manual
    FROM summoners 
    WHERE id = summoner_uuid;
    
    IF last_refresh IS NULL THEN
        RETURN true;
    END IF;
    
    IF manual_refresh THEN
        IF last_manual IS NOT NULL AND 
           last_manual > NOW() - INTERVAL '1 minute' * manual_refresh_minutes THEN
            RETURN false;
        END IF;
        cooldown_minutes := manual_refresh_minutes;
    ELSE
        cooldown_minutes := auto_refresh_minutes;
    END IF;
    
    RETURN last_refresh <= NOW() - INTERVAL '1 minute' * cooldown_minutes;
END $$;

-- Create user summoner overview view
CREATE VIEW user_summoner_overview AS
SELECT 
    u.id as user_id,
    u.discord_id,
    u.username,
    u.avatar,
    u.user_role,
    s.id as summoner_id,
    s.puuid,
    s.game_name,
    s.tag_line,
    s.region,
    s.level,
    s.profile_icon_id,
    s.created_at as summoner_created_at,
    CONCAT(s.game_name, '#', s.tag_line) as full_riot_id,
    CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_summoner
FROM users u
LEFT JOIN summoners s ON u.id = s.user_id;

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category) VALUES
    ('maintenance_mode', 'false', 'Enable/disable maintenance mode', 'system'),
    ('registration_enabled', 'true', 'Allow new user registrations', 'system'),
    ('max_summoners_per_user', '1', 'Maximum number of summoners per user', 'system'),
    ('challenge_creation_enabled', 'true', 'Allow challenge creation', 'challenges'),
    ('default_challenge_points', '100', 'Default points for new challenges', 'challenges'),
    ('leaderboard_enabled', 'true', 'Enable/disable leaderboard', 'features'),
    ('discord_webhook_url', '""', 'Discord webhook for notifications', 'integrations');

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summoners ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranked_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT
    USING (discord_id = auth.jwt() ->> 'discord_id');

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE
    USING (discord_id = auth.jwt() ->> 'discord_id');

CREATE POLICY "Public can view verified users" ON users
    FOR SELECT
    USING (is_yuumi_member = true);

CREATE POLICY "Admin and Owner can manage all users" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.discord_id = (auth.jwt() ->> 'discord_id')::text 
            AND u.user_role IN ('admin', 'owner')
        )
    );

-- RLS Policies for summoners table
CREATE POLICY "Users can manage their own summoners" ON summoners
    FOR ALL
    USING (
        user_id = (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Public can view verified summoners" ON summoners
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = user_id AND is_yuumi_member = true
        )
    );

-- RLS Policies for admin_user_actions
CREATE POLICY "Admin and Owner can view admin actions" ON admin_user_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.discord_id = (auth.jwt() ->> 'discord_id')::text 
            AND u.user_role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Admin and Owner can create admin actions" ON admin_user_actions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.discord_id = (auth.jwt() ->> 'discord_id')::text 
            AND u.user_role IN ('admin', 'owner')
        )
    );

-- RLS Policies for admin_actions table
CREATE POLICY "Admins can view all admin actions" ON admin_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

CREATE POLICY "System can insert admin actions" ON admin_actions
    FOR INSERT
    WITH CHECK (true);

-- RLS Policies for reports table
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT
    USING (
        reporter_id = (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Admins can view all reports" ON reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT
    WITH CHECK (
        reporter_id = (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Admins can update reports" ON reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

-- RLS Policies for system_settings table
CREATE POLICY "Everyone can view system settings" ON system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Owners can manage system settings" ON system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role = 'owner'
        )
    );

-- Additional RLS policies for other tables (basic structure)
CREATE POLICY "Users can manage their challenges" ON user_challenges
    FOR ALL
    USING (
        user_id = (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Public can view completed challenges" ON user_challenges
    FOR SELECT
    USING (completed = true);

CREATE POLICY "Users can manage their match history" ON match_history
    FOR ALL
    USING (
        summoner_id IN (
            SELECT s.id FROM summoners s
            JOIN users u ON s.user_id = u.id
            WHERE u.discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Public can view match history" ON match_history
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their ranked info" ON ranked_info
    FOR ALL
    USING (
        summoner_id IN (
            SELECT s.id FROM summoners s
            JOIN users u ON s.user_id = u.id
            WHERE u.discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Public can view ranked info" ON ranked_info
    FOR SELECT
    USING (true);

CREATE POLICY "Public can view challenges" ON challenges
    FOR SELECT
    USING (active = true);

CREATE POLICY "Admins can manage challenges" ON challenges
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Public can view user points" ON user_points
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their points" ON user_points
    FOR ALL
    USING (
        user_id = (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

-- Add comments to document the schema
COMMENT ON TABLE users IS 'Discord users with role-based access control';
COMMENT ON TABLE summoners IS 'League of Legends accounts (one per user)';
COMMENT ON TABLE admin_user_actions IS 'Audit trail for role changes and user management';
COMMENT ON COLUMN summoners.game_name IS 'The display name part of Riot ID (e.g., "PlayerName" in PlayerName#NA1)';
COMMENT ON COLUMN summoners.tag_line IS 'The tag part of Riot ID (e.g., "NA1" in PlayerName#NA1)';
COMMENT ON COLUMN summoners.last_refreshed_at IS 'Timestamp of last automatic refresh (any type of refresh)';
COMMENT ON COLUMN summoners.last_manual_refresh_at IS 'Timestamp of last manual refresh (for rate limiting)';
COMMENT ON CONSTRAINT unique_user_summoner ON summoners IS 'Ensures each user can only have one linked League of Legends account';
COMMENT ON VIEW user_summoner_overview IS 'Provides user information with their single linked summoner including full Riot ID display';