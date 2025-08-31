-- =====================================================
-- VERIFICA E CORREZIONE TABELLE PRENOTAZIONI ONLINE
-- =====================================================
-- Questo script verifica e corregge eventuali problemi
-- nelle tabelle delle prenotazioni online esistenti
-- =====================================================

-- =====================================================
-- 1. VERIFICA STRUTTURA TABELLE
-- =====================================================

-- Verifica se la tabella working_hours esiste e ha la struttura corretta
DO $$
BEGIN
    -- Verifica se la colonna team_member_id esiste in working_hours
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'working_hours') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'working_hours' AND column_name = 'team_member_id') THEN
            RAISE NOTICE 'La tabella working_hours esiste ma non ha la colonna team_member_id';
        ELSE
            RAISE NOTICE 'La tabella working_hours ha la struttura corretta';
        END IF;
    ELSE
        RAISE NOTICE 'La tabella working_hours non esiste';
    END IF;
    
    -- Verifica se la tabella online_bookings esiste e ha la struttura corretta
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_bookings') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_bookings' AND column_name = 'team_member_id') THEN
            RAISE NOTICE 'La tabella online_bookings esiste ma non ha la colonna team_member_id';
        ELSE
            RAISE NOTICE 'La tabella online_bookings ha la struttura corretta';
        END IF;
    ELSE
        RAISE NOTICE 'La tabella online_bookings non esiste';
    END IF;
    
    -- Verifica se la tabella online_booking_settings esiste
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_booking_settings') THEN
        RAISE NOTICE 'La tabella online_booking_settings esiste';
    ELSE
        RAISE NOTICE 'La tabella online_booking_settings non esiste';
    END IF;
END $$;

-- =====================================================
-- 2. CORREZIONE EVENTUALI PROBLEMI
-- =====================================================

-- Se la tabella working_hours esiste ma ha colonne sbagliate, la ricrea
DO $$
BEGIN
    -- Verifica se esiste una colonna team_id invece di team_member_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'working_hours' AND column_name = 'team_id') THEN
        RAISE NOTICE 'Rinominando team_id in team_member_id nella tabella working_hours...';
        ALTER TABLE working_hours RENAME COLUMN team_id TO team_member_id;
    END IF;
    
    -- Verifica se esiste una colonna user_id invece di team_member_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'working_hours' AND column_name = 'user_id') THEN
        RAISE NOTICE 'Rinominando user_id in team_member_id nella tabella working_hours...';
        ALTER TABLE working_hours RENAME COLUMN user_id TO team_member_id;
    END IF;
END $$;

-- Se la tabella online_bookings esiste ma ha colonne sbagliate, le corregge
DO $$
BEGIN
    -- Verifica se esiste una colonna team_id invece di team_member_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_bookings' AND column_name = 'team_id') THEN
        RAISE NOTICE 'Rinominando team_id in team_member_id nella tabella online_bookings...';
        ALTER TABLE online_bookings RENAME COLUMN team_id TO team_member_id;
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICA INDICI
-- =====================================================

-- Verifica e ricrea gli indici se necessario
DO $$
BEGIN
    -- Indici per working_hours
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'working_hours') THEN
        -- Indice salon_member
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_working_hours_salon_member') THEN
            CREATE INDEX idx_working_hours_salon_member ON working_hours(salon_id, team_member_id);
            RAISE NOTICE 'Creato indice idx_working_hours_salon_member';
        END IF;
        
        -- Indice day
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_working_hours_day') THEN
            CREATE INDEX idx_working_hours_day ON working_hours(day_of_week);
            RAISE NOTICE 'Creato indice idx_working_hours_day';
        END IF;
        
        -- Indice active
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_working_hours_active') THEN
            CREATE INDEX idx_working_hours_active ON working_hours(is_active);
            RAISE NOTICE 'Creato indice idx_working_hours_active';
        END IF;
    END IF;
    
    -- Indici per online_bookings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_bookings') THEN
        -- Indice salon_date
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_online_bookings_salon_date') THEN
            CREATE INDEX idx_online_bookings_salon_date ON online_bookings(salon_id, requested_date);
            RAISE NOTICE 'Creato indice idx_online_bookings_salon_date';
        END IF;
        
        -- Indice status
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_online_bookings_status') THEN
            CREATE INDEX idx_online_bookings_status ON online_bookings(status);
            RAISE NOTICE 'Creato indice idx_online_bookings_status';
        END IF;
        
        -- Indice team_member
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_online_bookings_team_member') THEN
            CREATE INDEX idx_online_bookings_team_member ON online_bookings(team_member_id);
            RAISE NOTICE 'Creato indice idx_online_bookings_team_member';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICA TRIGGER
-- =====================================================

-- Verifica e ricrea i trigger se necessario
DO $$
BEGIN
    -- Trigger per working_hours
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'working_hours') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_working_hours_updated_at') THEN
            CREATE TRIGGER update_working_hours_updated_at 
                BEFORE UPDATE ON working_hours 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            RAISE NOTICE 'Creato trigger update_working_hours_updated_at';
        END IF;
    END IF;
    
    -- Trigger per online_bookings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_bookings') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_online_bookings_updated_at') THEN
            CREATE TRIGGER update_online_bookings_updated_at 
                BEFORE UPDATE ON online_bookings 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            RAISE NOTICE 'Creato trigger update_online_bookings_updated_at';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_online_booking_fields_trigger') THEN
            CREATE TRIGGER sync_online_booking_fields_trigger
                BEFORE INSERT OR UPDATE ON online_bookings
                FOR EACH ROW EXECUTE FUNCTION sync_online_booking_fields();
            RAISE NOTICE 'Creato trigger sync_online_booking_fields_trigger';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5. REPORT FINALE
-- =====================================================

SELECT 
    'Verifica completata' as status,
    'Tutte le tabelle e gli indici sono stati verificati e corretti' as message; 