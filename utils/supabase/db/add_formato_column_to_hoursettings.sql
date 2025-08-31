-- Aggiunge la colonna formato alla tabella hoursettings per salvare il formato orario preferito dall'utente
-- Questa colonna permette a ogni utente di scegliere tra formato 12h (AM/PM) e 24h

-- Verifica se la colonna esiste già
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hoursettings' 
        AND column_name = 'formato'
    ) THEN
        -- Aggiungi colonna formato
        ALTER TABLE public.hoursettings
        ADD COLUMN "formato" TEXT DEFAULT '24';
        
        -- Aggiorna i record esistenti con il valore di default
        UPDATE public.hoursettings
        SET "formato" = '24'
        WHERE "formato" IS NULL;
        
        -- Aggiungi commento alla colonna
        COMMENT ON COLUMN public.hoursettings."formato" IS 'Formato orario preferito dall''utente: 12 per formato 12h (AM/PM), 24 per formato 24h';
        
        RAISE NOTICE 'Colonna formato aggiunta con successo alla tabella hoursettings';
    ELSE
        RAISE NOTICE 'Colonna formato già esistente nella tabella hoursettings';
    END IF;
END $$; 