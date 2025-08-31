# Installazione Sistema Ticket di Supporto

## Prerequisiti

- Database Supabase configurato
- Accesso admin al database
- Progetto Next.js con Supabase client configurato

## Passi di Installazione

### 1. Eseguire lo Script SQL

Copiare e eseguire il contenuto del file `support_tickets_table.sql` nel SQL Editor di Supabase:

```sql
-- Tabella per i ticket di supporto
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug_report', 'account', 'integration')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  internal_notes TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  last_user_response TIMESTAMP WITH TIME ZONE,
  last_admin_response TIMESTAMP WITH TIME ZONE
);

-- ... (resto dello script SQL)
```

### 2. Verificare l'Installazione

Eseguire queste query per verificare che tutto sia stato creato correttamente:

```sql
-- Verificare le tabelle
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('support_tickets', 'support_ticket_responses');

-- Verificare le policy RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('support_tickets', 'support_ticket_responses');

-- Verificare le funzioni
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_support_ticket_stats', 'get_tickets_with_latest_response');
```

### 3. Testare le Funzioni

```sql
-- Testare la funzione delle statistiche
SELECT * FROM get_support_ticket_stats();

-- Testare la funzione dei ticket
SELECT * FROM get_tickets_with_latest_response();
```

## Configurazione Frontend

### 1. Verificare i File Componenti

Assicurarsi che questi file siano presenti:

- `app/(dashboard)/(private)/crm/dashboard/Impostazioni/_component/SupportTickets.tsx`
- `support_tickets_table.sql`
- `SUPPORT_TICKET_SYSTEM_GUIDE.md`

### 2. Verificare le Dipendenze

Assicurarsi che queste dipendenze siano installate:

```bash
npm install date-fns sonner
```

### 3. Verificare le Importazioni

Controllare che le importazioni nel componente SupportTickets siano corrette:

```typescript
import { createClient } from "@/utils/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
```

## Test del Sistema

### 1. Test di Creazione Ticket

1. Accedere all'applicazione
2. Navigare su **Impostazioni** → **Supporto**
3. Cliccare su **"Nuovo Ticket"**
4. Compilare il form e creare un ticket
5. Verificare che il ticket appaia nella lista

### 2. Test delle Risposte

1. Aprire un ticket esistente
2. Aggiungere una risposta
3. Verificare che la risposta appaia nella conversazione

### 3. Test dei Filtri

1. Creare ticket con diverse priorità e categorie
2. Testare i filtri per stato, priorità e categoria
3. Verificare che la ricerca funzioni correttamente

## Troubleshooting

### Problemi Comuni

#### Errore: "relation does not exist"
```sql
-- Verificare che le tabelle esistano
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('support_tickets', 'support_ticket_responses');
```

#### Errore: "function does not exist"
```sql
-- Verificare che le funzioni esistano
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_support_ticket_stats', 'get_tickets_with_latest_response');
```

#### Errore: "permission denied"
```sql
-- Verificare le policy RLS
SELECT * FROM pg_policies 
WHERE tablename IN ('support_tickets', 'support_ticket_responses');
```

#### Ticket non visibili
- Verificare che l'utente sia autenticato
- Controllare le policy RLS
- Verificare i permessi dell'utente

### Log di Debug

Aggiungere questi log per il debug:

```typescript
// Nel componente SupportTickets.tsx
console.log('User session:', session);
console.log('Tickets data:', tickets);
console.log('Stats data:', stats);
```

## Verifica Finale

### Checklist di Installazione

- [ ] Tabelle create correttamente
- [ ] Policy RLS configurate
- [ ] Funzioni Supabase create
- [ ] Componente frontend integrato
- [ ] Tab "Supporto" visibile nelle impostazioni
- [ ] Creazione ticket funzionante
- [ ] Sistema di risposte funzionante
- [ ] Filtri e ricerca funzionanti
- [ ] Statistiche visualizzate correttamente

### Test di Performance

```sql
-- Verificare le performance delle query
EXPLAIN ANALYZE SELECT * FROM get_support_ticket_stats();

EXPLAIN ANALYZE SELECT * FROM get_tickets_with_latest_response();
```

## Configurazione Avanzata

### Personalizzazione Categorie

Per aggiungere nuove categorie:

```sql
-- Aggiungere nuova categoria
ALTER TABLE support_tickets 
DROP CONSTRAINT support_tickets_category_check;

ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_category_check 
CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug_report', 'account', 'integration', 'nuova_categoria'));
```

### Personalizzazione Priorità

Per modificare le priorità:

```sql
-- Modificare le priorità disponibili
ALTER TABLE support_tickets 
DROP CONSTRAINT support_tickets_priority_check;

ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'nuova_priorita'));
```

## Supporto

Per problemi di installazione o configurazione:

1. Controllare i log della console del browser
2. Verificare i log di Supabase
3. Controllare la documentazione completa in `SUPPORT_TICKET_SYSTEM_GUIDE.md`
4. Verificare che tutti i file siano stati copiati correttamente

---

**Nota**: Dopo l'installazione, testare sempre il sistema in un ambiente di sviluppo prima del deploy in produzione.
