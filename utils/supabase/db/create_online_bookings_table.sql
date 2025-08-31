-- Crea la tabella online_bookings
CREATE TABLE IF NOT EXISTS public.online_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  service_id uuid,
  service_name text NOT NULL,
  service_duration integer NOT NULL DEFAULT 30,
  service_price numeric(10,2) NOT NULL DEFAULT 0,
  appointment_date date NOT NULL,
  appointment_time time without time zone NOT NULL,
  team_member_id uuid,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  admin_notes text,
  CONSTRAINT online_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT online_bookings_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES salon(id) ON DELETE CASCADE,
  CONSTRAINT online_bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  CONSTRAINT online_bookings_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES team(id) ON DELETE SET NULL,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_online_bookings_salon_id ON public.online_bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_online_bookings_status ON public.online_bookings(status);
CREATE INDEX IF NOT EXISTS idx_online_bookings_date ON public.online_bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_online_bookings_salon_date ON public.online_bookings(salon_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_online_bookings_team_member ON public.online_bookings(team_member_id);

-- Crea trigger per updated_at
CREATE OR REPLACE FUNCTION update_online_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_online_bookings_updated_at
  BEFORE UPDATE ON public.online_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_online_bookings_updated_at(); 