-- Migrazione per correggere la foreign key della tabella custom_texts
-- Se la tabella esiste già con la foreign key sbagliata, questo script la corregge

-- Rimuovi la foreign key esistente se presente (se esiste)
DO $$
BEGIN
    -- Controlla se esiste una foreign key che punta a salon(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_texts_salon_id_fkey' 
        AND table_name = 'custom_texts'
    ) THEN
        ALTER TABLE custom_texts DROP CONSTRAINT custom_texts_salon_id_fkey;
    END IF;
END $$;

-- Aggiungi la foreign key corretta che punta a profiles(salon_id)
ALTER TABLE custom_texts 
ADD CONSTRAINT custom_texts_salon_id_fkey 
FOREIGN KEY (salon_id) REFERENCES profiles(salon_id) ON DELETE CASCADE;

-- Crea un indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_custom_texts_salon_id_profiles 
ON custom_texts(salon_id);

-- Verifica che tutti i salon_id nella tabella custom_texts esistano in profiles
-- Se ci sono record orfani, li rimuove
DELETE FROM custom_texts 
WHERE salon_id IS NOT NULL 
  AND salon_id NOT IN (SELECT salon_id FROM profiles WHERE salon_id IS NOT NULL); 