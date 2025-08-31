-- Debug script per verificare i membri del team
-- Esegui questi query per diagnosticare il problema

-- 1. Verifica se ci sono utenti autenticati
SELECT 
    'Current authenticated users' as check_type,
    COUNT(*) as count
FROM auth.users;

-- 2. Verifica se ci sono profili
SELECT 
    'Profiles' as check_type,
    COUNT(*) as count,
    COUNT(CASE WHEN salon_id IS NOT NULL THEN 1 END) as with_salon_id
FROM profiles;

-- 3. Verifica se ci sono membri del team
SELECT 
    'Team members' as check_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN salon_id IS NOT NULL THEN 1 END) as with_salon_id
FROM team;

-- 4. Verifica i salon_id presenti
SELECT 
    'Salons' as check_type,
    COUNT(*) as count,
    COUNT(DISTINCT salon_id) as unique_salons
FROM team 
WHERE salon_id IS NOT NULL;

-- 5. Verifica membri per salon_id
SELECT 
    salon_id,
    COUNT(*) as member_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_members
FROM team 
WHERE salon_id IS NOT NULL
GROUP BY salon_id
ORDER BY member_count DESC;

-- 6. Test della funzione get_team_members_for_chat
-- (Esegui questo come utente autenticato)
-- SELECT * FROM get_team_members_for_chat();

-- 7. Verifica se l'utente corrente è nel team
-- (Sostituisci 'YOUR_USER_ID' con l'ID dell'utente corrente)
-- SELECT * FROM team WHERE user_id = 'YOUR_USER_ID';

-- 8. Verifica se ci sono RLS policies che bloccano l'accesso
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'team';

-- 9. Verifica i permessi sulla tabella team
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'team';

-- 10. Verifica se la funzione esiste
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'get_team_members_for_chat'; 