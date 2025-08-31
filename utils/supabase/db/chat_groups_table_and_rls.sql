-- PREREQUISITE: Ensure salon_id column exists in profiles table
-- Run add_salon_id_to_profiles.sql first if you get an error about salon_id not existing

-- Create chat_groups table
-- CRITICAL: salon_id is REQUIRED for multi-tenant isolation and security
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  description text NULL,
  avatar_url text NULL,
  is_private boolean NOT NULL DEFAULT false,
  max_members integer NOT NULL DEFAULT 100,
  created_by uuid NOT NULL,
  salon_id uuid NOT NULL, -- REQUIRED: Multi-tenant isolation
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT chat_groups_pkey PRIMARY KEY (id),
  CONSTRAINT chat_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT chat_groups_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.profiles (salon_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_groups_created_by ON public.chat_groups USING btree (created_by) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_groups_updated_at ON public.chat_groups USING btree (updated_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_groups_salon_id ON public.chat_groups USING btree (salon_id) TABLESPACE pg_default;

-- Create update trigger
CREATE TRIGGER update_chat_groups_updated_at 
  BEFORE UPDATE ON chat_groups 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view chat groups they belong to" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can create chat groups for their salon" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can update chat groups they created" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can delete chat groups they created" ON public.chat_groups;

-- RLS Policies for chat_groups table

-- SELECT: Users can view chat groups they belong to or that are in their salon
CREATE POLICY "Users can view chat groups they belong to" ON public.chat_groups
  FOR SELECT
  USING (
    -- User created the group
    created_by = auth.uid()
    OR
    -- User belongs to the same salon as the group
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
    OR
    -- User is a member of the group (check via chat_group_members)
    id IN (
      SELECT group_id 
      FROM public.chat_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create chat groups for their salon
CREATE POLICY "Users can create chat groups for their salon" ON public.chat_groups
  FOR INSERT
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- User must belong to the salon they're creating the group for
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
    AND
    -- The creator must be set to the current user
    created_by = auth.uid()
  );

-- UPDATE: Users can update chat groups they created or have admin rights in their salon
CREATE POLICY "Users can update chat groups they created" ON public.chat_groups
  FOR UPDATE
  USING (
    -- User created the group
    created_by = auth.uid()
    OR
    -- User has admin/owner role in the salon
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.salon_id = chat_groups.salon_id
        AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.salon_id = chat_groups.salon_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- DELETE: Users can delete chat groups they created or have admin rights in their salon
CREATE POLICY "Users can delete chat groups they created" ON public.chat_groups
  FOR DELETE
  USING (
    -- User created the group
    created_by = auth.uid()
    OR
    -- User has admin/owner role in the salon
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.salon_id = chat_groups.salon_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_groups TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Optional: Create a function to check if user can access a chat group
CREATE OR REPLACE FUNCTION public.can_access_chat_group(group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.chat_groups cg
    WHERE cg.id = group_id
      AND (
        -- User created the group
        cg.created_by = auth.uid()
        OR
        -- User belongs to the same salon
        cg.salon_id IN (
          SELECT salon_id 
          FROM public.profiles 
          WHERE id = auth.uid()
        )
        OR
        -- User is a member of the group
        EXISTS (
          SELECT 1 
          FROM public.chat_group_members cgm
          WHERE cgm.group_id = group_id
            AND cgm.user_id = auth.uid()
        )
      )
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.can_access_chat_group(uuid) TO authenticated;

-- Create a view for easier querying of chat groups with member counts
CREATE OR REPLACE VIEW public.chat_groups_with_stats AS
SELECT 
  cg.*,
  COALESCE(member_counts.member_count, 0) as member_count,
  COALESCE(member_counts.active_member_count, 0) as active_member_count
FROM public.chat_groups cg
LEFT JOIN (
  SELECT 
    group_id,
    COUNT(*) as member_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_member_count
  FROM public.chat_group_members
  GROUP BY group_id
) member_counts ON cg.id = member_counts.group_id;

-- Grant access to the view
GRANT SELECT ON public.chat_groups_with_stats TO authenticated;

-- Add RLS to the view (inherits from base table policies)
ALTER VIEW public.chat_groups_with_stats SET (security_barrier = true);

COMMENT ON TABLE public.chat_groups IS 'Chat groups for salon team communication';
COMMENT ON COLUMN public.chat_groups.salon_id IS 'Foreign key to salons table for multi-tenant isolation';
COMMENT ON COLUMN public.chat_groups.is_private IS 'Whether the group is private or public within the salon';
COMMENT ON COLUMN public.chat_groups.max_members IS 'Maximum number of members allowed in the group';
