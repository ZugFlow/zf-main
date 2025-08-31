-- Add button transparency field to salon_web_settings table
-- This migration adds the ability to make buttons transparent with customizable borders

-- Add web_button_transparent field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'salon_web_settings' 
        AND column_name = 'web_button_transparent'
    ) THEN
        ALTER TABLE salon_web_settings 
        ADD COLUMN web_button_transparent BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add comment to document the field
COMMENT ON COLUMN salon_web_settings.web_button_transparent IS 'Enable transparent background for buttons with border only';
