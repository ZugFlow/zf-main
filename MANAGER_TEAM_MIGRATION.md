# Migrazione Manager alla Tabella Team

## Panoramica

Questo documento descrive le modifiche apportate per garantire che tutti gli utenti manager vengano creati anche nella tabella `team`, permettendo una gestione unificata di tutti gli utenti del sistema.

## Modifiche Apportate

### 1. Registrazione Utenti Normali (`app/(auth)/action.ts`)

**Prima:**
- Creazione solo nella tabella `profiles`

**Dopo:**
- Creazione nella tabella `profiles`
- Creazione automatica nella tabella `team` con ruolo `manager`

### 2. Registrazione Trial (`app/api/register-trial/route.ts`)

**Prima:**
- Creazione solo nella tabella `profiles`

**Dopo:**
- Creazione nella tabella `profiles`
- Creazione automatica nella tabella `team` con ruolo `manager`

### 3. Migrazione Utenti Esistenti

File: `utils/supabase/db/migrate_existing_managers_to_team.sql`

Questo script migra tutti i manager esistenti che non hanno ancora un record nella tabella `team`.

## Struttura Dati Manager nella Tabella Team

Quando viene creato un manager, viene inserito nella tabella `team` con questi valori:

```sql
{
  user_id: userId,
  email: email,
  name: email.split('@')[0], // Parte prima della @ come nome di default
  salon_id: profileData.salon_id,
  role: 'manager',
  is_active: true,
  visible_users: true,
  order_column: 0,
  ColorMember: '#3b82f6', // Colore blu per i manager
  avatar_url: '',
  sidebar: false
}
```

## Vantaggi della Modifica

1. **Gestione Unificata**: Tutti gli utenti (manager e collaboratori) sono ora nella stessa tabella
2. **Consistenza**: Uniformità nella gestione dei permessi e delle funzionalità
3. **Semplicità**: Un solo punto di accesso per tutte le operazioni sugli utenti
4. **Scalabilità**: Facilita l'aggiunta di nuove funzionalità per tutti gli utenti

## Rollback e Sicurezza

Entrambi i processi di registrazione includono:
- Gestione degli errori con rollback automatico
- Eliminazione dell'utente Auth se fallisce l'inserimento nel team
- Logging dettagliato per il debugging

## Esecuzione della Migrazione

Per migrare gli utenti manager esistenti:

```sql
-- Esegui il file di migrazione
\i utils/supabase/db/migrate_existing_managers_to_team.sql
```

## Verifica

Dopo la migrazione, puoi verificare che tutti i manager abbiano un record nella tabella team:

```sql
SELECT 
  COUNT(*) as total_managers,
  COUNT(t.id) as managers_in_team,
  COUNT(*) - COUNT(t.id) as missing_team_records
FROM public.profiles p
LEFT JOIN public.team t ON p.id = t.user_id
WHERE p.role = 'manager';
```

Il risultato dovrebbe mostrare `missing_team_records = 0`.
