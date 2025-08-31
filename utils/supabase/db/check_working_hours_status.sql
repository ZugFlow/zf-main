-- Script per verificare lo stato della tabella working_hours
-- Questo script aiuta a diagnosticare problemi con gli orari di lavoro

-- 1. Verifica generale della tabella
SELECT 
  'Stato generale' as check_type,
  COUNT(*) as total_records,
  COUNT(DISTINCT salon_id) as total_salons,
  COUNT(DISTINCT team_member_id) as total_team_members
FROM working_hours;

-- 2. Verifica per giorno della settimana
SELECT 
  day_of_week,
  CASE day_of_week 
    WHEN 0 THEN 'Domenica'
    WHEN 1 THEN 'Lunedì'
    WHEN 2 THEN 'Martedì'
    WHEN 3 THEN 'Mercoledì'
    WHEN 4 THEN 'Giovedì'
    WHEN 5 THEN 'Venerdì'
    WHEN 6 THEN 'Sabato'
  END as day_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_records
FROM working_hours
GROUP BY day_of_week
ORDER BY day_of_week;

-- 3. Verifica membri del team senza orari per la domenica
SELECT 
  'Membri senza orari domenica' as check_type,
  t.id as team_member_id,
  t.name as member_name,
  t.salon_id,
  t.is_active as team_active,
  t.visible_users
FROM team t
WHERE t.is_active = true 
  AND t.visible_users = true
  AND NOT EXISTS (
    SELECT 1 
    FROM working_hours wh 
    WHERE wh.team_member_id = t.id 
      AND wh.day_of_week = 0
  );

-- 4. Verifica orari per la domenica (se esistono)
SELECT 
  'Orari domenica esistenti' as check_type,
  wh.salon_id,
  wh.team_member_id,
  t.name as member_name,
  wh.start_time,
  wh.end_time,
  wh.is_active,
  wh.created_at
FROM working_hours wh
JOIN team t ON wh.team_member_id = t.id
WHERE wh.day_of_week = 0
ORDER BY t.name;

-- 5. Verifica configurazione prenotazioni online
SELECT 
  'Configurazione prenotazioni online' as check_type,
  obs.salon_id,
  obs.enabled as online_booking_enabled,
  obs.booking_start_time,
  obs.booking_end_time,
  obs.slot_duration
FROM online_booking_settings obs
WHERE obs.enabled = true; 