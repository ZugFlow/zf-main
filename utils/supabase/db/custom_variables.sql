-- Tabella per le variabili personalizzabili (sistema tipo Power Automate)
CREATE TABLE IF NOT EXISTS custom_variables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salon(id) ON DELETE CASCADE,
  variable_name VARCHAR(100) NOT NULL, -- '{{WELCOME_MESSAGE}}', '{{CUSTOM_GREETING}}', etc.
  variable_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Assicura che ogni salone abbia una sola variabile attiva per nome
  UNIQUE(salon_id, variable_name)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_custom_variables_salon_id ON custom_variables(salon_id);
CREATE INDEX IF NOT EXISTS idx_custom_variables_name ON custom_variables(variable_name);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_custom_variables_updated_at 
  BEFORE UPDATE ON custom_variables 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger per disattivare variabili vecchie quando se ne inserisce una nuova
CREATE OR REPLACE FUNCTION deactivate_old_custom_variables()
RETURNS TRIGGER AS $$
BEGIN
  -- Disattiva tutte le variabili esistenti per lo stesso nome e salone
  UPDATE custom_variables 
  SET is_active = false 
  WHERE salon_id = NEW.salon_id 
    AND variable_name = NEW.variable_name 
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deactivate_old_custom_variables
  BEFORE INSERT OR UPDATE ON custom_variables
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_old_custom_variables();

-- Inserimento di alcune variabili di esempio per ogni salone
INSERT INTO custom_variables (salon_id, variable_name, variable_value, description) 
SELECT 
  p.salon_id,
  '{{WELCOME_MESSAGE}}',
  'Benvenuto {{CLIENT_NAME}}! Grazie per aver scelto {{SALON_NAME}}.',
  'Messaggio di benvenuto personalizzabile'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_variables cv 
    WHERE cv.salon_id = p.salon_id 
      AND cv.variable_name = '{{WELCOME_MESSAGE}}'
      AND cv.is_active = true
  );

INSERT INTO custom_variables (salon_id, variable_name, variable_value, description) 
SELECT 
  p.salon_id,
  '{{BOOKING_CONFIRMATION}}',
  'La tua prenotazione per {{SERVICE_NAME}} è confermata per il {{APPOINTMENT_DATE}} alle {{APPOINTMENT_TIME}}.',
  'Messaggio di conferma prenotazione personalizzabile'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_variables cv 
    WHERE cv.salon_id = p.salon_id 
      AND cv.variable_name = '{{BOOKING_CONFIRMATION}}'
      AND cv.is_active = true
  );

INSERT INTO custom_variables (salon_id, variable_name, variable_value, description) 
SELECT 
  p.salon_id,
  '{{CUSTOM_GREETING}}',
  'Ciao {{CLIENT_NAME}}! Come possiamo aiutarti oggi?',
  'Saluto personalizzabile'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_variables cv 
    WHERE cv.salon_id = p.salon_id 
      AND cv.variable_name = '{{CUSTOM_GREETING}}'
      AND cv.is_active = true
  );

INSERT INTO custom_variables (salon_id, variable_name, variable_value, description) 
SELECT 
  p.salon_id,
  '{{FOOTER_MESSAGE}}',
  'Per informazioni: {{PHONE_NUMBER}} - {{SALON_NAME}}',
  'Messaggio di footer personalizzabile'
FROM profiles p
WHERE p.salon_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM custom_variables cv 
    WHERE cv.salon_id = p.salon_id 
      AND cv.variable_name = '{{FOOTER_MESSAGE}}'
      AND cv.is_active = true
  ); 