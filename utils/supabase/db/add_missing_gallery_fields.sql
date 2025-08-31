-- Add missing gallery fields to salon_web_settings table
-- This migration ensures all gallery-related fields are present

-- Add web_gallery_title_enabled field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_gallery_title_enabled'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_gallery_title_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add web_gallery_title field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_gallery_title'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_gallery_title VARCHAR(255) DEFAULT 'La Nostra Galleria';
    END IF;
END $$;

-- Add web_gallery_subtitle field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_gallery_subtitle'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_gallery_subtitle TEXT;
    END IF;
END $$;

-- Add web_gallery_enabled field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_gallery_enabled'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_gallery_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add gallery image fields if they don't exist
DO $$ 
BEGIN
    FOR i IN 1..8 LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'salon_web_settings' 
            AND column_name = 'web_gallery_image_' || i
        ) THEN
            EXECUTE 'ALTER TABLE salon_web_settings ADD COLUMN web_gallery_image_' || i || ' VARCHAR(500)';
        END IF;
    END LOOP;
END $$;

-- Add comments to document the fields
COMMENT ON COLUMN salon_web_settings.web_gallery_title_enabled IS 'Enable/disable the gallery title display';
COMMENT ON COLUMN salon_web_settings.web_gallery_title IS 'Title for the gallery section';
COMMENT ON COLUMN salon_web_settings.web_gallery_subtitle IS 'Subtitle for the gallery section';
COMMENT ON COLUMN salon_web_settings.web_gallery_enabled IS 'Enable/disable the gallery section';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_1 IS 'URL for gallery image 1';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_2 IS 'URL for gallery image 2';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_3 IS 'URL for gallery image 3';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_4 IS 'URL for gallery image 4';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_5 IS 'URL for gallery image 5';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_6 IS 'URL for gallery image 6';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_7 IS 'URL for gallery image 7';
COMMENT ON COLUMN salon_web_settings.web_gallery_image_8 IS 'URL for gallery image 8';
