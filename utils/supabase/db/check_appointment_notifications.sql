-- Script per verificare lo stato della tabella appointment_notifications
-- Esegui questo script nel database Supabase per diagnosticare il problema

-- Verifica se la tabella esiste
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'appointment_notifications'
    ) 
    THEN 'La tabella appointment_notifications ESISTE'
    ELSE 'La tabella appointment_notifications NON ESISTE'
  END as table_status;

-- Se la tabella esiste, mostra la sua struttura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'appointment_notifications'
ORDER BY ordinal_position;

-- Verifica se ci sono dati nella tabella
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'appointment_notifications'
    ) 
    THEN (SELECT COUNT(*) FROM appointment_notifications)
    ELSE 0
  END as row_count;

-- Mostra le tabelle che contengono "notification" nel nome
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%notification%';

-- Verifica se la tabella profiles esiste e ha dati
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
    ) 
    THEN (SELECT COUNT(*) FROM profiles WHERE salon_id IS NOT NULL)
    ELSE 0
  END as profiles_with_salon_id_count; 