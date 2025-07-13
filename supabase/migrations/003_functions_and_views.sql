-- Function to calculate user rank based on points
CREATE OR REPLACE FUNCTION calculate_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rank positions based on total points
    WITH ranked_users AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY total_points DESC, challenges_completed DESC) as new_rank
        FROM user_points
    )
    UPDATE user_points 
    SET rank_position = ranked_users.new_rank
    FROM ranked_users
    WHERE user_points.user_id = ranked_users.user_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate ranks when points change
CREATE TRIGGER recalculate_ranks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_points
    FOR EACH STATEMENT
    EXECUTE FUNCTION calculate_user_rank();

-- Function to update user points when challenge is completed
CREATE OR REPLACE FUNCTION update_user_points_on_challenge_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if challenge was just completed
    IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
        -- Get challenge points
        DECLARE
            challenge_points INTEGER;
        BEGIN
            SELECT reward_points INTO challenge_points
            FROM challenges
            WHERE id = NEW.challenge_id;
            
            -- Insert or update user points
            INSERT INTO user_points (user_id, total_points, challenges_completed)
            VALUES (NEW.user_id, challenge_points, 1)
            ON CONFLICT (user_id)
            DO UPDATE SET
                total_points = user_points.total_points + challenge_points,
                challenges_completed = user_points.challenges_completed + 1,
                updated_at = NOW();
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for challenge completion
CREATE TRIGGER update_points_on_challenge_completion
    AFTER UPDATE ON user_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_on_challenge_completion();

-- Function to get user leaderboard position
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT rank_position INTO user_rank
    FROM user_points
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get challenge progress for a user
CREATE OR REPLACE FUNCTION get_user_challenge_progress(p_user_id UUID, p_challenge_id UUID)
RETURNS TABLE(
    progress INTEGER,
    max_progress INTEGER,
    completed BOOLEAN,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.progress,
        uc.max_progress,
        uc.completed,
        uc.completed_at
    FROM user_challenges uc
    WHERE uc.user_id = p_user_id AND uc.challenge_id = p_challenge_id;
END;
$$ LANGUAGE plpgsql;

-- View for leaderboard
CREATE VIEW leaderboard AS
SELECT 
    u.id,
    u.username,
    u.avatar,
    up.total_points,
    up.challenges_completed,
    up.rank_position,
    CASE 
        WHEN up.rank_position <= 3 THEN 'gold'
        WHEN up.rank_position <= 10 THEN 'silver'
        WHEN up.rank_position <= 50 THEN 'bronze'
        ELSE 'normal'
    END as badge_tier
FROM users u
JOIN user_points up ON u.id = up.user_id
ORDER BY up.rank_position ASC;

-- View for active challenges with completion stats
CREATE VIEW challenges_with_stats AS
SELECT 
    c.*,
    COUNT(uc.id) as total_participants,
    COUNT(CASE WHEN uc.completed THEN 1 END) as total_completions,
    ROUND(
        COUNT(CASE WHEN uc.completed THEN 1 END)::numeric / 
        NULLIF(COUNT(uc.id), 0) * 100, 2
    ) as completion_rate
FROM challenges c
LEFT JOIN user_challenges uc ON c.id = uc.challenge_id
WHERE c.active = true
GROUP BY c.id
ORDER BY c.created_at DESC;

-- View for user summoner overview
CREATE VIEW user_summoner_overview AS
SELECT 
    u.id as user_id,
    u.username,
    u.avatar,
    s.id as summoner_id,
    s.name as summoner_name,
    s.tag_line,
    s.region,
    s.level,
    s.verified,
    ri.tier,
    ri.rank_level,
    ri.league_points,
    ri.wins,
    ri.losses,
    CASE 
        WHEN ri.wins + ri.losses > 0 
        THEN ROUND(ri.wins::numeric / (ri.wins + ri.losses) * 100, 1)
        ELSE 0 
    END as win_rate
FROM users u
JOIN summoners s ON u.id = s.user_id
LEFT JOIN ranked_info ri ON s.id = ri.summoner_id 
    AND ri.queue_type = 'RANKED_SOLO_5x5'
WHERE s.verified = true;