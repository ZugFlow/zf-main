-- Script per pulire le policy esistenti della tabella email_settings
-- Esegui questo script se ricevi errori di policy già esistenti

-- Disabilita temporaneamente RLS
ALTER TABLE email_settings DISABLE ROW LEVEL SECURITY;

-- Rimuovi tutte le policy esistenti
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Rimuovi tutte le policy esistenti per email_settings
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'email_settings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON email_settings', policy_record.policyname);
        RAISE NOTICE 'Policy rimossa: %', policy_record.policyname;
    END LOOP;
    
    RAISE NOTICE 'Tutte le policy per email_settings sono state rimosse';
END $$;

-- Riabilita RLS
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Ricrea le policy corrette
CREATE POLICY "Users can view own email settings" ON email_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email settings" ON email_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email settings" ON email_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email settings" ON email_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Verifica che le policy siano state create correttamente
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'email_settings'
ORDER BY policyname; 