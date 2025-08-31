-- Add studio text field to salon_web_settings table
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_studio_text VARCHAR(50) NULL DEFAULT 'STUDIO';

-- Add comment to document the field
COMMENT ON COLUMN public.salon_web_settings.web_studio_text IS 'Customizable text that appears below the salon name (default: STUDIO)';

-- Migration: add carousel image fields to salon_web_settings
-- This adds 6 image fields for the right section carousel

ALTER TABLE public.salon_web_settings
  ADD COLUMN IF NOT EXISTS web_carousel_image_1 TEXT NULL,
  ADD COLUMN IF NOT EXISTS web_carousel_image_2 TEXT NULL,
  ADD COLUMN IF NOT EXISTS web_carousel_image_3 TEXT NULL,
  ADD COLUMN IF NOT EXISTS web_carousel_image_4 TEXT NULL,
  ADD COLUMN IF NOT EXISTS web_carousel_image_5 TEXT NULL,
  ADD COLUMN IF NOT EXISTS web_carousel_image_6 TEXT NULL,
  ADD COLUMN IF NOT EXISTS web_carousel_enabled BOOLEAN NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS web_carousel_autoplay BOOLEAN NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS web_carousel_speed INTEGER NULL DEFAULT 3000;

-- Add comments for documentation
COMMENT ON COLUMN public.salon_web_settings.web_carousel_image_1 IS 'First carousel image URL for right section';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_image_2 IS 'Second carousel image URL for right section';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_image_3 IS 'Third carousel image URL for right section';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_image_4 IS 'Fourth carousel image URL for right section';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_image_5 IS 'Fifth carousel image URL for right section';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_image_6 IS 'Sixth carousel image URL for right section';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_enabled IS 'Enable/disable carousel in right section';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_autoplay IS 'Enable/disable carousel autoplay';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_speed IS 'Carousel transition speed in milliseconds';
