-- ==============================================================================
-- ONLINE BOOKING SETTINGS TABLE CREATION AND RLS SETUP
-- ==============================================================================

-- Create online_booking_settings table
create table if not exists public.online_booking_settings (
  id uuid not null default gen_random_uuid (),
  salon_id uuid not null,
  enabled boolean null default false,
  require_approval boolean null default true,
  auto_confirm boolean null default false,
  max_days_ahead integer null default 30,
  min_notice_hours integer null default 2,
  slot_duration integer null default 30,
  max_bookings_per_slot integer null default 1,
  working_hours_start time without time zone null default '09:00:00'::time without time zone,
  working_hours_end time without time zone null default '18:00:00'::time without time zone,
  break_start time without time zone null default '12:00:00'::time without time zone,
  break_end time without time zone null default '13:00:00'::time without time zone,
  closed_days text[] null default array['sunday'::text],
  services_visible boolean null default true,
  team_members_visible boolean null default true,
  allow_guest_bookings boolean null default true,
  require_phone boolean null default true,
  require_email boolean null default true,
  notification_email text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  booking_start_time time without time zone null default '09:00:00'::time without time zone,
  booking_end_time time without time zone null default '18:00:00'::time without time zone,
  allow_same_day_booking boolean null default true,
  max_bookings_per_day integer null default 20,
  constraint online_booking_settings_pkey primary key (id),
  constraint online_booking_settings_salon_id_key unique (salon_id),
  constraint online_booking_settings_salon_id_fkey foreign key (salon_id) references public.team (id) on delete cascade,
  constraint valid_max_bookings_per_slot check (
    (
      (max_bookings_per_slot >= 1)
      and (max_bookings_per_slot <= 10)
    )
  ),
  constraint valid_max_days_ahead check (
    (
      (max_days_ahead >= 1)
      and (max_days_ahead <= 365)
    )
  ),
  constraint valid_min_notice_hours check (
    (
      (min_notice_hours >= 0)
      and (min_notice_hours <= 168)
    )
  ),
  constraint valid_slot_duration check (
    (
      (slot_duration >= 15)
      and (slot_duration <= 240)
    )
  )
) TABLESPACE pg_default;

-- Create indexes
create index if not exists idx_online_booking_settings_salon_id on public.online_booking_settings using btree (salon_id) TABLESPACE pg_default;

create index if not exists idx_online_booking_settings_enabled on public.online_booking_settings using btree (enabled) TABLESPACE pg_default
where
  (enabled = true);

-- Create trigger for updated_at
create trigger update_online_booking_settings_updated_at BEFORE
update on online_booking_settings for EACH row
execute FUNCTION update_updated_at_column ();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ==============================================================================

-- Enable RLS
alter table public.online_booking_settings enable row level security;

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Policy for SELECT operations
-- Users can only see settings for salons they belong to
create policy "Users can view online booking settings for their salon" on public.online_booking_settings
for select
using (
  exists (
    select 1 
    from public.team_members tm
    where tm.team_id = online_booking_settings.salon_id
    and tm.user_id = auth.uid()
  )
);

-- Policy for INSERT operations
-- Users can only create settings for salons they belong to
create policy "Users can create online booking settings for their salon" on public.online_booking_settings
for insert
with check (
  exists (
    select 1 
    from public.team_members tm
    where tm.team_id = online_booking_settings.salon_id
    and tm.user_id = auth.uid()
  )
);

-- Policy for UPDATE operations
-- Users can only update settings for salons they belong to
create policy "Users can update online booking settings for their salon" on public.online_booking_settings
for update
using (
  exists (
    select 1 
    from public.team_members tm
    where tm.team_id = online_booking_settings.salon_id
    and tm.user_id = auth.uid()
  )
);

-- Policy for DELETE operations
-- Users can only delete settings for salons they belong to
create policy "Users can delete online booking settings for their salon" on public.online_booking_settings
for delete
using (
  exists (
    select 1 
    from public.team_members tm
    where tm.team_id = online_booking_settings.salon_id
    and tm.user_id = auth.uid()
  )
);

-- ==============================================================================
-- COMMENTS AND DOCUMENTATION
-- ==============================================================================

comment on table public.online_booking_settings is 'Configuration settings for online booking functionality per salon';
comment on column public.online_booking_settings.salon_id is 'Foreign key reference to team table (salon)';
comment on column public.online_booking_settings.enabled is 'Whether online booking is enabled for this salon';
comment on column public.online_booking_settings.require_approval is 'Whether bookings require manual approval';
comment on column public.online_booking_settings.auto_confirm is 'Whether bookings are automatically confirmed';
comment on column public.online_booking_settings.max_days_ahead is 'Maximum days in advance bookings can be made';
comment on column public.online_booking_settings.min_notice_hours is 'Minimum hours notice required for booking';
comment on column public.online_booking_settings.slot_duration is 'Duration of each time slot in minutes';
comment on column public.online_booking_settings.max_bookings_per_slot is 'Maximum bookings allowed per time slot';
comment on column public.online_booking_settings.working_hours_start is 'Start of working hours';
comment on column public.online_booking_settings.working_hours_end is 'End of working hours';
comment on column public.online_booking_settings.break_start is 'Start of break time';
comment on column public.online_booking_settings.break_end is 'End of break time';
comment on column public.online_booking_settings.closed_days is 'Array of closed day names';
comment on column public.online_booking_settings.services_visible is 'Whether services are visible in booking form';
comment on column public.online_booking_settings.team_members_visible is 'Whether team members are visible in booking form';
comment on column public.online_booking_settings.allow_guest_bookings is 'Whether guest bookings are allowed';
comment on column public.online_booking_settings.require_phone is 'Whether phone number is required for booking';
comment on column public.online_booking_settings.require_email is 'Whether email is required for booking';
comment on column public.online_booking_settings.notification_email is 'Email address for booking notifications';
comment on column public.online_booking_settings.booking_start_time is 'Start time for accepting bookings';
comment on column public.online_booking_settings.booking_end_time is 'End time for accepting bookings';
comment on column public.online_booking_settings.allow_same_day_booking is 'Whether same day bookings are allowed';
comment on column public.online_booking_settings.max_bookings_per_day is 'Maximum bookings allowed per day';

-- ==============================================================================
-- COMPLETION NOTICE
-- ==============================================================================

-- Table creation, RLS enablement, and policies have been set up successfully
-- The table is now ready for use with proper security policies
