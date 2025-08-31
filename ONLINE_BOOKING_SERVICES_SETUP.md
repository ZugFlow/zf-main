# Configurazione Prenotazioni Online per Servizi

## 🎯 Panoramica

È stata aggiunta una nuova colonna `online_booking_enabled` alla tabella `services` per controllare quali servizi sono disponibili per le prenotazioni online.

## 📊 Struttura Database

### Nuova Colonna
```sql
ALTER TABLE public.services 
ADD COLUMN online_booking_enabled BOOLEAN DEFAULT true;
```

### Indice Ottimizzato
```sql
CREATE INDEX idx_services_online_booking_enabled 
ON public.services(online_booking_enabled) 
WHERE online_booking_enabled = true;
```

## 🔧 Funzionalità

### 1. Controllo Granulare
- **`visible_online = true`**: Il servizio è visibile nella galleria del sito web
- **`online_booking_enabled = true`**: Il servizio è disponibile per prenotazioni online
- **`status = 'Attivo'`**: Il servizio è attivo nel sistema

### 2. Toggle nel Dashboard
- Ogni servizio ha un toggle "Prenotazione Online" nella card
- Cambio immediato senza ricaricamento pagina
- Feedback visivo con toast di conferma

### 3. API Aggiornate
- `/api/salon-web`: Filtra servizi con tutti e tre i criteri
- `/api/salon-web?debug=true`: Mostra statistiche dettagliate

## 🎨 Interfaccia Utente

### Dashboard Admin
```
┌─────────────────────────────────┐
│ [✓] Prenotazione Online         │ ← Toggle per ogni servizio
│ [✗] Prenotazione Online         │
└─────────────────────────────────┘
```

### Debug Info
```
Services Debug:
Tutti i servizi: 15
Servizi visibili: 12
Servizi prenotabili: 8
Salon ID: xxx-xxx-xxx
```

## 🚀 Implementazione

### 1. Esegui Migration
```bash
# Esegui il file SQL per aggiungere la colonna
psql -d your_database -f utils/supabase/db/add_online_booking_column_to_services.sql
```

### 2. Verifica Configurazione
```sql
-- Controlla servizi disponibili online
SELECT 
  name,
  status,
  visible_online,
  online_booking_enabled
FROM services 
WHERE salon_id = 'your-salon-id'
  AND status = 'Attivo'
  AND visible_online = true
  AND online_booking_enabled = true;
```

### 3. Test Modal Prenotazione
1. Vai alla pagina web del salone
2. Clicca "🔍 Debug Services" per verificare i dati
3. Apri il modal di prenotazione
4. Verifica che appaiano solo i servizi con `online_booking_enabled = true`

## 📋 Criteri di Filtro

### Servizi Disponibili Online
```sql
WHERE salon_id = :salon_id
  AND status = 'Attivo'
  AND visible_online = true
  AND online_booking_enabled = true
```

### Esempi di Configurazione

| Servizio | Status | Visible Online | Online Booking | Risultato |
|----------|--------|----------------|----------------|-----------|
| Taglio Donna | Attivo | ✓ | ✓ | ✅ Disponibile |
| Massaggio | Attivo | ✓ | ✗ | ❌ Non prenotabile |
| Consulenza | Inattivo | ✓ | ✓ | ❌ Non attivo |
| Servizio Privato | Attivo | ✗ | ✓ | ❌ Non visibile |

## 🔄 Workflow

### Per Abilitare un Servizio Online
1. Vai su **Dashboard > Servizi**
2. Trova il servizio desiderato
3. Clicca il toggle "Prenotazione Online"
4. Conferma il cambio

### Per Disabilitare un Servizio Online
1. Vai su **Dashboard > Servizi**
2. Trova il servizio
3. Disattiva il toggle "Prenotazione Online"
4. Il servizio rimane visibile ma non prenotabile

## 🐛 Debug

### Problemi Comuni

**1. Modal vuoto**
```javascript
// Verifica con debug
fetch('/api/salon-web?subdomain=xxx&debug=true')
  .then(r => r.json())
  .then(data => console.log(data));
```

**2. Servizi non appaiono**
- Controlla `status = 'Attivo'`
- Controlla `visible_online = true`
- Controlla `online_booking_enabled = true`

**3. Toggle non funziona**
- Verifica permessi database
- Controlla console per errori
- Verifica connessione Supabase

## 📈 Statistiche

### Endpoint Debug
```
GET /api/salon-web?subdomain=xxx&debug=true
```

### Risposta
```json
{
  "salon_id": "xxx-xxx-xxx",
  "all_services_count": 15,
  "visible_services_count": 12,
  "booking_services_count": 8,
  "all_services": [...],
  "visible_services": [...],
  "booking_services": [...]
}
```

## 🎯 Prossimi Passi

1. **Rimuovi debug buttons** dopo il testing
2. **Aggiungi filtri** nel dashboard per servizi online
3. **Implementa bulk actions** per abilitare/disabilitare multipli servizi
4. **Aggiungi analytics** per servizi più prenotati online

---

**Nota**: Questa funzionalità è retrocompatibile. I servizi esistenti avranno `online_booking_enabled = true` di default. 