-- Migration: add studio text field to salon_web_settings

-- Add field for customizing the studio text
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_studio_text VARCHAR(50) NULL DEFAULT 'STUDIO';

-- Add comment to document the field
COMMENT ON COLUMN public.salon_web_settings.web_studio_text IS 'Customizable text that appears below the salon name (default: STUDIO)';
