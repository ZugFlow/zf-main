-- Migration: add font family fields for title, subtitle, description and button styling

alter table public.salon_web_settings
  add column if not exists web_title_font_family text null default 'default',
  add column if not exists web_subtitle_font_family text null default 'default',
  add column if not exists web_description_color text null default '#374151',
  add column if not exists web_description_font_family text null default 'default',
  add column if not exists web_button_size text null default 'medium',
  add column if not exists web_button_border_radius text null default 'medium',
  add column if not exists web_button_color text null default '#6366f1',
  add column if not exists web_button_border_color text null default '#6366f1',
  add column if not exists web_button_border_width text null default '1px',
  add column if not exists web_button_type text null default 'primary-secondary',
  add column if not exists web_button_quantity integer null default 2,
  add column if not exists web_button_primary_text text null default 'Prenota Ora',
  add column if not exists web_button_secondary_text text null default 'Contattaci';
