-- Add parallax effect fields to salon_web_settings table
-- This migration adds options to enable parallax effects with background images

-- Add web_parallax_enabled field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_parallax_enabled'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_parallax_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add web_parallax_image field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_parallax_image'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_parallax_image TEXT;
    END IF;
END $$;

-- Add web_parallax_speed field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_parallax_speed'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_parallax_speed DECIMAL(3,2) DEFAULT 0.5;
    END IF;
END $$;

-- Add web_parallax_opacity field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_parallax_opacity'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_parallax_opacity DECIMAL(3,2) DEFAULT 0.3;
    END IF;
END $$;

-- Add web_parallax_sections field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_parallax_sections'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_parallax_sections TEXT[] DEFAULT ARRAY['hero', 'services', 'team', 'gallery'];
    END IF;
END $$;

-- Add comments to document the fields
COMMENT ON COLUMN salon_web_settings.web_parallax_enabled IS 'Enable/disable parallax effect';
COMMENT ON COLUMN salon_web_settings.web_parallax_image IS 'Background image URL for parallax effect';
COMMENT ON COLUMN salon_web_settings.web_parallax_speed IS 'Parallax scroll speed (0.1 to 1.0)';
COMMENT ON COLUMN salon_web_settings.web_parallax_opacity IS 'Background image opacity (0.0 to 1.0)';
COMMENT ON COLUMN salon_web_settings.web_parallax_sections IS 'Array of sections where parallax should be applied';
