# Guida per Risolvere i Problemi di Sessione Scaduta

## 🔍 Problema Identificato

Hai segnalato che dopo alcuni minuti di inattività, devi fare refresh per caricare i dati. Questo è causato da:

1. **Sessioni Supabase che scadono**
2. **Token JWT che diventano invalidi**
3. **Connessioni real-time che si disconnettono**
4. **Mancanza di gestione automatica degli errori di sessione**

## ✅ Soluzioni Implementate

### 1. **Miglioramento Configurazione Client Supabase**

Ho aggiornato `utils/supabase/client.ts` con:
- ✅ **Heartbeat ogni 30 secondi** per mantenere viva la connessione
- ✅ **Backoff esponenziale** per la riconnessione automatica
- ✅ **Timeout ottimizzato** a 20 secondi per evitare blocchi
- ✅ **Riconnessione automatica** delle connessioni WebSocket

### 2. **Nuovo Hook useSupabaseQuery**

Creato `hooks/useSupabaseQuery.ts` con:
- ✅ **Rilevamento automatico errori di sessione**
- ✅ **Refresh automatico dei token JWT**
- ✅ **Retry automatico delle query fallite**
- ✅ **Gestione intelligente degli errori**

### 3. **Come Usare il Nuovo Hook**

#### Esempio di utilizzo nei componenti:

```typescript
import { useSupabaseWithRetry } from '@/hooks/useSupabaseQuery';

export default function MyComponent() {
  const { executeWithRetry, loading } = useSupabaseWithRetry();
  
  const loadData = async () => {
    const supabase = createClient();
    
    // Questa query verrà automaticamente ritentata se la sessione è scaduta
    const result = await executeWithRetry(async () => {
      return await supabase
        .from('my_table')
        .select('*')
        .eq('id', 123);
    });
    
    if (result.error) {
      console.error('Errore definitivo:', result.error);
    } else {
      console.log('Dati caricati:', result.data);
    }
  };
  
  return (
    <div>
      {loading && <p>Caricamento...</p>}
      <button onClick={loadData}>Carica Dati</button>
    </div>
  );
}
```

## 🔧 Componenti da Aggiornare

Per completare la risoluzione del problema, consiglio di aggiornare questi componenti:

### 1. **OnlineBookingForm.tsx**
```typescript
// Sostituire le chiamate dirette a Supabase con:
const { executeWithRetry, loading } = useSupabaseWithRetry();

const loadInitialData = async () => {
  const supabase = createClient();
  
  const servicesResult = await executeWithRetry(() =>
    supabase
      .from('services')
      .select('id, name, price, duration, description')
      .eq('salon_id', salonId)
      .eq('status', 'Attivo')
      .eq('visible_online', true)
  );
  
  // Gestire i risultati...
};
```

### 2. **Altri Componenti Critici**
- `components/InvoiceModal.tsx`
- `app/utils/fatture.ts`
- Tutti i componenti che fanno chiamate dirette a Supabase

## 🚀 Test della Soluzione

Per testare che il problema è risolto:

1. **Apri il gestionale**
2. **Lascia il tab aperto per 10+ minuti**
3. **Torna al tab e prova a fare operazioni**
4. **Verifica nella console i log di riconnessione automatica**

I log dovrebbero mostrare:
```
🔄 [useSupabaseQuery] Session error detected, attempting refresh
✅ [useSupabaseQuery] Session refreshed, retrying query
```

## 📋 Checklist Implementazione

- ✅ **Client Supabase ottimizzato** (fatto)
- ✅ **Hook useSupabaseQuery creato** (fatto)  
- ✅ **Hook useSessionManager già presente** (verificato)
- ⏳ **Aggiornare OnlineBookingForm** (prossimo passo)
- ⏳ **Aggiornare altri componenti critici** (prossimo passo)
- ⏳ **Test completo** (da fare)

## 🎯 Risultati Attesi

Dopo l'implementazione completa:
- ✅ **Niente più blocchi** in caricamento infinito
- ✅ **Riconnessione automatica** trasparente
- ✅ **Sessione sempre valida** senza refresh manuale
- ✅ **Esperienza utente fluida** senza interruzioni
