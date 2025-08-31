# 🗄️ Piano Sostituzione Dati Mock con Dati Reali

## 🎯 **Obiettivo**

Sostituire completamente tutti i dati mock/fake con dati reali dal database Supabase in tutto il sistema.

## 📊 **Dati Mock Identificati**

### **1. Sistema Permessi & Ferie**
```typescript
// File: page.tsx - Linea 401
const mockWorkHours: WorkHours[] = [
  {
    id: '1',
    member_id: formattedMembers[0]?.id || '',
    member_name: formattedMembers[0]?.name || 'Membro 1',
    date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    total_hours: 8,        // ← DATO MOCK
    break_time: 60,
    notes: 'Giornata normale',
    status: 'completed',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T17:00:00Z'
  },
  // ... altri dati mock
];
```

### **2. Altri Dati Mock nel Sistema**
- **Report Finanze**: Dati di esempio per incassi
- **Dashboard Magazzino**: Statistiche fittizie
- **Loading States**: Dati ghost per caricamento

## 🔧 **Implementazione Dati Reali**

### **Fase 1: Database Schema**

#### **Tabella `work_hours` (da creare)**
```sql
CREATE TABLE work_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES team(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES salon(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours DECIMAL(4,2) NOT NULL,
  break_time INTEGER DEFAULT 0, -- minuti
  notes TEXT,
  status TEXT CHECK (status IN ('completed', 'pending', 'absent')) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_work_hours_member_date ON work_hours(member_id, date);
CREATE INDEX idx_work_hours_salon_date ON work_hours(salon_id, date);
CREATE INDEX idx_work_hours_status ON work_hours(status);

-- RLS Policies
ALTER TABLE work_hours ENABLE ROW LEVEL SECURITY;

-- Policy per manager (vede tutti i dati del salone)
CREATE POLICY "Manager can view all work hours" ON work_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND salon_id = work_hours.salon_id
    )
  );

-- Policy per dipendenti (vede solo i propri dati)
CREATE POLICY "Members can view own work hours" ON work_hours
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM team 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per inserimento
CREATE POLICY "Members can insert own work hours" ON work_hours
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM team 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per aggiornamento
CREATE POLICY "Members can update own work hours" ON work_hours
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM team 
      WHERE user_id = auth.uid()
    )
  );
```

### **Fase 2: Funzioni Database**

#### **Funzione per calcolare ore totali**
```sql
CREATE OR REPLACE FUNCTION calculate_total_work_hours(
  p_salon_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_hours DECIMAL(10,2),
  total_days INTEGER,
  average_hours DECIMAL(4,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(wh.total_hours), 0) as total_hours,
    COUNT(DISTINCT wh.date) as total_days,
    CASE 
      WHEN COUNT(DISTINCT wh.date) > 0 
      THEN COALESCE(SUM(wh.total_hours), 0) / COUNT(DISTINCT wh.date)
      ELSE 0 
    END as average_hours
  FROM work_hours wh
  WHERE wh.salon_id = p_salon_id
    AND wh.status = 'completed'
    AND (p_start_date IS NULL OR wh.date >= p_start_date)
    AND (p_end_date IS NULL OR wh.date <= p_end_date);
END;
$$ LANGUAGE plpgsql;
```

#### **Funzione per statistiche orari**
```sql
CREATE OR REPLACE FUNCTION get_work_hours_stats(
  p_salon_id UUID,
  p_period TEXT DEFAULT 'month' -- 'week', 'month', 'year'
)
RETURNS JSON AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_result JSON;
BEGIN
  -- Calcola periodo
  CASE p_period
    WHEN 'week' THEN
      v_start_date := CURRENT_DATE - INTERVAL '7 days';
      v_end_date := CURRENT_DATE;
    WHEN 'month' THEN
      v_start_date := DATE_TRUNC('month', CURRENT_DATE);
      v_end_date := CURRENT_DATE;
    WHEN 'year' THEN
      v_start_date := DATE_TRUNC('year', CURRENT_DATE);
      v_end_date := CURRENT_DATE;
    ELSE
      v_start_date := DATE_TRUNC('month', CURRENT_DATE);
      v_end_date := CURRENT_DATE;
  END CASE;

  SELECT json_build_object(
    'total_hours', COALESCE(SUM(wh.total_hours), 0),
    'total_days', COUNT(DISTINCT wh.date),
    'average_hours', CASE 
      WHEN COUNT(DISTINCT wh.date) > 0 
      THEN COALESCE(SUM(wh.total_hours), 0) / COUNT(DISTINCT wh.date)
      ELSE 0 
    END,
    'period_start', v_start_date,
    'period_end', v_end_date,
    'members_count', COUNT(DISTINCT wh.member_id)
  ) INTO v_result
  FROM work_hours wh
  WHERE wh.salon_id = p_salon_id
    AND wh.status = 'completed'
    AND wh.date BETWEEN v_start_date AND v_end_date;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### **Fase 3: Aggiornamento Frontend**

#### **1. Sostituire mockWorkHours in page.tsx**
```typescript
// RIMUOVERE questo blocco
const mockWorkHours: WorkHours[] = [...];
setWorkHours(mockWorkHours);

