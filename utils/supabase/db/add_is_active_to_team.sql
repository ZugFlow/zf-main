-- Add is_active column to team table for soft delete functionality (Safe version)
-- This allows preserving historical appointments while hiding inactive members

-- Add the column only if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team' AND column_name = 'is_active') THEN
        ALTER TABLE team ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update all existing records to be active (safe to run multiple times)
UPDATE team SET is_active = true WHERE is_active IS NULL;

-- Set default value for existing column (safe to run multiple times)
ALTER TABLE team ALTER COLUMN is_active SET DEFAULT true;

-- Make the column NOT NULL for future consistency (safe to run multiple times)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'team' AND column_name = 'is_active' AND is_nullable = 'YES') THEN
        ALTER TABLE team ALTER COLUMN is_active SET NOT NULL;
    END IF;
END $$;

-- Add indexes for better query performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_team_is_active ON team(is_active);
CREATE INDEX IF NOT EXISTS idx_team_salon_active ON team(salon_id, is_active);

-- Add comment to document the column purpose
COMMENT ON COLUMN team.is_active IS 'Soft delete flag: true = active member, false = deactivated member (preserves appointment history)'; 