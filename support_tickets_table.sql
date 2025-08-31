-- Tabella per i ticket di supporto
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug_report', 'account', 'integration')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  internal_notes TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  last_user_response TIMESTAMP WITH TIME ZONE,
  last_admin_response TIMESTAMP WITH TIME ZONE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);

-- Tabella per le risposte ai ticket
CREATE TABLE IF NOT EXISTS support_ticket_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments JSONB DEFAULT '[]',
  internal BOOLEAN DEFAULT FALSE
);

-- Indici per le risposte
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_ticket_id ON support_ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_created_at ON support_ticket_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_support_ticket_responses_is_admin ON support_ticket_responses(is_admin);

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at (solo se non esiste)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_support_tickets_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_support_tickets_updated_at
      BEFORE UPDATE ON support_tickets
      FOR EACH ROW
      EXECUTE FUNCTION update_support_tickets_updated_at();
  END IF;
END $$;

-- Funzione per aggiornare last_user_response e last_admin_response
CREATE OR REPLACE FUNCTION update_ticket_response_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin THEN
    UPDATE support_tickets 
    SET last_admin_response = NEW.created_at 
    WHERE id = NEW.ticket_id;
  ELSE
    UPDATE support_tickets 
    SET last_user_response = NEW.created_at 
    WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare i timestamp delle risposte (solo se non esiste)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_ticket_response_timestamps'
  ) THEN
    CREATE TRIGGER trigger_update_ticket_response_timestamps
      AFTER INSERT ON support_ticket_responses
      FOR EACH ROW
      EXECUTE FUNCTION update_ticket_response_timestamps();
  END IF;
END $$;

-- RLS (Row Level Security)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_responses ENABLE ROW LEVEL SECURITY;

-- Policy per support_tickets: gli utenti vedono solo i propri ticket
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Policy per support_tickets: gli utenti possono creare i propri ticket
DROP POLICY IF EXISTS "Users can create their own tickets" ON support_tickets;
CREATE POLICY "Users can create their own tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy per support_tickets: gli utenti possono aggiornare i propri ticket
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
CREATE POLICY "Users can update their own tickets" ON support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per support_tickets: gli admin vedono tutti i ticket
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy per support_tickets: gli admin possono aggiornare tutti i ticket
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;
CREATE POLICY "Admins can update all tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy per support_tickets: gli admin possono eliminare tutti i ticket
DROP POLICY IF EXISTS "Admins can delete all tickets" ON support_tickets;
CREATE POLICY "Admins can delete all tickets" ON support_tickets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy per support_ticket_responses: gli utenti vedono le risposte ai propri ticket
DROP POLICY IF EXISTS "Users can view responses to their tickets" ON support_ticket_responses;
CREATE POLICY "Users can view responses to their tickets" ON support_ticket_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_responses.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Policy per support_ticket_responses: gli utenti possono creare risposte ai propri ticket
DROP POLICY IF EXISTS "Users can create responses to their tickets" ON support_ticket_responses;
CREATE POLICY "Users can create responses to their tickets" ON support_ticket_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_responses.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Policy per support_ticket_responses: gli admin vedono tutte le risposte
DROP POLICY IF EXISTS "Admins can view all responses" ON support_ticket_responses;
CREATE POLICY "Admins can view all responses" ON support_ticket_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy per support_ticket_responses: gli admin possono creare risposte
DROP POLICY IF EXISTS "Admins can create responses" ON support_ticket_responses;
CREATE POLICY "Admins can create responses" ON support_ticket_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy per support_ticket_responses: gli admin possono eliminare tutte le risposte
DROP POLICY IF EXISTS "Admins can delete all responses" ON support_ticket_responses;
CREATE POLICY "Admins can delete all responses" ON support_ticket_responses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Funzione per ottenere le statistiche dei ticket
CREATE OR REPLACE FUNCTION get_support_ticket_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  total_tickets BIGINT,
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  resolved_tickets BIGINT,
  closed_tickets BIGINT,
  urgent_tickets BIGINT,
  high_priority_tickets BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_tickets,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_tickets,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tickets
  FROM support_tickets
  WHERE (user_uuid IS NULL OR user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere i ticket con le ultime risposte e informazioni utente
-- Prima elimina la funzione esistente se presente
DROP FUNCTION IF EXISTS get_tickets_with_latest_response(UUID);

-- Poi ricrea la funzione con il nuovo tipo di ritorno
CREATE FUNCTION get_tickets_with_latest_response(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  subject TEXT,
  description TEXT,
  priority TEXT,
  status TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_response_at TIMESTAMP WITH TIME ZONE,
  last_response_is_admin BOOLEAN,
  response_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id,
    st.user_id,
    st.user_email,
    st.user_name,
    st.subject,
    st.description,
    st.priority,
    st.status,
    st.category,
    st.created_at,
    st.updated_at,
    MAX(str.created_at) as last_response_at,
    MAX(str.created_at) = MAX(str.created_at) FILTER (WHERE str.is_admin = true) as last_response_is_admin,
    COUNT(str.id) as response_count
  FROM support_tickets st
  LEFT JOIN support_ticket_responses str ON st.id = str.ticket_id
  WHERE (user_uuid IS NULL OR st.user_id = user_uuid)
  GROUP BY st.id, st.user_id, st.user_email, st.user_name, st.subject, st.description, st.priority, st.status, st.category, st.created_at, st.updated_at
  ORDER BY st.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
