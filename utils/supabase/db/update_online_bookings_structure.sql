-- =====================================================
-- AGGIORNAMENTO STRUTTURA TABELLA ONLINE_BOOKINGS
-- =====================================================
-- Questo script aggiorna la tabella online_bookings esistente
-- per includere i campi necessari per le funzioni RPC
-- =====================================================

-- Aggiungi campi alias se non esistono
DO $$ 
BEGIN
    -- Aggiungi booking_date se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'online_bookings' 
        AND column_name = 'booking_date'
    ) THEN
        ALTER TABLE online_bookings ADD COLUMN booking_date DATE;
    END IF;
    
    -- Aggiungi start_time se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'online_bookings' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE online_bookings ADD COLUMN start_time TIME;
    END IF;
    
    -- Aggiungi end_time se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'online_bookings' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE online_bookings ADD COLUMN end_time TIME;
    END IF;
END $$;

-- Aggiorna i campi alias con i valori esistenti
UPDATE online_bookings 
SET 
    booking_date = requested_date,
    start_time = requested_time,
    end_time = (requested_time + (service_duration || ' minutes')::INTERVAL)::TIME
WHERE booking_date IS NULL OR start_time IS NULL OR end_time IS NULL;

-- Crea la funzione se non esiste
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

-- Aggiungi trigger se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'sync_online_booking_fields_trigger'
    ) THEN
        -- Crea il trigger
        CREATE TRIGGER sync_online_booking_fields_trigger
            BEFORE INSERT OR UPDATE ON online_bookings
            FOR EACH ROW EXECUTE FUNCTION sync_online_booking_fields();
    END IF;
END $$;

-- Aggiungi indici per performance se non esistono
CREATE INDEX IF NOT EXISTS idx_online_bookings_booking_date 
ON online_bookings(booking_date);

CREATE INDEX IF NOT EXISTS idx_online_bookings_start_time 
ON online_bookings(start_time);

CREATE INDEX IF NOT EXISTS idx_online_bookings_end_time 
ON online_bookings(end_time);

CREATE INDEX IF NOT EXISTS idx_online_bookings_status_date 
ON online_bookings(status, booking_date);

-- =====================================================
-- FINE SCRIPT
-- ===================================================== 