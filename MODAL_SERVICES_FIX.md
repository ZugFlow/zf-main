# Fix per il caricamento dei servizi nel modal di modifica

## Problema identificato

Quando si cliccava su alcune card degli appuntamenti, il modal di modifica non mostrava i servizi associati, mentre per altre card funzionava correttamente.

## Cause del problema

1. **Logica di caricamento condizionale**: Il modal aveva una condizione che impediva il ricaricamento dei servizi quando si apriva per un appuntamento diverso:
   ```typescript
   if (services.length === 0 || originalServices.length === 0) {
     loadServicesFromDatabase();
   }
   ```

2. **Mancanza di fallback**: Se un appuntamento non aveva servizi nella tabella `order_services`, il modal non mostrava nulla, anche se l'appuntamento aveva un servizio nel campo legacy `servizio`.

3. **Reset incompleto**: Quando cambiava l'appuntamento, non tutti gli stati venivano resettati correttamente.

## Soluzioni implementate

### 1. Caricamento sempre attivo
Rimosso il controllo condizionale e ora i servizi vengono sempre caricati dal database quando si apre il modal:

```typescript
// Carica sempre i servizi dal database quando si apre il modal
// Questo assicura che i servizi siano sempre aggiornati per ogni appuntamento
loadServicesFromDatabase();
```

### 2. Reset robusto degli stati
Aggiunto un reset completo di tutti gli stati quando cambia l'appuntamento:

```typescript
useEffect(() => {
  if (appointment && isOpen) {
    // Reset services when appointment changes
    setServices([]);
    setOriginalServices([]);
    setServicesModified(false);
    setIsAddingService(false);
    setNewServiceName('');
    setNewServicePrice('');
  }
}, [appointment?.id, isOpen]);
```

### 3. Fallback per servizi legacy
Aggiunto un sistema di fallback per gestire appuntamenti che hanno servizi solo nel campo legacy:

```typescript
// Fallback: se non ci sono servizi nel database ma c'è un servizio nel campo legacy
if (normalizedServices.length === 0 && appointment.servizio) {
  console.log('No services found in database, using legacy servizio field:', appointment.servizio);
  const fallbackService = {
    id: 'legacy_service',
    name: appointment.servizio,
    price: 0 // Prezzo sconosciuto per servizi legacy
  };
  normalizedServices.push(fallbackService);
}
```

### 4. Fallback per servizi dal componente padre
Aggiunto un fallback per usare i servizi dal campo `services` dell'appuntamento se non ci sono nel database:

```typescript
// Fallback: se non ci sono servizi nel database ma ci sono servizi nel campo services dell'appuntamento
if (normalizedServices.length === 0 && appointment.services && appointment.services.length > 0) {
  console.log('No services found in database, using services from appointment object:', appointment.services);
  normalizedServices.push(...appointment.services);
}
```

### 5. Log di debug migliorati
Aggiunti log dettagliati per facilitare il debug futuro:

```typescript
console.log('Appointment ID:', appointment.id);
console.log('Appointment name:', appointment.nome);
console.log('Loading services from database for appointment:', appointment.id);
console.log('Number of services found:', orderServices?.length || 0);
```

## Risultato

Ora tutti gli appuntamenti dovrebbero mostrare correttamente i loro servizi associati nel modal di modifica, indipendentemente da come sono stati creati o salvati nel database.

## File modificati

- `app/(dashboard)/(private)/crm/dashboard/_CreateOrder/modaleditcard.tsx` 