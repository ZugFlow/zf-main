-- Tabella per i template SMS personalizzabili
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES profiles(salon_id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL, -- 'confirmation', 'reminder', 'cancellation', 'modification', 'welcome'
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Assicura che ogni salone abbia un solo template attivo per tipo
  UNIQUE(salon_id, template_type, is_active)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_sms_templates_salon_id ON sms_templates(salon_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates(template_type);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_sms_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sms_templates_updated_at 
  BEFORE UPDATE ON sms_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_sms_templates_updated_at();

-- Funzione per disattivare altri template quando se ne attiva uno nuovo
CREATE OR REPLACE FUNCTION ensure_single_active_sms_template()
RETURNS TRIGGER AS $$
BEGIN
  -- Se stiamo attivando un template, disattiva tutti gli altri dello stesso tipo per lo stesso salone
  IF NEW.is_active = true THEN
    UPDATE sms_templates 
    SET is_active = false 
    WHERE salon_id = NEW.salon_id 
      AND template_type = NEW.template_type 
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per assicurare che ci sia solo un template attivo per tipo per salone
CREATE TRIGGER ensure_single_active_sms_template_trigger
  BEFORE INSERT OR UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_sms_template();

-- Inserimento template di default per conferma prenotazione
INSERT INTO sms_templates (salon_id, template_type, content) 
SELECT 
  p.salon_id,
  'confirmation',
  'Ciao {{customer_name}}! La tua prenotazione per {{appointment_date}} alle {{appointment_time}} è confermata. {{salon_name}}'
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, template_type, is_active) DO NOTHING;

-- Template di default per promemoria
INSERT INTO sms_templates (salon_id, template_type, content) 
SELECT 
  p.salon_id,
  'reminder',
  'Promemoria: hai un appuntamento domani alle {{appointment_time}} presso {{salon_name}}. {{team_member_name}} ti aspetta!'
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, template_type, is_active) DO NOTHING;

-- Template di default per cancellazione
INSERT INTO sms_templates (salon_id, template_type, content) 
SELECT 
  p.salon_id,
  'cancellation',
  'Ciao {{customer_name}}, la tua prenotazione per {{appointment_date}} alle {{appointment_time}} è stata cancellata. Per riprogrammare contattaci.'
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, template_type, is_active) DO NOTHING;

-- Template di default per modifica
INSERT INTO sms_templates (salon_id, template_type, content) 
SELECT 
  p.salon_id,
  'modification',
  'Ciao {{customer_name}}! La tua prenotazione è stata modificata: {{appointment_date}} alle {{appointment_time}}. {{salon_name}}'
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, template_type, is_active) DO NOTHING;

-- Template di default per benvenuto
INSERT INTO sms_templates (salon_id, template_type, content) 
SELECT 
  p.salon_id,
  'welcome',
  'Benvenuto {{customer_name}}! Grazie per aver scelto {{salon_name}}. Il tuo primo appuntamento è confermato per {{appointment_date}} alle {{appointment_time}}.'
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, template_type, is_active) DO NOTHING; 