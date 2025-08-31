-- =====================================================
-- FUNZIONI SALON WEB - VERSIONE CORRETTA SENZA TABELLA SALON
-- =====================================================

-- Funzione per generare un subdomain unico
CREATE OR REPLACE FUNCTION generate_unique_subdomain(salon_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_subdomain TEXT;
    final_subdomain TEXT;
    counter INTEGER := 0;
BEGIN
    -- Normalizza il nome del salone per creare il subdomain base
    base_subdomain := lower(regexp_replace(salon_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_subdomain := regexp_replace(base_subdomain, '\s+', '-', 'g');
    base_subdomain := regexp_replace(base_subdomain, '-+', '-', 'g');
    base_subdomain := trim(both '-' from base_subdomain);
    
    -- Se il nome è vuoto, usa un default
    IF base_subdomain = '' THEN
        base_subdomain := 'salone';
    END IF;
    
    -- Limita la lunghezza
    IF length(base_subdomain) > 50 THEN
        base_subdomain := substring(base_subdomain from 1 for 50);
    END IF;
    
    final_subdomain := base_subdomain;
    
    -- Genera un subdomain unico
    WHILE EXISTS (SELECT 1 FROM salon_web_settings WHERE web_subdomain = final_subdomain) LOOP
        counter := counter + 1;
        final_subdomain := base_subdomain || '-' || counter::TEXT;
        
        -- Evita loop infiniti
        IF counter > 100 THEN
            final_subdomain := base_subdomain || '-' || floor(random() * 10000)::TEXT;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN final_subdomain;
END;
$$ LANGUAGE plpgsql;

-- Funzione per abilitare la pagina web di un salone
-- Versione corretta che non dipende dalla tabella salon
CREATE OR REPLACE FUNCTION enable_salon_web_page(
    p_user_id UUID,
    p_salon_id UUID,
    p_web_title TEXT DEFAULT NULL,
    p_web_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    web_settings RECORD;
    generated_subdomain TEXT;
    result JSON;
BEGIN
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
    
    -- Recupera le impostazioni web esistenti
    SELECT * INTO web_settings 
    FROM salon_web_settings 
    WHERE salon_id = p_salon_id;
    
    -- Se non esistono impostazioni, le creiamo
    IF NOT FOUND THEN
        INSERT INTO salon_web_settings (
            salon_id, 
            web_enabled, 
            web_title, 
            web_description,
            web_booking_enabled,
            web_services_visible,
            web_team_visible,
            web_gallery_visible,
            web_testimonials_visible,
            web_contact_form_enabled
        ) VALUES (
            p_salon_id,
            false,
            COALESCE(p_web_title, 'Il Mio Salone'),
            COALESCE(p_web_description, 'Prenota il tuo appuntamento online'),
            true,
            true,
            true,
            true,
            true,
            true
        );
        
        -- Recupera le impostazioni appena create
        SELECT * INTO web_settings 
        FROM salon_web_settings 
        WHERE salon_id = p_salon_id;
    END IF;
    
    -- Verifica che la pagina web non sia già abilitata
    IF web_settings.web_enabled THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'La pagina web è già abilitata per questo salone'
        );
    END IF;
    
    -- Genera un subdomain unico usando il titolo web o un default
    generated_subdomain := generate_unique_subdomain(COALESCE(p_web_title, 'salone'));
    
    -- Aggiorna le impostazioni web
    UPDATE salon_web_settings SET
        web_enabled = true,
        web_subdomain = generated_subdomain,
        web_title = COALESCE(p_web_title, 'Il Mio Salone'),
        web_description = COALESCE(p_web_description, 'Prenota il tuo appuntamento online'),
        updated_at = NOW()
    WHERE salon_id = p_salon_id;
    
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

-- Funzione per disabilitare la pagina web di un salone
CREATE OR REPLACE FUNCTION disable_salon_web_page(
    p_user_id UUID,
    p_salon_id UUID
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    web_settings RECORD;
BEGIN
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
    
    -- Recupera le impostazioni web del salone
    SELECT * INTO web_settings 
    FROM salon_web_settings 
    WHERE salon_id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Impostazioni web non trovate per questo salone');
    END IF;
    
    -- Verifica che la pagina web sia attualmente abilitata
    IF NOT web_settings.web_enabled THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'La pagina web non è attualmente abilitata'
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

-- Funzione per aggiornare le impostazioni della pagina web
CREATE OR REPLACE FUNCTION update_salon_web_settings(
    p_user_id UUID,
    p_salon_id UUID,
    p_settings JSON
)
RETURNS JSON AS $$
DECLARE
    user_profile RECORD;
    web_settings RECORD;
    setting_key TEXT;
    setting_value TEXT;
BEGIN
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
    
    -- Recupera le impostazioni web esistenti
    SELECT * INTO web_settings 
    FROM salon_web_settings 
    WHERE salon_id = p_salon_id;
    
    -- Se non esistono, le creiamo
    IF NOT FOUND THEN
        INSERT INTO salon_web_settings (salon_id) VALUES (p_salon_id);
    END IF;
    
    -- Aggiorna le impostazioni
    UPDATE salon_web_settings SET
        updated_at = NOW()
    WHERE salon_id = p_salon_id;
    
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

-- Commenti per documentazione
COMMENT ON FUNCTION generate_unique_subdomain IS 'Genera un subdomain unico basato sul nome del salone';
COMMENT ON FUNCTION enable_salon_web_page IS 'Abilita la pagina web di un salone (versione corretta senza dipendenza da tabella salon)';
COMMENT ON FUNCTION disable_salon_web_page IS 'Disabilita la pagina web di un salone';
COMMENT ON FUNCTION update_salon_web_settings IS 'Aggiorna le impostazioni della pagina web di un salone'; 