-- Verification script for salon web settings fix
-- This script tests that the system is working correctly after the schema fix

-- 1. Check if the salon_web_settings table has all required columns
SELECT 
    'Schema Check' as check_type,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'web_layout_type' THEN 1 END) as has_layout_type,
    COUNT(CASE WHEN column_name = 'web_subtitle' THEN 1 END) as has_subtitle,
    COUNT(CASE WHEN column_name = 'web_title_color' THEN 1 END) as has_title_color
FROM information_schema.columns 
WHERE table_name = 'salon_web_settings' 
AND table_schema = 'public';

-- 2. Check if there are any profiles with web settings
SELECT 
    'Profiles with Web Settings' as check_type,
    COUNT(*) as total_profiles,
    COUNT(sws.id) as profiles_with_web_settings,
    COUNT(*) - COUNT(sws.id) as profiles_without_web_settings
FROM profiles p
LEFT JOIN salon_web_settings sws ON sws.salon_id = p.salon_id
WHERE p.salon_id IS NOT NULL;

-- 3. Test creating a web settings record (if you have a test profile)
-- Uncomment and modify the salon_id if you want to test creation
/*
INSERT INTO salon_web_settings (
    salon_id,
    web_enabled,
    web_title,
    web_description,
    web_primary_color,
    web_secondary_color,
    web_booking_enabled,
    web_services_visible,
    web_team_visible,
    web_gallery_visible,
    web_testimonials_visible,
    web_contact_form_enabled
) VALUES (
    'your-test-salon-id-here',
    false,
    'Test Salon',
    'Test Description',
    '#6366f1',
    '#8b5cf6',
    true,
    true,
    true,
    true,
    true,
    true
) ON CONFLICT (salon_id) DO NOTHING;
*/

-- 4. Check the foreign key constraint
SELECT 
    'Foreign Key Check' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'salon_web_settings'
    AND kcu.column_name = 'salon_id';

-- 5. Test query that was failing (should work now)
-- This simulates the query that was causing the 406 error
SELECT 
    'Test Query' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN web_enabled = true THEN 1 END) as enabled_records,
    COUNT(CASE WHEN web_subdomain IS NOT NULL AND web_subdomain != '' THEN 1 END) as records_with_subdomain
FROM salon_web_settings;

-- 6. Check for any orphaned records
SELECT 
    'Orphaned Records Check' as check_type,
    COUNT(*) as orphaned_web_settings
FROM salon_web_settings sws
LEFT JOIN profiles p ON p.salon_id = sws.salon_id
WHERE p.id IS NULL;

-- 7. Summary
SELECT 
    'Summary' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'salon_web_settings' 
            AND column_name = 'web_layout_type'
        ) THEN '✅ Schema is correct'
        ELSE '❌ Schema is missing columns'
    END as schema_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'salon_web_settings' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%salon_id%'
        ) THEN '✅ Foreign key exists'
        ELSE '❌ Foreign key missing'
    END as foreign_key_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM salon_web_settings) > 0 THEN '✅ Web settings exist'
        ELSE '⚠️ No web settings found'
    END as data_status;
