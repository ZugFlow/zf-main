-- Script per abilitare RLS e creare le policy per la tabella services
-- Basato sul pattern utilizzato per orders e profiles

-- =====================================================
-- STEP 1: ABILITA RLS SULLA TABELLA SERVICES
-- =====================================================

-- Abilita Row Level Security sulla tabella services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: RIMUOVI EVENTUALI POLICY ESISTENTI
-- =====================================================

-- Rimuovi tutte le policy esistenti per services (se esistono)
DROP POLICY IF EXISTS "services_select_policy" ON services;
DROP POLICY IF EXISTS "services_insert_policy" ON services;
DROP POLICY IF EXISTS "services_update_policy" ON services;
DROP POLICY IF EXISTS "services_delete_policy" ON services;

-- Rimuovi eventuali trigger esistenti per services
DROP TRIGGER IF EXISTS trigger_set_service_salon_id ON services;
DROP FUNCTION IF EXISTS set_service_salon_id();

-- =====================================================
-- STEP 3: CREA LE POLICY RLS
-- =====================================================

-- Policy per SELECT: permette di vedere i servizi del proprio salone
CREATE POLICY "services_select_policy" ON services
FOR SELECT
TO authenticated
USING (
    salon_id = get_user_salon_id()
);

-- Policy per INSERT: permette di creare servizi nel proprio salone
CREATE POLICY "services_insert_policy" ON services
FOR INSERT
TO authenticated
WITH CHECK (
    -- Permetti insert se salon_id corrisponde al salon_id dell'utente
    salon_id = get_user_salon_id()
    OR 
    -- Oppure se salon_id è NULL (verrà impostato dal trigger automaticamente)
    salon_id IS NULL
);

-- Policy per UPDATE: permette di modificare i servizi del proprio salone
CREATE POLICY "services_update_policy" ON services
FOR UPDATE
TO authenticated
USING (
    salon_id = get_user_salon_id()
)
WITH CHECK (
    salon_id = get_user_salon_id()
);

-- Policy per DELETE: permette di eliminare i servizi del proprio salone
CREATE POLICY "services_delete_policy" ON services
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
CREATE OR REPLACE FUNCTION set_service_salon_id()
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
    
    RETURN NEW;
END;
$$;

-- Crea il trigger che si attiva BEFORE INSERT
CREATE TRIGGER trigger_set_service_salon_id
    BEFORE INSERT ON services
    FOR EACH ROW
    EXECUTE FUNCTION set_service_salon_id();

-- =====================================================
-- STEP 5: VERIFICA CHE RLS SIA ABILITATO
-- =====================================================

-- Verifica che RLS sia abilitato
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'services' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'ATTENZIONE: RLS non è abilitato su services. Eseguire: ALTER TABLE services ENABLE ROW LEVEL SECURITY;';
    ELSE
        RAISE NOTICE 'RLS è correttamente abilitato sulla tabella services';
    END IF;
END $$;

-- =====================================================
-- STEP 6: TEST DI VERIFICA (OPZIONALE)
-- =====================================================

-- Test rapido per verificare che le policy funzionino
DO $$
DECLARE
    my_salon_id UUID;
    service_count INTEGER;
BEGIN
    -- Verifica che possiamo ottenere il salon_id
    my_salon_id := get_user_salon_id();
    
    IF my_salon_id IS NULL THEN
        RAISE NOTICE 'ATTENZIONE: get_user_salon_id() restituisce NULL. Verifica che l''utente sia in profiles o team.';
    ELSE
        RAISE NOTICE 'SUCCESS: salon_id trovato: %', my_salon_id;
        
        -- Conta i servizi visibili
        SELECT COUNT(*) INTO service_count FROM services;
        RAISE NOTICE 'Servizi visibili con le nuove policy: %', service_count;
    END IF;
END $$;

-- =====================================================
-- AGGIORNAMENTO COMPLETATO
-- =====================================================

SELECT 'Policy RLS per services create con successo!' as status;
