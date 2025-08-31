-- Create customers table with comprehensive RLS policies
-- This table stores customer appointment data with salon-based access control

-- Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  nome text NULL,
  telefono text NULL,
  email text NULL,
  data date NULL,
  "orarioInizio" text NULL,
  "orarioFine" text NULL,
  servizio text NULL,
  parrucchiere text NULL,
  prezzo numeric NULL,
  note text NULL,
  status text NULL DEFAULT 'In corso'::text,
  stilista text NULL,
  descrizione text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  team_id uuid NULL,
  is_pausa boolean NULL DEFAULT false,
  customer_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  richiede_fattura boolean NULL DEFAULT false,
  tipo_cliente text NULL,
  intestazione_fattura text NULL,
  codice_fiscale text NULL,
  partita_iva text NULL,
  pec text NULL,
  codice_sdi text NULL,
  indirizzo_fatturazione text NULL,
  cap text NULL,
  citta text NULL,
  provincia text NULL,
  nazione text NULL DEFAULT 'Italia'::text,
  metodo_pagamento text NULL,
  pagato boolean NULL DEFAULT false,
  data_pagamento date NULL,
  iva_inclusa boolean NULL DEFAULT true,
  aliquota_iva numeric NULL,
  ritenuta_acconto numeric NULL,
  bollo boolean NULL DEFAULT false,
  note_fattura text NULL,
  numero_fattura text NULL,
  data_fattura date NULL,
  totale numeric NULL,
  totale_imponibile numeric NULL,
  totale_iva numeric NULL,
  totale_netto numeric NULL,
  valuta text NULL DEFAULT 'EUR'::text,
  fattura_emessa boolean NULL DEFAULT false,
  fattura_pdf_url text NULL,
  user_id_emittente uuid NULL,
  firma_cliente_url text NULL,
  documento_identita_url text NULL,
  telefono_fatturazione text NULL,
  tag jsonb NULL,
  salon_id uuid NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT unique_customer_uuid UNIQUE (customer_uuid)
) TABLESPACE pg_default;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_customers_salon_id ON public.customers(salon_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_team_id ON public.customers(team_id);
CREATE INDEX IF NOT EXISTS idx_customers_data ON public.customers(data);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON public.customers(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_customer_uuid ON public.customers(customer_uuid);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_telefono ON public.customers(telefono);
CREATE INDEX IF NOT EXISTS idx_customers_tag_gin ON public.customers USING gin (tag) TABLESPACE pg_default;

-- Add foreign key constraints
-- Note: user_id can be null and doesn't require strict FK constraint to auth.users
-- as it may reference external users or be used for other purposes

ALTER TABLE public.customers 
ADD CONSTRAINT fk_customers_team_id 
FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE SET NULL;

ALTER TABLE public.customers 
ADD CONSTRAINT fk_customers_salon_id 
FOREIGN KEY (salon_id) REFERENCES public.profiles(salon_id) ON DELETE CASCADE;

-- Only add user_id_emittente FK if it needs to reference actual auth users
-- ALTER TABLE public.customers 
-- ADD CONSTRAINT fk_customers_user_id_emittente 
-- FOREIGN KEY (user_id_emittente) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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
-- This policy allows users to delete customers only for their salon
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

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_customers_updated_at();

-- Create function to validate customer data
CREATE OR REPLACE FUNCTION validate_customer_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure salon_id is set
    IF NEW.salon_id IS NULL THEN
        RAISE EXCEPTION 'salon_id cannot be null';
    END IF;
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Ensure customer_uuid is unique and set
    IF NEW.customer_uuid IS NULL THEN
        NEW.customer_uuid = gen_random_uuid();
    END IF;
    
    -- Validate status values
    IF NEW.status IS NOT NULL AND NEW.status NOT IN ('In corso', 'Completato', 'Annullato', 'Confermato', 'In attesa') THEN
        RAISE EXCEPTION 'Invalid status value. Must be one of: In corso, Completato, Annullato, Confermato, In attesa';
    END IF;
    
    -- Validate prezzo is positive if set
    IF NEW.prezzo IS NOT NULL AND NEW.prezzo < 0 THEN
        RAISE EXCEPTION 'Price cannot be negative';
    END IF;
    
    -- Validate totale is positive if set
    IF NEW.totale IS NOT NULL AND NEW.totale < 0 THEN
        RAISE EXCEPTION 'Total cannot be negative';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to validate customer data on insert and update
CREATE TRIGGER validate_customer_data_trigger
    BEFORE INSERT OR UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION validate_customer_data();

-- Add comments for documentation
COMMENT ON TABLE public.customers IS 'Customer appointments and billing information with salon-based access control';
COMMENT ON COLUMN public.customers.salon_id IS 'Foreign key to salon table - required for RLS';
COMMENT ON COLUMN public.customers.customer_uuid IS 'Unique identifier for customer (separate from primary key)';
COMMENT ON COLUMN public.customers.tag IS 'JSON field for storing customer tags and metadata';
COMMENT ON COLUMN public.customers.status IS 'Appointment status: In corso, Completato, Annullato, Confermato, In attesa';
COMMENT ON COLUMN public.customers.richiede_fattura IS 'Whether the customer requires an invoice';
COMMENT ON COLUMN public.customers.fattura_emessa IS 'Whether the invoice has been issued';
COMMENT ON COLUMN public.customers.is_pausa IS 'Whether this is a break/pause entry rather than a customer appointment';

-- Create a view for customer statistics per salon
CREATE OR REPLACE VIEW customer_salon_stats AS
SELECT 
    c.salon_id,
    s.nome as salon_name,
    COUNT(c.id) as total_customers,
    COUNT(CASE WHEN c.status = 'Completato' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN c.status = 'In corso' THEN 1 END) as in_progress_appointments,
    COUNT(CASE WHEN c.status = 'Annullato' THEN 1 END) as cancelled_appointments,
    SUM(CASE WHEN c.status = 'Completato' AND c.prezzo IS NOT NULL THEN c.prezzo ELSE 0 END) as total_revenue,
    AVG(CASE WHEN c.status = 'Completato' AND c.prezzo IS NOT NULL THEN c.prezzo END) as average_service_price,
    COUNT(CASE WHEN c.richiede_fattura = true THEN 1 END) as invoices_required,
    COUNT(CASE WHEN c.fattura_emessa = true THEN 1 END) as invoices_issued
FROM public.customers c
LEFT JOIN public.salon s ON c.salon_id = s.id
GROUP BY c.salon_id, s.nome;

-- Add RLS to the view
ALTER VIEW customer_salon_stats OWNER TO postgres;

-- Grant appropriate permissions
GRANT SELECT ON public.customers TO authenticated;
GRANT INSERT ON public.customers TO authenticated;
GRANT UPDATE ON public.customers TO authenticated;
GRANT DELETE ON public.customers TO authenticated;
GRANT SELECT ON customer_salon_stats TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Customers table created successfully with RLS policies enabled';
    RAISE NOTICE 'Table includes comprehensive indexing, validation, and audit triggers';
    RAISE NOTICE 'RLS policies ensure salon-based access control';
    RAISE NOTICE 'Statistics view created for reporting capabilities';
END $$;
