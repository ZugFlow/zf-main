-- Aggiunge la colonna hide_outside_hours alla tabella team
-- Questa colonna controlla se nascondere gli orari fuori dall'orario di lavoro

-- Verifica se la colonna esiste già
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team' 
        AND column_name = 'hide_outside_hours'
    ) THEN
        -- Aggiungi colonna hide_outside_hours
        ALTER TABLE public.team 
        ADD COLUMN "hide_outside_hours" BOOLEAN DEFAULT false;
        
        -- Imposta il valore di default per i record esistenti
        UPDATE public.team 
        SET "hide_outside_hours" = false
        WHERE "hide_outside_hours" IS NULL;
        
        -- Aggiungi commento alla colonna
        COMMENT ON COLUMN public.team."hide_outside_hours" IS 'Controlla se nascondere gli orari fuori dall''orario di lavoro nel calendario: true = nascondi, false = mostra';
        
        RAISE NOTICE 'Colonna hide_outside_hours aggiunta con successo alla tabella team';
    ELSE
        RAISE NOTICE 'Colonna hide_outside_hours già esistente nella tabella team';
    END IF;
END $$;
