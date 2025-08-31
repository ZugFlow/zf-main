-- Script per aggiungere i campi SSL/TLS alla tabella email_settings esistente
-- Esegui questo script se la tabella email_settings esiste già ma non ha i campi SSL/TLS

-- Aggiungi i campi SSL/TLS se non esistono
DO $$ 
BEGIN
    -- Aggiungi campo secure se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' 
        AND column_name = 'secure'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN secure BOOLEAN DEFAULT false;
    END IF;

    -- Aggiungi campo require_tls se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' 
        AND column_name = 'require_tls'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN require_tls BOOLEAN DEFAULT true;
    END IF;

    RAISE NOTICE 'Campi SSL/TLS aggiunti con successo alla tabella email_settings';
END $$;

-- Aggiorna i record esistenti per impostare i valori di default appropriati
UPDATE email_settings 
SET 
    secure = false,
    require_tls = true
WHERE secure IS NULL OR require_tls IS NULL;

-- Verifica che i campi siano stati aggiunti correttamente
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_settings' 
AND column_name IN ('secure', 'require_tls')
ORDER BY column_name; 