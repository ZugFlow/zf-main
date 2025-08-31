# Guida alle Notifiche Globali con IBM Carbon

## Panoramica

Il sistema di notifiche globali utilizza i componenti IBM Carbon per fornire un'esperienza utente coerente e professionale. Le notifiche appaiono nell'angolo superiore destro dello schermo e supportano diversi tipi, azioni e stati di caricamento.

## Caratteristiche

- ✅ **Tipi di notifica**: Success, Error, Warning, Info
- ✅ **Stati di caricamento**: Con spinner animato
- ✅ **Azioni personalizzate**: Pulsanti con callback
- ✅ **Auto-chiusura**: Configurabile con timeout personalizzato
- ✅ **Gestione asincrona**: Helper per operazioni async con loading
- ✅ **Design IBM Carbon**: Stile coerente con il design system
- ✅ **Responsive**: Adattivo a tutti i dispositivi

## Installazione

Il sistema è già integrato nel layout principale. Assicurati che il `NotificationProvider` sia presente nel layout:

```tsx
// app/(dashboard)/layout.tsx
import { NotificationProvider } from "@/components/ui/carbon-notification";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider maxNotifications={5}>
      {children}
    </NotificationProvider>
  );
}
```

## Utilizzo Base

### 1. Importa l'hook

```tsx
import { useCarbonNotifications } from '@/hooks/use-carbon-notifications';
```

### 2. Usa l'hook nel componente

```tsx
const notifications = useCarbonNotifications();
```

### 3. Mostra notifiche

```tsx
// Notifica di successo
notifications.showSuccess("Operazione completata", "I dati sono stati salvati");

// Notifica di errore
notifications.showError("Errore", "Impossibile salvare i dati");

// Notifica di warning
notifications.showWarning("Attenzione", "Alcuni campi sono vuoti");

// Notifica informativa
notifications.showInfo("Info", "Sistema aggiornato");
```

## Utilizzo Avanzato

### Notifiche con Loading

```tsx
// Mostra loading
const loadingId = notifications.showLoading("Caricamento...", "Elaborazione dati");

// Simula operazione asincrona
setTimeout(() => {
  // Aggiorna a successo
  notifications.updateLoading(loadingId, 'success', "Completato!", "Operazione riuscita");
  
  // Oppure a errore
  // notifications.updateLoading(loadingId, 'error', "Errore!", "Operazione fallita");
}, 3000);
```

### Operazioni Asincrone con Loading Automatico

```tsx
const handleSaveData = async () => {
  await notifications.withLoading(
    "Salvataggio in corso...",
    async () => {
      // La tua operazione asincrona
      await saveDataToDatabase();
    },
    "Dati salvati con successo!",
    "Errore durante il salvataggio"
  );
};
```

### Notifiche con Azioni

```tsx
notifications.addNotification({
  title: "Nuovo messaggio",
  subtitle: "Hai ricevuto un messaggio da Mario",
  type: "info",
  actionLabel: "Visualizza",
  onAction: () => {
    // Azione da eseguire
    openMessage();
  },
  duration: 10000, // 10 secondi
});
```

### Notifiche Personalizzate

```tsx
notifications.addNotification({
  title: "Titolo personalizzato",
  subtitle: "Sottotitolo opzionale",
  type: "success", // 'success' | 'error' | 'warning' | 'info'
  actionLabel: "Azione", // Opzionale
  onAction: () => console.log("Azione eseguita"), // Opzionale
  autoClose: true, // Default: true
  duration: 5000, // Default: 5000ms
  loading: false, // Default: false
});
```

## API Completa

### Metodi Principali

| Metodo | Descrizione |
|--------|-------------|
| `showSuccess(title, subtitle?)` | Notifica di successo |
| `showError(title, subtitle?)` | Notifica di errore |
| `showWarning(title, subtitle?)` | Notifica di warning |
| `showInfo(title, subtitle?)` | Notifica informativa |
| `showLoading(title, subtitle?)` | Notifica con loading |
| `updateLoading(id, type, title, subtitle?)` | Aggiorna notifica loading |
| `withLoading(message, operation, successMsg?, errorMsg?)` | Helper per operazioni async |

