# Pannello Admin Ticket di Supporto - Guida Completa

## Panoramica

Il pannello admin per i ticket di supporto è una pagina dedicata e protetta che permette agli amministratori di gestire tutti i ticket di supporto degli utenti. Questa pagina è completamente separata dal menu delle impostazioni degli utenti e accessibile solo agli amministratori.

## Accesso al Pannello

### Metodo 1: Pulsante nel Navbar
- **Visibilità**: Solo per utenti con ruolo `admin`
- **Posizione**: Navbar principale (lato destro)
- **Icona**: Help (viola)
- **Testo**: "Support Admin"
- **URL**: `/dashboard/admin/support-tickets`

### Metodo 2: Accesso Diretto
- Navigare direttamente a: `https://tuodominio.com/dashboard/admin/support-tickets`
- Se non sei admin, verrai reindirizzato al dashboard principale

## Sicurezza e Permessi

### Controllo Accesso
- **Verifica Ruolo**: Solo utenti con `role = 'admin'` nella tabella `profiles`
- **Reindirizzamento**: Utenti non autorizzati vengono reindirizzati al dashboard
- **Messaggio di Errore**: Toast notification per accesso negato

### Protezioni Implementate
```typescript
// Verifica automatica del ruolo admin
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin') {
  toast.error("Accesso negato. Solo gli amministratori possono accedere a questa pagina.");
  router.push('/dashboard');
  return;
}
```

## Funzionalità del Pannello

### 📊 Dashboard Statistiche
- **Totale Ticket**: Numero complessivo di ticket
- **Ticket Aperti**: Ticket in stato "open"
- **Ticket Urgenti**: Ticket con priorità "urgent"
- **Ticket Risolti**: Ticket in stato "resolved"

### 🔍 Filtri e Ricerca
- **Ricerca Testuale**: Per oggetto, descrizione, nome utente, email
- **Filtro per Stato**: Aperti, In Lavorazione, In Attesa, Risolti, Chiusi
- **Filtro per Priorità**: Bassa, Media, Alta, Urgente
- **Filtro per Categoria**: Generale, Tecnico, Fatturazione, ecc.

### 📋 Gestione Ticket

#### Visualizzazione Ticket
- **Lista Completa**: Tutti i ticket di tutti gli utenti
- **Informazioni Utente**: Nome, email, data creazione
- **Stato e Priorità**: Badge colorati per identificazione rapida
- **Contatore Risposte**: Numero di messaggi nel ticket

#### Azioni sui Ticket

##### 1. Cambio Stato
- **Stati Disponibili**:
  - `open` → Aperto
  - `in_progress` → In Lavorazione
  - `waiting_for_user` → In Attesa Utente
  - `resolved` → Risolto
  - `closed` → Chiuso

- **Aggiornamento Automatico**:
  - `resolved_at`: Impostato quando stato = "resolved"
  - `closed_at`: Impostato quando stato = "closed"

##### 2. Risposta ai Ticket
- **Interfaccia Chat**: Conversazione in tempo reale
- **Identificazione**: Risposte admin in viola, utenti in grigio
- **Aggiornamento Automatico**: Stato cambia da "waiting_for_user" a "in_progress"

##### 3. Eliminazione Ticket
- **Conferma**: Dialog di conferma per evitare eliminazioni accidentali
- **Cascata**: Elimina prima le risposte, poi il ticket
- **Irreversibile**: L'azione non può essere annullata

### 📝 Note Interne
- **Campo Dedicato**: Per note private del team di supporto
- **Non Visibili**: Gli utenti non vedono queste note
- **Utilità**: Per coordinamento interno e informazioni aggiuntive

## Interfaccia Utente

### Layout Responsive
- **Desktop**: Layout a 3 colonne (dettagli + azioni + conversazione)
- **Mobile**: Layout a colonna singola con scroll
- **Dialog**: Modal a schermo intero per gestione ticket

### Design System
- **Colori Admin**: Viola per identificare le azioni amministrative
- **Badge Colorati**: Sistema di colori per stati e priorità
- **Icone**: Icone intuitive per ogni categoria e azione

## Workflow Tipico

### 1. Monitoraggio Ticket
1. Accedere al pannello admin
2. Controllare le statistiche generali
3. Filtrare per ticket urgenti o aperti
4. Ordinare per data di creazione

### 2. Gestione Ticket
1. Cliccare su un ticket per aprirlo
2. Leggere la descrizione e le risposte precedenti
3. Cambiare lo stato se necessario
4. Aggiungere una risposta
5. Aggiungere note interne se utile

### 3. Risoluzione Ticket
1. Verificare che il problema sia risolto
2. Cambiare stato in "resolved"
3. Inviare messaggio di conferma all'utente
4. Chiudere il ticket se necessario

## API e Database

