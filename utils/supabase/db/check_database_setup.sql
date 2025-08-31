-- Script per verificare la configurazione completa del database

-- 1. Verifica tabelle principali
SELECT '=== TABELLE PRINCIPALI ===' as section;

SELECT 
    'profiles' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') 
         THEN 'ESISTE' ELSE 'NON ESISTE' END as status,
    (SELECT COUNT(*)::text FROM profiles) as record_count
UNION ALL
SELECT 
    'team' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team') 
         THEN 'ESISTE' ELSE 'NON ESISTE' END as status,
    (SELECT COUNT(*)::text FROM team) as record_count
UNION ALL
SELECT 
    'holiday_balances' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'holiday_balances') 
         THEN 'ESISTE' ELSE 'NON ESISTE' END as status,
    (SELECT COUNT(*)::text FROM holiday_balances) as record_count
UNION ALL
SELECT 
    'permessiferie' as table_name,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permessiferie') 
         THEN 'ESISTE' ELSE 'NON ESISTE' END as status,
    (SELECT COUNT(*)::text FROM permessiferie) as record_count;

-- 2. Verifica profili con salon_id
SELECT '=== PROFILI CON SALON_ID ===' as section;

SELECT 
    'Profili totali' as check_item,
    (SELECT COUNT(*)::text FROM profiles) as count
UNION ALL
SELECT 
    'Profili con salon_id' as check_item,
    (SELECT COUNT(*)::text FROM profiles WHERE salon_id IS NOT NULL) as count
UNION ALL
SELECT 
    'Profili senza salon_id' as check_item,
    (SELECT COUNT(*)::text FROM profiles WHERE salon_id IS NULL) as count;

-- 3. Verifica membri team
SELECT '=== MEMBRI TEAM ===' as section;

SELECT 
    'Membri team totali' as check_item,
    (SELECT COUNT(*)::text FROM team) as count
UNION ALL
SELECT 
    'Membri con salon_id' as check_item,
    (SELECT COUNT(*)::text FROM team WHERE salon_id IS NOT NULL AND salon_id != '') as count
UNION ALL
SELECT 
    'Membri senza salon_id' as check_item,
    (SELECT COUNT(*)::text FROM team WHERE salon_id IS NULL OR salon_id = '') as count
UNION ALL
SELECT 
    'Membri attivi' as check_item,
    (SELECT COUNT(*)::text FROM team WHERE is_active = true) as count;

-- 4. Verifica funzioni
SELECT '=== FUNZIONI ===' as section;

SELECT 
    'update_holiday_balances_updated_at' as function_name,
    CASE WHEN EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_holiday_balances_updated_at'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END as status
UNION ALL
SELECT 
    'validate_holiday_balance_salon_id' as function_name,
    CASE WHEN EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'validate_holiday_balance_salon_id'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END as status
UNION ALL
SELECT 
    'calculate_holiday_used_days' as function_name,
    CASE WHEN EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'calculate_holiday_used_days'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END as status;

-- 5. Verifica trigger
SELECT '=== TRIGGER ===' as section;

SELECT 
    'trigger_update_holiday_balances_updated_at' as trigger_name,
    CASE WHEN EXISTS (
        SELECT FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'holiday_balances'
        AND t.tgname = 'trigger_update_holiday_balances_updated_at'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END as status
UNION ALL
SELECT 
    'trigger_validate_holiday_balance_salon_id' as trigger_name,
    CASE WHEN EXISTS (
        SELECT FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'holiday_balances'
        AND t.tgname = 'trigger_validate_holiday_balance_salon_id'
    ) THEN 'ESISTE' ELSE 'NON ESISTE' END as status;

-- 6. Esempi di dati
SELECT '=== ESEMPI DATI ===' as section;

SELECT 
    'Primi 3 profili' as example_type,
    string_agg(email || ' (' || COALESCE(salon_id::text, 'NULL') || ')', ', ') as data
FROM profiles 
LIMIT 3;

SELECT 
    'Primi 3 membri team' as example_type,
    string_agg(name || ' (' || COALESCE(salon_id::text, 'NULL') || ')', ', ') as data
FROM team 
LIMIT 3; 