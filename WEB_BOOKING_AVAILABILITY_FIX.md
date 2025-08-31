# Fix Sistema Prenotazioni Web - Disponibilità Slot

## Problema Risolto

Il sistema di prenotazioni web mostrava tutti gli slot temporali disponibili anche quando alcuni erano già occupati da appuntamenti esistenti nella tabella `orders`.

## Modifiche Implementate

### 1. Aggiornamento API Prenotazioni (`app/api/salon-web/bookings/route.ts`)

#### Funzione `generateAvailableSlots` Migliorata

La funzione ora:

- **Recupera tutti i membri del team** del salone
- **Controlla la disponibilità individuale** di ogni membro del team
- **Considera uno slot disponibile** se almeno un membro del team è libero
- **Verifica sovrapposizioni temporali** con appuntamenti esistenti
- **Controlla prenotazioni online** esistenti
- **Verifica permessi e ferie** dei membri del team
- **Rispetta gli orari di lavoro** configurati

#### Logica di Disponibilità

```typescript
// Uno slot è disponibile se almeno un membro del team è libero
const hasAvailableTeamMember = availableTeamMembers.some(teamMember => {
  // Verifica permessi/ferie
  const hasTimeOff = timeOff?.some(off => off.member_id === teamMember.id);
  if (hasTimeOff) return false;

  // Verifica appuntamenti sovrapposti
  const hasAppointment = existingAppointments?.some(appointment => {
    if (appointment.team_id !== teamMember.id) return false;
    return slotTime < appointment.orarioFine && appointment.orarioInizio < slotEndTime;
  });
  if (hasAppointment) return false;

  // Verifica prenotazioni online sovrapposte
  const hasOnlineBooking = existingOnlineBookings?.some(booking => {
    if (booking.team_member_id !== teamMember.id) return false;
    return slotTime < booking.end_time && booking.start_time < slotEndTime;
  });
  if (hasOnlineBooking) return false;

  return true; // Membro del team disponibile
});
```

### 2. Nuovo Endpoint Team Members (`app/api/salon-web/team-members/route.ts`)

Creato un nuovo endpoint per ottenere i membri del team disponibili per uno slot specifico:

```
GET /api/salon-web/team-members?salon_id=xxx&date=yyyy-mm-dd&time=hh:mm&service_id=xxx
```

Risposta:
```json
{
  "available_team_members": [
    { "id": "uuid", "name": "Nome Membro", "user_id": "uuid" }
  ],
  "total_team_members": 3,
  "requested_time": "14:00",
  "end_time": "14:30",
  "service_duration": 30
}
```

### 3. Endpoint di Test Migliorato (`app/api/salon-web/bookings/test/route.ts`)

L'endpoint di test ora mostra:

- **Membri del team** del salone
- **Disponibilità individuale** per ogni membro
- **Appuntamenti esistenti** per data
- **Prenotazioni online** esistenti
- **Permessi e ferie** approvati
- **Orari di lavoro** configurati
- **Riepilogo completo** della situazione

## Controlli Implementati

### 1. Disponibilità per Membro del Team
- Verifica se il membro ha permessi/ferie approvati
- Controlla sovrapposizioni con appuntamenti esistenti
- Verifica conflitti con prenotazioni online

### 2. Orari di Lavoro
- Utilizza orari specifici del membro del team se configurati
- Altrimenti usa orari del salone
- Fallback su orari di default (09:00-18:00)

### 3. Giorni Lavorativi
- Esclude la domenica (giorno 0)
- Possibilità di estendere per altri giorni

### 4. Stati Appuntamenti
- Esclude appuntamenti con status "Eliminato"
- Esclude appuntamenti con status "Annullato"
- Considera solo prenotazioni online "pending" o "confirmed"

## Vantaggi della Nuova Implementazione

1. **Accuratezza**: Mostra solo slot realmente disponibili
2. **Flessibilità**: Considera la disponibilità individuale dei membri del team
3. **Completezza**: Verifica tutti i tipi di impegni (appuntamenti, prenotazioni online, permessi)
4. **Scalabilità**: Funziona con qualsiasi numero di membri del team
5. **Debugging**: Logging dettagliato per troubleshooting

## Utilizzo

### Per ottenere slot disponibili:
```
GET /api/salon-web/bookings?salon_id=xxx&date=yyyy-mm-dd&service_id=xxx&team_member_id=xxx
```

### Per ottenere membri disponibili per uno slot:
```
GET /api/salon-web/team-members?salon_id=xxx&date=yyyy-mm-dd&time=hh:mm&service_id=xxx
```

### Per testare il sistema:
```
GET /api/salon-web/bookings/test?salon_id=xxx&date=yyyy-mm-dd
```

## Note Tecniche

- La funzione `generateAvailableSlots` è ora asincrona
- Viene utilizzato il client Supabase Admin per accesso completo ai dati
- I controlli di sovrapposizione temporale seguono la logica: `start1 < end2 && start2 < end1`
- Tutti i parametri temporali sono nel formato "HH:mm"
- Le date sono nel formato "YYYY-MM-DD" 