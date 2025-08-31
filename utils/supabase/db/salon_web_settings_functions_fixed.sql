-- =====================================================
-- FUNZIONI PER LA GESTIONE DELLE PAGINE WEB SALON
-- Compatibili con la tabella salon_web_settings
-- =====================================================

-- Prima droppiamo le funzioni esistenti per evitare conflitti
DROP FUNCTION IF EXISTS generate_unique_subdomain(TEXT);
DROP FUNCTION IF EXISTS enable_salon_web_page(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS enable_salon_web_page(UUID, UUID);
DROP FUNCTION IF EXISTS disable_salon_web_page(UUID, UUID);
DROP FUNCTION IF EXISTS update_salon_web_settings(UUID, UUID, JSON);

-- Funzione per generare subdomain unico
-- Modificata per lavorare con salon_web_settings invece di salon
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
    -- Modificato per controllare salon_web_settings invece di salon
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

-- Funzione per abilitare la pagina web di un salone
-- Modificata per lavorare con salon_web_settings
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
    salon_record RECORD;
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
    
    -- Recupera i dati del salone per il nome
    SELECT * INTO salon_record FROM salon WHERE id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Salone non trovato');
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
            COALESCE(p_web_title, salon_record.name),
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
    
    -- Genera un subdomain unico
    generated_subdomain := generate_unique_subdomain(salon_record.name);
    
    -- Aggiorna le impostazioni web
    UPDATE salon_web_settings SET
        web_enabled = true,
        web_subdomain = generated_subdomain,
        web_title = COALESCE(p_web_title, salon_record.name),
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
            'error', 'Errore durante labilitazione della pagina web: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per disabilitare la pagina web di un salone
-- Modificata per lavorare con salon_web_settings
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
-- Modificata per lavorare con salon_web_settings
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
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Impostazioni web non trovate per questo salone');
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
            'error', 'Errore durante laggiornamento: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commenti per documentare le funzioni
COMMENT ON FUNCTION generate_unique_subdomain IS 'Genera un subdomain unico per un salone, compatibile con salon_web_settings';
COMMENT ON FUNCTION enable_salon_web_page IS 'Abilita la pagina web di un salone utilizzando la tabella salon_web_settings';
COMMENT ON FUNCTION disable_salon_web_page IS 'Disabilita la pagina web di un salone utilizzando la tabella salon_web_settings';
COMMENT ON FUNCTION update_salon_web_settings IS 'Aggiorna le impostazioni della pagina web utilizzando la tabella salon_web_settings'; 