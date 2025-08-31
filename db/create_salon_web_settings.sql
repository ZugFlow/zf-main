-- Migration: create salon_web_settings table

create table IF NOT EXISTS public.salon_web_settings (
  id uuid not null default gen_random_uuid(),
  salon_id uuid not null,
  web_enabled boolean null default false,
  web_domain character varying(255) null,
  web_subdomain character varying(100) null,
  web_title character varying(255) null,
  web_description text null,
  web_logo_url text null,
  web_theme character varying(50) null default 'default'::character varying,
  web_primary_color character varying(7) null default '#6366f1'::character varying,
  web_secondary_color character varying(7) null default '#8b5cf6'::character varying,
  web_contact_email character varying(255) null,
  web_contact_phone character varying(50) null,
  web_address text null,
  web_social_facebook character varying(255) null,
  web_social_instagram character varying(255) null,
  web_social_twitter character varying(255) null,
  web_google_analytics_id character varying(50) null,
  web_meta_title character varying(255) null,
  web_meta_description text null,
  web_meta_keywords text null,
  web_og_image_url text null,
  web_favicon_url text null,
  web_custom_css text null,
  web_custom_js text null,
  web_booking_enabled boolean null default true,
  web_services_visible boolean null default true,
  web_team_visible boolean null default true,
  web_gallery_visible boolean null default true,
  web_testimonials_visible boolean null default true,
  web_contact_form_enabled boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint salon_web_settings_pkey primary key (id),
  constraint salon_web_settings_salon_id_key unique (salon_id),
  constraint salon_web_settings_web_domain_key unique (web_domain),
  constraint salon_web_settings_web_subdomain_key unique (web_subdomain)
) TABLESPACE pg_default;

create index IF not exists idx_salon_web_settings_salon_id
  on public.salon_web_settings using btree (salon_id) TABLESPACE pg_default;

create index IF not exists idx_salon_web_settings_domain
  on public.salon_web_settings using btree (web_domain) TABLESPACE pg_default;

create index IF not exists idx_salon_web_settings_subdomain
  on public.salon_web_settings using btree (web_subdomain) TABLESPACE pg_default;

create index IF not exists idx_salon_web_settings_enabled
  on public.salon_web_settings using btree (web_enabled) TABLESPACE pg_default;

-- ensure trigger is created idempotently
drop trigger if exists trigger_update_salon_web_settings_updated_at on public.salon_web_settings;
create trigger trigger_update_salon_web_settings_updated_at
  before update on salon_web_settings for each row
  execute function update_updated_at_column();
