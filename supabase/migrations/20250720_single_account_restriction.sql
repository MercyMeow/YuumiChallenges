-- Migration: Implement single account restriction per user
-- This migration ensures each user can only have one linked League account

-- First, handle existing users with multiple summoners
-- Keep the most recent summoner for each user and remove older ones

-- Create a backup table for affected summoners (for potential recovery)
CREATE TABLE IF NOT EXISTS summoners_backup_multi_account AS
SELECT * FROM summoners WHERE FALSE; -- Creates empty table with same structure

-- Insert summoners that will be removed into backup
INSERT INTO summoners_backup_multi_account
SELECT s1.*
FROM summoners s1
WHERE EXISTS (
    SELECT 1
    FROM summoners s2
    WHERE s2.user_id = s1.user_id
    AND s2.created_at > s1.created_at
);

-- Log users affected by this migration
DO $$
DECLARE
    affected_count INTEGER;
    user_record RECORD;
BEGIN
    -- Count users with multiple summoners
    SELECT COUNT(DISTINCT user_id) INTO affected_count
    FROM summoners s1
    WHERE EXISTS (
        SELECT 1
        FROM summoners s2
        WHERE s2.user_id = s1.user_id
        AND s2.id != s1.id
    );
    
    RAISE NOTICE 'Migration will affect % users with multiple summoners', affected_count;
    
    -- Log each affected user (for admin reference)
    FOR user_record IN 
        SELECT DISTINCT s.user_id, u.username, u.discord_id, COUNT(s.id) as summoner_count
        FROM summoners s
        JOIN users u ON u.id = s.user_id
        GROUP BY s.user_id, u.username, u.discord_id
        HAVING COUNT(s.id) > 1
        ORDER BY summoner_count DESC
    LOOP
        RAISE NOTICE 'User % (Discord: %) has % summoners - keeping most recent', 
            user_record.username, user_record.discord_id, user_record.summoner_count;
    END LOOP;
END $$;

-- Delete older summoners, keeping only the most recent for each user
-- This will cascade delete related match_history and ranked_info records
DELETE FROM summoners s1
WHERE EXISTS (
    SELECT 1
    FROM summoners s2
    WHERE s2.user_id = s1.user_id
    AND s2.created_at > s1.created_at
);

-- Add unique constraint to enforce one summoner per user
ALTER TABLE summoners ADD CONSTRAINT unique_user_summoner UNIQUE (user_id);

-- Add a comment to document this constraint
COMMENT ON CONSTRAINT unique_user_summoner ON summoners IS 
'Ensures each user can only have one linked League of Legends account';

-- Update the view to reflect single summoner per user expectation
DROP VIEW IF EXISTS user_summoner_overview;
CREATE VIEW user_summoner_overview AS
SELECT 
    u.id as user_id,
    u.discord_id,
    u.username,
    u.avatar,
    u.user_role,
    s.id as summoner_id,
    s.puuid,
    s.tag_line,
    s.region,
    s.level,
    s.profile_icon_id,
    s.created_at as summoner_created_at,
    -- Add helpful flags for UI
    CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_summoner
FROM users u
LEFT JOIN summoners s ON u.id = s.user_id;

COMMENT ON VIEW user_summoner_overview IS 
'Provides user information with their single linked summoner (if any)';

-- Create index for performance on the new constraint
CREATE INDEX IF NOT EXISTS idx_summoners_user_id_unique ON summoners(user_id);

-- Log completion
DO $$
DECLARE
    final_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM summoners;
    SELECT COUNT(*) INTO backup_count FROM summoners_backup_multi_account;
    
    RAISE NOTICE 'Migration completed. Final summoner count: %, Backup count: %', 
        final_count, backup_count;
    RAISE NOTICE 'Each user now has at most one linked League account';
END $$;