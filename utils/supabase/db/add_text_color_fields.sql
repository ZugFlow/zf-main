-- Migration: add text color fields to salon_web_settings

-- Add color fields for text customization
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_title_color VARCHAR(7) NULL DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS web_subtitle_color VARCHAR(7) NULL DEFAULT '#666666',
ADD COLUMN IF NOT EXISTS web_text_color VARCHAR(7) NULL DEFAULT '#333333',
ADD COLUMN IF NOT EXISTS web_salon_name_color VARCHAR(7) NULL DEFAULT '#000000';

-- Add comments to document the fields
COMMENT ON COLUMN public.salon_web_settings.web_title_color IS 'Color for the main title text';
COMMENT ON COLUMN public.salon_web_settings.web_subtitle_color IS 'Color for the subtitle text';
COMMENT ON COLUMN public.salon_web_settings.web_text_color IS 'Color for general text content';
COMMENT ON COLUMN public.salon_web_settings.web_salon_name_color IS 'Color for the salon name in the header';
