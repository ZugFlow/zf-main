-- Tabella per i template email personalizzabili
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES profiles(salon_id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL, -- 'confirmation', 'cancellation', 'modification'
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Assicura che ogni salone abbia un solo template attivo per tipo
  UNIQUE(salon_id, template_type, is_active)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_email_templates_salon_id ON email_templates(salon_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON email_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Funzione per disattivare altri template quando se ne attiva uno nuovo
CREATE OR REPLACE FUNCTION ensure_single_active_template()
RETURNS TRIGGER AS $$
BEGIN
  -- Se stiamo attivando un template, disattiva tutti gli altri dello stesso tipo per lo stesso salone
  IF NEW.is_active = true THEN
    UPDATE email_templates 
    SET is_active = false 
    WHERE salon_id = NEW.salon_id 
      AND template_type = NEW.template_type 
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per assicurare che ci sia solo un template attivo per tipo per salone
CREATE TRIGGER ensure_single_active_template_trigger
  BEFORE INSERT OR UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_template();

-- Inserimento template di default per conferma prenotazione
INSERT INTO email_templates (salon_id, template_type, subject, html_content, text_content) 
SELECT 
  p.salon_id,
  'confirmation',
  '✅ Prenotazione Confermata - {{salon_name}}',
  '<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prenotazione Confermata</title>
  <style>
    body {
      font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background-color: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #8B5CF6;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #8B5CF6;
      margin-bottom: 10px;
    }
    .title {
      color: #2d3748;
      font-size: 20px;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .booking-details {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #8B5CF6;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 5px 0;
    }
    .detail-label {
      font-weight: 600;
      color: #4a5568;
    }
    .detail-value {
      color: #2d3748;
    }
    .salon-info {
      background-color: #edf2f7;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #718096;
      font-size: 14px;
    }
    .highlight {
      color: #8B5CF6;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background-color: #8B5CF6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
      font-weight: 600;
    }
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
        gap: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">{{salon_name}}</div>
      <h1 class="title">Prenotazione Confermata! ✅</h1>
    </div>
    
    <div class="content">
      <p>Ciao <span class="highlight">{{customer_name}}</span>,</p>
      
      <p>Siamo felici di confermare la tua prenotazione! La tua richiesta è stata approvata e siamo pronti ad accoglierti.</p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #8B5CF6;">Dettagli della Prenotazione</h3>
        
        <div class="detail-row">
          <span class="detail-label">Servizio:</span>
          <span class="detail-value">{{service_name}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Data:</span>
          <span class="detail-value">{{appointment_date}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Orario:</span>
          <span class="detail-value">{{appointment_time}}</span>
        </div>
      </div>
      
      <div class="salon-info">
        <h4 style="margin-top: 0; color: #4a5568;">Informazioni del Salone</h4>
        <p style="margin: 5px 0;"><strong>{{salon_name}}</strong></p>
        {{#if salon_address}}<p style="margin: 5px 0;">📍 {{salon_address}}</p>{{/if}}
        {{#if salon_phone}}<p style="margin: 5px 0;">📞 {{salon_phone}}</p>{{/if}}
      </div>
      
      <p><strong>Importante:</strong></p>
      <ul>
        <li>Ti preghiamo di arrivare 10 minuti prima dell''orario fissato</li>
        <li>In caso di impossibilità, contattaci il prima possibile</li>
        <li>Porta con te un documento d''identità se richiesto</li>
      </ul>
      
      <p>Non vediamo l''ora di vederti! Se hai domande, non esitare a contattarci.</p>
      
      <p>Cordiali saluti,<br>
      <strong>Il team di {{salon_name}}</strong></p>
    </div>
    
    <div class="footer">
      <p>Questa email è stata inviata automaticamente. Non rispondere a questo messaggio.</p>
      <p>Per modificare o cancellare la prenotazione, contatta direttamente il salone.</p>
    </div>
  </div>
</body>
</html>',
  'Prenotazione Confermata - {{salon_name}}

Ciao {{customer_name}},

Siamo felici di confermare la tua prenotazione!

DETTAGLI PRENOTAZIONE:
- Servizio: {{service_name}}
- Data: {{appointment_date}}
- Orario: {{appointment_time}}

{{#if salon_address}}Indirizzo: {{salon_address}}{{/if}}
{{#if salon_phone}}Telefono: {{salon_phone}}{{/if}}

IMPORTANTE:
- Arriva 10 minuti prima dell''orario fissato
- In caso di impossibilità, contattaci il prima possibile

Cordiali saluti,
Il team di {{salon_name}}'
FROM profiles p
WHERE p.salon_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM email_templates et 
  WHERE et.salon_id = p.salon_id 
  AND et.template_type = 'confirmation'
);

-- Inserimento template di default per cancellazione prenotazione
INSERT INTO email_templates (salon_id, template_type, subject, html_content, text_content) 
SELECT 
  p.salon_id,
  'cancellation',
  '❌ Prenotazione Annullata - {{salon_name}}',
  '<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prenotazione Annullata</title>
  <style>
    body {
      font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background-color: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #dc2626;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 10px;
    }
    .title {
      color: #2d3748;
      font-size: 20px;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .booking-details {
      background-color: #fef2f2;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #dc2626;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 5px 0;
    }
    .detail-label {
      font-weight: 600;
      color: #4a5568;
    }
    .detail-value {
      color: #2d3748;
    }
    .salon-info {
      background-color: #edf2f7;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #718096;
      font-size: 14px;
    }
    .highlight {
      color: #dc2626;
      font-weight: 600;
    }
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
        gap: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">{{salon_name}}</div>
      <h1 class="title">Prenotazione Annullata ❌</h1>
    </div>
    
    <div class="content">
      <p>Ciao <span class="highlight">{{customer_name}}</span>,</p>
      
      <p>Ci dispiace informarti che la tua prenotazione è stata annullata.</p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #dc2626;">Dettagli della Prenotazione Annullata</h3>
        
        <div class="detail-row">
          <span class="detail-label">Servizio:</span>
          <span class="detail-value">{{service_name}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Data:</span>
          <span class="detail-value">{{appointment_date}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Orario:</span>
          <span class="detail-value">{{appointment_time}}</span>
        </div>
      </div>
      
      <div class="salon-info">
        <h4 style="margin-top: 0; color: #4a5568;">Informazioni del Salone</h4>
        <p style="margin: 5px 0;"><strong>{{salon_name}}</strong></p>
        {{#if salon_address}}<p style="margin: 5px 0;">📍 {{salon_address}}</p>{{/if}}
        {{#if salon_phone}}<p style="margin: 5px 0;">📞 {{salon_phone}}</p>{{/if}}
      </div>
      
      <p>Per prenotare un nuovo appuntamento, contattaci direttamente o visita il nostro sito web.</p>
      
      <p>Ci scusiamo per l''inconveniente.</p>
      
      <p>Cordiali saluti,<br>
      <strong>Il team di {{salon_name}}</strong></p>
    </div>
    
    <div class="footer">
      <p>Questa email è stata inviata automaticamente. Non rispondere a questo messaggio.</p>
      <p>Per ulteriori informazioni, contatta direttamente il salone.</p>
    </div>
  </div>
</body>
</html>',
  'Prenotazione Annullata - {{salon_name}}

Ciao {{customer_name}},

Ci dispiace informarti che la tua prenotazione è stata annullata.

DETTAGLI PRENOTAZIONE ANNULLATA:
- Servizio: {{service_name}}
- Data: {{appointment_date}}
- Orario: {{appointment_time}}

{{#if salon_address}}Indirizzo: {{salon_address}}{{/if}}
{{#if salon_phone}}Telefono: {{salon_phone}}{{/if}}

Per prenotare un nuovo appuntamento, contattaci direttamente o visita il nostro sito web.

Ci scusiamo per l''inconveniente.

Cordiali saluti,
Il team di {{salon_name}}'
FROM profiles p
WHERE p.salon_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM email_templates et 
  WHERE et.salon_id = p.salon_id 
  AND et.template_type = 'cancellation'
);

-- Inserimento template di default per modifica prenotazione
INSERT INTO email_templates (salon_id, template_type, subject, html_content, text_content) 
SELECT 
  p.salon_id,
  'modification',
  '🔄 Prenotazione Modificata - {{salon_name}}',
  '<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prenotazione Modificata</title>
  <style>
    body {
      font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background-color: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f59e0b;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #f59e0b;
      margin-bottom: 10px;
    }
    .title {
      color: #2d3748;
      font-size: 20px;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .booking-details {
      background-color: #fffbeb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #f59e0b;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 5px 0;
    }
    .detail-label {
      font-weight: 600;
      color: #4a5568;
    }
    .detail-value {
      color: #2d3748;
    }
    .salon-info {
      background-color: #edf2f7;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #718096;
      font-size: 14px;
    }
    .highlight {
      color: #f59e0b;
      font-weight: 600;
    }
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
        gap: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">{{salon_name}}</div>
      <h1 class="title">Prenotazione Modificata 🔄</h1>
    </div>
    
    <div class="content">
      <p>Ciao <span class="highlight">{{customer_name}}</span>,</p>
      
      <p>La tua prenotazione è stata modificata. Ecco i nuovi dettagli:</p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #f59e0b;">Nuovi Dettagli della Prenotazione</h3>
        
        <div class="detail-row">
          <span class="detail-label">Servizio:</span>
          <span class="detail-value">{{service_name}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Data:</span>
          <span class="detail-value">{{appointment_date}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Orario:</span>
          <span class="detail-value">{{appointment_time}}</span>
        </div>
      </div>
      
      <div class="salon-info">
        <h4 style="margin-top: 0; color: #4a5568;">Informazioni del Salone</h4>
        <p style="margin: 5px 0;"><strong>{{salon_name}}</strong></p>
        {{#if salon_address}}<p style="margin: 5px 0;">📍 {{salon_address}}</p>{{/if}}
        {{#if salon_phone}}<p style="margin: 5px 0;">📞 {{salon_phone}}</p>{{/if}}
      </div>
      
      <p><strong>Importante:</strong></p>
      <ul>
        <li>Ti preghiamo di arrivare 10 minuti prima del nuovo orario fissato</li>
        <li>In caso di impossibilità, contattaci il prima possibile</li>
        <li>Porta con te un documento d''identità se richiesto</li>
      </ul>
      
      <p>Ci scusiamo per l''inconveniente e ti ringraziamo per la comprensione.</p>
      
      <p>Cordiali saluti,<br>
      <strong>Il team di {{salon_name}}</strong></p>
    </div>
    
    <div class="footer">
      <p>Questa email è stata inviata automaticamente. Non rispondere a questo messaggio.</p>
      <p>Per ulteriori modifiche, contatta direttamente il salone.</p>
    </div>
  </div>
</body>
</html>',
  'Prenotazione Modificata - {{salon_name}}

Ciao {{customer_name}},

La tua prenotazione è stata modificata. Ecco i nuovi dettagli:

NUOVI DETTAGLI PRENOTAZIONE:
- Servizio: {{service_name}}
- Data: {{appointment_date}}
- Orario: {{appointment_time}}

{{#if salon_address}}Indirizzo: {{salon_address}}{{/if}}
{{#if salon_phone}}Telefono: {{salon_phone}}{{/if}}

IMPORTANTE:
- Arriva 10 minuti prima del nuovo orario fissato
- In caso di impossibilità, contattaci il prima possibile

Ci scusiamo per l''inconveniente e ti ringraziamo per la comprensione.

Cordiali saluti,
Il team di {{salon_name}}'
FROM profiles p
WHERE p.salon_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM email_templates et 
  WHERE et.salon_id = p.salon_id 
  AND et.template_type = 'modification'
); 