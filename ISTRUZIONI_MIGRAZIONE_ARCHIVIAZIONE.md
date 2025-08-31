# Istruzioni per la Migrazione - Archiviazione Prenotazioni Online

## ⚠️ IMPORTANTE: Eseguire questa migrazione prima di utilizzare la funzionalità

### Passo 1: Accedi a Supabase Dashboard

1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Accedi al tuo account
3. Seleziona il progetto del tuo salone

### Passo 2: Apri SQL Editor

1. Nel menu laterale, clicca su "SQL Editor"
2. Clicca su "New query"

### Passo 3: Esegui la Migrazione

Copia e incolla il seguente codice SQL nell'editor:

```sql
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
```

### Passo 4: Esegui la Query

1. Clicca sul pulsante "Run" (▶️) nell'editor SQL
2. Aspetta che la query sia completata
3. Dovresti vedere un messaggio di successo

### Passo 5: Verifica la Migrazione

Per verificare che la migrazione sia andata a buon fine, esegui questa query:

```sql
-- Verifica che il campo archived sia stato aggiunto
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'online_bookings' 
AND column_name = 'archived';
```

Dovresti vedere una riga con:
- `column_name`: archived
- `data_type`: boolean
- `is_nullable`: YES
- `column_default`: false

### Passo 6: Testa la Funzionalità

Dopo aver completato la migrazione:

1. Vai alla pagina "Prenotazioni Online" nel tuo gestionale
2. Dovresti vedere il nuovo pulsante "Attive/Archiviate" nei filtri
3. Ogni prenotazione dovrebbe avere un pulsante di archiviazione

## Risoluzione Problemi

### Errore: "column archived already exists"
- Questo significa che la migrazione è già stata eseguita
- Puoi procedere direttamente al test della funzionalità

### Errore: "table online_bookings does not exist"
- Verifica che la tabella `online_bookings` esista nel tuo database
- Se non esiste, contatta il supporto tecnico

### Errore di permessi
- Assicurati di avere i permessi di amministratore sul database
- Se necessario, contatta l'amministratore del progetto Supabase

## Note Importanti

- **Backup**: Prima di eseguire la migrazione, è consigliabile fare un backup del database
- **Downtime**: La migrazione è veloce e non causa interruzioni del servizio
- **Compatibilità**: Le funzionalità esistenti continuano a funzionare normalmente
- **Dati Esistenti**: Tutte le prenotazioni esistenti avranno `archived = FALSE` di default

## Supporto

Se incontri problemi durante la migrazione:

1. Controlla i log di errore in Supabase Dashboard
2. Verifica che il progetto sia configurato correttamente
3. Contatta il supporto tecnico con i dettagli dell'errore 