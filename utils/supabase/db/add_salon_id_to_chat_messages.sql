-- Add salon_id column to existing chat_messages table
-- This adds multi-tenant isolation to chat messages

-- Step 1: Add salon_id column (nullable initially)
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS salon_id uuid;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_salon_id ON public.chat_messages USING btree (salon_id);

-- Step 3: Create composite index for optimal RLS performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_salon_group_created ON public.chat_messages 
USING btree (salon_id, group_id, created_at DESC);

-- Step 4: Update existing records with salon_id values
-- Get salon_id from the chat_groups table (which should already have salon_id)
UPDATE public.chat_messages 
SET salon_id = (
    SELECT cg.salon_id 
    FROM public.chat_groups cg 
    WHERE cg.id = chat_messages.group_id
    LIMIT 1
)
WHERE salon_id IS NULL;

-- Step 5: Handle any records where we couldn't find a salon_id from chat_groups
-- Fallback: get salon_id from user's profile
UPDATE public.chat_messages 
SET salon_id = (
    SELECT p.salon_id 
    FROM public.profiles p 
    WHERE p.id = chat_messages.user_id
    LIMIT 1
)
WHERE salon_id IS NULL;

-- Step 6: Handle any remaining orphaned records
-- Generate a default salon_id for completely orphaned records
UPDATE public.chat_messages 
SET salon_id = gen_random_uuid() 
WHERE salon_id IS NULL;

-- Step 7: Make salon_id NOT NULL
ALTER TABLE public.chat_messages 
ALTER COLUMN salon_id SET NOT NULL;

-- Step 8: Add foreign key constraint
ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_salon_id_fkey 
FOREIGN KEY (salon_id) REFERENCES public.profiles(salon_id) ON DELETE CASCADE;

-- Step 9: Enable RLS on the table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their salon groups" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their salon groups" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages in their salon" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages in their salon" ON public.chat_messages;

-- SELECT: Users can view messages in groups they have access to in their salon
CREATE POLICY "Users can view messages in their salon groups" ON public.chat_messages
  FOR SELECT
  USING (
    -- User belongs to the same salon
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
    AND
    -- User has access to the group (either member or same salon)
    group_id IN (
      SELECT cg.id
      FROM public.chat_groups cg
      WHERE cg.salon_id IN (
        SELECT salon_id 
        FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- INSERT: Users can create messages in groups they have access to in their salon
CREATE POLICY "Users can create messages in their salon groups" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    -- User belongs to the same salon as the message
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
    AND
    -- User is the sender
    user_id = auth.uid()
    AND
    -- Group belongs to the same salon
    group_id IN (
      SELECT cg.id
      FROM public.chat_groups cg
      WHERE cg.salon_id IN (
        SELECT salon_id 
        FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- UPDATE: Users can update their own messages in their salon
CREATE POLICY "Users can update their own messages in their salon" ON public.chat_messages
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- DELETE: Users can delete their own messages in their salon
CREATE POLICY "Users can delete their own messages in their salon" ON public.chat_messages
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Step 11: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;

-- Step 12: Create function to automatically set salon_id on insert
CREATE OR REPLACE FUNCTION public.set_message_salon_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set salon_id from the chat group
  IF NEW.salon_id IS NULL THEN
    SELECT salon_id INTO NEW.salon_id
    FROM public.chat_groups
    WHERE id = NEW.group_id;
    
    -- Fallback to user's salon_id if group doesn't have one
    IF NEW.salon_id IS NULL THEN
      SELECT salon_id INTO NEW.salon_id
      FROM public.profiles
      WHERE id = NEW.user_id;
    END IF;
    
    -- Ensure we have a salon_id
    IF NEW.salon_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine salon_id for message';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Create trigger to auto-set salon_id
CREATE TRIGGER set_message_salon_id_trigger
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_message_salon_id();

-- Step 14: Add comment
COMMENT ON COLUMN public.chat_messages.salon_id IS 'Foreign key to salon - required for multi-tenant isolation, inherited from chat group';

-- Step 15: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'chat_messages'
  AND column_name = 'salon_id';

-- Step 16: Show count of messages per salon
SELECT 
  salon_id,
  COUNT(*) as message_count
FROM public.chat_messages
GROUP BY salon_id
ORDER BY message_count DESC;
