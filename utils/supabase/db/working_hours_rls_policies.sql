-- Script per abilitare RLS e creare le policy per la tabella working_hours
-- Basato sul pattern utilizzato per services e profiles

-- =====================================================
-- STEP 1: ABILITA RLS SULLA TABELLA WORKING_HOURS
-- =====================================================

-- Abilita Row Level Security sulla tabella working_hours
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: RIMUOVI EVENTUALI POLICY ESISTENTI
-- =====================================================

-- Rimuovi tutte le policy esistenti per working_hours (se esistono)
DROP POLICY IF EXISTS "working_hours_select_policy" ON working_hours;
DROP POLICY IF EXISTS "working_hours_insert_policy" ON working_hours;
DROP POLICY IF EXISTS "working_hours_update_policy" ON working_hours;
DROP POLICY IF EXISTS "working_hours_delete_policy" ON working_hours;

-- Rimuovi eventuali trigger esistenti per working_hours
DROP TRIGGER IF EXISTS trigger_set_working_hours_salon_id ON working_hours;
DROP FUNCTION IF EXISTS set_working_hours_salon_id();

-- =====================================================
-- STEP 3: CREA LE POLICY RLS
-- =====================================================

-- Policy per SELECT: permette di vedere gli orari di lavoro del proprio salone
CREATE POLICY "working_hours_select_policy" ON working_hours
FOR SELECT
TO authenticated
USING (
    salon_id = get_user_salon_id()
);

-- Policy per INSERT: permette di creare orari di lavoro nel proprio salone
CREATE POLICY "working_hours_insert_policy" ON working_hours
FOR INSERT
TO authenticated
WITH CHECK (
    -- Permetti insert se salon_id corrisponde al salon_id dell'utente
    salon_id = get_user_salon_id()
    OR 
    -- Oppure se salon_id è NULL (verrà impostato dal trigger automaticamente)
    salon_id IS NULL
);

-- Policy per UPDATE: permette di modificare gli orari di lavoro del proprio salone
CREATE POLICY "working_hours_update_policy" ON working_hours
FOR UPDATE
TO authenticated
USING (
    salon_id = get_user_salon_id()
)
WITH CHECK (
    salon_id = get_user_salon_id()
);

-- Policy per DELETE: permette di eliminare gli orari di lavoro del proprio salone
CREATE POLICY "working_hours_delete_policy" ON working_hours
FOR DELETE
TO authenticated
USING (
    salon_id = get_user_salon_id()
);

-- =====================================================
-- STEP 4: CREA I TRIGGER PER AUTO-IMPOSTARE SALON_ID
-- =====================================================

-- Trigger per impostare automaticamente salon_id durante l'inserimento
-- Riutilizza la funzione get_user_salon_id() già creata per orders
CREATE OR REPLACE FUNCTION set_working_hours_salon_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_salon_id UUID;
BEGIN
    -- Se salon_id non è già impostato, impostalo automaticamente
    IF NEW.salon_id IS NULL THEN
        user_salon_id := get_user_salon_id();
        
        -- Se non riusciamo a determinare il salon_id, non permettere l'inserimento
        IF user_salon_id IS NULL THEN
            RAISE EXCEPTION 'Impossibile determinare salon_id per l''utente corrente';
        END IF;
        
        NEW.salon_id := user_salon_id;
    END IF;
    
    -- Validazione aggiuntiva: team_member_id deve appartenere allo stesso salon
    IF NOT EXISTS (
        SELECT 1 FROM team 
        WHERE id = NEW.team_member_id 
        AND salon_id = NEW.salon_id
    ) THEN
        RAISE EXCEPTION 'Il team member specificato non appartiene al salon corrente';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crea il trigger che si attiva BEFORE INSERT
CREATE TRIGGER trigger_set_working_hours_salon_id
    BEFORE INSERT ON working_hours
    FOR EACH ROW
    EXECUTE FUNCTION set_working_hours_salon_id();

-- =====================================================
-- STEP 5: VALIDAZIONE UPDATE
-- =====================================================

-- Trigger per validazioni durante l'aggiornamento
CREATE OR REPLACE FUNCTION validate_working_hours_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifica che il team_member_id modificato appartenga ancora al salon corrente
    IF NEW.team_member_id != OLD.team_member_id THEN
        IF NOT EXISTS (
            SELECT 1 FROM team 
            WHERE id = NEW.team_member_id 
            AND salon_id = NEW.salon_id
        ) THEN
            RAISE EXCEPTION 'Il nuovo team member specificato non appartiene al salon corrente';
        END IF;
    END IF;
    
    -- Verifica che salon_id non venga cambiato
    IF NEW.salon_id != OLD.salon_id THEN
        RAISE EXCEPTION 'Non è possibile cambiare salon_id per un orario di lavoro esistente';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crea il trigger che si attiva BEFORE UPDATE
CREATE TRIGGER trigger_validate_working_hours_update
    BEFORE UPDATE ON working_hours
    FOR EACH ROW
    EXECUTE FUNCTION validate_working_hours_update();

-- =====================================================
-- STEP 6: VERIFICA CHE RLS SIA ABILITATO
-- =====================================================

-- Verifica che RLS sia abilitato
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'working_hours' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'ATTENZIONE: RLS non è abilitato su working_hours. Eseguire: ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;';
    ELSE
        RAISE NOTICE 'RLS è correttamente abilitato sulla tabella working_hours';
    END IF;
END $$;

-- =====================================================
-- STEP 7: TEST DI VERIFICA (OPZIONALE)
-- =====================================================

-- Test rapido per verificare che le policy funzionino
DO $$
DECLARE
    my_salon_id UUID;
    working_hours_count INTEGER;
BEGIN
    -- Verifica che possiamo ottenere il salon_id
    my_salon_id := get_user_salon_id();
    
    IF my_salon_id IS NULL THEN
        RAISE NOTICE 'ATTENZIONE: get_user_salon_id() restituisce NULL. Verifica che l''utente sia in profiles o team.';
    ELSE
        RAISE NOTICE 'SUCCESS: salon_id trovato: %', my_salon_id;
        
        -- Conta gli orari di lavoro visibili
        SELECT COUNT(*) INTO working_hours_count FROM working_hours;
        RAISE NOTICE 'Orari di lavoro visibili con le nuove policy: %', working_hours_count;
    END IF;
END $$;

-- =====================================================
-- AGGIORNAMENTO COMPLETATO
-- =====================================================

SELECT 'Policy RLS per working_hours create con successo!' as status;
