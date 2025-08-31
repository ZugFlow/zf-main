# Funzioni SQL per Pagine Web Saloni

## Panoramica

Questo documento descrive le funzioni SQL create per gestire le pagine web dei saloni nel sistema Zugflow. Tutte le funzioni sono progettate per lavorare correttamente con la relazione `profiles.salon_id` e garantire la sicurezza e l'isolamento dei dati.

## File SQL Principali

### 1. `create_salon_web_pages_fixed.sql`
File principale che contiene:
- Estensione della tabella `salon` con colonne web
- Tabelle correlate con vincoli di integrità referenziale
- Indici per ottimizzare le performance
- Trigger per aggiornamento automatico timestamp
- Funzioni principali per la gestione delle pagine web

### 2. `test_salon_web_functions.sql`
File di test che verifica:
- Corretta creazione di tabelle e colonne
- Funzionamento delle funzioni utility
- Gestione delle autorizzazioni
- Gestione degli errori
- Presenza di indici e trigger

## Funzioni Principali

### 🔧 `enable_salon_web_page(p_user_id, p_salon_id, p_web_title, p_web_description)`

**Scopo**: Abilita la pagina web di un salone con verifica delle autorizzazioni.

**Parametri**:
- `p_user_id` (UUID): ID dell'utente che richiede l'abilitazione
- `p_salon_id` (UUID): ID del salone da abilitare
- `p_web_title` (TEXT, opzionale): Titolo della pagina web
- `p_web_description` (TEXT, opzionale): Descrizione della pagina web

**Controlli di Sicurezza**:
1. Verifica che l'utente esista in `profiles`
2. Verifica che `profiles.salon_id` corrisponda al `p_salon_id`
3. Verifica che il salone esista
4. Verifica che la pagina web non sia già abilitata

**Ritorna**:
```json
{
  "success": true,
  "subdomain": "salone-bellezza-roma",
  "web_url": "https://salone-bellezza-roma.zugflow.com",
  "message": "Pagina web abilitata con successo"
}
```

**Esempio di Utilizzo**:
```sql
SELECT enable_salon_web_page(
  'user-uuid-here',
  'salon-uuid-here',
  'Salone Bellezza Roma',
  'Il tuo salone di fiducia a Roma'
);
```

### 🔧 `disable_salon_web_page(p_user_id, p_salon_id)`

**Scopo**: Disabilita la pagina web di un salone.

**Parametri**:
- `p_user_id` (UUID): ID dell'utente che richiede la disabilitazione
- `p_salon_id` (UUID): ID del salone da disabilitare

**Controlli di Sicurezza**:
1. Verifica autorizzazione utente tramite `profiles.salon_id`
2. Verifica esistenza del salone

**Ritorna**:
```json
{
  "success": true,
  "message": "Pagina web disabilitata con successo"
}
```

### 🔧 `update_salon_web_settings(p_user_id, p_salon_id, p_settings)`

**Scopo**: Aggiorna le impostazioni della pagina web di un salone.

**Parametri**:
- `p_user_id` (UUID): ID dell'utente
- `p_salon_id` (UUID): ID del salone
- `p_settings` (JSON): Oggetto con le impostazioni da aggiornare

**Esempio di Utilizzo**:
```sql
SELECT update_salon_web_settings(
  'user-uuid-here',
  'salon-uuid-here',
  '{
    "web_title": "Nuovo Titolo",
    "web_description": "Nuova descrizione",
    "web_primary_color": "#ff6b6b",
    "web_contact_email": "info@salone.it"
  }'
);
```

## Funzioni per Contenuti

### 🖼️ `add_salon_gallery(p_user_id, p_salon_id, p_title, p_description, p_image_url, p_image_alt, p_category)`

**Scopo**: Aggiunge una galleria fotografica al salone.

**Parametri**:
- `p_user_id` (UUID): ID dell'utente autorizzato
- `p_salon_id` (UUID): ID del salone
- `p_title` (TEXT): Titolo della galleria
- `p_description` (TEXT, opzionale): Descrizione
- `p_image_url` (TEXT): URL dell'immagine
- `p_image_alt` (TEXT, opzionale): Testo alternativo
- `p_category` (TEXT, opzionale): Categoria (es. "taglio", "colore")

