# Sistema Chat Dirette e Gruppi - Documentazione

## Panoramica
Il sistema chat integrato permette sia chat di gruppo che chat private 1-a-1 tra membri del team, accessibile tramite un modal dall'helper degli appuntamenti.

## Funzionalità Implementate

### ✅ Chat Gruppi
- Visualizzazione gruppi esistenti
- Creazione nuovi gruppi
- Messaggi in tempo reale
- Gestione membri
- Filtri per tipo gruppo (pubblico/privato)
- Ricerca gruppi

### ✅ Chat Dirette (1-a-1)
- Lista membri del team disponibili
- Chat private tra due utenti
- Messaggi in tempo reale
- Indicatori di presenza online
- Cronologia messaggi

### ✅ Interfaccia Unificata
- Modal responsive con tab per gruppi e chat dirette
- Interfaccia consistente per entrambi i tipi di chat
- Barra di ricerca intelligente
- Indicatori visivi per tipo di conversazione

## Struttura File

### Frontend Components
- `components/chat/ChatGroupsModal.tsx` - Modal principale per chat
- `components/chat/ChatMessageItem.tsx` - Componente messaggio (riutilizzato)
- `components/chat/ChatInput.tsx` - Input messaggi (riutilizzato)
- `components/chat/CreateGroupDialog.tsx` - Dialog creazione gruppi

### Helper Integration
- `app/(dashboard)/(private)/crm/dashboard/Appuntamenti/helper.tsx` - Pulsante per aprire chat

### Database
- `direct_messages_table.sql` - Tabella per messaggi diretti
- Tabelle esistenti chat gruppi (già implementate)

## Database Schema

### Tabella `direct_messages`
```sql
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY,
    sender_id UUID REFERENCES team_members(id),
    recipient_id UUID REFERENCES team_members(id),
    content TEXT NOT NULL,
    reply_to UUID REFERENCES direct_messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indici per Performance
- `idx_direct_messages_sender_recipient`
- `idx_direct_messages_recipient_sender`
- `idx_direct_messages_created_at`

### Row Level Security (RLS)
- Gli utenti possono vedere solo i propri messaggi (inviati o ricevuti)
- Gli utenti possono modificare/eliminare solo i propri messaggi inviati

## Funzionalità Real-time

### Chat Gruppi
- Subscription tramite `chatService.subscribeToMessages()`
- Notifiche in tempo reale per nuovi messaggi

### Chat Dirette
- Subscription Supabase per inserimenti in `direct_messages`
- Filtro automatico per conversazione corrente
- Aggiornamento automatico dell'interfaccia

## Interfaccia Utente

### Modal Layout
```
┌─────────────────────────────────────────────────────┐
│ Chat                                          [X]   │
├─────────────────────────────────────────────────────┤
│ [Gruppi] [Chat Dirette]                             │
├─────────────────────────────────────────────────────┤
│ Sidebar (Lista)    │ Area Conversazione             │
│                    │                                │
│ • Gruppo 1         │ ┌─ Header Conversazione ─┐     │
│ • Gruppo 2         │ │ Nome + Status           │     │
│ • User A           │ ├─ Messaggi ─────────────┤     │
│ • User B           │ │ Msg 1                   │     │
│                    │ │ Msg 2                   │     │
│                    │ └─ Input Messaggio ──────┘     │
└─────────────────────────────────────────────────────┘
```

### Tab System
- **Gruppi**: Mostra gruppi chat esistenti con filtri
- **Chat Dirette**: Mostra membri del team per chat 1-a-1

### Indicatori Visivi
- **Gruppi**: Badge blu, icona gruppo
- **Chat Dirette**: Badge verde, indicatori online
- **Stato Online**: Pallino verde per utenti attivi

## Sicurezza

### Autenticazione
- Controllo utente autenticato prima di caricare dati
- Validazione ID utente per tutte le operazioni

### Autorizzazione
- Messaggi diretti: solo mittente e destinatario
- Gruppi: membri del gruppo tramite chat-service esistente
- RLS policy per isolamento dati

### Validazione Input
- Content non vuoto
- Controllo utenti diversi per chat dirette
- Sanificazione contenuto messaggi

## Performance

### Ottimizzazioni Query
- Indici ottimizzati per pattern di accesso
- Query separate per metadata utenti
- Lazy loading messaggi

### Real-time Efficiency
- Subscription mirate alla conversazione attiva
- Cleanup automatico subscription non utilizzate
- Batching updates per performance

## Testing

### Scenari da Testare
1. **Chat Gruppi**
   - Invio/ricezione messaggi in gruppo
   - Creazione nuovi gruppi
   - Gestione membri

2. **Chat Dirette**
   - Invio messaggio a utente specifico
   - Ricezione messaggi in tempo reale
   - Cronologia conversazioni

3. **Switching**
   - Cambio tra gruppi e chat dirette
   - Mantenimento stato conversazioni
   - Cleanup subscription

## Deployment

### Prerequisiti
- Tabella `direct_messages` creata in database
- RLS policies applicate
- Componenti chat esistenti funzionanti

### Setup Steps
1. Eseguire `direct_messages_table.sql` su database
2. Verificare permissions team_members
3. Testare funzionalità in ambiente development
4. Deploy componenti frontend

## Monitoraggio

### Metriche Chiave
- Messaggi inviati/ricevuti per tipo
- Latenza real-time updates
- Errori subscription/invio messaggi
- Utilizzo storage messaggi

### Log Events
- Creazione nuove conversazioni
- Errori invio messaggi
- Performance query messaggi

## Future Enhancements

### Possibili Miglioramenti
- Notifiche push per messaggi
- Indicatori di lettura messaggi
- Condivisione file in chat dirette
- Emoji reactions per messaggi diretti
- Ricerca full-text nei messaggi
- Archiviazione conversazioni

### Integrazione Avanzata
- Integrazione con calendario per scheduling
- Collegamenti rapidi a clienti/appuntamenti
- Template messaggi predefiniti
- Automazioni chat basate su eventi