### Metodi di Gestione

| Metodo | Descrizione |
|--------|-------------|
| `addNotification(notification)` | Aggiunge notifica personalizzata |
| `removeNotification(id)` | Rimuove notifica specifica |
| `clearAll()` | Rimuove tutte le notifiche |

### Proprietà della Notifica

```tsx
interface GlobalNotification {
  id: string;                    // ID univoco (generato automaticamente)
  title: string;                 // Titolo della notifica
  subtitle?: string;             // Sottotitolo opzionale
  type: 'success' | 'error' | 'warning' | 'info';
  actionLabel?: string;          // Testo del pulsante azione
  onAction?: () => void;         // Callback per l'azione
  autoClose?: boolean;           // Auto-chiusura (default: true)
  duration?: number;             // Durata in ms (default: 5000)
  loading?: boolean;             // Mostra spinner (default: false)
}
```

## Esempi Pratici

### Salvataggio Dati

```tsx
const handleSave = async () => {
  await notifications.withLoading(
    "Salvataggio in corso...",
    async () => {
      await saveData();
    },
    "Dati salvati con successo!",
    "Errore durante il salvataggio"
  );
};
```

### Upload File

```tsx
const handleUpload = async (file: File) => {
  const loadingId = notifications.showLoading("Upload in corso...", "Elaborazione file...");
  
  try {
    await uploadFile(file);
    notifications.updateLoading(loadingId, 'success', "Upload completato!", "File caricato con successo");
  } catch (error) {
    notifications.updateLoading(loadingId, 'error', "Upload fallito!", "Errore durante il caricamento");
  }
};
```

### Notifica di Sistema

```tsx
// Notifica automatica quando l'utente torna online
window.addEventListener('online', () => {
  notifications.showSuccess("Connessione ripristinata", "Sei di nuovo online");
});

// Notifica quando l'utente va offline
window.addEventListener('offline', () => {
  notifications.showWarning("Connessione persa", "Verifica la tua connessione internet");
});
```

## Personalizzazione

### Modificare il Numero Massimo di Notifiche

```tsx
<NotificationProvider maxNotifications={10}>
  {children}
</NotificationProvider>
```

### Modificare la Posizione

Modifica il CSS nel componente `carbon-notification.tsx`:

```tsx
<div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
  {/* Cambia top-4 right-4 per modificare la posizione */}
</div>
```

### Stili Personalizzati

Le notifiche utilizzano i componenti IBM Carbon, quindi ereditano automaticamente il tema dell'applicazione. Per personalizzazioni aggiuntive, modifica il file `carbon-notification.tsx`.

## Best Practices

1. **Usa messaggi chiari e concisi**
2. **Fornisci sempre un feedback per operazioni asincrone**
3. **Non sovraccaricare l'utente con troppe notifiche**
4. **Usa il tipo appropriato per ogni situazione**
5. **Fornisci azioni quando necessario**
6. **Testa su dispositivi mobili**

## Troubleshooting

### Notifiche non appaiono

1. Verifica che il `NotificationProvider` sia presente nel layout
2. Controlla che l'hook sia usato all'interno del provider
3. Verifica che non ci siano errori nella console

### Notifiche si sovrappongono

1. Riduci il numero massimo di notifiche
2. Aumenta la durata delle notifiche
3. Usa `clearAll()` per rimuovere notifiche vecchie

### Performance

1. Non creare troppe notifiche contemporaneamente
2. Usa `clearAll()` periodicamente
3. Evita notifiche con durata infinita

## Integrazione con Esistente

Il sistema è compatibile con il sistema di toast esistente. Puoi usare entrambi contemporaneamente o migrare gradualmente al nuovo sistema Carbon. 