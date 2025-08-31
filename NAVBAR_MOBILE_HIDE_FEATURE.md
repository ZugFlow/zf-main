# Funzionalità: Nascondere la Navbar nella Sezione Mobile Permessi Ferie

## Panoramica
Questa funzionalità nasconde automaticamente la navbar principale quando l'utente accede alla sezione mobile dei permessi ferie, fornendo un'esperienza utente più pulita e dedicata.

## Modifiche Implementate

### 1. Navbar Component (`navbar.tsx`)
- **Aggiunta prop `hideNavbar`**: Nuova prop opzionale per controllare la visibilità della navbar
- **Logica condizionale**: La navbar viene renderizzata solo quando `hideNavbar` è `false`
- **Wrapping con Fragment**: Utilizzo di `<>` per evitare wrapper div non necessari

```typescript
interface NavbarProps {
  // ... altre props
  hideNavbar?: boolean;
}

export function Navbar({
  // ... altre props
  hideNavbar = false,
}: NavbarProps) {
  return (
    <>
      {!hideNavbar && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
          {/* Contenuto navbar */}
        </div>
      )}
      {/* Altri componenti */}
    </>
  );
}
```

### 2. Dashboard Page (`page.tsx`)
- **Import `useIsMobile`**: Hook per rilevare dispositivi mobili
- **Logica di controllo**: Determina quando nascondere la navbar
- **Padding dinamico**: Rimuove il padding-top quando la navbar è nascosta

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

export default function DashboardPage() {
  const isMobile = useIsMobile();
  
  // Determina se nascondere la navbar (solo quando si è nella sezione mobile dei permessi ferie)
  const shouldHideNavbar = isMobile && showPermessiFerie;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        // ... altre props
        hideNavbar={shouldHideNavbar}
      />
      <div className="flex-1 flex flex-col gap-4" style={{ paddingTop: shouldHideNavbar ? '0px' : '64px' }}>
        {/* Contenuto */}
      </div>
    </div>
  );
}
```

### 3. Mobile Component (`mobile.tsx`)
- **Pulsante Back**: Aggiunto pulsante per tornare alla dashboard
- **Header dedicato**: Header mobile con titolo e pulsante di ritorno
- **Prop `onBack`**: Funzione per gestire il ritorno alla dashboard

```typescript
interface PermessiFerieMobileProps {
  // ... altre props
  onBack?: () => void;
}

export default function PermessiFerieMobile({
  // ... altre props
  onBack
}: PermessiFerieMobileProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <div className="sticky top-0 z-30 bg-background border-b border-border shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Permessi & Ferie</h1>
              <p className="text-sm text-muted-foreground">
                {isManager ? 'Gestione Team' : 'I tuoi permessi'}
              </p>
            </div>
          </div>
          {/* Pulsante Nuovo */}
        </div>
      </div>
      {/* Contenuto */}
    </div>
  );
}
```

### 4. PermessiFerie Page (`page.tsx`)
- **Funzione onBack**: Implementata la logica per tornare alla dashboard
- **Passaggio della prop**: Passa la funzione `onBack` al componente mobile

```typescript
// Show mobile version on mobile devices or when forced
if (isMobile || forceMobile) {
  return (
    <PermessiFerieMobile
      // ... altre props
      onBack={() => {
        // Torna alla dashboard
        if (typeof window !== 'undefined') {
          window.history.back();
        }
      }}
    />
  );
}
```

## Comportamento

### Desktop
- La navbar rimane sempre visibile
- Padding-top di 64px per compensare la navbar fissa

### Mobile - Sezioni Normali
- La navbar rimane visibile
- Padding-top di 64px per compensare la navbar fissa

### Mobile - Sezione Permessi Ferie
- La navbar viene nascosta automaticamente
- Padding-top rimosso (0px)
- Header mobile dedicato con pulsante di ritorno
- Esperienza full-screen ottimizzata per mobile

## Vantaggi

1. **Esperienza Mobile Ottimizzata**: Più spazio per il contenuto su schermi piccoli
2. **Navigazione Intuitiva**: Pulsante back chiaro per tornare alla dashboard
3. **Consistenza**: Comportamento prevedibile e coerente
4. **Performance**: Nessun re-render non necessario della navbar

## Compatibilità

- ✅ Desktop: Nessun cambiamento
- ✅ Tablet: Comportamento desktop
- ✅ Mobile: Navbar nascosta solo nella sezione permessi ferie
- ✅ Browser: Supporto completo per `window.history.back()`

## Note Tecniche

- Utilizza `useIsMobile` hook per rilevare dispositivi mobili
- Condizionale basato su `isMobile && showPermessiFerie`
- Gestione sicura di `window.history.back()` con controllo `typeof window`
- Mantiene la struttura esistente senza breaking changes 