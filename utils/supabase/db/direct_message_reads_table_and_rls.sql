-- Table to track read status for direct messages (1:1)
CREATE TABLE IF NOT EXISTS public.direct_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_direct_message_reads_message_id ON public.direct_message_reads (message_id);
CREATE INDEX IF NOT EXISTS idx_direct_message_reads_user_id ON public.direct_message_reads (user_id);

-- Enable RLS
ALTER TABLE public.direct_message_reads ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own read records
DROP POLICY IF EXISTS "Users can manage their direct message reads" ON public.direct_message_reads;
CREATE POLICY "Users can manage their direct message reads" ON public.direct_message_reads
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to compute unread counts per sender for the current user
CREATE OR REPLACE FUNCTION public.get_unread_direct_counts()
RETURNS TABLE (sender_id uuid, unread_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT dm.sender_id, count(*)::int AS unread_count
  FROM public.direct_messages dm
  LEFT JOIN public.direct_message_reads r
    ON r.message_id = dm.id AND r.user_id = auth.uid()
  WHERE dm.recipient_id = auth.uid()
    AND r.id IS NULL
  GROUP BY dm.sender_id;
$$;

-- Optional: enable realtime on this table (conditional add, no IF NOT EXISTS supported here)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'direct_message_reads'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_message_reads';
  END IF;
END $$;


