-- =====================================================
-- CONTROLLO STRUTTURA TABELLA online_booking_settings
-- =====================================================

-- Mostra la struttura della tabella
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'online_booking_settings'
ORDER BY ordinal_position;

-- Mostra alcuni record di esempio
SELECT * FROM online_booking_settings LIMIT 3; 