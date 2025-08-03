-- Remove rune-related columns from match_history table
-- This migration removes rune data storage as part of the layout restructure

-- Drop the runes column and associated constraints
ALTER TABLE match_history 
DROP COLUMN IF EXISTS runes;

-- Update any existing functions that reference runes
-- Note: Check if any stored procedures or functions use the runes column

-- Comment on the change for documentation
COMMENT ON TABLE match_history IS 'Match history data for summoners - runes removed in 2025-08-03 layout restructure, focusing on core gameplay metrics';

-- Verify the migration
DO $$
BEGIN
    -- Check if runes column was successfully removed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'match_history' 
        AND column_name = 'runes'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Migration failed: runes column still exists in match_history table';
    END IF;
    
    -- Log successful migration
    RAISE NOTICE 'Successfully removed runes column from match_history table';
END $$;