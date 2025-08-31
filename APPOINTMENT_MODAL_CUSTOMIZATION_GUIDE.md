# Guida Personalizzazione Modal Appuntamento

## Panoramica

Il sistema di personalizzazione del modal di nuovo appuntamento permette a ogni salone/artigiano di personalizzare completamente l'interfaccia per la creazione di appuntamenti, adattandola alle proprie esigenze specifiche del settore.

## Funzionalità Principali

### 1. Personalizzazione Testi
- **Titoli e sottotitoli**: Personalizza il titolo del modal e i titoli delle sezioni
- **Etichette dei campi**: Modifica le etichette di tutti i campi del form
- **Placeholder**: Personalizza i testi di suggerimento nei campi
- **Messaggi di validazione**: Personalizza i messaggi di errore e validazione
- **Testi dei pulsanti**: Modifica i testi di tutti i pulsanti

### 2. Gestione Funzionalità
- **Abilita/Disabilita funzionalità**: Controlla quali funzionalità sono disponibili
- **Ricerca clienti**: Abilita/disabilita la ricerca di clienti esistenti
- **Creazione nuovi clienti**: Permette di creare nuovi clienti dal modal
- **Selezione servizi**: Controlla la selezione di servizi singoli o multipli
- **Modifica prezzi**: Permette la modifica manuale dei prezzi
- **Note e commenti**: Abilita/disabilita il campo note
- **Selezione team**: Controlla la selezione del membro del team
- **Notifiche**: Gestisce le notifiche per gli appuntamenti
- **Personalizzazione colori**: Permette la selezione dei colori delle card
- **Stili delle card**: Controlla la personalizzazione dello stile delle card

### 3. Controllo Visualizzazione
- **Sezioni visibili**: Mostra/nasconde intere sezioni del form
- **Ordine delle sezioni**: Personalizza l'ordine di visualizzazione
- **Layout del form**: Scegli tra layout verticale, orizzontale o a griglia
- **Dimensioni del modal**: Personalizza larghezza e altezza del modal

### 4. Validazione e Regole
- **Campi obbligatori**: Definisci quali campi sono obbligatori
- **Messaggi di validazione**: Personalizza tutti i messaggi di errore
- **Calcolo automatico prezzi**: Abilita il calcolo automatico dai servizi
- **Suggerimento orari**: Suggerisce automaticamente l'orario di fine
- **Appuntamenti sovrapposti**: Permette o impedisce sovrapposizioni
- **Durata default**: Imposta la durata predefinita degli appuntamenti

### 5. Personalizzazione Stili
- **Colori personalizzati**: Definisci la palette colori del modal
- **Colori primari e secondari**: Personalizza i colori principali
- **Colori di stato**: Personalizza i colori per successo, avviso, errore

## Struttura Database

### Tabella `appointment_modal_settings`

La tabella contiene tutte le impostazioni personalizzate per ogni salone:

