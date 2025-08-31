-- Add missing fields to salon_web_settings table
ALTER TABLE public.salon_web_settings
  ADD COLUMN IF NOT EXISTS web_map_button_transparent boolean null default false,
  ADD COLUMN IF NOT EXISTS web_map_button_size text null default 'medium',
  ADD COLUMN IF NOT EXISTS web_map_button_border_radius text null default 'medium',
  ADD COLUMN IF NOT EXISTS web_map_button_text_color text null default '#ffffff',
  ADD COLUMN IF NOT EXISTS web_map_button_border_color text null default '#6366f1',
  ADD COLUMN IF NOT EXISTS web_map_button_border_width text null default '1px',
  ADD COLUMN IF NOT EXISTS web_opening_hours_button_text text null default 'Prenota Ora';
