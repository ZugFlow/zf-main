-- Add RowMonthly column to team table
-- This column will store the number of days to show in the weekly view (1-7)

-- Check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team' 
        AND column_name = 'rowmonthly'
    ) THEN
        -- Add the column
        ALTER TABLE team ADD COLUMN rowmonthly INTEGER DEFAULT 7;
        
        -- Add a check constraint to ensure values are between 1 and 7
        ALTER TABLE team ADD CONSTRAINT team_rowmonthly_check 
        CHECK (rowmonthly >= 1 AND rowmonthly <= 7);
        
        RAISE NOTICE 'Added rowmonthly column to team table with default value 7';
    ELSE
        RAISE NOTICE 'Column rowmonthly already exists in team table';
    END IF;
END $$;

-- Update existing records to have the default value
UPDATE team SET rowmonthly = 7 WHERE rowmonthly IS NULL; 