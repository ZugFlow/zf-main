-- Cleanup script to remove duplicate notifications
-- This script should be run once to clean up existing duplicate notifications

-- First, let's see what duplicates we have
SELECT 
    appointment_id,
    method,
    time_minutes,
    COUNT(*) as count
FROM appointment_notifications 
GROUP BY appointment_id, method, time_minutes 
HAVING COUNT(*) > 1
ORDER BY appointment_id, method, time_minutes;

-- Remove duplicate notifications, keeping only the first one for each combination
WITH duplicates AS (
    SELECT 
        id,
        appointment_id,
        method,
        time_minutes,
        ROW_NUMBER() OVER (
            PARTITION BY appointment_id, method, time_minutes 
            ORDER BY created_at
        ) as rn
    FROM appointment_notifications
)
DELETE FROM appointment_notifications 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- Verify cleanup
SELECT 
    appointment_id,
    method,
    time_minutes,
    COUNT(*) as count
FROM appointment_notifications 
GROUP BY appointment_id, method, time_minutes 
HAVING COUNT(*) > 1
ORDER BY appointment_id, method, time_minutes;

-- Show final count per appointment
SELECT 
    appointment_id,
    COUNT(*) as total_notifications
FROM appointment_notifications 
GROUP BY appointment_id
ORDER BY appointment_id; 