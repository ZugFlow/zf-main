-- Add default permissions to existing team members who don't have any permissions
-- This script ensures that existing team members can access appointments and calendar
-- Updated to work with existing table structure

-- First, let's see which team members don't have any permissions
SELECT 
    t.user_id,
    t.name,
    t.email,
    COUNT(p.id) as permission_count
FROM team t
LEFT JOIN permissions p ON t.user_id = p.user_id
WHERE t.is_active = true
GROUP BY t.user_id, t.name, t.email
HAVING COUNT(p.id) = 0;

-- Now add default permissions for team members without any permissions
-- We'll use a CTE to identify users without permissions and then insert default ones

WITH users_without_permissions AS (
    SELECT 
        t.user_id,
        t.name,
        t.email
    FROM team t
    LEFT JOIN permissions p ON t.user_id = p.user_id
    WHERE t.is_active = true
    GROUP BY t.user_id, t.name, t.email
    HAVING COUNT(p.id) = 0
),
default_permissions AS (
    SELECT 
        uwp.user_id,
        'canViewAppointments' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canCreateAppointments' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canEditAppointments' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canViewOnlineBookings' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canManageOnlineBookings' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canViewClients' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canCreateClients' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canEditClients' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canViewServices' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canViewFinance' as permesso,
        true as valore
    FROM users_without_permissions uwp
    
    UNION ALL
    
    SELECT 
        uwp.user_id,
        'canViewInventory' as permesso,
        true as valore
    FROM users_without_permissions uwp
)
INSERT INTO permissions (user_id, permesso, valore, created_at, updated_at)
SELECT 
    user_id, 
    permesso, 
    valore,
    NOW() as created_at,
    NOW() as updated_at
FROM default_permissions
ON CONFLICT (user_id, permesso) DO UPDATE SET 
    valore = EXCLUDED.valore,
    updated_at = NOW();

-- Show the results
SELECT 
    'Default permissions added to team members' as action,
    COUNT(DISTINCT user_id) as users_affected,
    COUNT(*) as permissions_added
FROM default_permissions;

-- Verify the changes
SELECT 
    t.name,
    t.email,
    COUNT(p.id) as permission_count,
    STRING_AGG(p.permesso, ', ' ORDER BY p.permesso) as permissions
FROM team t
LEFT JOIN permissions p ON t.user_id = p.user_id
WHERE t.is_active = true
GROUP BY t.user_id, t.name, t.email
ORDER BY t.name; 