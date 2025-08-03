-- Migration: Comprehensive removal of tagline support from the application
-- This migration removes all tagline-related fields and tables to transition from
-- the old Riot ID system (game_name#tag_line) to a simplified game_name-only system.
--
-- BREAKING CHANGES:
-- 1. Drops match_participants_names table completely (no longer needed)
-- 2. Removes tag_line column from summoners table
-- 3. Removes check_riot_id_complete constraint
-- 4. Adds new constraint for game_name validation only
--
-- ROLLBACK INSTRUCTIONS:
-- To rollback this migration, you would need to:
-- 1. Re-add tag_line column to summoners table
-- 2. Recreate match_participants_names table
-- 3. Update constraints accordingly
-- 4. Repopulate data from external sources
--
-- WARNING: This migration will cause data loss and requires application code changes

-- =============================================================================
-- STEP 1: Safety checks and preparation
-- =============================================================================

DO $$
DECLARE
    participants_count INTEGER;
    summoners_count INTEGER;
BEGIN
    -- Check current data volumes for logging
    SELECT COUNT(*) INTO participants_count FROM match_participants_names;
    SELECT COUNT(*) INTO summoners_count FROM summoners;
    
    RAISE NOTICE 'Starting tagline removal migration';
    RAISE NOTICE 'Current match_participants_names records: %', participants_count;
    RAISE NOTICE 'Current summoners records: %', summoners_count;
    
    -- Verify we have the expected structure before proceeding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'summoners' 
        AND column_name = 'tag_line'
    ) THEN
        RAISE EXCEPTION 'Expected tag_line column not found in summoners table. Migration may have already been applied.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'match_participants_names'
    ) THEN
        RAISE EXCEPTION 'Expected match_participants_names table not found. Migration may have already been applied.';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Drop match_participants_names table completely
-- =============================================================================

-- First, drop any dependent policies and triggers to avoid cascading issues
DO $$
BEGIN
    -- Drop RLS policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'match_participants_names' 
        AND policyname = 'Users can view match participant names'
    ) THEN
        DROP POLICY "Users can view match participant names" ON match_participants_names;
        RAISE NOTICE 'Dropped RLS policy: Users can view match participant names';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'match_participants_names' 
        AND policyname = 'System can manage match participant names'
    ) THEN
        DROP POLICY "System can manage match participant names" ON match_participants_names;
        RAISE NOTICE 'Dropped RLS policy: System can manage match participant names';
    END IF;
END $$;

-- Drop the trigger function and trigger if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_match_participants_names_updated_at_trigger'
    ) THEN
        DROP TRIGGER update_match_participants_names_updated_at_trigger ON match_participants_names;
        RAISE NOTICE 'Dropped trigger: update_match_participants_names_updated_at_trigger';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_match_participants_names_updated_at'
    ) THEN
        DROP FUNCTION update_match_participants_names_updated_at();
        RAISE NOTICE 'Dropped function: update_match_participants_names_updated_at';
    END IF;
END $$;

-- Drop the cleanup function if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'cleanup_old_participant_names'
    ) THEN
        DROP FUNCTION cleanup_old_participant_names();
        RAISE NOTICE 'Dropped function: cleanup_old_participant_names';
    END IF;
END $$;

-- Drop all indexes on the table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_match_participants_names_match_id'
    ) THEN
        DROP INDEX IF EXISTS idx_match_participants_names_match_id;
        RAISE NOTICE 'Dropped index: idx_match_participants_names_match_id';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_match_participants_names_puuid'
    ) THEN
        DROP INDEX IF EXISTS idx_match_participants_names_puuid;
        RAISE NOTICE 'Dropped index: idx_match_participants_names_puuid';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_match_participants_names_game_name'
    ) THEN
        DROP INDEX IF EXISTS idx_match_participants_names_game_name;
        RAISE NOTICE 'Dropped index: idx_match_participants_names_game_name';
    END IF;
END $$;

-- Finally, drop the table itself
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'match_participants_names'
    ) THEN
        DROP TABLE match_participants_names;
        RAISE NOTICE 'Dropped table: match_participants_names';
    ELSE
        RAISE NOTICE 'Table match_participants_names does not exist, skipping drop';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: Modify summoners table - remove tag_line and update constraints
-- =============================================================================

-- Drop the existing constraint that requires tag_line
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_riot_id_complete'
    ) THEN
        ALTER TABLE summoners DROP CONSTRAINT check_riot_id_complete;
        RAISE NOTICE 'Dropped constraint: check_riot_id_complete';
    ELSE
        RAISE NOTICE 'Constraint check_riot_id_complete does not exist, skipping drop';
    END IF;
END $$;

-- Drop any indexes on tag_line column
DO $$
BEGIN
    -- Check for any indexes that might reference tag_line
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'summoners' 
        AND indexdef LIKE '%tag_line%'
    ) THEN
        -- Drop composite indexes that include tag_line
        -- Note: We need to be careful here as some indexes might be composite
        RAISE NOTICE 'Warning: Found indexes referencing tag_line, but not dropping automatically to prevent breaking other functionality';
        RAISE NOTICE 'Please review any composite indexes manually if needed';
    END IF;
END $$;

