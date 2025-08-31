-- Migrazione per aggiungere i testi degli status delle prenotazioni online
-- Questo script aggiunge i nuovi testi personalizzabili per gli status delle prenotazioni
-- Relazione: custom_texts.salon_id -> profiles.salon_id (ogni salone ha un ID univoco)

-- Testi per gli status delle prenotazioni online
INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_pending',
  'In attesa',
  'Testo per lo status "pending" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_pending'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_confirmed',
  'Confermato',
  'Testo per lo status "confirmed" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_confirmed'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_cancelled',
  'Annullato',
  'Testo per lo status "cancelled" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_cancelled'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_completed',
  'Completato',
  'Testo per lo status "completed" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_completed'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_converted',
  'Convertito',
  'Testo per lo status "converted" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_status_converted'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_team_not_assigned',
  'Non assegnato',
  'Testo quando un membro del team non è assegnato'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_team_member_not_found',
  'Membro non trovato',
  'Testo quando un membro del team non viene trovato'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING; 