-- RLS Policies per la tabella orders
-- Questo script crea le policy necessarie per abilitare Row Level Security sulla tabella orders

-- Prima creiamo una funzione helper per recuperare il salon_id dell'utente corrente
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

-- Policy per SELECT: permette di vedere gli ordini del proprio salone
CREATE POLICY "orders_select_policy" ON orders
FOR SELECT
TO authenticated
USING (
    salon_id = get_user_salon_id()
);

-- Policy per INSERT: permette di creare ordini nel proprio salone
-- L'utente può inserire ordini solo se:
-- 1. È autenticato
-- 2. Il salon_id dell'ordine corrisponde al suo salon_id
-- 3. O se il salon_id non è specificato, viene automaticamente impostato al suo salon_id
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

-- Trigger per impostare automaticamente salon_id durante l'inserimento
-- se non è già specificato
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

-- Verifica che RLS sia abilitato
-- (Questo comando fallirà se RLS non è già abilitato, ma è un reminder)
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- TESTS PER VERIFICARE LE POLICY (ESEGUI CON CAUTELA)
/*
-- Test 1: SELECT - dovrebbe restituire solo gli ordini del tuo salone
SELECT COUNT(*), salon_id FROM orders GROUP BY salon_id;

-- Test 2: Verifica il tuo salon_id
SELECT get_user_salon_id() as my_salon_id;

-- Test 3: INSERT - dovrebbe funzionare (salon_id impostato automaticamente)
INSERT INTO orders (
    user_id, nome, telefono, data, "orarioInizio", prezzo, status
) VALUES (
    auth.uid(), 'Test Cliente', '1234567890', CURRENT_DATE, '10:00', 50.00, 'In corso'
);

-- Test 4: UPDATE - dovrebbe funzionare solo sui tuoi ordini
UPDATE orders SET note = 'Test aggiornamento' WHERE nome = 'Test Cliente';

-- Test 5: DELETE - dovrebbe funzionare solo sui tuoi ordini  
DELETE FROM orders WHERE note = 'Test aggiornamento';

-- Test 6: Verifica che vedi solo gli ordini del tuo salone
SELECT id, nome, salon_id, booking_source, status 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Test 7: Prova a inserire con salon_id diverso (dovrebbe fallire)
-- INSERT INTO orders (user_id, nome, telefono, data, "orarioInizio", prezzo, status, salon_id)
-- VALUES (auth.uid(), 'Test Fail', '1234567890', CURRENT_DATE, '11:00', 60.00, 'In corso', gen_random_uuid());
*/