```sql
CREATE TABLE appointment_modal_settings (
    id UUID PRIMARY KEY,
    salon_id UUID NOT NULL UNIQUE,
    
    -- Testi personalizzabili
    modal_title VARCHAR(255),
    modal_subtitle VARCHAR(500),
    client_section_title VARCHAR(255),
    service_section_title VARCHAR(255),
    time_section_title VARCHAR(255),
    notes_section_title VARCHAR(255),
    price_section_title VARCHAR(255),
    
    -- Etichette campi
    client_name_label VARCHAR(255),
    client_phone_label VARCHAR(255),
    client_email_label VARCHAR(255),
    service_label VARCHAR(255),
    date_label VARCHAR(255),
    start_time_label VARCHAR(255),
    end_time_label VARCHAR(255),
    team_member_label VARCHAR(255),
    notes_label VARCHAR(255),
    price_label VARCHAR(255),
    status_label VARCHAR(255),
    
    -- Placeholder
    client_name_placeholder VARCHAR(255),
    client_phone_placeholder VARCHAR(255),
    client_email_placeholder VARCHAR(255),
    notes_placeholder VARCHAR(500),
    price_placeholder VARCHAR(255),
    
    -- Testi pulsanti
    save_button_text VARCHAR(255),
    cancel_button_text VARCHAR(255),
    add_service_button_text VARCHAR(255),
    remove_service_button_text VARCHAR(255),
    search_client_button_text VARCHAR(255),
    new_client_button_text VARCHAR(255),
    
    -- Messaggi validazione
    required_field_message VARCHAR(255),
    invalid_email_message VARCHAR(255),
    invalid_phone_message VARCHAR(255),
    invalid_time_message VARCHAR(255),
    end_time_before_start_message VARCHAR(255),
    
    -- Funzionalità abilitate
    enable_client_search BOOLEAN,
    enable_new_client_creation BOOLEAN,
    enable_service_selection BOOLEAN,
    enable_multiple_services BOOLEAN,
    enable_price_editing BOOLEAN,
    enable_notes BOOLEAN,
    enable_status_selection BOOLEAN,
    enable_team_selection BOOLEAN,
    enable_notifications BOOLEAN,
    enable_color_selection BOOLEAN,
    enable_card_style_selection BOOLEAN,
    
    -- Validazione
    require_client_name BOOLEAN,
    require_client_phone BOOLEAN,
    require_client_email BOOLEAN,
    require_service_selection BOOLEAN,
    require_team_selection BOOLEAN,
    require_price BOOLEAN,
    
    -- Visualizzazione sezioni
    show_client_section BOOLEAN,
    show_service_section BOOLEAN,
    show_time_section BOOLEAN,
    show_notes_section BOOLEAN,
    show_price_section BOOLEAN,
    show_status_section BOOLEAN,
    show_team_section BOOLEAN,
    show_notifications_section BOOLEAN,
    show_color_section BOOLEAN,
    show_card_style_section BOOLEAN,
    
    -- Layout
    modal_width VARCHAR(20),
    modal_height VARCHAR(20),
    form_layout VARCHAR(20),
    sections_order JSONB,
    
    -- Impostazioni avanzate
    auto_calculate_price BOOLEAN,
    auto_suggest_end_time BOOLEAN,
    default_duration_minutes INTEGER,
    max_services_per_appointment INTEGER,
    allow_overlapping_appointments BOOLEAN,
    show_confirmation_dialog BOOLEAN,
    
    -- Colori
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    success_color VARCHAR(7),
    warning_color VARCHAR(7),
    error_color VARCHAR(7),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## Utilizzo nel Codice

### 1. Hook per le Impostazioni

```typescript
import { useAppointmentModalSettings } from "@/hooks/useAppointmentModalSettings";

