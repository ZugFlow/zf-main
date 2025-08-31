# Test Integrazione Notifiche in CreateOrder

## ✅ Integrazione Completata

### Cosa è stato implementato:

1. **Componente NotificationSection** (`NotificationSection.tsx`):
   - ✅ Interfaccia completa per gestire notifiche
   - ✅ Switch per abilitare/disabilitare notifiche
   - ✅ Selezione metodo (SMS, WhatsApp, Email)
   - ✅ Selezione intervallo tempo (24h, 1h, 30min, 15min, 5min)
   - ✅ Aggiunta/rimozione notifiche personalizzate
   - ✅ Badge con conteggio notifiche attive

2. **Integrazione nel CreateOrderForm** (`form.tsx`):
   - ✅ Import del componente NotificationSection
   - ✅ State per le impostazioni notifiche
   - ✅ Sezione notifiche nel form (dopo "Staff e Note")
   - ✅ Creazione automatica notifiche al salvataggio appuntamento
   - ✅ Gestione errori senza bloccare creazione appuntamento

3. **Funzionalità Implementate**:
   - ✅ Notifiche predefinite: SMS 24h, 1h, 15min + Email 24h
   - ✅ Possibilità di aggiungere notifiche personalizzate
   - ✅ Abilitazione/disabilitazione singole notifiche
   - ✅ Salvataggio nel database `appointment_notifications`
   - ✅ Integrazione con `salon_id` per isolamento dati

### Struttura delle Notifiche Predefinite:

```typescript
const defaultNotifications = [
  { method: 'sms', time_minutes: 1440, enabled: true },      // 24 ore
  { method: 'sms', time_minutes: 60, enabled: true },         // 1 ora
  { method: 'sms', time_minutes: 15, enabled: true },         // 15 minuti
  { method: 'email', time_minutes: 1440, enabled: true },     // Email 24 ore
];
```

### Flusso di Creazione Appuntamento:

1. **Utente compila form** → Sezione notifiche visibile (configurazione manuale)
2. **Utente configura notifiche** → Aggiunge/rimuove notifiche personalizzate
3. **Utente salva appuntamento** → Creazione ordine + servizi + notifiche configurate
4. **n8n può leggere notifiche** → Query per notifiche in attesa

### Notifiche Configurabili dall'Utente:

- **Metodi**: SMS, Email
- **Intervalli**: 24h, 1h, 30min, 15min, 5min prima
- **Quantità**: Quante ne vuole l'utente (0 o più)
- **Personalizzazione**: Ogni notifica può essere abilitata/disabilitata

### Query per n8n:

```sql
-- Ottenere notifiche in attesa per un salone
SELECT 
  an.id as notification_id,
  an.appointment_id,
  an.method,
  an.time_minutes,
  o.nome as customer_name,
  o.telefono as customer_phone,
  o.email as customer_email,
  o.data as appointment_date,
  o.orarioInizio as appointment_time,
  t.name as team_member_name
FROM appointment_notifications an
JOIN orders o ON an.appointment_id = o.id
LEFT JOIN team t ON o.team_id = t.id
WHERE an.salon_id = 'your-salon-id'
  AND an.sent = FALSE
  AND an.time_minutes = 60  -- Es: 1 ora prima
  AND o.data::DATE = CURRENT_DATE + INTERVAL '1 hour';
```

### Test da Eseguire:

1. **Setup Iniziale**:
   ```sql
   -- 1. Rimuovere trigger automatico
   \i utils/supabase/db/disable_notification_trigger.sql
   
   -- 2. Pulire duplicazioni esistenti
   \i utils/supabase/db/cleanup_duplicate_notifications.sql
   ```

2. **Test Creazione Appuntamento**:
   - Aprire CreateOrder
   - Verificare che la sezione notifiche sia vuota
   - Aggiungere alcune notifiche manualmente
   - Salvare appuntamento
   - Verificare che solo le notifiche configurate siano create

3. **Test Interfaccia**:
   - Toggle notifiche on/off
   - Cambiare metodo (SMS/Email)
   - Cambiare intervallo tempo
   - Aggiungere notifica personalizzata
   - Rimuovere notifica

4. **Verifica Database**:
   ```sql
   -- Verificare che non ci siano duplicazioni
   \i utils/supabase/db/verify_notification_setup.sql
   ```

### Prossimi Passi per n8n:

1. **Cron Job**: Eseguire ogni minuto
2. **Query Database**: Ottenere notifiche in attesa
3. **Invio Notifiche**: Integrare con servizi SMS/Email
4. **Aggiornamento Stato**: Mark come `sent = true` dopo invio

### Esempio Workflow n8n:

```javascript
// 1. Query notifiche in attesa
const notifications = await supabase
  .from('appointment_notifications')
  .select(`
    id,
    appointment_id,
    method,
    time_minutes,
    orders!inner(
      nome,
      telefono,
      email,
      data,
      orarioInizio
    )
  `)
  .eq('salon_id', salonId)
  .eq('sent', false)
  .eq('time_minutes', 60); // 1 ora prima

// 2. Per ogni notifica
for (const notification of notifications) {
  // 3. Invia notifica
  await sendNotification(notification);
  
  // 4. Mark come inviata
  await supabase
    .from('appointment_notifications')
    .update({ sent: true, sent_at: new Date().toISOString() })
    .eq('id', notification.id);
}
```

## ✅ Integrazione Completata e Pronta per n8n!

## 🔧 Fix Applicato

### Problema Risolto:
- **Prima**: 9-10 righe per appuntamento (duplicazioni)
- **Dopo**: Righe configurate dall'utente (0 o più, senza duplicazioni)

### Modifiche Effettuate:
1. **Rimosso notifiche predefinite** - ora l'utente configura tutto manualmente
2. **Disabilitato trigger automatico** - non crea più notifiche automatiche
3. **Ripristinato creazione manuale** - solo le notifiche configurate dall'utente
4. **Rimosso WhatsApp** dalle opzioni disponibili
5. **Creato script cleanup** per rimuovere duplicazioni esistenti

### Per Pulire i Dati Esistenti:
```sql
-- 1. Rimuovere il trigger automatico (causa duplicazioni)
\i utils/supabase/db/disable_notification_trigger.sql

-- 2. Pulire le duplicazioni esistenti
\i utils/supabase/db/cleanup_duplicate_notifications.sql
``` 