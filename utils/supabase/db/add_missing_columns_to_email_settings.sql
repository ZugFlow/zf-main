-- Script per aggiungere le colonne mancanti secure e require_tls alla tabella email_settings
-- Questo script risolve l'errore di salvataggio delle impostazioni email

-- Aggiungi le colonne mancanti se non esistono
DO $$ 
BEGIN
    -- Aggiungi campo secure se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' 
        AND column_name = 'secure'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN secure BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonna secure aggiunta con successo alla tabella email_settings';
    ELSE
        RAISE NOTICE 'Colonna secure già esistente nella tabella email_settings';
    END IF;

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

-- Aggiorna i record esistenti per impostare i valori di default appropriati
UPDATE email_settings 
SET 
    secure = COALESCE(secure, false),
    require_tls = COALESCE(require_tls, true)
WHERE secure IS NULL OR require_tls IS NULL;

-- Verifica che le colonne siano state aggiunte correttamente
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_settings' 
AND column_name IN ('secure', 'require_tls')
ORDER BY column_name;

-- Mostra la struttura completa della tabella
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_settings' 
ORDER BY ordinal_position; 