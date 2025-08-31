-- Enable RLS on team table
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view team members in their salon" ON public.team;
DROP POLICY IF EXISTS "Users can insert team members in their salon" ON public.team;
DROP POLICY IF EXISTS "Users can update team members in their salon" ON public.team;
DROP POLICY IF EXISTS "Users can delete team members in their salon" ON public.team;
DROP POLICY IF EXISTS "Service accounts can manage all team members" ON public.team;

-- Helper function to get user's salon_id
CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Helper function to check if user is service account
CREATE OR REPLACE FUNCTION public.is_service_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is a service account
    -- Service accounts typically have specific email patterns or roles
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            email LIKE '%@service.%' 
            OR email LIKE '%service%' 
            OR email = 'service@zugflow.com'
        )
    );
END;
$$;

-- Policy for viewing team members
-- Users can view team members in their salon
CREATE POLICY "Users can view team members in their salon"
ON public.team
FOR SELECT
TO authenticated
USING (
    -- User can see team members in the same salon
    salon_id = public.get_user_salon_id()
    OR 
    -- User can see their own record
    user_id = auth.uid()
    OR
    -- Service accounts can see all
    public.is_service_account()
);

-- Policy for inserting team members
-- Users can insert team members in their salon
CREATE POLICY "Users can insert team members in their salon"
ON public.team
FOR INSERT
TO authenticated
WITH CHECK (
    -- Can only insert team members for the same salon
    salon_id = public.get_user_salon_id()
    OR
    -- Service accounts can insert anywhere
    public.is_service_account()
);

-- Policy for updating team members
-- Users can update team members in their salon
CREATE POLICY "Users can update team members in their salon"
ON public.team
FOR UPDATE
TO authenticated
USING (
    -- Can update team members in the same salon
    salon_id = public.get_user_salon_id()
    OR
    -- User can update their own record
    user_id = auth.uid()
    OR
    -- Service accounts can update all
    public.is_service_account()
)
WITH CHECK (
    -- Ensure updated record still belongs to the same salon
    salon_id = public.get_user_salon_id()
    OR
    -- User can update their own record
    user_id = auth.uid()
    OR
    -- Service accounts can update anywhere
    public.is_service_account()
);

-- Policy for deleting team members
-- Users can delete team members in their salon
CREATE POLICY "Users can delete team members in their salon"
ON public.team
FOR DELETE
TO authenticated
USING (
    -- Can delete team members in the same salon
    salon_id = public.get_user_salon_id()
    OR
    -- Service accounts can delete all
    public.is_service_account()
);

-- Policy for service accounts to manage all team members
CREATE POLICY "Service accounts can manage all team members"
ON public.team
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team TO authenticated;
GRANT ALL ON public.team TO service_role;

-- Create additional indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_team_rls_salon_user ON public.team USING btree (salon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_rls_active_salon ON public.team USING btree (is_active, salon_id);

-- Comments for documentation
COMMENT ON POLICY "Users can view team members in their salon" ON public.team IS 
'Allow users to view team members within their salon, their own record, or all records for service accounts';

COMMENT ON POLICY "Users can insert team members in their salon" ON public.team IS 
'Allow users to insert team members only within their salon, or anywhere for service accounts';

COMMENT ON POLICY "Users can update team members in their salon" ON public.team IS 
'Allow users to update team members within their salon, their own record, or all records for service accounts';

COMMENT ON POLICY "Users can delete team members in their salon" ON public.team IS 
'Allow users to delete team members within their salon, or all records for service accounts';

COMMENT ON POLICY "Service accounts can manage all team members" ON public.team IS 
'Allow service accounts full access to all team member records';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';


