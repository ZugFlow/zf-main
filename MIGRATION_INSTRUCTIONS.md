# Istruzioni per la Migrazione del Database

## Aggiunta della colonna `hide_outside_hours` alla tabella `hoursettings`

Per far funzionare correttamente il toggle "Nascondi orari fuori dall'orario di lavoro", è necessario eseguire la seguente migrazione SQL nel database Supabase.

### Opzione 1: Tramite Supabase Dashboard (Raccomandato)

1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su "SQL Editor" nel menu laterale
4. Copia e incolla il seguente codice SQL:

```sql
-- Aggiunge la colonna hide_outside_hours alla tabella hoursettings
-- Questa colonna controlla se nascondere gli orari fuori dall'orario di lavoro

-- Verifica se la colonna esiste già
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hoursettings' 
        AND column_name = 'hide_outside_hours'
    ) THEN
        -- Aggiungi colonna hide_outside_hours
        ALTER TABLE public.hoursettings 
        ADD COLUMN "hide_outside_hours" BOOLEAN DEFAULT false;
        
        -- Imposta il valore di default per i record esistenti
        UPDATE public.hoursettings 
        SET "hide_outside_hours" = false
        WHERE "hide_outside_hours" IS NULL;
        
        -- Aggiungi commento alla colonna
        COMMENT ON COLUMN public.hoursettings."hide_outside_hours" IS 'Controlla se nascondere gli orari fuori dall''orario di lavoro nel calendario: true = nascondi, false = mostra';
        
        RAISE NOTICE 'Colonna hide_outside_hours aggiunta con successo alla tabella hoursettings';
    ELSE
        RAISE NOTICE 'Colonna hide_outside_hours già esistente nella tabella hoursettings';
    END IF;
END $$;
```

5. Clicca su "Run" per eseguire la migrazione

### Opzione 2: Verifica della Migrazione

Dopo aver eseguito la migrazione, puoi verificare che la colonna sia stata aggiunta correttamente eseguendo questa query:

```sql
-- Verifica se la colonna hide_outside_hours esiste nella tabella hoursettings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'hoursettings' 
AND column_name = 'hide_outside_hours';
```

### Risultato Atteso

Dopo l'esecuzione della migrazione, dovresti vedere:
- `column_name`: hide_outside_hours
- `data_type`: boolean
- `is_nullable`: YES
- `column_default`: false

### Funzionalità

Una volta completata la migrazione, il toggle "Nascondi orari fuori dall'orario di lavoro" funzionerà correttamente:

1. **Attivato**: Nasconde gli orari prima dell'orario di inizio e dopo l'orario di fine nel calendario
2. **Disattivato**: Mostra tutti gli orari nel calendario (00:00 - 23:59)

L'impostazione viene salvata per utente e salon, quindi ogni utente può avere la propria preferenza. 