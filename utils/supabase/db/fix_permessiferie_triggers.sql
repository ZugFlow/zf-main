-- Fix per i trigger problematici che causano errore "record 'new' has no field 'year'"
-- Questo script rimuove e ricrea i trigger con le funzioni corrette

-- 1. Rimuovi i trigger problematici
DROP TRIGGER IF EXISTS trigger_calculate_holiday_used_days ON permessiferie;
DROP TRIGGER IF EXISTS trigger_sync_permissions_with_work_hours ON permessiferie;
DROP TRIGGER IF EXISTS update_permessiferie_updated_at ON permessiferie;

-- 2. Ricrea la funzione calculate_holiday_used_days corretta
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

-- 3. Ricrea la funzione sync_permissions_with_work_hours corretta
CREATE OR REPLACE FUNCTION sync_permissions_with_work_hours()
RETURNS TRIGGER AS $$
DECLARE
    v_current_date DATE;
    v_permission RECORD;
    v_work_hours_record RECORD;
BEGIN
    -- Se il permesso è stato approvato o rifiutato
    IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
        
        -- Per ogni giorno del periodo di permesso
        v_current_date := NEW.start_date;
        
        WHILE v_current_date <= NEW.end_date LOOP
            -- Controlla se esiste già un record work_hours per questo giorno e membro
            SELECT * INTO v_work_hours_record
            FROM work_hours 
            WHERE member_id = NEW.member_id 
              AND date = v_current_date;
            
            -- Se il permesso è stato approvato, marca il giorno come "absent"
            IF NEW.status = 'approved' THEN
                IF v_work_hours_record IS NULL THEN
                    -- Crea un nuovo record work_hours per il giorno di permesso
                    INSERT INTO work_hours (
                        member_id,
                        salon_id,
                        date,
                        start_time,
                        end_time,
                        total_hours,
                        break_time,
                        notes,
                        status
                    ) VALUES (
                        NEW.member_id,
                        NEW.salon_id,
                        v_current_date,
                        COALESCE(NEW.start_time, '00:00:00'),
                        COALESCE(NEW.end_time, '00:00:00'),
                        0, -- 0 ore lavorate per permesso
                        0, -- 0 minuti di pausa
                        CONCAT('Permesso approvato: ', NEW.type, ' - ', NEW.reason),
                        'absent'
                    );
                ELSE
                    -- Aggiorna il record esistente
                    UPDATE work_hours 
                    SET 
                        status = 'absent',
                        total_hours = 0,
                        notes = CONCAT('Permesso approvato: ', NEW.type, ' - ', NEW.reason),
                        updated_at = NOW()
                    WHERE id = v_work_hours_record.id;
                END IF;
            END IF;
            
            -- Passa al giorno successivo
            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Ricrea i trigger con le funzioni corrette
CREATE TRIGGER trigger_calculate_holiday_used_days
  AFTER INSERT OR UPDATE OR DELETE ON permessiferie
  FOR EACH ROW
  EXECUTE FUNCTION calculate_holiday_used_days();

CREATE TRIGGER trigger_sync_permissions_with_work_hours
  AFTER UPDATE ON permessiferie
  FOR EACH ROW
  EXECUTE FUNCTION sync_permissions_with_work_hours();

-- 5. Ricrea il trigger per aggiornare updated_at
CREATE TRIGGER update_permessiferie_updated_at 
  BEFORE UPDATE ON public.permessiferie 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Commenti per documentazione
COMMENT ON FUNCTION calculate_holiday_used_days() IS 'Calcola automaticamente i giorni di ferie utilizzati quando vengono inseriti/aggiornati/eliminati permessi';
COMMENT ON FUNCTION sync_permissions_with_work_hours() IS 'Sincronizza automaticamente i permessi approvati con le ore lavorative'; 