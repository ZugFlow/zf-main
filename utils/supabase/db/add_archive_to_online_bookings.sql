-- Aggiunge il campo archived alla tabella online_bookings
-- Questo permette di archiviare le prenotazioni invece di eliminarle

-- Aggiungi il campo archived se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'online_bookings' 
        AND column_name = 'archived'
    ) THEN
        ALTER TABLE online_bookings 
        ADD COLUMN archived BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Aggiungi un indice per migliorare le performance delle query sui record non archiviati
CREATE INDEX IF NOT EXISTS idx_online_bookings_archived 
ON online_bookings(archived) 
WHERE archived = FALSE;

-- Aggiungi un indice per le query sui record archiviati
CREATE INDEX IF NOT EXISTS idx_online_bookings_archived_true 
ON online_bookings(archived) 
WHERE archived = TRUE;

-- Commento per documentare il nuovo campo
COMMENT ON COLUMN online_bookings.archived IS 'Indica se la prenotazione è stata archiviata (TRUE) o è attiva (FALSE)'; 