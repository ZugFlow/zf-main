-- =====================================================
-- SISTEMA DI GESTIONE ORARI DI LAVORO
-- =====================================================
-- Tabelle per la gestione completa degli orari di lavoro
-- Collegamenti con profiles (salon_id) e team (member_id)

-- =====================================================
-- 1. TABELLA ORARI SETTIMANALI
-- =====================================================
CREATE TABLE IF NOT EXISTS weekly_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    salon_id UUID NOT NULL,
    week_start_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincoli
    CONSTRAINT fk_weekly_schedules_member_id 
        FOREIGN KEY (member_id) REFERENCES team(id) ON DELETE CASCADE,
    CONSTRAINT fk_weekly_schedules_salon_id 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE,
    
    -- Indici per performance
    CONSTRAINT unique_member_week UNIQUE (member_id, week_start_date)
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_member_id ON weekly_schedules(member_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_salon_id ON weekly_schedules(salon_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_week_start ON weekly_schedules(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_active ON weekly_schedules(is_active);

-- =====================================================
-- 2. TABELLA ORARI GIORNALIERI
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    weekly_schedule_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working_day BOOLEAN DEFAULT true,
    break_start TIME,
    break_end TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincoli
    CONSTRAINT fk_daily_schedules_weekly_schedule_id 
        FOREIGN KEY (weekly_schedule_id) REFERENCES weekly_schedules(id) ON DELETE CASCADE,
    CONSTRAINT check_time_order CHECK (start_time < end_time),
    CONSTRAINT check_break_time CHECK (
        (break_start IS NULL AND break_end IS NULL) OR 
        (break_start IS NOT NULL AND break_end IS NOT NULL AND break_start < break_end)
    ),
    
    -- Vincolo unico per evitare duplicati
    CONSTRAINT unique_daily_schedule UNIQUE (weekly_schedule_id, day_of_week)
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_daily_schedules_weekly_id ON daily_schedules(weekly_schedule_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedules_day ON daily_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_daily_schedules_working ON daily_schedules(is_working_day);

-- =====================================================
-- 3. TABELLA ORARI STRAORDINARI
-- =====================================================
CREATE TABLE IF NOT EXISTS extra_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    salon_id UUID NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('extra', 'overtime', 'holiday', 'closing')),
    reason TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincoli
    CONSTRAINT fk_extra_schedules_member_id 
        FOREIGN KEY (member_id) REFERENCES team(id) ON DELETE CASCADE,
    CONSTRAINT fk_extra_schedules_salon_id 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE,
    CONSTRAINT fk_extra_schedules_approved_by 
        FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT check_extra_time_order CHECK (start_time < end_time),
    
    -- Vincolo unico per evitare conflitti di orari
    CONSTRAINT unique_member_date_extra UNIQUE (member_id, date)
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_extra_schedules_member_id ON extra_schedules(member_id);
CREATE INDEX IF NOT EXISTS idx_extra_schedules_salon_id ON extra_schedules(salon_id);
CREATE INDEX IF NOT EXISTS idx_extra_schedules_date ON extra_schedules(date);
CREATE INDEX IF NOT EXISTS idx_extra_schedules_type ON extra_schedules(type);
CREATE INDEX IF NOT EXISTS idx_extra_schedules_approved ON extra_schedules(is_approved);

-- =====================================================
-- 4. TABELLA RICHIESTE CAMBIO TURNO
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    salon_id UUID NOT NULL,
    requested_date DATE NOT NULL,
    current_start_time TIME NOT NULL,
    current_end_time TIME NOT NULL,
    requested_start_time TIME NOT NULL,
    requested_end_time TIME NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincoli
    CONSTRAINT fk_shift_requests_member_id 
        FOREIGN KEY (member_id) REFERENCES team(id) ON DELETE CASCADE,
    CONSTRAINT fk_shift_requests_salon_id 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE,
    CONSTRAINT fk_shift_requests_approved_by 
        FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT check_shift_time_order CHECK (
        current_start_time < current_end_time AND 
        requested_start_time < requested_end_time
    )
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_shift_requests_member_id ON shift_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_shift_requests_salon_id ON shift_requests(salon_id);
CREATE INDEX IF NOT EXISTS idx_shift_requests_date ON shift_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_shift_requests_status ON shift_requests(status);

-- =====================================================
-- 5. TABELLA RICHIESTE DISPONIBILITÀ
-- =====================================================
CREATE TABLE IF NOT EXISTS availability_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    salon_id UUID NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('available', 'unavailable')),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincoli
    CONSTRAINT fk_availability_requests_member_id 
        FOREIGN KEY (member_id) REFERENCES team(id) ON DELETE CASCADE,
    CONSTRAINT fk_availability_requests_salon_id 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE,
    CONSTRAINT fk_availability_requests_approved_by 
        FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT check_availability_time_order CHECK (start_time < end_time)
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_availability_requests_member_id ON availability_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_salon_id ON availability_requests(salon_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_date ON availability_requests(date);
CREATE INDEX IF NOT EXISTS idx_availability_requests_type ON availability_requests(type);
CREATE INDEX IF NOT EXISTS idx_availability_requests_status ON availability_requests(status);

-- =====================================================
-- 6. TABELLA NOTIFICHE ORARI
-- =====================================================
CREATE TABLE IF NOT EXISTS schedule_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    salon_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('schedule_change', 'shift_request', 'availability_request', 'approval')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincoli
    CONSTRAINT fk_schedule_notifications_member_id 
        FOREIGN KEY (member_id) REFERENCES team(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_notifications_salon_id 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_schedule_notifications_member_id ON schedule_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_schedule_notifications_salon_id ON schedule_notifications(salon_id);
CREATE INDEX IF NOT EXISTS idx_schedule_notifications_type ON schedule_notifications(type);
CREATE INDEX IF NOT EXISTS idx_schedule_notifications_read ON schedule_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_schedule_notifications_created ON schedule_notifications(created_at);

-- =====================================================
-- 7. TABELLA IMPOSTAZIONI ORARI (per salone)
-- =====================================================
CREATE TABLE IF NOT EXISTS working_hours_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL UNIQUE,
    is_schedule_locked BOOLEAN DEFAULT false,
    lock_reason TEXT,
    default_break_duration INTEGER DEFAULT 60, -- in minuti
    max_working_hours_per_day INTEGER DEFAULT 8,
    max_working_hours_per_week INTEGER DEFAULT 40,
    allow_overtime BOOLEAN DEFAULT true,
    require_approval_for_overtime BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincoli
    CONSTRAINT fk_working_hours_settings_salon_id 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE,
    CONSTRAINT check_break_duration CHECK (default_break_duration >= 0),
    CONSTRAINT check_max_hours_day CHECK (max_working_hours_per_day > 0 AND max_working_hours_per_day <= 24),
    CONSTRAINT check_max_hours_week CHECK (max_working_hours_per_week > 0 AND max_working_hours_per_week <= 168)
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_working_hours_settings_salon_id ON working_hours_settings(salon_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_settings_locked ON working_hours_settings(is_schedule_locked);

-- =====================================================
-- 8. TRIGGER PER AGGIORNAMENTO TIMESTAMP
-- =====================================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per tutte le tabelle
CREATE TRIGGER update_weekly_schedules_updated_at 
    BEFORE UPDATE ON weekly_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_schedules_updated_at 
    BEFORE UPDATE ON daily_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extra_schedules_updated_at 
    BEFORE UPDATE ON extra_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_requests_updated_at 
    BEFORE UPDATE ON shift_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_requests_updated_at 
    BEFORE UPDATE ON availability_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_working_hours_settings_updated_at 
    BEFORE UPDATE ON working_hours_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. FUNZIONI UTILITY
-- =====================================================

-- Funzione per calcolare le ore lavorate
CREATE OR REPLACE FUNCTION calculate_working_hours(
    start_time TIME,
    end_time TIME,
    break_start TIME DEFAULT NULL,
    break_end TIME DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
    total_minutes INTEGER;
    break_minutes INTEGER := 0;
BEGIN
    -- Calcola minuti totali
    total_minutes := EXTRACT(EPOCH FROM (end_time - start_time)) / 60;
    
    -- Sottrai pausa se presente
    IF break_start IS NOT NULL AND break_end IS NOT NULL THEN
        break_minutes := EXTRACT(EPOCH FROM (break_end - break_start)) / 60;
        total_minutes := total_minutes - break_minutes;
    END IF;
    
    -- Ritorna ore in formato decimale
    RETURN ROUND((total_minutes / 60.0)::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql;

-- Funzione per verificare sovrapposizioni orari
CREATE OR REPLACE FUNCTION check_schedule_overlap(
    member_uuid UUID,
    check_date DATE,
    check_start TIME,
    check_end TIME,
    exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO overlap_count
    FROM (
        -- Controlla orari settimanali
        SELECT ds.start_time, ds.end_time
        FROM daily_schedules ds
        JOIN weekly_schedules ws ON ds.weekly_schedule_id = ws.id
        WHERE ws.member_id = member_uuid
        AND ws.is_active = true
        AND ds.is_working_day = true
        AND ds.day_of_week = EXTRACT(DOW FROM check_date)
        
        UNION ALL
        
        -- Controlla orari straordinari
        SELECT es.start_time, es.end_time
        FROM extra_schedules es
        WHERE es.member_id = member_uuid
        AND es.date = check_date
        AND es.is_approved = true
    ) schedules
    WHERE (
        (check_start < schedules.end_time AND check_end > schedules.start_time)
        OR (schedules.start_time < check_end AND schedules.end_time > check_start)
    );
    
    RETURN overlap_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. VISTE UTILITY
-- =====================================================

-- Vista per orari completi di un membro
CREATE OR REPLACE VIEW member_complete_schedule AS
SELECT 
    ws.member_id,
    ws.salon_id,
    ws.week_start_date,
    ds.day_of_week,
    ds.start_time,
    ds.end_time,
    ds.is_working_day,
    ds.break_start,
    ds.break_end,
    ds.notes,
    'weekly' as schedule_type
FROM weekly_schedules ws
JOIN daily_schedules ds ON ws.id = ds.weekly_schedule_id
WHERE ws.is_active = true

UNION ALL

SELECT 
    es.member_id,
    es.salon_id,
    es.date as week_start_date,
    EXTRACT(DOW FROM es.date) as day_of_week,
    es.start_time,
    es.end_time,
    true as is_working_day,
    NULL as break_start,
    NULL as break_end,
    es.reason as notes,
    'extra' as schedule_type
FROM extra_schedules es
WHERE es.is_approved = true;

-- Vista per statistiche orari
CREATE OR REPLACE VIEW working_hours_stats AS
SELECT 
    ws.member_id,
    ws.salon_id,
    ws.week_start_date,
    COUNT(CASE WHEN ds.is_working_day THEN 1 END) as working_days,
    SUM(calculate_working_hours(ds.start_time, ds.end_time, ds.break_start, ds.break_end)) as total_hours
FROM weekly_schedules ws
LEFT JOIN daily_schedules ds ON ws.id = ds.weekly_schedule_id
WHERE ws.is_active = true
GROUP BY ws.member_id, ws.salon_id, ws.week_start_date;

-- =====================================================
-- 11. COMMENTI E DOCUMENTAZIONE
-- =====================================================

COMMENT ON TABLE weekly_schedules IS 'Orari settimanali fissi per ogni membro del team';
COMMENT ON TABLE daily_schedules IS 'Orari giornalieri dettagliati per ogni giorno della settimana';
COMMENT ON TABLE extra_schedules IS 'Orari straordinari per giorni specifici (festivi, aperture extra, etc.)';
COMMENT ON TABLE shift_requests IS 'Richieste di cambio turno da parte dei dipendenti';
COMMENT ON TABLE availability_requests IS 'Richieste di disponibilità extra da parte dei dipendenti';
COMMENT ON TABLE schedule_notifications IS 'Notifiche per modifiche orari e richieste';
COMMENT ON TABLE working_hours_settings IS 'Impostazioni generali orari per ogni salone';

COMMENT ON COLUMN daily_schedules.day_of_week IS '0 = domenica, 1 = lunedì, ..., 6 = sabato';
COMMENT ON COLUMN extra_schedules.type IS 'extra = orario extra, overtime = straordinario, holiday = festivo, closing = chiusura';
COMMENT ON COLUMN shift_requests.status IS 'pending = in attesa, approved = approvato, rejected = rifiutato';
COMMENT ON COLUMN availability_requests.type IS 'available = disponibile, unavailable = non disponibile';
COMMENT ON COLUMN schedule_notifications.type IS 'schedule_change = cambio orario, shift_request = richiesta turno, availability_request = richiesta disponibilità, approval = approvazione';

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours_settings ENABLE ROW LEVEL SECURITY;

-- Policy per weekly_schedules
CREATE POLICY "Users can view their salon weekly schedules" ON weekly_schedules
    FOR SELECT USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT salon_id FROM team WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage their salon weekly schedules" ON weekly_schedules
    FOR ALL USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy per daily_schedules
CREATE POLICY "Users can view their salon daily schedules" ON daily_schedules
    FOR SELECT USING (
        weekly_schedule_id IN (
            SELECT ws.id FROM weekly_schedules ws
            WHERE ws.salon_id IN (
                SELECT salon_id FROM profiles WHERE id = auth.uid()
                UNION
                SELECT salon_id FROM team WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Managers can manage their salon daily schedules" ON daily_schedules
    FOR ALL USING (
        weekly_schedule_id IN (
            SELECT ws.id FROM weekly_schedules ws
            WHERE ws.salon_id IN (
                SELECT salon_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Policy per extra_schedules
CREATE POLICY "Users can view their salon extra schedules" ON extra_schedules
    FOR SELECT USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT salon_id FROM team WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage their salon extra schedules" ON extra_schedules
    FOR ALL USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy per shift_requests
CREATE POLICY "Users can view their own shift requests" ON shift_requests
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM team WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own shift requests" ON shift_requests
    FOR INSERT WITH CHECK (
        member_id IN (
            SELECT id FROM team WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage all shift requests in their salon" ON shift_requests
    FOR ALL USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy per availability_requests
CREATE POLICY "Users can view their own availability requests" ON availability_requests
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM team WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own availability requests" ON availability_requests
    FOR INSERT WITH CHECK (
        member_id IN (
            SELECT id FROM team WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage all availability requests in their salon" ON availability_requests
    FOR ALL USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy per schedule_notifications
CREATE POLICY "Users can view their own notifications" ON schedule_notifications
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM team WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can view all notifications in their salon" ON schedule_notifications
    FOR SELECT USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy per working_hours_settings
CREATE POLICY "Users can view their salon settings" ON working_hours_settings
    FOR SELECT USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT salon_id FROM team WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage their salon settings" ON working_hours_settings
    FOR ALL USING (
        salon_id IN (
            SELECT salon_id FROM profiles WHERE id = auth.uid()
        )
    );

-- =====================================================
-- FINE SCRIPT
-- ===================================================== 