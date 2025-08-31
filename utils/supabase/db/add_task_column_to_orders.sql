-- Add task column to orders table
ALTER TABLE public.orders 
ADD COLUMN task boolean DEFAULT false;

-- Create index for better performance when filtering tasks
CREATE INDEX IF NOT EXISTS idx_orders_task ON public.orders USING btree (task) TABLESPACE pg_default;

-- Create index for salon_id and task combination for better performance
CREATE INDEX IF NOT EXISTS idx_orders_salon_task ON public.orders USING btree (salon_id, task) TABLESPACE pg_default; 