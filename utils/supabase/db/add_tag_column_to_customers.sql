-- Aggiunge la colonna tag alla tabella customers
-- Questa colonna conterrà un array JSON di tag per ogni cliente

-- Verifica se la colonna tag esiste già
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'tag'
    ) THEN
        -- Aggiungi la colonna tag come JSONB per supportare array di oggetti
        ALTER TABLE customers 
        ADD COLUMN tag JSONB DEFAULT '[]'::jsonb;
        
        -- Aggiungi un commento alla colonna
        COMMENT ON COLUMN customers.tag IS 'Array JSON di tag associati al cliente';
        
        RAISE NOTICE 'Colonna tag aggiunta alla tabella customers';
    ELSE
        RAISE NOTICE 'Colonna tag già esistente nella tabella customers';
    END IF;
END $$;

-- Verifica che la colonna sia stata aggiunta correttamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name = 'tag'; 