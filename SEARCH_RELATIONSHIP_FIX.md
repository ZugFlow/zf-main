# Fix della Relazione Order-Services nella Ricerca

## Problema Identificato
L'errore principale era:
```
PGRST201: "Could not embed because more than one relationship was found for 'orders' and 'order_services'"
```

## Causa
Supabase non riusciva a determinare automaticamente quale relazione usare tra le tabelle `orders` e `order_services` perché probabilmente esistono multiple foreign key o relazioni.

## Soluzione Implementata
Specificato esplicitamente la foreign key nella query:

**Prima (non funzionante):**
```typescript
order_services(*)
```

**Dopo (funzionante):**
```typescript
order_services:order_services!order_id(*)
```

## Spiegazione della Sintassi
- `order_services:order_services!order_id(*)` specifica che:
  - `order_services` è l'alias per la relazione
  - `!order_id` indica di usare la foreign key `order_id` per la join
  - `(*)` seleziona tutti i campi dalla tabella collegata

## Risultati del Fix
- ✅ Risolto l'errore PGRST201
- ✅ Le query ora funzionano correttamente
- ✅ La ricerca può accedere ai servizi collegati agli appuntamenti
- ✅ I log mostrano che i clienti e team vengono trovati (2 risultati totali)

## Test Successivi
Ora la ricerca dovrebbe:
1. Trovare appuntamenti per nome, telefono, email, note, ecc.
2. Includere correttamente i servizi collegati
3. Mostrare i risultati nelle card appropriate

## Note Tecniche
Questo tipo di errore è comune quando:
- Ci sono multiple foreign key tra le stesse tabelle
- Le relazioni non sono univoche
- Supabase necessita di specificazioni esplicite per le join
