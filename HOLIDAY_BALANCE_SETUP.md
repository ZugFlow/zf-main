# Gestione Bilanci Ferie - Setup e Utilizzo

## Panoramica

La nuova funzionalità di **Gestione Bilanci Ferie** permette ai manager di configurare i giorni di ferie disponibili per ogni dipendente, sostituendo il valore fisso di 25 giorni con un sistema flessibile e personalizzabile.

## Caratteristiche Principali

### ✅ Funzionalità Implementate

1. **Configurazione per Dipendente**: Ogni dipendente può avere un bilancio ferie personalizzato
2. **Gestione per Anno**: I bilanci sono specifici per anno solare
3. **Calcolo Automatico**: I giorni utilizzati vengono calcolati automaticamente dai permessi approvati
4. **Interfaccia Manager**: Solo i manager possono configurare i bilanci
5. **Fallback Intelligente**: Se non configurato, usa 25 giorni come default
6. **Visualizzazione Avanzata**: Progress bar, percentuali di utilizzo, stati colorati

### 🔧 Setup Database

#### 1. Eseguire la Migrazione SQL

```sql
-- File: utils/supabase/db/add_holiday_balance_table.sql
-- Eseguire questo script nel database Supabase
```

#### 2. Se si verifica un errore di Foreign Key Constraint

Se ricevi l'errore:
```
ERROR: 23503: insert or update on table "holiday_balances" violates foreign key constraint "holiday_balances_salon_id_fkey"
```

Esegui questo script di correzione:
```sql
-- File: utils/supabase/db/fix_holiday_balance_foreign_key.sql
-- Questo script risolve il problema della foreign key constraint
```

#### 2. Struttura Tabella

```sql
holiday_balances (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES team(id),
  salon_id UUID REFERENCES profiles(id),
  year INTEGER,
  total_days INTEGER DEFAULT 25,
  used_days INTEGER DEFAULT 0,
  pending_days INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### 📊 Come Utilizzare

#### Per i Manager

1. **Accedere alla Sezione**: 
   - Vai su "Permessi & Ferie" 
   - Clicca sul tab "Bilanci"

2. **Creare un Nuovo Bilancio**:
   - Clicca "Nuovo Bilancio"
   - Seleziona il dipendente
   - Imposta l'anno
   - Configura i giorni totali (es. 25, 30, 35)
   - Aggiungi note opzionali

3. **Modificare un Bilancio Esistente**:
   - Clicca l'icona di modifica nella tabella
   - Aggiorna i giorni totali o le note
   - Salva le modifiche

4. **Visualizzare Statistiche**:
   - Percentuale di utilizzo per ogni dipendente
   - Giorni rimanenti e in attesa
   - Statistiche aggregate del salone

#### Per i Dipendenti

- **Visualizzazione**: I dipendenti vedono solo i propri bilanci
- **Calcolo Automatico**: I giorni utilizzati si aggiornano automaticamente
- **Fallback**: Se non configurato, mostra 25 giorni di default

### 🎯 Vantaggi

1. **Flessibilità**: Ogni dipendente può avere un bilancio personalizzato
2. **Trasparenza**: Visualizzazione chiara dei giorni disponibili
3. **Automazione**: Calcolo automatico dei giorni utilizzati
4. **Controllo**: Solo i manager possono modificare i bilanci
5. **Storico**: Gestione per anno solare
6. **Fallback**: Sistema robusto con valori di default

### 🔄 Aggiornamenti Automatici

- **Trigger Database**: I giorni utilizzati si aggiornano automaticamente quando vengono approvati/rifiutati permessi
- **Real-time**: Le modifiche sono visibili immediatamente
- **Sincronizzazione**: I dati sono sempre coerenti tra permessi e bilanci

### 📱 Interfaccia Utente

#### Tabella Bilanci
- **Dipendente**: Nome e ruolo
- **Giorni Totali**: Bilancio configurato
- **Utilizzati**: Calcolati automaticamente
- **Rimanenti**: Giorni ancora disponibili
- **In Attesa**: Permessi pendenti
- **Utilizzo**: Progress bar con percentuale
- **Azioni**: Modifica ed elimina

#### Statistiche
- **Totale Dipendenti**: Con bilancio configurato
- **Giorni Totali**: Somma di tutti i bilanci
- **Utilizzo Medio**: Percentuale media di utilizzo

### 🚀 Prossimi Sviluppi

1. **Import/Export**: Funzionalità per importare/esportare bilanci
2. **Template**: Template predefiniti per diversi tipi di contratto
3. **Notifiche**: Avvisi quando i bilanci sono quasi esauriti
4. **Report**: Report dettagliati per la gestione HR
5. **Integrazione**: Integrazione con sistemi di paghe e stipendi

### 🔧 Risoluzione Problemi

#### Problema: "Tabella holiday_balances non esiste"
**Soluzione**: Eseguire la migrazione SQL nel database Supabase

#### Problema: "Foreign Key Constraint Error"
```
ERROR: 23503: insert or update on table "holiday_balances" violates foreign key constraint "holiday_balances_salon_id_fkey"
```
**Soluzione**: Eseguire lo script di correzione `fix_holiday_balance_foreign_key.sql`

#### Problema: "Bilanci non si aggiornano"
**Soluzione**: Verificare che i trigger del database siano attivi

#### Problema: "Dipendente non visibile"
**Soluzione**: Verificare che il dipendente sia attivo nella tabella `team`

#### Problema: "salon_id non trovato"
**Soluzione**: Verificare che il dipendente abbia un `salon_id` valido nella tabella `team` o `profiles`

### 📞 Supporto

Per problemi o richieste di funzionalità aggiuntive, contattare il team di sviluppo.

---

**Nota**: Questa funzionalità sostituisce completamente il sistema precedente con 25 giorni fissi, offrendo maggiore flessibilità e controllo nella gestione delle ferie. 