-- =====================================================
-- SISTEMA COMPLETO PRENOTAZIONI ONLINE (STRUTTURA CORRETTA)
-- =====================================================
-- Questo script crea tutte le tabelle necessarie per il sistema
-- di prenotazioni online. Adattato alla struttura del database esistente.
-- =====================================================

-- =====================================================
-- 1. TABELLA IMPOSTAZIONI PRENOTAZIONI ONLINE
-- =====================================================
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id)
);

-- =====================================================
-- 2. TABELLA ORARI DI LAVORO (STRUTTURA CORRETTA)
-- =====================================================
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES profiles(salon_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES team(user_id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, user_id, day_of_week)
);

-- =====================================================
-- 3. TABELLA PRENOTAZIONI ONLINE
-- =====================================================
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

-- =====================================================
-- 4. TABELLA ORARI EXTRA (opzionale)
-- =====================================================
CREATE TABLE IF NOT EXISTS extra_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES profiles(salon_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES team(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, user_id, date)
);

-- =====================================================
-- 5. TABELLA LOG PRENOTAZIONI ONLINE
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
CREATE INDEX IF NOT EXISTS idx_online_booking_settings_salon_id ON online_booking_settings(salon_id);
CREATE INDEX IF NOT EXISTS idx_online_booking_settings_enabled ON online_booking_settings(enabled) WHERE enabled = true;

-- Indici per working_hours
CREATE INDEX IF NOT EXISTS idx_working_hours_salon_user ON working_hours(salon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_working_hours_active ON working_hours(is_active);

-- Indici per online_bookings
CREATE INDEX IF NOT EXISTS idx_online_bookings_salon_date ON online_bookings(salon_id, requested_date);
CREATE INDEX IF NOT EXISTS idx_online_bookings_status ON online_bookings(status);
CREATE INDEX IF NOT EXISTS idx_online_bookings_customer_email ON online_bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_online_bookings_team_member ON online_bookings(team_member_id);
CREATE INDEX IF NOT EXISTS idx_online_bookings_service ON online_bookings(service_id);

-- Indici per extra_schedules
CREATE INDEX IF NOT EXISTS idx_extra_schedules_salon_user ON extra_schedules(salon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_extra_schedules_date ON extra_schedules(date);

-- Indici per online_booking_logs
CREATE INDEX IF NOT EXISTS idx_online_booking_logs_order_id ON online_booking_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_online_booking_logs_salon_id ON online_booking_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_online_booking_logs_status ON online_booking_logs(booking_status);

-- =====================================================
-- FUNZIONI E TRIGGER
-- =====================================================

-- Funzione per aggiornare automaticamente updated_at
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

-- Trigger per tutte le tabelle
CREATE TRIGGER update_online_booking_settings_updated_at 
    BEFORE UPDATE ON online_booking_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_working_hours_updated_at 
    BEFORE UPDATE ON working_hours 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_online_bookings_updated_at 
    BEFORE UPDATE ON online_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_online_booking_fields_trigger
    BEFORE INSERT OR UPDATE ON online_bookings
    FOR EACH ROW EXECUTE FUNCTION sync_online_booking_fields();

CREATE TRIGGER update_extra_schedules_updated_at 
    BEFORE UPDATE ON extra_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_online_booking_logs_updated_at 
    BEFORE UPDATE ON online_booking_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERIMENTO DATI DI DEFAULT
-- =====================================================

-- Inserisci impostazioni di default per i saloni esistenti
INSERT INTO online_booking_settings (salon_id, enabled, require_approval, auto_confirm)
SELECT DISTINCT salon_id, false, true, false
FROM profiles 
WHERE salon_id IS NOT NULL
  AND salon_id NOT IN (SELECT salon_id FROM online_booking_settings)
ON CONFLICT (salon_id) DO NOTHING;

-- =====================================================
-- COMMENTI SULLE TABELLE
-- =====================================================
COMMENT ON TABLE online_booking_settings IS 'Impostazioni per le prenotazioni online del salone';
COMMENT ON TABLE working_hours IS 'Orari di lavoro settimanali per ogni membro del team';
COMMENT ON TABLE online_bookings IS 'Prenotazioni online effettuate dai clienti';
COMMENT ON TABLE extra_schedules IS 'Orari speciali per date specifiche';
COMMENT ON TABLE online_booking_logs IS 'Log per tracciabilità delle prenotazioni online'; 