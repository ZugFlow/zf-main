# Guida Setup Sistema Personalizzazione Modal Appuntamento

## 🎯 Panoramica

Questa guida spiega come installare e configurare il sistema di personalizzazione del modal di nuovo appuntamento nel tuo database Supabase.

## 📋 Prerequisiti

- Database Supabase configurato
- Tabella `profiles` esistente con campo `salon_id`
- Accesso al SQL Editor di Supabase

## 🚀 Installazione

### Step 1: Esegui lo Script SQL

1. **Apri il SQL Editor** nel tuo dashboard Supabase
2. **Copia e incolla** il contenuto del file `appointment_modal_settings.sql`
3. **Esegui lo script**

```sql
-- Il contenuto completo del file appointment_modal_settings.sql
-- (vedi il file per il contenuto completo)
```

### Step 2: Verifica l'Installazione

Esegui questa query per verificare che la tabella sia stata creata correttamente:

```sql
-- Verifica che la tabella esista
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'appointment_modal_settings';

-- Verifica la struttura della tabella
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'appointment_modal_settings'
ORDER BY ordinal_position;

-- Verifica che siano stati creati i record di default
SELECT COUNT(*) as total_settings
FROM appointment_modal_settings;
```

### Step 3: Verifica le Foreign Key

```sql
-- Verifica che la foreign key sia stata creata correttamente
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'appointment_modal_settings';
```

## 🔧 Configurazione

### Step 1: Accesso alle Impostazioni

1. **Accedi al dashboard** della tua applicazione
2. **Vai su Impostazioni > Impostazioni Avanzate**
3. **Clicca sul tab "Modal Appuntamento"**

### Step 2: Personalizzazione Base

#### Testi del Modal
- **Titolo del Modal**: Personalizza il titolo principale
- **Sottotitolo**: Aggiungi un sottotitolo opzionale
- **Titoli delle Sezioni**: Modifica i titoli di ogni sezione

#### Etichette dei Campi
- **Nome Cliente**: Personalizza l'etichetta del campo nome
- **Telefono**: Modifica l'etichetta del campo telefono
- **Email**: Personalizza l'etichetta del campo email
- **Servizio**: Modifica l'etichetta del campo servizio

#### Placeholder
- **Nome Cliente**: Personalizza il testo di suggerimento
- **Telefono**: Modifica il placeholder del telefono
- **Email**: Personalizza il placeholder dell'email
- **Note**: Modifica il placeholder delle note

### Step 3: Gestione Funzionalità

#### Funzionalità Abilitate
- **Ricerca Cliente**: Abilita/disabilita la ricerca clienti esistenti
- **Creazione Nuovo Cliente**: Permette di creare nuovi clienti
- **Selezione Servizi**: Controlla la selezione dei servizi
- **Servizi Multipli**: Permette di aggiungere più servizi
- **Modifica Prezzo**: Abilita la modifica manuale dei prezzi
- **Note**: Abilita/disabilita il campo note
- **Selezione Stato**: Controlla la selezione dello stato
- **Selezione Team**: Abilita la selezione del membro del team
- **Notifiche**: Gestisce le notifiche per gli appuntamenti
- **Selezione Colori**: Permette la personalizzazione dei colori
- **Stile Card**: Controlla la personalizzazione dello stile

#### Sezioni Visibili
- **Sezione Cliente**: Mostra/nasconde la sezione cliente
- **Sezione Servizi**: Controlla la visualizzazione dei servizi
- **Sezione Orari**: Mostra/nasconde la sezione orari
- **Sezione Note**: Abilita/disabilita la sezione note
- **Sezione Prezzo**: Controlla la visualizzazione del prezzo
- **Sezione Stato**: Mostra/nasconde la sezione stato
- **Sezione Team**: Abilita/disabilita la sezione team
- **Sezione Notifiche**: Controlla la sezione notifiche
- **Sezione Colori**: Mostra/nasconde la sezione colori
- **Sezione Stile Card**: Abilita/disabilita la sezione stile

### Step 4: Layout e Stili

#### Impostazioni Layout
- **Larghezza Modal**: Scegli tra sm, md, lg, xl, 2xl
- **Altezza Modal**: Scegli tra auto, sm, md, lg, xl
- **Layout Form**: Scegli tra verticale, orizzontale, griglia
- **Durata Default**: Imposta la durata predefinita in minuti
- **Max Servizi**: Imposta il numero massimo di servizi per appuntamento

#### Funzionalità Avanzate
- **Calcolo Automatico Prezzo**: Abilita il calcolo automatico
- **Suggerimento Orario Fine**: Suggerisce automaticamente l'orario di fine
- **Appuntamenti Sovrapposti**: Permette o impedisce sovrapposizioni
- **Dialog di Conferma**: Mostra dialog di conferma prima del salvataggio

#### Colori Personalizzati
- **Colore Primario**: Personalizza il colore principale
- **Colore Secondario**: Modifica il colore secondario
- **Colore Successo**: Personalizza il colore per i successi
- **Colore Avviso**: Modifica il colore per gli avvisi
- **Colore Errore**: Personalizza il colore per gli errori

### Step 5: Validazione

#### Campi Obbligatori
- **Nome Cliente**: Rendi obbligatorio il nome del cliente
- **Telefono**: Rendi obbligatorio il telefono
- **Email**: Rendi obbligatoria l'email
- **Selezione Servizio**: Rendi obbligatoria la selezione del servizio
- **Selezione Team**: Rendi obbligatoria la selezione del team
- **Prezzo**: Rendi obbligatorio il prezzo