function MyComponent() {
  const { 
    settings, 
    loading, 
    getSetting, 
    isFeatureEnabled, 
    isSectionVisible,
    getValidationMessage,
    getModalSize,
    getColors 
  } = useAppointmentModalSettings();

  // Utilizzo delle impostazioni
  const modalTitle = getSetting('modal_title') || 'Nuovo Appuntamento';
  const isClientSearchEnabled = isFeatureEnabled('enable_client_search');
  const isClientSectionVisible = isSectionVisible('show_client_section');
  const requiredMessage = getValidationMessage('required');
  const modalSize = getModalSize();
  const colors = getColors();

  return (
    <div>
      <h1>{modalTitle}</h1>
      {isClientSectionVisible && (
        <div>
          {/* Sezione cliente */}
        </div>
      )}
    </div>
  );
}
```

### 2. Componente Modal Personalizzato

```typescript
import { CreateOrderWithSettings } from "./_CreateOrder/CreateOrderWithSettings";

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Nuovo Appuntamento
      </button>
      
      <CreateOrderWithSettings
        isDialogOpen={isModalOpen}
        setIsDialogOpen={setIsModalOpen}
        actionType="appointment"
        onAppointmentCreated={() => {
          console.log('Appuntamento creato!');
        }}
      />
    </div>
  );
}
```

### 3. Form con Impostazioni Personalizzate

```typescript
function CreateOrderForm({ modalSettings, ...props }) {
  const { 
    getSetting, 
    isFeatureEnabled, 
    isFieldRequired,
    getValidationMessage 
  } = useAppointmentModalSettings();

  const clientNameLabel = getSetting('client_name_label') || 'Nome Cliente';
  const clientNamePlaceholder = getSetting('client_name_placeholder') || 'Inserisci il nome';
  const isClientNameRequired = isFieldRequired('require_client_name');
  const requiredMessage = getValidationMessage('required');

  return (
    <form>
      {isFeatureEnabled('enable_client_search') && (
        <div>
          <label>{clientNameLabel}</label>
          <input 
            placeholder={clientNamePlaceholder}
            required={isClientNameRequired}
          />
          {isClientNameRequired && (
            <span className="error">{requiredMessage}</span>
          )}
        </div>
      )}
      
      {/* Altri campi... */}
    </form>
  );
}
```

## Configurazione per Settori Specifici

### Esempio: Salone di Bellezza

```typescript
// Impostazioni tipiche per un salone di bellezza
const beautySalonSettings = {
  modal_title: 'Nuova Prenotazione',
  client_section_title: 'Cliente',
  service_section_title: 'Trattamenti',
  time_section_title: 'Data e Orario',
  price_section_title: 'Costo Totale',
  
  client_name_label: 'Nome Cliente',
  service_label: 'Trattamento',
  price_label: 'Costo',
  
  enable_client_search: true,
  enable_new_client_creation: true,
  enable_multiple_services: true,
  enable_price_editing: true,
  enable_notes: true,
  
  require_client_name: true,
  require_service_selection: true,
  require_team_selection: true,
  
  show_client_section: true,
  show_service_section: true,
  show_time_section: true,
  show_price_section: true,
  show_notes_section: true,
  
  primary_color: '#ff69b4', // Rosa
  secondary_color: '#ff1493', // Rosa scuro
};
```

### Esempio: Studio Dentistico

```typescript
// Impostazioni tipiche per uno studio dentistico
const dentalClinicSettings = {
  modal_title: 'Nuova Visita',
  client_section_title: 'Paziente',
  service_section_title: 'Prestazioni',
  time_section_title: 'Data e Orario',
  price_section_title: 'Tariffa',
  
  client_name_label: 'Nome Paziente',
  service_label: 'Prestazione',
  price_label: 'Tariffa',
  
  enable_client_search: true,
  enable_new_client_creation: false, // Solo pazienti registrati
  enable_multiple_services: false, // Una prestazione per volta
  enable_price_editing: false, // Prezzi fissi
  
  require_client_name: true,
  require_client_phone: true, // Importante per emergenze
  require_service_selection: true,
  
  show_client_section: true,
  show_service_section: true,
  show_time_section: true,
  show_price_section: true,
  show_notes_section: true,
  
  primary_color: '#00bfff', // Azzurro
  secondary_color: '#1e90ff', // Blu
};
```

### Esempio: Studio Legale

```typescript
// Impostazioni tipiche per uno studio legale
const lawFirmSettings = {
  modal_title: 'Nuovo Appuntamento',
  client_section_title: 'Cliente',
  service_section_title: 'Tipo di Consulenza',
  time_section_title: 'Data e Orario',
  price_section_title: 'Onorari',
  
  client_name_label: 'Nome Cliente',
  service_label: 'Tipo di Consulenza',
  price_label: 'Onorari',
  
  enable_client_search: true,
  enable_new_client_creation: true,
  enable_multiple_services: false,
  enable_price_editing: true,
  enable_notes: true,
  
  require_client_name: true,
  require_client_email: true, // Importante per documenti
  require_service_selection: true,
  
  show_client_section: true,
  show_service_section: true,
  show_time_section: true,
  show_price_section: true,
  show_notes_section: true,
  
  primary_color: '#2f4f4f', // Grigio scuro
  secondary_color: '#696969', // Grigio
};
```

## Migrazione e Aggiornamenti

### 1. Creazione Impostazioni di Default

```sql
-- Inserimento record di default per saloni esistenti
INSERT INTO appointment_modal_settings (salon_id)
SELECT id FROM salon
WHERE id NOT IN (SELECT salon_id FROM appointment_modal_settings)
ON CONFLICT (salon_id) DO NOTHING;
```

### 2. Aggiornamento Impostazioni Esistenti

```sql
-- Aggiorna impostazioni specifiche per un salone
UPDATE appointment_modal_settings
SET 
  modal_title = 'Nuova Prenotazione',
  enable_multiple_services = true,
  primary_color = '#ff69b4'
