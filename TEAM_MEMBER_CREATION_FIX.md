# Fix per il Problema di Creazione Membri del Team

## Problema Identificato

Il problema è che la tabella `team` nel database manca di alcuni campi che l'applicazione si aspetta di trovare:

- `ColorMember` - per i colori dei membri
- `phone_number` - per i numeri di telefono
- `visible_users` - per le impostazioni di visibilità
- `order_column` - per l'ordinamento dei membri
- `email` - per le email dei membri

## Soluzione

### 1. Esegui la Migrazione del Database

Esegui il file SQL di migrazione per aggiungere i campi mancanti:

```sql
-- Esegui questo script nel tuo database Supabase
-- File: utils/supabase/db/add_missing_team_fields.sql
```

### 2. Aggiorna i Tipi TypeScript

I tipi del database sono stati aggiornati nel file `types/database.types.ts` per includere i nuovi campi.

### 3. API Aggiornata

L'API di creazione membri (`app/api/member/create-members/route.ts`) è stata aggiornata per:

- Calcolare correttamente l'`order_column`
- Includere tutti i campi necessari
- Gestire meglio i valori di default

## Come Applicare la Fix

### Opzione 1: Esegui la Migrazione Manualmente

1. Vai nel dashboard di Supabase
2. Apri l'SQL Editor
3. Copia e incolla il contenuto del file `utils/supabase/db/add_missing_team_fields.sql`
4. Esegui la query

### Opzione 2: Usa lo Script Node.js

1. Assicurati di avere le variabili d'ambiente configurate:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Esegui lo script:
   ```bash
   node run_team_migration.js
   ```

## Verifica della Fix

Dopo aver applicato la migrazione, verifica che:

1. La creazione di nuovi membri del team funzioni correttamente
2. I membri appaiano nel calendario con i colori corretti
3. I membri siano visibili nelle impostazioni del team

## Campi Aggiunti

- `ColorMember`: Colore del membro (default: '#3B82F6')
- `phone_number`: Numero di telefono del membro
- `visible_users`: Se il membro è visibile (default: true)
- `order_column`: Ordine di visualizzazione (default: 0)
- `email`: Email del membro

## Indici Creati

Per migliorare le performance, sono stati creati indici su:
- `order_column`
- `visible_users`
- `salon_id`

## Note Importanti

- La migrazione è sicura e non cancella dati esistenti
- I valori di default vengono applicati ai record esistenti
- La migrazione può essere eseguita più volte senza problemi (usa `IF NOT EXISTS`) 