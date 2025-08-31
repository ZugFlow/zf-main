-- Tabella per le impostazioni email degli utenti
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL,
  smtp_pass TEXT NOT NULL,
  from_email TEXT,
  from_name TEXT,
  provider TEXT DEFAULT 'gmail' CHECK (provider IN ('gmail', 'outlook', 'yahoo', 'custom')),
  secure BOOLEAN DEFAULT false,
  require_tls BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rimuovi il trigger se esiste già
DROP TRIGGER IF EXISTS trigger_update_email_settings_updated_at ON email_settings;

CREATE TRIGGER trigger_update_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_settings_updated_at();

-- RLS (Row Level Security) per proteggere i dati
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Rimuovi le policy se esistono già usando un blocco DO
DO $$ 
BEGIN
    -- Rimuovi le policy se esistono
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
    
    RAISE NOTICE 'Policy esistenti rimosse con successo';
END $$;

-- Policy per permettere agli utenti di vedere solo le proprie impostazioni
CREATE POLICY "Users can view own email settings" ON email_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di inserire le proprie impostazioni
CREATE POLICY "Users can insert own email settings" ON email_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di aggiornare le proprie impostazioni
CREATE POLICY "Users can update own email settings" ON email_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di eliminare le proprie impostazioni
CREATE POLICY "Users can delete own email settings" ON email_settings
  FOR DELETE USING (auth.uid() = user_id); 