### Query Principali
```sql
-- Tutti i ticket (admin)
SELECT * FROM get_tickets_with_latest_response(NULL);

-- Statistiche globali (admin)
SELECT * FROM get_support_ticket_stats(NULL);

-- Risposte con nomi utenti
SELECT str.*, p.full_name 
FROM support_ticket_responses str
LEFT JOIN profiles p ON str.user_id = p.id
WHERE str.ticket_id = $1
ORDER BY str.created_at ASC;
```

### Aggiornamenti
```sql
-- Cambio stato
UPDATE support_tickets 
SET status = $1, 
    resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE NULL END,
    closed_at = CASE WHEN $1 = 'closed' THEN NOW() ELSE NULL END
WHERE id = $2;

-- Aggiunta risposta admin
INSERT INTO support_ticket_responses (ticket_id, user_id, message, is_admin)
VALUES ($1, $2, $3, true);
```

## Best Practices

### Gestione Efficiente
1. **Priorità**: Gestire sempre prima i ticket urgenti
2. **Comunicazione**: Rispondere sempre in modo professionale
3. **Stati**: Aggiornare gli stati per mantenere tracciabilità
4. **Note**: Usare le note interne per coordinamento team

### Sicurezza
1. **Verifica Ruolo**: Controllare sempre i permessi
2. **Log**: Monitorare le azioni amministrative
3. **Backup**: Mantenere backup dei ticket importanti
4. **Privacy**: Non condividere informazioni sensibili

### Performance
1. **Filtri**: Usare i filtri per ridurre il carico
2. **Paginazione**: Considerare paginazione per grandi volumi
3. **Cache**: Implementare cache per query frequenti
4. **Indici**: Mantenere indici ottimizzati

## Troubleshooting

### Problemi Comuni

#### Ticket non visibili
```sql
-- Verificare che l'utente sia admin
SELECT role FROM profiles WHERE id = 'user_id';

-- Verificare che esistano ticket
SELECT COUNT(*) FROM support_tickets;
```

#### Errori di permesso
```sql
-- Verificare le policy RLS
SELECT * FROM pg_policies 
WHERE tablename IN ('support_tickets', 'support_ticket_responses');
```

#### Problemi di aggiornamento
```sql
-- Verificare i trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%support_tickets%';
```

### Log di Debug
```typescript
// Abilitare debug nel pannello admin
console.log('Admin access check:', { userRole, isAdmin });
console.log('Tickets data:', tickets);
console.log('Selected ticket:', selectedTicket);
```

## Configurazione Avanzata

### Personalizzazione Stati
```sql
-- Aggiungere nuovi stati
ALTER TABLE support_tickets 
DROP CONSTRAINT support_tickets_status_check;

ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_status_check 
CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed', 'nuovo_stato'));
```

### Personalizzazione Priorità
```sql
-- Aggiungere nuove priorità
ALTER TABLE support_tickets 
DROP CONSTRAINT support_tickets_priority_check;

ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'nuova_priorita'));
```

### Notifiche Email
```typescript
// Implementare notifiche per nuovi ticket
const sendTicketNotification = async (ticket) => {
  // Logica per inviare email agli admin
  // quando viene creato un nuovo ticket
};
```

## Monitoraggio e Analytics

### Metriche Importanti
- **Tempo di Risposta**: Tempo medio per la prima risposta
- **Tempo di Risoluzione**: Tempo medio per risolvere un ticket
- **Soddisfazione**: Rating degli utenti (se implementato)
- **Volume**: Numero di ticket per periodo

### Query Analytics
```sql
-- Tempo medio di risposta
SELECT AVG(EXTRACT(EPOCH FROM (first_response - created_at))/3600) as avg_response_hours
FROM (
  SELECT 
    st.id,
    st.created_at,
    MIN(str.created_at) as first_response
  FROM support_tickets st
  LEFT JOIN support_ticket_responses str ON st.id = str.ticket_id AND str.is_admin = true
  GROUP BY st.id, st.created_at
) subquery;

-- Ticket per categoria
SELECT category, COUNT(*) as count 
FROM support_tickets 
GROUP BY category 
ORDER BY count DESC;
```

## Roadmap Futura

### Funzionalità Pianificate
- [ ] Sistema di notifiche push per nuovi ticket
- [ ] Template di risposta predefiniti
- [ ] Sistema di assegnazione ticket a specifici admin
- [ ] Report e analytics avanzati
- [ ] Integrazione con sistemi esterni (Slack, Teams)
- [ ] Sistema di rating e feedback
- [ ] Upload di allegati
- [ ] Chat in tempo reale

### Miglioramenti Tecnici
- [ ] Cache intelligente per performance
- [ ] Webhook per integrazioni
- [ ] API REST completa
- [ ] Sistema di backup automatico
- [ ] Monitoraggio avanzato delle performance
- [ ] Sistema di audit log completo

---

**Nota**: Questo pannello è progettato per essere scalabile e sicuro. Per qualsiasi modifica o personalizzazione, consultare la documentazione tecnica e testare in ambiente di sviluppo prima del deploy in produzione.