-- First drop the view that depends on tag_line, then drop the column
DO $$
BEGIN
    -- Drop user_summoner_overview view first to avoid dependency issues
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'user_summoner_overview'
    ) THEN
        DROP VIEW user_summoner_overview;
        RAISE NOTICE 'Dropped view: user_summoner_overview (will be recreated later)';
    END IF;
    
    -- Now we can safely drop the tag_line column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'summoners' 
        AND column_name = 'tag_line'
    ) THEN
        ALTER TABLE summoners DROP COLUMN tag_line;
        RAISE NOTICE 'Dropped column: summoners.tag_line';
    ELSE
        RAISE NOTICE 'Column summoners.tag_line does not exist, skipping drop';
    END IF;
END $$;

-- Add new constraint that only validates game_name
DO $$
BEGIN
    -- Add constraint to ensure game_name is not empty
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_game_name_valid'
    ) THEN
        ALTER TABLE summoners ADD CONSTRAINT check_game_name_valid 
        CHECK (game_name != '' AND game_name IS NOT NULL);
        RAISE NOTICE 'Added constraint: check_game_name_valid';
    ELSE
        RAISE NOTICE 'Constraint check_game_name_valid already exists, skipping add';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: Update views that might reference tag_line
-- =============================================================================

-- Recreate user_summoner_overview view without tag_line references
DO $$
BEGIN
    -- Recreate the view without tag_line references (it was already dropped earlier)
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
        s.region,
        s.level,
        s.profile_icon_id,
        s.created_at as summoner_created_at,
        -- Remove the full_riot_id computed column since we no longer have tag_line
        s.game_name as display_name,
        -- Add helpful flags for UI
        CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_summoner
    FROM users u
    LEFT JOIN summoners s ON u.id = s.user_id;
    
    COMMENT ON VIEW user_summoner_overview IS 
    'Provides user information with their single linked summoner (tagline support removed)';
    
    RAISE NOTICE 'Created view: user_summoner_overview without tagline support';
END $$;

-- =============================================================================
-- STEP 5: Data integrity checks and cleanup
-- =============================================================================

DO $$
DECLARE
    invalid_summoners INTEGER;
    total_summoners INTEGER;
BEGIN
    -- Check for any summoners with invalid game_name values
    SELECT COUNT(*) INTO invalid_summoners 
    FROM summoners 
    WHERE game_name IS NULL OR game_name = '';
    
    SELECT COUNT(*) INTO total_summoners FROM summoners;
    
    IF invalid_summoners > 0 THEN
        RAISE WARNING 'Found % summoners with invalid game_name values out of % total', invalid_summoners, total_summoners;
        RAISE WARNING 'These records will need to be fixed or removed before the constraint can be enforced';
        
        -- Log the problematic records for debugging
        RAISE NOTICE 'Problematic summoner records:';
        FOR rec IN 
            SELECT id, user_id, puuid, game_name 
            FROM summoners 
            WHERE game_name IS NULL OR game_name = ''
            LIMIT 10
        LOOP
            RAISE NOTICE 'Summoner ID: %, User ID: %, PUUID: %, Game Name: %', 
                rec.id, rec.user_id, rec.puuid, COALESCE(rec.game_name, 'NULL');
        END LOOP;
    ELSE
        RAISE NOTICE 'All % summoner records have valid game_name values', total_summoners;
    END IF;
END $$;

-- =============================================================================
-- STEP 6: Update table comments and documentation
-- =============================================================================

-- Update table comment for summoners to reflect the change
COMMENT ON TABLE summoners IS 'League of Legends summoner accounts linked to users (simplified without tagline support)';
COMMENT ON COLUMN summoners.game_name IS 'The Riot ID game name (tagline support removed for simplified identification)';

-- =============================================================================
-- STEP 7: Migration completion and summary
-- =============================================================================

DO $$
DECLARE
    final_summoners_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_summoners_count FROM summoners;
    
    RAISE NOTICE '=== TAGLINE REMOVAL MIGRATION COMPLETED ===';
    RAISE NOTICE 'Successfully removed tagline support from the application';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  ✓ Dropped match_participants_names table and all its dependencies';
    RAISE NOTICE '  ✓ Removed tag_line column from summoners table';
    RAISE NOTICE '  ✓ Dropped check_riot_id_complete constraint';
    RAISE NOTICE '  ✓ Added check_game_name_valid constraint';
    RAISE NOTICE '  ✓ Updated user_summoner_overview view';
    RAISE NOTICE 'Final summoners count: %', final_summoners_count;
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: This migration requires corresponding application code changes:';
    RAISE NOTICE '  - Update TypeScript interfaces to remove tag_line references';
    RAISE NOTICE '  - Update API endpoints to not expect/return tag_line data';
    RAISE NOTICE '  - Update UI components to display only game_name';
    RAISE NOTICE '  - Remove match participant name caching logic';
    RAISE NOTICE '';
    RAISE NOTICE 'ROLLBACK: To rollback, you must recreate the table and column structure manually';
    RAISE NOTICE 'and repopulate data from external sources as the data is permanently deleted.';
END $$;

-- Add a completion timestamp for audit purposes
DO $$
BEGIN
    RAISE NOTICE 'Migration completed at: %', NOW();
END $$;