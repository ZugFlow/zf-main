-- Migrazione per aggiungere il supporto multilingua
-- Estende il sistema custom_texts esistente per supportare italiano e inglese

-- 1. Aggiungere campo language alla tabella custom_texts
ALTER TABLE custom_texts ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'it';

-- 2. Aggiornare constraint UNIQUE per includere language
-- Prima rimuoviamo il constraint esistente
ALTER TABLE custom_texts DROP CONSTRAINT IF EXISTS custom_texts_salon_id_text_key_key;

-- Poi aggiungiamo il nuovo constraint che include language
ALTER TABLE custom_texts ADD CONSTRAINT custom_texts_salon_id_text_key_language_key 
  UNIQUE(salon_id, text_key, language);

-- 3. Creare indice per performance su language
CREATE INDEX IF NOT EXISTS idx_custom_texts_language ON custom_texts(language);

-- 4. Migrare i testi esistenti (tutti in italiano)
UPDATE custom_texts SET language = 'it' WHERE language IS NULL;

-- 5. Inserire le versioni inglesi dei testi principali
-- Prenotazioni Online - Status
INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_status_pending',
  'Pending',
  'Text for "pending" status of online bookings',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_pending'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_status_confirmed',
  'Confirmed',
  'Text for "confirmed" status of online bookings',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_confirmed'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_status_cancelled',
  'Cancelled',
  'Text for "cancelled" status of online bookings',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_cancelled'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_status_completed',
  'Completed',
  'Text for "completed" status of online bookings',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_completed'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_status_converted',
  'Converted',
  'Text for "converted" status of online bookings',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_converted'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

-- Messaggi di successo
INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_confirmation_success',
  'Booking confirmed successfully! Confirmation email sent to customer.',
  'Success message when a booking is confirmed',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_confirmation_success'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_cancellation_success',
  'Booking cancelled successfully.',
  'Success message when a booking is cancelled',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_cancellation_success'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

-- Messaggi di errore
INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'email_send_error',
  'Error sending email. Please check email settings.',
  'Error message when email sending fails',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'email_send_error'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_validation_error',
  'Invalid booking data. Please check all required fields.',
  'Error message when booking data is not valid',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_validation_error'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

-- Team Members
INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_team_not_assigned',
  'Not assigned',
  'Text when a team member is not assigned',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_team_not_assigned'
      AND ct.language = 'en'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
SELECT 
  p.salon_id,
  'booking_team_member_not_found',
  'Member not found',
  'Text when a team member is not found',
  'en'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_team_member_not_found'
      AND ct.language = 'en'
      AND ct.is_active = true
  );
