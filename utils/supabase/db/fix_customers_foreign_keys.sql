-- Fix foreign key constraints for customers table
-- Run this if you already created the table and need to remove problematic FK constraints

-- Drop the problematic foreign key constraints if they exist
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS fk_customers_user_id;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS fk_customers_user_id_emittente;

-- Keep only the constraints that reference existing tables
-- Ensure team and salon tables exist before running this

-- Verify team table constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team') THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT fk_customers_team_id 
        FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added team_id foreign key constraint';
    ELSE
        RAISE NOTICE 'Team table does not exist, skipping team_id constraint';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Team foreign key constraint already exists';
END $$;

-- Verify salon_id constraint (references profiles.salon_id, not a separate salon table)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT fk_customers_salon_id 
        FOREIGN KEY (salon_id) REFERENCES public.profiles(salon_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added salon_id foreign key constraint to profiles.salon_id';
    ELSE
        RAISE NOTICE 'Profiles table does not exist, skipping salon_id constraint';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Salon foreign key constraint already exists';
END $$;

RAISE NOTICE 'Foreign key constraints fixed successfully';
