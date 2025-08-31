-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_holiday_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funzione per validare salon_id
CREATE OR REPLACE FUNCTION validate_holiday_balance_salon_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica che il salon_id sia valido
  IF NEW.salon_id IS NULL OR NEW.salon_id = '' THEN
    RAISE EXCEPTION 'salon_id non può essere null o vuoto';
  END IF;
  
  -- Verifica che il member_id appartenga al salon_id specificato
  IF NOT EXISTS (
    SELECT 1 FROM team 
    WHERE id = NEW.member_id 
    AND salon_id = NEW.salon_id
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Il membro non appartiene al salone specificato';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
DROP TRIGGER IF EXISTS trigger_calculate_holiday_used_days ON permessiferie;
CREATE TRIGGER trigger_calculate_holiday_used_days
  AFTER INSERT OR UPDATE OR DELETE ON permessiferie
  FOR EACH ROW
  EXECUTE FUNCTION calculate_holiday_used_days(); 