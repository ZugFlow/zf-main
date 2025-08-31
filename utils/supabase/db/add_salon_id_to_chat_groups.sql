-- Add salon_id column to existing chat_groups table
-- This adds multi-tenant isolation to the chat system

-- Step 1: Add salon_id column (nullable initially)
ALTER TABLE public.chat_groups 
ADD COLUMN IF NOT EXISTS salon_id uuid;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_groups_salon_id ON public.chat_groups USING btree (salon_id);

-- Step 3: Update existing records with salon_id values
-- This assigns salon_id based on the creator's salon_id from profiles table
UPDATE public.chat_groups 
SET salon_id = (
    SELECT p.salon_id 
    FROM public.profiles p 
    WHERE p.id = chat_groups.created_by
    LIMIT 1
)
WHERE salon_id IS NULL;

-- Step 4: Handle any records where we couldn't find a salon_id
-- Generate a default salon_id for orphaned records
UPDATE public.chat_groups 
SET salon_id = gen_random_uuid() 
WHERE salon_id IS NULL;

-- Step 5: Make salon_id NOT NULL
ALTER TABLE public.chat_groups 
ALTER COLUMN salon_id SET NOT NULL;

-- Step 6: Add foreign key constraint
ALTER TABLE public.chat_groups 
ADD CONSTRAINT chat_groups_salon_id_fkey 
FOREIGN KEY (salon_id) REFERENCES public.profiles(salon_id) ON DELETE CASCADE;

-- Step 7: Enable RLS on the table
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view chat groups in their salon" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can create chat groups for their salon" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can update chat groups they created" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can delete chat groups they created" ON public.chat_groups;

-- SELECT: Users can view chat groups in their salon
CREATE POLICY "Users can view chat groups in their salon" ON public.chat_groups
  FOR SELECT
  USING (
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- INSERT: Users can create chat groups for their salon
CREATE POLICY "Users can create chat groups for their salon" ON public.chat_groups
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
    AND
    created_by = auth.uid()
  );

-- UPDATE: Users can update chat groups they created in their salon
CREATE POLICY "Users can update chat groups they created" ON public.chat_groups
  FOR UPDATE
  USING (
    created_by = auth.uid()
    AND
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- DELETE: Users can delete chat groups they created in their salon
CREATE POLICY "Users can delete chat groups they created" ON public.chat_groups
  FOR DELETE
  USING (
    created_by = auth.uid()
    AND
    salon_id IN (
      SELECT salon_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_groups TO authenticated;

-- Add comment
COMMENT ON COLUMN public.chat_groups.salon_id IS 'Foreign key to salon - required for multi-tenant isolation';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'chat_groups'
ORDER BY ordinal_position;
