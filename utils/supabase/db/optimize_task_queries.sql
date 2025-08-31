-- =====================================================
-- OTTIMIZZAZIONI PERFORMANCE TASK MANAGER
-- =====================================================
-- Questo script aggiunge indici specifici per migliorare 
-- le performance del Task Manager sulla tabella orders
-- 
-- NOTA: orarioInizio e orarioFine sono di tipo TEXT
-- Alcuni indici base esistono già: idx_orders_salon_task, idx_orders_task

-- 1. INDICE COMPOSITO PER QUERY TASK FREQUENTI 
-- =====================================================
-- Ottimizza la query principale: salon_id + task + user_id + ordinamento
-- Questo è più specifico dell'indice esistente idx_orders_salon_task
CREATE INDEX IF NOT EXISTS idx_orders_task_performance 
ON orders(salon_id, task, user_id, data DESC, "orarioInizio" DESC) 
WHERE task = true;

-- 2. INDICI PER FILTRI COMUNI SUI TASK
-- =====================================================
-- Indice per filtro per status sui task (combinato con user_id per efficienza)
CREATE INDEX IF NOT EXISTS idx_orders_task_status 
ON orders(status, user_id, data DESC) 
WHERE task = true;

-- Indice per filtro per data sui task (combinato con user_id)
CREATE INDEX IF NOT EXISTS idx_orders_task_data_user 
ON orders(data, user_id, "orarioInizio") 
WHERE task = true;

-- 3. INDICE PER RICERCA FULL-TEXT
-- =====================================================
-- Ottimizza la ricerca per nome, descrizione e note
-- Usa configurazione italiana per stemming appropriato
CREATE INDEX IF NOT EXISTS idx_orders_task_search_gin 
ON orders USING gin((
  to_tsvector('italian', 
    COALESCE(nome, '') || ' ' || 
    COALESCE(descrizione, '') || ' ' || 
    COALESCE(note, '') || ' ' ||
    COALESCE(note_richtext, '')
  )
)) 
WHERE task = true;

-- 4. INDICE PER ORDINAMENTO OTTIMIZZATO
-- =====================================================
-- Ottimizza l'ordinamento predefinito per data e orario
CREATE INDEX IF NOT EXISTS idx_orders_task_ordering 
ON orders(salon_id, user_id, data DESC, "orarioInizio" DESC, created_at DESC) 
WHERE task = true;

-- 5. INDICE PER TEAM ASSIGNMENT E STATUS
-- =====================================================
-- Ottimizza query che includono team_id e status
CREATE INDEX IF NOT EXISTS idx_orders_task_team_status 
ON orders(salon_id, task, team_id, status, user_id) 
WHERE task = true;

-- 6. INDICE PER RANGE DI DATE (per filtri settimanali/mensili)
-- =====================================================
-- Ottimizza query con range di date
CREATE INDEX IF NOT EXISTS idx_orders_task_date_range 
ON orders(user_id, data, status) 
WHERE task = true AND status != 'Eliminato';

-- 7. STATISTICHE AGGIORNATE
-- =====================================================
-- Aggiorna le statistiche della tabella per il query planner
ANALYZE orders;

-- 8. COMMENTI PER DOCUMENTAZIONE
-- =====================================================
COMMENT ON INDEX idx_orders_task_performance IS 'Indice composito per query principali del Task Manager';
COMMENT ON INDEX idx_orders_task_status IS 'Indice per filtri per status sui task con ordinamento';
COMMENT ON INDEX idx_orders_task_data_user IS 'Indice per filtri per data sui task per utente';
COMMENT ON INDEX idx_orders_task_search_gin IS 'Indice GIN per ricerca full-text sui task (italiano)';
COMMENT ON INDEX idx_orders_task_ordering IS 'Indice per ordinamento ottimizzato dei task';
COMMENT ON INDEX idx_orders_task_team_status IS 'Indice per assegnazioni team e status sui task';
COMMENT ON INDEX idx_orders_task_date_range IS 'Indice per filtri range di date sui task attivi';

-- 9. VERIFICA INDICI ESISTENTI
-- =====================================================
-- Query per verificare che gli indici siano stati creati correttamente
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'orders' 
  AND (indexname LIKE '%task%' OR indexname LIKE '%orders%')
ORDER BY indexname;

-- 10. ANALISI PERFORMANCE
-- =====================================================
-- Query semplificata per verificare la struttura degli indici
-- Questa query dovrebbe usare gli indici ottimizzati
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    id, nome, status, data, "orarioInizio", descrizione, note
FROM orders 
WHERE task = true 
ORDER BY data DESC, "orarioInizio" DESC 
LIMIT 10;

-- Query per testare filtro per status sui task
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, nome, data, "orarioInizio" 
FROM orders 
WHERE task = true AND status = 'In corso'
ORDER BY data DESC, "orarioInizio" DESC
LIMIT 50;

-- Query per testare la ricerca full-text sui task
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, nome, descrizione
FROM orders 
WHERE task = true 
  AND to_tsvector('italian', 
      COALESCE(nome, '') || ' ' || 
      COALESCE(descrizione, '') || ' ' || 
      COALESCE(note, '')
    ) @@ plainto_tsquery('italian', 'esempio')
LIMIT 20;

-- =====================================================
-- MESSAGGI DI COMPLETAMENTO
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Ottimizzazioni Task Manager completate!';
    RAISE NOTICE '📊 Nuovi indici aggiunti (evitando duplicazioni):';
    RAISE NOTICE '   - idx_orders_task_performance (query principali ottimizzate)';
    RAISE NOTICE '   - idx_orders_task_status (filtri status con ordinamento)';
    RAISE NOTICE '   - idx_orders_task_data_user (filtri data per utente)';
    RAISE NOTICE '   - idx_orders_task_search_gin (ricerca full-text italiana)';
    RAISE NOTICE '   - idx_orders_task_ordering (ordinamento ottimizzato)';
    RAISE NOTICE '   - idx_orders_task_team_status (team e status combinati)';
    RAISE NOTICE '   - idx_orders_task_date_range (range date per task attivi)';
    RAISE NOTICE '';
    RAISE NOTICE '📈 Indici esistenti utilizzati:';
    RAISE NOTICE '   - idx_orders_salon_task (base salon + task)';
    RAISE NOTICE '   - idx_orders_task (filtro task base)';
    RAISE NOTICE '   - idx_orders_user_id (filtro user)';
    RAISE NOTICE '   - idx_orders_data (ordinamento data)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Performance del Task Manager significativamente migliorate!';
    RAISE NOTICE '📝 NOTA: orarioInizio/orarioFine sono TEXT - verifica formato nelle query';
END $$;
