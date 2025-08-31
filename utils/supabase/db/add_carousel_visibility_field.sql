-- Add carousel visibility field to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_carousel_visible BOOLEAN DEFAULT true;

-- Remove testimonials, team, and services visibility fields
ALTER TABLE salon_web_settings 
DROP COLUMN IF EXISTS web_testimonials_visible,
DROP COLUMN IF EXISTS web_team_visible,
DROP COLUMN IF EXISTS web_services_visible;

-- Add comment for documentation
COMMENT ON COLUMN salon_web_settings.web_carousel_visible IS 'Whether the carousel section is visible on the salon web page';
