-- Script per creare la tabella appointment_notification_settings
-- Esegui questo script nel database Supabase

-- Elimina la tabella se esiste (per testing)
DROP TABLE IF EXISTS appointment_notification_settings CASCADE;

-- Crea la tabella appointment_notification_settings
CREATE TABLE public.appointment_notification_settings (
  id uuid not null default gen_random_uuid(),
  salon_id uuid not null,
  enabled boolean not null default true,
  days_before_appointment integer not null default 1,
  notification_hour time not null default '09:00:00',
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint appointment_notification_settings_pkey primary key (id),
  constraint appointment_notification_settings_salon_id_key unique (salon_id),
  constraint appointment_notification_settings_salon_id_fkey foreign key (salon_id) references profiles (salon_id) on delete CASCADE,
  constraint appointment_notification_settings_days_before_check check (days_before_appointment >= 0),
  constraint appointment_notification_settings_hour_check check (notification_hour >= '00:00:00' and notification_hour <= '23:59:59')
) TABLESPACE pg_default;

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_appointment_notification_settings_salon_id 
ON public.appointment_notification_settings USING btree (salon_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_appointment_notification_settings_enabled 
ON public.appointment_notification_settings USING btree (enabled) TABLESPACE pg_default;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_appointment_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointment_notification_settings_updated_at 
BEFORE UPDATE ON appointment_notification_settings 
FOR EACH ROW
EXECUTE FUNCTION update_appointment_notification_settings_updated_at();

-- Inserisci configurazioni di default per ogni salone esistente
INSERT INTO appointment_notification_settings (salon_id, enabled, days_before_appointment, notification_hour) 
SELECT 
  p.salon_id,
  true,
  1,
  '09:00:00'
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id) DO NOTHING;

-- Verifica che la tabella sia stata creata correttamente
SELECT 'Tabella appointment_notification_settings creata con successo!' as status;
SELECT COUNT(*) as total_settings FROM appointment_notification_settings; 