-- =====================================================
-- INTEGRAZIONE PERMESSI CON ORE LAVORATIVE
-- =====================================================

-- Funzione per sincronizzare permessi approvati con ore lavorative
CREATE OR REPLACE FUNCTION sync_permissions_with_work_hours()
RETURNS TRIGGER AS $$
DECLARE
    v_current_date DATE;
    v_permission RECORD;
    v_work_hours_record RECORD;
BEGIN
    -- Se il permesso è stato approvato o rifiutato
    IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
        
        -- Per ogni giorno del periodo di permesso
        v_current_date := NEW.start_date;
        
        WHILE v_current_date <= NEW.end_date LOOP
            -- Controlla se esiste già un record work_hours per questo giorno e membro
            SELECT * INTO v_work_hours_record
            FROM work_hours 
            WHERE member_id = NEW.member_id 
              AND date = v_current_date;
            
            -- Se il permesso è stato approvato, marca il giorno come "absent"
            IF NEW.status = 'approved' THEN
                IF v_work_hours_record IS NULL THEN
                    -- Crea un nuovo record work_hours per il giorno di permesso
                    INSERT INTO work_hours (
                        member_id,
                        salon_id,
                        date,
                        start_time,
                        end_time,
                        total_hours,
                        break_time,
                        notes,
                        status
                    ) VALUES (
                        NEW.member_id,
                        NEW.salon_id,
                        v_current_date,
                        COALESCE(NEW.start_time, '00:00:00'),
                        COALESCE(NEW.end_time, '00:00:00'),
                        0, -- 0 ore lavorate per permesso
                        0, -- 0 minuti di pausa
                        CONCAT('Permesso approvato: ', NEW.type, ' - ', NEW.reason),
                        'absent'
                    );
                ELSE
                    -- Aggiorna il record esistente
                    UPDATE work_hours 
                    SET 
                        status = 'absent',
                        total_hours = 0,
                        notes = CONCAT('Permesso approvato: ', NEW.type, ' - ', NEW.reason),
                        updated_at = NOW()
                    WHERE id = v_work_hours_record.id;
                END IF;
            END IF;
            
            -- Passa al giorno successivo
            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per sincronizzare automaticamente quando un permesso viene aggiornato
CREATE TRIGGER trigger_sync_permissions_with_work_hours
    AFTER UPDATE ON permessiferie
    FOR EACH ROW
    EXECUTE FUNCTION sync_permissions_with_work_hours();

-- Funzione per sincronizzare tutti i permessi esistenti (da eseguire una volta)
CREATE OR REPLACE FUNCTION sync_all_existing_permissions()
RETURNS INTEGER AS $$
DECLARE
    v_permission RECORD;
    v_current_date DATE;
    v_work_hours_record RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Per ogni permesso approvato esistente
    FOR v_permission IN 
        SELECT * FROM permessiferie 
        WHERE status = 'approved'
    LOOP
        -- Per ogni giorno del periodo di permesso
        v_current_date := v_permission.start_date;
        
        WHILE v_current_date <= v_permission.end_date LOOP
            -- Controlla se esiste già un record work_hours
            SELECT * INTO v_work_hours_record
            FROM work_hours 
            WHERE member_id = v_permission.member_id 
              AND date = v_current_date;
            
            IF v_work_hours_record IS NULL THEN
                -- Crea un nuovo record work_hours
                INSERT INTO work_hours (
                    member_id,
                    salon_id,
                    date,
                    start_time,
                    end_time,
                    total_hours,
                    break_time,
                    notes,
                    status
                ) VALUES (
                    v_permission.member_id,
                    v_permission.salon_id,
                    v_current_date,
                    COALESCE(v_permission.start_time, '00:00:00'),
                    COALESCE(v_permission.end_time, '00:00:00'),
                    0,
                    0,
                    CONCAT('Permesso approvato: ', v_permission.type, ' - ', v_permission.reason),
                    'absent'
                );
                v_count := v_count + 1;
            END IF;
            
            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ottenere statistiche sui permessi e ore lavorative
