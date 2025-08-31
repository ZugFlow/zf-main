-- Add manager insert/update policies for work_hours to allow approval trigger to write

-- Ensure RLS is enabled on work_hours
ALTER TABLE public.work_hours ENABLE ROW LEVEL SECURITY;

-- Drop existing manager policies if present to avoid duplicates
DROP POLICY IF EXISTS "Managers can insert work hours in their salon" ON public.work_hours;
DROP POLICY IF EXISTS "Managers can update work hours in their salon" ON public.work_hours;

-- Allow managers (profiles.role = 'manager' or team.role = 'manager') to INSERT rows for their salon
CREATE POLICY "Managers can insert work hours in their salon" ON public.work_hours
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Manager via profiles table
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.salon_id = work_hours.salon_id
        AND p.role = 'manager'
    )
    OR
    -- Manager via team table
    EXISTS (
      SELECT 1 FROM public.team t
      WHERE t.user_id = auth.uid()
        AND t.salon_id = work_hours.salon_id
        AND t.role = 'manager'
        AND t.is_active = true
    )
  );

-- Allow managers to UPDATE rows for their salon
CREATE POLICY "Managers can update work hours in their salon" ON public.work_hours
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.salon_id = work_hours.salon_id
        AND p.role = 'manager'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team t
      WHERE t.user_id = auth.uid()
        AND t.salon_id = work_hours.salon_id
        AND t.role = 'manager'
        AND t.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.salon_id = work_hours.salon_id
        AND p.role = 'manager'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team t
      WHERE t.user_id = auth.uid()
        AND t.salon_id = work_hours.salon_id
        AND t.role = 'manager'
        AND t.is_active = true
    )
  );

-- Optional: tighten member-only policies if too permissive elsewhere (not changed here)

-- Notes:
-- These policies are required because approving a permission triggers writes to work_hours
-- (via trigger sync_permissions_with_work_hours). Without manager write access, RLS blocks.


