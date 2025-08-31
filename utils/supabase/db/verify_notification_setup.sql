-- Verification script to check notification setup
-- Run this after creating a new appointment to verify no duplicates

-- 1. Check if the automatic trigger is disabled
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_appointment_notifications';

-- Should return no rows (trigger disabled)

-- 2. Check recent notifications for duplicates
SELECT 
    appointment_id,
    method,
    time_minutes,
    COUNT(*) as count
FROM appointment_notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY appointment_id, method, time_minutes 
HAVING COUNT(*) > 1
ORDER BY appointment_id, method, time_minutes;

-- Should return no rows (no duplicates)

-- 3. Show recent notifications
SELECT 
    id,
    appointment_id,
    method,
    time_minutes,
    sent,
    created_at
FROM appointment_notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. Count notifications per appointment
SELECT 
    appointment_id,
    COUNT(*) as notification_count
FROM appointment_notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY appointment_id
ORDER BY appointment_id;

-- Expected: Only notifications configured by the user (0 or more per appointment) 