-- Add salon_id column to profiles table
-- This is required for multi-tenant isolation across the entire system

-- First, check if the column already exists to avoid errors
DO $$ 
BEGIN
    -- Add salon_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'salon_id'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN salon_id uuid;
        
        RAISE NOTICE 'Added salon_id column to profiles table';
    ELSE
        RAISE NOTICE 'salon_id column already exists in profiles table';
    END IF;
END $$;

-- Create index on salon_id for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_salon_id ON public.profiles USING btree (salon_id);

-- Add a unique constraint for salon_id (assuming each profile belongs to one salon)
-- Note: This assumes that salon_id should be unique per profile
-- If multiple profiles can have the same salon_id, comment out the next line
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_salon_id_unique UNIQUE (salon_id);

-- Update existing records to have a salon_id if they don't have one
-- This generates a unique salon_id for each existing profile
-- Adjust this logic based on your business requirements
UPDATE public.profiles 
SET salon_id = gen_random_uuid() 
WHERE salon_id IS NULL;

-- Make salon_id NOT NULL after setting values
ALTER TABLE public.profiles 
ALTER COLUMN salon_id SET NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.salon_id IS 'Unique identifier for the salon/business - used for multi-tenant isolation';

-- Verify the column was created successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'salon_id'
    ) THEN
        RAISE NOTICE 'SUCCESS: salon_id column created and configured in profiles table';
    ELSE
        RAISE EXCEPTION 'FAILED: salon_id column was not created in profiles table';
    END IF;
END $$;
