-- Add profile photo field to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN web_profile_photo_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN salon_web_settings.web_profile_photo_url IS 'URL of the profile photo displayed in the gallery section';
