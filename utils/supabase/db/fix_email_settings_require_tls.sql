-- Script per aggiungere la colonna require_tls alla tabella email_settings se non esiste
-- Questo script risolve l'errore PGRST204 "Could not find the 'require_tls' column"

DO $$ 
BEGIN
    -- Aggiungi campo require_tls se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' 
        AND column_name = 'require_tls'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN require_tls BOOLEAN DEFAULT true;
        RAISE NOTICE 'Colonna require_tls aggiunta con successo alla tabella email_settings';
    ELSE
        RAISE NOTICE 'Colonna require_tls già esistente nella tabella email_settings';
    END IF;
END $$;

-- Verifica che la colonna sia stata aggiunta correttamente
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_settings' 
AND column_name = 'require_tls'; 