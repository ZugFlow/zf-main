-- Verifica la struttura della tabella hoursettings
-- Questo script controlla se la tabella esiste e quali colonne ha

-- Controlla se la tabella hoursettings esiste
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'hoursettings'
        ) THEN 'Tabella hoursettings ESISTE'
        ELSE 'Tabella hoursettings NON ESISTE'
    END as table_status;

-- Se la tabella esiste, mostra tutte le colonne
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'hoursettings'
ORDER BY ordinal_position;

-- Controlla specificamente se la colonna 'formato' esiste
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'hoursettings'
            AND column_name = 'formato'
        ) THEN 'Colonna formato ESISTE'
        ELSE 'Colonna formato NON ESISTE'
    END as formato_column_status; 