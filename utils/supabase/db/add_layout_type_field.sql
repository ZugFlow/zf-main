-- Migration: add layout type field for salon web settings

ALTER TABLE public.salon_web_settings
  ADD COLUMN IF NOT EXISTS web_layout_type VARCHAR(20) DEFAULT 'sidebar';

-- Add comment for documentation
COMMENT ON COLUMN public.salon_web_settings.web_layout_type IS 'Layout type: sidebar (left sidebar) or navbar (top navigation bar)';
