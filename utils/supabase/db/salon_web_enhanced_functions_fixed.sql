-- =====================================================
-- FUNZIONI AVANZATE PER SISTEMA PAGINE WEB SALONI - VERSIONE CORRETTA
-- =====================================================
-- Funzioni aggiuntive per gestire tutte le funzionalità del sistema web
-- Versione corretta con parametri con valori di default appropriati

-- 1. FUNZIONI PER GESTIONE GALLERIA
-- =====================================================

-- Funzione per aggiungere una nuova immagine alla galleria
CREATE OR REPLACE FUNCTION add_gallery_image(
    p_salon_id UUID,
    p_title VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_image_alt VARCHAR(255) DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT 'general',
    p_sort_order INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_gallery_id UUID;
    v_result JSON;
BEGIN
    -- Verifica che il salone esista
    IF NOT EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    -- Verifica che i campi obbligatori siano presenti
    IF p_title IS NULL OR p_image_url IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Titolo e URL immagine sono obbligatori'
        );
    END IF;

    -- Inserisci la nuova immagine
    INSERT INTO salon_galleries (
        salon_id, title, description, image_url, image_alt, category, sort_order
    ) VALUES (
        p_salon_id, p_title, p_description, p_image_url, p_image_alt, p_category, p_sort_order
    ) RETURNING id INTO v_gallery_id;

    RETURN json_build_object(
        'success', true,
        'gallery_id', v_gallery_id,
        'message', 'Immagine aggiunta con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per aggiornare un'immagine della galleria
CREATE OR REPLACE FUNCTION update_gallery_image(
    p_gallery_id UUID,
    p_title VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_image_alt VARCHAR(255) DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Aggiorna l'immagine
    UPDATE salon_galleries 
    SET 
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        image_url = COALESCE(p_image_url, image_url),
        image_alt = COALESCE(p_image_alt, image_alt),
        category = COALESCE(p_category, category),
        sort_order = COALESCE(p_sort_order, sort_order),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = NOW()
    WHERE id = p_gallery_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Immagine non trovata'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Immagine aggiornata con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per eliminare un'immagine dalla galleria
CREATE OR REPLACE FUNCTION delete_gallery_image(p_gallery_id UUID)
RETURNS JSON AS $$
BEGIN
    DELETE FROM salon_galleries WHERE id = p_gallery_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Immagine non trovata'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Immagine eliminata con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNZIONI PER GESTIONE TESTIMONIAL
-- =====================================================

-- Funzione per aggiungere un nuovo testimonial
CREATE OR REPLACE FUNCTION add_testimonial(
    p_salon_id UUID,
    p_client_name VARCHAR(255),
    p_client_email VARCHAR(255) DEFAULT NULL,
    p_rating INTEGER DEFAULT 5,
    p_comment TEXT DEFAULT NULL,
    p_service_name VARCHAR(255) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_testimonial_id UUID;
BEGIN
    -- Validazione del rating
    IF p_rating < 1 OR p_rating > 5 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Il rating deve essere tra 1 e 5'
        );
    END IF;

    -- Verifica che il salone esista
    IF NOT EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    -- Verifica che i campi obbligatori siano presenti
    IF p_client_name IS NULL OR p_comment IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nome cliente e commento sono obbligatori'
        );
    END IF;

    -- Inserisci il testimonial (non approvato di default)
    INSERT INTO salon_testimonials (
        salon_id, client_name, client_email, rating, comment, service_name, is_approved
    ) VALUES (
        p_salon_id, p_client_name, p_client_email, p_rating, p_comment, p_service_name, false
    ) RETURNING id INTO v_testimonial_id;

    RETURN json_build_object(
        'success', true,
        'testimonial_id', v_testimonial_id,
        'message', 'Testimonial aggiunto con successo (in attesa di approvazione)'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per approvare/disapprovare un testimonial
CREATE OR REPLACE FUNCTION approve_testimonial(
    p_testimonial_id UUID,
    p_is_approved BOOLEAN DEFAULT true,
    p_is_featured BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
BEGIN
    UPDATE salon_testimonials 
    SET 
        is_approved = p_is_approved,
        is_featured = p_is_featured,
        updated_at = NOW()
    WHERE id = p_testimonial_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Testimonial non trovato'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN p_is_approved THEN 'Testimonial approvato con successo'
            ELSE 'Testimonial disapprovato con successo'
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per eliminare un testimonial
CREATE OR REPLACE FUNCTION delete_testimonial(p_testimonial_id UUID)
RETURNS JSON AS $$
BEGIN
    DELETE FROM salon_testimonials WHERE id = p_testimonial_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Testimonial non trovato'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Testimonial eliminato con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNZIONI PER ANALYTICS E STATISTICHE
-- =====================================================

-- Funzione per registrare una visita alla pagina
CREATE OR REPLACE FUNCTION record_page_visit(
    p_salon_id UUID,
    p_page_url VARCHAR(500) DEFAULT NULL,
    p_visitor_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer VARCHAR(500) DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_analytics_id UUID;
BEGIN
    -- Verifica che il salone esista e abbia la pagina web abilitata
    IF NOT EXISTS (
        SELECT 1 FROM salon_web_settings 
        WHERE salon_id = p_salon_id AND web_enabled = true
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato o pagina web non abilitata'
        );
    END IF;

    -- Inserisci la visita
    INSERT INTO web_analytics (
        salon_id, page_url, visitor_ip, user_agent, referrer, session_id, visit_date, visit_time
    ) VALUES (
        p_salon_id, p_page_url, p_visitor_ip, p_user_agent, p_referrer, p_session_id, 
        CURRENT_DATE, CURRENT_TIME
    ) RETURNING id INTO v_analytics_id;

    RETURN json_build_object(
        'success', true,
        'analytics_id', v_analytics_id,
        'message', 'Visita registrata con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere statistiche dettagliate del salone
CREATE OR REPLACE FUNCTION get_salon_web_analytics(
    p_salon_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
    v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
    -- Verifica che il salone esista
    IF NOT EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    -- Calcola le statistiche
    WITH analytics_stats AS (
        SELECT 
            COUNT(*) as total_visits,
            COUNT(DISTINCT visitor_ip) as unique_visitors,
            COUNT(DISTINCT session_id) as sessions,
            AVG(time_spent_seconds) as avg_time_spent,
            COUNT(*) FILTER (WHERE bounce = true) as bounces
        FROM web_analytics 
        WHERE salon_id = p_salon_id 
        AND visit_date BETWEEN v_start_date AND v_end_date
    ),
    booking_stats AS (
        SELECT 
            COUNT(*) as total_bookings,
            COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
            AVG(total_price) as avg_booking_value
        FROM web_bookings 
        WHERE salon_id = p_salon_id 
        AND appointment_date BETWEEN v_start_date AND v_end_date
    ),
    contact_stats AS (
        SELECT 
            COUNT(*) as total_messages,
            COUNT(*) FILTER (WHERE is_read = true) as read_messages,
            COUNT(*) FILTER (WHERE is_replied = true) as replied_messages
        FROM web_contact_messages 
        WHERE salon_id = p_salon_id 
        AND created_at::date BETWEEN v_start_date AND v_end_date
    )
    SELECT json_build_object(
        'success', true,
        'period', json_build_object('start_date', v_start_date, 'end_date', v_end_date),
        'analytics', row_to_json(analytics_stats.*),
        'bookings', row_to_json(booking_stats.*),
        'contacts', row_to_json(contact_stats.*)
    ) INTO v_stats
    FROM analytics_stats, booking_stats, contact_stats;

    RETURN v_stats;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNZIONI PER GESTIONE PRENOTAZIONI
-- =====================================================

-- Funzione per confermare una prenotazione
CREATE OR REPLACE FUNCTION confirm_web_booking(
    p_booking_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE web_bookings 
    SET 
        status = 'confirmed',
        notes = COALESCE(p_admin_notes, notes),
        updated_at = NOW()
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Prenotazione non trovata'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Prenotazione confermata con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per cancellare una prenotazione
CREATE OR REPLACE FUNCTION cancel_web_booking(
    p_booking_id UUID,
    p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE web_bookings 
    SET 
        status = 'cancelled',
        notes = COALESCE(p_cancellation_reason, notes),
        updated_at = NOW()
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Prenotazione non trovata'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Prenotazione cancellata con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNZIONI PER GESTIONE MESSAGGI DI CONTATTO
-- =====================================================

-- Funzione per segnare un messaggio come letto
CREATE OR REPLACE FUNCTION mark_contact_message_read(
    p_message_id UUID,
    p_is_read BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
BEGIN
    UPDATE web_contact_messages 
    SET 
        is_read = p_is_read,
        updated_at = NOW()
    WHERE id = p_message_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Messaggio non trovato'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN p_is_read THEN 'Messaggio segnato come letto'
            ELSE 'Messaggio segnato come non letto'
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per segnare un messaggio come risposto
CREATE OR REPLACE FUNCTION mark_contact_message_replied(
    p_message_id UUID,
    p_is_replied BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
BEGIN
    UPDATE web_contact_messages 
    SET 
        is_replied = p_is_replied,
        updated_at = NOW()
    WHERE id = p_message_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Messaggio non trovato'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN p_is_replied THEN 'Messaggio segnato come risposto'
            ELSE 'Messaggio segnato come non risposto'
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNZIONI PER GESTIONE AVANZATA IMPOSTAZIONI
-- =====================================================

-- Funzione per aggiornare le impostazioni SEO
CREATE OR REPLACE FUNCTION update_seo_settings(
    p_salon_id UUID,
    p_meta_title VARCHAR(255) DEFAULT NULL,
    p_meta_description TEXT DEFAULT NULL,
    p_meta_keywords TEXT DEFAULT NULL,
    p_og_image_url TEXT DEFAULT NULL,
    p_favicon_url TEXT DEFAULT NULL,
    p_google_analytics_id VARCHAR(50) DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE salon_web_settings 
    SET 
        web_meta_title = COALESCE(p_meta_title, web_meta_title),
        web_meta_description = COALESCE(p_meta_description, web_meta_description),
        web_meta_keywords = COALESCE(p_meta_keywords, web_meta_keywords),
        web_og_image_url = COALESCE(p_og_image_url, web_og_image_url),
        web_favicon_url = COALESCE(p_favicon_url, web_favicon_url),
        web_google_analytics_id = COALESCE(p_google_analytics_id, web_google_analytics_id),
        updated_at = NOW()
    WHERE salon_id = p_salon_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Impostazioni SEO aggiornate con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per aggiornare le impostazioni di design
CREATE OR REPLACE FUNCTION update_design_settings(
    p_salon_id UUID,
    p_theme VARCHAR(50) DEFAULT NULL,
    p_primary_color VARCHAR(7) DEFAULT NULL,
    p_secondary_color VARCHAR(7) DEFAULT NULL,
    p_logo_url TEXT DEFAULT NULL,
    p_custom_css TEXT DEFAULT NULL,
    p_custom_js TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE salon_web_settings 
    SET 
        web_theme = COALESCE(p_theme, web_theme),
        web_primary_color = COALESCE(p_primary_color, web_primary_color),
        web_secondary_color = COALESCE(p_secondary_color, web_secondary_color),
        web_logo_url = COALESCE(p_logo_url, web_logo_url),
        web_custom_css = COALESCE(p_custom_css, web_custom_css),
        web_custom_js = COALESCE(p_custom_js, web_custom_js),
        updated_at = NOW()
    WHERE salon_id = p_salon_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Impostazioni di design aggiornate con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNZIONI PER GESTIONE FUNZIONALITÀ
-- =====================================================

-- Funzione per aggiornare le funzionalità abilitate
CREATE OR REPLACE FUNCTION update_web_features(
    p_salon_id UUID,
    p_booking_enabled BOOLEAN DEFAULT NULL,
    p_services_visible BOOLEAN DEFAULT NULL,
    p_team_visible BOOLEAN DEFAULT NULL,
    p_gallery_visible BOOLEAN DEFAULT NULL,
    p_testimonials_visible BOOLEAN DEFAULT NULL,
    p_contact_form_enabled BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE salon_web_settings 
    SET 
        web_booking_enabled = COALESCE(p_booking_enabled, web_booking_enabled),
        web_services_visible = COALESCE(p_services_visible, web_services_visible),
        web_team_visible = COALESCE(p_team_visible, web_team_visible),
        web_gallery_visible = COALESCE(p_gallery_visible, web_gallery_visible),
        web_testimonials_visible = COALESCE(p_testimonials_visible, web_testimonials_visible),
        web_contact_form_enabled = COALESCE(p_contact_form_enabled, web_contact_form_enabled),
        updated_at = NOW()
    WHERE salon_id = p_salon_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Funzionalità web aggiornate con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNZIONI PER BACKUP E RIPRISTINO
-- =====================================================

-- Funzione per esportare tutte le impostazioni web di un salone
CREATE OR REPLACE FUNCTION export_salon_web_data(p_salon_id UUID)
RETURNS JSON AS $$
DECLARE
    v_export_data JSON;
BEGIN
    -- Verifica che il salone esista
    IF NOT EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    -- Esporta tutti i dati correlati
    SELECT json_build_object(
        'success', true,
        'export_date', NOW(),
        'salon_id', p_salon_id,
        'web_settings', row_to_json(sws.*),
        'galleries', COALESCE(
            (SELECT json_agg(row_to_json(sg.*)) FROM salon_galleries sg WHERE sg.salon_id = p_salon_id),
            '[]'::json
        ),
        'testimonials', COALESCE(
            (SELECT json_agg(row_to_json(st.*)) FROM salon_testimonials st WHERE st.salon_id = p_salon_id),
            '[]'::json
        ),
        'bookings', COALESCE(
            (SELECT json_agg(row_to_json(wb.*)) FROM web_bookings wb WHERE wb.salon_id = p_salon_id),
            '[]'::json
        ),
        'contact_messages', COALESCE(
            (SELECT json_agg(row_to_json(wcm.*)) FROM web_contact_messages wcm WHERE wcm.salon_id = p_salon_id),
            '[]'::json
        ),
        'analytics', COALESCE(
            (SELECT json_agg(row_to_json(wa.*)) FROM web_analytics wa WHERE wa.salon_id = p_salon_id),
            '[]'::json
        )
    ) INTO v_export_data
    FROM salon_web_settings sws
    WHERE sws.salon_id = p_salon_id;

    RETURN v_export_data;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per pulire i dati vecchi (manutenzione)
CREATE OR REPLACE FUNCTION cleanup_old_web_data(
    p_salon_id UUID,
    p_days_to_keep INTEGER DEFAULT 365
)
RETURNS JSON AS $$
DECLARE
    v_deleted_analytics INTEGER;
    v_deleted_messages INTEGER;
    v_deleted_bookings INTEGER;
BEGIN
    -- Verifica che il salone esista
    IF NOT EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    -- Elimina analytics vecchi
    DELETE FROM web_analytics 
    WHERE salon_id = p_salon_id 
    AND visit_date < CURRENT_DATE - (p_days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted_analytics = ROW_COUNT;

    -- Elimina messaggi di contatto vecchi (non risposti)
    DELETE FROM web_contact_messages 
    WHERE salon_id = p_salon_id 
    AND created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
    AND is_replied = true;
    GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;

    -- Elimina prenotazioni vecchie (completate o cancellate)
    DELETE FROM web_bookings 
    WHERE salon_id = p_salon_id 
    AND appointment_date < CURRENT_DATE - (p_days_to_keep || ' days')::INTERVAL
    AND status IN ('completed', 'cancelled');
    GET DIAGNOSTICS v_deleted_bookings = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'message', 'Pulizia completata con successo',
        'deleted_analytics', v_deleted_analytics,
        'deleted_messages', v_deleted_messages,
        'deleted_bookings', v_deleted_bookings
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 