-- Script per AGGIORNARE le policy RLS della tabella orders
-- Esegui questo script per sostituire le policy vecchie con quelle corrette

-- =====================================================
-- STEP 1: RIMUOVI LE POLICY ESISTENTI
-- =====================================================

-- Rimuovi tutte le policy esistenti per orders
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON orders;

-- Rimuovi la funzione get_user_salon_id se esiste (per ricrearla aggiornata)
DROP FUNCTION IF EXISTS get_user_salon_id();

-- Rimuovi i trigger esistenti per orders
DROP TRIGGER IF EXISTS trigger_set_order_salon_id ON orders;
DROP FUNCTION IF EXISTS set_order_salon_id();

-- =====================================================
-- STEP 2: RICREA LA FUNZIONE HELPER AGGIORNATA
-- =====================================================

-- Funzione helper per recuperare il salon_id dell'utente corrente
-- Questa funzione replica la logica di getSalonId.ts in SQL
CREATE OR REPLACE FUNCTION get_user_salon_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_salon_id UUID;
BEGIN
    -- Ottieni l'ID dell'utente corrente
    current_user_id := auth.uid();
    
    -- Se non c'è un utente autenticato, restituisci NULL
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Prima cerca in profiles (per manager)
    SELECT salon_id INTO user_salon_id
    FROM profiles
    WHERE id = current_user_id;
    
    -- Se trovato in profiles, restituiscilo
    IF user_salon_id IS NOT NULL THEN
        RETURN user_salon_id;
    END IF;
    
    -- Se non trovato in profiles, cerca in team (per collaboratori)
    SELECT salon_id INTO user_salon_id
    FROM team
    WHERE user_id = current_user_id
    AND is_active = true;
    
    RETURN user_salon_id;
END;
$$;

-- =====================================================
-- STEP 3: CREA LE POLICY CORRETTE
-- =====================================================

-- Policy per SELECT: permette di vedere gli ordini del proprio salone
CREATE POLICY "orders_select_policy" ON orders
FOR SELECT
TO authenticated
USING (
    salon_id = get_user_salon_id()
);

-- Policy per INSERT: permette di creare ordini nel proprio salone
CREATE POLICY "orders_insert_policy" ON orders
FOR INSERT
TO authenticated
WITH CHECK (
    -- Permetti insert se salon_id corrisponde al salon_id dell'utente
    salon_id = get_user_salon_id()
    OR 
    -- Oppure se salon_id è NULL (verrà impostato dal trigger automaticamente)
    salon_id IS NULL
);

-- Policy per UPDATE: permette di modificare gli ordini del proprio salone
CREATE POLICY "orders_update_policy" ON orders
FOR UPDATE
TO authenticated
USING (
    salon_id = get_user_salon_id()
)
WITH CHECK (
    salon_id = get_user_salon_id()
);

-- Policy per DELETE: permette di eliminare gli ordini del proprio salone
CREATE POLICY "orders_delete_policy" ON orders
FOR DELETE
TO authenticated
USING (
    salon_id = get_user_salon_id()
);

-- =====================================================
-- STEP 4: RICREA I TRIGGER AGGIORNATI
-- =====================================================

-- Trigger per impostare automaticamente salon_id durante l'inserimento
CREATE OR REPLACE FUNCTION set_order_salon_id()
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
CREATE TRIGGER trigger_set_order_salon_id
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_salon_id();

-- =====================================================
-- STEP 5: VERIFICA CHE RLS SIA ABILITATO
-- =====================================================

-- Verifica che RLS sia abilitato (dovrebbe già essere abilitato)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'ATTENZIONE: RLS non è abilitato su orders. Eseguire: ALTER TABLE orders ENABLE ROW LEVEL SECURITY;';
    ELSE
        RAISE NOTICE 'RLS è correttamente abilitato sulla tabella orders';
    END IF;
END $$;

-- =====================================================
-- STEP 6: TEST DI VERIFICA (OPZIONALE)
-- =====================================================

-- Test rapido per verificare che le policy funzionino
DO $$
DECLARE
    my_salon_id UUID;
    order_count INTEGER;
BEGIN
    -- Verifica che possiamo ottenere il salon_id
    my_salon_id := get_user_salon_id();
    
    IF my_salon_id IS NULL THEN
        RAISE NOTICE 'ATTENZIONE: get_user_salon_id() restituisce NULL. Verifica che l''utente sia in profiles o team.';
    ELSE
        RAISE NOTICE 'SUCCESS: salon_id trovato: %', my_salon_id;
        
        -- Conta gli ordini visibili
        SELECT COUNT(*) INTO order_count FROM orders;
        RAISE NOTICE 'Ordini visibili con le nuove policy: %', order_count;
    END IF;
END $$;

-- =====================================================
-- AGGIORNAMENTO COMPLETATO
-- =====================================================

SELECT 'Policy RLS per orders aggiornate con successo!' as status;
