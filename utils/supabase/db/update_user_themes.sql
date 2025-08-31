-- Aggiorna il tema di default per gli utenti esistenti che non hanno ancora un tema impostato
UPDATE public.team 
SET theme = 'light' 
WHERE theme IS NULL 
AND user_id IS NOT NULL;

-- Aggiungi un commento alla colonna theme per documentazione
COMMENT ON COLUMN public.team.theme IS 'Tema preferito dell''utente: light, dark, system';

-- Crea un indice per ottimizzare le query per tema
CREATE INDEX IF NOT EXISTS idx_team_theme ON public.team USING btree (theme);

-- Funzione per ottenere il tema di un utente
CREATE OR REPLACE FUNCTION get_user_theme(user_uuid uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT theme 
    FROM public.team 
    WHERE user_id = user_uuid 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per aggiornare il tema di un utente
CREATE OR REPLACE FUNCTION update_user_theme(user_uuid uuid, new_theme text)
RETURNS boolean AS $$
BEGIN
  UPDATE public.team 
  SET theme = new_theme 
  WHERE user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 