#### Messaggi di Validazione
- **Campo Obbligatorio**: Personalizza il messaggio per i campi obbligatori
- **Email Non Valida**: Modifica il messaggio per email non valide
- **Telefono Non Valido**: Personalizza il messaggio per telefoni non validi
- **Orario Non Valido**: Modifica il messaggio per orari non validi
- **Orario Fine Precedente**: Personalizza il messaggio per orari di fine precedenti

## 🎨 Esempi di Configurazione per Settori

### Salone di Bellezza

```sql
UPDATE appointment_modal_settings
SET 
  modal_title = 'Nuova Prenotazione',
  client_section_title = 'Cliente',
  service_section_title = 'Trattamenti',
  price_section_title = 'Costo Totale',
  client_name_label = 'Nome Cliente',
  service_label = 'Trattamento',
  price_label = 'Costo',
  enable_multiple_services = true,
  enable_price_editing = true,
  primary_color = '#ff69b4',
  secondary_color = '#ff1493'
WHERE salon_id = 'your-salon-id';
```

### Studio Dentistico

```sql
UPDATE appointment_modal_settings
SET 
  modal_title = 'Nuova Visita',
  client_section_title = 'Paziente',
  service_section_title = 'Prestazioni',
  price_section_title = 'Tariffa',
  client_name_label = 'Nome Paziente',
  service_label = 'Prestazione',
  price_label = 'Tariffa',
  enable_new_client_creation = false,
  enable_multiple_services = false,
  enable_price_editing = false,
  require_client_phone = true,
  primary_color = '#00bfff',
  secondary_color = '#1e90ff'
WHERE salon_id = 'your-salon-id';
```

### Studio Legale

```sql
UPDATE appointment_modal_settings
SET 
  modal_title = 'Nuovo Appuntamento',
  client_section_title = 'Cliente',
  service_section_title = 'Tipo di Consulenza',
  price_section_title = 'Onorari',
  client_name_label = 'Nome Cliente',
  service_label = 'Tipo di Consulenza',
  price_label = 'Onorari',
  enable_multiple_services = false,
  require_client_email = true,
  primary_color = '#2f4f4f',
  secondary_color = '#696969'
WHERE salon_id = 'your-salon-id';
```

## 🔍 Troubleshooting

### Problema: "relation 'salon' does not exist"

**Causa**: Lo script originale faceva riferimento a una tabella `salon` che non esiste.

**Soluzione**: 
1. Usa la versione corretta dello script che fa riferimento a `profiles(salon_id)`
2. Verifica che la tabella `profiles` abbia il campo `salon_id`

### Problema: "foreign key constraint fails"

**Causa**: Il `salon_id` non esiste nella tabella `profiles`.

**Soluzione**:
```sql
-- Verifica che esistano profili con salon_id
SELECT id, salon_id FROM profiles WHERE salon_id IS NOT NULL;

-- Se necessario, genera salon_id per profili esistenti
UPDATE profiles 
SET salon_id = gen_random_uuid() 
WHERE salon_id IS NULL;
```

### Problema: "Impostazioni non caricate"

**Causa**: Non sono stati creati record di default per il salone.

**Soluzione**:
```sql
-- Crea manualmente le impostazioni per un salone specifico
INSERT INTO appointment_modal_settings (salon_id)
VALUES ('your-salon-id')
ON CONFLICT (salon_id) DO NOTHING;
```

### Problema: "Errore di permessi"

**Causa**: Le policy RLS non sono configurate correttamente.

**Soluzione**:
```sql
-- Abilita RLS sulla tabella
ALTER TABLE appointment_modal_settings ENABLE ROW LEVEL SECURITY;

-- Crea policy per permettere accesso ai membri del salone
CREATE POLICY "Users can access their salon modal settings" ON appointment_modal_settings
FOR ALL USING (
  salon_id IN (
    SELECT salon_id FROM profiles WHERE id = auth.uid()
    UNION
    SELECT salon_id FROM team WHERE user_id = auth.uid() AND is_active = true
  )
);
```

## 📊 Monitoraggio

### Query Utili per il Monitoraggio

```sql
-- Conta le impostazioni per salone
SELECT 
  p.name as salon_name,
  COUNT(ams.id) as settings_count
FROM profiles p
LEFT JOIN appointment_modal_settings ams ON p.salon_id = ams.salon_id
GROUP BY p.salon_id, p.name;

-- Verifica le personalizzazioni più comuni
SELECT 
  modal_title,
  COUNT(*) as usage_count
FROM appointment_modal_settings
GROUP BY modal_title
ORDER BY usage_count DESC;

-- Controlla le funzionalità più utilizzate
SELECT 
  'enable_client_search' as feature,
  COUNT(*) as enabled_count
FROM appointment_modal_settings
WHERE enable_client_search = true
UNION ALL
SELECT 
  'enable_multiple_services',
  COUNT(*)
FROM appointment_modal_settings
WHERE enable_multiple_services = true;
```

## 🎉 Conclusione

Il sistema di personalizzazione del modal di appuntamento è ora completamente configurato e funzionante. Ogni salone può personalizzare l'interfaccia secondo le proprie esigenze specifiche, migliorando l'esperienza utente e la produttività.

Per supporto aggiuntivo, consulta la documentazione completa nel file `APPOINTMENT_MODAL_CUSTOMIZATION_GUIDE.md`.
