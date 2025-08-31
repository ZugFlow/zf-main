# Risoluzione Problemi Chat Real-Time

## Problemi Comuni e Soluzioni

### 1. La chat non è in tempo reale

**Cause possibili:**
- Real-Time non abilitato nel dashboard Supabase
- Errori nelle subscription
- Problemi di autenticazione
- Filtri malformati nelle subscription

**Soluzioni:**

#### A. Abilita Real-Time nel Dashboard Supabase
1. Vai su [dashboard.supabase.com](https://dashboard.supabase.com)
2. Seleziona il tuo progetto
3. Vai su **Database > Replication**
4. Abilita Real-time per le tabelle:
   - `chat_messages`
   - `direct_messages`
   - `team_members`

#### B. Verifica le Subscription nel Codice
```typescript
// ✅ Subscription corretta
const channel = supabase
  .channel('unique_channel_name')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `group_id=eq.${groupId}`
  }, (payload) => {
    console.log('New message:', payload)
  })
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// ❌ Subscription errata (filtro complesso)
// Evita filtri OR complessi che possono non funzionare
```

#### C. Verifica Autenticazione
```typescript
// Assicurati che l'utente sia autenticato
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  console.error('User not authenticated')
  return
}
```

### 2. Messaggi duplicati

**Causa:** Subscription multiple o mancanza di controllo duplicati

**Soluzione:**
```typescript
// ✅ Controlla duplicati quando aggiungi messaggi
setMessages(prev => {
  if (prev.some(msg => msg.id === newMessage.id)) {
    return prev // Evita duplicato
  }
  return [...prev, newMessage]
})
```

### 3. Subscription non si disconnettono

**Causa:** Mancanza di cleanup

**Soluzione:**
```typescript
useEffect(() => {
  const subscription = supabase.channel('...')
  
  return () => {
    subscription.unsubscribe() // ✅ Cleanup obbligatorio
  }
}, [dependencies])
```

### 4. RLS (Row Level Security) blocca i messaggi

**Verifica le policy RLS:**
```sql
-- Verifica che le policy permettano le operazioni
SELECT * FROM pg_policies WHERE tablename = 'direct_messages';

-- Policy corretta per leggere messaggi diretti
CREATE POLICY "Users can view their direct messages" ON direct_messages
    FOR SELECT USING (
        sender_id = auth.uid()::UUID OR 
        recipient_id = auth.uid()::UUID
    );
```

## Debug Step-by-Step

### 1. Verifica Console Browser
Apri DevTools > Console e cerca:
- ✅ "📡 Subscription status: SUBSCRIBED"
- ✅ "📨 New message received:"
- ❌ Errori di connessione o autenticazione

### 2. Test Manuale Database
```sql
-- Test inserimento messaggio diretto
INSERT INTO direct_messages (sender_id, recipient_id, content)
VALUES ('user1-id', 'user2-id', 'Test message');

-- Verifica che appaia in real-time nella chat
```

### 3. Verifica Network Tab
- Controlla WebSocket connection a Supabase
- Verifica che non ci siano errori 403/401

### 4. Test con Script di Verifica
```bash
# Esegui lo script di verifica
node check_realtime.js
```

## Configurazione Consigliata

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Subscription Pattern
```typescript
// Pattern consigliato per subscription
const subscribeToMessages = () => {
  // Cleanup precedente
  if (subscription.current) {
    subscription.current.unsubscribe()
  }
  
  // Nuova subscription con logging
  subscription.current = supabase
    .channel('unique_name')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, (payload) => {
      console.log('📨 New message:', payload)
      // Gestisci nuovo messaggio
    })
    .subscribe((status) => {
      console.log('📡 Status:', status)
    })
}
```

## Troubleshooting Avanzato

### Verifica tabelle Real-Time abilitate
```sql
-- Query per verificare tabelle con Real-Time abilitato
SELECT schemaname, tablename, realtime
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### Test connessione Real-Time
```javascript
// Test base connessione
const testConnection = () => {
  const channel = supabase.channel('test')
  
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Real-Time connesso')
    } else {
      console.log('❌ Problema connessione:', status)
    }
  })
}
```

### Monitoraggio Performance
```typescript
// Aggiungi timestamp per monitorare latenza
const onMessage = (payload) => {
  const latency = Date.now() - new Date(payload.new.created_at).getTime()
  console.log(`📊 Latency: ${latency}ms`)
}
```

## Contatti e Supporto

Se i problemi persistono:
1. Verifica la documentazione Supabase Real-Time
2. Controlla lo stato dei servizi Supabase
3. Considera l'upgrade del piano Supabase se hai limiti di connessioni Real-Time
