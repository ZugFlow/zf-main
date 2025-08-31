-- Migrazione degli utenti manager esistenti alla tabella team
-- Questo script crea record nella tabella team per tutti i manager che non ne hanno ancora uno

-- Inserisci i manager esistenti nella tabella team
INSERT INTO public.team (
  user_id,
  email,
  name,
  salon_id,
  role,
  is_active,
  visible_users,
  order_column,
  "ColorMember",
  avatar_url,
  sidebar,
  created_at
)
SELECT 
  p.id as user_id,
  p.email,
  COALESCE(p.name, SPLIT_PART(p.email, '@', 1)) as name,
  p.salon_id,
  'manager' as role,
  COALESCE(p.is_active, true) as is_active,
  true as visible_users,
  0 as order_column,
  '#3b82f6' as "ColorMember", -- Colore blu per i manager
  COALESCE(p.avatar, '') as avatar_url,
  false as sidebar,
  COALESCE(p.created_at, NOW()) as created_at
FROM public.profiles p
WHERE p.role = 'manager' 
  AND p.id NOT IN (
    SELECT user_id 
    FROM public.team 
    WHERE user_id IS NOT NULL
  );

-- Log del numero di record inseriti
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Migrati % manager esistenti alla tabella team', inserted_count;
END $$;

-- Verifica che tutti i manager abbiano ora un record nella tabella team
SELECT 
  COUNT(*) as total_managers,
  COUNT(t.id) as managers_in_team,
  COUNT(*) - COUNT(t.id) as missing_team_records
FROM public.profiles p
LEFT JOIN public.team t ON p.id = t.user_id
WHERE p.role = 'manager';
