-- Modifica la colonna tag da text a jsonb per supportare array di oggetti
-- Prima rimuoviamo eventuali dati esistenti che potrebbero causare problemi
UPDATE public.customers SET tag = NULL WHERE tag IS NOT NULL;

-- Modifica la colonna da text a jsonb
ALTER TABLE public.customers 
ALTER COLUMN tag TYPE jsonb USING tag::jsonb;

-- Aggiungi un commento per documentare la struttura
COMMENT ON COLUMN public.customers.tag IS 'Array di oggetti tag del cliente con struttura: {id: string, name: string, category: string, color: string}';

-- Aggiungi un indice GIN per migliorare le performance delle query JSON
CREATE INDEX IF NOT EXISTS idx_customers_tag_gin ON public.customers USING GIN (tag); 