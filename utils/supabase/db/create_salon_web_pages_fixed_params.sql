-- =====================================================
-- SISTEMA PAGINE WEB SALONI - VERSIONE CORRETTA PARAMETRI
-- =====================================================
-- Questo script implementa il sistema di pagine web per saloni
-- con parametri delle funzioni corretti per PostgreSQL

-- 1. TABELLA PRINCIPALE PER LE IMPOSTAZIONI WEB DEI SALONI
-- =====================================================

-- Tabella per le impostazioni web dei saloni
CREATE TABLE IF NOT EXISTS salon_web_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL UNIQUE, -- Riferimento al salon_id esistente
    web_enabled BOOLEAN DEFAULT false,
    web_domain VARCHAR(255) UNIQUE,
    web_subdomain VARCHAR(100) UNIQUE,
    web_title VARCHAR(255),
    web_description TEXT,
    web_logo_url TEXT,
    web_theme VARCHAR(50) DEFAULT 'default',
    web_primary_color VARCHAR(7) DEFAULT '#6366f1',
    web_secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
    web_contact_email VARCHAR(255),
    web_contact_phone VARCHAR(50),
    web_address TEXT,
    web_social_facebook VARCHAR(255),
    web_social_instagram VARCHAR(255),
    web_social_twitter VARCHAR(255),
    web_google_analytics_id VARCHAR(50),
    web_meta_title VARCHAR(255),
    web_meta_description TEXT,
    web_meta_keywords TEXT,
    web_og_image_url TEXT,
    web_favicon_url TEXT,
    web_custom_css TEXT,
    web_custom_js TEXT,
    web_booking_enabled BOOLEAN DEFAULT true,
    web_services_visible BOOLEAN DEFAULT true,
    web_team_visible BOOLEAN DEFAULT true,
    web_gallery_visible BOOLEAN DEFAULT true,
    web_testimonials_visible BOOLEAN DEFAULT true,
    web_contact_form_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELLE CORRELATE CON RELAZIONI CORRETTE
-- =====================================================

-- Tabella per le gallerie fotografiche dei saloni
CREATE TABLE IF NOT EXISTS salon_galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_alt VARCHAR(255),
    category VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per i testimonial dei clienti
CREATE TABLE IF NOT EXISTS salon_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    service_name VARCHAR(255),
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le prenotazioni online
CREATE TABLE IF NOT EXISTS web_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    service_id INTEGER,
    service_name VARCHAR(255),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    total_price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    notes TEXT,
    source VARCHAR(50) DEFAULT 'website', -- website, phone, walk-in
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per i messaggi del form di contatto
CREATE TABLE IF NOT EXISTS web_contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_replied BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le statistiche delle pagine web
CREATE TABLE IF NOT EXISTS web_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL,
    page_url VARCHAR(500) NOT NULL,
    visitor_ip INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    session_id VARCHAR(255),
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    time_spent_seconds INTEGER,
    bounce BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDICI PER OTTIMIZZARE LE PERFORMANCE
-- =====================================================

