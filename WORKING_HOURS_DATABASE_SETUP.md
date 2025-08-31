# Setup Database Orari di Lavoro

## Panoramica

Questo documento descrive come configurare il database Supabase per il sistema di gestione orari di lavoro del salone.

## Tabelle Create

### 1. `weekly_schedules` - Orari Settimanali
- **Scopo**: Orari fissi settimanali per ogni membro del team
- **Collegamenti**: 
  - `member_id` → `team.id`
  - `salon_id` → `profiles.salon_id`
- **Campi principali**:
  - `week_start_date`: Data di inizio settimana
  - `is_active`: Se l'orario è attivo

### 2. `daily_schedules` - Orari Giornalieri
- **Scopo**: Orari dettagliati per ogni giorno della settimana
- **Collegamenti**: `weekly_schedule_id` → `weekly_schedules.id`
- **Campi principali**:
  - `day_of_week`: 0=domenica, 1=lunedì, ..., 6=sabato
  - `start_time`, `end_time`: Orari di lavoro
  - `break_start`, `break_end`: Orari pausa
  - `is_working_day`: Se il giorno è lavorativo

### 3. `extra_schedules` - Orari Straordinari
- **Scopo**: Orari speciali per giorni specifici (festivi, aperture extra, etc.)
- **Collegamenti**: 
  - `member_id` → `team.id`
  - `salon_id` → `profiles.salon_id`
- **Tipi**: `extra`, `overtime`, `holiday`, `closing`

### 4. `shift_requests` - Richieste Cambio Turno
- **Scopo**: Richieste di cambio orario da parte dei dipendenti
- **Stati**: `pending`, `approved`, `rejected`

### 5. `availability_requests` - Richieste Disponibilità
- **Scopo**: Comunicazioni di disponibilità extra
- **Tipi**: `available`, `unavailable`

### 6. `schedule_notifications` - Notifiche
- **Scopo**: Notifiche per modifiche orari e richieste
- **Tipi**: `schedule_change`, `shift_request`, `availability_request`, `approval`

### 7. `working_hours_settings` - Impostazioni
- **Scopo**: Configurazioni generali per ogni salone
- **Campi principali**:
  - `is_schedule_locked`: Blocco orari per prenotazioni
  - `default_break_duration`: Durata pausa predefinita
  - `max_working_hours_per_day/week`: Limiti orari

## Installazione

### 1. Eseguire lo Script SQL

```bash
# Copia il contenuto di utils/supabase/db/create_working_hours_tables.sql
# ed eseguilo nel SQL Editor di Supabase
```

### 2. Verificare le Tabelle

```sql
-- Verifica che le tabelle siano state create
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%schedule%' OR table_name LIKE '%request%';
```

### 3. Testare le Funzioni

```sql
-- Test funzione calcolo ore
SELECT calculate_working_hours('09:00', '17:00', '12:00', '13:00');

-- Test funzione sovrapposizioni
SELECT check_schedule_overlap(
  'member-uuid-here',
  '2024-01-15',
  '10:00',
  '18:00'
);
```

## Relazioni e Vincoli

### Foreign Keys
- Tutte le tabelle sono collegate a `profiles.salon_id` per isolamento dati
- `member_id` collega sempre a `team.id` per identificare il dipendente
- Cascade delete per mantenere integrità referenziale

### Vincoli di Business Logic
- `start_time < end_time` per tutti gli orari
- `day_of_week` tra 0-6
- Stati e tipi con valori predefiniti
- Vincoli unici per evitare duplicati

## Row Level Security (RLS)

### Policy Implementate
- **Manager**: Accesso completo ai dati del proprio salone
- **Dipendenti**: 
  - Visualizzazione orari del proprio salone
  - Creazione/modifica delle proprie richieste
  - Visualizzazione delle proprie notifiche

### Esempio di Policy
```sql
-- I manager possono gestire tutti gli orari del loro salone
CREATE POLICY "Managers can manage their salon weekly schedules" 
ON weekly_schedules FOR ALL USING (
    salon_id IN (
        SELECT salon_id FROM profiles WHERE id = auth.uid()
    )
);
```

## Viste Utility

### `member_complete_schedule`
Combina orari settimanali e straordinari per una vista completa:
```sql
SELECT * FROM member_complete_schedule 
WHERE member_id = 'uuid' 
AND salon_id = 'salon-uuid';
```

### `working_hours_stats`
Statistiche orari per settimana:
```sql
SELECT * FROM working_hours_stats 
WHERE member_id = 'uuid' 
AND week_start_date >= '2024-01-01';
```

