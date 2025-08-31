# Sistema Chat di Gruppo - Documentazione

## Panoramica
Sistema completo di chat di gruppo con funzionalità real-time utilizzando Supabase come database e sistema di autenticazione.

## Funzionalità Implementate

### 🗂️ Gestione Gruppi
- ✅ Creazione gruppi pubblici e privati
- ✅ Lista gruppi con ricerca
- ✅ Visualizzazione membri e ruoli
- ✅ Limite membri configurabile

### 💬 Sistema Messaggi
- ✅ Invio messaggi in tempo reale
- ✅ Risposta ai messaggi (reply)
- ✅ Modifica messaggi propri
- ✅ Eliminazione messaggi (admin/moderator)
- ✅ Reazioni emoji ai messaggi

### 👥 Gestione Utenti
- ✅ Ruoli: Admin, Moderator, Member
- ✅ Permessi basati sui ruoli
- ✅ Avatar e nome utente

### 🔔 Real-time
- ✅ Messaggi in tempo reale via Supabase
- ✅ Notifiche reazioni
- ✅ Aggiornamenti stato gruppo

## Struttura Database

### Tabelle Create
```sql
- chat_groups (gruppi di chat)
- chat_group_members (membri dei gruppi)
- chat_messages (messaggi)
- chat_message_reactions (reazioni)
- chat_message_reads (stato lettura)
```

### Sicurezza (RLS)
- Politiche Row Level Security implementate
- Accesso solo ai gruppi di cui si è membri
- Operazioni basate sui ruoli

## Installazione

### 1. Database Setup
Esegui lo script SQL in Supabase:
```bash
# Copia il contenuto di supabase/migrations/chat_system.sql
# e eseguilo nella console SQL di Supabase
```

### 2. Dipendenze (quando risolvi il problema spazio disco)
```bash
npm install socket.io socket.io-client react-markdown emoji-picker-react date-fns-tz
```

### 3. Componenti
I seguenti componenti sono stati creati:
- `ChatGroupCard` - Card per visualizzare i gruppi
- `ChatMessageItem` - Componente singolo messaggio
- `ChatInput` - Input per scrivere messaggi
- `CreateGroupDialog` - Dialog per creare gruppi

### 4. Servizi
- `chat-service.ts` - Servizio principale per API chat
- Gestione real-time con Supabase subscriptions

## Utilizzo

### Accesso alla Chat
Naviga su `/crm/dashboard/Chat` per accedere al sistema.

### Creare un Gruppo
1. Clicca il pulsante "+" nell'header
2. Compila nome, descrizione, privacy e limite membri
3. Conferma creazione

### Inviare Messaggi
1. Seleziona un gruppo
2. Scrivi nel campo di input
3. Premi Invio o clicca il pulsante invio

### Rispondere ai Messaggi
1. Clicca "Rispondi" su un messaggio
2. Scrivi la risposta
3. Invia normalmente

### Reazioni
1. Clicca "Emoji" su un messaggio
2. Seleziona l'emoji desiderata

## Prossimi Sviluppi

### Funzionalità da Aggiungere
- [ ] Upload file e immagini
- [ ] Notifiche push
- [ ] Ricerca nei messaggi
- [ ] Thread di conversazioni
- [ ] Status online/offline utenti
- [ ] Messaggi vocali
- [ ] Condivisione schermo
- [ ] Integrazione calendario per meeting

### Miglioramenti UX
- [ ] Tema dark/light
- [ ] Personalizzazione avatar gruppi
- [ ] Shortcut da tastiera
- [ ] Preview link
- [ ] Menzioni utenti (@username)

### Performance
- [ ] Lazy loading messaggi
- [ ] Cache messaggi locali
- [ ] Ottimizzazione mobile

## API Endpoints

### ChatService Methods
```typescript
// Gruppi
getGroups(): Promise<ChatGroup[]>
createGroup(group: Partial<ChatGroup>): Promise<ChatGroup>
joinGroup(groupId: string): Promise<void>
leaveGroup(groupId: string): Promise<void>

// Membri
getGroupMembers(groupId: string): Promise<ChatGroupMember[]>

// Messaggi
getMessages(groupId: string, limit?: number): Promise<ChatMessage[]>
sendMessage(groupId: string, content: string, replyTo?: string): Promise<ChatMessage>
editMessage(messageId: string, content: string): Promise<void>
deleteMessage(messageId: string): Promise<void>

// Reazioni
addReaction(messageId: string, emoji: string): Promise<void>
removeReaction(messageId: string, emoji: string): Promise<void>

// Real-time
subscribeToMessages(groupId: string, callback: Function)
subscribeToReactions(messageId: string, callback: Function)
```

## Troubleshooting

### Errori Comuni
1. **Errori di autenticazione**: Verifica che l'utente sia loggato
2. **Messaggi non in tempo reale**: Controlla le subscription Supabase
3. **Permessi negati**: Verifica le policy RLS

### Debug
- Controlla la console browser per errori
- Verifica le policy RLS in Supabase
- Controlla che le tabelle esistano

## Sicurezza

### Implementate
- Row Level Security (RLS)
- Autenticazione obbligatoria
- Validazione input
- Permessi basati sui ruoli

### Best Practices
- Non esporre mai chiavi service_role nel frontend
- Validare sempre input utente
- Limitare dimensioni messaggi
- Rate limiting per spam prevention

## Performance

### Ottimizzazioni Attuali
- Subscription real-time efficienti
- Limit query messaggi
- Lazy loading gruppi

### Metriche da Monitorare
- Tempo caricamento gruppi
- Latenza messaggi real-time
- Uso memoria browser
- Chiamate API duplicate

---

## Support
Per problemi o domande, controlla:
1. Log console browser
2. Log Supabase dashboard
3. Documentazione Supabase real-time
