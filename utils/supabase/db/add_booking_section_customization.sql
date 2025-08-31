-- Add booking section customization fields to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_booking_section_background_color VARCHAR(7) DEFAULT '#f0f9ff',
ADD COLUMN IF NOT EXISTS web_booking_section_card_background VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS web_booking_section_title VARCHAR(200) DEFAULT 'Prenota il Tuo Appuntamento',
ADD COLUMN IF NOT EXISTS web_booking_section_subtitle VARCHAR(300) DEFAULT 'Scegli il servizio, la data e l''ora che preferisci. La prenotazione è semplice e veloce!',
ADD COLUMN IF NOT EXISTS web_booking_section_badge_text VARCHAR(100) DEFAULT 'PRENOTAZIONE ONLINE',
ADD COLUMN IF NOT EXISTS web_booking_section_title_color VARCHAR(7) DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS web_booking_section_subtitle_color VARCHAR(7) DEFAULT '#6b7280',
ADD COLUMN IF NOT EXISTS web_booking_section_badge_background VARCHAR(7) DEFAULT '#dbeafe',
ADD COLUMN IF NOT EXISTS web_booking_section_badge_text_color VARCHAR(7) DEFAULT '#1d4ed8',
ADD COLUMN IF NOT EXISTS web_booking_section_card_border_color VARCHAR(7) DEFAULT '#e5e7eb',
ADD COLUMN IF NOT EXISTS web_booking_section_card_shadow VARCHAR(50) DEFAULT 'shadow-2xl';

-- Add comments for documentation
COMMENT ON COLUMN salon_web_settings.web_booking_section_background_color IS 'Background color of the booking section';
COMMENT ON COLUMN salon_web_settings.web_booking_section_card_background IS 'Background color of the booking form card';
COMMENT ON COLUMN salon_web_settings.web_booking_section_title IS 'Title text for the booking section';
COMMENT ON COLUMN salon_web_settings.web_booking_section_subtitle IS 'Subtitle text for the booking section';
COMMENT ON COLUMN salon_web_settings.web_booking_section_badge_text IS 'Text for the badge above the booking section title';
COMMENT ON COLUMN salon_web_settings.web_booking_section_title_color IS 'Text color for the booking section title';
COMMENT ON COLUMN salon_web_settings.web_booking_section_subtitle_color IS 'Text color for the booking section subtitle';
COMMENT ON COLUMN salon_web_settings.web_booking_section_badge_background IS 'Background color for the booking section badge';
COMMENT ON COLUMN salon_web_settings.web_booking_section_badge_text_color IS 'Text color for the booking section badge';
COMMENT ON COLUMN salon_web_settings.web_booking_section_card_border_color IS 'Border color for the booking form card';
COMMENT ON COLUMN salon_web_settings.web_booking_section_card_shadow IS 'Shadow style for the booking form card';
