# Guida Implementazione Sistema Multilingua

## Panoramica

Questo documento descrive l'implementazione di un sistema di doppia lingua (italiano e inglese) per il gestionale Zugflow, che estende il sistema di testi personalizzabili esistente.

## Architettura

### Sistema Ibrido
Il sistema utilizza un approccio **ibrido** che combina:
- **Testi personalizzabili** dal database (sistema esistente)
- **Testi di sistema** hardcoded come fallback
- **Formattazione locale** per date, numeri e valute

### Struttura Database

#### Tabella `custom_texts` Estesa
```sql
-- Campo aggiunto per il supporto multilingua
ALTER TABLE custom_texts ADD COLUMN language VARCHAR(5) DEFAULT 'it';

-- Constraint aggiornato per includere la lingua
ALTER TABLE custom_texts ADD CONSTRAINT custom_texts_salon_id_text_key_language_key 
  UNIQUE(salon_id, text_key, language);
```

### Gerarchia di Fallback
1. **Testi personalizzati** per la lingua corrente
2. **Testi di sistema** per la lingua corrente
3. **Testi di sistema** in italiano (fallback)
4. **Testi di sistema** in inglese (fallback)
5. **Chiave o valore di default**

## Implementazione

### 1. Hook di Localizzazione

#### File: `hooks/useLocalization.ts`
```typescript
import { useLocalization } from '@/hooks/useLocalization'

function MyComponent() {
  const { t, currentLanguage, formatDate, formatNumber, formatCurrency } = useLocalization()
  
  return (
    <div>
      <h1>{t('nav.dashboard', 'Dashboard')}</h1>
      <p>{formatDate(new Date())}</p>
      <p>{formatCurrency(99.99)}</p>
    </div>
  )
}
```

### 2. Provider di Localizzazione

#### Integrazione nel Layout
```typescript
// app/(dashboard)/layout.tsx
import { LocalizationProvider } from '@/hooks/useLocalization'

export default function DashboardLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocalizationProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </LocalizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

### 3. Componente Switch Lingua

#### Utilizzo
```typescript
import { LanguageSwitcher } from '@/components/ui/language-switcher'

function Header() {
  return (
    <header>
      <h1>Zugflow</h1>
      <LanguageSwitcher />
    </header>
  )
}
```

## Utilizzo Pratico

### Traduzione di Testi

#### Testi Semplici
```typescript
const { t } = useLocalization()

// Con fallback
t('nav.dashboard', 'Dashboard')

// Senza fallback (usa la chiave se non trovata)
t('nav.dashboard')
```

#### Testi con Variabili
```typescript
// Per ora, usa template literals
const userName = 'Mario'
t('message.welcome', 'Benvenuto') + ', ' + userName

// Oppure usa la funzione con placeholder
t('message.welcome_user', `Benvenuto, {userName}`)
```

### Formattazione

#### Date
```typescript
const { formatDate } = useLocalization()

// Formattazione automatica per lingua
formatDate(new Date()) // "15 dicembre 2024" o "December 15, 2024"
```

#### Numeri
```typescript
const { formatNumber, formatCurrency } = useLocalization()

formatNumber(1234567.89) // "1.234.567,89" o "1,234,567.89"
formatCurrency(99.99) // "€99,99" o "$99.99"
```

#### Orari
```typescript
const { formatTime } = useLocalization()

formatTime(new Date()) // "14:30" o "2:30 PM"
```

## Migrazione dei Testi Esistenti

### 1. Eseguire la Migrazione Database
```sql
-- Esegui il file: utils/supabase/db/add_multilingual_support.sql
```

### 2. Aggiornare i Componenti

#### Prima (solo italiano)
```typescript
// Vecchio codice
const message = 'Prenotazione confermata con successo!'
const date = new Date().toLocaleDateString('it-IT')
```

#### Dopo (multilingua)
```typescript
// Nuovo codice
const { t, formatDate } = useLocalization()
const message = t('booking_confirmation_success', 'Prenotazione confermata con successo!')
const date = formatDate(new Date())
```

### 3. Esempi di Migrazione

#### Navigazione
```typescript
// Prima
<Link href="/appointments">Appuntamenti</Link>

// Dopo
<Link href="/appointments">{t('nav.appointments', 'Appuntamenti')}</Link>
```

#### Messaggi di Stato
```typescript
// Prima
<Badge>In attesa</Badge>

// Dopo
<Badge>{t('status.pending', 'In attesa')}</Badge>
```

#### Azioni
```typescript
// Prima
<Button>Salva</Button>

