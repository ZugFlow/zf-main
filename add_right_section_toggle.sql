-- Add right section toggle field to salon_web_settings table
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_right_section_enabled BOOLEAN NULL DEFAULT true;

-- Add comment to document the field
COMMENT ON COLUMN public.salon_web_settings.web_right_section_enabled IS 'Toggle to show/hide the right section of the salon web page';
