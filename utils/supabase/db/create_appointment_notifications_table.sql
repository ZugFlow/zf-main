-- Script migliorato per creare la tabella appointment_notifications
-- Esegui questo script nel database Supabase

-- Elimina la tabella se esiste (per testing)
DROP TABLE IF EXISTS appointment_notifications CASCADE;

-- Crea la tabella appointment_notifications
CREATE TABLE public.appointment_notifications (
  id uuid not null default gen_random_uuid (),
  salon_id uuid null,
  method character varying(20) not null,
  template_type character varying(50) not null,
  time_minutes integer not null,
  enabled boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint appointment_notifications_pkey primary key (id),
  constraint appointment_notifications_salon_id_method_template_type_tim_key unique (salon_id, method, template_type, time_minutes),
  constraint appointment_notifications_salon_id_fkey foreign KEY (salon_id) references profiles (salon_id) on delete CASCADE,
  constraint appointment_notifications_method_check check (
    (
      (method)::text = any (
        (
          array[
            'email'::character varying,
            'sms'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

-- Crea indici per performance
create index IF not exists idx_appointment_notifications_salon_id on public.appointment_notifications using btree (salon_id) TABLESPACE pg_default;

create index IF not exists idx_appointment_notifications_method on public.appointment_notifications using btree (method) TABLESPACE pg_default;

create index IF not exists idx_appointment_notifications_template_type on public.appointment_notifications using btree (template_type) TABLESPACE pg_default;

create index IF not exists idx_appointment_notifications_enabled on public.appointment_notifications using btree (enabled) TABLESPACE pg_default;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_appointment_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

create trigger update_appointment_notifications_updated_at BEFORE
update on appointment_notifications for EACH row
execute FUNCTION update_appointment_notifications_updated_at ();

-- Inserisci configurazioni di default per ogni salone esistente
INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'confirmation',
  0,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'reminder',
  1440,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'sms',
  'reminder',
  60,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'cancellation',
  0,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'modification',
  0,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

INSERT INTO appointment_notifications (salon_id, method, template_type, time_minutes, enabled) 
SELECT 
  p.salon_id,
  'email',
  'welcome',
  0,
  true
FROM profiles p
WHERE p.salon_id IS NOT NULL
ON CONFLICT (salon_id, method, template_type, time_minutes) DO NOTHING;

-- Verifica che la tabella sia stata creata correttamente
SELECT 'Tabella appointment_notifications creata con successo!' as status;
SELECT COUNT(*) as total_notifications FROM appointment_notifications; 