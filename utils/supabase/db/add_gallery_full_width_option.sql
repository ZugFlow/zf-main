-- Add web_gallery_full_width field to salon_web_settings table
-- This migration adds the option to make the gallery full-width

-- Add web_gallery_full_width field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_gallery_full_width'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_gallery_full_width BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add comment to document the field
COMMENT ON COLUMN salon_web_settings.web_gallery_full_width IS 'Enable/disable full-width gallery layout';
