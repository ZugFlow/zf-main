-- Script per inizializzare le categorie dai servizi esistenti
-- Questo script estrae le categorie uniche dai servizi esistenti e le inserisce nella tabella service_categories

-- Prima crea la tabella se non esiste
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    salon_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci categorie uniche dai servizi esistenti
INSERT INTO service_categories (name, salon_id)
SELECT DISTINCT category, salon_id
FROM services 
WHERE category IS NOT NULL 
  AND category != ''
  AND salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.name = services.category 
      AND sc.salon_id = services.salon_id
  );

-- Crea indici se non esistono
CREATE INDEX IF NOT EXISTS idx_service_categories_salon_id ON service_categories(salon_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_categories_salon_name ON service_categories(salon_id, name); 