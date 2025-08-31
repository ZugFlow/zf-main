-- Script completo per risolvere tutti i problemi di holiday_balances

-- 1. Verifica e crea le funzioni mancanti

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
  IF NEW.salon_id IS NULL THEN
    RAISE EXCEPTION 'salon_id non può essere null';
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

-- 2. Verifica e ricrea i trigger
DROP TRIGGER IF EXISTS trigger_update_holiday_balances_updated_at ON holiday_balances;
CREATE TRIGGER trigger_update_holiday_balances_updated_at
  BEFORE UPDATE ON holiday_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_holiday_balances_updated_at();

DROP TRIGGER IF EXISTS trigger_validate_holiday_balance_salon_id ON holiday_balances;
CREATE TRIGGER trigger_validate_holiday_balance_salon_id
  BEFORE INSERT OR UPDATE ON holiday_balances
  FOR EACH ROW
  EXECUTE FUNCTION validate_holiday_balance_salon_id();

DROP TRIGGER IF EXISTS trigger_calculate_holiday_used_days ON permessiferie;
CREATE TRIGGER trigger_calculate_holiday_used_days
  AFTER INSERT OR UPDATE OR DELETE ON permessiferie
  FOR EACH ROW
  EXECUTE FUNCTION calculate_holiday_used_days();

-- 3. Verifica e aggiorna i membri del team con salon_id valido
DO $$
DECLARE
    default_salon_id UUID;
    member_count INTEGER;
BEGIN
    -- Trova un salon_id di default (primo salone disponibile da profiles)
    SELECT salon_id INTO default_salon_id FROM profiles WHERE salon_id IS NOT NULL LIMIT 1;
    
    IF default_salon_id IS NULL THEN
        RAISE NOTICE 'Nessun salon_id trovato in profiles';
    ELSE
        -- Conta membri senza salon_id
        SELECT COUNT(*) INTO member_count 
        FROM team 
        WHERE salon_id IS NULL;
        
        RAISE NOTICE 'Membri senza salon_id: %', member_count;
        
        -- Aggiorna membri senza salon_id
        UPDATE team 
        SET salon_id = default_salon_id
        WHERE salon_id IS NULL;
        
        GET DIAGNOSTICS member_count = ROW_COUNT;
        RAISE NOTICE 'Membri aggiornati: %', member_count;
    END IF;
END $$;

-- 4. Verifica finale
SELECT 
    'Tabella holiday_balances' as check_item,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'holiday_balances') 
         THEN 'ESISTE' ELSE 'NON ESISTE' END as status
UNION ALL
SELECT 
    'Funzione update_holiday_balances_updated_at',
    CASE WHEN EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_holiday_balances_updated_at'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END
UNION ALL
SELECT 
    'Funzione validate_holiday_balance_salon_id',
    CASE WHEN EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'validate_holiday_balance_salon_id'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END
UNION ALL
SELECT 
    'Profili con salon_id valido',
    (SELECT COUNT(*)::text FROM profiles WHERE salon_id IS NOT NULL) as status
UNION ALL
SELECT 
    'Membri team con salon_id valido',
    (SELECT COUNT(*)::text FROM team WHERE salon_id IS NOT NULL) as status; 