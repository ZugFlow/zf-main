-- Create permissions table for holiday and permission management
-- This table connects team members with their permission requests and salon managers
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Team member requesting permission (references team.id)
    member_id UUID NOT NULL,
    
    -- Salon context for proper data isolation (UUID, not foreign key)
    salon_id UUID NOT NULL,
    
    -- Permission details
    type TEXT NOT NULL CHECK (type IN ('ferie', 'permesso', 'malattia', 'altro')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT NOT NULL,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Approval tracking
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Ensure end_date is not before start_date
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    
    -- Ensure end_time is not before start_time when both are provided
    CONSTRAINT valid_time_range CHECK (
        (start_time IS NULL AND end_time IS NULL) OR
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time >= start_time)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_member_id ON permissions(member_id);
CREATE INDEX IF NOT EXISTS idx_permissions_salon_id ON permissions(salon_id);
CREATE INDEX IF NOT EXISTS idx_permissions_status ON permissions(status);
CREATE INDEX IF NOT EXISTS idx_permissions_type ON permissions(type);
CREATE INDEX IF NOT EXISTS idx_permissions_date_range ON permissions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_permissions_created_at ON permissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permissions_approved_by ON permissions(approved_by);

-- Add foreign key constraints after table creation
ALTER TABLE permissions 
ADD CONSTRAINT fk_permissions_member_id 
FOREIGN KEY (member_id) REFERENCES team(id) ON DELETE CASCADE;

ALTER TABLE permissions 
ADD CONSTRAINT fk_permissions_approved_by 
FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view permissions for their salon
-- Check both profiles.salon_id (for managers) and team.salon_id (for team members)
CREATE POLICY "Users can view permissions for their salon" ON permissions
    FOR SELECT USING (
        salon_id = (
            SELECT salon_id FROM profiles 
            WHERE id = auth.uid()
        )
        OR
        salon_id = (
            SELECT salon_id FROM team 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create permissions for their salon
CREATE POLICY "Users can create permissions for their salon" ON permissions
    FOR INSERT WITH CHECK (
        salon_id = (
            SELECT salon_id FROM profiles 
            WHERE id = auth.uid()
        )
        OR
        salon_id = (
            SELECT salon_id FROM team 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update permissions for their salon
CREATE POLICY "Users can update permissions for their salon" ON permissions
    FOR UPDATE USING (
        salon_id = (
            SELECT salon_id FROM profiles 
            WHERE id = auth.uid()
        )
        OR
        salon_id = (
            SELECT salon_id FROM team 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete permissions for their salon
CREATE POLICY "Users can delete permissions for their salon" ON permissions
    FOR DELETE USING (
        salon_id = (
            SELECT salon_id FROM profiles 
            WHERE id = auth.uid()
        )
        OR
        salon_id = (
            SELECT salon_id FROM team 
            WHERE user_id = auth.uid()
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE permissions IS 'Table for storing holiday and permission requests for team members, linked to salon managers';
COMMENT ON COLUMN permissions.member_id IS 'Reference to the team member requesting permission (team.id)';
COMMENT ON COLUMN permissions.salon_id IS 'Salon UUID for data isolation (matches profiles.salon_id or team.salon_id)';
COMMENT ON COLUMN permissions.type IS 'Type of permission: ferie (holiday), permesso (permission), malattia (sick leave), altro (other)';
COMMENT ON COLUMN permissions.status IS 'Status of the permission request: pending, approved, rejected';
COMMENT ON COLUMN permissions.reason IS 'Reason for the permission request';
COMMENT ON COLUMN permissions.approved_by IS 'Reference to the profile of the manager who approved/rejected the permission';
COMMENT ON COLUMN permissions.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON COLUMN permissions.updated_at IS 'Timestamp of last update, automatically managed'; 