-- Add new columns to match_history table for enhanced match data
ALTER TABLE match_history
ADD COLUMN gold INTEGER,
ADD COLUMN cs INTEGER,
ADD COLUMN vision_score INTEGER,
ADD COLUMN champion_level INTEGER,
ADD COLUMN items JSONB,
ADD COLUMN summoner_spells JSONB,
ADD COLUMN runes JSONB,
ADD COLUMN all_participants JSONB;

-- Add index for faster match lookups
CREATE INDEX idx_match_history_match_id ON match_history(match_id);

-- Create function to validate participants data structure
CREATE OR REPLACE FUNCTION validate_participants_data(participants JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if participants is an array
    IF jsonb_typeof(participants) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Check each participant has required fields
    RETURN NOT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(participants) AS p
        WHERE p->>'championName' IS NULL 
           OR p->>'gameName' IS NULL 
           OR p->>'tagLine' IS NULL
           OR p->>'teamId' IS NULL
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to ensure participants data is valid
ALTER TABLE match_history
ADD CONSTRAINT check_participants_valid 
CHECK (all_participants IS NULL OR validate_participants_data(all_participants));

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can view their own match history" ON match_history;
CREATE POLICY "Users can view their own match history" ON match_history
    FOR SELECT USING (
        summoner_id IN (
            SELECT id FROM summoners WHERE user_id = auth.uid()
        )
    );

-- Comment on new columns for documentation
COMMENT ON COLUMN match_history.gold IS 'Total gold earned by the player in the match';
COMMENT ON COLUMN match_history.cs IS 'Total creep score (minions + monsters killed)';
COMMENT ON COLUMN match_history.vision_score IS 'Vision score indicating ward placement and enemy ward destruction';
COMMENT ON COLUMN match_history.champion_level IS 'Final champion level achieved in the match';
COMMENT ON COLUMN match_history.items IS 'Array of item IDs purchased in the match';
COMMENT ON COLUMN match_history.summoner_spells IS 'Object containing summoner spell IDs (spell1Id, spell2Id)';
COMMENT ON COLUMN match_history.runes IS 'Object containing primary and secondary rune trees with selected runes';
COMMENT ON COLUMN match_history.all_participants IS 'Array of all 10 participants with championName, gameName, tagLine, and teamId';