-- =====================================================
-- CREAZIONE TABELLA WORKING_HOURS (STRUTTURA CORRETTA)
-- =====================================================
-- Tabella per gli orari di lavoro settimanali dei membri del team
-- Adattata alla struttura del database esistente
-- =====================================================

-- Tabella per gli orari di lavoro settimanali
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

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_working_hours_salon_user ON working_hours(salon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_working_hours_active ON working_hours(is_active);

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per working_hours
CREATE TRIGGER update_working_hours_updated_at 
    BEFORE UPDATE ON working_hours 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTI SULLA TABELLA
-- =====================================================
COMMENT ON TABLE working_hours IS 'Orari di lavoro settimanali per ogni membro del team';
COMMENT ON COLUMN working_hours.salon_id IS 'ID del salone di riferimento';
COMMENT ON COLUMN working_hours.user_id IS 'ID dell''utente (riferimento a team.user_id)';
COMMENT ON COLUMN working_hours.day_of_week IS 'Giorno della settimana (0=Domenica, 1=Lunedì, ..., 6=Sabato)';
COMMENT ON COLUMN working_hours.start_time IS 'Orario di inizio lavoro';
COMMENT ON COLUMN working_hours.end_time IS 'Orario di fine lavoro';
COMMENT ON COLUMN working_hours.is_active IS 'Se l''orario è attivo per questo giorno'; 