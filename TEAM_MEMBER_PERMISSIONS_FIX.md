# Fix per Permessi Team Members - Accesso Appuntamenti e Calendario

## Problema Identificato

Quando un manager crea un nuovo collaboratore dal profilo, il collaboratore non riesce a vedere gli appuntamenti e il calendario day view. Questo succede perché:

1. **Mancanza di Permessi di Default**: I nuovi team members vengono creati solo nella tabella `team` ma non ricevono permessi di default nella tabella `permissions`
2. **Sistema di Permessi**: Il sistema usa una tabella `permissions` con struttura:
   - `id`: UUID (auto-generated)
   - `user_id`: UUID (riferimento a team.user_id)
   - `permesso`: TEXT (chiave del permesso)
   - `valore`: BOOLEAN (valore del permesso, default true)
   - `created_at`: TIMESTAMP WITH TIME ZONE
   - `updated_at`: TIMESTAMP WITH TIME ZONE

3. **Controllo Permessi**: Il sistema verifica i permessi tramite `usePermission.ts` che controlla se l'utente ha `canViewAppointments` per vedere il calendario

## Soluzione Implementata

### 1. Modifica API Creazione Team Member

**File**: `app/api/member/create-members/route.ts`

Aggiunto il codice per creare permessi di default quando viene creato un nuovo team member:

```typescript
// 3. Crea i permessi di default per il nuovo membro del team
const now = new Date().toISOString();
const defaultPermissions = [
  // Calendario e Appuntamenti - permessi base per vedere appuntamenti e calendario
  { user_id, permesso: 'canViewAppointments', valore: true, created_at: now, updated_at: now },
  { user_id, permesso: 'canCreateAppointments', valore: true, created_at: now, updated_at: now },
  { user_id, permesso: 'canEditAppointments', valore: true, created_at: now, updated_at: now },
  // Prenotazioni Online - permessi base
  { user_id, permesso: 'canViewOnlineBookings', valore: true, created_at: now, updated_at: now },
  { user_id, permesso: 'canManageOnlineBookings', valore: true, created_at: now, updated_at: now },
  // Clienti - permessi base
  { user_id, permesso: 'canViewClients', valore: true, created_at: now, updated_at: now },
  { user_id, permesso: 'canCreateClients', valore: true, created_at: now, updated_at: now },
  { user_id, permesso: 'canEditClients', valore: true, created_at: now, updated_at: now },
  // Servizi - permessi base
  { user_id, permesso: 'canViewServices', valore: true, created_at: now, updated_at: now },
  // Finanze - permessi base (solo visualizzazione)
  { user_id, permesso: 'canViewFinance', valore: true, created_at: now, updated_at: now },
  // Magazzino - permessi base (solo visualizzazione)
  { user_id, permesso: 'canViewInventory', valore: true, created_at: now, updated_at: now }
];
```

### 2. Aggiornamento Tabella Permissions

**File**: `utils/supabase/db/create_system_permissions_table.sql`

Script SQL per aggiornare la tabella `permissions` esistente:

```sql
-- Add updated_at column if it doesn't exist
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraint to prevent duplicate permissions for the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_user_permesso 
ON permissions(user_id, permesso);

-- Add RLS policies and triggers
-- ... (resto dello script)
```

### 3. Script per Permessi Esistenti

**File**: `utils/supabase/db/add_default_permissions_to_existing_members.sql`

Script per aggiungere permessi di default ai team members esistenti che non hanno permessi:

```sql
-- Aggiunge permessi di default ai team members senza permessi
WITH users_without_permissions AS (
    SELECT t.user_id, t.name, t.email
    FROM team t
    LEFT JOIN permissions p ON t.user_id = p.user_id
    WHERE t.is_active = true
    GROUP BY t.user_id, t.name, t.email
    HAVING COUNT(p.id) = 0
)
INSERT INTO permissions (user_id, permesso, valore, created_at, updated_at)
SELECT 
    user_id, 
    permesso, 
    valore,
    NOW() as created_at,
    NOW() as updated_at
FROM default_permissions;
```

## Permessi di Default Assegnati

I nuovi team members ricevono automaticamente questi permessi:

