-- Add missing fields to team table
-- This migration adds the fields that the application expects but are missing from the database schema

-- Add ColorMember field for member colors
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS "ColorMember" TEXT DEFAULT '#3B82F6';

-- Add phone_number field for member phone numbers
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add visible_users field for visibility settings
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS visible_users BOOLEAN DEFAULT true;

-- Add order_column field for ordering members
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS order_column INTEGER DEFAULT 0;

-- Add email field if it doesn't exist (some queries expect it)
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing records to have default values
UPDATE team 
SET 
    "ColorMember" = COALESCE("ColorMember", '#3B82F6'),
    visible_users = COALESCE(visible_users, true),
    order_column = COALESCE(order_column, 0)
WHERE "ColorMember" IS NULL OR visible_users IS NULL OR order_column IS NULL;

-- Create index on order_column for better performance
CREATE INDEX IF NOT EXISTS idx_team_order_column ON team(order_column);

-- Create index on visible_users for filtering
CREATE INDEX IF NOT EXISTS idx_team_visible_users ON team(visible_users);

-- Create index on salon_id for better performance
CREATE INDEX IF NOT EXISTS idx_team_salon_id ON team(salon_id);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'team' 
ORDER BY ordinal_position; 