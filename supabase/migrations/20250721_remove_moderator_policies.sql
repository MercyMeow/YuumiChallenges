-- Remove remaining moderator references from RLS policies
-- This migration cleans up any policies that still reference the moderator role

-- Drop and recreate challenge management policy
DROP POLICY IF EXISTS "Staff can manage all challenges" ON challenges;
CREATE POLICY "Staff can manage all challenges" ON challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

-- Drop and recreate admin actions view policy
DROP POLICY IF EXISTS "Admins can view all admin actions" ON admin_actions;
CREATE POLICY "Admins can view all admin actions" ON admin_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

-- Drop and recreate reports policies
DROP POLICY IF EXISTS "Moderators can view all reports" ON reports;
CREATE POLICY "Admins can view all reports" ON reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

DROP POLICY IF EXISTS "Moderators can update reports" ON reports;
CREATE POLICY "Admins can update reports" ON reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );

-- Update system settings policy if exists
DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'owner')
        )
    );