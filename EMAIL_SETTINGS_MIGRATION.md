# Email Settings Migration Fix

## Problema
L'errore `PGRST204: Could not find the 'require_tls' column of 'email_settings' in the schema cache` indica che la colonna `require_tls` non esiste nella tabella `email_settings` del database.

## Soluzione

### Opzione 1: Eseguire la migrazione automatica
Il codice è stato modificato per gestire automaticamente questo errore. Quando si verifica l'errore, il sistema:
1. Rileva l'errore della colonna mancante
2. Riprova il salvataggio senza il campo `require_tls`
3. Continua a funzionare normalmente

### Opzione 2: Eseguire la migrazione manuale (Raccomandato)

1. **Accedi al database Supabase**:
   - Vai su https://supabase.com
   - Accedi al tuo progetto
   - Vai su "SQL Editor"

2. **Esegui questo script SQL**:
```sql
-- Script per aggiungere le colonne mancanti secure e require_tls alla tabella email_settings
DO $$ 
BEGIN
    -- Aggiungi campo secure se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' 
        AND column_name = 'secure'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN secure BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonna secure aggiunta con successo alla tabella email_settings';
    ELSE
        RAISE NOTICE 'Colonna secure già esistente nella tabella email_settings';
    END IF;

    -- Aggiungi campo require_tls se non esiste
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' 
        AND column_name = 'require_tls'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN require_tls BOOLEAN DEFAULT true;
        RAISE NOTICE 'Colonna require_tls aggiunta con successo alla tabella email_settings';
    ELSE
        RAISE NOTICE 'Colonna require_tls già esistente nella tabella email_settings';
    END IF;
END $$;
```

3. **Verifica che la migrazione sia stata completata**:
```sql
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_settings' 
AND column_name = 'require_tls';
```

### Opzione 3: Reset completo del database (Solo se necessario)
Se le opzioni precedenti non funzionano:

```bash
npx supabase db reset
```

**ATTENZIONE**: Questo cancellerà tutti i dati del database locale.

## Risultato
Dopo aver eseguito la migrazione, le impostazioni email dovrebbero funzionare correttamente senza errori.

## Note
- La colonna `require_tls` ha un valore di default `true`
- Il sistema continuerà a funzionare anche senza questa colonna grazie alle modifiche al codice
- È consigliabile eseguire la migrazione per avere tutte le funzionalità disponibili 