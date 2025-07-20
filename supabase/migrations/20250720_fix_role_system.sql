-- Fix role system by properly updating the enum
-- This replaces the previous role system migration

-- First, update all existing 'moderator' roles to 'admin' since we're removing moderator
UPDATE users SET user_role = 'admin' WHERE user_role = 'moderator';

-- Create the new enum type with correct values
CREATE TYPE user_role_new AS ENUM ('owner', 'admin', 'member');

-- Add temporary column with new enum
ALTER TABLE users ADD COLUMN user_role_temp user_role_new DEFAULT 'member';

-- Copy existing data to new column, mapping old values to new ones
UPDATE users SET user_role_temp = CASE 
    WHEN user_role = 'admin' THEN 'admin'::user_role_new
    WHEN user_role = 'member' THEN 'member'::user_role_new
    WHEN user_role = 'moderator' THEN 'admin'::user_role_new -- moderators become admins
    ELSE 'member'::user_role_new
END;

-- Drop the old column
ALTER TABLE users DROP COLUMN user_role;

-- Rename the new column
ALTER TABLE users RENAME COLUMN user_role_temp TO user_role;

-- Drop the old enum type
DROP TYPE user_role;

-- Rename the new enum type
ALTER TYPE user_role_new RENAME TO user_role;

-- Add the missing columns that were in the original migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_discord_owner BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_guild_permissions BIGINT DEFAULT 0;

-- Create admin actions table for user management audit trail (if it doesn't exist)
CREATE TABLE IF NOT EXISTS admin_user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'role_change', 'ban', 'unban', etc.
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for admin actions
CREATE INDEX IF NOT EXISTS idx_admin_user_actions_admin_user_id ON admin_user_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_actions_target_user_id ON admin_user_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_actions_created_at ON admin_user_actions(created_at);

-- Create function to log role changes
CREATE OR REPLACE FUNCTION log_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if user_role changed
    IF OLD.user_role IS DISTINCT FROM NEW.user_role THEN
        INSERT INTO admin_user_actions (
            target_user_id,
            action_type,
            previous_value,
            new_value
        ) VALUES (
            NEW.id,
            'role_change',
            OLD.user_role::text,
            NEW.user_role::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for role change logging (drop first if exists)
DROP TRIGGER IF EXISTS trigger_log_user_role_change ON users;
CREATE TRIGGER trigger_log_user_role_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_role_change();

-- Update RLS policies for new role system
DROP POLICY IF EXISTS admin_manage_users ON users;
DROP POLICY IF EXISTS moderator_view_users ON users;

-- Admin and Owner can manage all users
CREATE POLICY admin_manage_users ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.discord_id = (auth.jwt() ->> 'discord_id')::text 
            AND u.user_role IN ('admin', 'owner')
        )
    );

-- Enable RLS on admin_user_actions if not already enabled
ALTER TABLE admin_user_actions ENABLE ROW LEVEL SECURITY;

-- Admin and Owner can view admin actions
DROP POLICY IF EXISTS admin_view_actions ON admin_user_actions;
CREATE POLICY admin_view_actions ON admin_user_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.discord_id = (auth.jwt() ->> 'discord_id')::text 
            AND u.user_role IN ('admin', 'owner')
        )
    );

-- Admin and Owner can create admin actions
DROP POLICY IF EXISTS admin_create_actions ON admin_user_actions;
CREATE POLICY admin_create_actions ON admin_user_actions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.discord_id = (auth.jwt() ->> 'discord_id')::text 
            AND u.user_role IN ('admin', 'owner')
        )
    );