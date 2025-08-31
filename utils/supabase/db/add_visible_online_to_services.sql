-- Aggiungi il campo visible_online alla tabella services
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS visible_online BOOLEAN DEFAULT true;

-- Aggiungi il campo visible_online alla tabella team
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS visible_online BOOLEAN DEFAULT true;

-- Aggiorna tutti i servizi esistenti per essere visibili online di default
UPDATE services 
SET visible_online = true 
WHERE visible_online IS NULL;

-- Aggiorna tutti i membri del team esistenti per essere visibili online di default
UPDATE team 
SET visible_online = true 
WHERE visible_online IS NULL; 