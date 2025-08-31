# Funzionalità: Nascondi Orari Fuori Orario

## Descrizione
Questa funzionalità permette di nascondere gli orari fuori dall'orario di lavoro nel calendario, concentrando la visualizzazione solo sugli orari effettivamente operativi.

## Implementazione

### Database
- **Tabella**: `team`
- **Colonna**: `hide_outside_hours` (BOOLEAN, DEFAULT false)
- **File SQL**: `utils/supabase/db/add_hide_outside_hours_column.sql`

### Componenti Modificati

#### 1. Impostazioni Appuntamenti (`Appuntamenti.tsx`)
- **Percorso**: `app/(dashboard)/(private)/crm/dashboard/Impostazioni/_component/Appuntamenti.tsx`
- **Funzionalità aggiunte**:
  - State per `hideOutsideHours`
  - Funzione `updateHideOutsideHours()` per salvare l'impostazione
  - Interfaccia utente con Switch per attivare/disattivare
  - Descrizione delle opzioni disponibili

#### 2. Vista Giornaliera (`day.tsx`)
- **Percorso**: `app/(dashboard)/(private)/crm/dashboard/Appuntamenti/day_weekly_view/day.tsx`
- **Funzionalità aggiunte**:
  - State per `hideOutsideHoursSetting`
  - Recupero dell'impostazione dal database
  - Filtro delle ore visibili (`visibleHours`)
  - Aggiornamento del calcolo della posizione dell'indicatore dell'ora corrente
  - Nascondimento delle righe delle ore fuori orario

#### 3. Vista Settimanale (`weekly.tsx`)
- **Percorso**: `app/(dashboard)/(private)/crm/dashboard/Appuntamenti/day_weekly_view/weekly.tsx`
- **Funzionalità aggiunte**:
  - State per `hideOutsideHoursSetting`
  - Recupero dell'impostazione dal database
  - Filtro delle ore visibili (`visibleHours`)
  - Aggiornamento del calcolo della posizione dell'indicatore dell'ora corrente
  - Nascondimento delle righe delle ore fuori orario

## Comportamento

### Quando Attivato (`hide_outside_hours = true`)
- Nasconde tutte le ore prima dell'orario di inizio configurato
- Nasconde tutte le ore dopo l'orario di fine configurato
- Mostra solo le ore nell'intervallo di lavoro
- L'indicatore dell'ora corrente si posiziona correttamente anche con ore nascoste

### Quando Disattivato (`hide_outside_hours = false`)
- Mostra tutte le 24 ore del giorno (00:00 - 23:59)
- Comportamento standard del calendario

## Configurazione

### Orari di Lavoro
Gli orari di lavoro sono configurati nella tabella `hoursettings`:
- `start_hour`: Orario di inizio (es. "08:00")
- `finish_hour`: Orario di fine (es. "20:00")

### Impostazione Nascondi Orari
L'impostazione è salvata nella tabella `team`:
- `hide_outside_hours`: BOOLEAN che controlla se nascondere gli orari fuori orario

## Vantaggi

1. **Focus sul lavoro**: Concentra l'attenzione sugli orari effettivamente operativi
2. **Interfaccia più pulita**: Riduce il rumore visivo eliminando orari non rilevanti
3. **Performance**: Riduce il numero di righe da renderizzare nel calendario
4. **Usabilità**: Migliora l'esperienza utente per chi lavora con orari specifici

## Note Tecniche

- L'impostazione è condivisa a livello di salon (tutti i membri del team vedono la stessa configurazione)
- Il calcolo della posizione dell'indicatore dell'ora corrente è stato aggiornato per funzionare correttamente con ore nascoste
- La funzionalità è implementata sia nella vista giornaliera che settimanale
- Non influisce sugli appuntamenti esistenti, solo sulla visualizzazione del calendario 