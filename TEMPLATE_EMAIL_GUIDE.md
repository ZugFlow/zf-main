# Guida Template Email e Testi Personalizzabili

## Panoramica

Il sistema di Zugflow ora supporta la personalizzazione completa di:
- **Template Email**: Messaggi HTML e testuali inviati ai clienti
- **Testi di Sistema**: Alert, notifiche e messaggi di feedback

## Template Email

### Accesso
1. Vai su **Impostazioni** → **Template**
2. Seleziona il tipo di template da modificare:
   - **Conferma Prenotazione**: Email inviata quando una prenotazione viene confermata
   - **Cancellazione Prenotazione**: Email inviata quando una prenotazione viene annullata
   - **Modifica Prenotazione**: Email inviata quando una prenotazione viene modificata

### Variabili Disponibili

#### Variabili Principali
- `{{customer_name}}` - Nome del cliente
- `{{service_name}}` - Nome del servizio
- `{{appointment_date}}` - Data dell'appuntamento (formattata)
- `{{appointment_time}}` - Orario dell'appuntamento
- `{{salon_name}}` - Nome del salone

#### Variabili Condizionali
- `{{salon_address}}` - Indirizzo del salone
- `{{salon_phone}}` - Telefono del salone

#### Condizioni
```handlebars
{{#if salon_address}}
📍 {{salon_address}}
{{/if}}
```

### Funzionalità

#### Editor
- **Oggetto Email**: Personalizza l'oggetto dell'email
- **Contenuto HTML**: Editor per il contenuto HTML con anteprima
- **Contenuto Testo**: Versione testuale per client email che non supportano HTML

#### Anteprima
- Visualizza l'email come apparirà al cliente
- Usa dati di esempio per il preview
- Toggle tra vista HTML e testo

#### Azioni
- **Salva Template**: Salva le modifiche
- **Reset Default**: Torna ai valori di default
- **Anteprima**: Mostra/nascondi l'anteprima

## Testi Personalizzabili

### Accesso
1. Vai su **Impostazioni** → **Testi**
2. I testi sono organizzati in categorie:
   - **Messaggi di Successo**: Conferme di operazioni completate
   - **Messaggi di Errore**: Notifiche di errori e problemi

### Tipi di Testi

#### Messaggi di Successo
- `booking_confirmation_success` - Conferma prenotazione
- `booking_cancellation_success` - Cancellazione prenotazione
- `booking_modification_success` - Modifica prenotazione
- `booking_conversion_success` - Conversione in appuntamento
- `booking_archive_success` - Archiviazione prenotazione
- `booking_restore_success` - Ripristino prenotazione

#### Messaggi di Errore
- `email_send_error` - Errore invio email
- `booking_validation_error` - Dati non validi
- `booking_time_conflict` - Conflitto orari
- `booking_team_member_required` - Membro team mancante
- `booking_service_required` - Servizio mancante
- `booking_date_required` - Data mancante
- `booking_time_required` - Orario mancante
- `booking_customer_name_required` - Nome cliente mancante
- `booking_phone_required` - Telefono mancante
- `booking_email_invalid` - Email non valida
- `booking_phone_invalid` - Telefono non valido
- `booking_past_date` - Data passata
- `booking_outside_hours` - Fuori orari
- `booking_team_unavailable` - Team non disponibile
- `booking_service_unavailable` - Servizio non disponibile
- `booking_duplicate` - Prenotazione duplicata
- `booking_system_error` - Errore generico sistema

### Funzionalità

#### Gestione Testi
- **Ricerca**: Trova rapidamente i testi
- **Modifica**: Clicca su "Modifica" per personalizzare
- **Salva**: Conferma le modifiche
- **Reset**: Torna ai valori di default

#### Organizzazione
- **Categorie**: Testi organizzati per tipo
- **Descrizioni**: Spiegazione di ogni testo
- **Stato**: Indica se il testo è personalizzato o di default

## Utilizzo nel Codice

### Hook useCustomTexts

```typescript
import { useCustomTexts } from '@/hooks/useCustomTexts';

function MyComponent() {
  const { getText } = useCustomTexts();
  
  const handleSuccess = () => {
    toast.success(getText('booking_confirmation_success', 'Prenotazione confermata!'));
  };
  
  const handleError = () => {
    toast.error(getText('booking_validation_error', 'Dati non validi'));
  };
}
```

### Template Email

I template vengono utilizzati automaticamente dalle funzioni email:
- `sendBookingConfirmationEmail()`
- `sendBookingModificationEmail()`
- `sendBookingCancellationEmail()`

## Best Practices

### Template Email
1. **Mantieni la brevità**: Email concise sono più efficaci
2. **Usa le variabili**: Personalizza sempre con i dati del cliente
3. **Testa l'anteprima**: Verifica come appare prima di salvare
4. **Backup**: Salva versioni di backup dei template importanti

### Testi di Sistema
1. **Chiarezza**: Usa messaggi chiari e comprensibili
2. **Coerenza**: Mantieni uno stile uniforme
3. **Utilità**: Fornisci informazioni utili all'utente
4. **Breve**: Messaggi concisi sono più efficaci

## Risoluzione Problemi

### Template non si aggiornano
1. Verifica che il template sia salvato come "attivo"
2. Controlla che non ci siano errori di sintassi HTML
3. Prova a resettare e ricreare il template

### Testi non personalizzati
1. Verifica che il testo sia salvato come "attivo"
2. Controlla che la chiave del testo sia corretta
3. Prova a ricaricare la pagina

### Email non inviate
1. Verifica le impostazioni SMTP
2. Controlla che i template siano configurati correttamente
3. Testa la connessione email

## Supporto

Per problemi o domande:
1. Controlla i log del sistema
2. Verifica le impostazioni del database
3. Contatta il supporto tecnico 