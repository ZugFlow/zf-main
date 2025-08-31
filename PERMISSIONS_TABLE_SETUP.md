# 🗓️ Configurazione Tabella Permissions

## 📋 **Passi per Creare la Tabella**

### 1. **Esegui il SQL in Supabase**
Vai su **Supabase Dashboard > SQL Editor** e esegui il file:
```
utils/supabase/db/create_permissions_table.sql
```

### 2. **Struttura della Tabella**
La tabella `permissions` include:

- **Collegamenti**:
  - `member_id` → `team(id)` (membro che richiede)
  - `salon_id` → `profiles(salon_id)` (salone per isolamento dati)
  - `approved_by` → `profiles(id)` (manager che approva)

- **Campi Principali**:
  - `type`: 'ferie', 'permesso', 'malattia', 'altro'
  - `status`: 'pending', 'approved', 'rejected'
  - `start_date`, `end_date`, `start_time`, `end_time`
  - `reason`, `notes`, `rejection_reason`

- **Timestamps**:
  - `created_at`, `updated_at` (automatico)
  - `approved_at` (quando approvato/rifiutato)

### 3. **Sicurezza (RLS)**
- **Isolamento per salone**: Ogni manager vede solo i permessi del proprio salone
- **Policy**: SELECT, INSERT, UPDATE, DELETE solo per il proprio `salon_id`

### 4. **Vincoli di Integrità**
- `end_date >= start_date`
- `end_time >= start_time` (se specificati)
- `salon_id` deve corrispondere al `member_id`

## 🔧 **Correzioni Necessarie nel Codice**

### **Problema Attuale**
Il codice ha errori di tipo TypeScript perché:
1. `salon_id` può essere `null` ma l'interfaccia richiede `string`
2. Alcuni oggetti `Permission` mancano di campi obbligatori

### **Soluzioni**

#### **Opzione A: Aggiorna l'Interfaccia**
```typescript
interface Permission {
  // ... altri campi
  salon_id: string | null; // Permetti null
  updated_at?: string; // Rendi opzionale
}
```

#### **Opzione B: Gestisci i Valori Null**
```typescript
// Nel codice, assicurati che salon_id sia sempre string
salon_id: salonId || 'default-salon-id'
```

#### **Opzione C: Validazione Pre-Insert**
```typescript
// Prima di inserire, valida che salonId esista
if (!salonId) {
  throw new Error('Salon ID non trovato');
}
```

## 🚀 **Prossimi Passi**

1. **Esegui il SQL** per creare la tabella
2. **Scegli una soluzione** per gli errori TypeScript
3. **Testa la funzionalità** creando un permesso
4. **Verifica l'isolamento** tra diversi saloni

## 📊 **Verifica Funzionamento**

Dopo aver creato la tabella, dovresti vedere:
- ✅ Nessun errore "relation does not exist"
- ✅ Dati reali invece dei mock
- ✅ Isolamento corretto per salone
- ✅ Aggiornamento automatico di `updated_at`

## 🆘 **Se Hai Problemi**

1. **Controlla i log** della console per errori
2. **Verifica le policy RLS** in Supabase
3. **Controlla che `salon_id`** sia presente in `profiles`
4. **Assicurati che i membri** abbiano `salon_id` corretto in `team` 