### Calendario e Appuntamenti
- ✅ `canViewAppointments` - Visualizza Appuntamenti
- ✅ `canCreateAppointments` - Crea Appuntamenti  
- ✅ `canEditAppointments` - Modifica Appuntamenti

### Prenotazioni Online
- ✅ `canViewOnlineBookings` - Visualizza Prenotazioni Online
- ✅ `canManageOnlineBookings` - Gestisci Prenotazioni Online

### Clienti
- ✅ `canViewClients` - Visualizza Clienti
- ✅ `canCreateClients` - Crea Clienti
- ✅ `canEditClients` - Modifica Clienti

### Altri Moduli
- ✅ `canViewServices` - Visualizza Servizi
- ✅ `canViewFinance` - Visualizza Finanze
- ✅ `canViewInventory` - Visualizza Magazzino

## Come Applicare la Soluzione

### 1. Eseguire Script SQL

Eseguire questi script nel database Supabase:

```bash
# 1. Aggiornare la tabella permissions esistente
psql -d your_database -f utils/supabase/db/create_system_permissions_table.sql

# 2. Aggiungere permessi ai team members esistenti
psql -d your_database -f utils/supabase/db/add_default_permissions_to_existing_members.sql
```

### 2. Verificare i Permessi

Controllare che i team members abbiano i permessi necessari:

```sql
SELECT 
    t.name,
    t.email,
    COUNT(p.id) as permission_count,
    STRING_AGG(p.permesso, ', ' ORDER BY p.permesso) as permissions
FROM team t
LEFT JOIN permissions p ON t.user_id = p.user_id
WHERE t.is_active = true
GROUP BY t.user_id, t.name, t.email
ORDER BY t.name;
```

### 3. Testare la Creazione

1. Creare un nuovo team member dal profilo del manager
2. Verificare che il nuovo membro possa accedere al calendario e agli appuntamenti
3. Controllare che i permessi siano stati creati nel database

## Gestione Permessi Avanzata

### Modificare Permessi

I manager possono modificare i permessi dei team members tramite:
- **Impostazioni > Permessi** nel dashboard
- Selezionare il team member dalla lista
- Attivare/disattivare i permessi desiderati

### Permessi Manager

I manager (titolari) hanno automaticamente tutti i permessi senza bisogno di essere nella tabella `permissions`.

### Permessi Personalizzati

È possibile creare permessi personalizzati aggiungendoli:
1. In `PERMISSION_GROUPS` in `Permessi.tsx`
2. Negli array di default in `usePermission.ts`
3. Nei controlli delle pagine/componenti

## Troubleshooting

### Se un Team Member non vede il Calendario

1. **Verificare Permessi**: Controllare se ha `canViewAppointments` nella tabella `permissions`
2. **Verificare Team**: Controllare se è attivo nella tabella `team`
3. **Verificare Role**: Controllare se ha `role: 'member'` nella tabella `team`

### Query di Debug

```sql
-- Verificare permessi di un utente specifico
SELECT * FROM permissions WHERE user_id = 'user-uuid-here';

-- Verificare team member
SELECT * FROM team WHERE user_id = 'user-uuid-here';

-- Verificare tutti i permessi di tutti i team members
SELECT 
    t.name,
    t.email,
    p.permesso,
    p.valore
FROM team t
LEFT JOIN permissions p ON t.user_id = p.user_id
WHERE t.is_active = true
ORDER BY t.name, p.permesso;
```

### Risoluzione Errori Comuni

#### Errore: "column updated_at does not exist"
Se si verifica questo errore, eseguire prima lo script `create_system_permissions_table.sql` per aggiungere la colonna mancante.

#### Errore: "duplicate key value violates unique constraint"
Questo errore indica che esistono già permessi duplicati. Lo script gestisce automaticamente questo caso con `ON CONFLICT`.

## Note Importanti

- I permessi sono ereditati automaticamente dai manager/titolari
- I permessi sono persistenti nel database
- I cambiamenti ai permessi sono immediati (no cache)
- Il sistema è scalabile per future funzionalità
- I nuovi team members creati dopo questa fix avranno automaticamente i permessi di base
- La tabella `permissions` esistente ha una foreign key verso `team(user_id)`
- Il valore di default per `valore` è `true` nella tabella esistente 