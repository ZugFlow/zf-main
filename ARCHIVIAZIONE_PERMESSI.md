# Funzionalità di Archiviazione Permessi

## Panoramica

È stata aggiunta una nuova funzionalità per archiviare i permessi approvati o rifiutati, mantenendo la lista dei permessi attivi più pulita e organizzata.

## Caratteristiche

### 1. Campo `archived` nel Database
- Aggiunto il campo `archived` (boolean) alla tabella `permessiferie`
- Default: `false` (permessi non archiviati)
- Indice creato per ottimizzare le query

### 2. Interfaccia Utente

#### Switch per Visualizzazione
- Toggle per passare tra "Permessi Attivi" e "Permessi Archiviati"
- Badge indicatore quando si visualizzano gli archiviati
- Descrizione informativa per gli archiviati

#### Azioni Disponibili
- **Permessi Attivi**: Approva/Rifiuta (manager), Elimina, Archivia (per permessi approvati/rifiutati)
- **Permessi Archiviati**: Ripristina (torna ai permessi attivi)

#### Statistiche
- Componente `ArchiveStats` che mostra:
  - Totale permessi attivi e archiviati
  - Distribuzione per stato (approvati, rifiutati, in attesa)
  - Visualizzazione separata per archiviati e attivi

### 3. Logica di Business

#### Quando Archiviare
- Solo permessi con stato `approved` o `rejected`
- I permessi `pending` non possono essere archiviati
- Archiviazione automatica opzionale (da implementare)

#### Permessi di Accesso
- **Manager**: Possono archiviare/ripristinare tutti i permessi
- **Membri**: Possono archiviare/ripristinare solo i propri permessi

### 4. Migrazione Database

```sql
-- Aggiunto campo archived
ALTER TABLE public.permessiferie 
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_permessiferie_archived ON public.permessiferie(archived);
```

## Utilizzo

### Per i Manager
1. Visualizza la lista dei permessi attivi
2. Approva o rifiuta i permessi in attesa
3. Archivia i permessi approvati/rifiutati cliccando sull'icona archivio
4. Usa lo switch per visualizzare gli archiviati
5. Ripristina permessi se necessario

### Per i Membri
1. Visualizza solo i propri permessi
2. Può archiviare i propri permessi approvati/rifiutati
3. Può ripristinare i propri permessi archiviati

## Vantaggi

1. **Organizzazione**: Lista attiva più pulita e focalizzata
2. **Performance**: Query più veloci sui permessi attivi
3. **Storico**: Mantenimento di tutti i dati per audit
4. **Flessibilità**: Possibilità di ripristinare permessi se necessario

## Implementazione Tecnica

### Componenti Modificati
- `PermessiFerie.tsx`: Aggiunta logica di archiviazione
- `page.tsx`: Gestione funzioni di archiviazione/ripristino
- `types.ts`: Aggiornamento interfacce TypeScript
- `ArchiveStats.tsx`: Nuovo componente per statistiche

### Database
- Migrazione SQL per aggiungere campo `archived`
- Aggiornamento tipi TypeScript
- Indici per ottimizzazione

### API
- Funzioni `handleArchivePermission` e `handleRestorePermission`
- Validazioni di sicurezza
- Gestione errori e feedback utente

## Prossimi Sviluppi

1. **Archiviazione Automatica**: Opzione per archiviare automaticamente permessi vecchi
2. **Esportazione Archivio**: Funzionalità per esportare permessi archiviati
3. **Ricerca Avanzata**: Filtri specifici per archiviati
4. **Notifiche**: Avvisi quando permessi vengono archiviati/ripristinati 