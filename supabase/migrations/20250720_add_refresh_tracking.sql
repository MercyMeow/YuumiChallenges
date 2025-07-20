-- Migration: Add refresh tracking fields for automatic data updates
-- This migration adds fields to track when summoner data was last refreshed

-- Add refresh tracking fields to summoners table
ALTER TABLE summoners ADD COLUMN last_refreshed_at TIMESTAMPTZ;
ALTER TABLE summoners ADD COLUMN last_manual_refresh_at TIMESTAMPTZ;

-- Add comments to document the fields
COMMENT ON COLUMN summoners.last_refreshed_at IS 'Timestamp of last automatic refresh (any type of refresh)';
COMMENT ON COLUMN summoners.last_manual_refresh_at IS 'Timestamp of last manual refresh (for rate limiting)';

-- Create indexes for refresh queries
CREATE INDEX IF NOT EXISTS idx_summoners_last_refreshed ON summoners(last_refreshed_at);
CREATE INDEX IF NOT EXISTS idx_summoners_manual_refresh ON summoners(last_manual_refresh_at);

-- Update existing match_history table to ensure game_creation field exists and is indexed
-- (This field should exist but adding for completeness)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'match_history' AND column_name = 'game_creation'
    ) THEN
        ALTER TABLE match_history ADD COLUMN game_creation TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Create index for match cleanup queries
CREATE INDEX IF NOT EXISTS idx_match_history_cleanup ON match_history(summoner_id, game_creation DESC);

-- Create function to clean up old match data
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

-- Create function to check if refresh is allowed (cooldown logic)
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
    -- Get refresh timestamps
    SELECT last_refreshed_at, last_manual_refresh_at 
    INTO last_refresh, last_manual
    FROM summoners 
    WHERE id = summoner_uuid;
    
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

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed. Added refresh tracking fields and cleanup functions';
    RAISE NOTICE 'Functions created: cleanup_old_match_data(), can_refresh_summoner()';
END $$;