-- Indici per salon_web_settings
CREATE INDEX IF NOT EXISTS idx_salon_web_settings_salon_id ON salon_web_settings(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_web_settings_domain ON salon_web_settings(web_domain);
CREATE INDEX IF NOT EXISTS idx_salon_web_settings_subdomain ON salon_web_settings(web_subdomain);
CREATE INDEX IF NOT EXISTS idx_salon_web_settings_enabled ON salon_web_settings(web_enabled);

-- Indici per salon_galleries
CREATE INDEX IF NOT EXISTS idx_salon_galleries_salon_id ON salon_galleries(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_galleries_category ON salon_galleries(category);
CREATE INDEX IF NOT EXISTS idx_salon_galleries_active ON salon_galleries(is_active);
CREATE INDEX IF NOT EXISTS idx_salon_galleries_sort_order ON salon_galleries(sort_order);

-- Indici per salon_testimonials
CREATE INDEX IF NOT EXISTS idx_salon_testimonials_salon_id ON salon_testimonials(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_testimonials_approved ON salon_testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_salon_testimonials_featured ON salon_testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_salon_testimonials_rating ON salon_testimonials(rating);

-- Indici per web_bookings
CREATE INDEX IF NOT EXISTS idx_web_bookings_salon_id ON web_bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_web_bookings_date ON web_bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_web_bookings_status ON web_bookings(status);
CREATE INDEX IF NOT EXISTS idx_web_bookings_email ON web_bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_web_bookings_service_id ON web_bookings(service_id);

-- Indici per web_contact_messages
CREATE INDEX IF NOT EXISTS idx_web_contact_messages_salon_id ON web_contact_messages(salon_id);
CREATE INDEX IF NOT EXISTS idx_web_contact_messages_read ON web_contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_web_contact_messages_date ON web_contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_web_contact_messages_email ON web_contact_messages(email);

-- Indici per web_analytics
CREATE INDEX IF NOT EXISTS idx_web_analytics_salon_id ON web_analytics(salon_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_date ON web_analytics(visit_date);
CREATE INDEX IF NOT EXISTS idx_web_analytics_session ON web_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_ip ON web_analytics(visitor_ip);

-- 4. TRIGGER E FUNZIONI
-- =====================================================

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica il trigger a tutte le tabelle correlate
DROP TRIGGER IF EXISTS trigger_update_salon_web_settings_updated_at ON salon_web_settings;
CREATE TRIGGER trigger_update_salon_web_settings_updated_at
    BEFORE UPDATE ON salon_web_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_salon_galleries_updated_at ON salon_galleries;
CREATE TRIGGER trigger_update_salon_galleries_updated_at
    BEFORE UPDATE ON salon_galleries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_salon_testimonials_updated_at ON salon_testimonials;
CREATE TRIGGER trigger_update_salon_testimonials_updated_at
    BEFORE UPDATE ON salon_testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_web_bookings_updated_at ON web_bookings;
CREATE TRIGGER trigger_update_web_bookings_updated_at
    BEFORE UPDATE ON web_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_web_contact_messages_updated_at ON web_contact_messages;
CREATE TRIGGER trigger_update_web_contact_messages_updated_at
    BEFORE UPDATE ON web_contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. FUNZIONI UTILITY
-- =====================================================

-- Funzione per generare subdomain unico
CREATE OR REPLACE FUNCTION generate_unique_subdomain(salon_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_subdomain TEXT;
    final_subdomain TEXT;
    counter INTEGER := 0;
BEGIN
    -- Pulisci il nome del salone per creare un subdomain valido
    base_subdomain := LOWER(REGEXP_REPLACE(salon_name, '[^a-zA-Z0-9]', '', 'g'));
    
    -- Rimuovi caratteri non validi per subdomain
    base_subdomain := REGEXP_REPLACE(base_subdomain, '[^a-z0-9-]', '', 'g');
    
    -- Assicurati che inizi con una lettera
    IF base_subdomain ~ '^[0-9]' THEN
        base_subdomain := 's' || base_subdomain;
    END IF;
    
    -- Limita la lunghezza
    IF LENGTH(base_subdomain) > 50 THEN
        base_subdomain := LEFT(base_subdomain, 50);
    END IF;
    
    final_subdomain := base_subdomain;
    
    -- Verifica se esiste già e aggiungi un numero se necessario
    WHILE EXISTS (SELECT 1 FROM salon_web_settings WHERE web_subdomain = final_subdomain) LOOP
        counter := counter + 1;
        final_subdomain := base_subdomain || counter::TEXT;
        
        -- Evita loop infiniti
        IF counter > 100 THEN
            RAISE EXCEPTION 'Impossibile generare un subdomain unico';
        END IF;
    END LOOP;
    
    RETURN final_subdomain;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNZIONI PRINCIPALI CON PARAMETRI CORRETTI
-- =====================================================

-- Funzione per ottenere il nome del salone da salon_id
CREATE OR REPLACE FUNCTION get_salon_name(p_salon_id UUID)
RETURNS TEXT AS $$
DECLARE
    salon_name TEXT;
BEGIN
    -- Prova a ottenere il nome dal team (primo membro del team)
    SELECT name INTO salon_name
    FROM team 
    WHERE salon_id = p_salon_id 
    LIMIT 1;
    
    -- Se non trovato nel team, prova a ottenere dal profilo del manager
    IF salon_name IS NULL THEN
        SELECT 'Salone ' || LEFT(p_salon_id::text, 8) INTO salon_name
        FROM profiles 
        WHERE salon_id = p_salon_id 
        LIMIT 1;
    END IF;
    
    -- Se ancora null, usa un nome generico
    IF salon_name IS NULL THEN
        salon_name := 'Salone ' || LEFT(p_salon_id::text, 8);
    END IF;
    
    RETURN salon_name;
END;
$$ LANGUAGE plpgsql;

-- Funzione per abilitare la pagina web di un salone (PARAMETRI CORRETTI)
CREATE OR REPLACE FUNCTION enable_salon_web_page(
    p_user_id UUID DEFAULT NULL,
    p_salon_id UUID DEFAULT NULL,
    p_web_title TEXT DEFAULT NULL,
    p_web_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    salon_name TEXT;
    generated_subdomain TEXT;
    result JSON;
BEGIN
    -- Verifica che i parametri obbligatori siano forniti
    IF p_user_id IS NULL OR p_salon_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Parametri user_id e salon_id sono obbligatori'
        );
    END IF;

    -- Verifica che l'utente esista e abbia accesso al salone
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE id = p_user_id AND salon_id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Utente non autorizzato o salone non associato'
        );
    END IF;
    
    -- Verifica che il salone esista (controlla se ci sono servizi o team per questo salon_id)
    IF NOT EXISTS (
        SELECT 1 FROM services WHERE salon_id = p_salon_id
        UNION
        SELECT 1 FROM team WHERE salon_id = p_salon_id
        UNION
        SELECT 1 FROM profiles WHERE salon_id = p_salon_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Salone non trovato');
    END IF;
    
    -- Verifica che la pagina web non sia già abilitata
    IF EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id AND web_enabled = true) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'La pagina web è già abilitata per questo salone'
        );
    END IF;
    
    -- Ottieni il nome del salone
    salon_name := get_salon_name(p_salon_id);
    
    -- Genera un subdomain unico
    generated_subdomain := generate_unique_subdomain(salon_name);
    
    -- Inserisci o aggiorna le impostazioni web
    INSERT INTO salon_web_settings (
        salon_id,
        web_enabled,
        web_subdomain,
        web_title,
        web_description
    ) VALUES (
        p_salon_id,
        true,
        generated_subdomain,
        COALESCE(p_web_title, salon_name),
        COALESCE(p_web_description, 'Prenota il tuo appuntamento online')
    )
    ON CONFLICT (salon_id) 
    DO UPDATE SET
        web_enabled = true,
        web_subdomain = generated_subdomain,
        web_title = COALESCE(p_web_title, salon_name),
        web_description = COALESCE(p_web_description, 'Prenota il tuo appuntamento online'),
        updated_at = NOW();
    
    result := json_build_object(
        'success', true,
        'subdomain', generated_subdomain,
        'web_url', 'https://' || generated_subdomain || '.zugflow.com',
        'message', 'Pagina web abilitata con successo'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Errore durante l''abilitazione della pagina web: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per disabilitare la pagina web di un salone (PARAMETRI CORRETTI)
CREATE OR REPLACE FUNCTION disable_salon_web_page(
    p_user_id UUID DEFAULT NULL,
    p_salon_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
BEGIN
    -- Verifica che i parametri obbligatori siano forniti
    IF p_user_id IS NULL OR p_salon_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Parametri user_id e salon_id sono obbligatori'
        );
    END IF;

    -- Verifica che l'utente esista e abbia accesso al salone
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE id = p_user_id AND salon_id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Utente non autorizzato o salone non associato'
        );
    END IF;
    
    -- Disabilita la pagina web
    UPDATE salon_web_settings SET
        web_enabled = false,
        updated_at = NOW()
    WHERE salon_id = p_salon_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Pagina web disabilitata con successo'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Errore durante la disabilitazione: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per aggiornare le impostazioni della pagina web (PARAMETRI CORRETTI)
CREATE OR REPLACE FUNCTION update_salon_web_settings(
    p_user_id UUID DEFAULT NULL,
    p_salon_id UUID DEFAULT NULL,
    p_settings JSON DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    setting_key TEXT;
    setting_value TEXT;
BEGIN
    -- Verifica che i parametri obbligatori siano forniti
    IF p_user_id IS NULL OR p_salon_id IS NULL OR p_settings IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Parametri user_id, salon_id e settings sono obbligatori'
        );
    END IF;

    -- Verifica che l'utente esista e abbia accesso al salone
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE id = p_user_id AND salon_id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Utente non autorizzato o salone non associato'
        );
    END IF;
    
    -- Verifica che le impostazioni web esistano
    IF NOT EXISTS (SELECT 1 FROM salon_web_settings WHERE salon_id = p_salon_id) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Impostazioni web non trovate per questo salone'
        );
    END IF;
    
    -- Costruisci la query di aggiornamento dinamicamente
    DECLARE
        update_query TEXT := 'UPDATE salon_web_settings SET ';
        first_setting BOOLEAN := true;
    BEGIN
        FOR setting_key, setting_value IN 
            SELECT * FROM json_each_text(p_settings)
        LOOP
            IF first_setting THEN
                update_query := update_query || setting_key || ' = ' || quote_literal(setting_value);
                first_setting := false;
            ELSE
                update_query := update_query || ', ' || setting_key || ' = ' || quote_literal(setting_value);
            END IF;
        END LOOP;
        
        update_query := update_query || ', updated_at = NOW() WHERE salon_id = ' || quote_literal(p_salon_id);
        
        EXECUTE update_query;
    END;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Impostazioni aggiornate con successo'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Errore durante l''aggiornamento: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNZIONI PER LA GESTIONE DEI CONTENUTI (PARAMETRI CORRETTI)
-- =====================================================

-- Funzione per aggiungere una galleria
CREATE OR REPLACE FUNCTION add_salon_gallery(
    p_user_id UUID DEFAULT NULL,
    p_salon_id UUID DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_image_alt TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    new_gallery_id UUID;
BEGIN
    -- Verifica che i parametri obbligatori siano forniti
    IF p_user_id IS NULL OR p_salon_id IS NULL OR p_title IS NULL OR p_image_url IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Parametri user_id, salon_id, title e image_url sono obbligatori'
        );
    END IF;

    -- Verifica autorizzazione
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE id = p_user_id AND salon_id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Utente non autorizzato'
        );
    END IF;
    
    -- Inserisci la galleria
    INSERT INTO salon_galleries (
        salon_id, title, description, image_url, image_alt, category
    ) VALUES (
        p_salon_id, p_title, p_description, p_image_url, p_image_alt, p_category
    ) RETURNING id INTO new_gallery_id;
    
    RETURN json_build_object(
        'success', true,
        'gallery_id', new_gallery_id,
        'message', 'Galleria aggiunta con successo'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Errore durante l''aggiunta della galleria: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per aggiungere un testimonial
CREATE OR REPLACE FUNCTION add_salon_testimonial(
    p_user_id UUID DEFAULT NULL,
    p_salon_id UUID DEFAULT NULL,
    p_client_name TEXT DEFAULT NULL,
    p_client_email TEXT DEFAULT NULL,
    p_rating INTEGER DEFAULT NULL,
    p_comment TEXT DEFAULT NULL,
    p_service_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    new_testimonial_id UUID;
BEGIN
    -- Verifica che i parametri obbligatori siano forniti
    IF p_user_id IS NULL OR p_salon_id IS NULL OR p_client_name IS NULL OR p_comment IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Parametri user_id, salon_id, client_name e comment sono obbligatori'
        );
    END IF;

    -- Verifica autorizzazione
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE id = p_user_id AND salon_id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Utente non autorizzato'
        );
    END IF;
    
    -- Inserisci il testimonial
    INSERT INTO salon_testimonials (
        salon_id, client_name, client_email, rating, comment, service_name
    ) VALUES (
        p_salon_id, p_client_name, p_client_email, p_rating, p_comment, p_service_name
    ) RETURNING id INTO new_testimonial_id;
    
    RETURN json_build_object(
        'success', true,
        'testimonial_id', new_testimonial_id,
        'message', 'Testimonial aggiunto con successo'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Errore durante l''aggiunta del testimonial: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNZIONI PER LE STATISTICHE (PARAMETRI CORRETTI)
-- =====================================================

-- Funzione per registrare una visita
CREATE OR REPLACE FUNCTION record_page_visit(
    p_salon_id UUID DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL,
    p_visitor_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Verifica che i parametri obbligatori siano forniti
    IF p_salon_id IS NULL OR p_page_url IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Parametri salon_id e page_url sono obbligatori'
        );
    END IF;

    INSERT INTO web_analytics (
        salon_id, page_url, visitor_ip, user_agent, referrer, session_id,
        visit_date, visit_time
    ) VALUES (
        p_salon_id, p_page_url, p_visitor_ip, p_user_agent, p_referrer, p_session_id,
        CURRENT_DATE, CURRENT_TIME
    );
    
    RETURN json_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Errore durante la registrazione della visita: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere statistiche del salone
CREATE OR REPLACE FUNCTION get_salon_web_stats(
    p_user_id UUID DEFAULT NULL,
    p_salon_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    stats RECORD;
BEGIN
    -- Verifica che i parametri obbligatori siano forniti
    IF p_user_id IS NULL OR p_salon_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Parametri user_id e salon_id sono obbligatori'
        );
    END IF;

    -- Verifica autorizzazione
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE id = p_user_id AND salon_id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Utente non autorizzato'
        );
    END IF;
    
    -- Imposta date di default se non specificate
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;
    
    -- Calcola le statistiche
    SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_ip) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions,
        AVG(time_spent_seconds) as avg_time_spent,
        COUNT(*) FILTER (WHERE bounce = true) as bounces
    INTO stats
    FROM web_analytics 
    WHERE salon_id = p_salon_id 
    AND visit_date BETWEEN p_start_date AND p_end_date;
    
    RETURN json_build_object(
        'success', true,
        'stats', json_build_object(
            'total_visits', stats.total_visits,
            'unique_visitors', stats.unique_visitors,
            'sessions', stats.sessions,
            'avg_time_spent', stats.avg_time_spent,
            'bounces', stats.bounces,
            'start_date', p_start_date,
            'end_date', p_end_date
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Errore durante il calcolo delle statistiche: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. COMMENTI E DOCUMENTAZIONE
-- =====================================================

COMMENT ON TABLE salon_web_settings IS 'Impostazioni web per i saloni (adattato alla struttura esistente)';
COMMENT ON COLUMN salon_web_settings.salon_id IS 'ID del salone (riferimento al salon_id esistente nel sistema)';
COMMENT ON COLUMN salon_web_settings.web_enabled IS 'Indica se la pagina web del salone è abilitata';
COMMENT ON COLUMN salon_web_settings.web_subdomain IS 'Subdomain unico per la pagina web del salone';

COMMENT ON TABLE salon_galleries IS 'Gallerie fotografiche dei saloni';
COMMENT ON TABLE salon_testimonials IS 'Testimonianze dei clienti dei saloni';
COMMENT ON TABLE web_bookings IS 'Prenotazioni online dei clienti';
COMMENT ON TABLE web_contact_messages IS 'Messaggi dal form di contatto';
COMMENT ON TABLE web_analytics IS 'Statistiche delle visite alle pagine web';

COMMENT ON FUNCTION enable_salon_web_page IS 'Abilita la pagina web di un salone con verifica autorizzazioni (parametri corretti)';
COMMENT ON FUNCTION disable_salon_web_page IS 'Disabilita la pagina web di un salone (parametri corretti)';
COMMENT ON FUNCTION update_salon_web_settings IS 'Aggiorna le impostazioni della pagina web (parametri corretti)';
COMMENT ON FUNCTION add_salon_gallery IS 'Aggiunge una galleria al salone (parametri corretti)';
COMMENT ON FUNCTION add_salon_testimonial IS 'Aggiunge un testimonial al salone (parametri corretti)';
COMMENT ON FUNCTION record_page_visit IS 'Registra una visita alla pagina web (parametri corretti)';
COMMENT ON FUNCTION get_salon_web_stats IS 'Ottiene statistiche della pagina web del salone (parametri corretti)';
COMMENT ON FUNCTION get_salon_name IS 'Ottiene il nome del salone dal salon_id (adattato)';

-- 10. MESSAGGIO DI COMPLETAMENTO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Sistema pagine web saloni con parametri corretti installato con successo!';
    RAISE NOTICE 'Questo sistema si integra con la struttura esistente del database.';
    RAISE NOTICE '';
    RAISE NOTICE 'Funzioni disponibili:';
    RAISE NOTICE '- enable_salon_web_page(user_id, salon_id, title, description)';
    RAISE NOTICE '- disable_salon_web_page(user_id, salon_id)';
    RAISE NOTICE '- update_salon_web_settings(user_id, salon_id, settings_json)';
    RAISE NOTICE '- add_salon_gallery(user_id, salon_id, title, image_url, ...)';
    RAISE NOTICE '- add_salon_testimonial(user_id, salon_id, client_name, comment, ...)';
    RAISE NOTICE '- record_page_visit(salon_id, page_url, ...)';
    RAISE NOTICE '- get_salon_web_stats(user_id, salon_id, start_date, end_date)';
    RAISE NOTICE '';
    RAISE NOTICE 'Il sistema utilizza salon_id come identificatore univoco del salone.';
    RAISE NOTICE 'Non è necessaria una tabella salon separata.';
    RAISE NOTICE 'Tutti i parametri delle funzioni hanno valori di default corretti.';
END $$; 