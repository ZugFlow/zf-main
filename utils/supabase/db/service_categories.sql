-- Creazione della tabella service_categories
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    salon_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_service_categories_salon_id ON service_categories(salon_id);

-- Indice unico per evitare categorie duplicate per lo stesso salon
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_categories_salon_name ON service_categories(salon_id, name);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_categories_updated_at 
    BEFORE UPDATE ON service_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 