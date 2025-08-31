-- Creazione tabella per bilanci ferie configurabili
CREATE TABLE IF NOT EXISTS holiday_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  total_days INTEGER NOT NULL DEFAULT 25,
  used_days INTEGER NOT NULL DEFAULT 0,
  pending_days INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Vincolo unico per evitare duplicati per membro/anno
  UNIQUE(member_id, year)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_holiday_balances_member_id ON holiday_balances(member_id);
CREATE INDEX IF NOT EXISTS idx_holiday_balances_salon_id ON holiday_balances(salon_id);
CREATE INDEX IF NOT EXISTS idx_holiday_balances_year ON holiday_balances(year);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_holiday_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_holiday_balances_updated_at
  BEFORE UPDATE ON holiday_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_holiday_balances_updated_at();

-- Funzione per calcolare automaticamente i giorni utilizzati
CREATE OR REPLACE FUNCTION calculate_holiday_used_days()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna i giorni utilizzati basandosi sui permessi approvati
  UPDATE holiday_balances 
  SET used_days = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN p.end_date::date - p.start_date::date + 1 > 0 
        THEN p.end_date::date - p.start_date::date + 1 
        ELSE 1 
      END
    ), 0)
    FROM permessiferie p
    WHERE p.member_id = NEW.member_id 
    AND p.type = 'ferie' 
    AND p.status = 'approved'
    AND EXTRACT(YEAR FROM p.start_date::date) = NEW.year
  )
  WHERE member_id = NEW.member_id AND year = NEW.year;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare automaticamente i giorni utilizzati quando cambiano i permessi
CREATE TRIGGER trigger_calculate_holiday_used_days
  AFTER INSERT OR UPDATE OR DELETE ON permessiferie
  FOR EACH ROW
  EXECUTE FUNCTION calculate_holiday_used_days();

-- Inserimento dati di default per i membri esistenti
INSERT INTO holiday_balances (member_id, salon_id, year, total_days)
SELECT 
  t.id as member_id,
  t.salon_id,
  EXTRACT(YEAR FROM CURRENT_DATE) as year,
  25 as total_days
FROM team t
WHERE t.is_active = true AND t.salon_id IS NOT NULL
ON CONFLICT (member_id, year) DO NOTHING; 