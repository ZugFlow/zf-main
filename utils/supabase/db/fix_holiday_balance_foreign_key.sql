-- Migrazione per correggere il problema della foreign key constraint
-- Eseguire questo script se la tabella holiday_balances esiste già

-- 1. Rimuovi la foreign key constraint esistente se presente
DO $$ 
BEGIN
    -- Controlla se la constraint esiste e rimuovila
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'holiday_balances_salon_id_fkey' 
        AND table_name = 'holiday_balances'
    ) THEN
        ALTER TABLE holiday_balances DROP CONSTRAINT holiday_balances_salon_id_fkey;
        RAISE NOTICE 'Foreign key constraint holiday_balances_salon_id_fkey rimossa';
    ELSE
        RAISE NOTICE 'Foreign key constraint holiday_balances_salon_id_fkey non trovata';
    END IF;
END $$;

-- 2. Verifica che tutti i salon_id nella tabella holiday_balances siano validi
-- Rimuovi i record con salon_id non validi
DELETE FROM holiday_balances 
WHERE salon_id NOT IN (
    SELECT DISTINCT salon_id FROM team WHERE salon_id IS NOT NULL
    UNION
    SELECT DISTINCT salon_id FROM profiles WHERE salon_id IS NOT NULL
);

-- 3. Aggiungi un indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_holiday_balances_salon_id_year ON holiday_balances(salon_id, year);

-- 4. Aggiungi un trigger per validare il salon_id all'inserimento/aggiornamento
CREATE OR REPLACE FUNCTION validate_holiday_balance_salon_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Controlla se il salon_id esiste in team o profiles
    IF NOT EXISTS (
        SELECT 1 FROM team WHERE salon_id = NEW.salon_id
        UNION
        SELECT 1 FROM profiles WHERE salon_id = NEW.salon_id
    ) THEN
        RAISE EXCEPTION 'salon_id % non trovato in team o profiles', NEW.salon_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rimuovi il trigger se esiste già
DROP TRIGGER IF EXISTS trigger_validate_holiday_balance_salon_id ON holiday_balances;

-- Crea il trigger
CREATE TRIGGER trigger_validate_holiday_balance_salon_id
    BEFORE INSERT OR UPDATE ON holiday_balances
    FOR EACH ROW
    EXECUTE FUNCTION validate_holiday_balance_salon_id();

-- 5. Inserisci dati di default per i membri che non hanno ancora un bilancio
INSERT INTO holiday_balances (member_id, salon_id, year, total_days)
SELECT 
    t.id as member_id,
    t.salon_id,
    EXTRACT(YEAR FROM CURRENT_DATE) as year,
    25 as total_days
FROM team t
WHERE t.is_active = true 
    AND t.salon_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM holiday_balances hb 
        WHERE hb.member_id = t.id 
        AND hb.year = EXTRACT(YEAR FROM CURRENT_DATE)
    )
ON CONFLICT (member_id, year) DO NOTHING;

-- 6. Aggiorna i giorni utilizzati per tutti i bilanci esistenti
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
    WHERE p.member_id = holiday_balances.member_id 
    AND p.type = 'ferie' 
    AND p.status = 'approved'
    AND EXTRACT(YEAR FROM p.start_date::date) = holiday_balances.year
);

-- 7. Aggiorna i giorni in attesa per tutti i bilanci esistenti
UPDATE holiday_balances 
SET pending_days = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN p.end_date::date - p.start_date::date + 1 > 0 
            THEN p.end_date::date - p.start_date::date + 1 
            ELSE 1 
        END
    ), 0)
    FROM permessiferie p
    WHERE p.member_id = holiday_balances.member_id 
    AND p.type = 'ferie' 
    AND p.status = 'pending'
    AND EXTRACT(YEAR FROM p.start_date::date) = holiday_balances.year
);

-- 8. Verifica finale
SELECT 
    'Verifica finale' as check_type,
    COUNT(*) as total_balances,
    COUNT(DISTINCT salon_id) as unique_salons,
    COUNT(DISTINCT member_id) as unique_members
FROM holiday_balances; 