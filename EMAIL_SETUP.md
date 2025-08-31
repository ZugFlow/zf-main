# 📧 Configurazione Email per Prenotazioni Online

## Panoramica

Il sistema di prenotazioni online ora supporta l'invio automatico di email di notifica ai clienti quando:
- ✅ Una prenotazione viene **approvata**
- 🔄 Una prenotazione viene **modificata**
- ❌ Una prenotazione viene **cancellata**

## Configurazione SMTP

### 1. Variabili d'Ambiente

Aggiungi le seguenti variabili al tuo file `.env.local`:

```env
# Configurazione SMTP per l'invio delle email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Configurazione Gmail (Raccomandato)

Per usare Gmail come server SMTP:

1. **Abilita l'autenticazione a due fattori** sul tuo account Google
2. **Genera una "Password per le app"**:
   - Vai su [Account Google](https://myaccount.google.com/)
   - Sicurezza > Password per le app
   - Seleziona "App" e inserisci "Zugflow"
   - Copia la password generata (16 caratteri)
3. **Usa la password generata** come `SMTP_PASS`

### 3. Altri Provider SMTP

Il sistema supporta qualsiasi provider SMTP. Ecco alcuni esempi:

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### Provider Personalizzato
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Funzionalità

### 1. Notifiche Automatiche

Le email vengono inviate automaticamente quando:

- **Approvazione**: Il cliente riceve una conferma con tutti i dettagli
- **Modifica**: Il cliente viene informato dei nuovi orari
- **Cancellazione**: Il cliente riceve una notifica di annullamento

### 2. Template Email

Le email includono:
- 📧 **Design responsive** che funziona su desktop e mobile
- 🎨 **Branding personalizzato** del salone
- 📋 **Dettagli completi** della prenotazione
- 📍 **Informazioni del salone** (indirizzo, telefono)
- ⚠️ **Istruzioni importanti** per il cliente

### 3. Controllo Notifiche

Nell'interfaccia di gestione prenotazioni:
- 🔔 **Toggle Email**: Abilita/disabilita le notifiche email
- 🧪 **Test Connessione**: Verifica la configurazione SMTP
- 📊 **Log Debug**: Monitora l'invio delle email

## Test della Configurazione

### 1. Test Automatico

1. Abilita la **modalità debug** nell'interfaccia
2. Clicca su **"Test Email"** per verificare la connessione
3. Controlla i log per eventuali errori

### 2. Test Manuale

Puoi testare l'invio email tramite l'API:

```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "customerName": "Test Cliente",
    "serviceName": "Test Servizio",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "10:00"
  }'
```

## Risoluzione Problemi

### Errore: "Invalid login"
- Verifica che `SMTP_USER` e `SMTP_PASS` siano corretti
- Per Gmail, assicurati di usare una "Password per le app"

### Errore: "Connection timeout"
- Verifica che `SMTP_HOST` e `SMTP_PORT` siano corretti
- Controlla che il firewall non blocchi la connessione

### Errore: "Authentication failed"
- Per Gmail, abilita l'autenticazione a due fattori
- Genera una nuova "Password per le app"

### Email non ricevute
- Controlla la cartella spam
- Verifica che l'indirizzo email del cliente sia corretto
- Controlla i log del server per errori

## Sicurezza

- 🔐 Le credenziali SMTP sono protette dalle variabili d'ambiente
- 🛡️ L'API richiede autenticazione utente
- 📝 Tutti gli invii sono loggati per audit
- ⚠️ Le email contengono avvisi di non risposta

## Personalizzazione

### Modifica Template

I template email si trovano in `app/api/send-email/route.ts` e possono essere personalizzati per:
- 🎨 Colori e stile del brand
- 📝 Contenuto e messaggi
- 🌐 Lingua e formato date
- 📱 Layout responsive

### Aggiungere Campi

Per aggiungere nuovi campi alle email:
1. Modifica l'interfaccia `EmailData`
2. Aggiorna il template HTML
3. Passa i nuovi dati dal frontend

## Supporto

Per problemi con l'invio email:
1. Controlla i log del debug mode
2. Verifica la configurazione SMTP
3. Testa la connessione con il pulsante "Test Email"
4. Controlla che le variabili d'ambiente siano impostate correttamente 