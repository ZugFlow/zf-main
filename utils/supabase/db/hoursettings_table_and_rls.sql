-- Create hoursettings table with RLS policies
-- This table stores user-specific hour settings and display preferences

-- Create the table
CREATE TABLE IF NOT EXISTS public.hoursettings (
    id integer NOT NULL DEFAULT nextval('users_per_page_id_seq'::regclass),
    user_id uuid NOT NULL,
    start_hour text NOT NULL,
    finish_hour text NULL,
    formato text NULL,
    salon_id uuid NULL,
    hide_outside_hours boolean NULL DEFAULT false,
    "SizeCard" text NULL DEFAULT 'normal'::text,
    "CardAlignment" text NULL DEFAULT 'center'::text,
    created_at timestamp without time zone NULL DEFAULT now(),
    updated_at timestamp without time zone NULL DEFAULT now(),
    
    -- Primary key constraint
    CONSTRAINT hoursettings_pkey PRIMARY KEY (id),
    
    -- Unique constraint for user_id (each user can have only one settings record)
    CONSTRAINT hoursettings_user_id_key UNIQUE (user_id),
    
    -- Foreign key constraints
    CONSTRAINT hoursettings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT hoursettings_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS hoursettings_user_id_idx ON public.hoursettings USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS hoursettings_salon_id_idx ON public.hoursettings USING btree (salon_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS hoursettings_created_at_idx ON public.hoursettings USING btree (created_at DESC) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public.hoursettings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own settings or settings of team members in their salon
CREATE POLICY "Users can view hoursettings" ON public.hoursettings
    FOR SELECT USING (
        -- User can view their own settings
        user_id = auth.uid()
        OR
        -- Manager can view settings for team members in their salon
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND salon_id = hoursettings.salon_id
        )
        OR
        -- Team member can view settings for other team members in same salon
        EXISTS (
            SELECT 1 FROM team t1
            JOIN team t2 ON t1.salon_id = t2.salon_id
            WHERE t1.user_id = auth.uid()
            AND t2.user_id = hoursettings.user_id
            AND t1.is_active = true
            AND t2.is_active = true
        )
    );

-- RLS Policy: Users can create their own settings
CREATE POLICY "Users can create hoursettings" ON public.hoursettings
    FOR INSERT WITH CHECK (
        -- User can only create settings for themselves
        user_id = auth.uid()
        AND
        -- If salon_id is provided, user must be associated with that salon
        (
            salon_id IS NULL 
            OR 
            salon_id IN (
                -- User is a manager with this salon_id
                SELECT salon_id FROM profiles WHERE id = auth.uid()
                UNION
                -- User is a team member in this salon
                SELECT salon_id FROM team WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- RLS Policy: Users can update their own settings
CREATE POLICY "Users can update hoursettings" ON public.hoursettings
    FOR UPDATE USING (
        -- User can only update their own settings
        user_id = auth.uid()
    )
    WITH CHECK (
        -- After update, still must be their own settings
        user_id = auth.uid()
        AND
        -- If salon_id is provided, user must be associated with that salon
        (
            salon_id IS NULL 
            OR 
            salon_id IN (
                -- User is a manager with this salon_id
                SELECT salon_id FROM profiles WHERE id = auth.uid()
                UNION
                -- User is a team member in this salon
                SELECT salon_id FROM team WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- RLS Policy: Users can delete their own settings
CREATE POLICY "Users can delete hoursettings" ON public.hoursettings
    FOR DELETE USING (
        -- User can only delete their own settings
        user_id = auth.uid()
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hoursettings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at column
CREATE TRIGGER update_hoursettings_updated_at_trigger
    BEFORE UPDATE ON public.hoursettings
    FOR EACH ROW
    EXECUTE FUNCTION update_hoursettings_updated_at();

-- Function to automatically set salon_id based on user's association
CREATE OR REPLACE FUNCTION set_hoursettings_salon_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If salon_id is not provided, try to set it automatically
    IF NEW.salon_id IS NULL THEN
        -- First check if user is a manager (has profile)
        SELECT salon_id INTO NEW.salon_id 
        FROM profiles 
        WHERE id = NEW.user_id;
        
        -- If not found in profiles, check if user is a team member
        IF NEW.salon_id IS NULL THEN
            SELECT salon_id INTO NEW.salon_id 
            FROM team 
            WHERE user_id = NEW.user_id 
            AND is_active = true 
            LIMIT 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically set salon_id
CREATE TRIGGER set_hoursettings_salon_id_trigger
    BEFORE INSERT ON public.hoursettings
    FOR EACH ROW
    EXECUTE FUNCTION set_hoursettings_salon_id();

-- Add table and column comments for documentation
COMMENT ON TABLE public.hoursettings IS 'User-specific hour settings and display preferences for calendar views';
COMMENT ON COLUMN public.hoursettings.user_id IS 'Reference to the user (auth.users.id)';
COMMENT ON COLUMN public.hoursettings.start_hour IS 'Start hour for calendar display (e.g., "08:00")';
COMMENT ON COLUMN public.hoursettings.finish_hour IS 'End hour for calendar display (e.g., "20:00")';
COMMENT ON COLUMN public.hoursettings.formato IS 'Time format preference (e.g., "24h", "12h")';
COMMENT ON COLUMN public.hoursettings.salon_id IS 'Reference to the salon (profiles.salon_id) - automatically set based on user association';
COMMENT ON COLUMN public.hoursettings.hide_outside_hours IS 'Whether to hide time slots outside working hours';
COMMENT ON COLUMN public.hoursettings."SizeCard" IS 'Card size preference for calendar display (normal, small, large)';
COMMENT ON COLUMN public.hoursettings."CardAlignment" IS 'Card alignment preference (center, left, right)';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hoursettings TO authenticated;
GRANT USAGE ON SEQUENCE users_per_page_id_seq TO authenticated;

-- Example usage and testing queries (commented out for safety)
/*
-- Test creating a setting record
INSERT INTO hoursettings (user_id, start_hour, finish_hour, formato) 
VALUES (auth.uid(), '08:00', '20:00', '24h');

-- Test viewing settings
SELECT * FROM hoursettings WHERE user_id = auth.uid();

-- Test updating settings
UPDATE hoursettings 
SET hide_outside_hours = true, "SizeCard" = 'large' 
WHERE user_id = auth.uid();
*/
