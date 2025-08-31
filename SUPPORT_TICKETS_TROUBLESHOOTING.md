# Risoluzione Problemi Sistema Ticket di Supporto

## Problemi Comuni e Soluzioni

### 1. Errore Trigger già esistente

**Errore**: `ERROR: 42710: trigger "trigger_update_support_tickets_updated_at" for relation "support_tickets" already exists`

**Soluzione**: Eseguire lo script di correzione rapida:

```sql
-- Esegui il file fix_support_tickets.sql
```

Oppure manualmente:

```sql
-- Rimuovi i trigger esistenti
DROP TRIGGER IF EXISTS trigger_update_support_tickets_updated_at ON support_tickets;
DROP TRIGGER IF EXISTS trigger_update_ticket_response_timestamps ON support_ticket_responses;

-- Ricrea i trigger
CREATE TRIGGER trigger_update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

CREATE TRIGGER trigger_update_ticket_response_timestamps
  AFTER INSERT ON support_ticket_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_response_timestamps();
```

### 2. Errore Policy già esistente

**Errore**: `ERROR: 42710: policy "..." for relation "..." already exists`

**Soluzione**: Usare `DROP POLICY IF EXISTS` prima di creare:

```sql
-- Esempio per una policy
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);
```

### 3. Errore Funzione - Cambio tipo di ritorno

**Errore**: `ERROR: 42P13: cannot change return type of existing function`

**Soluzione**: Eliminare e ricreare la funzione:

```sql
-- Elimina la funzione esistente
DROP FUNCTION IF EXISTS get_tickets_with_latest_response(UUID);

-- Ricrea la funzione con il nuovo tipo di ritorno
CREATE FUNCTION get_tickets_with_latest_response(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  -- ... definizione del tipo di ritorno
) AS $$
-- ... corpo della funzione
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Oppure esegui lo script specifico: `fix_function_error.sql`

### 4. Risposte non si caricano

**Sintomi**: 
- "Error fetching responses: Object"
- Le risposte non appaiono nel pannello admin
- Errore nella console del browser

**Cause possibili**:
1. Policy RLS non configurate correttamente
2. Funzione `fetchResponses` con query complessa
3. Mancanza di permessi per gli admin

**Soluzioni**:

#### A. Verifica Policy RLS
```sql
-- Verifica che le policy esistano
SELECT * FROM pg_policies 
WHERE tablename = 'support_ticket_responses';

-- Se mancano, ricreale
DROP POLICY IF EXISTS "Admins can view all responses" ON support_ticket_responses;
CREATE POLICY "Admins can view all responses" ON support_ticket_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

#### B. Semplifica la query di fetchResponses
Il codice è già stato aggiornato per usare query separate invece di JOIN complessi.

#### C. Verifica ruolo admin
```sql
-- Verifica che l'utente sia admin
SELECT role FROM profiles WHERE id = 'user_id';
```

### 5. Risposte non si inviano

**Sintomi**:
- Errore "Error adding response"
- La risposta non viene salvata
- Errore di permesso

**Cause possibili**:
1. Policy INSERT non configurata
2. Trigger che fallisce
3. Vincoli di integrità

**Soluzioni**:

#### A. Verifica Policy INSERT
```sql
-- Verifica policy per inserimento risposte admin
SELECT * FROM pg_policies 
WHERE tablename = 'support_ticket_responses' 
AND cmd = 'INSERT';
```

#### B. Test inserimento manuale
```sql
-- Test inserimento risposta (sostituisci con ID reali)
INSERT INTO support_ticket_responses (ticket_id, user_id, message, is_admin)
VALUES ('ticket-uuid', 'user-uuid', 'Test response', true);
```

### 6. Ticket non visibili nel pannello admin

**Sintomi**:
- Pannello admin vuoto
- Errore "Error fetching tickets"
- Nessun ticket mostrato

