-- Aggiunge la colonna hide_outside_hours alla tabella hoursettings
-- Questa colonna controlla se nascondere gli orari fuori dall'orario di lavoro

-- Verifica se la colonna esiste già
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hoursettings' 
        AND column_name = 'hide_outside_hours'
    ) THEN
        -- Aggiungi colonna hide_outside_hours
        ALTER TABLE public.hoursettings 
        ADD COLUMN "hide_outside_hours" BOOLEAN DEFAULT false;
        
        -- Imposta il valore di default per i record esistenti
        UPDATE public.hoursettings 
        SET "hide_outside_hours" = false
        WHERE "hide_outside_hours" IS NULL;
        
        -- Aggiungi commento alla colonna
        COMMENT ON COLUMN public.hoursettings."hide_outside_hours" IS 'Controlla se nascondere gli orari fuori dall''orario di lavoro nel calendario: true = nascondi, false = mostra';
        
        RAISE NOTICE 'Colonna hide_outside_hours aggiunta con successo alla tabella hoursettings';
    ELSE
        RAISE NOTICE 'Colonna hide_outside_hours già esistente nella tabella hoursettings';
    END IF;
END $$; 