-- Script semplice per verificare la configurazione di holiday_balances

-- Verifica esistenza tabella
SELECT 
    'Tabella holiday_balances' as check_item,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'holiday_balances') 
         THEN 'ESISTE' ELSE 'NON ESISTE' END as status;

-- Verifica esistenza funzioni
SELECT 
    'Funzione update_holiday_balances_updated_at' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_holiday_balances_updated_at'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END as status;

SELECT 
    'Funzione validate_holiday_balance_salon_id' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'validate_holiday_balance_salon_id'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END as status;

-- Verifica esistenza trigger
SELECT 
    'Trigger trigger_update_holiday_balances_updated_at' as check_item,
    CASE WHEN EXISTS (
        SELECT FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'holiday_balances'
        AND t.tgname = 'trigger_update_holiday_balances_updated_at'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END as status;

-- Verifica profili con salon_id
SELECT 
    'Profili con salon_id' as check_item,
    (SELECT COUNT(*)::text FROM profiles WHERE salon_id IS NOT NULL) as status;

-- Verifica membri team
SELECT 
    'Membri team totali' as check_item,
    (SELECT COUNT(*)::text FROM team) as status;

-- Verifica membri con salon_id valido
SELECT 
    'Membri con salon_id valido' as check_item,
    (SELECT COUNT(*)::text FROM team WHERE salon_id IS NOT NULL) as status;

-- Mostra alcuni membri di esempio
SELECT 
    'Esempio membri' as check_item,
    string_agg(name || ' (' || COALESCE(salon_id::text, 'NULL') || ')', ', ') as status
FROM team 
LIMIT 3; 