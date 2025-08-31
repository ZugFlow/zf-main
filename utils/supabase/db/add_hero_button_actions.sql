-- Add hero button action fields to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_hero_button_1_action VARCHAR(50) DEFAULT 'booking',
ADD COLUMN IF NOT EXISTS web_hero_button_2_action VARCHAR(50) DEFAULT 'contact';

-- Add comments for documentation
COMMENT ON COLUMN salon_web_settings.web_hero_button_1_action IS 'Action for the first hero button (booking, contact, phone, hours, map)';
COMMENT ON COLUMN salon_web_settings.web_hero_button_2_action IS 'Action for the second hero button (booking, contact, phone, hours, map)';
