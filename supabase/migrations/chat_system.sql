-- Tabella per i gruppi di chat
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 100
);

-- Tabella per i membri dei gruppi
CREATE TABLE IF NOT EXISTS chat_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(group_id, user_id)
);

-- Tabella per i messaggi
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
  reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb
);

-- Tabella per le reazioni ai messaggi
CREATE TABLE IF NOT EXISTS chat_message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Tabella per lo stato di lettura dei messaggi
CREATE TABLE IF NOT EXISTS chat_message_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_id ON chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON chat_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_reads_user_id ON chat_message_reads(user_id);

-- RLS (Row Level Security) policies
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reads ENABLE ROW LEVEL SECURITY;

-- Policy per chat_groups: gli utenti possono vedere solo i gruppi di cui fanno parte
CREATE POLICY "Users can view groups they are members of" ON chat_groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
    )
  );

-- Policy per chat_group_members
CREATE POLICY "Users can view group members of their groups" ON chat_group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
    )
  );

-- Policy per chat_messages: gli utenti possono vedere solo i messaggi dei gruppi di cui fanno parte
CREATE POLICY "Users can view messages from their groups" ON chat_messages
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their groups" ON chat_messages
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
    )
  );

-- Policy per chat_message_reactions
CREATE POLICY "Users can view reactions in their groups" ON chat_message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM chat_messages WHERE group_id IN (
        SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy per chat_message_reads
CREATE POLICY "Users can view/insert their own message reads" ON chat_message_reads
  FOR ALL USING (user_id = auth.uid());

-- Funzione per aggiornare l'ultimo aggiornamento
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare updated_at automaticamente
CREATE TRIGGER update_chat_groups_updated_at BEFORE UPDATE ON chat_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
