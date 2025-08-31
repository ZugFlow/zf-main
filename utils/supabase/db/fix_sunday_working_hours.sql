-- Script per verificare e inserire i dati mancanti per la domenica
-- Questo script controlla se ci sono record per la domenica (day_of_week = 0) 
-- e li inserisce se mancanti

-- 1. Verifica quali membri del team non hanno orari per la domenica
WITH missing_sunday_hours AS (
  SELECT 
    t.id as team_member_id,
    t.salon_id,
    t.name as member_name
  FROM team t
  WHERE t.is_active = true 
    AND t.visible_users = true
    AND NOT EXISTS (
      SELECT 1 
      FROM working_hours wh 
      WHERE wh.team_member_id = t.id 
        AND wh.day_of_week = 0
    )
)
-- 2. Inserisci orari di default per la domenica (se non esistono)
INSERT INTO working_hours (
  salon_id,
  team_member_id,
  day_of_week,
  start_time,
  end_time,
  is_active
)
SELECT 
  msh.salon_id,
  msh.team_member_id,
  0 as day_of_week, -- Domenica
  '09:00' as start_time, -- Orario di inizio predefinito
  '18:00' as end_time,   -- Orario di fine predefinito
  true as is_active
FROM missing_sunday_hours msh
ON CONFLICT (salon_id, team_member_id, day_of_week) 
DO NOTHING;

-- 3. Verifica i risultati
SELECT 
  'Verifica finale' as check_type,
  COUNT(*) as total_sunday_records,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_sunday_records
FROM working_hours 
WHERE day_of_week = 0;

-- 4. Mostra tutti i record per la domenica
SELECT 
  wh.salon_id,
  wh.team_member_id,
  t.name as member_name,
  wh.day_of_week,
  wh.start_time,
  wh.end_time,
  wh.is_active,
  wh.created_at
FROM working_hours wh
JOIN team t ON wh.team_member_id = t.id
WHERE wh.day_of_week = 0
ORDER BY t.name; 