-- Fix del trigger che causa errore "record 'new' has no field 'year'"
-- Il problema è che il trigger si attiva su permessiferie ma cerca di accedere a NEW.year
-- che non esiste nella tabella permessiferie

-- Rimuovi il trigger problematico
DROP TRIGGER IF EXISTS trigger_calculate_holiday_used_days ON permessiferie;

-- Ricrea la funzione corretta
CREATE OR REPLACE FUNCTION calculate_holiday_used_days()
RETURNS TRIGGER AS $$
DECLARE
  affected_member_id UUID;
  affected_year INTEGER;
BEGIN
  -- Determina il member_id e year dal record che ha causato il trigger
  IF TG_OP = 'DELETE' THEN
    affected_member_id := OLD.member_id;
    affected_year := EXTRACT(YEAR FROM OLD.start_date::date);
  ELSE
    affected_member_id := NEW.member_id;
    affected_year := EXTRACT(YEAR FROM NEW.start_date::date);
  END IF;

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
    WHERE p.member_id = affected_member_id 
    AND p.type = 'ferie' 
    AND p.status = 'approved'
    AND EXTRACT(YEAR FROM p.start_date::date) = affected_year
  )
  WHERE member_id = affected_member_id AND year = affected_year;
  
  -- Ritorna il record appropriato
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ricrea il trigger con la funzione corretta
CREATE TRIGGER trigger_calculate_holiday_used_days
  AFTER INSERT OR UPDATE OR DELETE ON permessiferie
  FOR EACH ROW
  EXECUTE FUNCTION calculate_holiday_used_days(); 