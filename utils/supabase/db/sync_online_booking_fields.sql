-- =====================================================
-- FUNZIONE PER SINCRONIZZARE I CAMPI DELLE PRENOTAZIONI ONLINE
-- =====================================================

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
    IF NEW.service_name IS NULL OR NEW.service_name = '' AND NEW.service_id IS NOT NULL THEN
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

-- =====================================================
-- TRIGGER PER SINCRONIZZARE I CAMPI
-- =====================================================

-- Rimuovi il trigger esistente se presente
DROP TRIGGER IF EXISTS sync_online_booking_fields_trigger ON online_bookings;

-- Crea il trigger per INSERT e UPDATE
CREATE TRIGGER sync_online_booking_fields_trigger
    BEFORE INSERT OR UPDATE ON online_bookings
    FOR EACH ROW
    EXECUTE FUNCTION sync_online_booking_fields(); 