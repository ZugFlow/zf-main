-- =====================================================
-- SETUP COMPLETO SALONE DI TEST PER PRENOTAZIONI ONLINE
-- =====================================================

-- 1. Trova un salone esistente o crea uno di test
DO $$
DECLARE
    test_salon_id UUID;
    test_salon_name TEXT := 'Salone Test Online Booking';
BEGIN
    -- Trova un salone esistente
    SELECT salon_id INTO test_salon_id 
    FROM profiles 
    WHERE salon_id IS NOT NULL 
    LIMIT 1;
    
    IF test_salon_id IS NULL THEN
        RAISE NOTICE '❌ Nessun salone trovato. Crea prima un profilo salone.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Salone trovato: %', test_salon_id;
    
    -- 2. Configura le impostazioni web del salone
    INSERT INTO salon_web_settings (
        salon_id,
        web_enabled,
        web_subdomain,
        web_title,
        web_description,
        web_theme,
        web_primary_color,
        web_secondary_color,
        web_contact_email,
        web_contact_phone,
        web_address,
        web_booking_enabled,
        web_services_visible,
        web_team_visible,
        web_gallery_visible,
        web_testimonials_visible,
        web_contact_form_enabled
    ) VALUES (
        test_salon_id,
        true,
        'test-salon',
        test_salon_name,
        'Salone di test per le prenotazioni online',
        'default',
        '#6366f1',
        '#8b5cf6',
        'info@test-salon.com',
        '+39 123 456 7890',
        'Via Roma 123, Milano',
        true,
        true,
        true,
        true,
        true,
        true
    ) ON CONFLICT (salon_id) DO UPDATE SET
        web_enabled = EXCLUDED.web_enabled,
        web_subdomain = EXCLUDED.web_subdomain,
        web_title = EXCLUDED.web_title,
        web_description = EXCLUDED.web_description,
        web_booking_enabled = EXCLUDED.web_booking_enabled,
        web_services_visible = EXCLUDED.web_services_visible,
        web_team_visible = EXCLUDED.web_team_visible,
        web_gallery_visible = EXCLUDED.web_gallery_visible,
        web_testimonials_visible = EXCLUDED.web_testimonials_visible,
        web_contact_form_enabled = EXCLUDED.web_contact_form_enabled;
    
    RAISE NOTICE '✅ Impostazioni web configurate per salone: %', test_salon_id;
    
    -- 3. Configura le impostazioni di prenotazione online
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
    
    RAISE NOTICE '✅ Impostazioni prenotazioni online configurate per salone: %', test_salon_id;
    
    -- 4. Crea servizi di test se non esistono
    IF NOT EXISTS (SELECT 1 FROM services WHERE salon_id = test_salon_id) THEN
        INSERT INTO services (salon_id, name, description, price, duration, category, status, visible_online, online_booking_enabled) VALUES
        (test_salon_id, 'Taglio Donna', 'Taglio e piega professionale', 35.00, 60, 'Taglio', 'Attivo', true, true),
        (test_salon_id, 'Taglio Uomo', 'Taglio classico o moderno', 25.00, 30, 'Taglio', 'Attivo', true, true),
        (test_salon_id, 'Colore', 'Colorazione professionale', 65.00, 120, 'Colore', 'Attivo', true, true),
        (test_salon_id, 'Piega', 'Piega elegante per occasioni speciali', 20.00, 45, 'Piega', 'Attivo', true, true),
        (test_salon_id, 'Manicure', 'Manicure completa', 25.00, 45, 'Manicure', 'Attivo', true, true);
        
        RAISE NOTICE '✅ Servizi di test creati per salone: %', test_salon_id;
    ELSE
        RAISE NOTICE 'ℹ️ Servizi già esistenti per salone: %', test_salon_id;
    END IF;
    
    -- 5. Crea team di test se non esistono
    IF NOT EXISTS (SELECT 1 FROM team WHERE salon_id = test_salon_id) THEN
        INSERT INTO team (salon_id, name, role, is_active) VALUES
        (test_salon_id, 'Maria Rossi', 'Parrucchiera Senior', true),
        (test_salon_id, 'Giulia Bianchi', 'Parrucchiera', true),
        (test_salon_id, 'Sofia Verdi', 'Estetista', true);
        
        RAISE NOTICE '✅ Team di test creato per salone: %', test_salon_id;
    ELSE
        RAISE NOTICE 'ℹ️ Team già esistente per salone: %', test_salon_id;
    END IF;
    
    -- 6. Crea gallerie di test se non esistono
    IF NOT EXISTS (SELECT 1 FROM salon_galleries WHERE salon_id = test_salon_id) THEN
        INSERT INTO salon_galleries (salon_id, title, description, image_url, image_alt, category, sort_order, is_active) VALUES
        (test_salon_id, 'Taglio Moderno', 'Taglio moderno e trendy', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400', 'Taglio moderno', 'Taglio', 1, true),
        (test_salon_id, 'Colore Professionale', 'Colorazione professionale', 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400', 'Colore professionale', 'Colore', 2, true),
        (test_salon_id, 'Piega Elegante', 'Piega per occasioni speciali', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', 'Piega elegante', 'Piega', 3, true);
        
        RAISE NOTICE '✅ Gallerie di test create per salone: %', test_salon_id;
    ELSE
        RAISE NOTICE 'ℹ️ Gallerie già esistenti per salone: %', test_salon_id;
    END IF;
    
    -- 7. Crea testimonial di test se non esistono
    IF NOT EXISTS (SELECT 1 FROM salon_testimonials WHERE salon_id = test_salon_id) THEN
        INSERT INTO salon_testimonials (salon_id, client_name, rating, comment, service_name, is_approved, is_featured) VALUES
        (test_salon_id, 'Anna Smith', 5, 'Servizio eccellente! Mi sono trovata benissimo.', 'Taglio Donna', true, true),
        (test_salon_id, 'Laura Johnson', 5, 'Personale molto professionale e cordiale.', 'Colore', true, true),
        (test_salon_id, 'Elena Brown', 4, 'Ottimo lavoro, tornerò sicuramente!', 'Piega', true, false);
        
        RAISE NOTICE '✅ Testimonial di test creati per salone: %', test_salon_id;
    ELSE
        RAISE NOTICE 'ℹ️ Testimonial già esistenti per salone: %', test_salon_id;
    END IF;
    
    -- 8. Mostra le informazioni del salone di test
    RAISE NOTICE '';
    RAISE NOTICE '=== SALONE DI TEST CONFIGURATO ===';
    RAISE NOTICE 'Salon ID: %', test_salon_id;
    RAISE NOTICE 'Subdomain: test-salon';
    RAISE NOTICE 'URL: http://test-salon.localhost:3000';
    RAISE NOTICE '';
    RAISE NOTICE 'Impostazioni attive:';
    RAISE NOTICE '- Pagina web: ABILITATA';
    RAISE NOTICE '- Prenotazioni online: ABILITATE';
    RAISE NOTICE '- Orari: 09:00-18:00';
    RAISE NOTICE '- Durata slot: 15 minuti';
    RAISE NOTICE '';
    RAISE NOTICE 'Per testare:';
    RAISE NOTICE '1. Vai su http://test-salon.localhost:3000';
    RAISE NOTICE '2. Prova a prenotare un servizio';
    RAISE NOTICE '3. Verifica che gli slot siano disponibili';
    
END $$; 