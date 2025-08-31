# Fix per Schema Mismatch - Salon Web Settings

## Problema Identificato

L'errore che stai riscontrando è dovuto a un **mismatch tra lo schema del database e il codice**:

```
GET https://gwetcekqrylofwxutuad.supabase.co/rest/v1/salon_web_settings?select=*&salon_id=eq.68cf5033-c7cc-440f-9672-d559147e2b2c 406 (Not Acceptable)
POST https://gwetcekqrylofwxutuad.supabase.co/rest/v1/salon_web_settings?select=* 400 (Bad Request)
Error creating web settings: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'web_layout_type' column of 'salon_web_settings' in the schema cache"}
```

## Cause del Problema

1. **Colonne mancanti nel database**: Il codice cerca colonne come `web_layout_type` che non esistono nella tabella `salon_web_settings`
2. **Schema cache di Supabase**: Supabase ha una cache dello schema che potrebbe essere obsoleta
3. **Mismatch tra TypeScript types e database**: I tipi TypeScript includono colonne che non esistono realmente nel database

## Soluzioni

### Step 1: Aggiungi le Colonne Mancanti

Esegui questo script nel SQL Editor di Supabase:

```sql
-- File: utils/supabase/db/add_missing_salon_web_settings_columns.sql
-- Copia e incolla il contenuto completo del file
```

Questo script aggiunge tutte le colonne mancanti che sono referenziate nel codice.

### Step 2: Aggiorna la Cache di Supabase

Dopo aver aggiunto le colonne, aggiorna la cache di Supabase:

```sql
-- Refresh the schema cache
SELECT pg_notify('supabase_schema_update', 'salon_web_settings');
```

### Step 3: Verifica le Colonne

Controlla che tutte le colonne siano state aggiunte correttamente:

```sql
-- Verifica le colonne della tabella
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_web_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Step 4: Crea le Impostazioni Web Mancanti

Esegui questo script per creare le impostazioni web per i profili che non le hanno:

```sql
-- File: utils/supabase/db/create_missing_web_settings.sql
-- Copia e incolla il contenuto completo del file
```

### Step 5: Fix della Foreign Key

Esegui questo script per assicurarti che la foreign key sia corretta:

```sql
-- File: utils/supabase/db/fix_salon_web_settings_foreign_key.sql
-- Copia e incolla il contenuto completo del file
```

## Fix del Codice React

Il componente React è già stato aggiornato per usare solo le colonne essenziali quando crea nuove impostazioni web. Questo evita errori di schema mismatch.

## Verifica della Risoluzione

### 1. Testa la Creazione di Impostazioni Web

```sql
-- Test manuale della creazione di web settings
INSERT INTO salon_web_settings (
    salon_id,
    web_enabled,
    web_title,
    web_description,
    web_primary_color,
    web_secondary_color
) VALUES (
    'test-salon-id',
    false,
    'Test Salon',
    'Test Description',
    '#6366f1',
    '#8b5cf6'
);
```

### 2. Verifica l'Accesso via API

```sql
-- Test della query che causava l'errore 406
SELECT * FROM salon_web_settings 
WHERE salon_id = '68cf5033-c7cc-440f-9672-d559147e2b2c';
```

### 3. Controlla i Log di Supabase

Nel dashboard di Supabase, vai su:
- **Logs** > **Database** 
- Cerca errori relativi a `salon_web_settings`

## Prevenzione Futura

### 1. Sincronizzazione Schema

Implementa un sistema per mantenere sincronizzati:
- Database schema
- TypeScript types
- Codice React

### 2. Migrations Automatiche

Crea un sistema di migrations che:
- Verifica automaticamente la presenza delle colonne
- Le aggiunge se mancanti
- Aggiorna la cache di Supabase

### 3. Validazione Schema

Aggiungi validazioni nel codice per verificare la presenza delle colonne prima di usarle:

```typescript
// Esempio di validazione schema
const validateWebSettingsSchema = async () => {
  const { data, error } = await supabase
    .from('salon_web_settings')
    .select('web_layout_type')
    .limit(1);
    
  if (error && error.code === 'PGRST204') {
    console.error('Schema mismatch detected');
    // Trigger schema update
  }
};
```

## Troubleshooting Avanzato

### Se il problema persiste:

1. **Pulisci la cache di Supabase**:
   ```sql
   -- Forza il refresh della cache
   NOTIFY supabase_schema_update;
   ```

2. **Verifica i permessi RLS**:
   ```sql
   -- Controlla le policy RLS
   SELECT * FROM pg_policies WHERE tablename = 'salon_web_settings';
   ```

3. **Controlla la struttura della tabella**:
   ```sql
   -- Verifica la struttura completa
   \d salon_web_settings
   ```

4. **Testa con PostgREST direttamente**:
   ```bash
   curl "https://your-project.supabase.co/rest/v1/salon_web_settings?select=*" \
     -H "apikey: your-anon-key" \
     -H "Authorization: Bearer your-token"
   ```

## Conclusione

Questo fix risolve il problema di schema mismatch:

1. ✅ **Aggiunge tutte le colonne mancanti** al database
2. ✅ **Aggiorna la cache di Supabase** per riconoscere le nuove colonne
3. ✅ **Crea le impostazioni web mancanti** per i profili esistenti
4. ✅ **Aggiorna il codice React** per usare solo colonne essenziali
5. ✅ **Implementa validazioni** per prevenire problemi futuri

Dopo aver applicato questi fix, il sistema dovrebbe funzionare correttamente senza errori 406 o 400.
