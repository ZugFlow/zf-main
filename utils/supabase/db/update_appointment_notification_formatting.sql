-- Script per aggiornare la tabella appointment_notification_settings
-- Aggiunge i campi per la formattazione dei messaggi

-- Aggiungi le nuove colonne se non esistono
DO $$ 
BEGIN
    -- Aggiungi colonna email_formatting_enabled
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointment_notification_settings' 
                   AND column_name = 'email_formatting_enabled') THEN
        ALTER TABLE appointment_notification_settings 
        ADD COLUMN email_formatting_enabled boolean NOT NULL DEFAULT true;
    END IF;

    -- Aggiungi colonna sms_formatting_enabled
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointment_notification_settings' 
                   AND column_name = 'sms_formatting_enabled') THEN
        ALTER TABLE appointment_notification_settings 
        ADD COLUMN sms_formatting_enabled boolean NOT NULL DEFAULT false;
    END IF;

    -- Aggiungi colonna markdown_enabled
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointment_notification_settings' 
                   AND column_name = 'markdown_enabled') THEN
        ALTER TABLE appointment_notification_settings 
        ADD COLUMN markdown_enabled boolean NOT NULL DEFAULT true;
    END IF;
END $$;

-- Aggiorna i record esistenti con i valori di default
UPDATE appointment_notification_settings 
SET 
    email_formatting_enabled = COALESCE(email_formatting_enabled, true),
    sms_formatting_enabled = COALESCE(sms_formatting_enabled, false),
    markdown_enabled = COALESCE(markdown_enabled, true)
WHERE email_formatting_enabled IS NULL OR sms_formatting_enabled IS NULL OR markdown_enabled IS NULL;

-- Verifica l'aggiornamento
SELECT 'Tabella appointment_notification_settings aggiornata con successo!' as status;
SELECT COUNT(*) as total_settings FROM appointment_notification_settings; 