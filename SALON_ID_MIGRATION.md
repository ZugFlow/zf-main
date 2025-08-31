# Migrazione a salon_id per Template Email e Testi Personalizzabili

## Panoramica

Il sistema è stato aggiornato per utilizzare `salon_id` invece di `user_id` per identificare il salone di appartenenza. Questo garantisce che tutti i membri del team di un salone condividano gli stessi template email e testi personalizzabili.

## Modifiche Effettuate

### 1. Database Schema

#### Tabella `email_templates`
- **Rimosso**: campo `user_id`
- **Mantenuto**: campo `salon_id` 
- **Aggiornato**: constraint UNIQUE da `(user_id, template_type, is_active)` a `(salon_id, template_type, is_active)`
- **Aggiornato**: tutti gli INSERT per utilizzare solo `salon_id`

#### Tabella `custom_texts`
- **Rimosso**: campo `user_id`
- **Mantenuto**: campo `salon_id`
- **Aggiornato**: constraint UNIQUE da `(user_id, text_key, is_active)` a `(salon_id, text_key, is_active)`
- **Aggiornato**: tutti gli INSERT per utilizzare solo `salon_id`

### 2. Componenti Frontend

#### `EmailTemplatesManager` (`testi.tsx`)
- **Aggiunto**: import di `getSalonId` da `@/utils/getSalonId`
- **Aggiornato**: `fetchTemplates()` per utilizzare `salon_id` invece di `user_id`
- **Aggiornato**: `saveTemplate()` per utilizzare `salon_id` invece di `user_id`
- **Aggiornato**: `resetToDefault()` per utilizzare `salon_id` invece di `user_id`

#### `CustomTextsManager` (`testi-personalizzabili.tsx`)
- **Aggiunto**: import di `getSalonId` da `@/utils/getSalonId`
- **Aggiornato**: `fetchTexts()` per utilizzare `salon_id` invece di `user_id`
- **Aggiornato**: `saveText()` per utilizzare `salon_id` invece di `user_id`
- **Aggiornato**: `resetToDefault()` per utilizzare `salon_id` invece di `user_id`

#### Hook `useCustomTexts`
- **Aggiunto**: import di `getSalonId` da `@/utils/getSalonId`
- **Aggiornato**: `fetchTexts()` per utilizzare `salon_id` invece di `user_id`

### 3. API Routes

#### `send-email/route.ts`
- **Aggiunto**: import di `getSalonId` da `@/utils/getSalonIdServer`
- **Aggiornato**: recupero `salon_id` tramite `getSalonId()`
- **Aggiornato**: query `email_settings` per utilizzare `salon_id` invece di `user_id`
- **Aggiornato**: query `email_templates` per utilizzare `salon_id` invece di `user_id`
- **Aggiornato**: query `salon` per utilizzare `salon_id` direttamente

### 4. Utility Functions

#### `getSalonIdServer.ts` (nuovo)
- **Creato**: versione server-side di `getSalonId` per API routes
- **Funzionalità**: identica a `getSalonId.ts` ma utilizza `createClient()` server-side

## Vantaggi della Migrazione

1. **Condivisione Team**: Tutti i membri del team di un salone condividono gli stessi template email e testi personalizzabili
2. **Consistenza**: I template e testi sono associati al salone, non al singolo utente
3. **Scalabilità**: Facilita la gestione di team multi-utente
4. **Manutenibilità**: Logica centralizzata per l'identificazione del salone

## Funzionamento

### Identificazione del Salone
Il sistema utilizza la funzione `getSalonId()` che:

1. **Prima** cerca `salon_id` nella tabella `profiles` (per manager/titolari)
2. **Poi** cerca `salon_id` nella tabella `team` (per collaboratori)
3. **Restituisce** il `salon_id` trovato o `null` se non trovato

### Gestione Template Email
- Ogni salone può avere un template attivo per tipo (`confirmation`, `cancellation`, `modification`)
- I template sono condivisi tra tutti i membri del team del salone
- Quando si salva un nuovo template, il precedente viene disattivato

### Gestione Testi Personalizzabili
- Ogni salone può avere un testo attivo per chiave (es. `booking_confirmation_success`)
- I testi sono condivisi tra tutti i membri del team del salone
- Quando si salva un nuovo testo, il precedente viene disattivato

## Compatibilità

- **Backward Compatibility**: I dati esistenti vengono mantenuti
- **Migrazione Automatica**: I template e testi di default vengono creati automaticamente per ogni salone esistente
- **Fallback**: Se non viene trovato un template personalizzato, viene utilizzato il template di default

## Note Tecniche

- **Indici**: Mantenuti gli indici su `salon_id` per performance ottimali
- **Trigger**: Mantenuti i trigger per aggiornare `updated_at`
- **Constraints**: Aggiornati i constraint UNIQUE per utilizzare `salon_id`
- **API**: Tutte le API continuano a funzionare senza modifiche per il frontend 