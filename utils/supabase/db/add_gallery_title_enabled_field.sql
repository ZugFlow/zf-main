-- Add web_gallery_title_enabled field to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN web_gallery_title_enabled BOOLEAN DEFAULT true;