**Ritorna**:
```json
{
  "success": true,
  "gallery_id": "uuid-here",
  "message": "Galleria aggiunta con successo"
}
```

### ⭐ `add_salon_testimonial(p_user_id, p_salon_id, p_client_name, p_client_email, p_rating, p_comment, p_service_name)`

**Scopo**: Aggiunge una testimonianza di un cliente.

**Parametri**:
- `p_user_id` (UUID): ID dell'utente autorizzato
- `p_salon_id` (UUID): ID del salone
- `p_client_name` (TEXT): Nome del cliente
- `p_client_email` (TEXT, opzionale): Email del cliente
- `p_rating` (INTEGER, opzionale): Valutazione da 1 a 5
- `p_comment` (TEXT): Commento del cliente
- `p_service_name` (TEXT, opzionale): Nome del servizio

## Funzioni per Analytics

### 📊 `record_page_visit(p_salon_id, p_page_url, p_visitor_ip, p_user_agent, p_referrer, p_session_id)`

**Scopo**: Registra una visita alla pagina web del salone.

**Parametri**:
- `p_salon_id` (UUID): ID del salone
- `p_page_url` (TEXT): URL della pagina visitata
- `p_visitor_ip` (INET, opzionale): IP del visitatore
- `p_user_agent` (TEXT, opzionale): User agent del browser
- `p_referrer` (TEXT, opzionale): Sito di provenienza
- `p_session_id` (TEXT, opzionale): ID della sessione

### 📈 `get_salon_web_stats(p_user_id, p_salon_id, p_start_date, p_end_date)`

**Scopo**: Ottiene statistiche della pagina web del salone.

**Parametri**:
- `p_user_id` (UUID): ID dell'utente autorizzato
- `p_salon_id` (UUID): ID del salone
- `p_start_date` (DATE, opzionale): Data di inizio (default: 30 giorni fa)
- `p_end_date` (DATE, opzionale): Data di fine (default: oggi)

**Ritorna**:
```json
{
  "success": true,
  "stats": {
    "total_visits": 150,
    "unique_visitors": 89,
    "sessions": 120,
    "avg_time_spent": 180.5,
    "bounces": 45,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }
}
```

## Funzioni Utility

### 🔧 `generate_unique_subdomain(salon_name)`

**Scopo**: Genera un subdomain unico basato sul nome del salone.

**Parametri**:
- `salon_name` (TEXT): Nome del salone

**Esempio**:
```sql
SELECT generate_unique_subdomain('Salone Bellezza Roma & Co.');
-- Ritorna: "salonebellezzaroma"
```

## Sicurezza e Autorizzazioni

### 🔒 Controlli di Sicurezza Implementati

1. **Verifica Utente**: Tutte le funzioni verificano che l'utente esista
2. **Verifica Autorizzazione**: Controllo tramite `profiles.salon_id`
3. **Isolamento Dati**: Ogni salone vede solo i propri dati
4. **Validazione Input**: Controlli sui parametri di input
5. **Gestione Errori**: Try-catch con messaggi specifici

### 🛡️ Esempio di Controllo Autorizzazione

```sql
-- Verifica che l'utente abbia accesso al salone
SELECT * INTO user_profile 
FROM profiles 
WHERE id = p_user_id AND salon_id = p_salon_id;

IF NOT FOUND THEN
    RETURN json_build_object(
        'success', false, 
        'error', 'Utente non autorizzato o salone non associato'
    );
END IF;
```

## Struttura Database

### 📋 Tabelle Principali

1. **`salon`** (estesa con colonne web)
2. **`salon_galleries`** - Gallerie fotografiche
3. **`salon_testimonials`** - Testimonianze clienti
4. **`web_bookings`** - Prenotazioni online
5. **`web_contact_messages`** - Messaggi di contatto
6. **`web_analytics`** - Statistiche visite

### 🔗 Relazioni

