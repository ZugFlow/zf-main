# Integrazione Permessi con Ore Lavorative

## Panoramica

Questo sistema integra automaticamente i permessi approvati con le ore lavorative, garantendo che quando un membro del team ottiene un permesso approvato, questo venga automaticamente riflesso nella sezione ore lavorative.

## Funzionalità Principali

### 1. Sincronizzazione Automatica
- Quando un permesso viene approvato, il sistema crea automaticamente record nelle ore lavorative per i giorni del permesso
- I giorni di permesso vengono marcati come "absent" nelle ore lavorative
- La sincronizzazione avviene in tempo reale tramite trigger del database

### 2. Visualizzazione Integrata
- I permessi approvati vengono visualizzati nella tabella degli orari settimanali
- Ogni giorno con permesso mostra un indicatore visivo del tipo di permesso
- I permessi sono visibili sia quando c'è un orario programmato che quando non c'è

### 3. Sezione Dedicata
- Una sezione dedicata mostra tutti i permessi approvati che influenzano gli orari
- Include dettagli come tipo di permesso, periodo, motivo e dipendente

## Struttura del Database

### Tabelle Principali

#### `permessiferie`
- `id`: UUID primario
- `member_id`: Riferimento al membro del team
- `salon_id`: ID del salone
- `type`: Tipo di permesso ('ferie', 'permesso', 'malattia', 'altro')
- `start_date`: Data di inizio
- `end_date`: Data di fine
- `start_time`: Orario di inizio (opzionale)
- `end_time`: Orario di fine (opzionale)
- `status`: Stato ('pending', 'approved', 'rejected')
- `reason`: Motivo del permesso
- `notes`: Note aggiuntive

#### `work_hours`
- `id`: UUID primario
- `member_id`: Riferimento al membro del team
- `salon_id`: ID del salone
- `date`: Data
- `start_time`: Orario di inizio
- `end_time`: Orario di fine
- `total_hours`: Ore totali lavorate
- `status`: Stato ('completed', 'pending', 'absent')
- `notes`: Note (include informazioni sul permesso)

### Funzioni SQL

#### `sync_permissions_with_work_hours()`
Trigger che si attiva quando un permesso viene aggiornato:
- Controlla se il permesso è stato approvato
- Per ogni giorno del periodo di permesso:
  - Crea o aggiorna record work_hours con status 'absent'
  - Aggiunge note con informazioni sul permesso

#### `sync_all_existing_permissions()`
Funzione per sincronizzare tutti i permessi esistenti (da eseguire una volta):
- Scansiona tutti i permessi approvati
- Crea record work_hours mancanti

#### `get_permissions_work_hours_stats()`
Funzione per statistiche integrate:
- Conteggio permessi per stato
- Ore lavorate totali
- Giorni di assenza
- Statistiche per tipo di permesso

#### `get_integrated_calendar()`
Funzione per calendario integrato:
- Combina dati di permessi e ore lavorative
- Restituisce vista unificata per periodo

## Componenti React

### OreLavorative.tsx
Componente principale per la gestione delle ore lavorative:

#### Props Aggiunte
```typescript
interface OreLavorativeProps {
  // ... props esistenti
  permissions?: Permission[]; // Array di permessi
}
```

#### Funzionalità Aggiunte
1. **Filtro Permessi**: Filtra solo i permessi approvati
2. **Helper Function**: `getPermissionsForDate()` per ottenere permessi per una data
3. **Visualizzazione Integrata**: Mostra permessi nella tabella orari
4. **Sezione Dedicata**: Card separata per permessi approvati

### PermessiFerie.tsx
Componente per la gestione dei permessi:
- Passa i permessi al componente OreLavorative
- Gestisce l'aggiornamento dello stato dei permessi

## Visualizzazione

### Nella Tabella Orari
- **Giorni con orario normale + permesso**: Mostra orario normale con indicatore permesso sotto
- **Giorni solo con permesso**: Mostra solo il permesso con bordo tratteggiato
- **Giorni senza orario né permesso**: Mostra "Non lavora"

### Indicatori Visivi
- 🏖️ Ferie (blu)
- 📋 Permesso (viola)
- 🏥 Malattia (arancione)
- 📝 Altro (grigio)

### Sezione Permessi Approvati
- Lista di tutti i permessi approvati
- Include periodo, tipo, motivo e dipendente
- Badge colorati per tipo di permesso

## Flusso di Lavoro

1. **Richiesta Permesso**: Un membro richiede un permesso
2. **Approvazione**: Il manager approva il permesso
3. **Sincronizzazione Automatica**: Il trigger crea record work_hours
4. **Visualizzazione**: I permessi appaiono nella sezione ore lavorative
5. **Gestione**: I manager possono vedere l'impatto sui turni

## Vantaggi

1. **Consistenza dei Dati**: I permessi e le ore lavorative sono sempre sincronizzati
2. **Visibilità Completa**: I manager vedono l'impatto dei permessi sui turni
3. **Automazione**: Nessun intervento manuale richiesto
4. **Tracciabilità**: Tutti i permessi sono tracciati nelle ore lavorative

## Configurazione

### Esecuzione Funzioni SQL
```sql
-- Sincronizza permessi esistenti (da eseguire una volta)
SELECT sync_all_existing_permissions();

-- Verifica statistiche
SELECT get_permissions_work_hours_stats('salon-uuid');

-- Ottieni calendario integrato
SELECT * FROM get_integrated_calendar('salon-uuid', '2024-01-01', '2024-01-31');
```

### Trigger Automatico
Il trigger `trigger_sync_permissions_with_work_hours` si attiva automaticamente quando:
- Un permesso viene aggiornato da 'pending' a 'approved'
- Un permesso viene aggiornato da 'pending' a 'rejected'

## Note Tecniche

- I permessi rifiutati non creano record nelle ore lavorative
- I permessi archiviati mantengono i record nelle ore lavorative
- La sincronizzazione avviene solo per permessi approvati
- I record work_hours per permessi hanno status 'absent' e 0 ore lavorate 