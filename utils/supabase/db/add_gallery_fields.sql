-- Add gallery fields to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN web_gallery_enabled BOOLEAN DEFAULT false,
ADD COLUMN web_gallery_title VARCHAR(255) DEFAULT 'La Nostra Galleria',
ADD COLUMN web_gallery_subtitle TEXT,
ADD COLUMN web_gallery_image_1 VARCHAR(500),
ADD COLUMN web_gallery_image_2 VARCHAR(500),
ADD COLUMN web_gallery_image_3 VARCHAR(500),
ADD COLUMN web_gallery_image_4 VARCHAR(500),
ADD COLUMN web_gallery_image_5 VARCHAR(500),
ADD COLUMN web_gallery_image_6 VARCHAR(500),
ADD COLUMN web_gallery_image_7 VARCHAR(500),
ADD COLUMN web_gallery_image_8 VARCHAR(500);

-- Add comments to document the fields
COMMENT ON COLUMN salon_web_settings.web_gallery_enabled IS 'Enable/disable the gallery section';
COMMENT ON COLUMN salon_web_settings.web_gallery_title IS 'Title for the gallery section';
COMMENT ON COLUMN salon_web_settings.web_gallery_subtitle IS 'Subtitle for the gallery section';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_1 IS 'URL for gallery image 1';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_2 IS 'URL for gallery image 2';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_3 IS 'URL for gallery image 3';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_4 IS 'URL for gallery image 4';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_5 IS 'URL for gallery image 5';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_6 IS 'URL for gallery image 6';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_7 IS 'URL for gallery image 7';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_8 IS 'URL for gallery image 8';
