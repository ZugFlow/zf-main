-- Test per verificare che la funzione disable_salon_web_page esista e funzioni
-- Esegui questo script per testare la funzione

-- 1. Verifica che la funzione esista
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'disable_salon_web_page'
AND routine_schema = 'public';

-- 2. Verifica i parametri della funzione
SELECT 
    parameter_name,
    parameter_mode,
    data_type,
    ordinal_position
FROM information_schema.parameters 
WHERE specific_name = (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'disable_salon_web_page'
    AND routine_schema = 'public'
)
ORDER BY ordinal_position;

-- 3. Test della funzione (sostituisci con UUID validi)
-- SELECT disable_salon_web_page(
--     '00000000-0000-0000-0000-000000000001'::UUID,  -- user_id
--     '00000000-0000-0000-0000-000000000002'::UUID   -- salon_id
-- );

-- 4. Verifica che la tabella salon_web_settings esista
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'salon_web_settings'
AND table_schema = 'public'
ORDER BY ordinal_position; 