-- Add sidebar column to team table
ALTER TABLE team 
ADD COLUMN sidebar BOOLEAN DEFAULT false;

-- Update existing records to have sidebar = false
UPDATE team 
SET sidebar = false 
WHERE sidebar IS NULL; 