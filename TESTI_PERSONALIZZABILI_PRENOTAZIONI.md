# Testi Personalizzabili per Prenotazioni Online

## 🎯 Panoramica

Il sistema ora supporta la personalizzazione dei testi degli status delle prenotazioni online. Puoi modificare i testi che vengono visualizzati nell'interfaccia utente per adattarli al tuo stile e alle tue esigenze.

## 📋 Testi Disponibili

### Status Prenotazioni Online

| Chiave | Testo Default | Descrizione |
|--------|---------------|-------------|
| `booking_status_pending` | "In attesa" | Testo per lo status "pending" |
| `booking_status_confirmed` | "Confermato" | Testo per lo status "confirmed" |
| `booking_status_cancelled` | "Annullato" | Testo per lo status "cancelled" |
| `booking_status_completed` | "Completato" | Testo per lo status "completed" |
| `booking_status_converted` | "Convertito" | Testo per lo status "converted" |

### Team Members

| Chiave | Testo Default | Descrizione |
|--------|---------------|-------------|
| `booking_team_not_assigned` | "Non assegnato" | Testo quando un membro del team non è assegnato |
| `booking_team_member_not_found` | "Membro non trovato" | Testo quando un membro del team non viene trovato |

## 🔧 Come Personalizzare

1. **Vai alle Impostazioni** → **Testi Personalizzabili**
2. **Trova la sezione "Status Prenotazioni Online"**
3. **Clicca su "Modifica"** per il testo che vuoi cambiare
4. **Inserisci il nuovo testo** e clicca "Salva"
5. **I cambiamenti saranno visibili immediatamente** nelle prenotazioni online

## 📱 Dove Appaiono

I testi personalizzati vengono utilizzati in:

- **Lista prenotazioni online** (desktop e mobile)
- **Modal di dettaglio prenotazione**
- **Badge di status** nelle card delle prenotazioni
- **Informazioni sui membri del team**

## 🚀 Migrazione Database

Se stai aggiornando un sistema esistente, esegui questo script SQL per aggiungere i nuovi testi:

```sql
-- Esegui il file: utils/supabase/db/add_booking_status_texts.sql
```

## 🔄 Reset ai Valori Default

Se vuoi tornare ai valori di default:

1. Vai alle **Impostazioni** → **Testi Personalizzabili**
2. Trova il testo che vuoi resettare
3. Clicca su **"Reset"**
4. Il testo tornerà al valore di default

## 💡 Esempi di Personalizzazione

### Esempio 1: Status più Formali
- `booking_status_pending` → "In attesa di conferma"
- `booking_status_confirmed` → "Prenotazione confermata"
- `booking_status_cancelled` → "Prenotazione annullata"

### Esempio 2: Status in Inglese
- `booking_status_pending` → "Pending"
- `booking_status_confirmed` → "Confirmed"
- `booking_status_cancelled` → "Cancelled"

### Esempio 3: Status Personalizzati
- `booking_status_pending` → "⏳ In elaborazione"
- `booking_status_confirmed` → "✅ Confermato"
- `booking_status_cancelled` → "❌ Annullato"

## 🎨 Compatibilità

- ✅ **Desktop**: Testi personalizzati funzionano perfettamente
- ✅ **Mobile**: Testi personalizzati funzionano perfettamente
- ✅ **Real-time**: I cambiamenti sono immediati
- ✅ **Multi-lingua**: Supporta qualsiasi lingua

## 🔍 Debug

Se i testi non si aggiornano:

1. **Verifica che i testi siano salvati** nelle impostazioni
2. **Controlla la console del browser** per errori
3. **Ricarica la pagina** delle prenotazioni online
4. **Verifica che il salon_id sia corretto** nel database

## 📞 Supporto

Per problemi o domande sui testi personalizzabili:

1. Controlla i log della console del browser
2. Verifica che la tabella `custom_texts` contenga i tuoi testi
3. Assicurati che `is_active = true` per i testi personalizzati 