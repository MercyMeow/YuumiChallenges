-- Migration: Fix refresh function to use puuid instead of id
-- This fixes the critical bug where can_refresh_summoner was looking for UUID id
-- but being called with TEXT puuid, causing all refresh operations to fail

-- Drop the existing function
DROP FUNCTION IF EXISTS can_refresh_summoner(UUID, BOOLEAN, INTEGER, INTEGER);

-- Recreate with correct parameter type and field reference
CREATE OR REPLACE FUNCTION can_refresh_summoner(
    summoner_puuid TEXT,  -- Changed from UUID to TEXT to match API usage
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
    -- Get refresh timestamps using puuid field instead of id
    SELECT last_refreshed_at, last_manual_refresh_at 
    INTO last_refresh, last_manual
    FROM summoners 
    WHERE puuid = summoner_puuid;  -- Changed from id = summoner_uuid to puuid = summoner_puuid
    
    -- If no previous refresh, allow it
    IF last_refresh IS NULL THEN
        RETURN true;
    END IF;
    
    -- Determine cooldown period
    IF manual_refresh THEN
        -- Manual refresh: check both manual cooldown and general cooldown
        IF last_manual IS NOT NULL AND 
           last_manual > NOW() - INTERVAL '1 minute' * manual_refresh_minutes THEN
            RETURN false;
        END IF;
        cooldown_minutes := manual_refresh_minutes;
    ELSE
        -- Auto refresh: check general cooldown only
        cooldown_minutes := auto_refresh_minutes;
    END IF;
    
    -- Check if enough time has passed
    RETURN last_refresh <= NOW() - INTERVAL '1 minute' * cooldown_minutes;
END $$;

-- Update the cleanup function to also use puuid consistently
CREATE OR REPLACE FUNCTION cleanup_old_match_data()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER := 0;
    summoner_record RECORD;
    match_count INTEGER;
BEGIN
    -- For each summoner, keep only the latest 20 matches and delete matches older than 30 days
    -- Updated to use id for the foreign key relationship (assuming match_history.summoner_id references summoners.id)
    FOR summoner_record IN SELECT id FROM summoners LOOP
        -- Count current matches for this summoner
        SELECT COUNT(*) INTO match_count 
        FROM match_history 
        WHERE summoner_id = summoner_record.id;
        
        -- If more than 20 matches, delete oldest ones
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
        
        -- Delete matches older than 30 days regardless of count
        DELETE FROM match_history 
        WHERE summoner_id = summoner_record.id 
        AND game_creation < NOW() - INTERVAL '30 days';
        
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    END LOOP;
    
    RETURN deleted_count;
END $$;

-- Test the function to ensure it works
DO $$
DECLARE
    test_result BOOLEAN;
    summoner_puuid_test TEXT;
BEGIN
    -- Get a random summoner puuid for testing
    SELECT puuid INTO summoner_puuid_test FROM summoners LIMIT 1;
    
    IF summoner_puuid_test IS NOT NULL THEN
        -- Test the function
        SELECT can_refresh_summoner(summoner_puuid_test, true) INTO test_result;
        RAISE NOTICE 'Function test completed. Test puuid: %, Can refresh: %', summoner_puuid_test, test_result;
    ELSE
        RAISE NOTICE 'No summoners found for testing';
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Fixed can_refresh_summoner function to use puuid instead of UUID id';
    RAISE NOTICE 'This should resolve the critical bug preventing all refresh operations';
END $$;