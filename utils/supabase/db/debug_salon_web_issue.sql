-- Debug script for salon web settings issue
-- This script helps identify why users are getting "Salone non trovato" error

-- 1. Check current user's profile and salon association
SELECT 
    'Current User Profile' as check_type,
    p.id as user_id,
    p.email,
    p.salon_id,
    p.role,
    p.is_active,
    CASE 
        WHEN p.salon_id IS NOT NULL THEN 'Has salon_id in profiles'
        ELSE 'No salon_id in profiles'
    END as profile_status
FROM profiles p 
WHERE p.id = auth.uid();

-- 2. Check if user is in team table (for collaborators)
SELECT 
    'Team Member Check' as check_type,
    t.id as team_id,
    t.user_id,
    t.salon_id,
    t.name,
    t.email,
    t.role,
    t.is_active,
    CASE 
        WHEN t.salon_id IS NOT NULL THEN 'Has salon_id in team'
        ELSE 'No salon_id in team'
    END as team_status
FROM team t 
WHERE t.user_id = auth.uid();

-- 3. Check if salon_web_settings exist for the user's salon
WITH user_salon AS (
    SELECT 
        COALESCE(
            (SELECT salon_id FROM profiles WHERE id = auth.uid()),
            (SELECT salon_id FROM team WHERE user_id = auth.uid() AND is_active = true)
        ) as user_salon_id
)
SELECT 
    'Salon Web Settings Check' as check_type,
    us.user_salon_id,
    sws.id as web_settings_id,
    sws.web_enabled,
    sws.web_subdomain,
    sws.web_title,
    CASE 
        WHEN sws.id IS NOT NULL THEN 'Web settings exist'
        ELSE 'No web settings found'
    END as web_settings_status
FROM user_salon us
LEFT JOIN salon_web_settings sws ON sws.salon_id = us.user_salon_id;

-- 4. Check all profiles with salon_id (for debugging)
SELECT 
    'All Profiles with Salon ID' as check_type,
    p.id,
    p.email,
    p.salon_id,
    p.role,
    p.is_active,
    p.created_at
FROM profiles p 
WHERE p.salon_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. Check all team members with salon_id (for debugging)
SELECT 
    'All Team Members with Salon ID' as check_type,
    t.id,
    t.user_id,
    t.salon_id,
    t.name,
    t.email,
    t.role,
    t.is_active,
    t.created_at
FROM team t 
WHERE t.salon_id IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 10;

-- 6. Check all salon_web_settings (for debugging)
SELECT 
    'All Salon Web Settings' as check_type,
    sws.id,
    sws.salon_id,
    sws.web_enabled,
    sws.web_subdomain,
    sws.web_title,
    sws.created_at
FROM salon_web_settings sws
ORDER BY sws.created_at DESC
LIMIT 10;

-- 7. Check for orphaned salon_web_settings (no matching profile)
SELECT 
    'Orphaned Web Settings' as check_type,
    sws.id,
    sws.salon_id,
    sws.web_enabled,
    sws.web_subdomain,
    CASE 
        WHEN p.id IS NULL THEN 'No matching profile'
        ELSE 'Profile exists'
    END as profile_match
FROM salon_web_settings sws
LEFT JOIN profiles p ON p.salon_id = sws.salon_id
WHERE p.id IS NULL;

-- 8. Check for profiles without web settings
SELECT 
    'Profiles without Web Settings' as check_type,
    p.id,
    p.email,
    p.salon_id,
    p.role,
    CASE 
        WHEN sws.id IS NULL THEN 'No web settings'
        ELSE 'Web settings exist'
    END as web_settings_match
FROM profiles p
LEFT JOIN salon_web_settings sws ON sws.salon_id = p.salon_id
WHERE sws.id IS NULL AND p.salon_id IS NOT NULL;
