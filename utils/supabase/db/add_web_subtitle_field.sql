-- Migration: add web_subtitle field to salon_web_settings

-- Add the web_subtitle column to the salon_web_settings table
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_subtitle VARCHAR(255) NULL;

-- Add comment to document the field
COMMENT ON COLUMN public.salon_web_settings.web_subtitle IS 'Subtitle for the salon web page, displayed below the main title';

-- Update the updated_at timestamp
UPDATE public.salon_web_settings 
SET updated_at = NOW() 
WHERE web_subtitle IS NULL;
