-- Enable RLS and create policies for existing customers table
-- This script only adds RLS policies without modifying the table structure

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view customers for their salon" ON public.customers;
DROP POLICY IF EXISTS "Users can create customers for their salon" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers for their salon" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers for their salon" ON public.customers;

-- RLS Policy: Users can view customers for their salon
-- This policy allows users to see customers that belong to their salon
-- Users can access customers through either profiles.salon_id or team.salon_id
CREATE POLICY "Users can view customers for their salon" ON public.customers
    FOR SELECT USING (
        salon_id IN (
            -- Check if user is salon owner/manager through profiles table
            SELECT salon_id FROM public.profiles 
            WHERE id = auth.uid()
            UNION
            -- Check if user is team member through team table
            SELECT salon_id FROM public.team 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can create customers for their salon
-- This policy allows users to create customers only for their salon
CREATE POLICY "Users can create customers for their salon" ON public.customers
    FOR INSERT WITH CHECK (
        salon_id IN (
            -- Check if user is salon owner/manager through profiles table
            SELECT salon_id FROM public.profiles 
            WHERE id = auth.uid()
            UNION
            -- Check if user is team member through team table
            SELECT salon_id FROM public.team 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can update customers for their salon
-- This policy allows users to update customers only for their salon
CREATE POLICY "Users can update customers for their salon" ON public.customers
    FOR UPDATE USING (
        salon_id IN (
            -- Check if user is salon owner/manager through profiles table
            SELECT salon_id FROM public.profiles 
            WHERE id = auth.uid()
            UNION
            -- Check if user is team member through team table
            SELECT salon_id FROM public.team 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policy: Users can delete customers for their salon
-- This policy allows users to delete customers for their salon
CREATE POLICY "Users can delete customers for their salon" ON public.customers
    FOR DELETE USING (
        salon_id IN (
            -- Check if user is salon owner/manager through profiles table
            SELECT salon_id FROM public.profiles 
            WHERE id = auth.uid()
            UNION
            -- Check if user is team member through team table
            SELECT salon_id FROM public.team 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Grant appropriate permissions
GRANT SELECT ON public.customers TO authenticated;
GRANT INSERT ON public.customers TO authenticated;
GRANT UPDATE ON public.customers TO authenticated;
GRANT DELETE ON public.customers TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'RLS enabled and policies created for customers table';
    RAISE NOTICE 'Users can only access customers from their own salon';
    RAISE NOTICE 'Access control based on salon_id through profiles and team tables';
END $$;
