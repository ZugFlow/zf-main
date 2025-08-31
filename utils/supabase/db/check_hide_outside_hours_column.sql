-- Verifica se la colonna hide_outside_hours esiste nella tabella team

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'team' 
AND column_name = 'hide_outside_hours';

-- Mostra anche la struttura completa della tabella team
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'team'
ORDER BY ordinal_position; 