**Cause possibili**:
1. Funzione RPC non funziona
2. Policy SELECT non configurata
3. Nessun ticket nel database

**Soluzioni**:

#### A. Verifica funzione RPC
```sql
-- Test funzione manualmente
SELECT * FROM get_tickets_with_latest_response(NULL);
```

#### B. Verifica esistenza ticket
```sql
-- Conta i ticket nel database
SELECT COUNT(*) FROM support_tickets;
```

#### C. Verifica policy SELECT
```sql
-- Verifica policy per admin
SELECT * FROM pg_policies 
WHERE tablename = 'support_tickets' 
AND cmd = 'SELECT';
```

### 7. Errore di autenticazione

**Sintomi**:
- "Accesso negato" nel pannello admin
- Reindirizzamento al dashboard
- Errore di verifica permessi

**Cause possibili**:
1. Utente non autenticato
2. Ruolo non impostato come 'admin'
3. Tabella profiles non aggiornata

**Soluzioni**:

#### A. Verifica autenticazione
```sql
-- Verifica che l'utente esista
SELECT * FROM auth.users WHERE id = 'user-uuid';
```

#### B. Verifica ruolo
```sql
-- Verifica ruolo utente
SELECT role FROM profiles WHERE id = 'user-uuid';

-- Se manca, imposta come admin
UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid';
```

#### C. Verifica tabella profiles
```sql
-- Verifica che la tabella profiles esista e abbia la colonna role
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
```

## Script di Debug

Eseguire lo script `debug_support_tickets.js` per diagnosticare automaticamente i problemi:

```bash
node debug_support_tickets.js
```

## Verifica Completa del Sistema

### 1. Verifica Tabelle
```sql
-- Verifica esistenza tabelle
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('support_tickets', 'support_ticket_responses');
```

### 2. Verifica Trigger
```sql
-- Verifica trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%support_tickets%';
```

### 3. Verifica Policy
```sql
-- Verifica tutte le policy
SELECT schemaname, tablename, policyname, cmd, permissive
FROM pg_policies
WHERE tablename IN ('support_tickets', 'support_ticket_responses');
```

### 4. Verifica Funzioni
```sql
-- Verifica funzioni RPC
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%support_ticket%';
```

## Comandi di Emergenza

### Reset Completo (ATTENZIONE: Cancella tutti i dati)
```sql
-- Rimuovi tutto e ricrea
DROP TABLE IF EXISTS support_ticket_responses CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP FUNCTION IF EXISTS update_support_tickets_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_ticket_response_timestamps() CASCADE;
DROP FUNCTION IF EXISTS get_support_ticket_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_tickets_with_latest_response(UUID) CASCADE;

-- Poi esegui di nuovo support_tickets_table.sql
```

### Backup e Ripristino
```sql
-- Backup dati esistenti
CREATE TABLE support_tickets_backup AS SELECT * FROM support_tickets;
CREATE TABLE support_ticket_responses_backup AS SELECT * FROM support_ticket_responses;

-- Ripristino dopo correzioni
INSERT INTO support_tickets SELECT * FROM support_tickets_backup;
INSERT INTO support_ticket_responses SELECT * FROM support_ticket_responses_backup;
```

## Contatti e Supporto

Se i problemi persistono:

1. **Controlla i log** del browser (F12 → Console)
2. **Verifica i log** di Supabase nel dashboard
3. **Esegui lo script di debug** per diagnosticare
4. **Controlla le policy RLS** nel dashboard Supabase
5. **Verifica le funzioni** nel SQL Editor di Supabase

## Checklist di Verifica

- [ ] Tabelle create correttamente
- [ ] Trigger funzionanti
- [ ] Policy RLS configurate
- [ ] Funzioni RPC funzionanti
- [ ] Utente admin configurato
- [ ] Ticket di test creati
- [ ] Risposte di test funzionanti
- [ ] Pannello admin accessibile
- [ ] Pannello utente funzionante
