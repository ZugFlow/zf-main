# Sistema di Ticket di Supporto - Guida Completa

## Panoramica

Il sistema di ticket di supporto permette agli utenti di creare e gestire richieste di assistenza tecnica direttamente dall'applicazione. Il sistema è completamente integrato con Supabase e non è legato al `salon_id`, permettendo richieste di supporto globali.

## Caratteristiche Principali

### 🎯 Funzionalità Utente
- **Creazione Ticket**: Form intuitivo per creare nuove richieste
- **Sistema di Priorità**: 4 livelli (Bassa, Media, Alta, Urgente)
- **Categorie**: 7 categorie predefinite per organizzare le richieste
- **Conversazioni**: Sistema di risposte in tempo reale
- **Filtri Avanzati**: Ricerca e filtri per stato, priorità e categoria
- **Statistiche**: Dashboard con metriche dei ticket

### 🔧 Funzionalità Tecniche
- **Database Supabase**: Tabelle ottimizzate con indici
- **Row Level Security (RLS)**: Sicurezza a livello di riga
- **Real-time Updates**: Aggiornamenti in tempo reale
- **Responsive Design**: Interfaccia ottimizzata per mobile
- **Multilingua**: Supporto per localizzazione

## Struttura Database

### Tabella `support_tickets`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> auth.users)
- user_email: TEXT
- user_name: TEXT
- subject: TEXT
- description: TEXT
- priority: ENUM ('low', 'medium', 'high', 'urgent')
- status: ENUM ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed')
- category: ENUM ('general', 'technical', 'billing', 'feature_request', 'bug_report', 'account', 'integration')
- assigned_to: UUID (Foreign Key -> auth.users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- resolved_at: TIMESTAMP
- closed_at: TIMESTAMP
- internal_notes: TEXT
- user_rating: INTEGER (1-5)
- user_feedback: TEXT
- tags: TEXT[]
- attachments: JSONB
- last_user_response: TIMESTAMP
- last_admin_response: TIMESTAMP
```

### Tabella `support_ticket_responses`
```sql
- id: UUID (Primary Key)
- ticket_id: UUID (Foreign Key -> support_tickets)
- user_id: UUID (Foreign Key -> auth.users)
- is_admin: BOOLEAN
- message: TEXT
- created_at: TIMESTAMP
- attachments: JSONB
- internal: BOOLEAN
```

## Installazione

### 1. Eseguire lo Script SQL
```bash
# Eseguire il file support_tickets_table.sql nel database Supabase
```

### 2. Verificare le Tabelle
```sql
-- Verificare che le tabelle siano state create
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('support_tickets', 'support_ticket_responses');

-- Verificare le policy RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('support_tickets', 'support_ticket_responses');
```

## Utilizzo

### Accesso al Sistema
1. Navigare su **Impostazioni** nel dashboard
2. Selezionare la tab **Supporto**
3. Il sistema è accessibile a tutti gli utenti con permessi di sistema

### Creazione di un Ticket
1. Cliccare su **"Nuovo Ticket"** (pulsante flottante)
2. Compilare i campi:
   - **Oggetto**: Breve descrizione del problema
   - **Priorità**: Selezionare il livello di urgenza
   - **Categoria**: Scegliere la categoria appropriata
   - **Descrizione**: Dettagli completi del problema
3. Cliccare su **"Crea Ticket"**

### Gestione dei Ticket
- **Visualizzazione**: Lista con filtri e ricerca
- **Conversazione**: Aggiungere risposte ai ticket aperti
- **Stati**: I ticket cambiano stato automaticamente
- **Notifiche**: Sistema di notifiche per aggiornamenti

## Categorie Disponibili

| Categoria | Descrizione | Icona |
|-----------|-------------|-------|
| **Generale** | Richieste generali di supporto | HelpCircle |
| **Tecnico** | Problemi tecnici e bug | FileText |
| **Fatturazione** | Questioni di pagamento e fatturazione | Tag |
| **Richiesta Funzionalità** | Suggerimenti per nuove funzionalità | Star |
| **Segnalazione Bug** | Report di bug e problemi | AlertCircle |
| **Account** | Gestione account e accessi | User |
| **Integrazione** | Problemi con integrazioni esterne | MessageSquare |

## Priorità

| Priorità | Colore | Descrizione |
|----------|--------|-------------|
| **Bassa** | Grigio | Richieste non urgenti |
| **Media** | Blu | Richieste standard |
| **Alta** | Arancione | Richieste importanti |
| **Urgente** | Rosso | Richieste critiche |

## Stati dei Ticket

| Stato | Descrizione | Azione |
|-------|-------------|--------|
| **Aperto** | Ticket appena creato | In attesa di risposta |
| **In Lavorazione** | Ticket assegnato al supporto | In fase di risoluzione |
| **In Attesa Utente** | Richiesta di informazioni all'utente | Attesa risposta utente |
| **Risolto** | Problema risolto | Ticket completato |
| **Chiuso** | Ticket archiviato | Non più attivo |

## API e Funzioni

### Funzioni Supabase
```sql
-- Statistiche dei ticket
get_support_ticket_stats(user_uuid UUID DEFAULT NULL)

-- Ticket con ultime risposte
get_tickets_with_latest_response(user_uuid UUID DEFAULT NULL)
```

### Esempi di Utilizzo
```typescript
// Creare un nuovo ticket
const { data, error } = await supabase
  .from('support_tickets')
  .insert({
    user_id: user.id,
    user_email: user.email,
    user_name: profile?.full_name || 'Utente',
    subject: 'Problema con il calendario',
    description: 'Il calendario non si aggiorna correttamente...',
    priority: 'high',
    category: 'technical'
  });

// Aggiungere una risposta
const { error } = await supabase
  .from('support_ticket_responses')
  .insert({
    ticket_id: ticketId,
    user_id: user.id,
    message: 'Risposta dell\'utente...',
    is_admin: false
  });
```

## Sicurezza

### Row Level Security (RLS)
- **Utenti**: Vedono solo i propri ticket
- **Admin**: Accesso completo a tutti i ticket
- **Risposte**: Controllo accesso basato sui ticket

### Policy Implementate
```sql
-- Policy per support_tickets
"Users can view their own tickets"
"Users can create their own tickets"
"Users can update their own tickets"
"Admins can view all tickets"

-- Policy per support_ticket_responses
"Users can view responses to their tickets"
"Users can create responses to their tickets"
"Admins can view all responses"
```

## Personalizzazione

### Aggiungere Nuove Categorie
1. Modificare l'ENUM nel database:
```sql
ALTER TYPE ticket_category ADD VALUE 'nuova_categoria';
```

2. Aggiornare il componente TypeScript:
```typescript
type TicketCategory = 'general' | 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'account' | 'integration' | 'nuova_categoria';
```

### Modificare i Colori
```typescript
const priorityColors = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200"
};
```

## Monitoraggio e Analytics

### Metriche Disponibili
- **Totale Ticket**: Numero complessivo di ticket
- **Ticket Aperti**: Ticket in stato "open"
- **Ticket Urgenti**: Ticket con priorità "urgent"
- **Ticket Risolti**: Ticket in stato "resolved"

### Query Utili
```sql
-- Ticket per categoria
SELECT category, COUNT(*) as count 
FROM support_tickets 
GROUP BY category;

