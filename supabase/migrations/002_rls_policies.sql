-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summoners ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranked_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.jwt() ->> 'discord_id' = discord_id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.jwt() ->> 'discord_id' = discord_id);

CREATE POLICY "Anyone can view public user info" ON users
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role = 'admin'
        )
    );

-- Summoners policies
CREATE POLICY "Users can manage their own summoners" ON summoners
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Anyone can view verified summoners" ON summoners
    FOR SELECT USING (verified = true);

CREATE POLICY "Admins can manage all summoners" ON summoners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role = 'admin'
        )
    );

-- Challenges policies
CREATE POLICY "Anyone can view active challenges" ON challenges
    FOR SELECT USING (active = true);

CREATE POLICY "Staff can manage challenges" ON challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- User challenges policies
CREATE POLICY "Users can view their own challenge progress" ON user_challenges
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Users can update their own challenge progress" ON user_challenges
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "System can insert challenge progress" ON user_challenges
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view completed challenges for leaderboards" ON user_challenges
    FOR SELECT USING (completed = true);

CREATE POLICY "Admins can manage all challenge progress" ON user_challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role = 'admin'
        )
    );

-- Match history policies
CREATE POLICY "Users can view their own match history" ON match_history
    FOR SELECT USING (
        summoner_id IN (
            SELECT s.id FROM summoners s
            JOIN users u ON s.user_id = u.id
            WHERE u.discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "System can insert match history" ON match_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update match history" ON match_history
    FOR UPDATE USING (true);

CREATE POLICY "Admins can manage all match history" ON match_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role = 'admin'
        )
    );

-- Ranked info policies
CREATE POLICY "Users can view their own ranked info" ON ranked_info
    FOR SELECT USING (
        summoner_id IN (
            SELECT s.id FROM summoners s
            JOIN users u ON s.user_id = u.id
            WHERE u.discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Anyone can view ranked info for verified summoners" ON ranked_info
    FOR SELECT USING (
        summoner_id IN (
            SELECT id FROM summoners WHERE verified = true
        )
    );

CREATE POLICY "System can manage ranked info" ON ranked_info
    FOR ALL WITH CHECK (true);

CREATE POLICY "Admins can manage all ranked info" ON ranked_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role = 'admin'
        )
    );

-- User points policies
CREATE POLICY "Anyone can view user points for leaderboards" ON user_points
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own points" ON user_points
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "System can update user points" ON user_points
    FOR ALL WITH CHECK (true);

CREATE POLICY "Admins can manage all user points" ON user_points
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role = 'admin'
        )
    );