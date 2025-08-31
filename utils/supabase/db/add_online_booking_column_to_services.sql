-- Aggiunge la colonna online_booking_enabled alla tabella services
-- per controllare se un servizio è disponibile per prenotazioni online

ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS online_booking_enabled BOOLEAN DEFAULT true;

-- Aggiunge un commento alla colonna per documentazione
COMMENT ON COLUMN public.services.online_booking_enabled IS 'Determina se il servizio è disponibile per prenotazioni online';

-- Crea un indice per ottimizzare le query sui servizi disponibili online
CREATE INDEX IF NOT EXISTS idx_services_online_booking_enabled 
ON public.services(online_booking_enabled) 
WHERE online_booking_enabled = true;

-- Aggiorna i servizi esistenti per avere online_booking_enabled = true di default
-- (solo se la colonna è stata appena aggiunta)
UPDATE public.services 
SET online_booking_enabled = true 
WHERE online_booking_enabled IS NULL; 