// Dopo
<Button>{t('action.save', 'Salva')}</Button>
```

## Gestione dei Testi Personalizzabili

### Aggiungere Nuovi Testi

#### 1. Database
```sql
INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
VALUES (
  'salon-uuid',
  'new_message_key',
  'Nuovo messaggio in italiano',
  'Descrizione del messaggio',
  'it'
);

INSERT INTO custom_texts (salon_id, text_key, text_value, description, language) 
VALUES (
  'salon-uuid',
  'new_message_key',
  'New message in English',
  'Message description',
  'en'
);
```

#### 2. Hook di Sistema
```typescript
// Aggiungere in getSystemTexts() in useLocalization.ts
const systemTexts = {
  it: {
    'new_message_key': 'Nuovo messaggio in italiano',
    // ... altri testi
  },
  en: {
    'new_message_key': 'New message in English',
    // ... altri testi
  }
}
```

### Convenzioni di Nomenclatura

#### Chiavi Organizzate
```
nav.*          - Navigazione
action.*       - Azioni comuni
status.*       - Stati e badge
message.*      - Messaggi di feedback
form.*         - Validazioni form
date.*         - Date relative
day.*          - Giorni settimana
month.*        - Mesi
```

## Configurazione Avanzata

### Aggiungere Nuove Lingue

#### 1. Aggiornare i Tipi
```typescript
// hooks/useLocalization.ts
export type Language = 'it' | 'en' | 'es' | 'fr'
```

#### 2. Aggiungere Testi di Sistema
```typescript
const systemTexts = {
  it: { /* testi italiani */ },
  en: { /* testi inglesi */ },
  es: { /* testi spagnoli */ },
  fr: { /* testi francesi */ }
}
```

#### 3. Aggiornare il Componente Switch
```typescript
const languages: LanguageOption[] = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
]
```

### Personalizzazione Formattazione

#### Date Personalizzate
```typescript
const formatCustomDate = (date: Date, format: string) => {
  const options: Intl.DateTimeFormatOptions = {
    // Personalizza le opzioni
  }
  return date.toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'it-IT', options)
}
```

#### Valute Personalizzate
```typescript
const formatCustomCurrency = (amount: number, currency: string) => {
  return amount.toLocaleString(currentLanguage === 'en' ? 'en-US' : 'it-IT', {
    style: 'currency',
    currency: currency
  })
}
```

## Best Practices

### 1. Organizzazione Chiavi
- Usa prefissi per organizzare le chiavi
- Mantieni coerenza nella nomenclatura
- Documenta le nuove chiavi aggiunte

### 2. Fallback
- Fornisci sempre un valore di fallback
- Usa chiavi descrittive come fallback
- Testa con chiavi mancanti

### 3. Performance
- I testi vengono caricati una volta per lingua
- Il cambio lingua è istantaneo
- Usa memoization per componenti complessi

### 4. Testing
```typescript
// Test con chiavi mancanti
expect(t('non_existent_key', 'fallback')).toBe('fallback')

// Test cambio lingua
setLanguage('en')
expect(t('nav.dashboard')).toBe('Dashboard')
```

## Troubleshooting

### Problemi Comuni

#### Testi non si aggiornano
1. Verifica che il `LocalizationProvider` sia presente
2. Controlla che la lingua sia cambiata correttamente
3. Verifica che i testi esistano nel database

#### Formattazione non corretta
1. Controlla che la lingua sia impostata correttamente
2. Verifica che il locale sia supportato
3. Testa con date/numeri di esempio

#### Performance
1. Verifica che i testi vengano caricati una sola volta
2. Controlla che non ci siano re-render non necessari
3. Usa React.memo per componenti complessi

### Debug
```typescript
// Abilita debug nel hook
const { t, currentLanguage } = useLocalization()

console.log('Current language:', currentLanguage)
console.log('Translation test:', t('test_key', 'fallback'))
```

## Roadmap Futura

### Fase 2: Migrazione Completa
- [ ] Migrare tutti i componenti esistenti
- [ ] Aggiungere testi mancanti
- [ ] Ottimizzare performance

### Fase 3: Funzionalità Avanzate
- [ ] Supporto per più lingue
- [ ] Traduzioni automatiche
- [ ] Gestione plurali
- [ ] Formattazione avanzata

### Fase 4: Integrazione
- [ ] Integrazione con sistema email
- [ ] Supporto per PDF multilingua
- [ ] API multilingua
- [ ] Documentazione utente

## Conclusione

Il sistema multilingua implementato offre:
- ✅ **Compatibilità** con il sistema esistente
- ✅ **Flessibilità** per personalizzazioni
- ✅ **Performance** ottimizzate
- ✅ **Facilità d'uso** per gli sviluppatori
- ✅ **Scalabilità** per future espansioni

L'implementazione è graduale e non rompe il funzionamento esistente, permettendo una migrazione progressiva dei componenti.
