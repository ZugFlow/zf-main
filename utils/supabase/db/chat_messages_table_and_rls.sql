-- Create chat_messages table with RLS policies
-- This script creates the table and sets up comprehensive Row Level Security

-- Note: Table already exists, just setting up RLS policies
-- Enable RLS if not already enabled
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is service account (reuse existing if available)
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

-- Helper function to get user's salon_id (reuse existing if available)
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

-- Helper function to check if user can access a chat group
CREATE OR REPLACE FUNCTION public.can_access_chat_group(target_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    current_user_salon_id uuid;
    can_access boolean := false;
BEGIN
    -- Get current user's salon_id
    current_user_salon_id := public.get_user_salon_id();
    
    IF current_user_salon_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user is a member of the group AND from the same salon
    SELECT EXISTS (
        SELECT 1 
        FROM public.chat_group_members cgm
        JOIN public.team t ON t.user_id = cgm.user_id
        WHERE cgm.group_id = target_group_id
        AND cgm.user_id = auth.uid()
        AND t.salon_id = current_user_salon_id
        AND t.is_active = true
    ) INTO can_access;
    
    RETURN can_access;
END;
$$;

-- Helper function to check if user is group admin or moderator
CREATE OR REPLACE FUNCTION public.is_group_admin_or_moderator(target_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.chat_group_members cgm
        JOIN public.team t ON t.user_id = cgm.user_id
        WHERE cgm.group_id = target_group_id
        AND cgm.user_id = auth.uid()
        AND cgm.role IN ('admin', 'moderator')
        AND t.salon_id = public.get_user_salon_id()
        AND t.is_active = true
    );
END;
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in accessible groups" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible groups" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages or admins can delete any" ON public.chat_messages;
DROP POLICY IF EXISTS "Service accounts can manage all messages" ON public.chat_messages;

-- Policy 1: SELECT - Users can view messages if:
-- 1. They are members of the group and from the same salon
-- 2. They are service accounts
CREATE POLICY "Users can view messages in accessible groups"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
    -- User can access the group (is member from same salon)
    public.can_access_chat_group(group_id)
    OR
    -- Service accounts can see all
    public.is_service_account()
);

-- Policy 2: INSERT - Users can send messages if:
-- 1. They are members of the group, from same salon, and message is their own
-- 2. They are service accounts
CREATE POLICY "Users can send messages to accessible groups"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
    -- User can access the group and is sending their own message
    (
        public.can_access_chat_group(group_id)
        AND user_id = auth.uid()
    )
    OR
    -- Service accounts can send any message
    public.is_service_account()
);

-- Policy 3: UPDATE - Users can edit messages if:
-- 1. It's their own message and they can access the group
-- 2. They are service accounts
-- Note: Only allow editing content, message_type, and is_edited fields
CREATE POLICY "Users can edit their own messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
    -- User owns the message and can access the group
    (
        user_id = auth.uid()
        AND public.can_access_chat_group(group_id)
        AND is_deleted = false -- Cannot edit deleted messages
    )
    OR
    -- Service accounts can edit all
    public.is_service_account()
)
WITH CHECK (
    -- Same conditions as USING clause
    (
        user_id = auth.uid()
        AND public.can_access_chat_group(group_id)
        AND is_deleted = false
    )
    OR
    public.is_service_account()
);

-- Policy 4: DELETE - Users can delete messages if:
-- 1. It's their own message and they can access the group
-- 2. They are group admin/moderator and can access the group
-- 3. They are service accounts
-- Note: We use soft delete by setting is_deleted = true instead of actual DELETE
CREATE POLICY "Users can delete their own messages or admins can delete any"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
    -- User owns the message and can access the group
    (
        user_id = auth.uid()
        AND public.can_access_chat_group(group_id)
    )
    OR
    -- Group admins/moderators can delete any message in their groups
    (
        public.is_group_admin_or_moderator(group_id)
        AND public.can_access_chat_group(group_id)
    )
    OR
    -- Service accounts can delete any message
    public.is_service_account()
)
WITH CHECK (
    -- Same conditions as USING clause
    (
        user_id = auth.uid()
        AND public.can_access_chat_group(group_id)
    )
    OR
    (
        public.is_group_admin_or_moderator(group_id)
        AND public.can_access_chat_group(group_id)
    )
    OR
    public.is_service_account()
);

-- Policy 5: Service role policy (for backend operations)
CREATE POLICY "Service accounts can manage all messages"
ON public.chat_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

