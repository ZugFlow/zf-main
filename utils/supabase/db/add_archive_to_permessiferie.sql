-- Add archived column to permessiferie table
ALTER TABLE public.permessiferie 
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Add index for archived column for better performance
CREATE INDEX IF NOT EXISTS idx_permessiferie_archived ON public.permessiferie(archived);

-- Update RLS policies to include archived filter
DROP POLICY IF EXISTS "Users can view permissions for their salon" ON public.permessiferie;
CREATE POLICY "Users can view permissions for their salon" ON public.permessiferie
  FOR SELECT USING (
    salon_id IN (
      SELECT salon_id FROM public.team 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Add comment to explain the archived field
COMMENT ON COLUMN public.permessiferie.archived IS 'Indicates if the permission has been archived (approved or rejected)'; 