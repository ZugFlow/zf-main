-- Aggiungi constraint di unicità per prevenire duplicazioni nella tabella order_services
-- Questo garantisce che non possano esistere due record con lo stesso order_id e service_id

-- Prima rimuovi eventuali duplicati esistenti
DELETE FROM order_services 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM order_services 
  GROUP BY order_id, service_id
);

-- Aggiungi il constraint di unicità
ALTER TABLE order_services 
ADD CONSTRAINT unique_order_service 
UNIQUE (order_id, service_id);

-- Aggiungi anche un indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_order_services_order_service 
ON order_services (order_id, service_id);

-- Commento per documentare il constraint
COMMENT ON CONSTRAINT unique_order_service ON order_services IS 
'Prevents duplicate services for the same order'; 