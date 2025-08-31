# Guida Configurazione Sistema Notifiche

## Panoramica

Il sistema di notifiche di ZugFlow permette di configurare notifiche automatiche per clienti e staff del salone. Il sistema è diviso in due sezioni principali:

### 📅 Notifiche Cliente (SMS / Email)
Notifiche inviate ai clienti del salone per mantenere la comunicazione e ridurre no-show.

### 📊 Notifiche Salone / Staff (solo Email)
Notifiche interne per lo staff del salone per monitorare l'attività.

## Configurazione Database

### 1. Tabella appointment_notifications
La tabella esiste già e gestisce le notifiche per i clienti:

```sql
-- Verifica esistenza
SELECT * FROM appointment_notifications LIMIT 5;
```

### 2. Tabella salon_notifications
Esegui lo script per creare la tabella per le notifiche salone:

```sql
-- Esegui il file: utils/supabase/db/create_salon_notifications_table.sql
```

## Tipi di Notifiche Disponibili

### 🔴 Alta Priorità (Consigliate per iniziare)

#### Notifiche Cliente
1. **Promemoria Appuntamento (24h prima)**
   - Canale: Email
   - Timing: 24 ore prima dell'appuntamento
   - Scopo: Ridurre no-show

2. **Promemoria Appuntamento (1h prima)**
   - Canale: SMS
   - Timing: 1 ora prima dell'appuntamento
   - Scopo: Promemoria immediato

3. **Conferma Prenotazione**
   - Canale: Email/SMS
   - Timing: Immediato dopo prenotazione
   - Scopo: Conferma ricevuta

4. **Modifica Appuntamento**
   - Canale: Email/SMS
   - Timing: Immediato
   - Scopo: Notifica cambiamenti

5. **Annullamento Appuntamento**
   - Canale: Email/SMS
   - Timing: Immediato
   - Scopo: Conferma cancellazione

#### Notifiche Salone
1. **Nuova Prenotazione**
   - Canale: Email
   - Timing: Immediato
   - Scopo: Notifica staff

2. **Appuntamento Annullato**
   - Canale: Email
   - Timing: Immediato
   - Scopo: Notifica staff

### 🟠 Media Priorità

#### Notifiche Cliente
6. **Auguri di Buon Compleanno**
   - Canale: Email/SMS
   - Timing: 1-2 giorni prima del compleanno
   - Scopo: Marketing e fidelizzazione

7. **Cliente Inattivo (30/60/90 giorni)**
   - Canale: Email/SMS
   - Timing: Dopo periodo di inattività
   - Scopo: Re-engagement

#### Notifiche Salone
3. **Avviso Pagamento ZugFlow**
   - Canale: Email
   - Timing: 7 giorni prima scadenza
   - Scopo: Promemoria pagamento

4. **Pagamento Fallito**
   - Canale: Email
   - Timing: Immediato
   - Scopo: Notifica problemi

5. **Fattura Disponibile**
   - Canale: Email
   - Timing: Immediato
   - Scopo: Notifica staff

### 🟡 Bassa Priorità

#### Notifiche Salone
6. **Report Giornaliero**
   - Canale: Email
   - Timing: Ogni sera (20:00)
   - Scopo: Statistiche giornaliere

7. **Report Settimanale**
   - Canale: Email
   - Timing: Lunedì mattina
   - Scopo: Riepilogo settimanale

## Configurazione nell'Interfaccia

### Accesso
1. Vai su **Impostazioni** → **Notifiche**
2. Il sistema caricherà automaticamente le configurazioni esistenti

### Configurazione Canale
- **Email**: Notifiche via email
- **SMS**: Notifiche via SMS
- **Email + SMS**: Entrambi i canali

### Personalizzazione Messaggi
Ogni notifica può essere personalizzata con:
- **Variabili disponibili**: `{nome}`, `{data}`, `{ora}`, `{salone}`
- **Messaggio personalizzato**: Campo opzionale per personalizzare il testo

### Configurazione Destinatari (Notifiche Salone)
- **Email destinatari**: Lista email separate da virgole
- **Messaggio personalizzato**: Testo personalizzato per lo staff

## Variabili Template Disponibili

### Per Notifiche Cliente
- `{nome}` - Nome del cliente
- `{data}` - Data dell'appuntamento
- `{ora}` - Orario dell'appuntamento
- `{salone}` - Nome del salone
- `{servizi}` - Servizi prenotati
- `{durata}` - Durata dell'appuntamento

### Per Notifiche Salone
- `{cliente}` - Nome del cliente
- `{data}` - Data dell'appuntamento
- `{ora}` - Orario dell'appuntamento
- `{servizi}` - Servizi prenotati
- `{importo}` - Importo dell'appuntamento
- `{staff}` - Nome dello staff assegnato

## Esempi di Messaggi

### Conferma Prenotazione
```
Ciao {nome}, hai prenotato con successo il tuo appuntamento per il {data} alle {ora} presso {salone}.
```

### Promemoria Appuntamento
```
Ciao {nome}, ti ricordiamo il tuo appuntamento di domani alle {ora} presso {salone}.
```

### Auguri Compleanno
```
Tanti auguri {nome}! 🎁 Vieni a trovarci, hai uno sconto speciale del 20%!
```

### Cliente Inattivo
```
Ti aspettiamo {nome}! È passato un po' di tempo 😊 Vuoi prenotare un nuovo appuntamento?
```

## Priorità di Implementazione

### Fase 1 (Alta Priorità)
1. ✅ Promemoria appuntamento (SMS + Email)
2. ✅ Conferma/modifica/cancellazione
3. ✅ Notifiche nuove prenotazioni per staff

### Fase 2 (Media Priorità)
1. 🔄 Compleanno + inattività
2. 🔄 Avvisi pagamento
3. 🔄 Fatture disponibili

### Fase 3 (Bassa Priorità)
1. 📊 Report e avvisi interni
2. 📊 Statistiche automatiche

## Troubleshooting

### Problemi Comuni

#### Notifiche non vengono inviate
1. Verifica configurazione email SMTP
2. Controlla che le notifiche siano abilitate
3. Verifica che il salon_id sia corretto

#### Errori di caricamento
1. Controlla la connessione al database
2. Verifica che le tabelle esistano
3. Controlla i permessi dell'utente

#### Messaggi non personalizzati
1. Verifica che le variabili siano scritte correttamente
2. Controlla che i dati del cliente siano presenti
3. Testa con messaggi semplici

### Log e Debug
- Le notifiche vengono loggate nel database
- Controlla la tabella `appointment_notifications` per lo stato
- Verifica i log del server per errori SMTP

## Integrazione con Altri Sistemi

### Email Service
Il sistema utilizza il servizio email configurato in **Impostazioni** → **Email**

### SMS Service
Per SMS, configura un provider esterno (Twilio, Nexmo, etc.)

### Webhook
Possibilità di integrare webhook per notifiche personalizzate

## Sicurezza e Privacy

### GDPR Compliance
- Le notifiche rispettano le preferenze del cliente
- Possibilità di opt-out per ogni tipo di notifica
- Log delle notifiche inviate per audit

### Sicurezza
- Crittografia dei messaggi sensibili
- Autenticazione per accesso alle configurazioni
- Rate limiting per prevenire spam

## Supporto

Per problemi o domande:
1. Controlla questa guida
2. Verifica i log del sistema
3. Contatta il supporto tecnico

---

**Nota**: Il sistema di notifiche è progettato per essere scalabile e personalizzabile. Inizia con le notifiche ad alta priorità e aggiungi gradualmente le altre funzionalità. 