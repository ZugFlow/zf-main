# 🐛 Debug Problema Membri

## 🔍 **Problema Identificato**

I select dei membri nel componente `OreLavorative` sono vuoti.

## 🔧 **Correzioni Implementate**

### 1. **Correzione Timing salonId**
```typescript
// ❌ PRIMA - Usava salonId che era ancora vuoto
.eq('salon_id', salonId)

// ✅ DOPO - Usa currentSalonId appena recuperato
.eq('salon_id', currentSalonId)
```

### 2. **Controllo salonId null**
```typescript
if (!currentSalonId) {
  console.error('❌ Salon ID not found');
  toast({
    title: "Errore",
    description: "Impossibile identificare il salone. Verifica di essere autenticato correttamente.",
    variant: "destructive"
  });
  return;
}
```

### 3. **Debug Logs Aggiunti**
```typescript
// Nel componente padre (page.tsx)
console.log('🔍 Page - Members loaded:', {
  membersCount: formattedMembers.length,
  members: formattedMembers,
  salonId: currentSalonId
});

// Nel componente OreLavorative
console.log('🔍 OreLavorative - Members data:', {
  membersCount: members.length,
  members: members,
  isManager,
  currentUser: currentUser?.id,
  salonId
});
```

### 4. **Controllo Membri Vuoti**
```typescript
if (members.length === 0) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Nessun membro del team trovato. Verifica che ci siano dipendenti attivi nel sistema.
      </AlertDescription>
    </Alert>
  );
}
```

## 🧪 **Test da Eseguire**

### 1. **Verifica Console**
1. Apri la console del browser (F12)
2. Vai alla sezione "Orari di Lavoro"
3. Controlla i log per vedere:
   - `🔍 Fetching members for salon_id:`
   - `🔍 Page - Members loaded:`
   - `🔍 OreLavorative - Members data:`

### 2. **Verifica Database**
```sql
-- Controlla se ci sono membri nel team
SELECT * FROM team WHERE salon_id = 'YOUR_SALON_ID' AND is_active = true;

-- Controlla se l'utente è nel team
SELECT * FROM team WHERE user_id = 'YOUR_USER_ID';

-- Controlla se l'utente è nei profiles
SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
```

### 3. **Verifica Autenticazione**
```typescript
// Aggiungi questo debug temporaneo
const { data: { user } } = await supabase.auth.getUser();
console.log('🔍 Current user:', user);
```

## 🔍 **Possibili Cause**

### 1. **Salon ID non trovato**
- L'utente non è associato a nessun salone
- Problema nella funzione `getSalonId()`

### 2. **Nessun membro nel team**
- Il salone non ha membri attivi
- I membri non sono marcati come `is_active = true`

### 3. **Problema di timing**
- I dati vengono caricati dopo il render del componente
- Race condition tra fetchData e render

### 4. **Problema di autenticazione**
- L'utente non è autenticato correttamente
- Session scaduta

## 🚀 **Soluzioni Alternative**

### 1. **Caricamento Condizionale**
```typescript
// Nel componente OreLavorative
if (isLoadingData || members.length === 0) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Caricamento membri del team...</span>
      </div>
    </div>
  );
}
```

### 2. **Retry Automatico**
```typescript
// Aggiungi retry se i membri sono vuoti
useEffect(() => {
  if (members.length === 0 && salonId) {
    console.log('🔄 Retrying members fetch...');
    fetchData();
  }
}, [members.length, salonId]);
```

### 3. **Fallback UI**
```typescript
// Mostra UI alternativa se non ci sono membri
if (members.length === 0) {
  return (
    <div className="text-center py-8">
      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Nessun Membro Trovato</h3>
      <p className="text-muted-foreground mb-4">
        Non ci sono dipendenti attivi nel sistema.
      </p>
      <Button onClick={() => window.location.href = '/impostazioni/membri'}>
        Gestisci Membri
      </Button>
    </div>
  );
}
```

## 📋 **Checklist Debug**

- [ ] Controlla console per errori
- [ ] Verifica che `salonId` sia corretto
- [ ] Controlla se ci sono membri nel database
- [ ] Verifica autenticazione utente
- [ ] Controlla se i membri sono attivi
- [ ] Verifica timing di caricamento dati

## 🎯 **Prossimi Passi**

1. **Eseguire i test** sopra indicati
2. **Controllare i log** nella console
3. **Verificare il database** per membri attivi
4. **Testare con utenti diversi** (manager vs dipendente)
5. **Verificare autenticazione** e session

Una volta identificata la causa specifica, possiamo implementare la soluzione appropriata! 🔧 