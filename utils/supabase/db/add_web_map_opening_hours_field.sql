-- Add web_map_opening_hours field to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_map_opening_hours TEXT;

-- Add web_opening_hours_visible field to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_opening_hours_visible BOOLEAN DEFAULT true;

-- Update existing records to have opening hours visible by default
UPDATE salon_web_settings 
SET web_opening_hours_visible = true 
WHERE web_opening_hours_visible IS NULL;
