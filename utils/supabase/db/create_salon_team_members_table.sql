-- Tabella per i membri del team del salone
CREATE TABLE IF NOT EXISTS salon_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    experience VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    specialties TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    social_instagram VARCHAR(255),
    social_facebook VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_salon_team_members_salon_id 
        FOREIGN KEY (salon_id) REFERENCES salon_web_settings(salon_id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_salon_team_members_salon_id ON salon_team_members(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_team_members_active ON salon_team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_salon_team_members_featured ON salon_team_members(is_featured);
CREATE INDEX IF NOT EXISTS idx_salon_team_members_sort_order ON salon_team_members(sort_order);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_salon_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salon_team_members_updated_at
    BEFORE UPDATE ON salon_team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_salon_team_members_updated_at();
