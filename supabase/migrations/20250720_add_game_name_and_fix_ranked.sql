-- Migration: Add game_name field and improve summoner data storage
-- This migration adds the missing game_name field to properly store full Riot IDs

-- Add game_name field to summoners table
ALTER TABLE summoners ADD COLUMN game_name TEXT;

-- For existing users, we'll need to populate this field
-- For now, we'll set it to the same as tag_line as a placeholder
-- In production, this should be populated by re-fetching from Riot API
UPDATE summoners 
SET game_name = tag_line 
WHERE game_name IS NULL;

-- Make game_name required going forward
ALTER TABLE summoners ALTER COLUMN game_name SET NOT NULL;

-- Add a constraint to ensure both game_name and tag_line are provided
ALTER TABLE summoners ADD CONSTRAINT check_riot_id_complete 
CHECK (game_name != '' AND tag_line != '');

-- Add comments to document the fields
COMMENT ON COLUMN summoners.game_name IS 'The display name part of Riot ID (e.g., "PlayerName" in PlayerName#NA1)';
COMMENT ON COLUMN summoners.tag_line IS 'The tag part of Riot ID (e.g., "NA1" in PlayerName#NA1)';

-- Create index for game_name for better search performance
CREATE INDEX IF NOT EXISTS idx_summoners_game_name ON summoners(game_name);

-- Add a computed column helper for full Riot ID display (for views)
-- Update the user_summoner_overview view to include game_name
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
    s.game_name,
    s.tag_line,
    s.region,
    s.level,
    s.profile_icon_id,
    s.created_at as summoner_created_at,
    -- Add computed full Riot ID for easy display
    CONCAT(s.game_name, '#', s.tag_line) as full_riot_id,
    -- Add helpful flags for UI
    CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_summoner
FROM users u
LEFT JOIN summoners s ON u.id = s.user_id;

COMMENT ON VIEW user_summoner_overview IS 
'Provides user information with their single linked summoner including full Riot ID display';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed. Added game_name field and updated view for full Riot ID support';
    RAISE NOTICE 'Existing users have game_name set to tag_line as placeholder - should be updated via API';
END $$;