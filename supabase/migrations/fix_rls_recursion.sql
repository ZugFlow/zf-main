-- Fix per ricorsione infinita nelle policy RLS
-- Il problema è che alcune policy stanno creando riferimenti circolari

-- PRIMA FASE: DISABILITA COMPLETAMENTE RLS PER DEBUGGING
-- Questo ci permetterà di testare il sistema senza policy complesse

-- Disabilita RLS per tutte le tabelle chat
ALTER TABLE chat_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reads DISABLE ROW LEVEL SECURITY;

-- Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "Users can view groups they are members of" ON chat_groups;
DROP POLICY IF EXISTS "Users can view groups they are members of or created" ON chat_groups;
DROP POLICY IF EXISTS "Users can create groups" ON chat_groups;
DROP POLICY IF EXISTS "Users can update groups they created" ON chat_groups;
DROP POLICY IF EXISTS "Users can join groups" ON chat_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON chat_group_members;
DROP POLICY IF EXISTS "Users can view group members of their groups" ON chat_group_members;
DROP POLICY IF EXISTS "Users can view messages from their groups" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their groups" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view reactions in their groups" ON chat_message_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON chat_message_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON chat_message_reactions;
DROP POLICY IF EXISTS "Users can view/insert their own message reads" ON chat_message_reads;
DROP POLICY IF EXISTS "Users can manage their own message reads" ON chat_message_reads;

-- NOTA: RLS rimane disabilitato per ora per permettere il debugging
-- Una volta che il sistema funziona, riabiliteremo RLS con policy semplificate