## Funzioni Utility

### `calculate_working_hours()`
Calcola ore lavorate considerando le pause:
```sql
SELECT calculate_working_hours('09:00', '17:00', '12:00', '13:00');
-- Risultato: 7.00 ore
```

### `check_schedule_overlap()`
Verifica sovrapposizioni orari:
```sql
SELECT check_schedule_overlap(
  'member-uuid',
  '2024-01-15',
  '10:00',
  '18:00'
);
-- Risultato: true/false
```

## Indici per Performance

### Indici Principali
- `member_id` e `salon_id` su tutte le tabelle
- `date` per query temporali
- `status` per filtri su richieste
- `is_active` per orari attivi

### Query Ottimizzate
```sql
-- Orari settimanali per membro
SELECT * FROM weekly_schedules 
WHERE member_id = 'uuid' 
AND is_active = true;

-- Richieste in sospeso per salone
SELECT * FROM shift_requests 
WHERE salon_id = 'salon-uuid' 
AND status = 'pending';
```

## Trigger Automatici

### Aggiornamento Timestamp
Tutte le tabelle hanno trigger per aggiornare automaticamente `updated_at`:
```sql
CREATE TRIGGER update_weekly_schedules_updated_at 
    BEFORE UPDATE ON weekly_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Esempi di Utilizzo

### 1. Creare Orario Settimanale
```sql
-- Inserisci orario settimanale
INSERT INTO weekly_schedules (member_id, salon_id, week_start_date)
VALUES ('member-uuid', 'salon-uuid', '2024-01-15');

-- Inserisci orari giornalieri
INSERT INTO daily_schedules (weekly_schedule_id, day_of_week, start_time, end_time)
VALUES 
  ('weekly-schedule-uuid', 1, '09:00', '17:00'), -- Lunedì
  ('weekly-schedule-uuid', 2, '09:00', '17:00'), -- Martedì
  ('weekly-schedule-uuid', 3, '09:00', '17:00'); -- Mercoledì
```

### 2. Creare Orario Straordinario
```sql
INSERT INTO extra_schedules (
  member_id, salon_id, date, start_time, end_time, type, reason
) VALUES (
  'member-uuid', 'salon-uuid', '2024-01-20', '10:00', '18:00', 'holiday', 'Apertura domenicale'
);
```

### 3. Richiesta Cambio Turno
```sql
INSERT INTO shift_requests (
  member_id, salon_id, requested_date, 
  current_start_time, current_end_time,
  requested_start_time, requested_end_time, reason
) VALUES (
  'member-uuid', 'salon-uuid', '2024-01-22',
  '09:00', '17:00',
  '10:00', '18:00', 'Impegno personale mattina'
);
```

## Monitoraggio e Manutenzione

### Query di Monitoraggio
```sql
-- Richieste in sospeso
SELECT COUNT(*) FROM shift_requests WHERE status = 'pending';
SELECT COUNT(*) FROM availability_requests WHERE status = 'pending';

-- Orari attivi
SELECT COUNT(*) FROM weekly_schedules WHERE is_active = true;

-- Notifiche non lette
SELECT COUNT(*) FROM schedule_notifications WHERE is_read = false;
```

### Backup e Recovery
- Tutte le tabelle supportano backup automatici di Supabase
- Le foreign key garantiscono integrità referenziale
- I trigger mantengono aggiornati i timestamp

## Troubleshooting

### Problemi Comuni

1. **Errore Foreign Key**
   - Verificare che `member_id` esista in `team`
   - Verificare che `salon_id` esista in `profiles`

2. **Errore Vincoli**
   - `start_time` deve essere < `end_time`
   - `day_of_week` deve essere tra 0-6

3. **Problemi RLS**
   - Verificare che l'utente abbia il `salon_id` corretto
   - Controllare le policy per il ruolo dell'utente

### Log e Debug
```sql
-- Verifica policy attive
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE '%schedule%' OR tablename LIKE '%request%';

-- Verifica indici
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename LIKE '%schedule%' OR tablename LIKE '%request%';
```

## Prossimi Passi

1. **Integrazione Frontend**: Collegare le tabelle al componente `OreLavorative.tsx`
2. **API Endpoints**: Creare endpoint per CRUD operations
3. **Real-time**: Implementare subscription per aggiornamenti in tempo reale
4. **Notifiche**: Sistema di notifiche push per cambi orari
5. **Report**: Dashboard con statistiche e report orari 