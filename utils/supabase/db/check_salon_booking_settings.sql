-- =====================================================
-- CONTROLLO IMPOSTAZIONI PRENOTAZIONI PER SALONE SPECIFICO
-- =====================================================

-- Sostituisci con l'ID del salone che stai testando
DO $$
DECLARE
    target_salon_id UUID := 'f55fd6c2-4059-4920-9b04-a93938dffe59';
    settings_count INTEGER;
    settings_record RECORD;
    column_info RECORD;
BEGIN
    RAISE NOTICE '=== CONTROLLO IMPOSTAZIONI PRENOTAZIONI ===';
    RAISE NOTICE 'Salon ID: %', target_salon_id;
    
    -- 1. Verifica se la tabella esiste
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_booking_settings') THEN
        RAISE NOTICE '✅ Tabella online_booking_settings esiste';
    ELSE
        RAISE NOTICE '❌ Tabella online_booking_settings NON esiste';
        RETURN;
    END IF;
    
    -- 2. Mostra la struttura della tabella
    RAISE NOTICE '';
    RAISE NOTICE '=== STRUTTURA TABELLA online_booking_settings ===';
    FOR column_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'online_booking_settings'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Colonna: %, Tipo: %, Nullable: %, Default: %', 
            column_info.column_name, 
            column_info.data_type, 
            column_info.is_nullable, 
            column_info.column_default;
    END LOOP;
    
    -- 3. Conta le impostazioni per questo salone
    SELECT COUNT(*) INTO settings_count 
    FROM online_booking_settings 
    WHERE salon_id = target_salon_id;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Impostazioni trovate per questo salone: %', settings_count;
    
    -- 4. Mostra le impostazioni se esistono
    IF settings_count > 0 THEN
        SELECT * INTO settings_record 
        FROM online_booking_settings 
        WHERE salon_id = target_salon_id;
        
        RAISE NOTICE '';
        RAISE NOTICE '=== IMPOSTAZIONI TROVATE ===';
        RAISE NOTICE 'ID: %', settings_record.id;
        RAISE NOTICE 'Salon ID: %', settings_record.salon_id;
        
        -- Mostra solo i campi che esistono
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'enabled') THEN
            RAISE NOTICE 'Enabled: %', settings_record.enabled;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'require_approval') THEN
            RAISE NOTICE 'Require approval: %', settings_record.require_approval;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'auto_confirm') THEN
            RAISE NOTICE 'Auto confirm: %', settings_record.auto_confirm;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'min_notice_hours') THEN
            RAISE NOTICE 'Min notice hours: %', settings_record.min_notice_hours;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'max_days_ahead') THEN
            RAISE NOTICE 'Max days ahead: %', settings_record.max_days_ahead;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'slot_duration') THEN
            RAISE NOTICE 'Slot duration: %', settings_record.slot_duration;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'booking_start_time') THEN
            RAISE NOTICE 'Booking start time: %', settings_record.booking_start_time;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'booking_end_time') THEN
            RAISE NOTICE 'Booking end time: %', settings_record.booking_end_time;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'allow_same_day_booking') THEN
            RAISE NOTICE 'Allow same day booking: %', settings_record.allow_same_day_booking;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'max_bookings_per_day') THEN
            RAISE NOTICE 'Max bookings per day: %', settings_record.max_bookings_per_day;
        END IF;
    ELSE
        RAISE NOTICE '❌ Nessuna impostazione trovata per questo salone';
        
        -- 5. Mostra tutti i saloni che hanno impostazioni
        RAISE NOTICE '';
        RAISE NOTICE '=== SALONI CON IMPOSTAZIONI ===';
        FOR settings_record IN 
            SELECT salon_id, enabled 
            FROM online_booking_settings 
            LIMIT 5
        LOOP
            RAISE NOTICE 'Salon ID: %, Enabled: %', 
                settings_record.salon_id, 
                settings_record.enabled;
        END LOOP;
        
        -- 6. Crea impostazioni per questo salone (solo con i campi che esistono)
        RAISE NOTICE '';
        RAISE NOTICE '=== CREAZIONE IMPOSTAZIONI ===';
        
        -- Costruisci la query dinamicamente basandosi sui campi esistenti
        DECLARE
            insert_query TEXT;
            insert_fields TEXT := '';
            insert_values TEXT := '';
        BEGIN
            -- Aggiungi sempre salon_id
            insert_fields := 'salon_id';
            insert_values := quote_literal(target_salon_id);
            
            -- Aggiungi i campi che esistono
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'enabled') THEN
                insert_fields := insert_fields || ', enabled';
                insert_values := insert_values || ', true';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'require_approval') THEN
                insert_fields := insert_fields || ', require_approval';
                insert_values := insert_values || ', false';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'auto_confirm') THEN
                insert_fields := insert_fields || ', auto_confirm';
                insert_values := insert_values || ', true';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'min_notice_hours') THEN
                insert_fields := insert_fields || ', min_notice_hours';
                insert_values := insert_values || ', 1';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'max_days_ahead') THEN
                insert_fields := insert_fields || ', max_days_ahead';
                insert_values := insert_values || ', 30';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'slot_duration') THEN
                insert_fields := insert_fields || ', slot_duration';
                insert_values := insert_values || ', 15';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'booking_start_time') THEN
                insert_fields := insert_fields || ', booking_start_time';
                insert_values := insert_values || ', ''09:00''';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'booking_end_time') THEN
                insert_fields := insert_fields || ', booking_end_time';
                insert_values := insert_values || ', ''18:00''';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'allow_same_day_booking') THEN
                insert_fields := insert_fields || ', allow_same_day_booking';
                insert_values := insert_values || ', true';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'max_bookings_per_day') THEN
                insert_fields := insert_fields || ', max_bookings_per_day';
                insert_values := insert_values || ', 20';
            END IF;
            
            insert_query := 'INSERT INTO online_booking_settings (' || insert_fields || ') VALUES (' || insert_values || ')';
            RAISE NOTICE 'Query: %', insert_query;
            
            EXECUTE insert_query;
            RAISE NOTICE '✅ Impostazioni create per il salone %', target_salon_id;
        END;
    END IF;
    
    -- 7. Verifica che il salone esista in profiles
    IF EXISTS (SELECT 1 FROM profiles WHERE salon_id = target_salon_id) THEN
        RAISE NOTICE '✅ Salone trovato in profiles';
    ELSE
        RAISE NOTICE '❌ Salone NON trovato in profiles';
    END IF;
    
    -- 8. Verifica che il salone abbia impostazioni web
    IF EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = target_salon_id) THEN
        RAISE NOTICE '✅ Salone trovato in salon_web_settings';
    ELSE
        RAISE NOTICE '❌ Salone NON trovato in salon_web_settings';
    END IF;
    
END $$; 