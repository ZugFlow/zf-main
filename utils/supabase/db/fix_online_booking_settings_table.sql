-- =====================================================
-- FIX TABELLA online_booking_settings
-- =====================================================
-- Aggiunge i campi mancanti alla tabella online_booking_settings

-- 1. Verifica la struttura attuale
DO $$
BEGIN
    RAISE NOTICE '=== STRUTTURA ATTUALE TABELLA ===';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'online_booking_settings'
ORDER BY ordinal_position;

-- 2. Aggiungi campi mancanti se non esistono
DO $$
BEGIN
    -- Aggiungi booking_start_time se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'booking_start_time') THEN
        ALTER TABLE online_booking_settings ADD COLUMN booking_start_time TIME DEFAULT '09:00';
        RAISE NOTICE '✅ Aggiunto campo booking_start_time';
    ELSE
        RAISE NOTICE 'ℹ️ Campo booking_start_time già esistente';
    END IF;

    -- Aggiungi booking_end_time se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'booking_end_time') THEN
        ALTER TABLE online_booking_settings ADD COLUMN booking_end_time TIME DEFAULT '18:00';
        RAISE NOTICE '✅ Aggiunto campo booking_end_time';
    ELSE
        RAISE NOTICE 'ℹ️ Campo booking_end_time già esistente';
    END IF;

    -- Aggiungi slot_duration se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'slot_duration') THEN
        ALTER TABLE online_booking_settings ADD COLUMN slot_duration INTEGER DEFAULT 15;
        RAISE NOTICE '✅ Aggiunto campo slot_duration';
    ELSE
        RAISE NOTICE 'ℹ️ Campo slot_duration già esistente';
    END IF;

    -- Aggiungi min_notice_hours se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'min_notice_hours') THEN
        ALTER TABLE online_booking_settings ADD COLUMN min_notice_hours INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Aggiunto campo min_notice_hours';
    ELSE
        RAISE NOTICE 'ℹ️ Campo min_notice_hours già esistente';
    END IF;

    -- Aggiungi max_days_ahead se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'max_days_ahead') THEN
        ALTER TABLE online_booking_settings ADD COLUMN max_days_ahead INTEGER DEFAULT 30;
        RAISE NOTICE '✅ Aggiunto campo max_days_ahead';
    ELSE
        RAISE NOTICE 'ℹ️ Campo max_days_ahead già esistente';
    END IF;

    -- Aggiungi allow_same_day_booking se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'allow_same_day_booking') THEN
        ALTER TABLE online_booking_settings ADD COLUMN allow_same_day_booking BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Aggiunto campo allow_same_day_booking';
    ELSE
        RAISE NOTICE 'ℹ️ Campo allow_same_day_booking già esistente';
    END IF;

    -- Aggiungi max_bookings_per_day se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'max_bookings_per_day') THEN
        ALTER TABLE online_booking_settings ADD COLUMN max_bookings_per_day INTEGER DEFAULT 20;
        RAISE NOTICE '✅ Aggiunto campo max_bookings_per_day';
    ELSE
        RAISE NOTICE 'ℹ️ Campo max_bookings_per_day già esistente';
    END IF;

    -- Aggiungi require_approval se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'require_approval') THEN
        ALTER TABLE online_booking_settings ADD COLUMN require_approval BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Aggiunto campo require_approval';
    ELSE
        RAISE NOTICE 'ℹ️ Campo require_approval già esistente';
    END IF;

    -- Aggiungi auto_confirm se non esiste
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_booking_settings' AND column_name = 'auto_confirm') THEN
        ALTER TABLE online_booking_settings ADD COLUMN auto_confirm BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Aggiunto campo auto_confirm';
    ELSE
        RAISE NOTICE 'ℹ️ Campo auto_confirm già esistente';
    END IF;

END $$;

-- 3. Mostra la nuova struttura
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== NUOVA STRUTTURA TABELLA ===';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'online_booking_settings'
ORDER BY ordinal_position;

-- 4. Aggiorna i record esistenti con valori di default
UPDATE online_booking_settings 
SET 
    booking_start_time = COALESCE(booking_start_time, '09:00'),
    booking_end_time = COALESCE(booking_end_time, '18:00'),
    slot_duration = COALESCE(slot_duration, 15),
    min_notice_hours = COALESCE(min_notice_hours, 1),
    max_days_ahead = COALESCE(max_days_ahead, 30),
    allow_same_day_booking = COALESCE(allow_same_day_booking, true),
    max_bookings_per_day = COALESCE(max_bookings_per_day, 20),
    require_approval = COALESCE(require_approval, false),
    auto_confirm = COALESCE(auto_confirm, true);

-- 5. Verifica finale
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICA FINALE ===';
    RAISE NOTICE 'Tabella online_booking_settings aggiornata con successo!';
    RAISE NOTICE 'Ora puoi tornare a usare l''endpoint originale /api/salon-web/bookings';
END $$; 