CREATE OR REPLACE FUNCTION get_permissions_work_hours_stats(
    p_salon_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_permissions', (
            SELECT COUNT(*) 
            FROM permessiferie 
            WHERE salon_id = p_salon_id
              AND (p_start_date IS NULL OR start_date >= p_start_date)
              AND (p_end_date IS NULL OR end_date <= p_end_date)
        ),
        'approved_permissions', (
            SELECT COUNT(*) 
            FROM permessiferie 
            WHERE salon_id = p_salon_id 
              AND status = 'approved'
              AND (p_start_date IS NULL OR start_date >= p_start_date)
              AND (p_end_date IS NULL OR end_date <= p_end_date)
        ),
        'pending_permissions', (
            SELECT COUNT(*) 
            FROM permessiferie 
            WHERE salon_id = p_salon_id 
              AND status = 'pending'
              AND (p_start_date IS NULL OR start_date >= p_start_date)
              AND (p_end_date IS NULL OR end_date <= p_end_date)
        ),
        'rejected_permissions', (
            SELECT COUNT(*) 
            FROM permessiferie 
            WHERE salon_id = p_salon_id 
              AND status = 'rejected'
              AND (p_start_date IS NULL OR start_date >= p_start_date)
              AND (p_end_date IS NULL OR end_date <= p_end_date)
        ),
        'total_work_hours', (
            SELECT COALESCE(SUM(total_hours), 0)
            FROM work_hours 
            WHERE salon_id = p_salon_id 
              AND status = 'completed'
              AND (p_start_date IS NULL OR date >= p_start_date)
              AND (p_end_date IS NULL OR date <= p_end_date)
        ),
        'absent_days', (
            SELECT COUNT(*)
            FROM work_hours 
            WHERE salon_id = p_salon_id 
              AND status = 'absent'
              AND (p_start_date IS NULL OR date >= p_start_date)
              AND (p_end_date IS NULL OR date <= p_end_date)
        ),
        'permissions_by_type', (
            SELECT json_object_agg(type, count)
            FROM (
                SELECT type, COUNT(*) as count
                FROM permessiferie 
                WHERE salon_id = p_salon_id
                  AND (p_start_date IS NULL OR start_date >= p_start_date)
                  AND (p_end_date IS NULL OR end_date <= p_end_date)
                GROUP BY type
            ) t
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ottenere il calendario integrato permessi/ore lavorative
CREATE OR REPLACE FUNCTION get_integrated_calendar(
    p_salon_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    date DATE,
    member_id UUID,
    member_name TEXT,
    work_hours_status TEXT,
    work_hours_start TIME,
    work_hours_end TIME,
    work_hours_total DECIMAL(4,2),
    permission_type TEXT,
    permission_status TEXT,
    permission_reason TEXT,
    is_working_day BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.date,
        COALESCE(wh.member_id, p.member_id) as member_id,
        COALESCE(t.name, tm.name) as member_name,
        wh.status as work_hours_status,
        wh.start_time as work_hours_start,
        wh.end_time as work_hours_end,
        wh.total_hours as work_hours_total,
        p.type as permission_type,
        p.status as permission_status,
        p.reason as permission_reason,
        CASE 
            WHEN wh.status = 'completed' THEN true
            WHEN p.status = 'approved' THEN false
            ELSE true -- default per giorni senza dati
        END as is_working_day
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d
    CROSS JOIN (
        SELECT DISTINCT member_id, name 
        FROM team 
        WHERE salon_id = p_salon_id AND is_active = true
    ) tm
    LEFT JOIN work_hours wh ON wh.date = d AND wh.member_id = tm.member_id
    LEFT JOIN team t ON t.id = wh.member_id
    LEFT JOIN permessiferie p ON p.member_id = tm.member_id 
        AND d BETWEEN p.start_date AND p.end_date
        AND p.status = 'approved'
    ORDER BY d, tm.name;
END;
$$ LANGUAGE plpgsql;

-- Commenti per documentazione
COMMENT ON FUNCTION sync_permissions_with_work_hours() IS 'Sincronizza automaticamente i permessi approvati dalla tabella permessiferie con le ore lavorative, marcando i giorni di permesso come absent';
COMMENT ON FUNCTION sync_all_existing_permissions() IS 'Sincronizza tutti i permessi esistenti approvati dalla tabella permessiferie con le ore lavorative (da eseguire una volta)';
COMMENT ON FUNCTION get_permissions_work_hours_stats(UUID, DATE, DATE) IS 'Ottiene statistiche integrate sui permessi dalla tabella permessiferie e ore lavorative';
COMMENT ON FUNCTION get_integrated_calendar(UUID, DATE, DATE) IS 'Ottiene il calendario integrato con permessi dalla tabella permessiferie e ore lavorative'; 