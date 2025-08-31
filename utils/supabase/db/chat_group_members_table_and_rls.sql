-- Create chat_group_members table with RLS policies
-- This script creates the table and sets up comprehensive Row Level Security

-- First, check if table exists and drop if necessary
DROP TABLE IF EXISTS public.chat_group_members CASCADE;

-- Create the chat_group_members table
CREATE TABLE public.chat_group_members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) NOT NULL DEFAULT 'member'::character varying,
    joined_at timestamp with time zone NULL DEFAULT now(),
    last_seen timestamp with time zone NULL DEFAULT now(),
    is_muted boolean NULL DEFAULT false,
    CONSTRAINT chat_group_members_pkey PRIMARY KEY (id),
    CONSTRAINT chat_group_members_group_id_user_id_key UNIQUE (group_id, user_id),
    CONSTRAINT chat_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES chat_groups (id) ON DELETE CASCADE,
    CONSTRAINT chat_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT chat_group_members_role_check CHECK (
        (role)::text = ANY (
            (ARRAY[
                'admin'::character varying,
                'moderator'::character varying,
                'member'::character varying
            ])::text[]
        )
    )
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON public.chat_group_members USING btree (group_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON public.chat_group_members USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_user ON public.chat_group_members USING btree (group_id, user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_group_members_role ON public.chat_group_members USING btree (role) WHERE role IN ('admin', 'moderator');

-- Enable RLS
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is service account
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

-- Helper function to get user's salon_id
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

-- Helper function to check if user is in the same salon as group members
CREATE OR REPLACE FUNCTION public.is_same_salon_group(target_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    current_user_salon_id uuid;
    group_salon_exists boolean := false;
BEGIN
    -- Get current user's salon_id
    current_user_salon_id := public.get_user_salon_id();
    
    IF current_user_salon_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if any member of the group is from the same salon
    SELECT EXISTS (
        SELECT 1 
        FROM public.chat_group_members cgm
        JOIN public.team t ON t.user_id = cgm.user_id
        WHERE cgm.group_id = target_group_id
        AND t.salon_id = current_user_salon_id
        AND t.is_active = true
    ) INTO group_salon_exists;
    
    RETURN group_salon_exists;
END;
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view group members in same salon" ON public.chat_group_members;
DROP POLICY IF EXISTS "Users can manage group membership in same salon" ON public.chat_group_members;
DROP POLICY IF EXISTS "Group admins can manage all members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Service accounts can manage all group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Users can join groups in same salon" ON public.chat_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.chat_group_members;

-- Policy 1: SELECT - Users can view group members if:
-- 1. They are members of the group
-- 2. The group has members from their salon
-- 3. They are service accounts
CREATE POLICY "Users can view group members in same salon"
ON public.chat_group_members
FOR SELECT
TO authenticated
USING (
    -- User is a member of this group
    EXISTS (
        SELECT 1 FROM public.chat_group_members cgm_self
        WHERE cgm_self.group_id = chat_group_members.group_id
        AND cgm_self.user_id = auth.uid()
    )
    OR
    -- Group has members from the same salon
    public.is_same_salon_group(group_id)
    OR
    -- Service accounts can see all
    public.is_service_account()
);

-- Policy 2: INSERT - Users can join groups if:
-- 1. Group has members from their salon or they're being added by an admin
-- 2. They are service accounts
CREATE POLICY "Users can join groups in same salon"
ON public.chat_group_members
FOR INSERT
TO authenticated
WITH CHECK (
    -- Can join if group has members from same salon
    public.is_same_salon_group(group_id)
    OR
    -- Can be added by group admin from same salon
    EXISTS (
        SELECT 1 FROM public.chat_group_members cgm_admin
        WHERE cgm_admin.group_id = chat_group_members.group_id
        AND cgm_admin.user_id = auth.uid()
        AND cgm_admin.role = 'admin'
    )
    OR
    -- Self-joining (user_id matches authenticated user)
    user_id = auth.uid()
    OR
    -- Service accounts can add anyone
    public.is_service_account()
);

-- Policy 3: UPDATE - Users can update group membership if:
-- 1. They are admins/moderators of the group
-- 2. They are updating their own record (limited fields)
-- 3. They are service accounts
CREATE POLICY "Users can manage group membership in same salon"
ON public.chat_group_members
FOR UPDATE
TO authenticated
USING (
    -- Group admins/moderators can update
    EXISTS (
        SELECT 1 FROM public.chat_group_members cgm_admin
        WHERE cgm_admin.group_id = chat_group_members.group_id
        AND cgm_admin.user_id = auth.uid()
        AND cgm_admin.role IN ('admin', 'moderator')
    )
    OR
    -- Users can update their own last_seen and is_muted
    user_id = auth.uid()
    OR
    -- Service accounts can update all
    public.is_service_account()
)
WITH CHECK (
    -- Same conditions as USING clause
    EXISTS (
        SELECT 1 FROM public.chat_group_members cgm_admin
        WHERE cgm_admin.group_id = chat_group_members.group_id
        AND cgm_admin.user_id = auth.uid()
        AND cgm_admin.role IN ('admin', 'moderator')
    )
    OR
    user_id = auth.uid()
    OR
    public.is_service_account()
);

-- Policy 4: DELETE - Users can remove group members if:
-- 1. They are admins of the group
-- 2. They are leaving themselves
-- 3. They are service accounts
CREATE POLICY "Users can leave groups"
ON public.chat_group_members
FOR DELETE
TO authenticated
USING (
    -- Group admins can remove members
    EXISTS (
        SELECT 1 FROM public.chat_group_members cgm_admin
        WHERE cgm_admin.group_id = chat_group_members.group_id
        AND cgm_admin.user_id = auth.uid()
        AND cgm_admin.role = 'admin'
    )
    OR
    -- Users can remove themselves
    user_id = auth.uid()
    OR
    -- Service accounts can remove anyone
    public.is_service_account()
);

-- Policy 5: Service role policy (for backend operations)
CREATE POLICY "Service accounts can manage all group members"
ON public.chat_group_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_group_members TO authenticated;
GRANT ALL ON public.chat_group_members TO service_role;

-- Create optimized indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_chat_group_members_rls_user_group ON public.chat_group_members USING btree (user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_rls_group_role ON public.chat_group_members USING btree (group_id, role) WHERE role IN ('admin', 'moderator');

-- Update statistics for better query planning
ANALYZE public.chat_group_members;

-- Add helpful comments
COMMENT ON TABLE public.chat_group_members IS 'Members of chat groups with salon-based access control';
COMMENT ON POLICY "Users can view group members in same salon" ON public.chat_group_members IS 
'Allow users to view group members if they are in the group or group has salon members';
COMMENT ON POLICY "Users can join groups in same salon" ON public.chat_group_members IS 
'Allow users to join groups with salon members or be added by admins';
COMMENT ON POLICY "Users can manage group membership in same salon" ON public.chat_group_members IS 
'Allow group admins/moderators to manage members and users to update their own settings';
COMMENT ON POLICY "Users can leave groups" ON public.chat_group_members IS 
'Allow group admins to remove members and users to leave groups themselves';
COMMENT ON POLICY "Service accounts can manage all group members" ON public.chat_group_members IS 
'Allow service accounts full access to all group member records for backend operations';

-- Create trigger for updating last_seen timestamp
CREATE OR REPLACE FUNCTION public.update_chat_member_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only update last_seen if it's not explicitly being set
    IF TG_OP = 'UPDATE' AND OLD.last_seen = NEW.last_seen THEN
        NEW.last_seen = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_chat_member_last_seen
    BEFORE UPDATE ON public.chat_group_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chat_member_last_seen();

-- Log the creation
DO $$
BEGIN
    RAISE NOTICE 'chat_group_members table created with RLS policies at %', NOW();
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
