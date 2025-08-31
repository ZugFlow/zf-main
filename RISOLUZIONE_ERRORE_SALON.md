# 🔧 Risoluzione Errore "relation salon does not exist"

## 🚨 **Problema Identificato**

L'errore `ERROR: 42P01: relation "salon" does not exist` indica che il database non ha una tabella `salon` separata, ma usa la struttura esistente dove il `salon_id` è memorizzato nella tabella `team`.

## ✅ **Soluzione Implementata**

Ho creato una versione corretta dello script SQL che funziona con la tua struttura di database:

### **File Corretto da Usare**
```
utils/supabase/db/create_work_hours_table_fixed.sql
```

### **Differenze Principali**

#### **Prima (Errato)**
```sql
salon_id UUID NOT NULL REFERENCES salon(id) ON DELETE CASCADE,
```

#### **Dopo (Corretto)**
```sql
salon_id UUID NOT NULL, -- Riferimento al salon_id nella tabella team
```

## 🗄️ **Struttura Database Corretta**

Il tuo database usa questa struttura:
- **`team`** tabella con `salon_id` per collegare membri al salone
- **`profiles`** tabella con `salon_id` per i manager
- **Nessuna tabella `salon` separata**

## 📋 **Istruzioni per Eseguire**

### **Passo 1: Usa il File Corretto**
```sql
-- Copia e incolla il contenuto di:
-- utils/supabase/db/create_work_hours_table_fixed.sql
```

### **Passo 2: Verifica l'Esecuzione**
```sql
-- Verifica che la tabella sia stata creata
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'work_hours';

-- Verifica le colonne
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'work_hours'
ORDER BY ordinal_position;
```

### **Passo 3: Test con Dati Reali**
```sql
-- Inserisci dati di test (sostituisci con i tuoi UUID reali)
INSERT INTO work_hours (member_id, salon_id, date, start_time, end_time, notes)
VALUES (
  (SELECT id FROM team LIMIT 1), -- Sostituisci con un ID reale
  (SELECT salon_id FROM team LIMIT 1), -- Sostituisci con un salon_id reale
  CURRENT_DATE,
  '09:00:00',
  '17:00:00',
  'Test ore lavorate'
);
```

## 🔍 **Verifica Struttura Database**

### **Controlla le Tabelle Esistenti**
```sql
-- Lista tutte le tabelle
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verifica struttura team
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team'
ORDER BY ordinal_position;

-- Verifica struttura profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

### **Controlla i Dati Esistenti**
```sql
-- Verifica membri del team
SELECT id, name, salon_id, user_id 
FROM team 
LIMIT 5;

-- Verifica profili
SELECT id, email, salon_id 
FROM profiles 
LIMIT 5;
```

## 🚀 **Prossimi Passi**

1. **Esegui lo script corretto** (`create_work_hours_table_fixed.sql`)
2. **Verifica che non ci siano errori**
3. **Testa con dati reali**
4. **Procedi con il testing del frontend**

## ⚠️ **Note Importanti**

- ✅ **Non esiste tabella `salon`** - usa `team.salon_id`
- ✅ **RLS Policies corrette** - funzionano con la struttura esistente
- ✅ **Funzioni di calcolo** - compatibili con il database esistente
- ✅ **Frontend aggiornato** - usa già la struttura corretta

## 🔧 **Se Continui ad Avere Problemi**

### **Controlla i Permessi**
```sql
-- Verifica che l'utente abbia i permessi corretti
SELECT * FROM pg_policies WHERE tablename = 'work_hours';
```

### **Verifica RLS**
```sql
-- Controlla se RLS è abilitato
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'work_hours';
```

### **Test Manuale**
```sql
-- Test inserimento manuale
INSERT INTO work_hours (member_id, salon_id, date, start_time, end_time)
SELECT 
  t.id,
  t.salon_id,
  CURRENT_DATE,
  '09:00:00',
  '17:00:00'
FROM team t
LIMIT 1;
```

## 📞 **Supporto**

Se incontri altri problemi:
1. **Controlla i console log** per errori specifici
2. **Verifica la struttura del database** con le query di test
3. **Assicurati di usare il file corretto** (`_fixed.sql`)

**🎉 Il sistema ora dovrebbe funzionare correttamente con la tua struttura di database!** 