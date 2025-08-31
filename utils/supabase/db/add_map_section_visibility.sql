-- Migration: add map section visibility field to salon_web_settings

ALTER TABLE public.salon_web_settings
ADD COLUMN IF NOT EXISTS web_map_visible BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.salon_web_settings.web_map_visible IS 'Controls visibility of the map section showing salon location';
