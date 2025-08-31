-- Migration: add missing columns for salon_web_settings

alter table public.salon_web_settings
  add column if not exists web_layout_style text null default 'default',
  add column if not exists web_header_style text null default 'default',
  add column if not exists web_footer_style text null default 'default',
  add column if not exists web_animation_enabled boolean null default true,
  add column if not exists web_parallax_enabled boolean null default false,
  add column if not exists web_dark_mode_enabled boolean null default false,
  add column if not exists web_show_search boolean null default false,
  add column if not exists web_show_breadcrumbs boolean null default false,
  add column if not exists web_show_social_share boolean null default true,
  add column if not exists web_show_back_to_top boolean null default true,
  add column if not exists web_show_loading_animation boolean null default true,
  add column if not exists web_custom_font text null default 'default',
  add column if not exists web_font_size text null default 'medium',
  add column if not exists web_line_height text null default 'normal',
  add column if not exists web_spacing text null default 'normal',
  add column if not exists web_border_radius text null default 'medium',
  add column if not exists web_shadow_style text null default 'medium',
  add column if not exists web_transition_speed text null default 'normal';
