-- Fix RLS policies for permissions table (user_id, permesso, valore structure)
-- This file adds the correct RLS policies for the permissions table used by the system

-- First, enable RLS on the permissions table if not already enabled
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (they might be for the wrong table structure)
DROP POLICY IF EXISTS "Users can view permissions for their salon" ON permissions;
DROP POLICY IF EXISTS "Users can create permissions for their salon" ON permissions;
DROP POLICY IF EXISTS "Users can update permissions for their salon" ON permissions;
DROP POLICY IF EXISTS "Users can delete permissions for their salon" ON permissions;

-- Create new policies for the correct permissions table structure

-- Policy: Users can view permissions for their own user_id or for team members in their salon
CREATE POLICY "Users can view permissions" ON permissions
    FOR SELECT USING (
        -- User can view their own permissions
        user_id = auth.uid()
        OR
        -- Manager can view permissions for team members in their salon
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND salon_id = (
                SELECT salon_id FROM team 
                WHERE user_id = permissions.user_id
            )
        )
        OR
        -- Team member can view permissions for other team members in same salon
        EXISTS (
            SELECT 1 FROM team t1
            JOIN team t2 ON t1.salon_id = t2.salon_id
            WHERE t1.user_id = auth.uid()
            AND t2.user_id = permissions.user_id
        )
    );

-- Policy: Users can create permissions for their own user_id or for team members in their salon
CREATE POLICY "Users can create permissions" ON permissions
    FOR INSERT WITH CHECK (
        -- User can create permissions for themselves
        user_id = auth.uid()
        OR
        -- Manager can create permissions for team members in their salon
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND salon_id = (
                SELECT salon_id FROM team 
                WHERE user_id = permissions.user_id
            )
        )
        OR
        -- Team member can create permissions for other team members in same salon (if they have permission)
        EXISTS (
            SELECT 1 FROM team t1
            JOIN team t2 ON t1.salon_id = t2.salon_id
            WHERE t1.user_id = auth.uid()
            AND t2.user_id = permissions.user_id
        )
    );

-- Policy: Users can update permissions for their own user_id or for team members in their salon
CREATE POLICY "Users can update permissions" ON permissions
    FOR UPDATE USING (
        -- User can update their own permissions
        user_id = auth.uid()
        OR
        -- Manager can update permissions for team members in their salon
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND salon_id = (
                SELECT salon_id FROM team 
                WHERE user_id = permissions.user_id
            )
        )
        OR
        -- Team member can update permissions for other team members in same salon
        EXISTS (
            SELECT 1 FROM team t1
            JOIN team t2 ON t1.salon_id = t2.salon_id
            WHERE t1.user_id = auth.uid()
            AND t2.user_id = permissions.user_id
        )
    );

-- Policy: Users can delete permissions for their own user_id or for team members in their salon
CREATE POLICY "Users can delete permissions" ON permissions
    FOR DELETE USING (
        -- User can delete their own permissions
        user_id = auth.uid()
        OR
        -- Manager can delete permissions for team members in their salon
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND salon_id = (
                SELECT salon_id FROM team 
                WHERE user_id = permissions.user_id
            )
        )
        OR
        -- Team member can delete permissions for other team members in same salon
        EXISTS (
            SELECT 1 FROM team t1
            JOIN team t2 ON t1.salon_id = t2.salon_id
            WHERE t1.user_id = auth.uid()
            AND t2.user_id = permissions.user_id
        )
    );

-- Add comments for documentation
COMMENT ON TABLE permissions IS 'Table for storing user permissions (user_id, permesso, valore structure)';
COMMENT ON COLUMN permissions.user_id IS 'Reference to the user (from team.user_id or profiles.id)';
COMMENT ON COLUMN permissions.permesso IS 'Permission key (e.g., canViewAppointments, canCreateClients)';
COMMENT ON COLUMN permissions.valore IS 'Boolean value indicating if the permission is granted (true/false)'; 