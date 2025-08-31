# Guida Setup Impostazioni Modal Appuntamento

## Panoramica

Il sistema di impostazioni del modal di appuntamento permette di personalizzare completamente l'interfaccia del modal di creazione appuntamenti, inclusi testi, funzionalità, validazioni e stili.

## Setup Iniziale

### 1. Eseguire gli Script SQL

Esegui i seguenti script SQL nel tuo database Supabase:

```sql
-- 1. Crea la tabella e le strutture
\i appointment_modal_settings.sql

-- 2. Abilita il realtime per aggiornamenti automatici
\i enable_realtime_appointment_modal_settings.sql
```

### 2. Verificare l'Installazione

Esegui il test di verifica:

```bash
node test_modal_settings.js
```

## Funzionalità Disponibili

### Testi Personalizzabili

- **Titolo del Modal**: Il titolo principale del modal
- **Sottotitolo**: Sottotitolo opzionale sotto il titolo
- **Titoli delle Sezioni**: Titoli per ogni sezione del form
- **Etichette dei Campi**: Etichette per tutti i campi input
- **Placeholder**: Testi di esempio nei campi
- **Messaggi di Validazione**: Messaggi di errore personalizzati
- **Testi dei Pulsanti**: Testi per tutti i pulsanti

### Funzionalità Configurabili

- **Ricerca Cliente**: Abilita/disabilita la ricerca clienti
- **Creazione Nuovo Cliente**: Permette di creare nuovi clienti
- **Selezione Servizi**: Abilita la selezione servizi
- **Servizi Multipli**: Permette più servizi per appuntamento
- **Modifica Prezzo**: Abilita la modifica manuale del prezzo
- **Note**: Abilita il campo note
- **Notifiche**: Abilita le notifiche al cliente

### Validazione Configurabile

- **Campi Obbligatori**: Configura quali campi sono obbligatori
- **Messaggi di Errore**: Personalizza tutti i messaggi di validazione

### Stili Personalizzabili

- **Colori**: Colori primari, secondari, successo, errore
- **Layout**: Larghezza e altezza del modal
- **Ordinamento Sezioni**: Ordine delle sezioni nel form

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

### 2. Componente Modal con Impostazioni

```typescript
import { CreateOrder } from "./_CreateOrder/CreateOrder";

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Nuovo Appuntamento
      </button>
      
      <CreateOrder
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
  const isClientNameRequired = isFieldRequired('require_client_name');
  const requiredMessage = getValidationMessage('required');

  return (
    <form>
      <label>{clientNameLabel}</label>
      <input 
        required={isClientNameRequired}
        placeholder={getSetting('client_name_placeholder')}
      />
      {isClientNameRequired && (
        <span className="error">{requiredMessage}</span>
      )}
    </form>
  );
}
```

## Aggiornamenti in Tempo Reale

Il sistema utilizza Supabase Realtime per aggiornare automaticamente l'interfaccia quando le impostazioni vengono modificate:

1. **Modifica Impostazioni**: Vai alla pagina delle impostazioni del modal
2. **Salva Modifiche**: Clicca "Salva Impostazioni"
3. **Aggiornamento Automatico**: Il modal si aggiorna automaticamente senza ricaricare la pagina

## Troubleshooting

### Problemi Comuni

1. **Impostazioni non caricate**
   - Verifica che la tabella `appointment_modal_settings` esista
   - Controlla che il `salon_id` sia corretto
   - Verifica i permessi del database

2. **Aggiornamenti non in tempo reale**
   - Verifica che il realtime sia abilitato per la tabella
   - Controlla la console per errori di connessione
   - Verifica che l'utente sia autenticato

3. **Impostazioni non salvate**
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

## Struttura Database

### Tabella `appointment_modal_settings`

```sql
CREATE TABLE appointment_modal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL UNIQUE,
    
    -- Testi personalizzabili
    modal_title VARCHAR(255) DEFAULT 'Nuovo Appuntamento',
    modal_subtitle VARCHAR(500),
    client_section_title VARCHAR(255) DEFAULT 'Cliente',
    -- ... altri campi
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_appointment_modal_settings_salon_id 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE
);
```

### Indici e Trigger

- **Indice**: `idx_appointment_modal_settings_salon_id` per performance
- **Trigger**: `trigger_update_appointment_modal_settings_updated_at` per aggiornare `updated_at`
- **Realtime**: Abilitato per aggiornamenti automatici

## Best Practices

1. **Fallback**: Sempre fornire valori di default per tutti i campi
2. **Validazione**: Validare le impostazioni lato client e server
3. **Performance**: Utilizzare `useMemo` per calcoli costosi
4. **Accessibilità**: Mantenere l'accessibilità con impostazioni personalizzate
5. **Testing**: Testare tutte le combinazioni di impostazioni

## Esempi di Personalizzazione

### Modal Minimalista

```typescript
// Impostazioni per un modal minimalista
const minimalSettings = {
  modal_title: 'Nuovo Appuntamento',
  modal_subtitle: 'Inserisci i dettagli',
  show_client_section: true,
  show_service_section: true,
  show_time_section: true,
  show_notes_section: false,
  show_color_section: false,
  require_client_name: true,
  require_service_selection: true,
  require_team_selection: false
};
```

### Modal Completo

```typescript
// Impostazioni per un modal completo
const completeSettings = {
  modal_title: 'Prenotazione Appuntamento',
  modal_subtitle: 'Compila tutti i campi richiesti',
  show_client_section: true,
  show_service_section: true,
  show_time_section: true,
  show_notes_section: true,
  show_color_section: true,
  require_client_name: true,
  require_client_phone: true,
  require_client_email: true,
  require_service_selection: true,
  require_team_selection: true
};
```

## Conclusione

Il sistema di impostazioni del modal offre una flessibilità completa per adattare l'interfaccia alle esigenze specifiche di ogni attività. Con una corretta implementazione e manutenzione, questo sistema può migliorare significativamente l'esperienza utente e la produttività.
