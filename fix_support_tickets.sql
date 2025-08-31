-- Script di correzione rapida per il sistema di ticket di supporto
-- Eseguire questo script per risolvere i problemi di trigger e policy

-- 1. Rimuovi i trigger esistenti se presenti
DROP TRIGGER IF EXISTS trigger_update_support_tickets_updated_at ON support_tickets;
DROP TRIGGER IF EXISTS trigger_update_ticket_response_timestamps ON support_ticket_responses;

-- 2. Ricrea i trigger
CREATE TRIGGER trigger_update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

CREATE TRIGGER trigger_update_ticket_response_timestamps
  AFTER INSERT ON support_ticket_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_response_timestamps();

-- 3. Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can delete all tickets" ON support_tickets;

DROP POLICY IF EXISTS "Users can view responses to their tickets" ON support_ticket_responses;
DROP POLICY IF EXISTS "Users can create responses to their tickets" ON support_ticket_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON support_ticket_responses;
DROP POLICY IF EXISTS "Admins can create responses" ON support_ticket_responses;
DROP POLICY IF EXISTS "Admins can delete all responses" ON support_ticket_responses;

-- 4. Ricrea le policy per support_tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all tickets" ON support_tickets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 5. Ricrea le policy per support_ticket_responses
CREATE POLICY "Users can view responses to their tickets" ON support_ticket_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_responses.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create responses to their tickets" ON support_ticket_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_responses.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all responses" ON support_ticket_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create responses" ON support_ticket_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all responses" ON support_ticket_responses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 6. Aggiorna la funzione per includere tutte le informazioni necessarie
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

-- 7. Verifica che tutto sia stato creato correttamente
SELECT 'Triggers created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'trigger_update_support_tickets_updated_at'
) AND EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'trigger_update_ticket_response_timestamps'
);

SELECT 'Policies created successfully' as status
WHERE (
  SELECT COUNT(*) FROM pg_policies 
  WHERE tablename = 'support_tickets'
) >= 6 AND (
  SELECT COUNT(*) FROM pg_policies 
  WHERE tablename = 'support_ticket_responses'
) >= 5;
