-- Funzione per verificare la disponibilità di uno slot specifico
-- Considera gli orari di lavoro settimanali, extra schedules, permessi e appuntamenti esistenti
-- Include sia prenotazioni nella tabella orders che nella tabella online_bookings

CREATE OR REPLACE FUNCTION check_slot_availability(
  p_salon_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER, -- durata in minuti
  p_team_member_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_time TIME;
  v_end_time TIME;
  v_day_of_week INTEGER;
  v_week_start_date DATE;
  v_has_conflict BOOLEAN := FALSE;
  v_member_schedule RECORD;
  v_existing_appointment RECORD;
  v_existing_online_booking RECORD;
  v_extra_schedule RECORD;
  v_permission RECORD;
BEGIN
  -- Calcola orario di fine
  v_start_time := p_time;
  v_end_time := p_time + (p_duration || ' minutes')::INTERVAL;
  
  -- Calcola il giorno della settimana (0 = Domenica, 1 = Lunedì, ..., 6 = Sabato)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Calcola l'inizio della settimana per i permessi
  v_week_start_date := p_date - (v_day_of_week || ' days')::INTERVAL;
  
  -- Se è specificato un membro del team, verifica solo per lui
  IF p_team_member_id IS NOT NULL THEN
    -- Verifica orari di lavoro settimanali
    SELECT * INTO v_member_schedule
    FROM working_hours
    WHERE salon_id = p_salon_id 
      AND team_member_id = p_team_member_id
      AND day_of_week = v_day_of_week
      AND is_active = true;
    
    -- Se non ci sono orari impostati per questo giorno, lo slot non è disponibile
    IF v_member_schedule IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Verifica se lo slot è all'interno degli orari di lavoro
    IF v_start_time < v_member_schedule.start_time OR v_end_time > v_member_schedule.end_time THEN
      RETURN FALSE;
    END IF;
    
    -- Verifica extra schedules (orari speciali)
    SELECT * INTO v_extra_schedule
    FROM extra_schedules
    WHERE salon_id = p_salon_id 
      AND team_member_id = p_team_member_id
      AND date = p_date
      AND is_active = true;
    
    -- Se c'è un extra schedule per questa data, usa quello invece degli orari settimanali
    IF v_extra_schedule IS NOT NULL THEN
      IF v_start_time < v_extra_schedule.start_time OR v_end_time > v_extra_schedule.end_time THEN
        RETURN FALSE;
      END IF;
    END IF;
    
    -- Verifica permessi/ferie
    SELECT * INTO v_permission
    FROM permessiferie
    WHERE salon_id = p_salon_id 
      AND team_member_id = p_team_member_id
      AND week_start_date = v_week_start_date
      AND day_of_week = v_day_of_week
      AND is_active = true;
    
    -- Se c'è un permesso per questo giorno, lo slot non è disponibile
    IF v_permission IS NOT NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Verifica conflitti con appuntamenti esistenti nella tabella orders
    SELECT * INTO v_existing_appointment
    FROM orders
    WHERE salon_id = p_salon_id 
      AND team_id = p_team_member_id
      AND data = p_date
      AND status NOT IN ('Annullato', 'Eliminato')
      AND (
        (orarioInizio < v_end_time AND orarioFine > v_start_time) OR
        (orarioInizio = v_start_time AND orarioFine = v_end_time)
      )
    LIMIT 1;
    
    IF v_existing_appointment IS NOT NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Verifica conflitti con prenotazioni online esistenti (pending o approved)
    SELECT * INTO v_existing_online_booking
    FROM online_bookings
    WHERE salon_id = p_salon_id 
      AND team_member_id = p_team_member_id
      AND booking_date = p_date
      AND status IN ('pending', 'approved')
      AND (
        (start_time < v_end_time AND end_time > v_start_time) OR
        (start_time = v_start_time AND end_time = v_end_time)
      )
    LIMIT 1;
    
    IF v_existing_online_booking IS NOT NULL THEN
      RETURN FALSE;
    END IF;
    
    RETURN TRUE;
  ELSE
    -- Se non è specificato un membro, verifica se almeno un membro è disponibile
    FOR v_member_schedule IN 
      SELECT DISTINCT wh.team_member_id
      FROM working_hours wh
      WHERE wh.salon_id = p_salon_id 
        AND wh.day_of_week = v_day_of_week
        AND wh.is_active = true
        AND wh.start_time <= v_start_time 
        AND wh.end_time >= v_end_time
    LOOP
      -- Verifica extra schedules
      SELECT * INTO v_extra_schedule
      FROM extra_schedules
      WHERE salon_id = p_salon_id 
        AND team_member_id = v_member_schedule.team_member_id
        AND date = p_date
        AND is_active = true;
      
      -- Se c'è un extra schedule, verifica se è compatibile
      IF v_extra_schedule IS NOT NULL THEN
        IF v_start_time >= v_extra_schedule.start_time AND v_end_time <= v_extra_schedule.end_time THEN
          -- Verifica permessi
          SELECT * INTO v_permission
          FROM permessiferie
          WHERE salon_id = p_salon_id 
            AND team_member_id = v_member_schedule.team_member_id
            AND week_start_date = v_week_start_date
            AND day_of_week = v_day_of_week
            AND is_active = true;
          
          -- Se non ci sono permessi, verifica appuntamenti
          IF v_permission IS NULL THEN
            -- Verifica appuntamenti nella tabella orders
            SELECT * INTO v_existing_appointment
            FROM orders
            WHERE salon_id = p_salon_id 
              AND team_id = v_member_schedule.team_member_id
              AND data = p_date
              AND status NOT IN ('Annullato', 'Eliminato')
              AND (
                (orarioInizio < v_end_time AND orarioFine > v_start_time) OR
                (orarioInizio = v_start_time AND orarioFine = v_end_time)
              )
            LIMIT 1;
            
            -- Se non ci sono conflitti con orders, verifica online_bookings
            IF v_existing_appointment IS NULL THEN
              SELECT * INTO v_existing_online_booking
              FROM online_bookings
              WHERE salon_id = p_salon_id 
                AND team_member_id = v_member_schedule.team_member_id
                AND booking_date = p_date
                AND status IN ('pending', 'approved')
                AND (
                  (start_time < v_end_time AND end_time > v_start_time) OR
                  (start_time = v_start_time AND end_time = v_end_time)
                )
              LIMIT 1;
              
              IF v_existing_online_booking IS NULL THEN
                RETURN TRUE; -- Almeno un membro è disponibile
              END IF;
            END IF;
          END IF;
        END IF;
      ELSE
        -- Usa orari settimanali normali
        SELECT * INTO v_permission
        FROM permessiferie
        WHERE salon_id = p_salon_id 
          AND team_member_id = v_member_schedule.team_member_id
          AND week_start_date = v_week_start_date
          AND day_of_week = v_day_of_week
          AND is_active = true;
        
        -- Se non ci sono permessi, verifica appuntamenti
        IF v_permission IS NULL THEN
          -- Verifica appuntamenti nella tabella orders
          SELECT * INTO v_existing_appointment
          FROM orders
          WHERE salon_id = p_salon_id 
            AND team_id = v_member_schedule.team_member_id
            AND data = p_date
            AND status NOT IN ('Annullato', 'Eliminato')
            AND (
              (orarioInizio < v_end_time AND orarioFine > v_start_time) OR
              (orarioInizio = v_start_time AND orarioFine = v_end_time)
            )
          LIMIT 1;
          
          -- Se non ci sono conflitti con orders, verifica online_bookings
          IF v_existing_appointment IS NULL THEN
            SELECT * INTO v_existing_online_booking
            FROM online_bookings
            WHERE salon_id = p_salon_id 
              AND team_member_id = v_member_schedule.team_member_id
              AND booking_date = p_date
              AND status IN ('pending', 'approved')
              AND (
                (start_time < v_end_time AND end_time > v_start_time) OR
                (start_time = v_start_time AND end_time = v_end_time)
              )
            LIMIT 1;
            
            IF v_existing_online_booking IS NULL THEN
              RETURN TRUE; -- Almeno un membro è disponibile
            END IF;
          END IF;
        END IF;
      END IF;
    END LOOP;
    
    RETURN FALSE; -- Nessun membro disponibile
  END IF;
END;
$$; 