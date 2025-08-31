# ⏰ Analisi "Ore Totali" - Stats Cards

## 🎯 **Cosa Conteggiano le "Ore Totali"?**

### **Calcolo Attuale**
```typescript
const totalHours = workHours.reduce((acc, wh) => acc + wh.total_hours, 0);
```

### **Struttura Dati WorkHours**
```typescript
interface WorkHours {
  id: string;
  member_id: string;
  member_name: string;
  date: string;           // Data del giorno lavorato
  start_time: string;     // Orario di inizio (es: "09:00")
  end_time: string;       // Orario di fine (es: "17:00")
  total_hours: number;    // Ore totali lavorate (es: 8)
  break_time: number;     // Minuti di pausa (es: 60)
  notes?: string;         // Note aggiuntive
  status: 'completed' | 'pending' | 'absent';
  created_at: string;
  updated_at: string;
}
```

## 📊 **Dati Attuali (MOCK)**

### **Problema Identificato**
Le "Ore Totali" attualmente usano **dati mock** dal `page.tsx`:

```typescript
// Dati di esempio per le ore lavorative (da rimuovere quando implementato il database)
const mockWorkHours: WorkHours[] = [
  {
    id: '1',
    member_id: formattedMembers[0]?.id || '',
    member_name: formattedMembers[0]?.name || 'Membro 1',
    date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    total_hours: 8,        // ← Questo è il valore che viene sommato
    break_time: 60,
    notes: 'Giornata normale',
    status: 'completed',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T17:00:00Z'
  },
  {
    id: '2',
    member_id: formattedMembers[0]?.id || '',
    member_name: formattedMembers[0]?.name || 'Membro 1',
    date: '2024-01-16',
    start_time: '08:30',
    end_time: '18:30',
    total_hours: 9.5,      // ← Questo è il valore che viene sommato
    break_time: 60,
    notes: 'Giornata intensa',
    status: 'completed',
    created_at: '2024-01-16T08:30:00Z',
    updated_at: '2024-01-16T18:30:00Z'
  }
];
```

### **Calcolo Risultante**
- **Giorno 1**: 8 ore
- **Giorno 2**: 9.5 ore
- **Totale**: 8 + 9.5 = **17.5 ore**

## 🔍 **Cosa Dovrebbero Conteggiare**

### **Opzione 1: Ore Effettivamente Lavorate**
- **Fonte**: Registrazione presenze reali
- **Calcolo**: Somma di `total_hours` per tutti i giorni lavorati
- **Esempio**: Se un dipendente ha lavorato 8h il lunedì e 7.5h il martedì = 15.5h totali

### **Opzione 2: Ore Programmabili**
- **Fonte**: Orari settimanali schedulati
- **Calcolo**: Somma delle ore programmate per tutti i membri
- **Esempio**: Se 3 dipendenti hanno 40h settimanali = 120h programmabili

### **Opzione 3: Ore Pianificate**
- **Fonte**: Combinazione di orari settimanali + straordinari
- **Calcolo**: Ore base + ore straordinarie approvate
- **Esempio**: 40h base + 5h straordinari = 45h pianificate

## 🎯 **Raccomandazione**

### **Per "Ore Totali" suggerirei:**
```typescript
// Calcolo ore effettivamente lavorate (dati reali)
const totalWorkedHours = workHours
  .filter(wh => wh.status === 'completed')
  .reduce((acc, wh) => acc + wh.total_hours, 0);

// Calcolo ore programmate (dai weekly schedules)
const totalScheduledHours = weeklySchedules
  .filter(ws => ws.is_active)
  .reduce((acc, ws) => {
    // Calcola ore settimanali per questo schedule
    const dailySchedules = dailySchedules.filter(ds => ds.weekly_schedule_id === ws.id);
    const weeklyHours = dailySchedules.reduce((dayAcc, ds) => {
      if (ds.is_working_day) {
        const start = new Date(`2000-01-01T${ds.start_time}`);
        const end = new Date(`2000-01-01T${ds.end_time}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return dayAcc + hours;
      }
      return dayAcc;
    }, 0);
    return acc + weeklyHours;
  }, 0);
```

## 📋 **Implementazione Suggerita**

### **Stats Cards Aggiornate**
```typescript
// Ore Effettivamente Lavorate
<div className="text-2xl font-bold text-blue-600">
  {totalWorkedHours.toFixed(1)}h
</div>
<p className="text-xs text-muted-foreground">
  {workHours.filter(wh => wh.status === 'completed').length} giorni lavorati
</p>

// Ore Programmabili
<div className="text-2xl font-bold text-green-600">
  {totalScheduledHours.toFixed(1)}h
</div>
<p className="text-xs text-muted-foreground">
  {activeWeeklySchedules} schedulazioni attive
</p>
```

## 🚨 **Problemi Attuali**

### **1. Dati Mock**
- ❌ Usa dati finti invece di dati reali
- ❌ Non riflette l'effettivo lavoro svolto
- ❌ Non aggiorna in tempo reale

### **2. Calcolo Limitato**
- ❌ Non considera pause
- ❌ Non considera straordinari
- ❌ Non considera assenze

### **3. Mancanza di Contesto**
- ❌ Non specifica il periodo (settimana/mese/anno)
- ❌ Non distingue tra ore programmate e effettive

## 🔧 **Soluzioni Proposte**

### **Immediata**
1. **Rimuovere dati mock**
2. **Collegare a database reale**
3. **Aggiungere filtro temporale**

### **A Medio Termine**
1. **Implementare sistema presenze**
2. **Calcolare ore effettive vs programmate**
3. **Aggiungere metriche di produttività**

### **A Lungo Termine**
1. **Dashboard analitiche**
2. **Report periodici**
3. **Confronto obiettivi vs risultati**

## 📊 **Metriche Alternative**

### **Ore Programmabili**
- **Fonte**: `weekly_schedules` + `daily_schedules`
- **Calcolo**: Somma ore settimanali per tutti i membri attivi

### **Ore Straordinarie**
- **Fonte**: `extra_schedules` approvati
- **Calcolo**: Somma ore extra approvate

### **Copertura Orari**
- **Fonte**: Membri con orari attivi
- **Calcolo**: Percentuale membri con schedulazioni

## 🎯 **Conclusione**

Le "Ore Totali" attualmente conteggiano **dati mock** che non riflettono la realtà. Per renderle utili, dovremmo:

1. **Collegare a dati reali** dal database
2. **Definire chiaramente** cosa rappresentano
3. **Aggiungere contesto** temporale
4. **Distinguere** tra ore programmate e effettive

Vuoi che implementi una di queste soluzioni? 🤔 