-- Migration: add footer customization fields to salon_web_settings

-- Add footer customization fields
ALTER TABLE public.salon_web_settings
  ADD COLUMN IF NOT EXISTS web_footer_background_color text null default '#1f2937',
  ADD COLUMN IF NOT EXISTS web_footer_text_color text null default '#ffffff',
  ADD COLUMN IF NOT EXISTS web_footer_title_color text null default '#ffffff',
  ADD COLUMN IF NOT EXISTS web_footer_subtitle_color text null default '#9ca3af',
  ADD COLUMN IF NOT EXISTS web_footer_description_color text null default '#9ca3af',
  ADD COLUMN IF NOT EXISTS web_footer_link_color text null default '#9ca3af',
  ADD COLUMN IF NOT EXISTS web_footer_link_hover_color text null default '#ffffff',
  ADD COLUMN IF NOT EXISTS web_footer_border_color text null default '#374151',
  ADD COLUMN IF NOT EXISTS web_footer_social_icon_color text null default '#9ca3af',
  ADD COLUMN IF NOT EXISTS web_footer_social_icon_hover_color text null default '#ffffff',
  ADD COLUMN IF NOT EXISTS web_footer_title_font_family text null default 'default',
  ADD COLUMN IF NOT EXISTS web_footer_subtitle_font_family text null default 'default',
  ADD COLUMN IF NOT EXISTS web_footer_description_font_family text null default 'default',
  ADD COLUMN IF NOT EXISTS web_footer_title_font_size text null default 'large',
  ADD COLUMN IF NOT EXISTS web_footer_subtitle_font_size text null default 'medium',
  ADD COLUMN IF NOT EXISTS web_footer_description_font_size text null default 'small',
  ADD COLUMN IF NOT EXISTS web_footer_title_bold boolean null default true,
  ADD COLUMN IF NOT EXISTS web_footer_subtitle_bold boolean null default false,
  ADD COLUMN IF NOT EXISTS web_footer_description_bold boolean null default false,
  ADD COLUMN IF NOT EXISTS web_footer_copyright_text text null default '© 2024 {salon_name}. Tutti i diritti riservati.',
  ADD COLUMN IF NOT EXISTS web_footer_copyright_color text null default '#9ca3af',
  ADD COLUMN IF NOT EXISTS web_footer_copyright_font_size text null default 'small',
  ADD COLUMN IF NOT EXISTS web_footer_copyright_font_family text null default 'default',
  ADD COLUMN IF NOT EXISTS web_footer_show_social_links boolean null default true,
  ADD COLUMN IF NOT EXISTS web_footer_show_contact_info boolean null default true,
  ADD COLUMN IF NOT EXISTS web_footer_show_copyright boolean null default true,
  ADD COLUMN IF NOT EXISTS web_footer_layout_style text null default 'default',
  ADD COLUMN IF NOT EXISTS web_footer_padding_top text null default '48px',
  ADD COLUMN IF NOT EXISTS web_footer_padding_bottom text null default '24px',
  ADD COLUMN IF NOT EXISTS web_footer_margin_top text null default '0px',
  ADD COLUMN IF NOT EXISTS web_footer_border_top_width text null default '0px',
  ADD COLUMN IF NOT EXISTS web_footer_border_top_style text null default 'solid',
  ADD COLUMN IF NOT EXISTS web_footer_border_top_color text null default '#374151',
  ADD COLUMN IF NOT EXISTS web_footer_border_radius text null default '0px',
  ADD COLUMN IF NOT EXISTS web_footer_shadow text null default 'none',
  ADD COLUMN IF NOT EXISTS web_footer_opacity text null default '1',
  ADD COLUMN IF NOT EXISTS web_footer_backdrop_blur text null default 'none',
  ADD COLUMN IF NOT EXISTS web_footer_gradient_enabled boolean null default false,
  ADD COLUMN IF NOT EXISTS web_footer_gradient_from_color text null default '#1f2937',
  ADD COLUMN IF NOT EXISTS web_footer_gradient_to_color text null default '#111827',
  ADD COLUMN IF NOT EXISTS web_footer_gradient_direction text null default 'to-br',
  ADD COLUMN IF NOT EXISTS web_footer_pattern_enabled boolean null default false,
  ADD COLUMN IF NOT EXISTS web_footer_pattern_opacity text null default '0.05',
  ADD COLUMN IF NOT EXISTS web_footer_pattern_color text null default '#ffffff',
  ADD COLUMN IF NOT EXISTS web_footer_pattern_size text null default '20px',
  ADD COLUMN IF NOT EXISTS web_footer_pattern_type text null default 'dots';

-- Add comments for documentation
COMMENT ON COLUMN public.salon_web_settings.web_footer_background_color IS 'Background color of the footer';
COMMENT ON COLUMN public.salon_web_settings.web_footer_text_color IS 'Default text color in the footer';
COMMENT ON COLUMN public.salon_web_settings.web_footer_title_color IS 'Color of footer titles';
COMMENT ON COLUMN public.salon_web_settings.web_footer_subtitle_color IS 'Color of footer subtitles';
COMMENT ON COLUMN public.salon_web_settings.web_footer_description_color IS 'Color of footer descriptions';
COMMENT ON COLUMN public.salon_web_settings.web_footer_link_color IS 'Color of footer links';
COMMENT ON COLUMN public.salon_web_settings.web_footer_link_hover_color IS 'Color of footer links on hover';
COMMENT ON COLUMN public.salon_web_settings.web_footer_border_color IS 'Color of footer borders';
COMMENT ON COLUMN public.salon_web_settings.web_footer_social_icon_color IS 'Color of social media icons';
COMMENT ON COLUMN public.salon_web_settings.web_footer_social_icon_hover_color IS 'Color of social media icons on hover';
COMMENT ON COLUMN public.salon_web_settings.web_footer_copyright_text IS 'Copyright text with {salon_name} placeholder';
COMMENT ON COLUMN public.salon_web_settings.web_footer_layout_style IS 'Footer layout style (default, compact, wide)';
COMMENT ON COLUMN public.salon_web_settings.web_footer_gradient_enabled IS 'Enable gradient background for footer';
COMMENT ON COLUMN public.salon_web_settings.web_footer_pattern_enabled IS 'Enable background pattern for footer';
