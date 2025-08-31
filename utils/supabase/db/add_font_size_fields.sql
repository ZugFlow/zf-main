-- Migration: add specific font size fields for salon web settings

ALTER TABLE public.salon_web_settings
  ADD COLUMN IF NOT EXISTS web_salon_name_font_size VARCHAR(20) DEFAULT 'large',
  ADD COLUMN IF NOT EXISTS web_subtitle_font_size VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS web_studio_text_font_size VARCHAR(20) DEFAULT 'small',
  ADD COLUMN IF NOT EXISTS web_description_font_size VARCHAR(20) DEFAULT 'x-large';

-- Add comments for documentation
COMMENT ON COLUMN public.salon_web_settings.web_salon_name_font_size IS 'Font size for salon name: small, medium, large, x-large, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl';
COMMENT ON COLUMN public.salon_web_settings.web_subtitle_font_size IS 'Font size for salon subtitle: small, medium, large, x-large, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl';
COMMENT ON COLUMN public.salon_web_settings.web_studio_text_font_size IS 'Font size for studio text: small, medium, large, x-large, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl';
COMMENT ON COLUMN public.salon_web_settings.web_description_font_size IS 'Font size for salon description: small, medium, large, x-large, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl';
