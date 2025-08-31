-- Script per abilitare RLS e creare le policy per la tabella service_categories
-- Basato sul pattern utilizzato per orders, profiles e services

-- =====================================================
-- STEP 1: ABILITA RLS SULLA TABELLA SERVICE_CATEGORIES
-- =====================================================

-- Abilita Row Level Security sulla tabella service_categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: RIMUOVI EVENTUALI POLICY ESISTENTI
-- =====================================================

-- Rimuovi tutte le policy esistenti per service_categories (se esistono)
DROP POLICY IF EXISTS "service_categories_select_policy" ON service_categories;
DROP POLICY IF EXISTS "service_categories_insert_policy" ON service_categories;
DROP POLICY IF EXISTS "service_categories_update_policy" ON service_categories;
DROP POLICY IF EXISTS "service_categories_delete_policy" ON service_categories;

-- Rimuovi eventuali trigger esistenti per service_categories
DROP TRIGGER IF EXISTS trigger_set_service_category_salon_id ON service_categories;
DROP FUNCTION IF EXISTS set_service_category_salon_id();

-- =====================================================
-- STEP 3: CREA LE POLICY RLS
-- =====================================================

-- Policy per SELECT: permette di vedere le categorie di servizi del proprio salone
CREATE POLICY "service_categories_select_policy" ON service_categories
FOR SELECT
TO authenticated
USING (
    salon_id = get_user_salon_id()
);

-- Policy per INSERT: permette di creare categorie di servizi nel proprio salone
CREATE POLICY "service_categories_insert_policy" ON service_categories
FOR INSERT
TO authenticated
WITH CHECK (
    -- Permetti insert se salon_id corrisponde al salon_id dell'utente
    salon_id = get_user_salon_id()
    OR 
    -- Oppure se salon_id è NULL (verrà impostato dal trigger automaticamente)
    salon_id IS NULL
);

-- Policy per UPDATE: permette di modificare le categorie di servizi del proprio salone
CREATE POLICY "service_categories_update_policy" ON service_categories
FOR UPDATE
TO authenticated
USING (
    salon_id = get_user_salon_id()
)
WITH CHECK (
    salon_id = get_user_salon_id()
);

-- Policy per DELETE: permette di eliminare le categorie di servizi del proprio salone
CREATE POLICY "service_categories_delete_policy" ON service_categories
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
CREATE OR REPLACE FUNCTION set_service_category_salon_id()
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
CREATE TRIGGER trigger_set_service_category_salon_id
    BEFORE INSERT ON service_categories
    FOR EACH ROW
    EXECUTE FUNCTION set_service_category_salon_id();

-- =====================================================
-- STEP 5: VERIFICA CHE RLS SIA ABILITATO
-- =====================================================

-- Verifica che RLS sia abilitato
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'service_categories' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'ATTENZIONE: RLS non è abilitato su service_categories. Eseguire: ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;';
    ELSE
        RAISE NOTICE 'RLS è correttamente abilitato sulla tabella service_categories';
    END IF;
END $$;

-- =====================================================
-- STEP 6: TEST DI VERIFICA (OPZIONALE)
-- =====================================================

-- Test rapido per verificare che le policy funzionino
DO $$
DECLARE
    my_salon_id UUID;
    category_count INTEGER;
BEGIN
    -- Verifica che possiamo ottenere il salon_id
    my_salon_id := get_user_salon_id();
    
    IF my_salon_id IS NULL THEN
        RAISE NOTICE 'ATTENZIONE: get_user_salon_id() restituisce NULL. Verifica che l''utente sia in profiles o team.';
    ELSE
        RAISE NOTICE 'SUCCESS: salon_id trovato: %', my_salon_id;
        
        -- Conta le categorie di servizi visibili
        SELECT COUNT(*) INTO category_count FROM service_categories;
        RAISE NOTICE 'Categorie di servizi visibili con le nuove policy: %', category_count;
    END IF;
END $$;

-- =====================================================
-- AGGIORNAMENTO COMPLETATO
-- =====================================================

SELECT 'Policy RLS per service_categories create con successo!' as status;
