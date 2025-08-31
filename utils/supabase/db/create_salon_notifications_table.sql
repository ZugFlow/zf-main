-- Script per creare la tabella salon_notifications
-- Esegui questo script nel database Supabase

-- Elimina la tabella se esiste (per testing)
DROP TABLE IF EXISTS salon_notifications CASCADE;

-- Crea la tabella salon_notifications
CREATE TABLE public.salon_notifications (
  id uuid not null default gen_random_uuid (),
  salon_id uuid null,
  type character varying(50) not null,
  enabled boolean null default true,
  email_recipients text null,
  custom_message text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint salon_notifications_pkey primary key (id),
  constraint salon_notifications_salon_id_type_key unique (salon_id, type),
  constraint salon_notifications_salon_id_fkey foreign KEY (salon_id) references profiles (salon_id) on delete CASCADE
) TABLESPACE pg_default;

-- Crea indici per performance
create index IF not exists idx_salon_notifications_salon_id on public.salon_notifications using btree (salon_id) TABLESPACE pg_default;

create index IF not exists idx_salon_notifications_type on public.salon_notifications using btree (type) TABLESPACE pg_default;

create index IF not exists idx_salon_notifications_enabled on public.salon_notifications using btree (enabled) TABLESPACE pg_default;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_salon_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

create trigger update_salon_notifications_updated_at BEFORE
update on salon_notifications for EACH row
execute FUNCTION update_salon_notifications_updated_at ();

-- Inserisci configurazioni di default per ogni salone esistente
INSERT INTO salon_notifications (salon_id, type, enabled) 
SELECT 
  p.salon_id,
  'new_appointment',
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, type) DO NOTHING;

INSERT INTO salon_notifications (salon_id, type, enabled) 
SELECT 
  p.salon_id,
  'appointment_cancelled',
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, type) DO NOTHING;

INSERT INTO salon_notifications (salon_id, type, enabled) 
SELECT 
  p.salon_id,
  'daily_report',
  false
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, type) DO NOTHING;

INSERT INTO salon_notifications (salon_id, type, enabled) 
SELECT 
  p.salon_id,
  'weekly_report',
  false
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, type) DO NOTHING;

INSERT INTO salon_notifications (salon_id, type, enabled) 
SELECT 
  p.salon_id,
  'payment_due',
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, type) DO NOTHING;

INSERT INTO salon_notifications (salon_id, type, enabled) 
SELECT 
  p.salon_id,
  'payment_failed',
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, type) DO NOTHING;

INSERT INTO salon_notifications (salon_id, type, enabled) 
SELECT 
  p.salon_id,
  'invoice_available',
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, type) DO NOTHING;

-- Verifica che la tabella sia stata creata correttamente
SELECT 'Tabella salon_notifications creata con successo!' as status;
SELECT COUNT(*) as total_notifications FROM salon_notifications; 