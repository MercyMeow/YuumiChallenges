-- Remove legacy verification fields from summoners table
-- These fields are no longer needed as the new verification system
-- verifies accounts immediately upon successful icon verification

-- First drop the dependent objects
DROP POLICY IF EXISTS "Anyone can view verified summoners" ON summoners;
DROP VIEW IF EXISTS user_summoner_overview;

-- Remove the verification fields
ALTER TABLE summoners 
DROP COLUMN IF EXISTS verified,
DROP COLUMN IF EXISTS verification_code,
DROP COLUMN IF EXISTS verification_expires_at;

-- Create new policy for public visibility (all summoners are now considered verified)
CREATE POLICY "Anyone can view summoners" ON summoners
    FOR SELECT USING (true);

-- Recreate the user_summoner_overview view without the verified column
CREATE VIEW user_summoner_overview AS
SELECT 
    u.id as user_id,
    u.discord_id,
    u.username,
    u.avatar,
    s.id as summoner_id,
    s.puuid,
    s.summoner_id as riot_summoner_id,
    s.name,
    s.tag_line,
    s.region,
    s.level,
    s.profile_icon_id,
    s.created_at as summoner_created_at
FROM users u
JOIN summoners s ON u.id = s.user_id;