-- =====================================================
-- CREAZIONE TABELLA WORK_HOURS E FUNZIONI CORRELATE
-- =====================================================

-- Tabella principale per le ore lavorate
CREATE TABLE IF NOT EXISTS work_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL, -- Riferimento al salon_id nella tabella team
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours DECIMAL(4,2) NOT NULL,
  break_time INTEGER DEFAULT 0, -- minuti di pausa
  notes TEXT,
  status TEXT CHECK (status IN ('completed', 'pending', 'absent')) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_work_hours_member_date ON work_hours(member_id, date);
CREATE INDEX IF NOT EXISTS idx_work_hours_salon_date ON work_hours(salon_id, date);
CREATE INDEX IF NOT EXISTS idx_work_hours_status ON work_hours(status);
CREATE INDEX IF NOT EXISTS idx_work_hours_date_range ON work_hours(date);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_work_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_hours_updated_at
  BEFORE UPDATE ON work_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_work_hours_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE work_hours ENABLE ROW LEVEL SECURITY;

-- Policy per manager (vede tutti i dati del salone)
CREATE POLICY "Manager can view all work hours" ON work_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND salon_id = work_hours.salon_id
    )
  );

-- Policy per dipendenti (vede solo i propri dati)
CREATE POLICY "Members can view own work hours" ON work_hours
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM team 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per inserimento (dipendenti possono inserire solo i propri dati)
CREATE POLICY "Members can insert own work hours" ON work_hours
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM team 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per aggiornamento (dipendenti possono aggiornare solo i propri dati)
CREATE POLICY "Members can update own work hours" ON work_hours
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM team 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per eliminazione (solo manager)
CREATE POLICY "Manager can delete work hours" ON work_hours
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND salon_id = work_hours.salon_id
    )
  );

-- =====================================================
-- FUNZIONI DI CALCOLO
-- =====================================================

