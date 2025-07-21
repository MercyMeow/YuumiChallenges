-- Fix the INSERT policy for summoners table - it needs a WITH CHECK clause
-- This was preventing account linking from working properly

DROP POLICY IF EXISTS "Users can insert their own summoners" ON summoners;

CREATE POLICY "Users can insert their own summoners" ON summoners
    FOR INSERT 
    WITH CHECK (user_id = auth.jwt() ->> 'discord_id');

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'Fixed INSERT policy for summoners table - added WITH CHECK clause';
    RAISE NOTICE 'Users can now properly insert summoner records for their own discord_id';
END $$;