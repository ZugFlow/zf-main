-- Migration: add bold styling fields for titles, subtitles, and descriptions

ALTER TABLE public.salon_web_settings
  ADD COLUMN IF NOT EXISTS web_title_bold boolean null default false,
  ADD COLUMN IF NOT EXISTS web_subtitle_bold boolean null default false,
  ADD COLUMN IF NOT EXISTS web_description_bold boolean null default false,
  ADD COLUMN IF NOT EXISTS web_studio_text_bold boolean null default false;