// SOSTITUIRE con
const fetchRealWorkHours = async () => {
  try {
    const { data: workHoursData, error: workHoursError } = await supabase
      .from('work_hours')
      .select('*')
      .eq('salon_id', currentSalonId)
      .eq('status', 'completed')
      .order('date', { ascending: false });

    if (workHoursError) throw workHoursError;
    
    setWorkHours(workHoursData || []);
  } catch (error) {
    console.error('Error fetching work hours:', error);
    setWorkHours([]);
  }
};
```

#### **2. Aggiornare StatsCardsOrari**
```typescript
// Calcolo ore reali dal database
const totalHours = workHours
  .filter(wh => wh.status === 'completed')
  .reduce((acc, wh) => acc + wh.total_hours, 0);

const averageHours = workHours.length > 0 
  ? totalHours / workHours.length 
  : 0;

const totalDays = workHours
  .filter(wh => wh.status === 'completed')
  .length;
```

#### **3. Aggiungere Real-time Updates**
```typescript
// Subscription per work_hours
const workHoursSub = supabase
  .channel('work_hours_changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'work_hours',
      filter: `salon_id=eq.${salonId}`
    },
    (payload) => {
      console.log('Work hours update:', payload);
      fetchRealWorkHours();
    }
  )
  .subscribe();
```

### **Fase 4: Sistema Presenze**

#### **Componente per registrare ore**
```typescript
// Nuovo componente: WorkHoursTracker.tsx
interface WorkHoursTrackerProps {
  memberId: string;
  salonId: string;
  onHoursRecorded: () => void;
}

const WorkHoursTracker: React.FC<WorkHoursTrackerProps> = ({
  memberId,
  salonId,
  onHoursRecorded
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentHours, setCurrentHours] = useState(0);

  const startTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
  };

  const stopTracking = async () => {
    if (!startTime) return;

    const endTime = new Date();
    const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    try {
      const { error } = await supabase
        .from('work_hours')
        .insert({
          member_id: memberId,
          salon_id: salonId,
          date: format(new Date(), 'yyyy-MM-dd'),
          start_time: format(startTime, 'HH:mm:ss'),
          end_time: format(endTime, 'HH:mm:ss'),
          total_hours: totalHours,
          status: 'completed'
        });

      if (error) throw error;

      setIsTracking(false);
      setStartTime(null);
      onHoursRecorded();
    } catch (error) {
      console.error('Error recording work hours:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isTracking ? (
        <Button onClick={startTracking}>
          <Play className="h-4 w-4 mr-2" />
          Inizia Lavoro
        </Button>
      ) : (
        <Button onClick={stopTracking} variant="destructive">
          <Square className="h-4 w-4 mr-2" />
          Termina Lavoro
        </Button>
      )}
    </div>
  );
};
```

### **Fase 5: Dashboard Reali**

#### **Aggiornare StatsCards con dati reali**
```typescript
// StatsCardsOrari aggiornato
const StatsCardsOrari = ({ salonId }: { salonId: string }) => {
  const [stats, setStats] = useState({
    totalHours: 0,
    totalDays: 0,
    averageHours: 0,
    periodStart: '',
    periodEnd: '',
    membersCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_work_hours_stats', {
            p_salon_id: salonId,
            p_period: 'month'
          });

        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [salonId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Ore Totali</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalHours.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalDays} giorni • {stats.averageHours.toFixed(1)}h media
          </p>
        </CardContent>
      </Card>
      {/* ... altre cards */}
    </div>
  );
};
```

## 📋 **Checklist Implementazione**

### **Database**
- [ ] Creare tabella `work_hours`
- [ ] Implementare RLS policies
- [ ] Creare funzioni di calcolo
- [ ] Testare performance

### **Backend**
- [ ] Sostituire mockWorkHours con fetch reali
- [ ] Implementare real-time subscriptions
- [ ] Aggiungere error handling
- [ ] Testare connessioni

### **Frontend**
- [ ] Aggiornare StatsCards
- [ ] Implementare WorkHoursTracker
- [ ] Aggiungere loading states
- [ ] Testare UI/UX

### **Testing**
- [ ] Test con dati reali
- [ ] Verificare performance
- [ ] Test real-time updates
- [ ] Validare calcoli

## 🚀 **Benefici**

### **Immediati**
- ✅ Dati accurati e reali
- ✅ Nessuna confusione con dati fake
- ✅ Metriche affidabili

### **A Lungo Termine**
- ✅ Sistema scalabile
- ✅ Reportistica avanzata
- ✅ Analisi produttività
- ✅ Compliance normativa

## ⚠️ **Considerazioni**

### **Performance**
- Implementare caching per query frequenti
- Usare indici appropriati
- Considerare paginazione per grandi dataset

### **Sicurezza**
- Validare tutti gli input
- Implementare rate limiting
- Logging per audit trail

### **UX**
- Loading states appropriati
- Error handling user-friendly
- Feedback immediato per azioni

Vuoi che inizi con l'implementazione della tabella `work_hours`? 🚀 