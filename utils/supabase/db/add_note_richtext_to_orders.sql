-- Add note_richtext column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'note_richtext'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN note_richtext text;
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN public.orders.note_richtext IS 'Rich text content for notes with formatting (HTML)'; 