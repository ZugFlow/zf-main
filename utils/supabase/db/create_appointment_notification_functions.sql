-- Helper functions for appointment notifications

-- Function to create default notification records for a new appointment
-- Now empty since notifications are configured manually by the user
CREATE OR REPLACE FUNCTION create_default_appointment_notifications(
    p_appointment_id UUID,
    p_salon_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Notifications are now configured manually by the user in the UI
    -- No automatic notifications are created
    NULL;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the appointment creation
        RAISE WARNING 'Failed to create default notifications for appointment %: %', p_appointment_id, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending notifications for a specific time
CREATE OR REPLACE FUNCTION get_pending_notifications(
    p_salon_id UUID,
    p_minutes_before INTEGER
)
RETURNS TABLE (
    notification_id UUID,
    appointment_id UUID,
    method TEXT,
    time_minutes INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    appointment_date DATE,
    appointment_time TIME,
    team_member_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        an.id as notification_id,
        an.appointment_id,
        an.method,
        an.time_minutes,
        o.nome as customer_name,
        o.telefono as customer_phone,
        o.email as customer_email,
        o.data::DATE as appointment_date,
        o.orarioInizio::TIME as appointment_time,
        t.name as team_member_name
    FROM appointment_notifications an
    JOIN orders o ON an.appointment_id = o.id
    LEFT JOIN team t ON o.team_id = t.id
    WHERE an.salon_id = p_salon_id
        AND an.time_minutes = p_minutes_before
        AND an.sent = FALSE
        AND o.data::DATE = CURRENT_DATE + (p_minutes_before || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(
    p_notification_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE appointment_notifications 
    SET sent = TRUE, sent_at = NOW()
    WHERE id = p_notification_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification statistics for a salon
CREATE OR REPLACE FUNCTION get_notification_stats(
    p_salon_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    method TEXT,
    total_notifications BIGINT,
    sent_notifications BIGINT,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        an.method,
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN an.sent THEN 1 END) as sent_notifications,
        ROUND(
            (COUNT(CASE WHEN an.sent THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
            2
        ) as success_rate
    FROM appointment_notifications an
    JOIN orders o ON an.appointment_id = o.id
    WHERE an.salon_id = p_salon_id
        AND o.data::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY an.method
    ORDER BY an.method;
END;
$$ LANGUAGE plpgsql;

-- Function to create custom notification for an appointment
CREATE OR REPLACE FUNCTION create_custom_notification(
    p_appointment_id UUID,
    p_salon_id UUID,
    p_method TEXT,
    p_time_minutes INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Validate method
    IF p_method NOT IN ('sms', 'whatsapp', 'email') THEN
        RAISE EXCEPTION 'Invalid method: %. Must be sms, whatsapp, or email', p_method;
    END IF;
    
    -- Check if appointment exists and belongs to the salon
    IF NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE id = p_appointment_id AND salon_id = p_salon_id
    ) THEN
        RAISE EXCEPTION 'Appointment not found or does not belong to the specified salon';
    END IF;
    
    -- Create the notification
    INSERT INTO appointment_notifications (appointment_id, salon_id, method, time_minutes)
    VALUES (p_appointment_id, p_salon_id, p_method, p_time_minutes)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete all notifications for an appointment
CREATE OR REPLACE FUNCTION delete_appointment_notifications(
    p_appointment_id UUID,
    p_salon_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM appointment_notifications 
    WHERE appointment_id = p_appointment_id AND salon_id = p_salon_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger disabled - notifications are now created manually by the user
-- CREATE OR REPLACE FUNCTION trigger_create_appointment_notifications()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Only create notifications for new appointments (not updates)
--     IF TG_OP = 'INSERT' THEN
--         PERFORM create_default_appointment_notifications(NEW.id, NEW.salon_id);
--     END IF;
--     
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Create the trigger on the orders table
-- DROP TRIGGER IF EXISTS trigger_create_appointment_notifications ON orders;
-- CREATE TRIGGER trigger_create_appointment_notifications
--     AFTER INSERT ON orders
--     FOR EACH ROW
--     EXECUTE FUNCTION trigger_create_appointment_notifications(); 