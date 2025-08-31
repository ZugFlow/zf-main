# Guida per Risolvere il Problema "Salone non trovato"

## Problema Identificato

Il problema "Salone non trovato" nella sezione Impostazioni > Pagina Web si verifica quando:

1. **L'utente non ha un `salon_id` associato** nel suo profilo o nel team
2. **Non esistono impostazioni web** per il salone dell'utente
3. **La foreign key constraint** tra `salon_web_settings` e `profiles` non è configurata correttamente

## Cause Principali

### 1. Problema di Associazione Utente-Salone
- L'utente potrebbe essere un collaboratore (team member) ma il sistema cerca solo nella tabella `profiles`
- Il `salon_id` potrebbe essere mancante o null nel profilo dell'utente
- L'utente potrebbe non essere attivo nel team

### 2. Problema di Impostazioni Web Mancanti
- La tabella `salon_web_settings` potrebbe non avere record per alcuni saloni
- Le impostazioni web potrebbero non essere state create automaticamente

### 3. Problema di Database Schema
- La foreign key constraint potrebbe essere mancante o errata
- Le RLS policies potrebbero bloccare l'accesso

## Soluzioni Implementate

### 1. Fix del Componente React
✅ **File modificato**: `app/(dashboard)/(private)/crm/dashboard/Impostazioni/_component/(paginweb)/PaginaWeb.tsx`

**Cambiamenti**:
- Utilizzo della funzione `getSalonId()` che gestisce sia manager che collaboratori
- Rimozione della logica che cercava solo nella tabella `profiles`
- Miglioramento della gestione degli errori

### 2. Script di Database per Fix Automatico

#### A. Fix Foreign Key Constraint
**File**: `utils/supabase/db/fix_salon_web_settings_foreign_key.sql`

```sql
-- Esegui questo script per aggiungere la foreign key constraint
-- che collega salon_web_settings.salon_id a profiles.salon_id
```

#### B. Creazione Automatica Impostazioni Web
**File**: `utils/supabase/db/create_missing_web_settings.sql`

```sql
-- Esegui questo script per creare automaticamente le impostazioni web
-- per tutti i profili che non le hanno
```

#### C. Script di Debug
**File**: `utils/supabase/db/debug_salon_web_issue.sql`

```sql
-- Esegui questo script per diagnosticare il problema specifico
-- Mostra lo stato di tutti gli utenti e le loro associazioni
```

## Passi per Risolvere il Problema

### Step 1: Esegui gli Script di Database

1. **Esegui il fix della foreign key**:
   ```sql
   -- Copia e incolla il contenuto di fix_salon_web_settings_foreign_key.sql
   ```

2. **Crea le impostazioni web mancanti**:
   ```sql
   -- Copia e incolla il contenuto di create_missing_web_settings.sql
   ```

3. **Verifica con lo script di debug**:
   ```sql
   -- Copia e incolla il contenuto di debug_salon_web_issue.sql
   ```

### Step 2: Verifica la Risoluzione

1. **Accedi al dashboard** come utente problematico
2. **Vai su Impostazioni > Pagina Web**
3. **Verifica che non appaia più l'errore "Salone non trovato"**

### Step 3: Test delle Funzionalità

1. **Verifica che le impostazioni web si carichino correttamente**
2. **Testa la creazione/modifica delle impostazioni**
3. **Verifica che la pagina web sia accessibile** (se abilitata)

## Struttura Database Corretta

### Tabella `profiles`
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    salon_id UUID UNIQUE NOT NULL, -- Identificatore univoco del salone
    role TEXT DEFAULT 'manager',
    is_active BOOLEAN DEFAULT true,
    -- ... altri campi
);
```

### Tabella `team`
```sql
CREATE TABLE team (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    salon_id UUID REFERENCES profiles(salon_id), -- Riferimento al salon_id del manager
    name TEXT,
    email TEXT,
    role TEXT,
    is_active BOOLEAN DEFAULT true,
    -- ... altri campi
);
```

### Tabella `salon_web_settings`
```sql
CREATE TABLE salon_web_settings (
    id UUID PRIMARY KEY,
    salon_id UUID UNIQUE REFERENCES profiles(salon_id) ON DELETE CASCADE,
    web_enabled BOOLEAN DEFAULT false,
    web_subdomain VARCHAR(100) UNIQUE,
    web_title VARCHAR(255),
    -- ... altri campi di configurazione
);
```

## Logica di Accesso Corretta

### Per Manager (profiles)
```typescript
// L'utente ha un record in profiles con salon_id
const profile = await supabase
    .from('profiles')
    .select('salon_id')
    .eq('id', user.id)
    .single();

if (profile?.salon_id) {
    return profile.salon_id;
}
```

### Per Collaboratori (team)
```typescript
// L'utente ha un record in team con salon_id
const teamMember = await supabase
    .from('team')
    .select('salon_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

if (teamMember?.salon_id) {
    return teamMember.salon_id;
}
```

## Troubleshooting

### Se il problema persiste:

1. **Verifica i permessi RLS**:
   ```sql
   -- Controlla che le policy RLS permettano l'accesso
   SELECT * FROM pg_policies WHERE tablename = 'salon_web_settings';
   ```

2. **Verifica la sessione utente**:
   ```sql
   -- Controlla che l'utente sia autenticato correttamente
   SELECT auth.uid() as current_user_id;
   ```

3. **Verifica i dati del profilo**:
   ```sql
   -- Controlla i dati del profilo dell'utente corrente
   SELECT * FROM profiles WHERE id = auth.uid();
   ```

4. **Verifica i dati del team**:
   ```sql
   -- Controlla i dati del team per l'utente corrente
   SELECT * FROM team WHERE user_id = auth.uid();
   ```

## Prevenzione Futura

### 1. Trigger Automatici
Implementa trigger per creare automaticamente le impostazioni web quando viene creato un nuovo profilo:

```sql
CREATE OR REPLACE FUNCTION create_web_settings_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Crea automaticamente le impostazioni web per nuovi profili
    INSERT INTO salon_web_settings (salon_id, web_enabled)
    VALUES (NEW.salon_id, false)
    ON CONFLICT (salon_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_web_settings
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_web_settings_on_profile_insert();
```

### 2. Validazione dei Dati
Implementa validazioni per assicurarsi che ogni profilo abbia un `salon_id` valido:

```sql
ALTER TABLE profiles 
ADD CONSTRAINT profiles_salon_id_not_null 
CHECK (salon_id IS NOT NULL);
```

### 3. Monitoraggio
Implementa un sistema di monitoraggio per rilevare profili senza impostazioni web:

```sql
-- Query per monitorare profili senza web settings
SELECT p.id, p.email, p.salon_id
FROM profiles p
LEFT JOIN salon_web_settings sws ON sws.salon_id = p.salon_id
WHERE p.salon_id IS NOT NULL AND sws.id IS NULL;
```

## Conclusione

Questo fix risolve il problema "Salone non trovato" implementando:

1. ✅ **Logica corretta di recupero salon_id** (manager + collaboratori)
2. ✅ **Creazione automatica delle impostazioni web mancanti**
3. ✅ **Fix delle foreign key constraints**
4. ✅ **Script di debug per diagnosi future**

Dopo aver applicato questi fix, il sistema dovrebbe funzionare correttamente per tutti gli utenti, sia manager che collaboratori.
