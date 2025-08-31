-- =====================================================
-- SISTEMA PRENOTAZIONI ONLINE - APPROCCIO UNIFICATO
-- =====================================================
-- Questo script crea le tabelle e funzioni necessarie
-- per gestire le prenotazioni online dei clienti
-- utilizzando la tabella orders esistente e order_services
-- =====================================================

-- =====================================================
-- AGGIUNTA CAMPO ALLA TABELLA ORDERS (se non esiste)
-- =====================================================
-- Aggiungi il campo booking_source se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'booking_source'
    ) THEN
        ALTER TABLE orders ADD COLUMN booking_source TEXT DEFAULT 'manual' CHECK (booking_source IN ('manual', 'online', 'phone', 'walk_in'));
    END IF;
END $$;

-- =====================================================
-- Tabelle per il sistema di prenotazione online

-- Tabella per le impostazioni delle prenotazioni online
CREATE TABLE IF NOT EXISTS online_booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES profiles(salon_id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT true,
  auto_confirm BOOLEAN DEFAULT false,
  min_notice_hours INTEGER DEFAULT 2,
  max_days_ahead INTEGER DEFAULT 30,
  slot_duration INTEGER DEFAULT 15, -- durata slot in minuti
  booking_start_time TIME DEFAULT '08:00',
  booking_end_time TIME DEFAULT '20:00',
  allow_same_day_booking BOOLEAN DEFAULT true,
  max_bookings_per_day INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le prenotazioni online
CREATE TABLE IF NOT EXISTS online_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES profiles(salon_id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  booking_date DATE NOT NULL, -- alias per requested_date per compatibilità
  start_time TIME NOT NULL, -- alias per requested_time per compatibilità
  end_time TIME, -- calcolato automaticamente
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  service_name VARCHAR(255) NOT NULL,
  service_duration INTEGER NOT NULL, -- durata in minuti
  service_price DECIMAL(10,2) NOT NULL,
  team_member_id UUID REFERENCES team(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  notes TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per gli orari di lavoro settimanali
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES profiles(salon_id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, team_member_id, day_of_week)
);

-- Tabella per orari extra (orari speciali per date specifiche)
CREATE TABLE IF NOT EXISTS extra_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES profiles(salon_id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, team_member_id, date)
);

-- Tabella per i permessi/ferie (già esistente, ma aggiungiamo campi se necessari)
-- Assumiamo che la tabella permessiferie esista già con la struttura corretta

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_online_bookings_salon_date ON online_bookings(salon_id, requested_date);
CREATE INDEX IF NOT EXISTS idx_online_bookings_status ON online_bookings(status);
CREATE INDEX IF NOT EXISTS idx_working_hours_salon_member ON working_hours(salon_id, team_member_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_extra_schedules_salon_member ON extra_schedules(salon_id, team_member_id);
CREATE INDEX IF NOT EXISTS idx_extra_schedules_date ON extra_schedules(date);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per calcolare end_time e mantenere sincronizzati i campi alias
CREATE OR REPLACE FUNCTION sync_online_booking_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sincronizza i campi alias
    NEW.booking_date := NEW.requested_date;
    NEW.start_time := NEW.requested_time;
    
    -- Calcola end_time se service_duration è presente
    IF NEW.service_duration IS NOT NULL AND NEW.requested_time IS NOT NULL THEN
        NEW.end_time := (NEW.requested_time + (NEW.service_duration || ' minutes')::INTERVAL)::TIME;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_online_booking_settings_updated_at 
    BEFORE UPDATE ON online_booking_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_online_bookings_updated_at 
    BEFORE UPDATE ON online_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_online_booking_fields_trigger
    BEFORE INSERT OR UPDATE ON online_bookings
    FOR EACH ROW EXECUTE FUNCTION sync_online_booking_fields();

CREATE TRIGGER update_working_hours_updated_at 
    BEFORE UPDATE ON working_hours 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extra_schedules_updated_at 
    BEFORE UPDATE ON extra_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserisci impostazioni di default per i saloni esistenti
INSERT INTO online_booking_settings (salon_id, enabled, require_approval, auto_confirm)
SELECT DISTINCT salon_id, false, true, false
FROM profiles 
WHERE salon_id IS NOT NULL
  AND salon_id NOT IN (SELECT salon_id FROM online_booking_settings)
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABELLA LOG PRENOTAZIONI ONLINE (per tracciabilità)
-- =====================================================
CREATE TABLE IF NOT EXISTS online_booking_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL,
  
  -- Dati originali della prenotazione online
  original_customer_name TEXT NOT NULL,
  original_customer_email TEXT,
  original_customer_phone TEXT,
  original_service_name TEXT NOT NULL,
  original_service_duration INTEGER NOT NULL,
  original_service_price DECIMAL(10,2) NOT NULL,
  
  -- Dati tecnici
  ip_address INET,
  user_agent TEXT,
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDICI PER PERFORMANCE
-- =====================================================

-- Indici per online_booking_settings
CREATE INDEX IF NOT EXISTS idx_online_booking_settings_salon_id 
ON online_booking_settings(salon_id);

CREATE INDEX IF NOT EXISTS idx_online_booking_settings_enabled 
ON online_booking_settings(enabled) WHERE enabled = true;

-- Indici per online_booking_logs
CREATE INDEX IF NOT EXISTS idx_online_booking_logs_order_id 
ON online_booking_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_online_booking_logs_salon_id 
ON online_booking_logs(salon_id);

CREATE INDEX IF NOT EXISTS idx_online_booking_logs_status 
ON online_booking_logs(booking_status);

-- Indice per orders con booking_source
CREATE INDEX IF NOT EXISTS idx_orders_booking_source 
ON orders(booking_source);

CREATE INDEX IF NOT EXISTS idx_orders_salon_booking_source 
ON orders(salon_id, booking_source);

-- =====================================================
-- FUNZIONI UTILITY
-- =====================================================

-- Funzione per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER PER AGGIORNAMENTO AUTOMATICO TIMESTAMPS
-- =====================================================

-- Trigger per online_booking_settings
DROP TRIGGER IF EXISTS update_online_booking_settings_updated_at ON online_booking_settings;
CREATE TRIGGER update_online_booking_settings_updated_at 
    BEFORE UPDATE ON online_booking_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per online_booking_logs
DROP TRIGGER IF EXISTS update_online_booking_logs_updated_at ON online_booking_logs;
CREATE TRIGGER update_online_booking_logs_updated_at 
    BEFORE UPDATE ON online_booking_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNZIONE VERIFICA DISPONIBILITÀ SLOT (UNIFICATA)
-- =====================================================
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_salon_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER,
  p_team_member_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_settings RECORD;
  v_existing_bookings INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_working_start TIME;
  v_working_end TIME;
  v_break_start TIME;
  v_break_end TIME;
  v_day_of_week TEXT;
  v_max_bookings INTEGER;
BEGIN
  -- Recupera le impostazioni del salone
  SELECT * INTO v_settings 
  FROM online_booking_settings 
  WHERE salon_id = p_salon_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se le prenotazioni online sono abilitate
  IF NOT v_settings.enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se il giorno è chiuso
  v_day_of_week := LOWER(TO_CHAR(p_date, 'day'));
  IF v_day_of_week = ANY(v_settings.closed_days) THEN
    RETURN FALSE;
  END IF;
  
  -- Calcola orario di inizio e fine
  v_start_time := p_time;
  v_end_time := p_time + (p_duration || ' minutes')::INTERVAL;
  
  -- Recupera orari di lavoro
  v_working_start := v_settings.working_hours_start;
  v_working_end := v_settings.working_hours_end;
  v_break_start := v_settings.break_start;
  v_break_end := v_settings.break_end;
  v_max_bookings := v_settings.max_bookings_per_slot;
  
  -- Verifica se lo slot è fuori dagli orari di lavoro
  IF v_start_time < v_working_start OR v_end_time > v_working_end THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se lo slot si sovrappone alla pausa
  IF (v_start_time < v_break_end AND v_end_time > v_break_start) THEN
    RETURN FALSE;
  END IF;
  
  -- Conta le prenotazioni esistenti per questo slot (tutte le origini)
  SELECT COUNT(*) INTO v_existing_bookings
  FROM orders
  WHERE salon_id = p_salon_id
    AND data = p_date
    AND status NOT IN ('Cancellato', 'Rifiutato')
    AND (
      ("orarioInizio"::TIME < v_end_time AND 
       "orarioFine"::TIME > v_start_time)
    )
    AND (p_team_member_id IS NULL OR team_id = p_team_member_id);
  
  -- Verifica se il numero massimo di prenotazioni per slot è stato raggiunto
  RETURN v_existing_bookings < v_max_bookings;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNZIONE OTTIENI SLOT DISPONIBILI (UNIFICATA)
-- =====================================================
CREATE OR REPLACE FUNCTION get_available_slots(
  p_salon_id UUID,
  p_date DATE,
  p_team_member_id UUID DEFAULT NULL
)
RETURNS TABLE(
  slot_time TIME,
  available BOOLEAN
) AS $$
DECLARE
  v_settings RECORD;
  v_current_time TIME;
  v_slot_duration INTEGER;
  v_working_start TIME;
  v_working_end TIME;
  v_break_start TIME;
  v_break_end TIME;
  v_day_of_week TEXT;
  v_min_notice_hours INTEGER;
  v_current_datetime TIMESTAMP;
BEGIN
  -- Recupera le impostazioni del salone
  SELECT * INTO v_settings 
  FROM online_booking_settings 
  WHERE salon_id = p_salon_id;
  
  IF NOT FOUND OR NOT v_settings.enabled THEN
    RETURN;
  END IF;
  
  -- Verifica se il giorno è chiuso
  v_day_of_week := LOWER(TO_CHAR(p_date, 'day'));
  IF v_day_of_week = ANY(v_settings.closed_days) THEN
    RETURN;
  END IF;
  
  -- Recupera parametri dalle impostazioni
  v_slot_duration := v_settings.slot_duration;
  v_working_start := v_settings.working_hours_start;
  v_working_end := v_settings.working_hours_end;
  v_break_start := v_settings.break_start;
  v_break_end := v_settings.break_end;
  v_min_notice_hours := v_settings.min_notice_hours;
  
  -- Se è oggi, calcola l'orario minimo considerando il preavviso
  IF p_date = CURRENT_DATE THEN
    v_current_datetime := CURRENT_TIMESTAMP + (v_min_notice_hours || ' hours')::INTERVAL;
    v_current_time := v_current_datetime::TIME;
    
    -- Arrotonda all'orario di inizio più vicino
    IF v_current_time > v_working_start THEN
      v_working_start := v_current_time;
    END IF;
  END IF;
  
  -- Genera slot ogni v_slot_duration minuti
  FOR v_current_time IN 
    SELECT generate_series(
      v_working_start::TIME,
      v_working_end::TIME,
      (v_slot_duration || ' minutes')::INTERVAL
    )::TIME
  LOOP
    -- Verifica se lo slot è disponibile
    IF check_slot_availability(p_salon_id, p_date, v_current_time, v_slot_duration, p_team_member_id) THEN
      RETURN QUERY SELECT v_current_time, TRUE;
    ELSE
      RETURN QUERY SELECT v_current_time, FALSE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNZIONE CREA PRENOTAZIONE ONLINE (UNIFICATA CON ORDER_SERVICES)
-- =====================================================
CREATE OR REPLACE FUNCTION create_online_booking(
  p_salon_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_requested_date DATE,
  p_requested_time TIME,
  p_service_id INTEGER,
  p_service_name TEXT,
  p_service_duration INTEGER,
  p_service_price DECIMAL(10,2),
  p_team_member_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_settings RECORD;
  v_order_id UUID;
  v_log_id UUID;
  v_order_service_id INTEGER;
  v_min_notice_hours INTEGER;
  v_max_days_ahead INTEGER;
  v_requested_datetime TIMESTAMP;
  v_current_datetime TIMESTAMP;
  v_max_date DATE;
  v_initial_status TEXT;
  v_end_time TIME;
BEGIN
  -- Recupera le impostazioni del salone
  SELECT * INTO v_settings 
  FROM online_booking_settings 
  WHERE salon_id = p_salon_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Salone non trovato');
  END IF;
  
  IF NOT v_settings.enabled THEN
    RETURN json_build_object('success', false, 'error', 'Prenotazioni online non abilitate');
  END IF;
  
  -- Validazione preavviso minimo
  v_min_notice_hours := v_settings.min_notice_hours;
  v_requested_datetime := (p_requested_date || ' ' || p_requested_time)::TIMESTAMP;
  v_current_datetime := CURRENT_TIMESTAMP;
  
  IF v_requested_datetime < (v_current_datetime + (v_min_notice_hours || ' hours')::INTERVAL) THEN
    RETURN json_build_object('success', false, 'error', 
      format('È necessario un preavviso minimo di %s ore', v_min_notice_hours));
  END IF;
  
  -- Validazione giorni massimi in anticipo
  v_max_days_ahead := v_settings.max_days_ahead;
  v_max_date := CURRENT_DATE + (v_max_days_ahead || ' days')::INTERVAL;
  
  IF p_requested_date > v_max_date THEN
    RETURN json_build_object('success', false, 'error', 
      format('Non è possibile prenotare oltre %s giorni in anticipo', v_max_days_ahead));
  END IF;
  
  -- Verifica disponibilità slot
  IF NOT check_slot_availability(p_salon_id, p_requested_date, p_requested_time, p_service_duration, p_team_member_id) THEN
    RETURN json_build_object('success', false, 'error', 'Slot non disponibile');
  END IF;
  
  -- Determina lo status iniziale
  v_initial_status := CASE 
    WHEN NOT v_settings.require_approval AND v_settings.auto_confirm THEN 'Prenotato'
    ELSE 'In attesa'
  END;
  
  -- Calcola orario di fine
  v_end_time := (p_requested_time + (p_service_duration || ' minutes')::INTERVAL)::TIME;
  
  -- Inserisci la prenotazione nella tabella orders
  INSERT INTO orders (
    user_id, nome, telefono, email, data, "orarioInizio", "orarioFine",
    prezzo, note, status, team_id, salon_id, booking_source,
    descrizione, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), -- user_id temporaneo per prenotazioni online
    p_customer_name, p_customer_phone, p_customer_email,
    p_requested_date, p_requested_time::TEXT, v_end_time::TEXT,
    p_service_price, 
    format('Prenotazione online - %s', COALESCE(p_notes, '')),
    v_initial_status, p_team_member_id, p_salon_id, 'online',
    p_service_name, NOW(), NOW()
  ) RETURNING id INTO v_order_id;
  
  -- Inserisci il servizio nella tabella order_services
  INSERT INTO order_services (
    order_id, service_id, price, servizio
  ) VALUES (
    v_order_id, p_service_id, p_service_price, p_service_name
  ) RETURNING id INTO v_order_service_id;
  
  -- Crea il log per tracciabilità
  INSERT INTO online_booking_logs (
    order_id, salon_id, original_customer_name, original_customer_email,
    original_customer_phone, original_service_name, original_service_duration,
    original_service_price, ip_address, user_agent, booking_status
  ) VALUES (
    v_order_id, p_salon_id, p_customer_name, p_customer_email,
    p_customer_phone, p_service_name, p_service_duration,
    p_service_price, p_ip_address, p_user_agent,
    CASE WHEN v_initial_status = 'Prenotato' THEN 'approved' ELSE 'pending' END
  ) RETURNING id INTO v_log_id;
  
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_service_id', v_order_service_id,
    'log_id', v_log_id,
    'status', v_initial_status,
    'message', CASE 
      WHEN v_initial_status = 'Prenotato' THEN 'Prenotazione confermata con successo'
      ELSE 'Prenotazione inviata in attesa di approvazione'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNZIONE APPROVA/RIFIUTA PRENOTAZIONE ONLINE
-- =====================================================
CREATE OR REPLACE FUNCTION update_online_booking_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_log RECORD;
  v_new_order_status TEXT;
BEGIN
  -- Recupera l'ordine
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND booking_source = 'online';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Prenotazione online non trovata');
  END IF;
  
  -- Recupera il log
  SELECT * INTO v_log
  FROM online_booking_logs
  WHERE order_id = p_order_id;
  
  -- Determina il nuovo status per orders
  v_new_order_status := CASE p_new_status
    WHEN 'approved' THEN 'Prenotato'
    WHEN 'rejected' THEN 'Rifiutato'
    WHEN 'cancelled' THEN 'Cancellato'
    ELSE 'In attesa'
  END;
  
  -- Aggiorna lo status dell'ordine
  UPDATE orders
  SET status = v_new_order_status,
      note = COALESCE(p_notes, note),
      updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Aggiorna il log
  UPDATE online_booking_logs
  SET booking_status = p_new_status,
      updated_at = NOW()
  WHERE order_id = p_order_id;
  
  RETURN json_build_object(
    'success', true,
    'message', format('Prenotazione online %s con successo', p_new_status)
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTE UTILI
-- =====================================================

-- Vista per prenotazioni online in attesa
CREATE OR REPLACE VIEW pending_online_bookings AS
SELECT 
  o.id as order_id,
  o.nome as customer_name,
  o.email as customer_email,
  o.telefono as customer_phone,
  o.data as requested_date,
  o."orarioInizio" as requested_time,
  o.descrizione as service_name,
  o.prezzo as service_price,
  o.note,
  o.created_at,
  obl.booking_status,
  obl.ip_address,
  obl.user_agent,
  t.name as team_member_name,
  os.service_id,
  os.price as service_price_detail
FROM orders o
JOIN online_booking_logs obl ON o.id = obl.order_id
LEFT JOIN team t ON o.team_id = t.id
LEFT JOIN order_services os ON o.id = os.order_id
WHERE o.booking_source = 'online' 
  AND o.status = 'In attesa'
ORDER BY o.created_at DESC;

-- Vista per statistiche prenotazioni online
CREATE OR REPLACE VIEW online_booking_stats AS
SELECT 
  o.salon_id,
  COUNT(*) as total_online_bookings,
  COUNT(*) FILTER (WHERE o.status = 'In attesa') as pending_bookings,
  COUNT(*) FILTER (WHERE o.status = 'Prenotato') as approved_bookings,
  COUNT(*) FILTER (WHERE o.status = 'Rifiutato') as rejected_bookings,
  COUNT(*) FILTER (WHERE o.status = 'Cancellato') as cancelled_bookings,
  AVG(o.prezzo) as avg_service_price,
  MIN(o.created_at) as first_booking,
  MAX(o.created_at) as last_booking
FROM orders o
WHERE o.booking_source = 'online'
GROUP BY o.salon_id;

-- Vista unificata per tutte le prenotazioni con servizi
CREATE OR REPLACE VIEW all_bookings_with_services AS
SELECT 
  o.id,
  o.nome as customer_name,
  o.email as customer_email,
  o.telefono as customer_phone,
  o.data as booking_date,
  o."orarioInizio" as start_time,
  o."orarioFine" as end_time,
  o.prezzo as total_price,
  o.status,
  o.booking_source,
  o.descrizione as service_name,
  o.team_id,
  o.salon_id,
  o.created_at,
  o.updated_at,
  os.service_id,
  os.price as service_price,
  os.servizio as service_detail
FROM orders o
LEFT JOIN order_services os ON o.id = os.order_id
WHERE o.status NOT IN ('Cancellato', 'Rifiutato')
ORDER BY o.data, o."orarioInizio";

-- Vista per prenotazioni online complete
CREATE OR REPLACE VIEW online_bookings_complete AS
SELECT 
  o.id as order_id,
  o.nome as customer_name,
  o.email as customer_email,
  o.telefono as customer_phone,
  o.data as booking_date,
  o."orarioInizio" as start_time,
  o."orarioFine" as end_time,
  o.prezzo as total_price,
  o.status as order_status,
  o.note as order_notes,
  o.created_at as booking_created,
  o.updated_at as booking_updated,
  obl.booking_status as online_status,
  obl.ip_address,
  obl.user_agent,
  obl.original_service_name,
  obl.original_service_duration,
  obl.original_service_price,
  t.name as team_member_name,
  t.id as team_member_id,
  os.service_id,
  os.price as service_price_detail,
  os.servizio as service_detail
FROM orders o
JOIN online_booking_logs obl ON o.id = obl.order_id
LEFT JOIN team t ON o.team_id = t.id
LEFT JOIN order_services os ON o.id = os.order_id
WHERE o.booking_source = 'online'
ORDER BY o.created_at DESC;

-- =====================================================
-- COMMENTI PER DOCUMENTAZIONE
-- =====================================================

COMMENT ON TABLE online_booking_settings IS 'Impostazioni per le prenotazioni online di ogni salone';
COMMENT ON TABLE online_booking_logs IS 'Log per tracciabilità delle prenotazioni online';
COMMENT ON COLUMN orders.booking_source IS 'Origine della prenotazione: manual, online, phone, walk_in';
COMMENT ON FUNCTION check_slot_availability IS 'Verifica se uno slot è disponibile per una prenotazione (unificato)';
COMMENT ON FUNCTION get_available_slots IS 'Restituisce tutti gli slot disponibili per una data (unificato)';
COMMENT ON FUNCTION create_online_booking IS 'Crea una nuova prenotazione online nella tabella orders unificata con order_services';
COMMENT ON FUNCTION update_online_booking_status IS 'Aggiorna lo status di una prenotazione online';

-- =====================================================
-- FINE SCRIPT
-- ===================================================== 