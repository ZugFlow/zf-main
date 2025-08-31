-- =====================================================
-- CREAZIONE TABELLA ONLINE_BOOKING_SETTINGS
-- =====================================================
-- Tabella per le impostazioni delle prenotazioni online
-- =====================================================

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id)
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_online_booking_settings_salon_id ON online_booking_settings(salon_id);
CREATE INDEX IF NOT EXISTS idx_online_booking_settings_enabled ON online_booking_settings(enabled) WHERE enabled = true;

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per online_booking_settings
CREATE TRIGGER update_online_booking_settings_updated_at 
    BEFORE UPDATE ON online_booking_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserisci impostazioni di default per i saloni esistenti
INSERT INTO online_booking_settings (salon_id, enabled, require_approval, auto_confirm)
SELECT DISTINCT salon_id, false, true, false
FROM profiles 
WHERE salon_id IS NOT NULL
  AND salon_id NOT IN (SELECT salon_id FROM online_booking_settings)
ON CONFLICT (salon_id) DO NOTHING;

-- =====================================================
-- COMMENTI SULLA TABELLA
-- =====================================================
COMMENT ON TABLE online_booking_settings IS 'Impostazioni per le prenotazioni online del salone';
COMMENT ON COLUMN online_booking_settings.salon_id IS 'ID del salone di riferimento';
COMMENT ON COLUMN online_booking_settings.enabled IS 'Se le prenotazioni online sono abilitate';
COMMENT ON COLUMN online_booking_settings.require_approval IS 'Se le prenotazioni richiedono approvazione manuale';
COMMENT ON COLUMN online_booking_settings.auto_confirm IS 'Se le prenotazioni vengono confermate automaticamente';
COMMENT ON COLUMN online_booking_settings.min_notice_hours IS 'Preavviso minimo in ore per le prenotazioni';
COMMENT ON COLUMN online_booking_settings.max_days_ahead IS 'Giorni massimi in anticipo per le prenotazioni';
COMMENT ON COLUMN online_booking_settings.slot_duration IS 'Durata di ogni slot in minuti';
COMMENT ON COLUMN online_booking_settings.booking_start_time IS 'Orario di apertura per le prenotazioni';
COMMENT ON COLUMN online_booking_settings.booking_end_time IS 'Orario di chiusura per le prenotazioni';
COMMENT ON COLUMN online_booking_settings.allow_same_day_booking IS 'Se permette prenotazioni per lo stesso giorno';
COMMENT ON COLUMN online_booking_settings.max_bookings_per_day IS 'Numero massimo di prenotazioni per giorno'; 