-- =====================================================
-- SETUP COMPLETO SISTEMA PRENOTAZIONI ONLINE
-- =====================================================

-- 1. Crea la tabella online_booking_settings se non esiste
CREATE TABLE IF NOT EXISTS online_booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES profiles(salon_id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT true,
  auto_confirm BOOLEAN DEFAULT false,
  min_notice_hours INTEGER DEFAULT 2,
  max_days_ahead INTEGER DEFAULT 30,
  slot_duration INTEGER DEFAULT 15,
  booking_start_time TIME DEFAULT '08:00',
  booking_end_time TIME DEFAULT '20:00',
  allow_same_day_booking BOOLEAN DEFAULT true,
  max_bookings_per_day INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id)
);

-- 2. Crea la tabella online_bookings se non esiste
CREATE TABLE IF NOT EXISTS online_bookings (
  id uuid not null default gen_random_uuid(),
  salon_id uuid not null,
  customer_name character varying(255) not null,
  customer_email character varying(255) null,
  customer_phone character varying(50) null,
  requested_date date not null,
  requested_time time without time zone not null,
  booking_date date not null,
  start_time time without time zone not null,
  end_time time without time zone null,
  service_id integer null,
  service_name character varying(255) not null,
  service_duration integer not null,
  service_price numeric(10, 2) not null,
  team_member_id uuid null,
  status character varying(50) null default 'pending'::character varying,
  notes text null,
  ip_address inet null,
  user_agent text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint online_bookings_pkey primary key (id),
  constraint online_bookings_salon_id_fkey foreign KEY (salon_id) references profiles (salon_id) on delete CASCADE,
  constraint online_bookings_service_id_fkey foreign KEY (service_id) references services (id) on delete set null,
  constraint online_bookings_team_member_id_fkey foreign KEY (team_member_id) references team (id) on delete set null
);

-- 3. Crea gli indici per online_booking_settings
CREATE INDEX IF NOT EXISTS idx_online_booking_settings_salon_id ON online_booking_settings(salon_id);
CREATE INDEX IF NOT EXISTS idx_online_booking_settings_enabled ON online_booking_settings(enabled) WHERE enabled = true;

-- 4. Crea gli indici per online_bookings
CREATE INDEX IF NOT EXISTS idx_online_bookings_salon_date ON online_bookings using btree (salon_id, requested_date);
CREATE INDEX IF NOT EXISTS idx_online_bookings_status ON online_bookings using btree (status);
CREATE INDEX IF NOT EXISTS idx_online_bookings_customer_email ON online_bookings using btree (customer_email);
CREATE INDEX IF NOT EXISTS idx_online_bookings_team_member ON online_bookings using btree (team_member_id);
CREATE INDEX IF NOT EXISTS idx_online_bookings_service ON online_bookings using btree (service_id);

-- 5. Crea la funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Crea la funzione per sincronizzare i campi delle prenotazioni
CREATE OR REPLACE FUNCTION sync_online_booking_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorna booking_date se non è impostato
    IF NEW.booking_date IS NULL THEN
        NEW.booking_date = NEW.requested_date;
    END IF;
    
    -- Aggiorna start_time se non è impostato
    IF NEW.start_time IS NULL THEN
        NEW.start_time = NEW.requested_time;
    END IF;
    
    -- Aggiorna end_time se non è impostato e abbiamo service_duration
    IF NEW.end_time IS NULL AND NEW.service_duration IS NOT NULL THEN
        -- Calcola l'orario di fine basato su start_time e service_duration
        NEW.end_time = (NEW.start_time::time + (NEW.service_duration || ' minutes')::interval)::time;
    END IF;
    
    -- Aggiorna service_name se non è impostato ma abbiamo service_id
    IF (NEW.service_name IS NULL OR NEW.service_name = '') AND NEW.service_id IS NOT NULL THEN
        SELECT name INTO NEW.service_name
        FROM services
        WHERE id = NEW.service_id;
    END IF;
    
    -- Imposta status di default se non è impostato
    IF NEW.status IS NULL THEN
        NEW.status = 'pending';
    END IF;
    
    -- Aggiorna updated_at
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crea i trigger
-- Trigger per online_booking_settings
DROP TRIGGER IF EXISTS update_online_booking_settings_updated_at ON online_booking_settings;
CREATE TRIGGER update_online_booking_settings_updated_at
    BEFORE UPDATE ON online_booking_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per online_bookings
DROP TRIGGER IF EXISTS sync_online_booking_fields_trigger ON online_bookings;
CREATE TRIGGER sync_online_booking_fields_trigger
    BEFORE INSERT OR UPDATE ON online_bookings
    FOR EACH ROW
    EXECUTE FUNCTION sync_online_booking_fields();

DROP TRIGGER IF EXISTS update_online_bookings_updated_at ON online_bookings;
CREATE TRIGGER update_online_bookings_updated_at
    BEFORE UPDATE ON online_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Inserisci impostazioni di default per i saloni esistenti
INSERT INTO online_booking_settings (salon_id, enabled, require_approval, auto_confirm)
SELECT DISTINCT salon_id, false, true, false
FROM profiles 
WHERE salon_id IS NOT NULL
  AND salon_id NOT IN (SELECT salon_id FROM online_booking_settings)
ON CONFLICT (salon_id) DO NOTHING;

-- 9. Aggiungi commenti
COMMENT ON TABLE online_booking_settings IS 'Impostazioni per le prenotazioni online del salone';
COMMENT ON TABLE online_bookings IS 'Prenotazioni online dei clienti';

-- 10. Verifica che tutto sia stato creato correttamente
DO $$
BEGIN
    RAISE NOTICE 'Setup completato per il sistema di prenotazioni online';
    RAISE NOTICE 'Tabelle create: online_booking_settings, online_bookings';
    RAISE NOTICE 'Funzioni create: update_updated_at_column, sync_online_booking_fields';
    RAISE NOTICE 'Trigger creati per entrambe le tabelle';
END $$; 