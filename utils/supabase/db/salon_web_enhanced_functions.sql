-- =====================================================
-- FUNZIONI AVANZATE PER SISTEMA PAGINE WEB SALONI - VERSIONE COMPLETA
-- =====================================================
-- Funzioni complete per gestire tutte le funzionalità del sistema web
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
            ELSE 'Testimonial rifiutato con successo'
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

-- 3. FUNZIONI PER ANALYTICS
-- =====================================================

-- Funzione per registrare una visita alla pagina
CREATE OR REPLACE FUNCTION record_page_visit(
    p_salon_id UUID,
    p_page_url TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_analytics_id UUID;
BEGIN
    -- Verifica che il salone esista
    IF NOT EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    -- Inserisci la visita
    INSERT INTO web_analytics (
        salon_id, page_url, referrer, user_agent, ip_address, visit_date
    ) VALUES (
        p_salon_id, p_page_url, p_referrer, p_user_agent, p_ip_address, NOW()
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
        confirmed_at = NOW(),
        admin_notes = COALESCE(p_admin_notes, admin_notes),
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
        cancelled_at = NOW(),
        cancellation_reason = COALESCE(p_cancellation_reason, cancellation_reason),
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

-- 5. FUNZIONI PER GESTIONE MESSAGGI
-- =====================================================

-- Funzione per marcare un messaggio come letto
CREATE OR REPLACE FUNCTION mark_contact_message_read(
    p_message_id UUID,
    p_is_read BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
BEGIN
    UPDATE web_contact_messages 
    SET 
        is_read = p_is_read,
        read_at = CASE WHEN p_is_read THEN NOW() ELSE NULL END,
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
            WHEN p_is_read THEN 'Messaggio marcato come letto'
            ELSE 'Messaggio marcato come non letto'
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per marcare un messaggio come risposto
CREATE OR REPLACE FUNCTION mark_contact_message_replied(
    p_message_id UUID,
    p_is_replied BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
BEGIN
    UPDATE web_contact_messages 
    SET 
        is_replied = p_is_replied,
        replied_at = CASE WHEN p_is_replied THEN NOW() ELSE NULL END,
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
            WHEN p_is_replied THEN 'Messaggio marcato come risposto'
            ELSE 'Messaggio marcato come non risposto'
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNZIONI PER GESTIONE SEO E DESIGN
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

-- Funzione per aggiornare le funzionalità web
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

-- 8. FUNZIONI PER BACKUP E PULIZIA
-- =====================================================

-- Funzione per creare un backup delle impostazioni web
CREATE OR REPLACE FUNCTION backup_web_settings(p_salon_id UUID)
RETURNS JSON AS $$
DECLARE
    v_backup_data JSON;
BEGIN
    -- Verifica che il salone esista
    IF NOT EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    -- Crea il backup
    SELECT json_build_object(
        'salon_id', salon_id,
        'settings', row_to_json(salon_web_settings.*),
        'backup_date', NOW()
    ) INTO v_backup_data
    FROM salon_web_settings
    WHERE salon_id = p_salon_id;

    RETURN json_build_object(
        'success', true,
        'backup_data', v_backup_data,
        'message', 'Backup creato con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per pulire i dati vecchi
CREATE OR REPLACE FUNCTION cleanup_old_data(
    p_days_to_keep INTEGER DEFAULT 90
)
RETURNS JSON AS $$
DECLARE
    v_deleted_analytics INTEGER := 0;
    v_deleted_messages INTEGER := 0;
    v_deleted_bookings INTEGER := 0;
BEGIN
    -- Elimina analytics vecchi
    DELETE FROM web_analytics 
    WHERE visit_date < NOW() - INTERVAL '1 day' * p_days_to_keep;
    GET DIAGNOSTICS v_deleted_analytics = ROW_COUNT;

    -- Elimina messaggi vecchi (non risposti)
    DELETE FROM web_contact_messages 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep 
    AND is_replied = false;
    GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;

    -- Elimina prenotazioni vecchie (cancellate)
    DELETE FROM web_bookings 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep 
    AND status = 'cancelled';
    GET DIAGNOSTICS v_deleted_bookings = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'deleted_analytics', v_deleted_analytics,
        'deleted_messages', v_deleted_messages,
        'deleted_bookings', v_deleted_bookings,
        'message', 'Pulizia completata con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNZIONI PER ABILITAZIONE/DISABILITAZIONE PAGINA WEB
-- =====================================================

-- Funzione per abilitare la pagina web
CREATE OR REPLACE FUNCTION enable_salon_web_page(
    p_user_id UUID,
    p_salon_id UUID,
    p_web_title VARCHAR(255) DEFAULT 'Il Mio Salone',
    p_web_description TEXT DEFAULT 'Prenota il tuo appuntamento online'
)
RETURNS JSON AS $$
DECLARE
    v_subdomain VARCHAR(255);
    v_web_url TEXT;
BEGIN
    -- Verifica che l'utente abbia accesso al salone
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND salon_id = p_salon_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Accesso non autorizzato al salone'
        );
    END IF;

    -- Genera un subdomain unico
    SELECT 'salon-' || p_salon_id::text INTO v_subdomain;
    
    -- Aggiorna le impostazioni web
    UPDATE salon_web_settings 
    SET 
        web_enabled = true,
        web_subdomain = v_subdomain,
        web_title = COALESCE(p_web_title, web_title),
        web_description = COALESCE(p_web_description, web_description),
        updated_at = NOW()
    WHERE salon_id = p_salon_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Salone non trovato'
        );
    END IF;

    v_web_url := 'https://' || v_subdomain || '.zugflow.com';

    RETURN json_build_object(
        'success', true,
        'web_url', v_web_url,
        'subdomain', v_subdomain,
        'message', 'Pagina web abilitata con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per disabilitare la pagina web
CREATE OR REPLACE FUNCTION disable_salon_web_page(
    p_user_id UUID,
    p_salon_id UUID
)
RETURNS JSON AS $$
BEGIN
    -- Verifica che l'utente abbia accesso al salone
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND salon_id = p_salon_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Accesso non autorizzato al salone'
        );
    END IF;

    -- Disabilita la pagina web
    UPDATE salon_web_settings 
    SET 
        web_enabled = false,
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
        'message', 'Pagina web disabilitata con successo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FINE FUNZIONI
-- ===================================================== 