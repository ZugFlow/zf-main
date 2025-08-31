-- Migration: add carousel display mode field for salon web settings

ALTER TABLE public.salon_web_settings
  ADD COLUMN IF NOT EXISTS web_carousel_display_mode VARCHAR(20) DEFAULT 'single';

-- Add comment for documentation
COMMENT ON COLUMN public.salon_web_settings.web_carousel_display_mode IS 'Carousel display mode: single (one image with numbers) or vertical (vertical carousel)';
