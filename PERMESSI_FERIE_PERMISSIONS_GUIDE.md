# Permessi Ferie - Sistema di Permessi

## Panoramica

Il sistema di permessi per "Permessi Ferie" implementa una gerarchia di accesso basata sui ruoli per garantire che:
- **I manager** possano vedere e approvare tutti i permessi del team
- **Gli utenti regolari** possano vedere solo i propri permessi personali

## Funzionalità Implementate

### 1. Rilevamento Ruolo Manager
- Il sistema controlla automaticamente se l'utente corrente ha il ruolo "manager" 
- Prima controlla la tabella `profiles` per il ruolo manager
- Se non trovato in `profiles`, controlla la tabella `team` per il ruolo manager
- Questo controllo avviene al caricamento della pagina e determina le funzionalità disponibili

### 2. Filtro Permessi per Ruolo
- **Manager**: Vedono tutti i permessi del salone
- **Utenti regolari**: Vedono solo i propri permessi (filtrati per `member_id`)

### 3. Controlli di Approvazione
- Solo i manager possono approvare/rifiutare permessi
- I manager non possono approvare i propri permessi (controllo di sicurezza)
- Gli utenti regolari non vedono i pulsanti di approvazione

### 4. Indicatori Visivi
- **Badge "Manager"**: Mostrato nella navbar per i manager
- **Badge "Utente"**: Mostrato nella navbar per gli utenti regolari
- **Badge "Tuo"**: Mostrato accanto ai permessi personali dell'utente
- **Vista Manager/Personale**: Indicatore nel header della lista permessi

## Struttura del Codice

### Controllo Ruolo
```typescript
// In page.tsx - getSession()
// First check if user is manager in profiles table
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

let isUserManager = false;

if (!profileError && profileData?.role === 'manager') {
  isUserManager = true;
  console.log('👑 User is manager in profiles table');
} else {
  // If not manager in profiles, check team table
  const { data: teamData, error: teamError } = await supabase
    .from('team')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single();
  
  if (!teamError && teamData?.role === 'manager') {
    isUserManager = true;
    console.log('👑 User is manager in team table');
  }
}

setIsManager(isUserManager);
```

### Filtro Permessi
```typescript
// In fetchData()
if (!isUserManager && currentUserData) {
  const currentMember = formattedMembers.find(m => m.user_id === currentUserData.id);
  if (currentMember) {
    permissionsQuery = permissionsQuery.eq('member_id', currentMember.id);
  }
}
```

### Controllo Approvazione
```typescript
// In handleUpdatePermissionStatus()
if (!isManager) {
  toast({
    title: "Errore",
    description: "Solo i manager possono approvare o rifiutare permessi",
    variant: "destructive"
  });
  return;
}
```

## Logging e Debug

Il sistema include logging dettagliato per il debug:
- Controllo permessi utente
- Conteggio permessi caricati per stato e tipo
- Log delle operazioni di approvazione

## Sicurezza

1. **Controllo lato client**: I pulsanti di approvazione sono nascosti per utenti non-manager
2. **Controllo lato server**: Verifica del ruolo prima di permettere l'approvazione
3. **Filtro dati**: I permessi sono filtrati a livello di query per utenti non-manager
4. **Prevenzione auto-approvazione**: I manager non possono approvare i propri permessi

## Test del Sistema

Per testare il sistema:

1. **Login come Manager**:
   - Dovresti vedere il badge "Manager" nella navbar
   - Dovresti vedere tutti i permessi del team
   - Dovresti vedere i pulsanti "Approva"/"Rifiuta" per permessi in attesa

2. **Login come Utente Regolare**:
   - Dovresti vedere il badge "Utente" nella navbar
   - Dovresti vedere solo i tuoi permessi personali
   - Non dovresti vedere i pulsanti di approvazione
   - I tuoi permessi dovrebbero avere il badge "Tuo"

## Note Tecniche

- Il sistema usa `salon_id` per filtrare i dati per salone
- I permessi sono ordinati per data di creazione (più recenti prima)
- Il sistema supporta aggiornamenti in tempo reale
- Tutti i controlli di sicurezza sono implementati sia lato client che server 