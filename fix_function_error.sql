-- Script per risolvere l'errore della funzione get_tickets_with_latest_response
-- Errore: "cannot change return type of existing function"

-- 1. Elimina la funzione esistente
DROP FUNCTION IF EXISTS get_tickets_with_latest_response(UUID);

-- 2. Ricrea la funzione con il nuovo tipo di ritorno
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

-- 3. Verifica che la funzione sia stata creata correttamente
SELECT 'Function created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'get_tickets_with_latest_response'
  AND routine_type = 'FUNCTION'
);

-- 4. Test della funzione (opzionale)
-- SELECT * FROM get_tickets_with_latest_response(NULL) LIMIT 1;
