-- RLS Policies per la tabella profiles
-- Questo script crea le policy necessarie per abilitare Row Level Security sulla tabella profiles

-- ANALISI DELLA STRUTTURA CORRETTA:
-- 1. profiles: Solo per MANAGER (titolari dei saloni)
-- 2. Ogni manager ha UN UNICO profilo con salon_id univoco
-- 3. I collaboratori NON hanno record in profiles, sono solo in team
-- 4. I collaboratori accedono ai dati del manager tramite team.salon_id
-- 5. Normalmente ogni salon ha UN SOLO manager (owner)

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

-- Verifica che RLS sia abilitato
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Script di test (commentato per sicurezza)
/*
-- TESTS PER VERIFICARE LE POLICY (ESEGUI CON CAUTELA):

-- Test 1: SELECT - dovrebbe restituire:
-- - Il tuo profilo (se sei manager)
-- - Il profilo del tuo manager (se sei collaboratore)
SELECT id, email, salon_id, role, name FROM profiles;

-- Test 2: UPDATE - dovrebbe funzionare solo sul tuo profilo
UPDATE profiles SET name = 'Test Name Updated' WHERE id = auth.uid();

-- Test 3: INSERT - crea un nuovo profilo (solo se non ne hai già uno)
-- INSERT INTO profiles (id, email, role) VALUES (auth.uid(), 'test@example.com', 'manager');

-- Test 4: DELETE - ATTENZIONE! Elimina definitivamente il profilo
-- DELETE FROM profiles WHERE id = auth.uid();

-- QUERY DI DEBUG UTILI:
-- Verifica il tuo salon_id
SELECT get_user_salon_id() as my_salon_id;

-- Verifica se sei in profiles o team
SELECT 
    'profiles' as source, id, salon_id, role 
FROM profiles WHERE id = auth.uid()
UNION ALL
SELECT 
    'team' as source, user_id as id, salon_id, role 
FROM team WHERE user_id = auth.uid();
*/
