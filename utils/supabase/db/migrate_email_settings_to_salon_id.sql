-- Script di migrazione per cambiare email_settings da user_id a salon_id
-- Esegui questo script per aggiornare la struttura della tabella

-- 1. Aggiungi la colonna salon_id se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_settings' 
        AND column_name = 'salon_id'
    ) THEN
        ALTER TABLE email_settings ADD COLUMN salon_id UUID;
        RAISE NOTICE 'Colonna salon_id aggiunta alla tabella email_settings';
    ELSE
        RAISE NOTICE 'Colonna salon_id già esistente nella tabella email_settings';
    END IF;
END $$;

-- 2. Popola salon_id dai profili degli utenti
UPDATE email_settings 
SET salon_id = profiles.salon_id
FROM profiles 
WHERE email_settings.user_id = profiles.id 
AND email_settings.salon_id IS NULL;

-- 3. Popola salon_id dal team per gli utenti che non sono in profiles
UPDATE email_settings 
SET salon_id = team.salon_id
FROM team 
WHERE email_settings.user_id = team.user_id 
AND email_settings.salon_id IS NULL;

-- 4. Rimuovi le righe senza salon_id (utenti senza salone associato)
DELETE FROM email_settings WHERE salon_id IS NULL;

-- 5. DISABILITA RLS e rimuovi le policy PRIMA di eliminare la colonna user_id
ALTER TABLE email_settings DISABLE ROW LEVEL SECURITY;

-- Rimuovi le policy esistenti
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_settings' 
        AND policyname = 'Users can view own email settings'
    ) THEN
        DROP POLICY "Users can view own email settings" ON email_settings;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_settings' 
        AND policyname = 'Users can insert own email settings'
    ) THEN
        DROP POLICY "Users can insert own email settings" ON email_settings;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_settings' 
        AND policyname = 'Users can update own email settings'
    ) THEN
        DROP POLICY "Users can update own email settings" ON email_settings;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_settings' 
        AND policyname = 'Users can delete own email settings'
    ) THEN
        DROP POLICY "Users can delete own email settings" ON email_settings;
    END IF;
    
    RAISE NOTICE 'Policy esistenti rimosse';
END $$;

-- 6. Ora puoi rimuovere la colonna user_id e rendere salon_id NOT NULL
ALTER TABLE email_settings ALTER COLUMN salon_id SET NOT NULL;
ALTER TABLE email_settings DROP COLUMN user_id;

-- 7. Aggiorna l'indice
DROP INDEX IF EXISTS idx_email_settings_user_id;
CREATE INDEX IF NOT EXISTS idx_email_settings_salon_id ON email_settings(salon_id);

-- 8. Aggiorna il vincolo UNIQUE
ALTER TABLE email_settings DROP CONSTRAINT IF EXISTS email_settings_user_id_key;
ALTER TABLE email_settings ADD CONSTRAINT email_settings_salon_id_key UNIQUE (salon_id);

-- 9. Crea nuove policy basate su salon_id
CREATE POLICY "Users can view salon email settings" ON email_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.salon_id = email_settings.salon_id
    ) OR EXISTS (
      SELECT 1 FROM team WHERE team.user_id = auth.uid() AND team.salon_id = email_settings.salon_id
    )
  );

CREATE POLICY "Users can insert salon email settings" ON email_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.salon_id = email_settings.salon_id
    ) OR EXISTS (
      SELECT 1 FROM team WHERE team.user_id = auth.uid() AND team.salon_id = email_settings.salon_id
    )
  );

CREATE POLICY "Users can update salon email settings" ON email_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.salon_id = email_settings.salon_id
    ) OR EXISTS (
      SELECT 1 FROM team WHERE team.user_id = auth.uid() AND team.salon_id = email_settings.salon_id
    )
  );

CREATE POLICY "Users can delete salon email settings" ON email_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.salon_id = email_settings.salon_id
    ) OR EXISTS (
      SELECT 1 FROM team WHERE team.user_id = auth.uid() AND team.salon_id = email_settings.salon_id
    )
  );

-- 10. Riabilita RLS
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Messaggio di completamento
DO $$
BEGIN
    RAISE NOTICE 'Migrazione email_settings completata con successo';
END $$; 