# Istruzioni per Risolvere il Problema "Salone non trovato"

## Problema
Il sistema mostra "Salone non trovato" e errori 406/400 perché:
- Mancano colonne nel database `salon_web_settings`
- Mancano vincoli di foreign key
- Mancano impostazioni web per alcuni profili

## Soluzione

### Passo 1: Esegui lo Script SQL
1. Vai nel tuo **Supabase Dashboard**
2. Apri la sezione **SQL Editor**
3. Copia e incolla il contenuto del file `utils/supabase/db/complete_salon_web_settings_fix.sql`
4. Clicca **Run** per eseguire lo script

### Passo 2: Verifica la Correzione
Dopo aver eseguito lo script, esegui questa query per verificare:

```sql
SELECT 
    'Summary' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'salon_web_settings' 
            AND column_name = 'web_layout_type'
        ) THEN '✅ Schema is correct'
        ELSE '❌ Schema is missing columns'
    END as schema_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'salon_web_settings' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%salon_id%'
        ) THEN '✅ Foreign key exists'
        ELSE '❌ Foreign key missing'
    END as foreign_key_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM salon_web_settings) > 0 THEN '✅ Web settings exist'
        ELSE '⚠️ No web settings found'
    END as data_status;
```

Dovresti vedere:
- ✅ Schema is correct
- ✅ Foreign key exists  
- ✅ Web settings exist

### Passo 3: Testa l'Applicazione
1. Ricarica la pagina delle impostazioni web
2. Il problema "Salone non trovato" dovrebbe essere risolto
3. Dovresti vedere il builder della pagina web funzionante

## Cosa Fa lo Script

1. **Aggiunge colonne mancanti** al database
2. **Crea vincoli di foreign key** per la sicurezza
3. **Crea impostazioni web** per profili che non le hanno
4. **Configura RLS policies** per l'accesso sicuro
5. **Verifica che tutto funzioni** correttamente

## Se il Problema Persiste

Se dopo aver eseguito lo script continui ad avere problemi:

1. **Controlla i log** nella console del browser
2. **Verifica che l'utente** abbia un `salon_id` associato
3. **Controlla i permessi** dell'utente (`canEditSystemSettings`)
4. **Ricarica la cache** del browser (Ctrl+F5)

## Supporto

Se hai bisogno di aiuto, fornisci:
- Screenshot dell'errore
- Output della query di verifica
- Log della console del browser
