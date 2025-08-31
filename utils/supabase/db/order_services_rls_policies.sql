-- RLS Policies per la tabella order_services
-- Questo script abilita Row Level Security sulla tabella order_services
-- e crea le policy necessarie per l'isolamento dei dati per salon_id

-- =====================================================
-- ABILITA ROW LEVEL SECURITY
-- =====================================================

-- Abilita RLS sulla tabella order_services
ALTER TABLE order_services ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNZIONE HELPER ESISTENTE
-- =====================================================

-- Utilizza la funzione get_user_salon_id() già creata per la tabella orders
-- Se non esiste, eseguire prima il file orders_rls_policies.sql

-- =====================================================
-- POLICY PER SELECT
-- =====================================================

-- Policy per SELECT: permette di vedere i servizi degli ordini del proprio salone
-- Utilizza il join con la tabella orders per ottenere il salon_id
CREATE POLICY "order_services_select_policy" ON order_services
FOR SELECT
TO authenticated
USING (
    -- Permetti accesso se l'ordine associato appartiene al salon dell'utente
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_services.order_id 
        AND orders.salon_id = get_user_salon_id()
    )
    OR
    -- Oppure se il customer_uuid appartiene a un cliente del salon dell'utente
    EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = order_services.customer_uuid 
        AND customers.salon_id = get_user_salon_id()
    )
);

-- =====================================================
-- POLICY PER INSERT
-- =====================================================

-- Policy per INSERT: permette di creare servizi per ordini del proprio salone
CREATE POLICY "order_services_insert_policy" ON order_services
FOR INSERT
TO authenticated
WITH CHECK (
    -- Permetti insert solo se l'ordine associato appartiene al salon dell'utente
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_services.order_id 
        AND orders.salon_id = get_user_salon_id()
    )
    AND
    -- E se il customer_uuid (se specificato) appartiene al salon dell'utente
    (
        order_services.customer_uuid IS NULL 
        OR
        EXISTS (
            SELECT 1 FROM customers 
            WHERE customers.id = order_services.customer_uuid 
            AND customers.salon_id = get_user_salon_id()
        )
    )
);

-- =====================================================
-- POLICY PER UPDATE
-- =====================================================

-- Policy per UPDATE: permette di modificare i servizi degli ordini del proprio salone
CREATE POLICY "order_services_update_policy" ON order_services
FOR UPDATE
TO authenticated
USING (
    -- Controllo esistente: il record deve appartenere al salon dell'utente
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_services.order_id 
        AND orders.salon_id = get_user_salon_id()
    )
)
WITH CHECK (
    -- Controllo nuovo: il record aggiornato deve ancora appartenere al salon dell'utente
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_services.order_id 
        AND orders.salon_id = get_user_salon_id()
    )
    AND
    -- E se il customer_uuid (se specificato) appartiene al salon dell'utente
    (
        order_services.customer_uuid IS NULL 
        OR
        EXISTS (
            SELECT 1 FROM customers 
            WHERE customers.id = order_services.customer_uuid 
            AND customers.salon_id = get_user_salon_id()
        )
    )
);

-- =====================================================
-- POLICY PER DELETE
-- =====================================================

-- Policy per DELETE: permette di eliminare i servizi degli ordini del proprio salone
CREATE POLICY "order_services_delete_policy" ON order_services
FOR DELETE
TO authenticated
USING (
    -- Permetti delete solo se l'ordine associato appartiene al salon dell'utente
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_services.order_id 
        AND orders.salon_id = get_user_salon_id()
    )
);

-- =====================================================
-- VERIFICA CONFIGURAZIONE
-- =====================================================

-- Verifica che RLS sia abilitato correttamente
DO $$
BEGIN
    -- Controlla se RLS è abilitato su order_services
    IF EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'order_services' 
        AND relrowsecurity = true
    ) THEN
        RAISE NOTICE 'RLS abilitato correttamente su order_services';
    ELSE
        RAISE NOTICE 'ERRORE: RLS non abilitato su order_services';
    END IF;
    
    -- Verifica che la funzione get_user_salon_id esista
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_user_salon_id'
    ) THEN
        RAISE NOTICE 'Funzione get_user_salon_id trovata';
    ELSE
        RAISE NOTICE 'ATTENZIONE: Funzione get_user_salon_id non trovata. Eseguire prima orders_rls_policies.sql';
    END IF;
END $$;

-- =====================================================
-- TEST PER VERIFICARE LE POLICY (ESEGUI CON CAUTELA)
-- =====================================================

/*
-- Test 1: Verifica il tuo salon_id
SELECT get_user_salon_id() as my_salon_id;

-- Test 2: SELECT - dovrebbe restituire solo i servizi degli ordini del tuo salone
SELECT 
    os.id,
    os.order_id,
    os.servizio,
    os.price,
    o.salon_id,
    o.nome as cliente_nome
FROM order_services os
JOIN orders o ON o.id = os.order_id
ORDER BY os.id DESC
LIMIT 10;

-- Test 3: Conta i servizi per salon_id (dovrebbe mostrare solo il tuo)
SELECT 
    o.salon_id,
    COUNT(os.id) as total_services
FROM order_services os
JOIN orders o ON o.id = os.order_id
GROUP BY o.salon_id;

-- Test 4: Verifica che non vedi servizi di altri saloni
-- (Questo dovrebbe essere vuoto se RLS funziona)
SELECT 
    os.id,
    o.salon_id,
    os.servizio
FROM order_services os
JOIN orders o ON o.id = os.order_id
WHERE o.salon_id != get_user_salon_id();

-- Test 5: Test INSERT - crea un ordine di test e aggiungi un servizio
INSERT INTO orders (
    user_id, nome, telefono, data, "orarioInizio", prezzo, status
) VALUES (
    auth.uid(), 'Test Cliente RLS', '1234567890', CURRENT_DATE, '10:00', 50.00, 'In corso'
) RETURNING id;

-- Usa l'ID dell'ordine dal test precedente per inserire un servizio
-- INSERT INTO order_services (order_id, service_id, price, servizio)
-- VALUES ('INSERISCI_ORDER_ID_QUI', 1, 25.00, 'Test Servizio RLS');

-- Test 6: Pulizia - rimuovi i dati di test
-- DELETE FROM order_services WHERE servizio = 'Test Servizio RLS';
-- DELETE FROM orders WHERE nome = 'Test Cliente RLS';
*/
