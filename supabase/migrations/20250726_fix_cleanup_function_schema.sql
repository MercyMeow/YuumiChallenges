-- Migration: Fix cleanup function schema inconsistency
-- This fixes the cleanup function to properly use puuid as the foreign key reference

-- Update the cleanup function to use puuid consistently
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
    -- Updated to use puuid for the foreign key relationship (match_history.summoner_id references summoners.puuid)
    FOR summoner_record IN SELECT puuid FROM summoners LOOP
        -- Count current matches for this summoner
        SELECT COUNT(*) INTO match_count 
        FROM match_history 
        WHERE summoner_id = summoner_record.puuid;
        
        -- If more than 20 matches, delete oldest ones
        IF match_count > 20 THEN
            DELETE FROM match_history 
            WHERE summoner_id = summoner_record.puuid 
            AND id NOT IN (
                SELECT id FROM match_history 
                WHERE summoner_id = summoner_record.puuid 
                ORDER BY game_creation DESC 
                LIMIT 20
            );
            
            GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
        END IF;
        
        -- Delete matches older than 30 days regardless of count
        DELETE FROM match_history 
        WHERE summoner_id = summoner_record.puuid 
        AND game_creation < NOW() - INTERVAL '30 days';
        
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    END LOOP;
    
    RETURN deleted_count;
END $$;

-- Add function to get detailed refresh status for a summoner
CREATE OR REPLACE FUNCTION get_summoner_refresh_status(
    summoner_puuid TEXT,
    auto_refresh_minutes INTEGER DEFAULT 15,
    manual_refresh_minutes INTEGER DEFAULT 1
)
RETURNS TABLE (
    can_auto_refresh BOOLEAN,
    can_manual_refresh BOOLEAN,
    last_refreshed_at TIMESTAMPTZ,
    last_manual_refresh_at TIMESTAMPTZ,
    next_auto_refresh TIMESTAMPTZ,
    next_manual_refresh TIMESTAMPTZ,
    total_matches INTEGER,
    last_match_date TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    last_refresh TIMESTAMPTZ;
    last_manual TIMESTAMPTZ;
    match_count INTEGER;
    last_match TIMESTAMPTZ;
BEGIN
    -- Get refresh timestamps and match info
    SELECT s.last_refreshed_at, s.last_manual_refresh_at
    INTO last_refresh, last_manual
    FROM summoners s
    WHERE s.puuid = summoner_puuid;
    
    -- Get match statistics
    SELECT COUNT(*), MAX(game_creation)
    INTO match_count, last_match
    FROM match_history mh
    WHERE mh.summoner_id = summoner_puuid;
    
    -- Set defaults if no data
    match_count := COALESCE(match_count, 0);
    
    -- Calculate refresh availability
    can_auto_refresh := last_refresh IS NULL OR 
                       last_refresh <= NOW() - INTERVAL '1 minute' * auto_refresh_minutes;
    
    can_manual_refresh := last_manual IS NULL OR 
                         last_manual <= NOW() - INTERVAL '1 minute' * manual_refresh_minutes;
    
    -- Calculate next refresh times
    next_auto_refresh := CASE 
        WHEN can_auto_refresh THEN NULL
        ELSE last_refresh + INTERVAL '1 minute' * auto_refresh_minutes
    END;
    
    next_manual_refresh := CASE 
        WHEN can_manual_refresh THEN NULL
        ELSE last_manual + INTERVAL '1 minute' * manual_refresh_minutes
    END;
    
    -- Return results
    last_refreshed_at := last_refresh;
    last_manual_refresh_at := last_manual;
    total_matches := match_count;
    last_match_date := last_match;
    
    RETURN NEXT;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Fixed cleanup function schema and added refresh status function';
    RAISE NOTICE 'Functions updated: cleanup_old_match_data(), get_summoner_refresh_status()';
END $$;