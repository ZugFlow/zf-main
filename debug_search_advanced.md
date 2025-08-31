# Test Ricerca Appuntamenti - Debug Avanzato

## Test Aggiunti per Diagnosticare il Problema

### 1. Test Connettività Database ✅
- Test query di base senza filtri
- Verifica esistenza tabella `orders`
- Test permessi di lettura

### 2. Test Salon ID ✅
- Verifica se il salon_id è corretto
- Test con tutti gli ordini per quel salon (inclusi task)
- Confronto con ordini globali

### 3. Test User ID / RLS (Row Level Security) ⭐ NUOVO
- Test con filtro `user_id` 
- Verifica se Row Level Security blocca le query
- Controllo sessione utente

### 4. Test Query Structure ⭐ NUOVO
- Query semplificata solo per nome cliente
- Test separato per ricerca nei servizi
- Verifica query `or()` complessa

## Come Testare

1. Apri la console browser (F12)
2. Apri la ricerca e digita almeno 2 caratteri
3. Controlla i log in questo ordine:

```
🏪 Salon ID obtained for search: [salon-id]
👤 User session for search: [user-info]
🔍 Starting search with: [search-params]
🧪 Testing basic orders query...
🧪 Basic query result: [basic-test]
🧪 All orders test (including tasks): [all-orders]
🧪 Global orders test (any salon): [global-orders]
🧪 User orders test: [user-orders]
🔑 Current user for search: [user-id]
🔍 Testing simplified orders search...
🔍 Simple orders test result: [simple-test]
🔍 Testing services search...
🔍 Services test result: [services-test]
🔍 Search Results: [final-results]
```

## Possibili Problemi e Soluzioni

### Problema 1: Nessun ordine nel database
**Sintomo**: Tutti i test restituiscono count: 0
**Soluzione**: Verificare se ci sono dati nel database

### Problema 2: Salon ID errato
**Sintomo**: Global orders > 0, ma salon orders = 0  
**Soluzione**: Verificare il salon_id nel database

### Problema 3: Row Level Security (RLS)
**Sintomo**: Global orders > 0, user orders = 0
**Soluzione**: Query devono includere user_id

### Problema 4: Errori di permessi
**Sintomo**: Error nei test di base
**Soluzione**: Verificare politiche di sicurezza Supabase

### Problema 5: Query OR troppo complessa
**Sintomo**: Simple test funziona, main query fallisce
**Soluzione**: Semplificare query o dividerla

## Status Debug
- ✅ Test di base implementati
- ✅ Test RLS implementati  
- ✅ Query semplificate implementate
- ✅ User session check implementato
- ✅ Multi-level debugging implementato

La ricerca ora dovrebbe fornire informazioni dettagliate su cosa non funziona.
