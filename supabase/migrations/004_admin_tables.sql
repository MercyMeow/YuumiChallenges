-- Admin Tables Migration
-- Adds tables for reports management and audit logging

-- Create admin_actions table for audit logging
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reports table for user reports and moderation
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create system_settings table for configurable settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_target_type ON admin_actions(target_type);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_assigned_to ON reports(assigned_to);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- Create updated_at triggers
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category) VALUES
    ('maintenance_mode', 'false', 'Enable/disable maintenance mode', 'system'),
    ('registration_enabled', 'true', 'Allow new user registrations', 'system'),
    ('max_summoners_per_user', '3', 'Maximum number of summoners per user', 'system'),
    ('challenge_creation_enabled', 'true', 'Allow challenge creation', 'challenges'),
    ('default_challenge_points', '100', 'Default points for new challenges', 'challenges'),
    ('leaderboard_enabled', 'true', 'Enable/disable leaderboard', 'features'),
    ('discord_webhook_url', '""', 'Discord webhook for notifications', 'integrations');

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- admin_actions policies
CREATE POLICY "Admins can view all admin actions" ON admin_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "System can insert admin actions" ON admin_actions
    FOR INSERT
    WITH CHECK (true);

-- reports policies
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT
    USING (
        reporter_id = (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Moderators can view all reports" ON reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT
    WITH CHECK (
        reporter_id = (
            SELECT id FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id'
        )
    );

CREATE POLICY "Moderators can update reports" ON reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- system_settings policies
CREATE POLICY "Everyone can view system settings" ON system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE discord_id = auth.jwt() ->> 'discord_id' 
            AND user_role = 'admin'
        )
    );

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
    VALUES (p_admin_id, p_action_type, p_target_type, p_target_id, p_details)
    RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;