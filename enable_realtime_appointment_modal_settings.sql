-- Abilita il realtime per la tabella appointment_modal_settings
-- Questo permette ai componenti React di ricevere aggiornamenti in tempo reale

-- Abilita il realtime per la tabella
ALTER PUBLICATION supabase_realtime ADD TABLE appointment_modal_settings;

-- Verifica che il realtime sia abilitato
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'appointment_modal_settings';

-- Mostra tutte le tabelle con realtime abilitato
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
