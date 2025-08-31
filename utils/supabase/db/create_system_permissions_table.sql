-- Update system permissions table to match existing structure
-- This script adds the missing updated_at column and adjusts to existing table

-- Add updated_at column if it doesn't exist
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraint to prevent duplicate permissions for the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_user_permesso 
ON permissions(user_id, permesso);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_permesso ON permissions(permesso);
CREATE INDEX IF NOT EXISTS idx_permissions_valore ON permissions(valore);

-- Add RLS (Row Level Security) policies if not already enabled
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own permissions
DROP POLICY IF EXISTS "Users can view their own permissions" ON permissions;
CREATE POLICY "Users can view their own permissions" ON permissions
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can create their own permissions (for system use)
DROP POLICY IF EXISTS "Users can create their own permissions" ON permissions;
CREATE POLICY "Users can create their own permissions" ON permissions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own permissions (for system use)
DROP POLICY IF EXISTS "Users can update their own permissions" ON permissions;
CREATE POLICY "Users can update their own permissions" ON permissions
    FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own permissions (for system use)
DROP POLICY IF EXISTS "Users can delete their own permissions" ON permissions;
CREATE POLICY "Users can delete their own permissions" ON permissions
    FOR DELETE USING (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_permissions_updated_at_trigger ON permissions;
CREATE TRIGGER update_permissions_updated_at_trigger 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_permissions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE permissions IS 'Table for storing user system permissions for access control';
COMMENT ON COLUMN permissions.user_id IS 'Reference to the user (team.user_id)';
COMMENT ON COLUMN permissions.permesso IS 'Permission key (e.g., canViewAppointments, canCreateClients)';
COMMENT ON COLUMN permissions.valore IS 'Boolean value indicating if the permission is granted';
COMMENT ON COLUMN permissions.updated_at IS 'Timestamp of last update, automatically managed';

-- Insert some common permission keys for reference (optional)
-- These are just for documentation, actual permissions are created when needed
/*
Common permission keys:
- canViewAppointments: Visualizza Appuntamenti
- canCreateAppointments: Crea Appuntamenti  
- canEditAppointments: Modifica Appuntamenti
- canDeleteAppointments: Elimina Appuntamenti
- canManageOthersAppointments: Gestisci Appuntamenti Altrui
- canViewOnlineBookings: Visualizza Prenotazioni Online
- canManageOnlineBookings: Gestisci Prenotazioni Online
- canViewOnlineBookingDetails: Visualizza Dettagli Prenotazioni
- canExportOnlineBookings: Esporta Prenotazioni Online
- canViewClients: Visualizza Clienti
- canCreateClients: Crea Clienti
- canEditClients: Modifica Clienti
- canDeleteClients: Elimina Clienti
- canExportClients: Esporta Clienti
- canViewFinance: Visualizza Finanze
- canManagePayments: Gestisci Pagamenti
- canViewReports: Visualizza Report
- canExportFinance: Esporta Finanze
- canViewServices: Visualizza Servizi
- canCreateServices: Crea Servizi
- canEditServices: Modifica Servizi
- canDeleteServices: Elimina Servizi
- canManagePricing: Gestisci Prezzi
- canViewInventory: Visualizza Magazzino
- canManageInventory: Gestisci Magazzino
- canViewSuppliers: Visualizza Fornitori
- canManageSuppliers: Gestisci Fornitori
- isAdmin: Amministratore
- canManageTeam: Gestisci Team
- canManagePermissions: Gestisci Permessi
- canViewSystemSettings: Visualizza Impostazioni Sistema
- canEditSystemSettings: Modifica Impostazioni Sistema
*/ 