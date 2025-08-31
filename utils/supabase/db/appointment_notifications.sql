-- Tabella per le configurazioni delle notifiche degli appuntamenti
CREATE TABLE IF NOT EXISTS appointment_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES profiles(salon_id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL CHECK (method IN ('email', 'sms')), -- 'email' o 'sms'
  template_type VARCHAR(50) NOT NULL, -- 'confirmation', 'reminder', 'cancellation', 'modification', 'welcome'
  time_minutes INTEGER NOT NULL, -- Minuti prima dell'appuntamento (es: 60 = 1 ora prima)
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Assicura che ogni salone abbia una sola configurazione per metodo + template_type + time_minutes
  UNIQUE(salon_id, method, template_type, time_minutes)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_appointment_notifications_salon_id ON appointment_notifications(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notifications_method ON appointment_notifications(method);
CREATE INDEX IF NOT EXISTS idx_appointment_notifications_template_type ON appointment_notifications(template_type);
CREATE INDEX IF NOT EXISTS idx_appointment_notifications_enabled ON appointment_notifications(enabled);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_appointment_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointment_notifications_updated_at 
  BEFORE UPDATE ON appointment_notifications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_appointment_notifications_updated_at();

-- Inserimento configurazioni di default per ogni salone
-- Conferma prenotazione - Email (1 ora prima)
INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'confirmation',
  60,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

-- Promemoria - Email (24 ore prima)
INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'reminder',
  1440,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

-- Promemoria - SMS (1 ora prima)
INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'sms',
  'reminder',
  60,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

-- Promemoria - SMS (30 minuti prima)
INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'sms',
  'reminder',
  30,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

-- Cancellazione - Email (immediata)
INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'cancellation',
  0,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

-- Modifica - Email (immediata)
INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'modification',
  0,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

-- Benvenuto - Email (immediata)
INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'welcome',
  0,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

-- Funzione per ottenere le notifiche attive di un salone
CREATE OR REPLACE FUNCTION get_active_appointment_notifications(salon_uuid UUID)
RETURNS TABLE (
  id UUID,
  method VARCHAR(20),
  template_type VARCHAR(50),
  time_minutes INTEGER,
  enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    an.id,
    an.method,
    an.template_type,
    an.time_minutes,
    an.enabled
  FROM appointment_notifications an
  WHERE an.salon_id = salon_uuid
    AND an.enabled = true
  ORDER BY an.method, an.template_type, an.time_minutes;
END;
$$ LANGUAGE plpgsql;

-- Funzione per inserire o aggiornare una configurazione di notifica
CREATE OR REPLACE FUNCTION upsert_appointment_notification(
  p_salon_id UUID,
  p_method VARCHAR(20),
  p_template_type VARCHAR(50),
  p_time_minutes INTEGER,
  p_enabled BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO appointment_notifications (
    salon_id, 
    method, 
    template_type, 
    time_minutes, 
    enabled
  ) VALUES (
    p_salon_id,
    p_method,
    p_template_type,
    p_time_minutes,
    p_enabled
  )
  ON CONFLICT (salon_id, method, template_type, time_minutes)
  DO UPDATE SET
    enabled = EXCLUDED.enabled,
    updated_at = NOW()
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Funzione per eliminare una configurazione di notifica
CREATE OR REPLACE FUNCTION delete_appointment_notification(
  p_salon_id UUID,
  p_method VARCHAR(20),
  p_template_type VARCHAR(50),
  p_time_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM appointment_notifications
  WHERE salon_id = p_salon_id
    AND method = p_method
    AND template_type = p_template_type
    AND time_minutes = p_time_minutes;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Vista per le notifiche con informazioni dettagliate
CREATE OR REPLACE VIEW appointment_notifications_view AS
SELECT 
  an.id,
  an.salon_id,
  an.method,
  an.template_type,
  an.time_minutes,
  an.enabled,
  an.created_at,
  an.updated_at,
  CASE 
    WHEN an.time_minutes = 0 THEN 'Immediata'
    WHEN an.time_minutes = 5 THEN '5 minuti prima'
    WHEN an.time_minutes = 15 THEN '15 minuti prima'
    WHEN an.time_minutes = 30 THEN '30 minuti prima'
    WHEN an.time_minutes = 60 THEN '1 ora prima'
    WHEN an.time_minutes = 1440 THEN '24 ore prima'
    WHEN an.time_minutes = 2880 THEN '2 giorni prima'
    WHEN an.time_minutes = 4320 THEN '3 giorni prima'
    WHEN an.time_minutes = 5760 THEN '4 giorni prima'
    WHEN an.time_minutes = 10080 THEN '1 settimana prima'
    ELSE an.time_minutes || ' minuti prima'
  END as time_description,
  CASE 
    WHEN an.method = 'email' THEN 'Email'
    WHEN an.method = 'sms' THEN 'SMS'
    ELSE an.method
  END as method_display_name,
  CASE 
    WHEN an.template_type = 'confirmation' THEN 'Conferma Prenotazione'
    WHEN an.template_type = 'reminder' THEN 'Promemoria'
    WHEN an.template_type = 'cancellation' THEN 'Cancellazione'
    WHEN an.template_type = 'modification' THEN 'Modifica'
    WHEN an.template_type = 'welcome' THEN 'Benvenuto'
    ELSE an.template_type
  END as template_type_display_name
FROM appointment_notifications an;

-- Indici aggiuntivi per la vista
CREATE INDEX IF NOT EXISTS idx_appointment_notifications_view_salon_enabled 
ON appointment_notifications(salon_id, enabled) 
WHERE enabled = true;

-- Funzione per ottenere le notifiche per un appuntamento specifico
CREATE OR REPLACE FUNCTION get_notifications_for_appointment(
  p_salon_id UUID,
  p_appointment_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  id UUID,
  method VARCHAR(20),
  template_type VARCHAR(50),
  time_minutes INTEGER,
  notification_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    an.id,
    an.method,
    an.template_type,
    an.time_minutes,
    p_appointment_date - INTERVAL '1 minute' * an.time_minutes as notification_time
  FROM appointment_notifications an
  WHERE an.salon_id = p_salon_id
    AND an.enabled = true
    AND an.time_minutes > 0 -- Esclude notifiche immediate
  ORDER BY an.time_minutes DESC;
END;
$$ LANGUAGE plpgsql; 