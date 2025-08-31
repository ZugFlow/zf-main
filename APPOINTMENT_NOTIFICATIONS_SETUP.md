# Sistema di Notifiche Appuntamenti

## Panoramica

Il sistema di notifiche per appuntamenti permette di inviare automaticamente SMS, WhatsApp ed email ai clienti prima dei loro appuntamenti. Il sistema è completamente integrato con il sistema esistente e utilizza `salon_id` per l'isolamento dei dati.

## Struttura del Database

### Tabella `appointment_notifications`

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID (PK) | ID univoco della notifica |
| `appointment_id` | UUID (FK) | Collegato alla tabella `orders` |
| `salon_id` | UUID (FK) | Collegato alla tabella `profiles` |
| `method` | TEXT | Metodo: 'sms', 'whatsapp', 'email' |
| `time_minutes` | INTEGER | Minuti prima dell'appuntamento (es. 1440 = 24h) |
| `sent` | BOOLEAN | Se è già stata inviata |
| `sent_at` | TIMESTAMP | Quando è stata inviata |
| `created_at` | TIMESTAMP | Quando è stata creata |
| `updated_at` | TIMESTAMP | Ultimo aggiornamento |

## Installazione

### 1. Eseguire le migrazioni SQL

Eseguire i seguenti file SQL nell'ordine:

```sql
-- 1. Creare la tabella principale
\i utils/supabase/db/create_appointment_notifications_table.sql

-- 2. Creare le funzioni helper
\i utils/supabase/db/create_appointment_notification_functions.sql
```

### 2. Verificare l'installazione

```sql
-- Verificare che la tabella sia stata creata
SELECT * FROM appointment_notifications LIMIT 1;

-- Verificare che le funzioni siano disponibili
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';
```

## Funzionalità

### Notifiche Automatiche

Quando viene creato un nuovo appuntamento, il sistema crea automaticamente le seguenti notifiche:

- **SMS 24 ore prima** (1440 minuti)
- **SMS 1 ora prima** (60 minuti)
- **SMS 15 minuti prima** (15 minuti)
- **Email 24 ore prima** (1440 minuti)
- **WhatsApp 1 ora prima** (60 minuti)

### Funzioni Disponibili

#### 1. Creazione Notifiche

```typescript
import { AppointmentNotificationService } from '@/utils/appointmentNotifications';

// Creare una notifica personalizzata
await AppointmentNotificationService.createCustomNotification(
  appointmentId,
  salonId,
  'sms',
  30 // 30 minuti prima
);
```

#### 2. Recupero Notifiche

```typescript
// Ottenere tutte le notifiche per un appuntamento
const notifications = await AppointmentNotificationService.getNotificationsForAppointment(appointmentId);

// Ottenere notifiche in attesa per un intervallo specifico
const pendingNotifications = await AppointmentNotificationService.getPendingNotifications(salonId, 60);
```

#### 3. Gestione Stato

```typescript
// Segnare una notifica come inviata
await AppointmentNotificationService.markNotificationSent(notificationId);

// Aggiornare una notifica
await AppointmentNotificationService.updateNotification(notificationId, {
  method: 'whatsapp',
  time_minutes: 120
});
```

#### 4. Statistiche

```typescript
// Ottenere statistiche delle notifiche
const stats = await AppointmentNotificationService.getNotificationStats(salonId);
```

## Intervalli di Tempo Predefiniti

```typescript
import { NOTIFICATION_TIMES } from '@/types/appointment-notifications';

NOTIFICATION_TIMES.TWENTY_FOUR_HOURS  // 1440 minuti
NOTIFICATION_TIMES.ONE_HOUR           // 60 minuti
NOTIFICATION_TIMES.THIRTY_MINUTES     // 30 minuti
NOTIFICATION_TIMES.FIFTEEN_MINUTES    // 15 minuti
NOTIFICATION_TIMES.FIVE_MINUTES       // 5 minuti
```

## Metodi di Notifica

```typescript
import { NOTIFICATION_METHODS } from '@/types/appointment-notifications';

NOTIFICATION_METHODS.SMS       // 'sms'
NOTIFICATION_METHODS.WHATSAPP  // 'whatsapp'
NOTIFICATION_METHODS.EMAIL     // 'email'
```

## Sicurezza e Permessi

### Row Level Security (RLS)

La tabella implementa RLS per garantire che gli utenti possano accedere solo alle notifiche del proprio salone:

- **SELECT**: Utenti possono vedere solo notifiche del proprio salone
- **INSERT**: Utenti possono creare notifiche solo per il proprio salone
- **UPDATE**: Utenti possono aggiornare solo notifiche del proprio salone
- **DELETE**: Utenti possono eliminare solo notifiche del proprio salone

### Controlli di Validazione

- Il campo `method` accetta solo: 'sms', 'whatsapp', 'email'
- Le foreign key garantiscono integrità referenziale
- I trigger automatici gestiscono la creazione di notifiche predefinite

