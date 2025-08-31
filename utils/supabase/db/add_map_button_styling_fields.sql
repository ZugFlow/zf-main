-- Add map button styling fields to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_map_button_color VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_map_button_text_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS web_map_button_border_color VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_map_button_border_width VARCHAR(10) DEFAULT '1px',
ADD COLUMN IF NOT EXISTS web_map_button_border_radius VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_map_button_size VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_map_button_transparent BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN salon_web_settings.web_map_button_color IS 'Background color for the map section call button';
COMMENT ON COLUMN salon_web_settings.web_map_button_text_color IS 'Text color for the map section call button';
COMMENT ON COLUMN salon_web_settings.web_map_button_border_color IS 'Border color for the map section call button';
COMMENT ON COLUMN salon_web_settings.web_map_button_border_width IS 'Border width for the map section call button';
COMMENT ON COLUMN salon_web_settings.web_map_button_border_radius IS 'Border radius for the map section call button (none, small, medium, large, full)';
COMMENT ON COLUMN salon_web_settings.web_map_button_size IS 'Size for the map section call button (small, medium, large, xl)';
COMMENT ON COLUMN salon_web_settings.web_map_button_transparent IS 'Whether the map section call button should be transparent with only border';
