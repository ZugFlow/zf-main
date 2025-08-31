-- Update RLS policies for team table
-- This script updates existing policies and ensures proper access control

-- First, disable RLS temporarily to make changes
ALTER TABLE public.team DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view team members in their salon" ON public.team;
DROP POLICY IF EXISTS "Users can insert team members in their salon" ON public.team;
DROP POLICY IF EXISTS "Users can update team members in their salon" ON public.team;
DROP POLICY IF EXISTS "Users can delete team members in their salon" ON public.team;
DROP POLICY IF EXISTS "Service accounts can manage all team members" ON public.team;
DROP POLICY IF EXISTS "team_select_policy" ON public.team;
DROP POLICY IF EXISTS "team_insert_policy" ON public.team;
DROP POLICY IF EXISTS "team_update_policy" ON public.team;
DROP POLICY IF EXISTS "team_delete_policy" ON public.team;

-- Re-enable RLS
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;

-- Update existing helper function to ensure it works with team table
-- Only create if it doesn't exist, otherwise update it
CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_salon_id uuid;
BEGIN
    -- Get salon_id from the user's team record
    SELECT salon_id INTO user_salon_id
    FROM public.team
    WHERE user_id = auth.uid()
    AND is_active = true
    LIMIT 1;
    
    RETURN user_salon_id;
END;
$$;

-- Create or update helper function to check if user is service account
CREATE OR REPLACE FUNCTION public.is_service_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Check if the current user is a service account
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            email LIKE '%@service.%' 
            OR email LIKE '%service%' 
            OR email = 'service@zugflow.com'
            OR email LIKE '%@supabase.%'
        )
    );
END;
$$;

-- Enhanced SELECT policy
CREATE POLICY "Users can view team members in their salon"
ON public.team
FOR SELECT
TO authenticated
USING (
    -- User can see team members in the same salon
    (salon_id IS NOT NULL AND salon_id = public.get_user_salon_id())
    OR 
    -- User can see their own record
    user_id = auth.uid()
    OR
    -- Service accounts can see all
    public.is_service_account()
    OR
    -- Allow viewing if user has visible_users permission
    (visible_users = true AND salon_id = public.get_user_salon_id())
);

-- Enhanced INSERT policy
CREATE POLICY "Users can insert team members in their salon"
ON public.team
FOR INSERT
TO authenticated
WITH CHECK (
    -- Can only insert team members for the same salon
    (salon_id IS NOT NULL AND salon_id = public.get_user_salon_id())
    OR
    -- Service accounts can insert anywhere
    public.is_service_account()
    OR
    -- Allow self-registration (when user_id matches auth.uid())
    user_id = auth.uid()
);

-- Enhanced UPDATE policy
CREATE POLICY "Users can update team members in their salon"
ON public.team
FOR UPDATE
TO authenticated
USING (
    -- Can update team members in the same salon
    (salon_id IS NOT NULL AND salon_id = public.get_user_salon_id())
    OR
    -- User can update their own record
    user_id = auth.uid()
    OR
    -- Service accounts can update all
    public.is_service_account()
)
WITH CHECK (
    -- Ensure updated record still belongs to the same salon or is own record
    (salon_id IS NOT NULL AND salon_id = public.get_user_salon_id())
    OR
    -- User can update their own record
    user_id = auth.uid()
    OR
    -- Service accounts can update anywhere
    public.is_service_account()
);

-- Enhanced DELETE policy
CREATE POLICY "Users can delete team members in their salon"
ON public.team
FOR DELETE
TO authenticated
USING (
    -- Can delete team members in the same salon
    (salon_id IS NOT NULL AND salon_id = public.get_user_salon_id())
    OR
    -- Service accounts can delete all
    public.is_service_account()
    -- Note: Users typically should not be able to delete their own record
    -- to prevent accidental account deletion
);

-- Service role policy (for backend operations)
CREATE POLICY "Service accounts can manage all team members"
ON public.team
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure proper permissions are granted
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team TO authenticated;
GRANT ALL ON public.team TO service_role;

-- Create optimized indexes for RLS performance
DROP INDEX IF EXISTS idx_team_rls_salon_user;
DROP INDEX IF EXISTS idx_team_rls_active_salon;
DROP INDEX IF EXISTS idx_team_rls_visible_salon;

CREATE INDEX idx_team_rls_salon_user ON public.team USING btree (salon_id, user_id) WHERE is_active = true;
CREATE INDEX idx_team_rls_active_salon ON public.team USING btree (is_active, salon_id);
CREATE INDEX idx_team_rls_visible_salon ON public.team USING btree (visible_users, salon_id) WHERE visible_users = true;

-- Update statistics for better query planning
ANALYZE public.team;

-- Add helpful comments
COMMENT ON POLICY "Users can view team members in their salon" ON public.team IS 
'Allow users to view team members within their salon, their own record, visible users, or all records for service accounts';

COMMENT ON POLICY "Users can insert team members in their salon" ON public.team IS 
'Allow users to insert team members only within their salon, self-registration, or anywhere for service accounts';

COMMENT ON POLICY "Users can update team members in their salon" ON public.team IS 
'Allow users to update team members within their salon, their own record, or all records for service accounts';

COMMENT ON POLICY "Users can delete team members in their salon" ON public.team IS 
'Allow users to delete team members within their salon, or all records for service accounts';

COMMENT ON POLICY "Service accounts can manage all team members" ON public.team IS 
'Allow service accounts full access to all team member records for backend operations';

-- Log the update
DO $$
BEGIN
    RAISE NOTICE 'Team RLS policies updated successfully at %', NOW();
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
