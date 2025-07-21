-- Remove unnecessary Discord permission fields from users table
-- These fields were added but are no longer needed for the application

-- Drop the Discord permission columns
ALTER TABLE users DROP COLUMN IF EXISTS is_discord_owner;
ALTER TABLE users DROP COLUMN IF EXISTS discord_guild_permissions;

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Removed unnecessary Discord permission fields from users table';
    RAISE NOTICE 'Dropped columns: is_discord_owner, discord_guild_permissions';
    RAISE NOTICE 'User authentication now relies solely on user_role and is_yuumi_member fields';
END $$;