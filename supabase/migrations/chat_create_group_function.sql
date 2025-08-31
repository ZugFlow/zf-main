-- Funzione per creare un gruppo e aggiungere automaticamente il creatore come admin
CREATE OR REPLACE FUNCTION create_chat_group_with_creator(
  group_name VARCHAR(255),
  group_description TEXT DEFAULT NULL,
  group_avatar_url TEXT DEFAULT NULL,
  group_is_private BOOLEAN DEFAULT false,
  group_max_members INTEGER DEFAULT 100
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_group_id UUID;
  current_user_id UUID;
BEGIN
  -- Ottieni l'ID dell'utente corrente
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Inserisci il nuovo gruppo
  INSERT INTO chat_groups (
    name,
    description,
    avatar_url,
    is_private,
    max_members,
    created_by
  ) VALUES (
    group_name,
    group_description,
    group_avatar_url,
    group_is_private,
    group_max_members,
    current_user_id
  ) RETURNING id INTO new_group_id;

  -- Aggiungi il creatore come admin del gruppo
  INSERT INTO chat_group_members (
    group_id,
    user_id,
    role
  ) VALUES (
    new_group_id,
    current_user_id,
    'admin'
  );

  RETURN new_group_id;
END;
$$; 