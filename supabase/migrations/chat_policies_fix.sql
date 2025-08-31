-- Rimuovi tutte le policy esistenti per evitare conflitti
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

-- Policy per permettere agli utenti autenticati di creare gruppi
CREATE POLICY "Users can create groups" ON chat_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy per chat_groups: gli utenti possono vedere i gruppi di cui fanno parte o che hanno creato
CREATE POLICY "Users can view groups they are members of or created" ON chat_groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
    ) OR created_by = auth.uid()
  );

-- Policy per permettere ai creatori di aggiornare i loro gruppi
CREATE POLICY "Users can update groups they created" ON chat_groups
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy per permettere agli utenti di aggiungersi ai gruppi
CREATE POLICY "Users can join groups" ON chat_group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di lasciare i gruppi
CREATE POLICY "Users can leave groups" ON chat_group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di inserire messaggi nei gruppi di cui sono membri
CREATE POLICY "Users can insert messages to their groups" ON chat_messages
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
    )
  );

-- Policy per permettere agli utenti di aggiornare i loro messaggi
CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di eliminare i loro messaggi
CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di aggiungere reazioni
CREATE POLICY "Users can add reactions" ON chat_message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di rimuovere le loro reazioni
CREATE POLICY "Users can remove their own reactions" ON chat_message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di inserire/aggiornare le loro letture
CREATE POLICY "Users can manage their own message reads" ON chat_message_reads
  FOR ALL USING (auth.uid() = user_id); 