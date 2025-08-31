-- Add navbar customization fields to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_navbar_logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS web_navbar_title VARCHAR(200),
ADD COLUMN IF NOT EXISTS web_navbar_subtitle VARCHAR(300),
ADD COLUMN IF NOT EXISTS web_navbar_studio_text VARCHAR(200),
ADD COLUMN IF NOT EXISTS web_navbar_show_phone BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_navbar_show_booking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_navbar_phone_text VARCHAR(100) DEFAULT 'Chiama Ora',
ADD COLUMN IF NOT EXISTS web_navbar_booking_text VARCHAR(100) DEFAULT 'Prenota Ora',
ADD COLUMN IF NOT EXISTS web_navbar_phone_action VARCHAR(50) DEFAULT 'phone',
ADD COLUMN IF NOT EXISTS web_navbar_booking_action VARCHAR(50) DEFAULT 'booking',
ADD COLUMN IF NOT EXISTS web_navbar_background_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS web_navbar_text_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS web_navbar_subtitle_color VARCHAR(7) DEFAULT '#666666',
ADD COLUMN IF NOT EXISTS web_navbar_phone_button_background VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS web_navbar_phone_button_text_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS web_navbar_phone_button_border_color VARCHAR(7) DEFAULT '#d1d5db',
ADD COLUMN IF NOT EXISTS web_navbar_booking_button_background VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_navbar_booking_button_text_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS web_navbar_booking_button_border_color VARCHAR(7) DEFAULT '#6366f1';

-- Add comments for documentation
COMMENT ON COLUMN salon_web_settings.web_navbar_logo_url IS 'URL of the logo to display in the navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_title IS 'Title text to display in the navbar (overrides web_title if set)';
COMMENT ON COLUMN salon_web_settings.web_navbar_subtitle IS 'Subtitle text to display in the navbar (overrides web_subtitle if set)';
COMMENT ON COLUMN salon_web_settings.web_navbar_studio_text IS 'Studio text to display in the navbar (overrides web_studio_text if set)';
COMMENT ON COLUMN salon_web_settings.web_navbar_show_phone IS 'Whether to show the phone button in the navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_show_booking IS 'Whether to show the booking button in the navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_phone_text IS 'Text for the phone button in the navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_booking_text IS 'Text for the booking button in the navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_phone_action IS 'Action for the phone button (phone, contact, hours, map)';
COMMENT ON COLUMN salon_web_settings.web_navbar_booking_action IS 'Action for the booking button (booking, contact, hours, map)';
COMMENT ON COLUMN salon_web_settings.web_navbar_background_color IS 'Background color of the navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_text_color IS 'Text color for the navbar title';
COMMENT ON COLUMN salon_web_settings.web_navbar_subtitle_color IS 'Text color for the navbar subtitle and studio text';
COMMENT ON COLUMN salon_web_settings.web_navbar_phone_button_background IS 'Background color for the phone button in navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_phone_button_text_color IS 'Text color for the phone button in navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_phone_button_border_color IS 'Border color for the phone button in navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_booking_button_background IS 'Background color for the booking button in navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_booking_button_text_color IS 'Text color for the booking button in navbar';
COMMENT ON COLUMN salon_web_settings.web_navbar_booking_button_border_color IS 'Border color for the booking button in navbar';
