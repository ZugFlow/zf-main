# Analisi Problemi Email - Zugflow

## Problemi Identificati

### 1. **Mismatch tra user_id e salon_id nella tabella email_settings**

**Problema**: 
- La tabella `email_settings` usa `user_id` 
- L'API `/api/send-email` cerca con `salon_id`
- Questo causa il fallimento del recupero delle impostazioni email

**Soluzione Implementata**:
- ✅ Creato script di migrazione: `utils/supabase/db/migrate_email_settings_to_salon_id.sql`
- ✅ Aggiornato componente email.tsx per usare `salon_id`
- ✅ Aggiornato API send-email per usare `salon_id`

### 2. **Configurazione SMTP non corretta**

**Problema**:
- Le impostazioni email potrebbero non essere configurate correttamente
- Mancanza di validazione dei parametri SMTP

**Soluzioni Implementate**:
- ✅ Aggiunta validazione dei campi obbligatori
- ✅ Configurazione automatica per provider comuni (Gmail, Outlook, Yahoo)
- ✅ Gestione SSL/TLS configurabile
- ✅ Test di connessione integrato

### 3. **Template Email non configurati**

**Problema**:
- I template email personalizzati potrebbero non essere configurati
- Fallback su template di default

**Soluzioni Implementate**:
- ✅ Template di default funzionanti
- ✅ Sistema di template personalizzabili
- ✅ Sostituzione variabili nel template

## Azioni Richieste

### 1. **Eseguire la Migrazione del Database**

```sql
-- Esegui questo script nel Supabase Dashboard SQL Editor
-- File: utils/supabase/db/migrate_email_settings_to_salon_id.sql
```

**Passi**:
1. Vai su https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Vai su SQL Editor
4. Copia e incolla il contenuto del file di migrazione
5. Esegui lo script

### 2. **Configurare le Impostazioni Email**

1. Vai su **Impostazioni > Email**
2. Configura le impostazioni SMTP:
   - **Provider**: Gmail (raccomandato)
   - **Email/Username**: La tua email Gmail
   - **Password**: App Password di Gmail (non la password normale)
   - **Porta**: 587
   - **TLS**: Abilitato

### 3. **Configurare Gmail App Password**

1. Abilita l'autenticazione a due fattori su Google
2. Vai su Account Google → Sicurezza → Password per le app
3. Genera una password per "Zugflow"
4. Usa questa password nel campo Password

### 4. **Testare la Configurazione**

1. Clicca su "Testa Connessione" nelle impostazioni email
2. Verifica che il test sia riuscito
3. Prova a confermare una prenotazione online

## Verifica del Funzionamento

### Controlli da Fare:

1. **Impostazioni Email**:
   - [ ] Configurazione SMTP salvata correttamente
   - [ ] Test di connessione riuscito
   - [ ] Notifiche email abilitate

2. **Template Email**:
   - [ ] Template personalizzati configurati (opzionale)
   - [ ] Template di default funzionanti

3. **Prenotazioni Online**:
   - [ ] Email di conferma inviate correttamente
   - [ ] Email di modifica inviate correttamente
   - [ ] Email di cancellazione inviate correttamente

### Debug Mode

Il sistema include un debug mode nelle prenotazioni online che mostra:
- Stato della connessione real-time
- Log delle operazioni email
- Qualità della connessione
- Test manuale delle email

## File Modificati

1. `app/api/send-email/route.ts` - Corretto per usare salon_id
2. `app/(dashboard)/(private)/crm/dashboard/Impostazioni/_component/email.tsx` - Aggiornato per salon_id
3. `utils/supabase/db/migrate_email_settings_to_salon_id.sql` - Script di migrazione

## Note Importanti

- Le impostazioni email sono ora per salone, non per utente
- Ogni salone può avere una configurazione email indipendente
- I template email sono personalizzabili per salone
- Il sistema include fallback per template di default

## Prossimi Passi

1. Eseguire la migrazione del database
2. Configurare le impostazioni email
3. Testare l'invio di email
4. Verificare il funzionamento completo 