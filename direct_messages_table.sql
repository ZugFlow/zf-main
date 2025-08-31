-- Create direct_messages table for 1-on-1 chat functionality
-- This table stores private messages between team members

CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_to UUID REFERENCES direct_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT different_users CHECK (sender_id != recipient_id),
    CONSTRAINT non_empty_content CHECK (LENGTH(TRIM(content)) > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_recipient ON direct_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_sender ON direct_messages(recipient_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to ON direct_messages(reply_to) WHERE reply_to IS NOT NULL;

-- Add RLS (Row Level Security)
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see messages where they are sender or recipient
CREATE POLICY "Users can view their direct messages" ON direct_messages
    FOR SELECT USING (
        sender_id = auth.uid()::UUID OR 
        recipient_id = auth.uid()::UUID
    );

-- Users can only insert messages where they are the sender
CREATE POLICY "Users can send direct messages" ON direct_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid()::UUID);

-- Users can only update their own messages
CREATE POLICY "Users can edit their own messages" ON direct_messages
    FOR UPDATE USING (sender_id = auth.uid()::UUID);

-- Users can only delete their own messages
CREATE POLICY "Users can delete their own messages" ON direct_messages
    FOR DELETE USING (sender_id = auth.uid()::UUID);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_direct_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_direct_messages_updated_at
    BEFORE UPDATE ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_direct_messages_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON direct_messages TO authenticated;
GRANT USAGE ON SEQUENCE direct_messages_id_seq TO authenticated;

COMMENT ON TABLE direct_messages IS 'Stores private 1-on-1 messages between team members';
COMMENT ON COLUMN direct_messages.sender_id IS 'ID of the team member who sent the message';
COMMENT ON COLUMN direct_messages.recipient_id IS 'ID of the team member who received the message';
COMMENT ON COLUMN direct_messages.content IS 'The message content';
COMMENT ON COLUMN direct_messages.reply_to IS 'ID of the message this is replying to (if any)';
COMMENT ON COLUMN direct_messages.is_edited IS 'Whether this message has been edited';
COMMENT ON COLUMN direct_messages.is_deleted IS 'Whether this message has been deleted (soft delete)';
