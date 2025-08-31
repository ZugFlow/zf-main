-- Script per aggiornare la tabella appointment_notification_settings
-- Aggiunge i campi per email e SMS

-- Aggiungi le nuove colonne se non esistono
DO $$ 
BEGIN
    -- Aggiungi colonna email_enabled
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointment_notification_settings' 
                   AND column_name = 'email_enabled') THEN
        ALTER TABLE appointment_notification_settings 
        ADD COLUMN email_enabled boolean NOT NULL DEFAULT true;
    END IF;

    -- Aggiungi colonna sms_enabled
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointment_notification_settings' 
                   AND column_name = 'sms_enabled') THEN
        ALTER TABLE appointment_notification_settings 
        ADD COLUMN sms_enabled boolean NOT NULL DEFAULT false;
    END IF;
END $$;

-- Aggiorna i record esistenti con i valori di default
UPDATE appointment_notification_settings 
SET 
    email_enabled = COALESCE(email_enabled, true),
    sms_enabled = COALESCE(sms_enabled, false)
WHERE email_enabled IS NULL OR sms_enabled IS NULL;

-- Verifica l'aggiornamento
SELECT 'Tabella appointment_notification_settings aggiornata con successo!' as status;
SELECT COUNT(*) as total_settings FROM appointment_notification_settings; 