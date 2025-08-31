-- =====================================================
-- VERIFICA INSTALLAZIONE SISTEMA PAGINE WEB SALONI
-- =====================================================

-- 1. Verifica che tutte le tabelle siano state create
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'salon_web_settings',
        'salon_galleries', 
        'salon_testimonials', 
        'web_bookings', 
        'web_contact_messages', 
        'web_analytics'
    ];
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    current_table TEXT;
BEGIN
    RAISE NOTICE 'Verifica tabelle...';
    
    FOREACH current_table IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = current_table
        ) THEN
            missing_tables := array_append(missing_tables, current_table);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) IS NULL THEN
        RAISE NOTICE '✅ Tutte le tabelle sono state create correttamente';
    ELSE
        RAISE NOTICE '❌ Tabelle mancanti: %', array_to_string(missing_tables, ', ');
    END IF;
END $$;

-- 2. Verifica che tutte le funzioni siano state create
DO $$
DECLARE
    function_count INTEGER;
    expected_functions TEXT[] := ARRAY[
        'enable_salon_web_page',
        'disable_salon_web_page',
        'update_salon_web_settings',
        'add_salon_gallery',
        'add_salon_testimonial',
        'record_page_visit',
        'get_salon_web_stats',
        'generate_unique_subdomain',
        'get_salon_name'
    ];
    missing_functions TEXT[] := ARRAY[]::TEXT[];
    current_function TEXT;
BEGIN
    RAISE NOTICE 'Verifica funzioni...';
    
    FOREACH current_function IN ARRAY expected_functions
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = current_function
        ) THEN
            missing_functions := array_append(missing_functions, current_function);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) IS NULL THEN
        RAISE NOTICE '✅ Tutte le funzioni sono state create correttamente';
    ELSE
        RAISE NOTICE '❌ Funzioni mancanti: %', array_to_string(missing_functions, ', ');
    END IF;
END $$;

-- 3. Verifica che tutti gli indici siano stati creati
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%web%' OR indexname LIKE 'idx_salon_%';
    
    IF index_count >= 20 THEN
        RAISE NOTICE '✅ Tutti gli indici sono stati creati correttamente (% totali)', index_count;
    ELSE
        RAISE NOTICE '❌ Mancano alcuni indici. Trovati: %', index_count;
    END IF;
END $$;

-- 4. Verifica che tutti i trigger siano stati creati
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND trigger_name LIKE '%updated_at%';
    
    IF trigger_count >= 5 THEN
        RAISE NOTICE '✅ Tutti i trigger sono stati creati correttamente (% totali)', trigger_count;
    ELSE
        RAISE NOTICE '❌ Mancano alcuni trigger. Trovati: %', trigger_count;
    END IF;
END $$;

-- 5. Test di base delle funzioni
DO $$
DECLARE
    test_result JSON;
BEGIN
    RAISE NOTICE 'Test funzioni di base...';
    
    -- Test funzione generate_unique_subdomain
    BEGIN
        PERFORM generate_unique_subdomain('Test Salone');
        RAISE NOTICE '✅ generate_unique_subdomain funziona';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Errore in generate_unique_subdomain: %', SQLERRM;
    END;
    
    -- Test funzione get_salon_name
    BEGIN
        PERFORM get_salon_name(gen_random_uuid());
        RAISE NOTICE '✅ get_salon_name funziona';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Errore in get_salon_name: %', SQLERRM;
    END;
    
END $$;

-- 6. Riepilogo finale
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICA INSTALLAZIONE COMPLETATA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Se tutti i test sono passati, il sistema è pronto!';
    RAISE NOTICE '';
    RAISE NOTICE 'Prossimi passi:';
    RAISE NOTICE '1. Testare le funzioni con dati reali';
    RAISE NOTICE '2. Configurare il frontend';
    RAISE NOTICE '3. Testare le API routes';
    RAISE NOTICE '';
END $$; 