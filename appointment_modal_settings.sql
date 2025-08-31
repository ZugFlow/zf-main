-- Tabella per le impostazioni personalizzate del modal di nuovo appuntamento
-- CORRETTA: Utilizza salon_id dalla tabella profiles, non da una tabella salon separata

CREATE TABLE IF NOT EXISTS appointment_modal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL UNIQUE,
    
    -- Testi personalizzabili
    modal_title VARCHAR(255) DEFAULT 'Nuovo Appuntamento',
    modal_subtitle VARCHAR(500),
    client_section_title VARCHAR(255) DEFAULT 'Cliente',
    service_section_title VARCHAR(255) DEFAULT 'Servizi',
    time_section_title VARCHAR(255) DEFAULT 'Data e Orario',
    notes_section_title VARCHAR(255) DEFAULT 'Note',
    price_section_title VARCHAR(255) DEFAULT 'Prezzo',
    
    -- Testi dei campi
    client_name_label VARCHAR(255) DEFAULT 'Nome Cliente',
    client_phone_label VARCHAR(255) DEFAULT 'Telefono',
    client_email_label VARCHAR(255) DEFAULT 'Email',
    service_label VARCHAR(255) DEFAULT 'Servizio',
    date_label VARCHAR(255) DEFAULT 'Data',
    start_time_label VARCHAR(255) DEFAULT 'Orario Inizio',
    end_time_label VARCHAR(255) DEFAULT 'Orario Fine',
    team_member_label VARCHAR(255) DEFAULT 'Membro del Team',
    notes_label VARCHAR(255) DEFAULT 'Note',
    price_label VARCHAR(255) DEFAULT 'Prezzo',
    status_label VARCHAR(255) DEFAULT 'Stato',
    
    -- Placeholder dei campi
    client_name_placeholder VARCHAR(255) DEFAULT 'Inserisci il nome del cliente',
    client_phone_placeholder VARCHAR(255) DEFAULT 'Inserisci il telefono',
    client_email_placeholder VARCHAR(255) DEFAULT 'Inserisci l''email',
    notes_placeholder VARCHAR(500) DEFAULT 'Inserisci eventuali note',
    price_placeholder VARCHAR(255) DEFAULT '0.00',
    
    -- Testi dei pulsanti
    save_button_text VARCHAR(255) DEFAULT 'Salva Appuntamento',
    cancel_button_text VARCHAR(255) DEFAULT 'Annulla',
    add_service_button_text VARCHAR(255) DEFAULT 'Aggiungi Servizio',
    remove_service_button_text VARCHAR(255) DEFAULT 'Rimuovi',
    search_client_button_text VARCHAR(255) DEFAULT 'Cerca Cliente',
    new_client_button_text VARCHAR(255) DEFAULT 'Nuovo Cliente',
    
    -- Messaggi di validazione
    required_field_message VARCHAR(255) DEFAULT 'Campo obbligatorio',
    invalid_email_message VARCHAR(255) DEFAULT 'Email non valida',
    invalid_phone_message VARCHAR(255) DEFAULT 'Telefono non valido',
    invalid_time_message VARCHAR(255) DEFAULT 'Orario non valido',
    end_time_before_start_message VARCHAR(255) DEFAULT 'L''orario di fine deve essere successivo all''orario di inizio',
    
    -- Funzionalità abilitate/disabilitate
    enable_client_search BOOLEAN DEFAULT true,
    enable_new_client_creation BOOLEAN DEFAULT true,
    enable_service_selection BOOLEAN DEFAULT true,
    enable_multiple_services BOOLEAN DEFAULT true,
    enable_price_editing BOOLEAN DEFAULT true,
    enable_notes BOOLEAN DEFAULT true,
    enable_status_selection BOOLEAN DEFAULT true,
    enable_team_selection BOOLEAN DEFAULT true,
    enable_notifications BOOLEAN DEFAULT true,
    enable_color_selection BOOLEAN DEFAULT true,
    enable_card_style_selection BOOLEAN DEFAULT true,
    
    -- Impostazioni di validazione
    require_client_name BOOLEAN DEFAULT true,
    require_client_phone BOOLEAN DEFAULT false,
    require_client_email BOOLEAN DEFAULT false,
    require_service_selection BOOLEAN DEFAULT true,
    require_team_selection BOOLEAN DEFAULT true,
    require_price BOOLEAN DEFAULT false,
    
    -- Impostazioni di visualizzazione
    show_client_section BOOLEAN DEFAULT true,
    show_service_section BOOLEAN DEFAULT true,
    show_time_section BOOLEAN DEFAULT true,
    show_notes_section BOOLEAN DEFAULT true,
    show_price_section BOOLEAN DEFAULT true,
    show_status_section BOOLEAN DEFAULT true,
    show_team_section BOOLEAN DEFAULT true,
    show_notifications_section BOOLEAN DEFAULT true,
    show_color_section BOOLEAN DEFAULT true,
    show_card_style_section BOOLEAN DEFAULT true,
    
    -- Impostazioni di layout
    modal_width VARCHAR(20) DEFAULT 'lg', -- sm, md, lg, xl, 2xl
    modal_height VARCHAR(20) DEFAULT 'auto', -- auto, sm, md, lg, xl
    form_layout VARCHAR(20) DEFAULT 'vertical', -- vertical, horizontal, grid
    sections_order JSONB DEFAULT '["client", "service", "time", "team", "price", "status", "notes", "notifications", "color", "card_style"]',
    
    -- Impostazioni avanzate
    auto_calculate_price BOOLEAN DEFAULT true,
    auto_suggest_end_time BOOLEAN DEFAULT true,
    default_duration_minutes INTEGER DEFAULT 60,
    max_services_per_appointment INTEGER DEFAULT 10,
    allow_overlapping_appointments BOOLEAN DEFAULT false,
    show_confirmation_dialog BOOLEAN DEFAULT true,
    
    -- Stili personalizzati
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
    success_color VARCHAR(7) DEFAULT '#10b981',
    warning_color VARCHAR(7) DEFAULT '#f59e0b',
    error_color VARCHAR(7) DEFAULT '#ef4444',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    -- CORRETTA: Riferimento alla tabella profiles usando salon_id
    CONSTRAINT fk_appointment_modal_settings_salon_id 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_appointment_modal_settings_salon_id 
    ON appointment_modal_settings(salon_id);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_appointment_modal_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointment_modal_settings_updated_at
    BEFORE UPDATE ON appointment_modal_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_modal_settings_updated_at();

-- Inserimento record di default per profili esistenti
-- CORRETTA: Usa profiles invece di salon
INSERT INTO appointment_modal_settings (salon_id)
SELECT salon_id FROM profiles
WHERE salon_id IS NOT NULL 
  AND salon_id NOT IN (SELECT salon_id FROM appointment_modal_settings)
ON CONFLICT (salon_id) DO NOTHING;