-- Tempo medio di risoluzione
SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
FROM support_tickets 
WHERE resolved_at IS NOT NULL;

-- Ticket per priorità
SELECT priority, COUNT(*) as count 
FROM support_tickets 
GROUP BY priority;
```

## Troubleshooting

### Problemi Comuni

#### 1. Ticket non visibili
- Verificare le policy RLS
- Controllare che l'utente sia autenticato
- Verificare i permessi dell'utente

#### 2. Errori di creazione
- Controllare che tutti i campi obbligatori siano compilati
- Verificare la connessione a Supabase
- Controllare i log per errori specifici

#### 3. Risposte non salvate
- Verificare che il ticket esista
- Controllare i permessi per le risposte
- Verificare la validazione dei dati

### Log e Debug
```typescript
// Abilitare il debug
console.log('Ticket creation:', { data, error });
console.log('User permissions:', { hasPermission, userRole });
```

## Supporto e Manutenzione

### Backup
- Le tabelle sono incluse nel backup automatico di Supabase
- Considerare backup manuali per dati critici

### Aggiornamenti
- Monitorare le performance delle query
- Aggiornare gli indici se necessario
- Verificare le policy RLS dopo modifiche

### Performance
- Gli indici sono ottimizzati per le query più comuni
- Considerare la paginazione per grandi volumi di dati
- Monitorare l'uso delle risorse Supabase

## Roadmap Futura

### Funzionalità Pianificate
- [ ] Sistema di notifiche email
- [ ] Upload di allegati
- [ ] Sistema di rating e feedback
- [ ] Integrazione con sistemi esterni
- [ ] Dashboard admin avanzata
- [ ] Report e analytics dettagliati
- [ ] Sistema di template per risposte
- [ ] Integrazione con chat in tempo reale

### Miglioramenti Tecnici
- [ ] Ottimizzazione delle query
- [ ] Cache intelligente
- [ ] Webhook per integrazioni
- [ ] API REST completa
- [ ] Sistema di backup automatico
- [ ] Monitoraggio avanzato

---

**Nota**: Questo sistema è progettato per essere scalabile e facilmente estendibile. Per qualsiasi modifica o personalizzazione, consultare la documentazione tecnica e testare in ambiente di sviluppo prima del deploy in produzione.