## Integrazione con il Sistema Esistente

### Trigger Automatici

Quando viene creato un nuovo appuntamento nella tabella `orders`, il trigger `trigger_create_appointment_notifications` crea automaticamente le notifiche predefinite.

### Relazioni

- `appointment_id` → `orders.id` (CASCADE DELETE)
- `salon_id` → `profiles.salon_id` (CASCADE DELETE)

## Utilizzo Pratico

### 1. Creazione Appuntamento

```typescript
// Quando crei un appuntamento, le notifiche vengono create automaticamente
const newAppointment = await createAppointment(appointmentData);
// Le notifiche predefinite vengono create automaticamente
```

### 2. Gestione Notifiche Personalizzate

```typescript
// Aggiungere una notifica personalizzata
await AppointmentNotificationService.createCustomNotification(
  appointmentId,
  salonId,
  'whatsapp',
  120 // 2 ore prima
);
```

### 3. Monitoraggio Notifiche

```typescript
// Ottenere notifiche in attesa per l'invio
const pendingNotifications = await AppointmentNotificationService.getNotificationsToSend(salonId);

// Segnare come inviate dopo l'invio
await AppointmentNotificationService.markNotificationsAsSent(notificationIds);
```

## Cron Job per l'Invio

Per implementare l'invio automatico delle notifiche, creare un cron job che:

1. Chiami `getNotificationsToSend(salonId)` ogni minuto
2. Invii le notifiche tramite i servizi appropriati (SMS, WhatsApp, Email)
3. Chiami `markNotificationsAsSent()` dopo l'invio

### Esempio di Cron Job

```typescript
// Cron job ogni minuto
setInterval(async () => {
  const salons = await getAllSalons();
  
  for (const salon of salons) {
    try {
      const notifications = await AppointmentNotificationService.getNotificationsToSend(salon.id);
      
      for (const notification of notifications) {
        // Invia la notifica
        await sendNotification(notification);
        
        // Segna come inviata
        await AppointmentNotificationService.markNotificationSent(notification.notification_id);
      }
    } catch (error) {
      console.error(`Error processing notifications for salon ${salon.id}:`, error);
    }
  }
}, 60000); // Ogni minuto
```

## Monitoraggio e Debug

### Query Utili

```sql
-- Verificare notifiche in attesa
SELECT * FROM appointment_notifications 
WHERE sent = FALSE 
AND salon_id = 'your-salon-id'
ORDER BY time_minutes;

-- Statistiche per metodo
SELECT method, COUNT(*) as total, 
       COUNT(CASE WHEN sent THEN 1 END) as sent_count
FROM appointment_notifications 
WHERE salon_id = 'your-salon-id'
GROUP BY method;

-- Notifiche per appuntamento specifico
SELECT * FROM appointment_notifications 
WHERE appointment_id = 'appointment-uuid'
ORDER BY time_minutes;
```

### Log e Debug

Il sistema include logging per debug:

```sql
-- Verificare errori nelle funzioni
SELECT * FROM pg_stat_activity 
WHERE query LIKE '%notification%';
```

## Estensioni Future

### Possibili Miglioramenti

1. **Template Personalizzabili**: Aggiungere supporto per template di messaggi personalizzabili
2. **Impostazioni per Salone**: Tabella separata per impostazioni di notifica per salone
3. **Retry Logic**: Sistema di retry per notifiche fallite
4. **Analytics Avanzate**: Dashboard per analisi delle performance delle notifiche
5. **Integrazione API**: Integrazione con servizi SMS/WhatsApp/Email esterni

### Struttura per Template

```sql
-- Tabella per template personalizzabili
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY,
    salon_id UUID NOT NULL,
    template_name TEXT NOT NULL,
    template_content TEXT NOT NULL,
    method TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### Problemi Comuni

1. **Notifiche non create automaticamente**
   - Verificare che il trigger sia attivo
   - Controllare i log per errori

2. **Permessi negati**
   - Verificare le policy RLS
   - Controllare che l'utente abbia accesso al salone

3. **Performance lente**
   - Verificare gli indici
   - Ottimizzare le query con LIMIT e OFFSET

### Comandi di Debug

```sql
-- Verificare trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%notification%';

-- Verificare policy RLS
SELECT * FROM pg_policies 
WHERE tablename = 'appointment_notifications';
```

## Conclusione

Il sistema di notifiche per appuntamenti è ora completamente integrato e pronto per l'uso. Il sistema garantisce:

- ✅ Isolamento dei dati per salone
- ✅ Notifiche automatiche alla creazione di appuntamenti
- ✅ Sicurezza con RLS
- ✅ Performance ottimizzate con indici
- ✅ API TypeScript per facile integrazione
- ✅ Funzioni helper per gestione avanzata

Il sistema è scalabile e può essere facilmente esteso per supportare nuove funzionalità in futuro. 