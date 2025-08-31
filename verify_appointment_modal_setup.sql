-- Script di verifica per il sistema di personalizzazione modal appuntamento
-- Esegui questo script per verificare che tutto sia configurato correttamente

-- =====================================================
-- 1. VERIFICA STRUTTURA DATABASE
-- =====================================================

-- Verifica che la tabella appointment_modal_settings esista
SELECT 
    'appointment_modal_settings table exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'appointment_modal_settings'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- Verifica la struttura della tabella
SELECT 
    'appointment_modal_settings structure' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'appointment_modal_settings'
            AND column_name = 'salon_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'appointment_modal_settings'
            AND column_name = 'modal_title'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- =====================================================
-- 2. VERIFICA FOREIGN KEY
-- =====================================================

-- Verifica che la foreign key sia configurata correttamente
SELECT 
    'foreign key to profiles(salon_id)' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'appointment_modal_settings'
            AND ccu.table_name = 'profiles'
            AND ccu.column_name = 'salon_id'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- =====================================================
-- 3. VERIFICA INDICI
-- =====================================================

-- Verifica che gli indici esistano
SELECT 
    'index on salon_id exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'appointment_modal_settings'
            AND indexname = 'idx_appointment_modal_settings_salon_id'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- =====================================================
-- 4. VERIFICA TRIGGER
-- =====================================================

-- Verifica che il trigger per updated_at esista
SELECT 
    'updated_at trigger exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'trigger_update_appointment_modal_settings_updated_at'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- =====================================================
-- 5. VERIFICA DATI
-- =====================================================

-- Conta i record di impostazioni
SELECT 
    'settings records count' as check_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM appointment_modal_settings) > 0 THEN '✅ PASS'
        ELSE '❌ FAIL - No settings records found'
    END as result,
    (SELECT COUNT(*) FROM appointment_modal_settings) as count;

-- Verifica che ogni profilo abbia le impostazioni
SELECT 
    'profiles with settings' as check_name,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM profiles p
            LEFT JOIN appointment_modal_settings ams ON p.salon_id = ams.salon_id
            WHERE p.salon_id IS NOT NULL AND ams.salon_id IS NULL
        ) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL - Some profiles missing settings'
    END as result,
    (
        SELECT COUNT(*) 
        FROM profiles p
        LEFT JOIN appointment_modal_settings ams ON p.salon_id = ams.salon_id
        WHERE p.salon_id IS NOT NULL AND ams.salon_id IS NULL
    ) as missing_count;

-- =====================================================
-- 6. VERIFICA VALORI DI DEFAULT
-- =====================================================

-- Verifica che i valori di default siano impostati correttamente
SELECT 
    'default modal title' as check_name,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM appointment_modal_settings 
            WHERE modal_title = 'Nuovo Appuntamento'
        ) > 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- Verifica che le funzionalità di default siano abilitate
SELECT 
    'default features enabled' as check_name,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM appointment_modal_settings 
            WHERE enable_client_search = true 
            AND enable_service_selection = true
        ) > 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- =====================================================
-- 7. VERIFICA RLS (Row Level Security)
-- =====================================================

-- Verifica se RLS è abilitato
SELECT 
    'RLS enabled' as check_name,
    CASE 
        WHEN (
            SELECT relrowsecurity 
            FROM pg_class 
            WHERE relname = 'appointment_modal_settings'
        ) THEN '✅ PASS'
        ELSE '⚠️ WARNING - RLS not enabled'
    END as result;

-- =====================================================
-- 8. REPORT COMPLETO
-- =====================================================

-- Report completo delle impostazioni
SELECT 
    'COMPLETE SETUP REPORT' as report_type,
    p.name as salon_name,
    p.salon_id,
    ams.modal_title,
    ams.enable_client_search,
    ams.enable_service_selection,
    ams.enable_multiple_services,
    ams.primary_color,
    ams.created_at,
    ams.updated_at
FROM profiles p
LEFT JOIN appointment_modal_settings ams ON p.salon_id = ams.salon_id
WHERE p.salon_id IS NOT NULL
ORDER BY p.name;

-- =====================================================
-- 9. RACCOMANDAZIONI
-- =====================================================

-- Mostra raccomandazioni per il completamento del setup
SELECT 
    'SETUP RECOMMENDATIONS' as recommendation_type,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'trigger_update_appointment_modal_settings_updated_at'
        ) THEN 'Create updated_at trigger'
        WHEN (
            SELECT COUNT(*) 
            FROM profiles p
            LEFT JOIN appointment_modal_settings ams ON p.salon_id = ams.salon_id
            WHERE p.salon_id IS NOT NULL AND ams.salon_id IS NULL
        ) > 0 THEN 'Create missing settings for profiles'
        WHEN NOT (
            SELECT relrowsecurity 
            FROM pg_class 
            WHERE relname = 'appointment_modal_settings'
        ) THEN 'Enable RLS and create policies'
        ELSE 'Setup is complete!'
    END as recommendation;
