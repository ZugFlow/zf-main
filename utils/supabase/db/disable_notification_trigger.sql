-- Script to disable the automatic notification trigger
-- This will prevent automatic creation of notifications

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_appointment_notifications ON orders;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS trigger_create_appointment_notifications();

-- Verify that the trigger is removed
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_appointment_notifications';

-- Should return no rows if the trigger was successfully removed 