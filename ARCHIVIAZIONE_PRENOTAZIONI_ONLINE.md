# Archiviazione Prenotazioni Online

## Panoramica

È stata implementata una funzionalità di archiviazione per le prenotazioni online che permette di:

- Archiviare le prenotazioni invece di eliminarle
- Visualizzare separatamente le prenotazioni attive e archiviate
- Ripristinare le prenotazioni archiviate quando necessario
- Mantenere la cronologia completa delle prenotazioni

## Modifiche al Database

### 1. Aggiunta del campo `archived`

È stato aggiunto un nuovo campo `archived` alla tabella `online_bookings`:

```sql
-- Aggiunge il campo archived alla tabella online_bookings
ALTER TABLE online_bookings 
ADD COLUMN archived BOOLEAN DEFAULT FALSE;
```

### 2. Indici per le performance

Sono stati creati indici specifici per ottimizzare le query:

```sql
-- Indice per le prenotazioni attive
CREATE INDEX idx_online_bookings_archived 
ON online_bookings(archived) 
WHERE archived = FALSE;

-- Indice per le prenotazioni archiviate
CREATE INDEX idx_online_bookings_archived_true 
ON online_bookings(archived) 
WHERE archived = TRUE;
```

## Esecuzione della Migrazione

### Opzione 1: Esecuzione Manuale

1. Accedi al database Supabase
2. Esegui il file SQL: `utils/supabase/db/add_archive_to_online_bookings.sql`

### Opzione 2: Tramite Supabase CLI

```bash
# Esegui la migrazione
supabase db push

# Oppure applica il file specifico
supabase db reset --linked
```

## Funzionalità Implementate

### 1. Toggle Archiviazione/Attive

- **Pulsante "Attive/Archiviate"**: Permette di passare tra la vista delle prenotazioni attive e archiviate
- **Icone diverse**: 
  - 📁 Archivio per le prenotazioni attive
  - 🔄 Ripristina per le prenotazioni archiviate

### 2. Pulsanti di Azione

Ogni prenotazione ha ora un pulsante di archiviazione/ripristino (solo per prenotazioni non in attesa):

- **Prenotazioni Attive**: Pulsante arancione con icona archivio
- **Prenotazioni Archiviate**: Pulsante verde con icona ripristino
- **Prenotazioni in Attesa**: Nessun pulsante di archiviazione (devono prima essere gestite)

### 3. Modal di Dettagli

Nel modal dei dettagli è stato aggiunto un pulsante per archiviare/ripristinare la prenotazione (solo per prenotazioni non in attesa).

### 4. Statistiche Aggiornate

Le statistiche si aggiornano automaticamente in base alla vista corrente:
- Mostra "Totali" per le prenotazioni attive
- Mostra "Archiviate" per le prenotazioni archiviate

### 5. Real-time Updates

La subscription real-time è stata aggiornata per:
- Mostrare solo le prenotazioni appropriate alla vista corrente
- Gestire correttamente i cambiamenti di stato di archiviazione
- Aggiornare il contatore delle nuove prenotazioni solo per quelle attive

## Permessi

La funzionalità di archiviazione richiede il permesso `canManageOnlineBookings`.

## Vantaggi

1. **Cronologia Completa**: Nessuna perdita di dati
2. **Organizzazione**: Separazione chiara tra prenotazioni attive e archiviate
3. **Performance**: Indici ottimizzati per le query
4. **Flessibilità**: Possibilità di ripristinare le prenotazioni archiviate
5. **Audit Trail**: Tracciabilità completa delle modifiche
6. **Workflow Corretto**: Le prenotazioni in attesa non possono essere archiviate finché non vengono gestite

## Note Tecniche

- Il campo `archived` ha valore di default `FALSE`
- Le query esistenti continuano a funzionare (mostrano solo prenotazioni attive)
- La subscription real-time filtra automaticamente in base al campo `archived`
- I permessi esistenti si applicano anche alle operazioni di archiviazione
- **Regola di Archiviazione**: Solo le prenotazioni con status diverso da 'pending' possono essere archiviate

## File Modificati

1. `utils/supabase/db/add_archive_to_online_bookings.sql` - Nuovo file di migrazione
2. `app/(dashboard)/(private)/crm/dashboard/PrenotazioniOnline/page.tsx` - Logica di archiviazione
3. `ARCHIVIAZIONE_PRENOTAZIONI_ONLINE.md` - Questa documentazione 