-- Create permessiferie table
CREATE TABLE IF NOT EXISTS public.permessiferie (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL,
  member_id uuid NOT NULL,
  type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time without time zone NULL,
  end_time time without time zone NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  reason text NOT NULL,
  notes text NULL,
  approved_by uuid NULL,
  approved_at timestamp without time zone NULL,
  rejection_reason text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT permessiferie_pkey PRIMARY KEY (id),
  CONSTRAINT permessiferie_status_check CHECK (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  ),
  CONSTRAINT permessiferie_type_check CHECK (
    (
      type = any (
        array[
          'ferie'::text,
          'permesso'::text,
          'malattia'::text,
          'altro'::text
        ]
      )
    )
  ),
  CONSTRAINT permessiferie_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.salons(id) ON DELETE CASCADE,
  CONSTRAINT permessiferie_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.team(id) ON DELETE CASCADE,
  CONSTRAINT permessiferie_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permessiferie_salon_id ON public.permessiferie(salon_id);
CREATE INDEX IF NOT EXISTS idx_permessiferie_member_id ON public.permessiferie(member_id);
CREATE INDEX IF NOT EXISTS idx_permessiferie_status ON public.permessiferie(status);
CREATE INDEX IF NOT EXISTS idx_permessiferie_type ON public.permessiferie(type);
CREATE INDEX IF NOT EXISTS idx_permessiferie_start_date ON public.permessiferie(start_date);
CREATE INDEX IF NOT EXISTS idx_permessiferie_end_date ON public.permessiferie(end_date);
CREATE INDEX IF NOT EXISTS idx_permessiferie_created_at ON public.permessiferie(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.permessiferie ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view permissions for their salon" ON public.permessiferie
  FOR SELECT USING (
    salon_id IN (
      SELECT salon_id FROM public.team 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert permissions for their salon" ON public.permessiferie
  FOR INSERT WITH CHECK (
    salon_id IN (
      SELECT salon_id FROM public.team 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update permissions for their salon" ON public.permessiferie
  FOR UPDATE USING (
    salon_id IN (
      SELECT salon_id FROM public.team 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete permissions for their salon" ON public.permessiferie
  FOR DELETE USING (
    salon_id IN (
      SELECT salon_id FROM public.team 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_permessiferie_updated_at 
  BEFORE UPDATE ON public.permessiferie 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 