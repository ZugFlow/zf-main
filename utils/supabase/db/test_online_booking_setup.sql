-- =====================================================
-- TEST SETUP SISTEMA PRENOTAZIONI ONLINE
-- =====================================================

-- 1. Verifica che le tabelle esistano
DO $$
BEGIN
    -- Verifica online_booking_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_booking_settings') THEN
        RAISE NOTICE '✅ Tabella online_booking_settings esiste';
    ELSE
        RAISE NOTICE '❌ Tabella online_booking_settings NON esiste';
    END IF;

    -- Verifica online_bookings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_bookings') THEN
        RAISE NOTICE '✅ Tabella online_bookings esiste';
    ELSE
        RAISE NOTICE '❌ Tabella online_bookings NON esiste';
    END IF;
END $$;

-- 2. Verifica che le funzioni esistano
DO $$
BEGIN
    -- Verifica sync_online_booking_fields
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_online_booking_fields') THEN
        RAISE NOTICE '✅ Funzione sync_online_booking_fields esiste';
    ELSE
        RAISE NOTICE '❌ Funzione sync_online_booking_fields NON esiste';
    END IF;

    -- Verifica update_updated_at_column
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE NOTICE '✅ Funzione update_updated_at_column esiste';
    ELSE
        RAISE NOTICE '❌ Funzione update_updated_at_column NON esiste';
    END IF;
END $$;

-- 3. Verifica che i trigger esistano
DO $$
BEGIN
    -- Verifica trigger per online_booking_settings
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_online_booking_settings_updated_at') THEN
        RAISE NOTICE '✅ Trigger update_online_booking_settings_updated_at esiste';
    ELSE
        RAISE NOTICE '❌ Trigger update_online_booking_settings_updated_at NON esiste';
    END IF;

    -- Verifica trigger per online_bookings
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_online_booking_fields_trigger') THEN
        RAISE NOTICE '✅ Trigger sync_online_booking_fields_trigger esiste';
    ELSE
        RAISE NOTICE '❌ Trigger sync_online_booking_fields_trigger NON esiste';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_online_bookings_updated_at') THEN
        RAISE NOTICE '✅ Trigger update_online_bookings_updated_at esiste';
    ELSE
        RAISE NOTICE '❌ Trigger update_online_bookings_updated_at NON esiste';
    END IF;
END $$;

-- 4. Verifica che ci siano impostazioni per i saloni
SELECT 
    COUNT(*) as total_settings,
    COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_settings
FROM online_booking_settings;

-- 5. Verifica la struttura delle tabelle
-- online_booking_settings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'online_booking_settings'
ORDER BY ordinal_position;

-- online_bookings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'online_bookings'
ORDER BY ordinal_position;

-- 6. Test inserimento impostazioni per un salone di test
DO $$
DECLARE
    test_salon_id UUID;
BEGIN
    -- Trova un salone esistente
    SELECT salon_id INTO test_salon_id 
    FROM profiles 
    WHERE salon_id IS NOT NULL 
    LIMIT 1;
    
    IF test_salon_id IS NOT NULL THEN
        -- Inserisci o aggiorna impostazioni di test
        INSERT INTO online_booking_settings (
            salon_id, 
            enabled, 
            require_approval, 
            auto_confirm,
            min_notice_hours,
            max_days_ahead,
            slot_duration,
            booking_start_time,
            booking_end_time,
            allow_same_day_booking,
            max_bookings_per_day
        ) VALUES (
            test_salon_id,
            true,
            false,
            true,
            1,
            30,
            15,
            '09:00',
            '18:00',
            true,
            20
        ) ON CONFLICT (salon_id) DO UPDATE SET
            enabled = EXCLUDED.enabled,
            require_approval = EXCLUDED.require_approval,
            auto_confirm = EXCLUDED.auto_confirm,
            min_notice_hours = EXCLUDED.min_notice_hours,
            max_days_ahead = EXCLUDED.max_days_ahead,
            slot_duration = EXCLUDED.slot_duration,
            booking_start_time = EXCLUDED.booking_start_time,
            booking_end_time = EXCLUDED.booking_end_time,
            allow_same_day_booking = EXCLUDED.allow_same_day_booking,
            max_bookings_per_day = EXCLUDED.max_bookings_per_day;
            
        RAISE NOTICE '✅ Impostazioni di test inserite per salone: %', test_salon_id;
    ELSE
        RAISE NOTICE '❌ Nessun salone trovato per il test';
    END IF;
END $$;

-- 7. Verifica finale
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICA FINALE SETUP ===';
    RAISE NOTICE 'Se tutti i controlli precedenti mostrano ✅, il setup è completo';
    RAISE NOTICE 'Se ci sono ❌, esegui lo script setup_online_booking_complete.sql';
END $$; 