- `profiles.salon_id` → `salon.id` (per i manager)
- `team.salon_id` → `salon.id` (per i membri del team)
- Tutte le tabelle web → `salon.id` (per isolamento dati)

### 📊 Indici Creati

- Indici su `salon_id` per tutte le tabelle correlate
- Indici su colonne frequentemente utilizzate (date, status, etc.)
- Indici per ottimizzare le query di ricerca

## Installazione

### 1. Eseguire il File Principale

```sql
-- Esegui il file principale
\i utils/supabase/db/create_salon_web_pages_fixed.sql
```

### 2. Eseguire i Test

```sql
-- Esegui i test per verificare l'installazione
\i utils/supabase/db/test_salon_web_functions.sql
```

### 3. Verificare l'Installazione

```sql
-- Verifica che tutte le funzioni siano state create
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%salon%web%';
```

## Utilizzo nel Frontend

### 🔧 Chiamata da React/TypeScript

```typescript
// Abilitare pagina web
const { data, error } = await supabase.rpc('enable_salon_web_page', {
  p_user_id: user.id,
  p_salon_id: salonId,
  p_web_title: 'Il Mio Salone',
  p_web_description: 'Descrizione del salone'
});

if (data.success) {
  console.log('Pagina web abilitata:', data.web_url);
} else {
  console.error('Errore:', data.error);
}
```

### 🔧 Aggiornare Impostazioni

```typescript
// Aggiornare impostazioni
const { data, error } = await supabase.rpc('update_salon_web_settings', {
  p_user_id: user.id,
  p_salon_id: salonId,
  p_settings: {
    web_title: 'Nuovo Titolo',
    web_primary_color: '#ff6b6b',
    web_contact_email: 'info@salone.it'
  }
});
```

## Troubleshooting

### ❓ Problemi Comuni

**Errore: "Utente non autorizzato"**
- Verifica che l'utente abbia un `salon_id` in `profiles`
- Verifica che il `salon_id` corrisponda al salone richiesto

**Errore: "Salone non trovato"**
- Verifica che il salone esista nella tabella `salon`
- Verifica che l'ID del salone sia corretto

**Errore: "Impossibile generare un subdomain unico"**
- Il nome del salone potrebbe essere troppo lungo
- Potrebbero esistere troppi saloni con nomi simili

### 🔧 Soluzioni

1. **Verificare Profilo Utente**:
```sql
SELECT * FROM profiles WHERE id = 'user-uuid-here';
```

2. **Verificare Salone**:
```sql
SELECT * FROM salon WHERE id = 'salon-uuid-here';
```

3. **Verificare Subdomain Esistenti**:
```sql
SELECT web_subdomain FROM salon WHERE web_subdomain IS NOT NULL;
```

## Monitoraggio e Manutenzione

### 📊 Query Utili per il Monitoraggio

```sql
-- Conta pagine web abilitate
SELECT COUNT(*) FROM salon WHERE web_enabled = true;

-- Statistiche prenotazioni online
SELECT status, COUNT(*) 
FROM web_bookings 
GROUP BY status;

-- Messaggi di contatto non letti
SELECT COUNT(*) 
FROM web_contact_messages 
WHERE is_read = false;

-- Visite oggi
SELECT COUNT(*) 
FROM web_analytics 
WHERE visit_date = CURRENT_DATE;
```

### 🔄 Manutenzione Periodica

1. **Pulizia Analytics Vecchi** (mensile)
2. **Verifica Indici** (settimanale)
3. **Backup Dati** (giornaliero)
4. **Monitoraggio Performance** (continuo)

## Conclusione

Le funzioni SQL create garantiscono:
- ✅ **Sicurezza**: Controlli di autorizzazione rigorosi
- ✅ **Performance**: Indici ottimizzati
- ✅ **Scalabilità**: Struttura multi-tenant
- ✅ **Manutenibilità**: Codice ben documentato
- ✅ **Affidabilità**: Gestione errori completa

Il sistema è pronto per essere utilizzato in produzione e può gestire centinaia di saloni con le loro pagine web personalizzate. 