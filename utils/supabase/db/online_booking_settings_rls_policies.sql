-- ==============================================================================
-- ONLINE BOOKING SETTINGS RLS POLICIES
-- ==============================================================================
-- This file enables RLS and creates policies for the existing online_booking_settings table

-- Enable RLS on the existing table
alter table public.online_booking_settings enable row level security;

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Policy for SELECT operations
-- Users can only see settings for salons they belong to
create policy "Users can view online booking settings for their salon" on public.online_booking_settings
for select
using (
  salon_id = (
    SELECT salon_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  salon_id = (
    SELECT salon_id FROM team 
    WHERE user_id = auth.uid()
  )
);

-- Policy for INSERT operations
-- Users can only create settings for salons they belong to
create policy "Users can create online booking settings for their salon" on public.online_booking_settings
for insert
with check (
  salon_id = (
    SELECT salon_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  salon_id = (
    SELECT salon_id FROM team 
    WHERE user_id = auth.uid()
  )
);

-- Policy for UPDATE operations
-- Users can only update settings for salons they belong to
create policy "Users can update online booking settings for their salon" on public.online_booking_settings
for update
using (
  salon_id = (
    SELECT salon_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  salon_id = (
    SELECT salon_id FROM team 
    WHERE user_id = auth.uid()
  )
);

-- Policy for DELETE operations
-- Users can only delete settings for salons they belong to
create policy "Users can delete online booking settings for their salon" on public.online_booking_settings
for delete
using (
  salon_id = (
    SELECT salon_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  salon_id = (
    SELECT salon_id FROM team 
    WHERE user_id = auth.uid()
  )
);

-- ==============================================================================
-- VERIFICATION QUERIES (optional - for testing)
-- ==============================================================================

-- Verify RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'online_booking_settings';

-- List all policies for the table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'online_booking_settings';

-- ==============================================================================
-- COMPLETION NOTICE
-- ==============================================================================

-- RLS has been enabled and policies have been created successfully
-- The table is now secured with proper access control based on salon membership