-- Create optimized indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_rls_group_user ON public.chat_messages USING btree (group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_rls_user_created ON public.chat_messages USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_rls_group_created_active ON public.chat_messages USING btree (group_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_chat_messages_rls_reply_to ON public.chat_messages USING btree (reply_to) WHERE reply_to IS NOT NULL;

-- Update statistics for better query planning
ANALYZE public.chat_messages;

-- Add helpful comments
COMMENT ON TABLE public.chat_messages IS 'Chat messages with salon-based access control and soft delete functionality';
COMMENT ON POLICY "Users can view messages in accessible groups" ON public.chat_messages IS 
'Allow users to view messages in groups they are members of within their salon';
COMMENT ON POLICY "Users can send messages to accessible groups" ON public.chat_messages IS 
'Allow users to send their own messages to groups they are members of within their salon';
COMMENT ON POLICY "Users can edit their own messages" ON public.chat_messages IS 
'Allow users to edit only their own messages in accessible groups (excludes deleted messages)';
COMMENT ON POLICY "Users can delete their own messages or admins can delete any" ON public.chat_messages IS 
'Allow users to delete their own messages and group admins/moderators to delete any messages (soft delete)';
COMMENT ON POLICY "Service accounts can manage all messages" ON public.chat_messages IS 
'Allow service accounts full access to all message records for backend operations';

-- Create function to soft delete a message
CREATE OR REPLACE FUNCTION public.soft_delete_message(target_message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    message_exists boolean;
    user_can_delete boolean;
BEGIN
    -- Check if message exists and user can delete it
    SELECT 
        (m.id IS NOT NULL),
        (
            m.user_id = auth.uid() 
            OR public.is_group_admin_or_moderator(m.group_id)
            OR public.is_service_account()
        )
    INTO message_exists, user_can_delete
    FROM public.chat_messages m
    WHERE m.id = target_message_id
    AND public.can_access_chat_group(m.group_id);
    
    IF NOT message_exists THEN
        RAISE EXCEPTION 'Message not found or access denied';
    END IF;
    
    IF NOT user_can_delete THEN
        RAISE EXCEPTION 'Insufficient permissions to delete this message';
    END IF;
    
    -- Soft delete the message
    UPDATE public.chat_messages 
    SET 
        is_deleted = true,
        content = '[Message deleted]',
        updated_at = now()
    WHERE id = target_message_id;
    
    RETURN true;
END;
$$;

-- Create function to get messages for a group with proper filtering
CREATE OR REPLACE FUNCTION public.get_group_messages(
    target_group_id uuid,
    message_limit integer DEFAULT 50,
    before_message_id uuid DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    group_id uuid,
    user_id uuid,
    content text,
    message_type character varying,
    reply_to uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_edited boolean,
    is_deleted boolean,
    attachments jsonb,
    user_name text,
    user_avatar text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    before_timestamp timestamp with time zone;
BEGIN
    -- Check if user can access the group
    IF NOT public.can_access_chat_group(target_group_id) AND NOT public.is_service_account() THEN
        RAISE EXCEPTION 'Access denied to group messages';
    END IF;
    
    -- Get timestamp for pagination if before_message_id is provided
    IF before_message_id IS NOT NULL THEN
        SELECT m.created_at INTO before_timestamp
        FROM public.chat_messages m
        WHERE m.id = before_message_id;
    END IF;
    
    RETURN QUERY
    SELECT 
        m.id,
        m.group_id,
        m.user_id,
        CASE 
            WHEN m.is_deleted THEN '[Message deleted]'::text
            ELSE m.content
        END as content,
        m.message_type,
        m.reply_to,
        m.created_at,
        m.updated_at,
        m.is_edited,
        m.is_deleted,
        CASE 
            WHEN m.is_deleted THEN '[]'::jsonb
            ELSE m.attachments
        END as attachments,
        COALESCE(p.full_name, u.email) as user_name,
        p.avatar_url as user_avatar
    FROM public.chat_messages m
    LEFT JOIN auth.users u ON u.id = m.user_id
    LEFT JOIN public.profiles p ON p.id = m.user_id
    WHERE m.group_id = target_group_id
    AND (before_timestamp IS NULL OR m.created_at < before_timestamp)
    ORDER BY m.created_at DESC
    LIMIT message_limit;
END;
$$;

-- Create trigger to automatically set updated_at and is_edited on content changes
CREATE OR REPLACE FUNCTION public.handle_message_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set updated_at
    NEW.updated_at = now();
    
    -- Set is_edited if content changed (and it's not a deletion)
    IF OLD.content != NEW.content AND NOT NEW.is_deleted THEN
        NEW.is_edited = true;
    END IF;
    
    -- Prevent editing of deleted messages
    IF OLD.is_deleted = true AND NEW.is_deleted = false THEN
        RAISE EXCEPTION 'Cannot undelete messages';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_handle_message_update
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_message_update();

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.soft_delete_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_messages(uuid, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_chat_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin_or_moderator(uuid) TO authenticated;

-- Log the creation
DO $$
BEGIN
    RAISE NOTICE 'chat_messages RLS policies created at %', NOW();
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
