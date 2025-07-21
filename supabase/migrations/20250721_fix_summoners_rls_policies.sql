-- Fix RLS policies for summoners table to match actual database structure
-- The current policies expect user_id to be a UUID referencing users.id,
-- but the actual database stores discord_id (TEXT) directly in summoners.user_id

-- Drop existing policies that don't work with current schema
DROP POLICY IF EXISTS "Users can manage their own summoners" ON summoners;
DROP POLICY IF EXISTS "Anyone can view verified summoners" ON summoners;
DROP POLICY IF EXISTS "Admins can manage all summoners" ON summoners;

-- Create corrected policies that work with discord_id stored directly in user_id
CREATE POLICY "Users can manage their own summoners" ON summoners
    FOR ALL USING (
        user_id = auth.jwt() ->> 'discord_id'
    );

CREATE POLICY "Anyone can view verified summoners" ON summoners
    FOR SELECT USING (verified = true);

CREATE POLICY "Admins can manage all summoners" ON summoners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

-- Also fix related policies that reference summoners
-- Fix match_history policies
DROP POLICY IF EXISTS "Users can view their own match history" ON match_history;
CREATE POLICY "Users can view their own match history" ON match_history
    FOR SELECT USING (
        summoner_id IN (
            SELECT puuid FROM summoners
            WHERE user_id = auth.jwt() ->> 'discord_id'
        )
    );

-- Fix ranked_info policies  
DROP POLICY IF EXISTS "Users can view their own ranked info" ON ranked_info;
CREATE POLICY "Users can view their own ranked info" ON ranked_info
    FOR SELECT USING (
        summoner_id IN (
            SELECT puuid FROM summoners
            WHERE user_id = auth.jwt() ->> 'discord_id'
        )
    );

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'Fixed RLS policies for summoners table to work with discord_id stored in user_id field';
    RAISE NOTICE 'Users can now properly INSERT, UPDATE, and DELETE their own summoner records';
    RAISE NOTICE 'Account linking through icon verification should now work correctly';
END $$;