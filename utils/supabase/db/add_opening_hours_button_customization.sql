-- Add opening hours button customization fields to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_opening_hours_button_text VARCHAR(255) DEFAULT 'Prenota Ora',
ADD COLUMN IF NOT EXISTS web_opening_hours_button_action VARCHAR(50) DEFAULT 'booking',
ADD COLUMN IF NOT EXISTS web_opening_hours_button_color VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_opening_hours_button_text_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS web_opening_hours_button_border_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS web_opening_hours_button_border_width VARCHAR(10) DEFAULT '0px',
ADD COLUMN IF NOT EXISTS web_opening_hours_button_border_radius VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_opening_hours_button_size VARCHAR(20) DEFAULT 'large',
ADD COLUMN IF NOT EXISTS web_opening_hours_button_transparent BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_text IS 'Text displayed on the opening hours section button';
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_action IS 'Action performed when opening hours button is clicked (booking, contact, phone, hours, map)';
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_color IS 'Background color of the opening hours button';
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_text_color IS 'Text color of the opening hours button';
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_border_color IS 'Border color of the opening hours button';
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_border_width IS 'Border width of the opening hours button';
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_border_radius IS 'Border radius of the opening hours button (none, small, medium, large, full)';
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_size IS 'Size of the opening hours button (small, medium, large, xl)';
COMMENT ON COLUMN salon_web_settings.web_opening_hours_button_transparent IS 'Whether the opening hours button has a transparent background';
