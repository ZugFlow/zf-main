-- Funzione per disabilitare la pagina web di un salone
-- Utilizza la tabella salon_web_settings invece di salon
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

-- Commento per documentare la funzione
COMMENT ON FUNCTION disable_salon_web_page IS 'Disabilita la pagina web di un salone utilizzando la tabella salon_web_settings'; 