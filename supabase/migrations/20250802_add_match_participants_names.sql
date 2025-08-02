-- Migration: Add match_participants_names table for caching participant names
-- This lightweight table stores participant names from matches to avoid repeated API calls

CREATE TABLE match_participants_names (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id TEXT NOT NULL,
    puuid TEXT NOT NULL,
    game_name TEXT NOT NULL,
    tag_line TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite unique constraint to prevent duplicates
    UNIQUE(match_id, puuid)
);

-- Indexes for efficient querying
CREATE INDEX idx_match_participants_names_match_id ON match_participants_names(match_id);
CREATE INDEX idx_match_participants_names_puuid ON match_participants_names(puuid);
CREATE INDEX idx_match_participants_names_game_name ON match_participants_names(game_name, tag_line);

-- Enable RLS for security
ALTER TABLE match_participants_names ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view participant names for matches they have access to
CREATE POLICY "Users can view match participant names" ON match_participants_names
    FOR SELECT USING (
        -- Allow if user has a summoner that participated in this match
        EXISTS (
            SELECT 1 FROM summoners s
            WHERE s.user_id = auth.uid()::text
            AND (
                s.puuid = match_participants_names.puuid
                OR EXISTS (
                    SELECT 1 FROM match_history mh
                    WHERE mh.match_id = match_participants_names.match_id
                    AND mh.summoner_id = s.puuid
                )
            )
        )
        -- Or allow if user is admin
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::text
            AND u.user_role = 'admin'
        )
    );

-- System can insert participant names (service role)
CREATE POLICY "System can manage match participant names" ON match_participants_names
    FOR ALL USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_match_participants_names_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_match_participants_names_updated_at_trigger
    BEFORE UPDATE ON match_participants_names
    FOR EACH ROW
    EXECUTE FUNCTION update_match_participants_names_updated_at();

-- Add cleanup function to remove old participant data (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_participant_names()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete participant names for matches older than 90 days
    DELETE FROM match_participants_names
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment the table for documentation
COMMENT ON TABLE match_participants_names IS 'Lightweight cache for match participant names to avoid repeated Riot API calls';
COMMENT ON COLUMN match_participants_names.match_id IS 'Riot Games match ID';
COMMENT ON COLUMN match_participants_names.puuid IS 'Player Universal Unique Identifier';
COMMENT ON COLUMN match_participants_names.game_name IS 'Riot ID game name (without tag)';
COMMENT ON COLUMN match_participants_names.tag_line IS 'Riot ID tag line (without #)';