-- Funzione per ottenere tutti gli slot disponibili per una data specifica
-- Genera slot di 15 minuti e verifica la disponibilità per ogni membro
-- Include sia prenotazioni nella tabella orders che nella tabella online_bookings

CREATE OR REPLACE FUNCTION get_available_slots(
  p_salon_id UUID,
  p_date DATE,
  p_team_member_id UUID DEFAULT NULL,
  p_slot_duration INTEGER DEFAULT 15 -- durata slot in minuti
)
RETURNS TABLE (
  time_slot TIME,
  available_members JSON,
  total_available_members INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_time TIME := '08:00'; -- Orario di apertura predefinito
  v_end_time TIME := '20:00';   -- Orario di chiusura predefinito
  v_current_time TIME;
  v_day_of_week INTEGER;
  v_week_start_date DATE;
  v_member_record RECORD;
  v_available_members JSON;
  v_member_count INTEGER;
  v_slot_start TIME;
  v_slot_end TIME;
BEGIN
  -- Ottieni gli orari di apertura dal salone se disponibili
  SELECT 
    COALESCE(booking_start_time, '08:00') INTO v_start_time,
    COALESCE(booking_end_time, '20:00') INTO v_end_time
  FROM online_booking_settings 
  WHERE salon_id = p_salon_id;
  
  -- Calcola il giorno della settimana
  v_day_of_week := EXTRACT(DOW FROM p_date);
  v_week_start_date := p_date - (v_day_of_week || ' days')::INTERVAL;
  
  -- Genera slot ogni p_slot_duration minuti
  v_current_time := v_start_time;
  
  WHILE v_current_time < v_end_time LOOP
    v_slot_start := v_current_time;
    v_slot_end := v_current_time + (p_slot_duration || ' minutes')::INTERVAL;
    
    -- Se lo slot finisce dopo l'orario di chiusura, salta
    IF v_slot_end > v_end_time THEN
      EXIT;
    END IF;
    
    -- Inizializza array per i membri disponibili
    v_available_members := '[]'::JSON;
    v_member_count := 0;
    
    -- Se è specificato un membro del team, verifica solo per lui
    IF p_team_member_id IS NOT NULL THEN
      -- Verifica disponibilità per il membro specifico
      IF check_slot_availability(p_salon_id, p_date, v_slot_start::TEXT, p_slot_duration, p_team_member_id) THEN
        -- Ottieni informazioni del membro
        SELECT 
          json_build_object(
            'id', t.id,
            'name', t.name,
            'email', t.email
          ) INTO v_available_members
        FROM team t
        WHERE t.id = p_team_member_id;
        
        v_member_count := 1;
      END IF;
    ELSE
      -- Verifica disponibilità per tutti i membri attivi
      FOR v_member_record IN 
        SELECT DISTINCT t.id, t.name, t.email
        FROM team t
        JOIN working_hours wh ON t.id = wh.team_member_id
        WHERE t.salon_id = p_salon_id
          AND t.is_active = true
          AND t.visible_users = true
          AND wh.day_of_week = v_day_of_week
          AND wh.is_active = true
          AND wh.start_time <= v_slot_start
          AND wh.end_time >= v_slot_end
      LOOP
        -- Verifica disponibilità per questo membro
        IF check_slot_availability(p_salon_id, p_date, v_slot_start::TEXT, p_slot_duration, v_member_record.id) THEN
          -- Aggiungi membro all'array
          v_available_members := v_available_members || json_build_object(
            'id', v_member_record.id,
            'name', v_member_record.name,
            'email', v_member_record.email
          );
          v_member_count := v_member_count + 1;
        END IF;
      END LOOP;
    END IF;
    
    -- Restituisci lo slot solo se ci sono membri disponibili
    IF v_member_count > 0 THEN
      time_slot := v_slot_start;
      available_members := v_available_members;
      total_available_members := v_member_count;
      RETURN NEXT;
    END IF;
    
    -- Passa al prossimo slot
    v_current_time := v_slot_end;
  END LOOP;
END;
$$; 