WHERE salon_id = 'your-salon-id';
```

### 3. Backup e Ripristino

```sql
-- Backup delle impostazioni
SELECT * FROM appointment_modal_settings 
WHERE salon_id = 'your-salon-id';

-- Ripristino da backup
INSERT INTO appointment_modal_settings (salon_id, modal_title, ...)
VALUES ('your-salon-id', 'Nuovo Appuntamento', ...)
ON CONFLICT (salon_id) 
DO UPDATE SET 
  modal_title = EXCLUDED.modal_title,
  -- altri campi...
  updated_at = NOW();
```

## Best Practices

### 1. Gestione delle Impostazioni
- **Sempre fallback**: Fornisci sempre valori di default per ogni impostazione
- **Validazione**: Valida le impostazioni prima di applicarle
- **Caching**: Cache le impostazioni per migliorare le performance
- **Aggiornamenti**: Aggiorna le impostazioni solo quando necessario

### 2. UX/UI
- **Consistenza**: Mantieni consistenza nell'interfaccia
- **Accessibilità**: Assicurati che le personalizzazioni non compromettano l'accessibilità
- **Responsive**: Verifica che le personalizzazioni funzionino su tutti i dispositivi
- **Performance**: Ottimizza il caricamento delle impostazioni

### 3. Sicurezza
- **Validazione lato server**: Valida sempre le impostazioni lato server
- **Permessi**: Verifica che solo gli utenti autorizzati possano modificare le impostazioni
- **Sanitizzazione**: Sanitizza tutti i testi personalizzati per prevenire XSS

### 4. Manutenzione
- **Versioning**: Mantieni un sistema di versioning per le impostazioni
- **Backup**: Fai backup regolari delle impostazioni
- **Monitoraggio**: Monitora l'utilizzo delle funzionalità personalizzate
- **Documentazione**: Mantieni aggiornata la documentazione delle personalizzazioni

## Troubleshooting

### Problemi Comuni

1. **Impostazioni non caricate**
   - Verifica che la tabella `appointment_modal_settings` esista
   - Controlla che il `salon_id` sia corretto
   - Verifica i permessi del database

2. **Personalizzazioni non applicate**
   - Controlla che l'hook `useAppointmentModalSettings` sia utilizzato correttamente
   - Verifica che i componenti utilizzino le impostazioni personalizzate
   - Controlla la console per errori JavaScript

3. **Performance lente**
   - Implementa il caching delle impostazioni
   - Ottimizza le query del database
   - Considera l'uso di React.memo per i componenti

4. **Impostazioni non salvate**
   - Verifica i permessi di scrittura nel database
   - Controlla la validazione lato server
   - Verifica la connessione a Supabase

### Debug

```typescript
// Debug delle impostazioni
const { settings, loading, error } = useAppointmentModalSettings();

console.log('Settings:', settings);
console.log('Loading:', loading);
console.log('Error:', error);

// Debug di funzioni specifiche
console.log('Modal size:', getModalSize());
console.log('Colors:', getColors());
console.log('Is client search enabled:', isFeatureEnabled('enable_client_search'));
```

## Conclusione

Il sistema di personalizzazione del modal di appuntamento offre una flessibilità completa per adattare l'interfaccia alle esigenze specifiche di ogni settore. Con una corretta implementazione e manutenzione, questo sistema può migliorare significativamente l'esperienza utente e la produttività per ogni tipo di attività.
