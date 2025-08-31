-- Tabella per i testi personalizzabili degli alert e notifiche
CREATE TABLE IF NOT EXISTS custom_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salon(id) ON DELETE CASCADE,
  text_key VARCHAR(100) NOT NULL, -- 'booking_confirmation_success', 'booking_cancellation_success', etc.
  text_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Assicura che ogni salone abbia un solo testo attivo per chiave
  UNIQUE(salon_id, text_key)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_custom_texts_salon_id ON custom_texts(salon_id);
CREATE INDEX IF NOT EXISTS idx_custom_texts_key ON custom_texts(text_key);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_custom_texts_updated_at 
  BEFORE UPDATE ON custom_texts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per disattivare testi vecchi quando se ne inserisce uno nuovo
CREATE OR REPLACE FUNCTION deactivate_old_custom_texts()
RETURNS TRIGGER AS $$
BEGIN
  -- Disattiva tutti i testi esistenti per la stessa chiave e salone
  UPDATE custom_texts 
  SET is_active = false 
  WHERE salon_id = NEW.salon_id 
    AND text_key = NEW.text_key 
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deactivate_old_custom_texts
  BEFORE INSERT OR UPDATE ON custom_texts
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_old_custom_texts();

-- Inserimento testi di default per le prenotazioni online
INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_confirmation_success',
  'Prenotazione confermata con successo! Email di conferma inviata al cliente.',
  'Messaggio di successo quando una prenotazione viene confermata'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_texts ct 
    WHERE ct.salon_id = p.salon_id 
      AND ct.text_key = 'booking_confirmation_success'
      AND ct.is_active = true
  );

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_cancellation_success',
  'Prenotazione annullata con successo! Email di cancellazione inviata al cliente.',
  'Messaggio di successo quando una prenotazione viene annullata'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_modification_success',
  'Prenotazione modificata con successo! Email di notifica inviata al cliente.',
  'Messaggio di successo quando una prenotazione viene modificata'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_conversion_success',
  'Prenotazione convertita in appuntamento! Email di conferma inviata al cliente.',
  'Messaggio di successo quando una prenotazione viene convertita in appuntamento'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_archive_success',
  'Prenotazione archiviata con successo.',
  'Messaggio di successo quando una prenotazione viene archiviata'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_restore_success',
  'Prenotazione ripristinata con successo.',
  'Messaggio di successo quando una prenotazione viene ripristinata'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'email_send_error',
  'Errore nell\'invio dell\'email. Verifica le impostazioni email.',
  'Messaggio di errore quando l\'invio email fallisce'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_validation_error',
  'Dati prenotazione non validi. Verifica tutti i campi obbligatori.',
  'Messaggio di errore quando i dati della prenotazione non sono validi'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_time_conflict',
  'Orario non disponibile. Seleziona un altro orario.',
  'Messaggio di errore quando c\'è un conflitto di orari'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_team_member_required',
  'Seleziona un membro del team per procedere.',
  'Messaggio di errore quando non è selezionato un membro del team'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_service_required',
  'Seleziona un servizio per procedere.',
  'Messaggio di errore quando non è selezionato un servizio'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_date_required',
  'Seleziona una data per procedere.',
  'Messaggio di errore quando non è selezionata una data'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_time_required',
  'Seleziona un orario per procedere.',
  'Messaggio di errore quando non è selezionato un orario'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_customer_name_required',
  'Nome cliente obbligatorio.',
  'Messaggio di errore quando il nome del cliente è mancante'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_phone_required',
  'Telefono cliente obbligatorio.',
  'Messaggio di errore quando il telefono del cliente è mancante'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_email_invalid',
  'Email non valida. Inserisci un\'email corretta.',
  'Messaggio di errore quando l\'email non è valida'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_phone_invalid',
  'Telefono non valido. Inserisci un numero di telefono corretto.',
  'Messaggio di errore quando il telefono non è valido'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_past_date',
  'Non è possibile prenotare per una data passata.',
  'Messaggio di errore quando si tenta di prenotare per una data passata'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_outside_hours',
  'Orario fuori dagli orari di apertura del salone.',
  'Messaggio di errore quando si tenta di prenotare fuori dagli orari'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_team_unavailable',
  'Membro del team non disponibile per questo orario.',
  'Messaggio di errore quando il membro del team non è disponibile'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_service_unavailable',
  'Servizio non disponibile per questo orario.',
  'Messaggio di errore quando il servizio non è disponibile'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_duplicate',
  'Prenotazione duplicata rilevata. Verifica i dati inseriti.',
  'Messaggio di errore quando viene rilevata una prenotazione duplicata'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_system_error',
  'Errore del sistema. Riprova più tardi.',
  'Messaggio di errore generico del sistema'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

-- Testi per gli status delle prenotazioni online
INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_pending',
  'In attesa',
  'Testo per lo status "pending" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_confirmed',
  'Confermato',
  'Testo per lo status "confirmed" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_cancelled',
  'Annullato',
  'Testo per lo status "cancelled" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_completed',
  'Completato',
  'Testo per lo status "completed" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

INSERT INTO custom_texts (salon_id, text_key, text_value, description) 
SELECT 
  p.salon_id,
  'booking_status_converted',
  'Convertito',
  'Testo per lo status "converted" delle prenotazioni online'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, text_key, is_active) DO NOTHING;

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