-- Funzione per calcolare ore totali
CREATE OR REPLACE FUNCTION calculate_total_work_hours(
  p_salon_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_hours DECIMAL(10,2),
  total_days INTEGER,
  average_hours DECIMAL(4,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(wh.total_hours), 0) as total_hours,
    COUNT(DISTINCT wh.date) as total_days,
    CASE 
      WHEN COUNT(DISTINCT wh.date) > 0 
      THEN COALESCE(SUM(wh.total_hours), 0) / COUNT(DISTINCT wh.date)
      ELSE 0 
    END as average_hours
  FROM work_hours wh
  WHERE wh.salon_id = p_salon_id
    AND wh.status = 'completed'
    AND (p_start_date IS NULL OR wh.date >= p_start_date)
    AND (p_end_date IS NULL OR wh.date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Funzione per statistiche orari
CREATE OR REPLACE FUNCTION get_work_hours_stats(
  p_salon_id UUID,
  p_period TEXT DEFAULT 'month' -- 'week', 'month', 'year'
)
RETURNS JSON AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_result JSON;
BEGIN
  -- Calcola periodo
  CASE p_period
    WHEN 'week' THEN
      v_start_date := CURRENT_DATE - INTERVAL '7 days';
      v_end_date := CURRENT_DATE;
    WHEN 'month' THEN
      v_start_date := DATE_TRUNC('month', CURRENT_DATE);
      v_end_date := CURRENT_DATE;
    WHEN 'year' THEN
      v_start_date := DATE_TRUNC('year', CURRENT_DATE);
      v_end_date := CURRENT_DATE;
    ELSE
      v_start_date := DATE_TRUNC('month', CURRENT_DATE);
      v_end_date := CURRENT_DATE;
  END CASE;

  SELECT json_build_object(
    'total_hours', COALESCE(SUM(wh.total_hours), 0),
    'total_days', COUNT(DISTINCT wh.date),
    'average_hours', CASE 
      WHEN COUNT(DISTINCT wh.date) > 0 
      THEN COALESCE(SUM(wh.total_hours), 0) / COUNT(DISTINCT wh.date)
      ELSE 0 
    END,
    'period_start', v_start_date,
    'period_end', v_end_date,
    'members_count', COUNT(DISTINCT wh.member_id)
  ) INTO v_result
  FROM work_hours wh
  WHERE wh.salon_id = p_salon_id
    AND wh.status = 'completed'
    AND wh.date BETWEEN v_start_date AND v_end_date;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ottenere ore per membro
CREATE OR REPLACE FUNCTION get_member_work_hours(
  p_member_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  start_time TIME,
  end_time TIME,
  total_hours DECIMAL(4,2),
  break_time INTEGER,
  notes TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wh.date,
    wh.start_time,
    wh.end_time,
    wh.total_hours,
    wh.break_time,
    wh.notes,
    wh.status
  FROM work_hours wh
  WHERE wh.member_id = p_member_id
    AND (p_start_date IS NULL OR wh.date >= p_start_date)
    AND (p_end_date IS NULL OR wh.date <= p_end_date)
  ORDER BY wh.date DESC, wh.start_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Funzione per calcolare ore settimanali
CREATE OR REPLACE FUNCTION calculate_weekly_hours(
  p_salon_id UUID,
  p_week_start DATE
)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  total_hours DECIMAL(10,2),
  days_worked INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wh.member_id,
    t.name as member_name,
    COALESCE(SUM(wh.total_hours), 0) as total_hours,
    COUNT(DISTINCT wh.date) as days_worked
  FROM work_hours wh
  JOIN team t ON t.id = wh.member_id
  WHERE wh.salon_id = p_salon_id
    AND wh.status = 'completed'
    AND wh.date >= p_week_start
    AND wh.date < p_week_start + INTERVAL '7 days'
  GROUP BY wh.member_id, t.name
  ORDER BY total_hours DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNZIONI DI UTILITÀ
-- =====================================================

-- Funzione per calcolare ore da start_time e end_time
CREATE OR REPLACE FUNCTION calculate_hours_from_times(
  p_start_time TIME,
  p_end_time TIME
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  v_hours DECIMAL(4,2);
BEGIN
  -- Calcola la differenza in ore
  v_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
  
  -- Arrotonda a 2 decimali
  RETURN ROUND(v_hours, 2);
END;
$$ LANGUAGE plpgsql;

-- Funzione per validare orari
CREATE OR REPLACE FUNCTION validate_work_hours(
  p_start_time TIME,
  p_end_time TIME,
  p_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Controlla che end_time sia dopo start_time
  IF p_end_time <= p_start_time THEN
    RETURN FALSE;
  END IF;
  
  -- Controlla che la data non sia nel futuro
  IF p_date > CURRENT_DATE THEN
    RETURN FALSE;
  END IF;
  
  -- Controlla che le ore non siano troppo lunghe (es. più di 24 ore)
  IF EXTRACT(EPOCH FROM (p_end_time - p_start_time)) > 86400 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER PER VALIDAZIONE
-- =====================================================

-- Trigger per validare i dati prima dell'inserimento
CREATE OR REPLACE FUNCTION validate_work_hours_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Valida orari
  IF NOT validate_work_hours(NEW.start_time, NEW.end_time, NEW.date) THEN
    RAISE EXCEPTION 'Orari non validi: end_time deve essere dopo start_time e la data non può essere nel futuro';
  END IF;
  
  -- Calcola automaticamente total_hours se non specificato
  IF NEW.total_hours IS NULL THEN
    NEW.total_hours := calculate_hours_from_times(NEW.start_time, NEW.end_time);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_work_hours_insert
  BEFORE INSERT ON work_hours
  FOR EACH ROW
  EXECUTE FUNCTION validate_work_hours_insert();

-- Trigger per validare i dati prima dell'aggiornamento
CREATE OR REPLACE FUNCTION validate_work_hours_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Valida orari
  IF NOT validate_work_hours(NEW.start_time, NEW.end_time, NEW.date) THEN
    RAISE EXCEPTION 'Orari non validi: end_time deve essere dopo start_time e la data non può essere nel futuro';
  END IF;
  
  -- Calcola automaticamente total_hours se modificati gli orari
  IF OLD.start_time != NEW.start_time OR OLD.end_time != NEW.end_time THEN
    NEW.total_hours := calculate_hours_from_times(NEW.start_time, NEW.end_time);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_work_hours_update
  BEFORE UPDATE ON work_hours
  FOR EACH ROW
  EXECUTE FUNCTION validate_work_hours_update();

-- =====================================================
-- COMMENTI E DOCUMENTAZIONE
-- =====================================================

COMMENT ON TABLE work_hours IS 'Tabella per registrare le ore lavorate dai dipendenti';
COMMENT ON COLUMN work_hours.member_id IS 'ID del membro del team';
COMMENT ON COLUMN work_hours.salon_id IS 'ID del salone';
COMMENT ON COLUMN work_hours.date IS 'Data del giorno lavorato';
COMMENT ON COLUMN work_hours.start_time IS 'Orario di inizio lavoro';
COMMENT ON COLUMN work_hours.end_time IS 'Orario di fine lavoro';
COMMENT ON COLUMN work_hours.total_hours IS 'Ore totali lavorate (calcolate automaticamente)';
COMMENT ON COLUMN work_hours.break_time IS 'Minuti di pausa';
COMMENT ON COLUMN work_hours.status IS 'Stato: completed, pending, absent';

COMMENT ON FUNCTION calculate_total_work_hours IS 'Calcola le ore totali lavorate per un salone in un periodo';
COMMENT ON FUNCTION get_work_hours_stats IS 'Ottiene statistiche delle ore lavorate per periodo';
COMMENT ON FUNCTION get_member_work_hours IS 'Ottiene le ore lavorate di un membro specifico';
COMMENT ON FUNCTION calculate_weekly_hours IS 'Calcola le ore settimanali per tutti i membri';

-- =====================================================
-- ESEMPI DI UTILIZZO
-- =====================================================

/*
-- Esempio: Inserire ore lavorate
INSERT INTO work_hours (member_id, salon_id, date, start_time, end_time, notes)
VALUES (
  'uuid-del-membro',
  'uuid-del-salone',
  '2024-01-15',
  '09:00:00',
  '17:00:00',
  'Giornata normale'
);

-- Esempio: Calcolare ore totali del mese
SELECT * FROM calculate_total_work_hours('uuid-del-salone', '2024-01-01', '2024-01-31');

-- Esempio: Statistiche mensili
SELECT * FROM get_work_hours_stats('uuid-del-salone', 'month');

-- Esempio: Ore di un membro
SELECT * FROM get_member_work_hours('uuid-del-membro', '2024-01-01', '2024-01-31');
*/ 