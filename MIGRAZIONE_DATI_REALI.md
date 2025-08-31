# 🚀 Migrazione da Dati Mock a Dati Reali

## 📋 **Stato Attuale**

### ✅ **Completato**
- [x] Identificazione di tutti i dati mock nel sistema
- [x] Creazione schema database `work_hours`
- [x] Implementazione funzioni di calcolo
- [x] Sostituzione `mockWorkHours` con fetch reali
- [x] Aggiunta real-time subscriptions
- [x] Creazione componente `WorkHoursTracker`
- [x] Aggiornamento `StatsCardsOrari` per dati reali

### 🔄 **In Corso**
- [ ] Esecuzione script SQL nel database
- [ ] Testing con dati reali
- [ ] Validazione calcoli

### 📝 **Da Fare**
- [ ] Rimuovere altri dati mock nel sistema
- [ ] Implementare sistema presenze completo
- [ ] Aggiungere reportistica avanzata

## 🗄️ **Esecuzione Script Database**

### **Passo 1: Eseguire lo Script SQL**

1. **Accedi al Supabase Dashboard**
   - Vai su https://supabase.com/dashboard
   - Seleziona il tuo progetto

2. **Apri SQL Editor**
   - Clicca su "SQL Editor" nel menu laterale
   - Crea una nuova query

3. **Esegui lo Script**
   ```sql
   -- Copia e incolla il contenuto di:
   -- utils/supabase/db/create_work_hours_table_fixed.sql
   ```

4. **Verifica l'Esecuzione**
   - Controlla che non ci siano errori
   - Verifica che la tabella `work_hours` sia stata creata
   - Controlla che le funzioni siano state create

### **Passo 2: Verifica Struttura**

```sql
-- Verifica che la tabella esista
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'work_hours';

-- Verifica le colonne
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'work_hours'
ORDER BY ordinal_position;

-- Verifica le funzioni
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%work_hours%';
```

## 🧪 **Testing con Dati Reali**

### **Test 1: Inserimento Ore Lavorate**

```sql
-- Inserisci dati di test
INSERT INTO work_hours (member_id, salon_id, date, start_time, end_time, notes)
VALUES (
  (SELECT id FROM team LIMIT 1), -- Sostituisci con un ID reale
  (SELECT id FROM salon LIMIT 1), -- Sostituisci con un ID reale
  CURRENT_DATE,
  '09:00:00',
  '17:00:00',
  'Test ore lavorate'
);
```

### **Test 2: Calcolo Statistiche**

```sql
-- Test funzione calcolo ore totali
SELECT * FROM calculate_total_work_hours(
  (SELECT id FROM salon LIMIT 1), -- Sostituisci con salon_id reale
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);

-- Test funzione statistiche
SELECT * FROM get_work_hours_stats(
  (SELECT id FROM salon LIMIT 1), -- Sostituisci con salon_id reale
  'month'
);
```

### **Test 3: Frontend**

1. **Avvia l'applicazione**
   ```bash
   npm run dev
   ```

2. **Vai alla sezione "Permessi & Ferie"**
   - Verifica che le Stats Cards mostrino dati reali
   - Controlla i console log per debug

3. **Testa il WorkHoursTracker**
   - Usa il componente per registrare ore
   - Verifica che i dati vengano salvati nel database

## 🔍 **Verifica Correttezza Dati**

### **Controlli da Fare**

1. **Stats Cards "Ore Totali"**
   - [ ] Mostra somma corretta delle ore dal database
   - [ ] Calcola media corretta
   - [ ] Conta giorni lavorati correttamente

2. **Real-time Updates**
   - [ ] Le Stats Cards si aggiornano quando si inseriscono nuove ore
   - [ ] Le notifiche toast funzionano
   - [ ] I dati sono sincronizzati

3. **WorkHoursTracker**
   - [ ] Registra correttamente inizio/fine lavoro
   - [ ] Calcola ore automaticamente
   - [ ] Salva nel database con formato corretto

### **Debug Console Logs**

Controlla i console log per verificare:

```javascript
// Dovrebbe mostrare:
🔍 Fetching real work hours for salon_id: [uuid]
✅ Work hours fetched: { count: X, sample: [...] }
🔍 StatsCardsOrari - Dati ricevuti: { workHoursCount: X, ... }
🔍 StatsCardsOrari - Calcoli: { totalHours: X, averageHours: X, ... }
```

## 🚨 **Risoluzione Problemi**

### **Errore: "Table work_hours does not exist"**
```sql
-- Verifica che la tabella sia stata creata
SELECT * FROM work_hours LIMIT 1;
```

### **Errore: "Function calculate_total_work_hours does not exist"**
```sql
-- Ricrea la funzione
-- Copia la funzione dal file SQL e riesegui
```

### **Errore: "RLS Policy violation"**
```sql
-- Verifica che l'utente abbia i permessi corretti
-- Controlla le policies nella tabella
SELECT * FROM pg_policies WHERE tablename = 'work_hours';
```

### **Stats Cards Vuote**
- Verifica che ci siano dati nella tabella `work_hours`
- Controlla che `salon_id` sia corretto
- Verifica i console log per errori

## 📊 **Monitoraggio Performance**

### **Query Performance**

```sql
-- Verifica performance delle query
EXPLAIN ANALYZE 
SELECT * FROM work_hours 
WHERE salon_id = 'your-salon-id' 
AND status = 'completed';
```

### **Indici**

```sql
-- Verifica che gli indici siano stati creati
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'work_hours';
```

## 🔄 **Prossimi Passi**

### **Immediati**
1. **Eseguire script SQL** nel database
2. **Testare con dati reali**
3. **Verificare Stats Cards**
4. **Testare WorkHoursTracker**

### **A Medio Termine**
1. **Rimuovere altri dati mock** nel sistema
2. **Implementare sistema presenze completo**
3. **Aggiungere reportistica avanzata**
4. **Ottimizzare performance**

### **A Lungo Termine**
1. **Dashboard analitiche**
2. **Report periodici automatici**
3. **Integrazione con sistemi esterni**
4. **Compliance normativa**

## 📞 **Supporto**

Se incontri problemi durante la migrazione:

1. **Controlla i console log** per errori specifici
2. **Verifica la struttura del database** con le query di test
3. **Controlla i permessi RLS** per l'utente corrente
4. **Verifica la connessione Supabase** nel frontend

## ✅ **Checklist Finale**

- [ ] Script SQL eseguito senza errori
- [ ] Tabella `work_hours` creata correttamente
- [ ] Funzioni di calcolo funzionanti
- [ ] Stats Cards mostrano dati reali
- [ ] WorkHoursTracker funziona
- [ ] Real-time updates attivi
- [ ] Performance accettabili
- [ ] Dati mock rimossi dal frontend

**🎉 Congratulazioni! Il sistema ora usa dati reali invece di mock!** 