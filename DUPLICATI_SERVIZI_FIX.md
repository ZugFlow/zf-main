# Fix Duplicazioni Servizi - Documentazione

## Problema Identificato

Quando si aggiunge un servizio a un appuntamento esistente e si clicca su "Salva modifiche", si verificavano potenziali duplicazioni dovute a:

1. **Gestione inconsistente degli ID**: I servizi esistenti usavano `service_id` mentre i nuovi usavano `id` con prefisso `temp_`
2. **Aggiornamento duplicato dello stato**: Lo stato veniva aggiornato due volte nella stessa funzione
3. **Mancanza di controlli di unicità**: Nessun controllo per verificare se un servizio con lo stesso `service_id` esisteva già
4. **Race condition**: L'aggiornamento dello stato locale avveniva prima delle operazioni del database

## Soluzioni Implementate

### 1. **Correzione della funzione `handleSaveServices`** (`day.tsx`)

**Prima:**
```typescript
// Gestione complessa con separazione nuovi/esistenti
const newServices = services.filter(s => s.id.startsWith('temp_'));
const existingServices = services.filter(s => !s.id.startsWith('temp_'));

// Operazioni separate per inserimento, aggiornamento e cancellazione
```

**Dopo:**
```typescript
// Approccio semplificato: elimina tutto e reinserisci
const { error: deleteError } = await supabase
  .from('order_services')
  .delete()
  .eq('order_id', selectedAppointment.id);

// Inserisci tutti i servizi in una volta
const serviceInserts = services.map(service => ({
  order_id: selectedAppointment.id,
  service_id: Number(service.id.replace('temp_', '')),
  servizio: service.name,
  price: service.price
}));
```

### 2. **Miglioramento del caricamento servizi** (`modaleditcard.tsx`)

**Aggiunto controllo duplicati:**
```typescript
// Normalizza i servizi dal database e rimuovi eventuali duplicati
const serviceMap = new Map();
(orderServices || []).forEach((orderService: any) => {
  const serviceId = String(orderService.service_id);
  // Se il servizio esiste già, mantieni quello con il prezzo più alto (più recente)
  if (!serviceMap.has(serviceId) || serviceMap.get(serviceId).price < orderService.price) {
    serviceMap.set(serviceId, {
      id: serviceId,
      name: orderService.servizio || 'Servizio sconosciuto',
      price: orderService.price
    });
  }
});
```

### 3. **Controllo aggiuntivo lato client** (`modaleditcard.tsx`)

**Aggiunto controllo per servizi identici:**
```typescript
// Controllo aggiuntivo per prevenire duplicazioni
const isDuplicate = services.some(s => 
  s.name === selectedService.name && s.price === selectedService.price
);

if (isDuplicate) {
  toast({ 
    title: "Servizio duplicato",
    description: "Un servizio identico è già presente nell'appuntamento",
    variant: "destructive"
  });
  return;
}
```

### 4. **Constraint di unicità a livello database** (`add_unique_constraint_order_services.sql`)

**Nuovo file SQL:**
```sql
-- Rimuovi duplicati esistenti
DELETE FROM order_services 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM order_services 
  GROUP BY order_id, service_id
);

-- Aggiungi constraint di unicità
ALTER TABLE order_services 
ADD CONSTRAINT unique_order_service 
UNIQUE (order_id, service_id);

-- Aggiungi indice per performance
CREATE INDEX IF NOT EXISTS idx_order_services_order_service 
ON order_services (order_id, service_id);
```

## Benefici delle Modifiche

1. **Eliminazione duplicazioni**: Il constraint di database previene duplicazioni a livello di sistema
2. **Performance migliorata**: Approccio "delete + insert" più efficiente di multiple operazioni
3. **Consistenza dei dati**: Rimozione automatica dei duplicati esistenti
4. **UX migliorata**: Feedback immediato all'utente in caso di tentativo di duplicazione
5. **Manutenibilità**: Codice più semplice e comprensibile

## Come Applicare le Modifiche

1. **Eseguire lo script SQL** per aggiungere il constraint di unicità
2. **Riavviare l'applicazione** per applicare le modifiche al codice
3. **Testare** aggiungendo servizi a un appuntamento esistente

## Test Consigliati

1. Aggiungere lo stesso servizio più volte a un appuntamento
2. Modificare servizi esistenti e aggiungerne di nuovi
3. Verificare che i duplicati esistenti vengano rimossi automaticamente
4. Controllare che le performance non siano degradate

## Note Tecniche

- Il constraint di database è la protezione più robusta contro le duplicazioni
- Il controllo lato client migliora l'esperienza utente
- L'approccio "delete + insert" è più semplice e meno soggetto a errori
- La rimozione automatica dei duplicati esistenti garantisce la pulizia dei dati 