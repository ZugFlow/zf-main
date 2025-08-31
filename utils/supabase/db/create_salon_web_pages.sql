-- Creazione delle tabelle per le pagine web dei saloni
-- Questo script estende il sistema esistente per supportare pagine web personalizzate

-- 1. Estensione della tabella salon per supportare le pagine web
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_enabled BOOLEAN DEFAULT false;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_domain VARCHAR(255) UNIQUE;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_subdomain VARCHAR(100) UNIQUE;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_title VARCHAR(255);
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_description TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_logo_url TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_theme VARCHAR(50) DEFAULT 'default';
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_primary_color VARCHAR(7) DEFAULT '#6366f1';
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_secondary_color VARCHAR(7) DEFAULT '#8b5cf6';
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_contact_email VARCHAR(255);
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_contact_phone VARCHAR(50);
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_address TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_social_facebook VARCHAR(255);
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_social_instagram VARCHAR(255);
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_social_twitter VARCHAR(255);
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_google_analytics_id VARCHAR(50);
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_meta_title VARCHAR(255);
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_meta_description TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_meta_keywords TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_og_image_url TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_favicon_url TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_custom_css TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_custom_js TEXT;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_booking_enabled BOOLEAN DEFAULT true;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_services_visible BOOLEAN DEFAULT true;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_team_visible BOOLEAN DEFAULT true;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_gallery_visible BOOLEAN DEFAULT true;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_testimonials_visible BOOLEAN DEFAULT true;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_contact_form_enabled BOOLEAN DEFAULT true;
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE salon ADD COLUMN IF NOT EXISTS web_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Tabella per le gallerie fotografiche dei saloni
CREATE TABLE IF NOT EXISTS salon_galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salon(id) ON DELETE CASCADE,
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

-- 3. Tabella per i testimonial dei clienti
CREATE TABLE IF NOT EXISTS salon_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salon(id) ON DELETE CASCADE,
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

-- 4. Tabella per le prenotazioni online
CREATE TABLE IF NOT EXISTS web_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salon(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    service_id INTEGER REFERENCES services(id),
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

-- 5. Tabella per i messaggi del form di contatto
CREATE TABLE IF NOT EXISTS web_contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salon(id) ON DELETE CASCADE,
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

-- 6. Tabella per le statistiche delle pagine web
CREATE TABLE IF NOT EXISTS web_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salon(id) ON DELETE CASCADE,
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

-- Indici per ottimizzare le performance
CREATE INDEX IF NOT EXISTS idx_salon_web_domain ON salon(web_domain);
CREATE INDEX IF NOT EXISTS idx_salon_web_subdomain ON salon(web_subdomain);
CREATE INDEX IF NOT EXISTS idx_salon_web_enabled ON salon(web_enabled);

CREATE INDEX IF NOT EXISTS idx_salon_galleries_salon_id ON salon_galleries(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_galleries_category ON salon_galleries(category);
CREATE INDEX IF NOT EXISTS idx_salon_galleries_active ON salon_galleries(is_active);

CREATE INDEX IF NOT EXISTS idx_salon_testimonials_salon_id ON salon_testimonials(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_testimonials_approved ON salon_testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_salon_testimonials_featured ON salon_testimonials(is_featured);

CREATE INDEX IF NOT EXISTS idx_web_bookings_salon_id ON web_bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_web_bookings_date ON web_bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_web_bookings_status ON web_bookings(status);
CREATE INDEX IF NOT EXISTS idx_web_bookings_email ON web_bookings(customer_email);

CREATE INDEX IF NOT EXISTS idx_web_contact_messages_salon_id ON web_contact_messages(salon_id);
CREATE INDEX IF NOT EXISTS idx_web_contact_messages_read ON web_contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_web_contact_messages_date ON web_contact_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_web_analytics_salon_id ON web_analytics(salon_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_date ON web_analytics(visit_date);
CREATE INDEX IF NOT EXISTS idx_web_analytics_session ON web_analytics(session_id);

-- Trigger per aggiornare web_updated_at
CREATE OR REPLACE FUNCTION update_salon_web_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.web_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salon_web_updated_at
    BEFORE UPDATE ON salon
    FOR EACH ROW
    EXECUTE FUNCTION update_salon_web_updated_at();

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
    WHILE EXISTS (SELECT 1 FROM salon WHERE web_subdomain = final_subdomain) LOOP
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
CREATE OR REPLACE FUNCTION enable_salon_web_page(
    p_salon_id UUID,
    p_web_title TEXT DEFAULT NULL,
    p_web_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    salon_record RECORD;
    generated_subdomain TEXT;
    result JSON;
BEGIN
    -- Recupera i dati del salone
    SELECT * INTO salon_record FROM salon WHERE id = p_salon_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Salone non trovato');
    END IF;
    
    -- Genera un subdomain unico
    generated_subdomain := generate_unique_subdomain(salon_record.name);
    
    -- Aggiorna il salone con le impostazioni web
    UPDATE salon SET
        web_enabled = true,
        web_subdomain = generated_subdomain,
        web_title = COALESCE(p_web_title, salon_record.name),
        web_description = COALESCE(p_web_description, 'Prenota il tuo appuntamento online'),
        web_updated_at = NOW()
    WHERE id = p_salon_id;
    
    result := json_build_object(
        'success', true,
        'subdomain', generated_subdomain,
        'web_url', 'https://' || generated_subdomain || '.zugflow.com'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Inserisci alcuni dati di esempio per i saloni esistenti
-- (Questo può essere eseguito manualmente per i saloni che vogliono abilitare le pagine web) 