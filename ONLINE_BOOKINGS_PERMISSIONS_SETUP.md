# Sistema di Permessi per Prenotazioni Online

## Panoramica

È stato implementato un sistema completo di permessi per gestire l'accesso alle funzionalità delle prenotazioni online. Questo sistema permette di controllare chi può visualizzare, gestire e modificare le prenotazioni ricevute dal sito web del salone.

## Permessi Implementati

### 1. `canViewOnlineBookings`
- **Descrizione**: Visualizza Prenotazioni Online
- **Funzionalità**: Permette di vedere la pagina delle prenotazioni online e la lista delle prenotazioni
- **Controllo**: Richiesto per accedere alla pagina principale delle prenotazioni online

### 2. `canManageOnlineBookings`
- **Descrizione**: Gestisci Prenotazioni Online
- **Funzionalità**: Permette di confermare, annullare e gestire le prenotazioni online
- **Controllo**: Richiesto per i pulsanti di conferma/annullamento delle prenotazioni

### 3. `canViewOnlineBookingDetails`
- **Descrizione**: Visualizza Dettagli Prenotazioni
- **Funzionalità**: Permette di vedere i dettagli completi delle prenotazioni online
- **Controllo**: Richiesto per aprire il modal con i dettagli della prenotazione

### 4. `canExportOnlineBookings`
- **Descrizione**: Esporta Prenotazioni Online
- **Funzionalità**: Permette di esportare i dati delle prenotazioni online
- **Controllo**: Per future funzionalità di esportazione

## File Modificati

### 1. `app/(dashboard)/(private)/crm/dashboard/Impostazioni/_component/Permessi.tsx`
- Aggiunta nuova sezione "Prenotazioni Online" nei gruppi di permessi
- Include tutti e 4 i nuovi permessi con descrizioni dettagliate

### 2. `app/(dashboard)/(private)/crm/dashboard/Impostazioni/usePermission.ts`
- Aggiunti i nuovi permessi negli array di permessi predefiniti
- I manager/titolari hanno automaticamente tutti i permessi attivi
- Gli altri utenti hanno tutti i permessi impostati a `false` di default

### 3. `app/(dashboard)/(private)/crm/dashboard/PrenotazioniOnline/page.tsx`
- Aggiunto controllo del permesso `canViewOnlineBookings` per l'accesso alla pagina
- Aggiunto controllo del permesso `canManageOnlineBookings` per i pulsanti di gestione
- Aggiunto controllo del permesso `canViewOnlineBookingDetails` per il modal dei dettagli
- Integrato il sistema di permessi con il componente mobile

### 4. `app/(dashboard)/(private)/crm/dashboard/PrenotazioniOnline/OnlineBookingsMobile.tsx`
- Aggiunto parametro `hasPermission` al componente
- Implementati controlli dei permessi per tutte le azioni
- I pulsanti di gestione e dettagli sono visibili solo se l'utente ha i permessi necessari

### 5. `app/(dashboard)/(private)/crm/dashboard/Impostazioni/_component/PaginaWeb.tsx`
- Aggiunto controllo del permesso `canEditSystemSettings` per l'accesso alla gestione della pagina web
- Questo garantisce che solo gli utenti autorizzati possano modificare le impostazioni del sito

## Come Utilizzare

### Per gli Amministratori (Manager/Titolari)

1. **Accedere alle Impostazioni**: Vai su Impostazioni > Permessi
2. **Selezionare un Membro del Team**: Scegli il membro del team dalla lista a sinistra
3. **Assegnare Permessi**: Nella sezione "Prenotazioni Online", attiva i permessi desiderati:
   - ✅ **Visualizza Prenotazioni Online**: Per vedere la lista
   - ✅ **Gestisci Prenotazioni Online**: Per confermare/annullare
   - ✅ **Visualizza Dettagli Prenotazioni**: Per vedere i dettagli completi
   - ✅ **Esporta Prenotazioni Online**: Per future funzionalità

### Per i Membri del Team

1. **Accesso Controllato**: Solo chi ha `canViewOnlineBookings` può vedere la pagina
2. **Azioni Limitate**: Le azioni sono disponibili solo se si hanno i permessi necessari
3. **Feedback Visivo**: Se non si hanno i permessi, viene mostrato un messaggio di accesso negato

## Sicurezza

### Controlli Implementati

1. **Controllo a Livello di Pagina**: Ogni pagina verifica i permessi prima di renderizzare
2. **Controllo a Livello di Componente**: I pulsanti e le azioni sono condizionali
3. **Controllo a Livello di Hook**: Il hook `usePermissions` gestisce la logica di autorizzazione
4. **Fallback Sicuro**: Se i permessi non sono definiti, l'accesso è negato

### Gestione degli Errori

- **Accesso Negato**: Pagina dedicata con messaggio chiaro e permesso richiesto
- **Loading States**: Indicatori di caricamento durante il controllo dei permessi
- **Errori di Rete**: Gestione graceful degli errori di connessione

## Database

### Struttura Permessi

I permessi sono memorizzati nella tabella `permissions` con la seguente struttura:
```sql
CREATE TABLE permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    permesso TEXT NOT NULL,
    valore BOOLEAN NOT NULL
);
```

### Nuovi Permessi

I nuovi permessi sono:
- `canViewOnlineBookings`
- `canManageOnlineBookings`
- `canViewOnlineBookingDetails`
- `canExportOnlineBookings`

## Test e Verifica

### Test da Eseguire

1. **Test Accesso Negato**: Verificare che utenti senza permessi vedano il messaggio di accesso negato
2. **Test Permessi Parziali**: Verificare che utenti con solo alcuni permessi vedano solo le funzionalità autorizzate
3. **Test Permessi Completi**: Verificare che utenti con tutti i permessi abbiano accesso completo
4. **Test Responsive**: Verificare che i controlli funzionino sia su desktop che mobile

### Scenari di Test

1. **Utente senza permessi**: Dovrebbe vedere "Accesso Negato"
2. **Utente con solo visualizzazione**: Dovrebbe vedere la lista ma non i pulsanti di gestione
3. **Utente con gestione**: Dovrebbe poter confermare/annullare ma non vedere i dettagli
4. **Manager/Titolare**: Dovrebbe avere accesso completo a tutto

## Manutenzione

### Aggiungere Nuovi Permessi

1. Aggiungere il nuovo permesso in `PERMISSION_GROUPS` in `Permessi.tsx`
2. Aggiungere il permesso negli array di default in `usePermission.ts`
3. Implementare i controlli nelle pagine/componenti necessari
4. Aggiornare la documentazione

### Modificare Permessi Esistenti

1. Modificare la descrizione in `PERMISSION_GROUPS`
2. Aggiornare i controlli nei componenti se necessario
3. Testare le modifiche

## Note Importanti

- I permessi sono ereditati automaticamente dai manager/titolari
- I permessi sono persistenti nel database
- I cambiamenti ai permessi sono immediati (no cache)
- Il sistema è scalabile per future funzionalità 