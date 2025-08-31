-- =====================================================
-- TEST TABELLA online_bookings
-- =====================================================
-- Verifica la struttura e aggiunge dati di test

-- 1. Verifica la struttura della tabella
DO $$
BEGIN
    RAISE NOTICE '=== STRUTTURA TABELLA online_bookings ===';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'online_bookings'
ORDER BY ordinal_position;

-- 2. Verifica gli indici
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== INDICI TABELLA online_bookings ===';
END $$;

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'online_bookings';

-- 3. Verifica i trigger
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TRIGGER TABELLA online_bookings ===';
END $$;

SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'online_bookings';

-- 4. Inserisci dati di test (solo se la tabella è vuota)
DO $$
DECLARE
    booking_count INTEGER;
    salon_id UUID;
BEGIN
    -- Conta le prenotazioni esistenti
    SELECT COUNT(*) INTO booking_count FROM online_bookings;
    
    -- Se non ci sono prenotazioni, inserisci dati di test
    IF booking_count = 0 THEN
        RAISE NOTICE 'Inserimento dati di test...';
        
        -- Ottieni un salon_id di esempio
        SELECT id INTO salon_id FROM profiles LIMIT 1;
        
        IF salon_id IS NOT NULL THEN
            -- Inserisci prenotazioni di test
            INSERT INTO online_bookings (
                salon_id,
                customer_name,
                customer_email,
                customer_phone,
                requested_date,
                requested_time,
                booking_date,
                start_time,
                end_time,
                service_id,
                service_name,
                service_duration,
                service_price,
                team_member_id,
                status,
                notes,
                ip_address,
                user_agent
            ) VALUES 
            (
                salon_id,
                'Mario Rossi',
                'mario.rossi@email.com',
                '+39 123 456 7890',
                CURRENT_DATE + INTERVAL '1 day',
                '10:00',
                CURRENT_DATE,
                '10:00',
                '11:00',
                1,
                'Taglio e Piega',
                60,
                35.00,
                NULL,
                'pending',
                'Cliente nuovo, preferisce orari mattutini',
                '192.168.1.1',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ),
            (
                salon_id,
                'Giulia Bianchi',
                'giulia.bianchi@email.com',
                '+39 987 654 3210',
                CURRENT_DATE + INTERVAL '2 days',
                '14:30',
                CURRENT_DATE,
                '14:30',
                '15:30',
                2,
                'Colore e Taglio',
                60,
                65.00,
                NULL,
                'confirmed',
                'Cliente abituale, vuole mantenere il colore attuale',
                '192.168.1.2',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
            ),
            (
                salon_id,
                'Luca Verdi',
                'luca.verdi@email.com',
                '+39 555 123 4567',
                CURRENT_DATE + INTERVAL '3 days',
                '16:00',
                CURRENT_DATE,
                '16:00',
                '17:00',
                3,
                'Barba e Taglio',
                60,
                25.00,
                NULL,
                'pending',
                'Prima volta, taglio classico',
                '192.168.1.3',
                'Mozilla/5.0 (Android 10; Mobile)'
            );
            
            RAISE NOTICE '✅ Dati di test inseriti con successo!';
        ELSE
            RAISE NOTICE '⚠️ Nessun salon_id trovato per inserire i dati di test';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ La tabella contiene già % prenotazioni, saltando inserimento dati di test', booking_count;
    END IF;
END $$;

-- 5. Verifica finale
DO $$
DECLARE
    total_bookings INTEGER;
    pending_bookings INTEGER;
    confirmed_bookings INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_bookings FROM online_bookings;
    SELECT COUNT(*) INTO pending_bookings FROM online_bookings WHERE status = 'pending';
    SELECT COUNT(*) INTO confirmed_bookings FROM online_bookings WHERE status = 'confirmed';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== STATISTICHE FINALI ===';
    RAISE NOTICE 'Totale prenotazioni: %', total_bookings;
    RAISE NOTICE 'Prenotazioni in attesa: %', pending_bookings;
    RAISE NOTICE 'Prenotazioni confermate: %', confirmed_bookings;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Test completato con successo!';
    RAISE NOTICE 'Ora puoi testare la pagina Prenotazioni Online nel dashboard.';
END $$; 