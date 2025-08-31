-- =====================================================
-- MIGRAZIONE PERMESSI A ORE LAVORATIVE
-- Script per sincronizzare permessi esistenti
-- =====================================================

-- Verifica che le funzioni esistano
DO $$
BEGIN
    -- Controlla se la funzione sync_all_existing_permissions esiste
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_all_existing_permissions') THEN
        RAISE EXCEPTION 'La funzione sync_all_existing_permissions non esiste. Eseguire prima integrate_permissions_with_work_hours.sql';
    END IF;
END $$;

-- Log iniziale
DO $$
BEGIN
    RAISE NOTICE 'Iniziando migrazione permessi a ore lavorative...';
    RAISE NOTICE 'Timestamp: %', NOW();
END $$;

-- Conta permessi esistenti
DO $$
DECLARE
    v_total_permissions INTEGER;
    v_approved_permissions INTEGER;
    v_existing_work_hours INTEGER;
BEGIN
    -- Conta permessi totali
    SELECT COUNT(*) INTO v_total_permissions FROM permessiferie;
    
    -- Conta permessi approvati
    SELECT COUNT(*) INTO v_approved_permissions FROM permessiferie WHERE status = 'approved';
    
    -- Conta record work_hours esistenti
    SELECT COUNT(*) INTO v_existing_work_hours FROM work_hours WHERE status = 'absent';
    
    RAISE NOTICE 'Statistiche iniziali:';
    RAISE NOTICE '- Permessi totali: %', v_total_permissions;
    RAISE NOTICE '- Permessi approvati: %', v_approved_permissions;
    RAISE NOTICE '- Record work_hours con status absent: %', v_existing_work_hours;
END $$;

-- Esegui sincronizzazione
DO $$
DECLARE
    v_synced_count INTEGER;
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
BEGIN
    v_start_time := NOW();
    
    -- Esegui sincronizzazione
    SELECT sync_all_existing_permissions() INTO v_synced_count;
    
    v_end_time := NOW();
    
    RAISE NOTICE 'Sincronizzazione completata:';
    RAISE NOTICE '- Record creati: %', v_synced_count;
    RAISE NOTICE '- Tempo impiegato: %', v_end_time - v_start_time;
END $$;

-- Verifica risultati
DO $$
DECLARE
    v_final_work_hours INTEGER;
    v_permissions_by_type JSON;
    v_permissions_by_salon JSON;
BEGIN
    -- Conta record work_hours finali
    SELECT COUNT(*) INTO v_final_work_hours FROM work_hours WHERE status = 'absent';
    
    -- Statistiche per tipo di permesso
    SELECT json_object_agg(type, count) INTO v_permissions_by_type
    FROM (
        SELECT p.type, COUNT(*) as count
        FROM permessiferie p
        JOIN work_hours wh ON wh.member_id = p.member_id 
            AND wh.date BETWEEN p.start_date AND p.end_date
            AND wh.status = 'absent'
        WHERE p.status = 'approved'
        GROUP BY p.type
    ) t;
    
    -- Statistiche per salone
    SELECT json_object_agg(salon_id::text, count) INTO v_permissions_by_salon
    FROM (
        SELECT p.salon_id, COUNT(*) as count
        FROM permessiferie p
        JOIN work_hours wh ON wh.member_id = p.member_id 
            AND wh.date BETWEEN p.start_date AND p.end_date
            AND wh.status = 'absent'
        WHERE p.status = 'approved'
        GROUP BY p.salon_id
    ) t;
    
    RAISE NOTICE 'Risultati finali:';
    RAISE NOTICE '- Record work_hours con status absent: %', v_final_work_hours;
    RAISE NOTICE '- Permessi per tipo: %', v_permissions_by_type;
    RAISE NOTICE '- Permessi per salone: %', v_permissions_by_salon;
END $$;

-- Verifica integrità dati
DO $$
DECLARE
    v_orphaned_work_hours INTEGER;
    v_missing_work_hours INTEGER;
BEGIN
    -- Conta record work_hours senza permesso corrispondente
    SELECT COUNT(*) INTO v_orphaned_work_hours
    FROM work_hours wh
    WHERE wh.status = 'absent'
      AND NOT EXISTS (
          SELECT 1 FROM permessiferie p
          WHERE p.member_id = wh.member_id
            AND wh.date BETWEEN p.start_date AND p.end_date
            AND p.status = 'approved'
      );
    
    -- Conta permessi approvati senza record work_hours
    SELECT COUNT(*) INTO v_missing_work_hours
    FROM permessiferie p
    WHERE p.status = 'approved'
      AND NOT EXISTS (
          SELECT 1 FROM work_hours wh
          WHERE wh.member_id = p.member_id
            AND wh.date BETWEEN p.start_date AND p.end_date
            AND wh.status = 'absent'
      );
    
    RAISE NOTICE 'Verifica integrità:';
    RAISE NOTICE '- Record work_hours orfani: %', v_orphaned_work_hours;
    RAISE NOTICE '- Permessi senza record work_hours: %', v_missing_work_hours;
    
    IF v_orphaned_work_hours > 0 THEN
        RAISE WARNING 'Trovati % record work_hours senza permesso corrispondente', v_orphaned_work_hours;
    END IF;
    
    IF v_missing_work_hours > 0 THEN
        RAISE WARNING 'Trovati % permessi approvati senza record work_hours', v_missing_work_hours;
    END IF;
END $$;

-- Log finale
DO $$
BEGIN
    RAISE NOTICE 'Migrazione completata con successo!';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE 'I permessi approvati sono ora sincronizzati con le ore lavorative.';
END $$;

-- =====================================================
-- QUERY DI VERIFICA POST-MIGRAZIONE
-- =====================================================

-- Query per verificare la sincronizzazione
-- (da eseguire manualmente se necessario)

/*
-- Verifica permessi e work_hours per un salone specifico
SELECT 
    p.id as permission_id,
    p.member_id,
    p.type,
    p.start_date,
    p.end_date,
    p.status,
    COUNT(wh.id) as work_hours_count,
    MIN(wh.date) as first_work_hour_date,
    MAX(wh.date) as last_work_hour_date
FROM permessiferie p
LEFT JOIN work_hours wh ON wh.member_id = p.member_id 
    AND wh.date BETWEEN p.start_date AND p.end_date
    AND wh.status = 'absent'
WHERE p.salon_id = 'your-salon-uuid'
  AND p.status = 'approved'
GROUP BY p.id, p.member_id, p.type, p.start_date, p.end_date, p.status
ORDER BY p.start_date DESC;

-- Verifica statistiche per salone
SELECT 
    get_permissions_work_hours_stats('your-salon-uuid') as stats;

-- Verifica calendario integrato per un periodo
SELECT * FROM get_integrated_calendar('your-salon-uuid', '2024-01-01', '2024-01-31')
WHERE member_id = 'specific-member-uuid'
ORDER BY date, member_name;
*/ 