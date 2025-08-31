-- Create chat_message_reactions table with RLS policies
-- This script creates the table and sets up comprehensive Row Level Security

-- First, check if table exists and drop if necessary
DROP TABLE IF EXISTS public.chat_message_reactions CASCADE;

-- Create the chat_message_reactions table
CREATE TABLE public.chat_message_reactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emoji character varying(10) NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT chat_message_reactions_pkey PRIMARY KEY (id),
    CONSTRAINT chat_message_reactions_message_id_user_id_emoji_key UNIQUE (message_id, user_id, emoji),
    CONSTRAINT chat_message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages (id) ON DELETE CASCADE,
    CONSTRAINT chat_message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_message_id ON public.chat_message_reactions USING btree (message_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_user_id ON public.chat_message_reactions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_message_user ON public.chat_message_reactions USING btree (message_id, user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_emoji ON public.chat_message_reactions USING btree (emoji) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

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

-- Helper function to check if user can access a message (based on group membership)
CREATE OR REPLACE FUNCTION public.can_access_message(target_message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    current_user_salon_id uuid;
    message_group_id uuid;
    can_access boolean := false;
BEGIN
    -- Get current user's salon_id
    current_user_salon_id := public.get_user_salon_id();
    
    IF current_user_salon_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get the group_id for the message
    SELECT group_id INTO message_group_id
    FROM public.chat_messages
    WHERE id = target_message_id;
    
    IF message_group_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user is a member of the group AND from the same salon
    SELECT EXISTS (
        SELECT 1 
        FROM public.chat_group_members cgm
        JOIN public.team t ON t.user_id = cgm.user_id
        WHERE cgm.group_id = message_group_id
        AND cgm.user_id = auth.uid()
        AND t.salon_id = current_user_salon_id
        AND t.is_active = true
    ) INTO can_access;
    
    RETURN can_access;
END;
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view reactions on accessible messages" ON public.chat_message_reactions;
DROP POLICY IF EXISTS "Users can add reactions to accessible messages" ON public.chat_message_reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON public.chat_message_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.chat_message_reactions;
DROP POLICY IF EXISTS "Service accounts can manage all reactions" ON public.chat_message_reactions;

-- Policy 1: SELECT - Users can view reactions if:
-- 1. They can access the message (are group members from same salon)
-- 2. They are service accounts
CREATE POLICY "Users can view reactions on accessible messages"
ON public.chat_message_reactions
FOR SELECT
TO authenticated
USING (
    -- User can access the message
    public.can_access_message(message_id)
    OR
    -- Service accounts can see all
    public.is_service_account()
);

-- Policy 2: INSERT - Users can add reactions if:
-- 1. They can access the message and the reaction is their own
-- 2. They are service accounts
CREATE POLICY "Users can add reactions to accessible messages"
ON public.chat_message_reactions
FOR INSERT
TO authenticated
WITH CHECK (
    -- User can access the message and is adding their own reaction
    (
        public.can_access_message(message_id)
        AND user_id = auth.uid()
    )
    OR
    -- Service accounts can add any reaction
    public.is_service_account()
);

-- Policy 3: UPDATE - Users can update if:
-- 1. It's their own reaction and they can access the message
-- 2. They are service accounts
CREATE POLICY "Users can update their own reactions"
ON public.chat_message_reactions
FOR UPDATE
TO authenticated
USING (
    -- User owns the reaction and can access the message
    (
        user_id = auth.uid()
        AND public.can_access_message(message_id)
    )
    OR
    -- Service accounts can update all
    public.is_service_account()
)
WITH CHECK (
    -- Same conditions as USING clause
    (
        user_id = auth.uid()
        AND public.can_access_message(message_id)
    )
    OR
    public.is_service_account()
);

-- Policy 4: DELETE - Users can delete if:
-- 1. It's their own reaction and they can access the message
-- 2. They are service accounts
CREATE POLICY "Users can delete their own reactions"
ON public.chat_message_reactions
FOR DELETE
TO authenticated
USING (
    -- User owns the reaction and can access the message
    (
        user_id = auth.uid()
        AND public.can_access_message(message_id)
    )
    OR
    -- Service accounts can delete any reaction
    public.is_service_account()
);

-- Policy 5: Service role policy (for backend operations)
CREATE POLICY "Service accounts can manage all reactions"
ON public.chat_message_reactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_message_reactions TO authenticated;
GRANT ALL ON public.chat_message_reactions TO service_role;

-- Create optimized indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_rls_user_message ON public.chat_message_reactions USING btree (user_id, message_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_rls_message_emoji ON public.chat_message_reactions USING btree (message_id, emoji);

-- Update statistics for better query planning
ANALYZE public.chat_message_reactions;

-- Add helpful comments
COMMENT ON TABLE public.chat_message_reactions IS 'Reactions to chat messages with salon-based access control';
COMMENT ON POLICY "Users can view reactions on accessible messages" ON public.chat_message_reactions IS 
'Allow users to view reactions on messages in groups they are members of within their salon';
COMMENT ON POLICY "Users can add reactions to accessible messages" ON public.chat_message_reactions IS 
'Allow users to add their own reactions to accessible messages';
COMMENT ON POLICY "Users can update their own reactions" ON public.chat_message_reactions IS 
'Allow users to update only their own reactions on accessible messages';
COMMENT ON POLICY "Users can delete their own reactions" ON public.chat_message_reactions IS 
'Allow users to delete only their own reactions on accessible messages';
COMMENT ON POLICY "Service accounts can manage all reactions" ON public.chat_message_reactions IS 
'Allow service accounts full access to all reaction records for backend operations';

-- Create function to get reaction counts for a message
CREATE OR REPLACE FUNCTION public.get_message_reaction_counts(target_message_id uuid)
RETURNS TABLE(emoji character varying, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Only return data if user can access the message
    IF NOT public.can_access_message(target_message_id) AND NOT public.is_service_account() THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        cmr.emoji,
        COUNT(*) as count
    FROM public.chat_message_reactions cmr
    WHERE cmr.message_id = target_message_id
    GROUP BY cmr.emoji
    ORDER BY count DESC, cmr.emoji;
END;
$$;

-- Create function to check if user has reacted with specific emoji
CREATE OR REPLACE FUNCTION public.user_has_reaction(target_message_id uuid, target_emoji character varying)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Only check if user can access the message
    IF NOT public.can_access_message(target_message_id) AND NOT public.is_service_account() THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM public.chat_message_reactions
        WHERE message_id = target_message_id
        AND user_id = auth.uid()
        AND emoji = target_emoji
    );
END;
$$;

-- Create trigger to prevent excessive reactions per user per message
CREATE OR REPLACE FUNCTION public.limit_user_reactions_per_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reaction_count integer;
    max_reactions_per_user integer := 10; -- Limit to prevent spam
BEGIN
    -- Count existing reactions by this user on this message
    SELECT COUNT(*) INTO reaction_count
    FROM public.chat_message_reactions
    WHERE message_id = NEW.message_id
    AND user_id = NEW.user_id;
    
    -- Check if limit would be exceeded
    IF reaction_count >= max_reactions_per_user THEN
        RAISE EXCEPTION 'User cannot add more than % reactions per message', max_reactions_per_user;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_limit_user_reactions_per_message
    BEFORE INSERT ON public.chat_message_reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.limit_user_reactions_per_message();

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_message_reaction_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_reaction(uuid, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_message(uuid) TO authenticated;

-- Log the creation
DO $$
BEGIN
    RAISE NOTICE 'chat_message_reactions table created with RLS policies at %', NOW();
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
