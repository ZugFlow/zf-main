-- Tabella per i servizi del salone
CREATE TABLE IF NOT EXISTS salon_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    duration INTEGER NOT NULL DEFAULT 60, -- in minutes
    category VARCHAR(100) DEFAULT 'hair',
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'scissors',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_salon_services_salon_id 
        FOREIGN KEY (salon_id) REFERENCES salon_web_settings(salon_id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_salon_services_salon_id ON salon_services(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_services_active ON salon_services(is_active);
CREATE INDEX IF NOT EXISTS idx_salon_services_sort_order ON salon_services(sort_order);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_salon_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salon_services_updated_at
    BEFORE UPDATE ON salon_services
    FOR EACH ROW
    EXECUTE FUNCTION update_salon_services_updated_at();
