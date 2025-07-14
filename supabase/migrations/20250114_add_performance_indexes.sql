-- Migration to add performance indexes for optimized queries

-- Index for match history queries (game_creation + summoner_id combo)
CREATE INDEX IF NOT EXISTS idx_match_history_summoner_game 
ON match_history(summoner_id, game_creation DESC);

-- Index for user_challenges queries (frequently filtered by user_id + completed)
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_completed 
ON user_challenges(user_id, completed);

-- Index for challenge participant counts
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_completed 
ON user_challenges(challenge_id, completed);

-- Index for ranked info lookups
CREATE INDEX IF NOT EXISTS idx_ranked_info_summoner_queue 
ON ranked_info(summoner_id, queue_type);

-- Index for time-based activity queries
CREATE INDEX IF NOT EXISTS idx_users_activity 
ON users(is_yuumi_member, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_last_activity 
ON users(is_yuumi_member, last_activity DESC);

-- Index for user points leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_points_rank 
ON user_points(rank_position) 
WHERE rank_position IS NOT NULL;

-- Composite index for challenge queries with dates
CREATE INDEX IF NOT EXISTS idx_challenges_active_dates 
ON challenges(active, start_date, end_date);

-- Index for challenge completions with timestamps
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed_at 
ON user_challenges(completed_at DESC) 
WHERE completed = true;

-- Analyze tables to update statistics
ANALYZE match_history;
ANALYZE user_challenges;
ANALYZE ranked_info;
ANALYZE users;
ANALYZE user_points;
ANALYZE challenges;