# Migrazione Testi Personalizzabili

## 🎯 Panoramica

Questo documento spiega come migrare il sistema di testi personalizzabili per utilizzare correttamente la relazione `salon_id` dalla tabella `profiles`.

## 📋 Struttura Database

### Tabella `profiles`
```sql
CREATE TABLE public.profiles (
  id uuid not null,
  email text null,
  avatar text null,
  customer_id text null,
  is_active boolean null,
  plan text null,
  expires_at timestamp with time zone null,
  stripe_customer_id text null,
  created_at timestamp without time zone null default now(),
  vincolo_attivo_fino_al timestamp with time zone null,
  salon_id uuid null default gen_random_uuid(),
  role text null,
  name text null,
  "mustChangePassword" boolean null,
  constraint profiles_pkey primary key (id),
  constraint unique_salon_id unique (salon_id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id)
);
```

### Tabella `custom_texts`
```sql
CREATE TABLE IF NOT EXISTS custom_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES profiles(salon_id) ON DELETE CASCADE,
  text_key VARCHAR(100) NOT NULL,
  text_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, text_key)
);
```

## 🚀 Passi per la Migrazione

### 1. Esegui la Correzione della Foreign Key
Se la tabella `custom_texts` esiste già con una foreign key sbagliata:

```sql
-- Esegui il file: utils/supabase/db/fix_custom_texts_foreign_key.sql
```

### 2. Crea la Tabella e Inserisci i Testi di Default
Se la tabella non esiste ancora:

```sql
-- Esegui il file: utils/supabase/db/custom_texts_fixed.sql
```

### 3. Aggiungi i Testi degli Status (se non presenti)
Se vuoi aggiungere solo i nuovi testi per gli status:

```sql
-- Esegui il file: utils/supabase/db/add_booking_status_texts.sql
```

## 🔍 Verifica della Migrazione

### Controlla la Foreign Key
```sql
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='custom_texts';
```

### Controlla i Testi Inseriti
```sql
SELECT 
  ct.text_key,
  ct.text_value,
  ct.description,
  ct.is_active,
  p.name as salon_name
FROM custom_texts ct
JOIN profiles p ON ct.salon_id = p.salon_id
WHERE ct.is_active = true
ORDER BY ct.text_key;
```

## ⚠️ Note Importanti

1. **Relazione Corretta**: `custom_texts.salon_id` → `profiles.salon_id`
2. **Vincolo UNIQUE**: Ogni salone ha un `salon_id` univoco in `profiles`
3. **Cascade Delete**: Se un salone viene eliminato, tutti i suoi testi vengono eliminati
4. **Testi Attivi**: Solo i testi con `is_active = true` vengono utilizzati dall'applicazione

## 🔧 Risoluzione Problemi

### Errore: Foreign Key Constraint
Se ricevi un errore di foreign key constraint:

1. Verifica che tutti i `salon_id` in `custom_texts` esistano in `profiles`
2. Esegui lo script di correzione della foreign key
3. Rimuovi eventuali record orfani

### Errore: Duplicate Key
Se ricevi un errore di chiave duplicata:

1. Verifica che non ci siano testi duplicati per lo stesso `salon_id` e `text_key`
2. Usa il trigger per disattivare automaticamente i testi vecchi

## 📞 Supporto

Per problemi durante la migrazione:

1. Controlla i log di errore del database
2. Verifica che la tabella `profiles` contenga i dati corretti
3. Assicurati che tutti i `salon_id` siano validi 