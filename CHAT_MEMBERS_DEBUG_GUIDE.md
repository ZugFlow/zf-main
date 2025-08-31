# 🔍 Guida Debug - Membri Chat

## 🎯 **Problema**
Non vengono rilevati i membri del team per la creazione di gruppi di chat individuali.

## 🛠️ **Soluzioni Implementate**

### 1. **Miglioramento Chat Service**
- ✅ Aggiunto fallback per `getAvailableTeamMembers()`
- ✅ Migliorato error handling e logging
- ✅ Aggiunta funzione di test RPC

### 2. **Debug Components**
- ✅ Aggiunto pulsante "Debug" nella sezione chat
- ✅ Migliorato logging in `CreateGroupDialog`
- ✅ Aggiunta funzione `debugUserTeamMembership()`

### 3. **SQL Debug Script**
- ✅ Creato `utils/supabase/db/debug_team_members.sql`
- ✅ Query per verificare stato database

## 🧪 **Come Testare**

### **Passo 1: Test Pulsante Debug**
1. Apri la sezione chat
2. Clicca sul pulsante "Debug" nell'header
3. Controlla la console del browser (F12)
4. Verifica i messaggi:
   - `👤 User debug info:`
   - `🧪 RPC Test result:`
   - `✅ Debug: Members found:`

### **Passo 2: Test Creazione Gruppo**
1. Clicca su "Crea nuovo gruppo"
2. Controlla se appaiono i membri nella lista
3. Se la lista è vuota, controlla la console per errori

### **Passo 3: Verifica Database**
Esegui questi query nel Supabase SQL Editor:

```sql
-- Verifica membri del team
SELECT COUNT(*) as total_members,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_members
FROM team;

-- Verifica utente corrente
SELECT * FROM team WHERE user_id = 'YOUR_USER_ID';

-- Test funzione RPC
SELECT * FROM get_team_members_for_chat();
```

## 🔍 **Possibili Cause**

### **1. Utente non nel team**
- L'utente non è registrato nella tabella `team`
- L'utente non è marcato come `is_active = true`

### **2. Salon ID mancante**
- L'utente non ha un `salon_id` associato
- Problema nella funzione `getSalonId()`

### **3. RLS Policies**
- Le policy di sicurezza bloccano l'accesso
- Problemi di permessi sulla tabella `team`

### **4. Funzione RPC non esiste**
- La funzione `get_team_members_for_chat` non è stata creata
- Problema nella definizione della funzione

## 🚀 **Soluzioni Rapide**

### **Se nessun membro viene trovato:**

1. **Verifica Team Membership**
```sql
INSERT INTO team (id, salon_id, user_id, name, email, is_active)
VALUES (
  gen_random_uuid(),
  'YOUR_SALON_ID',
  'YOUR_USER_ID',
  'Nome Utente',
  'email@example.com',
  true
);
```

2. **Verifica Salon ID**
```sql
UPDATE team 
SET salon_id = 'YOUR_SALON_ID'
WHERE user_id = 'YOUR_USER_ID';
```

3. **Ricrea Funzione RPC**
```sql
-- Esegui il file chat_system_complete.sql
-- per ricreare la funzione get_team_members_for_chat
```

## 📋 **Checklist Debug**

- [ ] Utente autenticato correttamente
- [ ] Utente presente nella tabella `team`
- [ ] Utente marcato come `is_active = true`
- [ ] Utente ha un `salon_id` valido
- [ ] Funzione RPC `get_team_members_for_chat` esiste
- [ ] Nessuna RLS policy blocca l'accesso
- [ ] Ci sono altri membri nel team dello stesso salon

## 🎯 **Prossimi Passi**

1. **Esegui il test del pulsante Debug**
2. **Controlla i log nella console**
3. **Verifica il database con i query sopra**
4. **Se necessario, ricrea la funzione RPC**
5. **Testa con un utente diverso**

Una volta identificata la causa specifica, possiamo implementare la soluzione definitiva! 🔧 