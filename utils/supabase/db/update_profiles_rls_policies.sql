-- Script per AGGIORNARE le policy RLS della tabella profiles
-- Esegui questo script per sostituire le policy vecchie con quelle corrette

-- =====================================================
-- STEP 1: RIMUOVI LE POLICY ESISTENTI
-- =====================================================

-- Rimuovi tutte le policy esistenti per profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Rimuovi i trigger esistenti per profiles
DROP TRIGGER IF EXISTS trigger_validate_profile_insert ON profiles;
DROP TRIGGER IF EXISTS trigger_validate_profile_update ON profiles;
DROP FUNCTION IF EXISTS validate_profile_insert();
DROP FUNCTION IF EXISTS validate_profile_update();

-- =====================================================
-- STEP 2: CREA LE POLICY CORRETTE
-- =====================================================

-- Policy per SELECT: permette di vedere il proprio profilo e i profili dei manager del proprio salone
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT
TO authenticated
USING (
    -- L'utente può sempre vedere il proprio profilo (se è un manager)
    id = auth.uid()
    OR
    -- Un collaboratore può vedere il profilo del manager del suo salone
    -- (per accedere a dati condivisi del salone)
    salon_id IN (
        SELECT salon_id 
        FROM team 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);

-- Policy per INSERT: permette solo di creare il proprio profilo (solo manager)
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
    -- L'utente può inserire solo il proprio profilo
    id = auth.uid()
    -- Il salon_id verrà generato automaticamente se NULL
    -- Il constraint unique_salon_id garantisce l'univocità
);

-- Policy per UPDATE: permette di modificare solo il proprio profilo
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE
TO authenticated
USING (
    -- L'utente può modificare solo il proprio profilo
    id = auth.uid()
)
WITH CHECK (
    -- Anche dopo la modifica, deve rimanere il proprio profilo
    id = auth.uid()
    -- Il salon_id non può essere cambiato se ci sono team members
    -- Questo controllo è gestito dal trigger validate_profile_update
);

-- Policy per DELETE: MOLTO RESTRITTIVA - eliminare un profilo è critico
CREATE POLICY "profiles_delete_policy" ON profiles
FOR DELETE
TO authenticated
USING (
    -- L'utente può eliminare solo il proprio profilo
    id = auth.uid()
    AND
    -- Solo se non ci sono team members collegati al salon
    NOT EXISTS (
        SELECT 1 FROM team WHERE salon_id = profiles.salon_id
    )
    AND
    -- Solo se non ci sono orders collegati al salon
    NOT EXISTS (
        SELECT 1 FROM orders WHERE salon_id = profiles.salon_id
    )
);

-- =====================================================
-- STEP 3: RICREA I TRIGGER AGGIORNATI
-- =====================================================

-- Trigger per validazioni aggiuntive durante l'inserimento
CREATE OR REPLACE FUNCTION validate_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Assicurati che l'utente non abbia già un profilo
    IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        RAISE EXCEPTION 'User already has a profile';
    END IF;
    
    -- Se non è specificato il salon_id, genera uno nuovo
    IF NEW.salon_id IS NULL THEN
        NEW.salon_id := gen_random_uuid();
    END IF;
    
    -- Assicurati che il salon_id sia unico (controllo aggiuntivo al constraint)
    IF EXISTS (SELECT 1 FROM profiles WHERE salon_id = NEW.salon_id AND id != NEW.id) THEN
        RAISE EXCEPTION 'Salon ID must be unique';
    END IF;
    
    -- Imposta role a 'manager' se non specificato (i profili sono per manager)
    IF NEW.role IS NULL THEN
        NEW.role := 'manager';
    END IF;
    
    -- Imposta is_active a true se non specificato
    IF NEW.is_active IS NULL THEN
        NEW.is_active := true;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crea il trigger che si attiva BEFORE INSERT
CREATE TRIGGER trigger_validate_profile_insert
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_profile_insert();

-- Trigger per validazioni durante l'aggiornamento
CREATE OR REPLACE FUNCTION validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Non permettere di cambiare l'ID
    IF NEW.id != OLD.id THEN
        RAISE EXCEPTION 'Cannot change profile ID';
    END IF;
    
    -- Se si cambia salon_id, verificare che non ci siano team members collegati
    IF NEW.salon_id != OLD.salon_id THEN
        IF EXISTS (SELECT 1 FROM team WHERE salon_id = OLD.salon_id) THEN
            RAISE EXCEPTION 'Cannot change salon_id while team members are associated with this salon';
        END IF;
        
        -- Verificare che il nuovo salon_id sia unico
        IF EXISTS (SELECT 1 FROM profiles WHERE salon_id = NEW.salon_id AND id != NEW.id) THEN
            RAISE EXCEPTION 'New salon ID must be unique';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crea il trigger che si attiva BEFORE UPDATE
CREATE TRIGGER trigger_validate_profile_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_profile_update();

-- =====================================================
-- STEP 4: VERIFICA CHE RLS SIA ABILITATO
-- =====================================================

-- Verifica che RLS sia abilitato (dovrebbe già essere abilitato)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'ATTENZIONE: RLS non è abilitato su profiles. Eseguire: ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;';
    ELSE
        RAISE NOTICE 'RLS è correttamente abilitato sulla tabella profiles';
    END IF;
END $$;

-- =====================================================
-- STEP 5: TEST DI VERIFICA (OPZIONALE)
-- =====================================================

-- Test rapido per verificare che le policy funzionino
DO $$
DECLARE
    my_profile_id UUID;
    profile_count INTEGER;
    my_salon_id UUID;
BEGIN
    -- Verifica che possiamo ottenere il nostro profilo
    my_profile_id := auth.uid();
    
    IF my_profile_id IS NULL THEN
        RAISE NOTICE 'ATTENZIONE: Nessun utente autenticato';
    ELSE
        -- Conta i profili visibili
        SELECT COUNT(*) INTO profile_count FROM profiles;
        RAISE NOTICE 'Profili visibili con le nuove policy: %', profile_count;
        
        -- Verifica il salon_id (se esiste il profilo)
        SELECT salon_id INTO my_salon_id FROM profiles WHERE id = my_profile_id;
        
        IF my_salon_id IS NOT NULL THEN
            RAISE NOTICE 'SUCCESS: Profilo trovato con salon_id: %', my_salon_id;
        ELSE
            RAISE NOTICE 'INFO: Utente non ha un profilo (potrebbe essere un collaboratore)';
        END IF;
    END IF;
END $$;

-- =====================================================
-- AGGIORNAMENTO COMPLETATO
-- =====================================================

SELECT 'Policy RLS per profiles aggiornate con successo!' as status;
