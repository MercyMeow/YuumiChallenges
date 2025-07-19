-- Remove legacy Riot API fields that are no longer returned
-- Modern Riot API only returns puuid, profileIconId, revisionDate, summonerLevel
-- We'll use account API (gameName, tagLine) for display names

-- First drop the view that depends on these fields
DROP VIEW IF EXISTS user_summoner_overview;

-- Drop the unique constraint that used summoner_id
ALTER TABLE summoners DROP CONSTRAINT IF EXISTS summoners_summoner_id_region_key;

-- Remove the legacy fields that Riot API no longer provides
ALTER TABLE summoners 
DROP COLUMN IF EXISTS summoner_id,
DROP COLUMN IF EXISTS account_id,
DROP COLUMN IF EXISTS name;

-- Recreate the view without the removed fields
CREATE VIEW user_summoner_overview AS
SELECT 
    u.id as user_id,
    u.discord_id,
    u.username,
    u.avatar,
    s.id as summoner_id,
    s.puuid,
    s.tag_line,
    s.region,
    s.level,
    s.profile_icon_id,
    s.created_at as summoner_created_at
FROM users u
JOIN summoners s ON u.id = s.user_id;

-- The puuid field remains and is already unique globally via summoners_puuid_key constraint
-- ranked_info.summoner_id already correctly references summoners.id (UUID), not the legacy Riot summoner_id