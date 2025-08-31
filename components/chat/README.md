# Chat Sidebar Components

Questo modulo fornisce componenti per una chat sidebar moderna e funzionale che può essere integrata in qualsiasi parte dell'applicazione.

## Componenti Disponibili

### 1. ChatSidebar
Il componente principale della chat sidebar.

```tsx
import { ChatSidebar } from '@/components/chat/ChatSidebar'

<ChatSidebar
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  className="custom-class"
/>
```

**Props:**
- `isOpen: boolean` - Controlla se la sidebar è aperta
- `onClose: () => void` - Callback chiamato quando la sidebar viene chiusa
- `className?: string` - Classi CSS personalizzate

### 2. ChatSidebarProvider
Provider per gestire lo stato globale della chat sidebar.

```tsx
import { ChatSidebarProvider } from '@/components/chat/ChatSidebarProvider'

function App() {
  return (
    <ChatSidebarProvider>
      {/* Il resto della tua app */}
    </ChatSidebarProvider>
  )
}
```

### 3. useChatSidebar
Hook per accedere alle funzioni della chat sidebar.

```tsx
import { useChatSidebar } from '@/components/chat/ChatSidebarProvider'

function MyComponent() {
  const { isOpen, openChat, closeChat, toggleChat } = useChatSidebar()
  
  return (
    <button onClick={toggleChat}>
      {isOpen ? 'Chiudi Chat' : 'Apri Chat'}
    </button>
  )
}
```

### 4. useChatTrigger
Hook che aggiunge scorciatoie da tastiera e metodi per controllare la chat.

```tsx
import { useChatTrigger } from '@/components/chat/useChatTrigger'

function MyComponent() {
  const { triggerChat, hideChat, toggleChat, isOpen } = useChatTrigger()
  
  // Scorciatoie da tastiera disponibili:
  // - Ctrl/Cmd + Shift + C: Toggle chat
  // - Escape: Chiudi chat (quando aperta)
  
  return (
    <button onClick={triggerChat}>
      Apri Chat
    </button>
  )
}
```

### 5. ChatFloatingButton
Pulsante flottante per aprire la chat sidebar.

```tsx
import { ChatFloatingButton } from '@/components/chat/ChatFloatingButton'

<ChatFloatingButton
  showBadge={true}
  badgeCount={5}
  position="bottom-right"
  className="custom-class"
/>
```

**Props:**
- `showBadge?: boolean` - Mostra un badge con il numero di messaggi
- `badgeCount?: number` - Numero di messaggi non letti
- `position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'` - Posizione del pulsante
- `className?: string` - Classi CSS personalizzate

### 6. ChatSidebarDemo
Componente demo che mostra come usare la chat sidebar.

```tsx
import { ChatSidebarDemo } from '@/components/chat/ChatSidebarDemo'

<ChatSidebarDemo />
```

## Caratteristiche

### Funzionalità Chat
- ✅ Lista gruppi chat con ricerca e filtri
- ✅ Messaggi in tempo reale
- ✅ Risposte ai messaggi
- ✅ Modifica ed eliminazione messaggi
- ✅ Creazione nuovi gruppi
- ✅ Gestione membri
- ✅ Interfaccia responsive

### Funzionalità UI/UX
- ✅ Design moderno con tema chiaro/scuro
- ✅ Animazioni fluide con Framer Motion
- ✅ Scorciatoie da tastiera
- ✅ Pulsante flottante personalizzabile
- ✅ Badge per messaggi non letti
- ✅ Posizionamento flessibile

### Integrazione
- ✅ Provider per stato globale
- ✅ Hook personalizzati
- ✅ Componenti riutilizzabili
- ✅ TypeScript support
- ✅ Compatibile con Supabase

## Esempio di Integrazione Completa

```tsx
// app/layout.tsx
import { ChatSidebarProvider } from '@/components/chat/ChatSidebarProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ChatSidebarProvider>
          {children}
        </ChatSidebarProvider>
      </body>
    </html>
  )
}

// app/page.tsx
import { ChatFloatingButton } from '@/components/chat/ChatFloatingButton'
import { useChatTrigger } from '@/components/chat/useChatTrigger'

export default function HomePage() {
  // Abilita le scorciatoie da tastiera
  useChatTrigger()
  
  return (
    <div>
      <h1>La tua app</h1>
      
      {/* Pulsante flottante per aprire la chat */}
      <ChatFloatingButton 
        showBadge={true}
        badgeCount={3}
        position="bottom-right"
      />
    </div>
  )
}
```

## Dipendenze

Assicurati di avere installate le seguenti dipendenze:

```json
{
  "dependencies": {
    "@carbon/icons-react": "^0.0.0",
    "framer-motion": "^0.0.0",
    "date-fns": "^0.0.0",
    "react-hot-toast": "^0.0.0"
  }
}
```

## Note

- La chat sidebar utilizza Supabase per la gestione dei dati
- Assicurati che il servizio chat sia configurato correttamente
- Il componente è ottimizzato per prestazioni con React.memo e useMemo
- Supporta temi chiari e scuri automaticamente 