-- Script per aggiornare la struttura della tabella appointment_notifications esistente
-- Esegui questo script nel database Supabase se la tabella esiste già

-- Verifica se la tabella esiste
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointment_notifications') THEN
        -- Aggiorna i vincoli se necessario
        ALTER TABLE appointment_notifications 
        DROP CONSTRAINT IF EXISTS appointment_notifications_method_check;
        
        ALTER TABLE appointment_notifications 
        ADD CONSTRAINT appointment_notifications_method_check 
        CHECK (method IN ('email', 'sms'));
        
        -- Aggiorna il vincolo unico se necessario
        ALTER TABLE appointment_notifications 
        DROP CONSTRAINT IF EXISTS appointment_notifications_salon_id_method_template_type_tim_key;
        
        ALTER TABLE appointment_notifications 
        ADD CONSTRAINT appointment_notifications_salon_id_method_template_type_tim_key 
        UNIQUE (salon_id, method, template_type, time_minutes);
        
        -- Aggiorna la foreign key se necessario
        ALTER TABLE appointment_notifications 
        DROP CONSTRAINT IF EXISTS appointment_notifications_salon_id_fkey;
        
        ALTER TABLE appointment_notifications 
        ADD CONSTRAINT appointment_notifications_salon_id_fkey 
        FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE;
        
        -- Crea indici se non esistono
        CREATE INDEX IF NOT EXISTS idx_appointment_notifications_salon_id 
        ON appointment_notifications USING btree (salon_id);
        
        CREATE INDEX IF NOT EXISTS idx_appointment_notifications_method 
        ON appointment_notifications USING btree (method);
        
        CREATE INDEX IF NOT EXISTS idx_appointment_notifications_template_type 
        ON appointment_notifications USING btree (template_type);
        
        CREATE INDEX IF NOT EXISTS idx_appointment_notifications_enabled 
        ON appointment_notifications USING btree (enabled);
        
        RAISE NOTICE 'Struttura della tabella appointment_notifications aggiornata con successo!';
    ELSE
        RAISE NOTICE 'La tabella appointment_notifications non esiste. Esegui prima create_appointment_notifications_table.sql';
    END IF;
END $$;

-- Verifica la struttura finale
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointment_notifications'
ORDER BY ordinal_position;

-- Verifica i vincoli
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'appointment_notifications';

-- Verifica gli indici
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'appointment_notifications'; 