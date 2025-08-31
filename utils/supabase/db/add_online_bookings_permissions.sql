-- Add online bookings permissions to existing permissions table
-- This script adds the new permission keys for online bookings management

-- Insert new permissions for online bookings
-- These permissions will be available for assignment to team members

-- Note: The permissions table structure is:
-- id: UUID (auto-generated)
-- user_id: UUID (references user)
-- permesso: TEXT (permission key)
-- valore: BOOLEAN (permission value)

-- The actual permissions will be created when users are assigned these permissions
-- through the UI. This script just documents the new permission keys:

/*
New permission keys added:

1. canViewOnlineBookings
   - Description: "Visualizza Prenotazioni Online"
   - Allows users to see the online bookings page and list of bookings

2. canManageOnlineBookings  
   - Description: "Gestisci Prenotazioni Online"
   - Allows users to confirm, cancel, and manage online bookings

3. canViewOnlineBookingDetails
   - Description: "Visualizza Dettagli Prenotazioni"
   - Allows users to view detailed information about online bookings

4. canExportOnlineBookings
   - Description: "Esporta Prenotazioni Online"
   - Allows users to export online booking data

These permissions are now integrated into the permission system and can be:
- Assigned to team members through the Permessi component
- Checked in the online bookings pages
- Managed through the existing permission infrastructure
*/

-- Optional: If you want to grant these permissions to existing users with admin privileges,
-- you can run the following queries (replace 'user_id' with actual user IDs):

/*
-- Example: Grant all online booking permissions to a specific user
INSERT INTO permissions (user_id, permesso, valore) VALUES 
('user-uuid-here', 'canViewOnlineBookings', true),
('user-uuid-here', 'canManageOnlineBookings', true),
('user-uuid-here', 'canViewOnlineBookingDetails', true),
('user-uuid-here', 'canExportOnlineBookings', true)
ON CONFLICT (user_id, permesso) DO UPDATE SET valore = EXCLUDED.valore;
*/

-- The permissions are now ready to be used in the application
-- Users with canManagePermissions can assign these to team members
-- The online bookings pages will check these permissions before allowing access 