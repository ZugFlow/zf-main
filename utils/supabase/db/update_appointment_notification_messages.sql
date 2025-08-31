-- Script per aggiornare la tabella appointment_notification_settings
-- Aggiunge i campi per i messaggi personalizzati

-- Aggiungi le nuove colonne se non esistono
DO $$ 
BEGIN
    -- Aggiungi colonna email_subject
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointment_notification_settings' 
                   AND column_name = 'email_subject') THEN
        ALTER TABLE appointment_notification_settings 
        ADD COLUMN email_subject text NOT NULL DEFAULT 'Promemoria Appuntamento';
    END IF;

    -- Aggiungi colonna email_message
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointment_notification_settings' 
                   AND column_name = 'email_message') THEN
        ALTER TABLE appointment_notification_settings 
        ADD COLUMN email_message text NOT NULL DEFAULT 'Ciao [Nome Cliente],

Ti ricordiamo il tuo appuntamento presso il nostro salone.

Data: [Data Appuntamento]
Orario: [Orario Appuntamento]
Servizio: [Servizio Prenotato]

Ti aspettiamo!

Cordiali saluti,
Il Team del Salone';
    END IF;

    -- Aggiungi colonna sms_message
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointment_notification_settings' 
                   AND column_name = 'sms_message') THEN
        ALTER TABLE appointment_notification_settings 
        ADD COLUMN sms_message text NOT NULL DEFAULT 'Ciao [Nome Cliente], ti ricordiamo il tuo appuntamento per [Servizio] il [Data] alle [Orario]. Ti aspettiamo!';
    END IF;
END $$;

-- Aggiorna i record esistenti con i valori di default se le colonne sono NULL
UPDATE appointment_notification_settings 
SET 
    email_subject = COALESCE(email_subject, 'Promemoria Appuntamento'),
    email_message = COALESCE(email_message, 'Ciao [Nome Cliente],

Ti ricordiamo il tuo appuntamento presso il nostro salone.

Data: [Data Appuntamento]
Orario: [Orario Appuntamento]
Servizio: [Servizio Prenotato]

Ti aspettiamo!

Cordiali saluti,
Il Team del Salone'),
    sms_message = COALESCE(sms_message, 'Ciao [Nome Cliente], ti ricordiamo il tuo appuntamento per [Servizio] il [Data] alle [Orario]. Ti aspettiamo!')
WHERE email_subject IS NULL OR email_message IS NULL OR sms_message IS NULL;

-- Verifica l'aggiornamento
SELECT 'Tabella appointment_notification_settings aggiornata con successo!' as status;
SELECT COUNT(*) as total_settings FROM appointment_notification_settings; 