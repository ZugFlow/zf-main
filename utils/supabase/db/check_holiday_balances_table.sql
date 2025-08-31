-- Script per verificare e creare la tabella holiday_balances se non esiste
DO $$
BEGIN
    -- Verifica se la tabella esiste
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'holiday_balances') THEN
        RAISE NOTICE 'Creating holiday_balances table...';
        
        -- Crea la tabella
        CREATE TABLE holiday_balances (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          member_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
          salon_id UUID NOT NULL,
          year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
          total_days INTEGER NOT NULL DEFAULT 25,
          used_days INTEGER NOT NULL DEFAULT 0,
          pending_days INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Vincolo unico per evitare duplicati per membro/anno
          UNIQUE(member_id, year)
        );

        -- Indici per performance
        CREATE INDEX idx_holiday_balances_member_id ON holiday_balances(member_id);
        CREATE INDEX idx_holiday_balances_salon_id ON holiday_balances(salon_id);
        CREATE INDEX idx_holiday_balances_year ON holiday_balances(year);

        -- Trigger per aggiornare updated_at
        CREATE OR REPLACE FUNCTION update_holiday_balances_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_update_holiday_balances_updated_at
          BEFORE UPDATE ON holiday_balances
          FOR EACH ROW
          EXECUTE FUNCTION update_holiday_balances_updated_at();

        RAISE NOTICE 'holiday_balances table created successfully!';
    ELSE
        RAISE NOTICE 'holiday_balances table already exists.';
    END IF;
END $$;

-- Verifica la struttura della tabella
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'holiday_balances' 
ORDER BY ordinal_position; 