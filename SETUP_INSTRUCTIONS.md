# 🚀 Setup Sistema Orari di Lavoro

## 📋 **Prerequisiti**

- ✅ Account Supabase attivo
- ✅ Accesso al progetto Supabase
- ✅ Permessi di amministratore per eseguire script SQL

## 🔧 **Passo 1: Eseguire Script SQL**

### 1.1 Aprire Supabase Dashboard
1. Vai su [supabase.com](https://supabase.com)
2. Accedi al tuo account
3. Seleziona il progetto del tuo gestionale

### 1.2 Aprire SQL Editor
1. Nel menu laterale, clicca su **"SQL Editor"**
2. Clicca su **"New query"**

### 1.3 Eseguire Script
1. Copia tutto il contenuto del file `utils/supabase/db/create_working_hours_tables.sql`
2. Incolla nel SQL Editor
3. Clicca su **"Run"** per eseguire lo script

### 1.4 Verificare Esecuzione
Dovresti vedere messaggi di successo per:
- ✅ Creazione tabelle
- ✅ Creazione indici
- ✅ Creazione trigger
- ✅ Creazione funzioni
- ✅ Creazione viste
- ✅ Abilitazione RLS
- ✅ Creazione policy

## 🔍 **Passo 2: Verificare Tabelle Create**

### 2.1 Controllare Tabelle
Nel menu laterale, vai su **"Table Editor"** e verifica che siano state create:

- ✅ `weekly_schedules`
- ✅ `daily_schedules`
- ✅ `extra_schedules`
- ✅ `shift_requests`
- ✅ `availability_requests`
- ✅ `schedule_notifications`
- ✅ `working_hours_settings`

### 2.2 Verificare Relazioni
Ogni tabella dovrebbe avere:
- ✅ Chiavi primarie (UUID)
- ✅ Chiavi esterne verso `team` e `profiles`
- ✅ Indici per performance
- ✅ Trigger per `updated_at`

## 🧪 **Passo 3: Testare Funzionalità**

### 3.1 Test Manager
1. **Accedi come manager** al gestionale
2. **Vai alla sezione "Permessi e Ferie"**
3. **Clicca su "Orari di Lavoro"**
4. **Testa le funzionalità:**
   - ✅ Crea nuovo orario settimanale
   - ✅ Crea orario straordinario
   - ✅ Duplica settimana
   - ✅ Blocca/sblocca orari

### 3.2 Test Dipendente
1. **Accedi come dipendente** al gestionale
2. **Vai alla sezione "Permessi e Ferie"**
3. **Clicca su "Orari di Lavoro"**
4. **Testa le funzionalità:**
   - ✅ Visualizza propri orari
   - ✅ Richiedi cambio turno
   - ✅ Richiedi disponibilità extra

### 3.3 Test Real-time
1. **Apri due browser/tab**
2. **Accedi con account diversi** (manager + dipendente)
3. **Modifica orari in uno**
4. **Verifica aggiornamento automatico nell'altro**

## 🐛 **Risoluzione Problemi**

### Problema: "Table already exists"
```sql
-- Se le tabelle esistono già, eliminarle prima:
DROP TABLE IF EXISTS schedule_notifications CASCADE;
DROP TABLE IF EXISTS availability_requests CASCADE;
DROP TABLE IF EXISTS shift_requests CASCADE;
DROP TABLE IF EXISTS extra_schedules CASCADE;
DROP TABLE IF EXISTS daily_schedules CASCADE;
DROP TABLE IF EXISTS weekly_schedules CASCADE;
DROP TABLE IF EXISTS working_hours_settings CASCADE;
```

### Problema: "Function already exists"
```sql
-- Eliminare funzioni esistenti:
DROP FUNCTION IF EXISTS check_schedule_overlap CASCADE;
DROP FUNCTION IF EXISTS calculate_working_hours CASCADE;
```

### Problema: "Permission denied"
- Verifica di avere i permessi di amministratore
- Controlla che il progetto sia attivo
- Prova a ricaricare la pagina

### Problema: "RLS Policy error"
```sql
-- Ricreare le policy:
DROP POLICY IF EXISTS "Managers can manage all schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Employees can view own schedules" ON weekly_schedules;
-- ... ripetere per tutte le tabelle
```

## 📊 **Verifica Finale**

### Checklist Completa:
- ✅ Script SQL eseguito senza errori
- ✅ Tutte le tabelle create correttamente
- ✅ Relazioni e indici funzionanti
- ✅ RLS e policy configurati
- ✅ Funzioni e trigger attivi
- ✅ UI funziona correttamente
- ✅ Real-time updates funzionanti
- ✅ Gestione errori attiva
- ✅ Loading states visibili

## 🎯 **Prossimi Passi**

### Dopo il Setup:
1. **Testare con dati reali** del team
2. **Configurare orari iniziali** per tutti i dipendenti
3. **Formare il team** sull'uso del sistema
4. **Monitorare l'utilizzo** per ottimizzazioni

### Ottimizzazioni Future:
- 🔄 Aggiungere validazione Zod
- 🔄 Implementare cache avanzata
- 🔄 Aggiungere report automatici
- 🔄 Integrare con sistema notifiche

## 🎉 **Sistema Pronto!**

Il sistema di gestione orari di lavoro è ora **completamente funzionale** e pronto per l'uso in produzione!

### **Caratteristiche Attive:**
- 🗄️ Database completo e ottimizzato
- 🎨 UI moderna e intuitiva
- 🔄 Aggiornamenti real-time
- 🛡️ Sicurezza e controllo accessi
- 📱 Responsive design
- 🔔 Notifiche automatiche
- ⚡ Performance ottimizzate

**Buon lavoro! 🚀** 