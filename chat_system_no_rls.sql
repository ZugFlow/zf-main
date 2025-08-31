-- Sistema Chat Completo - Versione senza RLS
-- Per evitare problemi di ricorsione infinita, iniziamo senza RLS

-- Elimina le tabelle esistenti se esistono (in ordine di dipendenza)
DROP TABLE IF EXISTS chat_message_reactions CASCADE;
DROP TABLE IF EXISTS chat_message_reads CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_group_members CASCADE;
DROP TABLE IF EXISTS chat_groups CASCADE;

-- 1. Tabella dei gruppi chat
CREATE TABLE chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    is_private BOOLEAN NOT NULL DEFAULT false,
    max_members INTEGER NOT NULL DEFAULT 100,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella dei membri dei gruppi
CREATE TABLE chat_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(group_id, user_id)
);

-- 3. Tabella dei messaggi
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]'
);

-- 4. Tabella delle reazioni ai messaggi
CREATE TABLE chat_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- 5. Tabella per tracciare i messaggi letti
CREATE TABLE chat_message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Indici per performance
CREATE INDEX idx_chat_groups_created_by ON chat_groups(created_by);
CREATE INDEX idx_chat_groups_updated_at ON chat_groups(updated_at DESC);

CREATE INDEX idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX idx_chat_group_members_user_id ON chat_group_members(user_id);
CREATE INDEX idx_chat_group_members_group_user ON chat_group_members(group_id, user_id);

CREATE INDEX idx_chat_messages_group_id ON chat_messages(group_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_group_created ON chat_messages(group_id, created_at DESC);

CREATE INDEX idx_chat_message_reactions_message_id ON chat_message_reactions(message_id);
CREATE INDEX idx_chat_message_reactions_user_id ON chat_message_reactions(user_id);

CREATE INDEX idx_chat_message_reads_message_id ON chat_message_reads(message_id);
CREATE INDEX idx_chat_message_reads_user_id ON chat_message_reads(user_id);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_groups_updated_at BEFORE UPDATE ON chat_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- NOTA: RLS è disabilitato per evitare problemi di ricorsione
-- Le tabelle sono accessibili a tutti gli utenti autenticati
-- In futuro implementeremo RLS con policy semplificate

-- Funzione per creare un gruppo con membri selezionati
CREATE OR REPLACE FUNCTION create_chat_group_with_members(
    group_name VARCHAR(255),
    group_description TEXT DEFAULT NULL,
    group_avatar_url TEXT DEFAULT NULL,
    group_is_private BOOLEAN DEFAULT false,
    group_max_members INTEGER DEFAULT 100,
    member_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_group_id UUID;
    current_user_id UUID;
    member_id UUID;
BEGIN
    -- Ottieni l'ID dell'utente corrente
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Inserisci il nuovo gruppo
    INSERT INTO chat_groups (
        name,
        description,
        avatar_url,
        is_private,
        max_members,
        created_by
    ) VALUES (
        group_name,
        group_description,
        group_avatar_url,
        group_is_private,
        group_max_members,
        current_user_id
    ) RETURNING id INTO new_group_id;

    -- Aggiungi il creatore come admin
    INSERT INTO chat_group_members (
        group_id,
        user_id,
        role,
        joined_at
    ) VALUES (
        new_group_id,
        current_user_id,
        'admin',
        NOW()
    );

    -- Aggiungi i membri selezionati
    IF array_length(member_ids, 1) > 0 THEN
        FOREACH member_id IN ARRAY member_ids
        LOOP
            -- Non aggiungere nuovamente il creatore
            IF member_id != current_user_id THEN
                INSERT INTO chat_group_members (
                    group_id,
                    user_id,
                    role,
                    joined_at
                ) VALUES (
                    new_group_id,
                    member_id,
                    'member',
                    NOW()
                ) ON CONFLICT (group_id, user_id) DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN new_group_id;
END;
$$;

-- Funzione per ottenere i membri del team dello stesso salon
CREATE OR REPLACE FUNCTION get_team_members_for_chat()
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    current_salon_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Ottieni il salon_id dell'utente corrente
    SELECT salon_id INTO current_salon_id
    FROM team
    WHERE team.user_id = current_user_id
    AND is_active = true
    LIMIT 1;
    
    IF current_salon_id IS NULL THEN
        RETURN;
    END IF;

    -- Restituisci tutti i membri del team dello stesso salon
    RETURN QUERY
    SELECT 
        t.user_id,
        t.name,
        t.email,
        t.avatar_url
    FROM team t
    WHERE t.salon_id = current_salon_id
    AND t.is_active = true
    ORDER BY t.name;
END;
$$;

-- Conferma che tutto è stato creato
SELECT 'Chat system tables created successfully without RLS' as status;
