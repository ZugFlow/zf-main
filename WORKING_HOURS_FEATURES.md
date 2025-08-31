# Sistema di Gestione Orari di Lavoro - Funzionalità Implementate

## Panoramica

Il sistema di gestione orari di lavoro è stato completamente rivisto e implementato con funzionalità avanzate per dipendenti e manager/titolari.

## Funzionalità per Dipendenti 👤

### Visualizzazione Orari
- **Orario settimanale fisso**: Visualizzazione del proprio orario settimanale con giorni lavorativi e orari
- **Modifiche straordinarie**: Visualizzazione di orari diversi per giorni specifici (extra, straordinari, festivi)
- **Giorni di chiusura/apertura extra**: Indicazione di aperture straordinarie o chiusure
- **Notifiche**: Ricezione di notifiche quando il proprio orario viene modificato

### Richieste (Facoltative)
- **Cambio turno**: Possibilità di richiedere un cambio di orario per un giorno specifico
- **Disponibilità extra**: Comunicazione di disponibilità per orari aggiuntivi
- **Stato richieste**: Tracciamento dello stato delle proprie richieste (in attesa, approvata, rifiutata)

## Funzionalità per Manager/Titolari 🧑‍💼

### Gestione Orari Settimanali
- **Impostazione orari fissi**: Configurazione dell'orario settimanale per ciascun dipendente
- **Duplicazione settimana**: Possibilità di duplicare la settimana corrente su quella successiva
- **Orari straordinari**: Creazione di orari speciali per aperture domenicali, festività, cambi turno
- **Pause fisse**: Inserimento di pause (es. pranzo) per ogni giorno lavorativo

### Visualizzazione e Monitoraggio
- **Vista settimanale**: Visualizzazione di tutti gli orari dei dipendenti in formato tabellare settimanale
- **Vista mensile**: Visualizzazione calendario mensile con sovrapposizione degli orari
- **Copertura salone**: Visualizzazione della disponibilità totale per giorno
- **Filtri avanzati**: Filtraggio per giorno, utente, ruolo o gruppo

### Controllo Prenotazioni
- **Blocco orari**: Possibilità di bloccare le prenotazioni fuori orario
- **Sincronizzazione calendario**: Integrazione con il sistema di prenotazioni esistente
- **Stato blocco**: Indicatore visivo dello stato di blocco/sblocco orari

### Gestione Richieste
- **Approvazione richieste**: Gestione delle richieste di cambio turno e disponibilità
- **Notifiche**: Sistema di notifiche per nuove richieste e modifiche
- **Storico**: Tracciamento di tutte le modifiche e richieste

## Struttura Dati

### Nuovi Tipi di Dati
```typescript
// Orario settimanale
interface WeeklySchedule {
  id: string;
  member_id: string;
  salon_id: string;
  week_start_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Orario giornaliero
interface DailySchedule {
  id: string;
  weekly_schedule_id: string;
  day_of_week: number; // 0 = domenica, 1 = lunedì, ..., 6 = sabato
  start_time: string;
  end_time: string;
  is_working_day: boolean;
  break_start?: string;
  break_end?: string;
  notes?: string;
}

// Orario straordinario
interface ExtraSchedule {
  id: string;
  member_id: string;
  salon_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'extra' | 'overtime' | 'holiday' | 'closing';
  reason?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// Richiesta cambio turno
interface ShiftRequest {
  id: string;
  member_id: string;
  salon_id: string;
  requested_date: string;
  current_start_time: string;
  current_end_time: string;
  requested_start_time: string;
  requested_end_time: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Richiesta disponibilità
interface AvailabilityRequest {
  id: string;
  member_id: string;
  salon_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'available' | 'unavailable';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Notifiche
interface ScheduleNotification {
  id: string;
  member_id: string;
  salon_id: string;
  type: 'schedule_change' | 'shift_request' | 'availability_request' | 'approval';
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}
```

## Componenti Implementati

### 1. OreLavorative.tsx
Componente principale per la gestione degli orari di lavoro con:
- Header con controlli principali
- Statistiche e metriche
- Tabella orari settimanali
- Sistema di notifiche
- Gestione richieste in sospeso
- Dialog per creazione/modifica orari

### 2. PermessiFerie.tsx
Componente per la gestione dei permessi e ferie con:
- Lista permessi con filtri
- Calendario mensile (solo manager)
- Bilanci ferie (solo manager)
- Gestione stati e approvazioni

### 3. Types.ts
Definizione completa di tutti i tipi di dati necessari per il sistema

## Funzionalità Avanzate

### Sistema di Notifiche
- Notifiche in tempo reale per modifiche orari
- Indicatori visivi per nuove notifiche
- Storico notifiche con stato letto/non letto

### Controllo Accessi
- Interfaccia limitata per dipendenti
- Funzionalità complete per manager
- Filtri automatici basati sui permessi

### Integrazione Database
- Struttura dati ottimizzata per Supabase
- Sottoscrizioni real-time per aggiornamenti
- Gestione errori e fallback

### UI/UX
- Design responsive e moderno
- Componenti riutilizzabili (Shadcn/UI)
- Feedback visivo per tutte le azioni
- Loading states e error handling

## Prossimi Sviluppi

### Funzionalità da Implementare
1. **Sincronizzazione calendario**: Integrazione completa con il sistema di prenotazioni
2. **Report avanzati**: Statistiche dettagliate e export dati
3. **Notifiche push**: Notifiche push per dispositivi mobili
4. **API REST**: Endpoint per integrazione con altri sistemi
5. **Backup automatico**: Sistema di backup degli orari

### Miglioramenti UI/UX
1. **Drag & Drop**: Modifica orari tramite drag & drop
2. **Timeline view**: Vista timeline per orari complessi
3. **Temi personalizzabili**: Temi per diversi tipi di business
4. **Accessibilità**: Miglioramenti per utenti con disabilità

## Note Tecniche

### Dipendenze
- `date-fns`: Gestione date e formattazione
- `lucide-react`: Icone
- `@radix-ui/react-*`: Componenti UI base
- `tailwindcss`: Styling

### Performance
- Lazy loading per componenti pesanti
- Ottimizzazione re-render con React.memo
- Debouncing per input di ricerca
- Virtualizzazione per liste lunghe

### Sicurezza
- Validazione input lato client e server
- Controllo accessi basato su ruoli
- Sanitizzazione dati per prevenire XSS
- Rate limiting per API calls 