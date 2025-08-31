-- Script per verificare la configurazione completa di holiday_balances
DO $$
DECLARE
    table_exists BOOLEAN;
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
    index_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    -- Verifica esistenza tabella
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'holiday_balances'
    ) INTO table_exists;
    
    RAISE NOTICE 'Tabella holiday_balances: %', 
        CASE WHEN table_exists THEN 'ESISTE' ELSE 'NON ESISTE' END;
    
    -- Verifica esistenza funzione update_holiday_balances_updated_at
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_holiday_balances_updated_at'
    ) INTO function_exists;
    
    RAISE NOTICE 'Funzione update_holiday_balances_updated_at: %', 
        CASE WHEN function_exists THEN 'ESISTE' ELSE 'NON ESISTE' END;
    
    -- Verifica esistenza funzione validate_holiday_balance_salon_id
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'validate_holiday_balance_salon_id'
    ) INTO function_exists;
    
    RAISE NOTICE 'Funzione validate_holiday_balance_salon_id: %', 
        CASE WHEN function_exists THEN 'ESISTE' ELSE 'NON ESISTE' END;
    
    -- Verifica esistenza trigger
    SELECT EXISTS (
        SELECT FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'holiday_balances'
        AND t.tgname = 'trigger_update_holiday_balances_updated_at'
    ) INTO trigger_exists;
    
    RAISE NOTICE 'Trigger trigger_update_holiday_balances_updated_at: %', 
        CASE WHEN trigger_exists THEN 'ESISTE' ELSE 'NON ESISTE' END;
    
    -- Verifica esistenza indice
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE tablename = 'holiday_balances'
        AND indexname = 'idx_holiday_balances_member_id'
    ) INTO index_exists;
    
    RAISE NOTICE 'Indice idx_holiday_balances_member_id: %', 
        CASE WHEN index_exists THEN 'ESISTE' ELSE 'NON ESISTE' END;
    
    -- Verifica esistenza vincolo unique
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'holiday_balances'
        AND constraint_name = 'holiday_balances_member_id_year_key'
        AND constraint_type = 'UNIQUE'
    ) INTO constraint_exists;
    
    RAISE NOTICE 'Vincolo UNIQUE holiday_balances_member_id_year_key: %', 
        CASE WHEN constraint_exists THEN 'ESISTE' ELSE 'NON ESISTE' END;
    
    -- Verifica esistenza foreign key
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'holiday_balances'
        AND constraint_name = 'holiday_balances_member_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) INTO constraint_exists;
    
    RAISE NOTICE 'Foreign Key holiday_balances_member_id_fkey: %', 
        CASE WHEN constraint_exists THEN 'ESISTE' ELSE 'NON ESISTE' END;
    
    -- Mostra struttura tabella
    RAISE NOTICE 'Struttura tabella holiday_balances:';
    FOR r IN (
        SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'holiday_balances' 
        ORDER BY ordinal_position
    ) LOOP
        RAISE NOTICE '  %: % % DEFAULT %', 
            r.column_name, 
            r.data_type, 
            CASE WHEN r.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END,
            COALESCE(r.column_default, 'NULL');
    END LOOP;
    
END $$; 