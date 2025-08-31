"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"; // usa il client, non `server`
import { Session } from "@supabase/auth-helpers-nextjs";

export function usePermissions(session: Session | null) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Funzione per fetchare i permessi (estraibile per riuso)
  const fetchPermissions = async (userId: string) => {
    const supabase = createClient();
    // Prima, controlla se l'utente è il titolare (in profiles)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    let role = null;
    let isOwner = false;

    console.log('👤 [fetchPermissions] User role determination:', {
      userId,
      profileData,
      profileError: profileError?.message
    });

    if (!profileError && profileData?.role === "manager") {
      // È il titolare
      role = "manager";
      isOwner = true;
      console.log('👑 [fetchPermissions] User is manager/owner');
    } else {
      // Controlla se è un membro del team
      const { data: teamData, error: teamError } = await supabase
        .from("team")
        .select("role")
        .eq("user_id", userId)
        .single();

      console.log('👥 [fetchPermissions] Team data check:', {
        teamData,
        teamError: teamError?.message
      });

      if (!teamError && teamData) {
        role = teamData.role || "member";
        console.log('✅ [fetchPermissions] User found in team with role:', role);
      } else {
        console.log('❌ [fetchPermissions] User NOT found in team table!');
      }
    }
    setUserRole(role);
    
    console.log('🎭 [fetchPermissions] Final role set:', role);

    // Se l'utente è il titolare (manager), dai tutti i permessi
    if (isOwner || role === "manager") {
      const allPermissions = {
        // Calendario e Appuntamenti
        canViewAppointments: true,
        canCreateAppointments: true,
        canEditAppointments: true,
        canDeleteAppointments: true,
        canManageOthersAppointments: true,
        // Prenotazioni Online
        canViewOnlineBookings: true,
        canManageOnlineBookings: true,
        canViewOnlineBookingDetails: true,
        canExportOnlineBookings: true,
        // Clienti
        canViewClients: true,
        canCreateClients: true,
        canEditClients: true,
        canDeleteClients: true,
        canExportClients: true,
        // Finanze
        canViewFinance: true,
        canManagePayments: true,
        canViewReports: true,
        canExportFinance: true,
        // Servizi
        canViewServices: true,
        canCreateServices: true,
        canEditServices: true,
        canDeleteServices: true,
        canManagePricing: true,
        // Magazzino
        canViewInventory: true,
        canManageInventory: true,
        canViewSuppliers: true,
        canManageSuppliers: true,
        // Amministrazione
        isAdmin: true,
        canManageTeam: true,
        canManagePermissions: true,
        canViewSystemSettings: true,
        canEditSystemSettings: true
      };
      setPermissions(allPermissions);
      setLoading(false);
      return;
    }

    // Per gli altri utenti, carica i permessi dal database
    const { data, error } = await supabase
      .from("permissions")
      .select("permesso, valore")
      .eq("user_id", userId);

    // DEBUG LOG
    console.log('[usePermissions] userId:', userId);
    console.log('[usePermissions] permissions data:', data);

    if (error) {
      console.error("Errore nel fetch dei permessi:", error.message);
      setPermissions({});
      setLoading(false);
      return;
    }
    // Inizializza tutti i permessi a false per default
    const defaultPermissions = {
      canViewAppointments: false,
      canCreateAppointments: false,
      canEditAppointments: false,
      canDeleteAppointments: false,
      canManageOthersAppointments: false,
      canViewOnlineBookings: false,
      canManageOnlineBookings: false,
      canViewOnlineBookingDetails: false,
      canExportOnlineBookings: false,
      canViewClients: false,
      canCreateClients: false,
      canEditClients: false,
      canDeleteClients: false,
      canExportClients: false,
      canViewFinance: false,
      canManagePayments: false,
      canViewReports: false,
      canExportFinance: false,
      canViewServices: false,
      canCreateServices: false,
      canEditServices: false,
      canDeleteServices: false,
      canManagePricing: false,
      canViewInventory: false,
      canManageInventory: false,
      canViewSuppliers: false,
      canManageSuppliers: false,
      isAdmin: false,
      canManageTeam: false,
      canManagePermissions: false,
      canViewSystemSettings: false,
      canEditSystemSettings: false
    };

    const mapped = data?.reduce((acc, perm) => {
      acc[perm.permesso] = perm.valore;
      return acc;
    }, { ...defaultPermissions } as Record<string, boolean>);

    console.log('📊 [fetchPermissions] Final permissions for user:', userId, {
      rawData: data,
      mapped: mapped || defaultPermissions,
      canCreateAppointments: (mapped || defaultPermissions)['canCreateAppointments']
    });

    setPermissions(mapped || defaultPermissions);
    setLoading(false);
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    fetchPermissions(session.user.id);
    // Listener per aggiornamento permessi da localStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'permissionsUpdated') {
        setLoading(true);
        fetchPermissions(session.user.id);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [session?.user?.id]);

  const hasPermission = (permissionKey: string): boolean => {
    // Se è manager, ha tutti i permessi
    if (userRole === "manager") return true;
    // Altrimenti verifica il permesso specifico
    const hasIt = permissions[permissionKey] === true;
    
    // Debug log per canCreateAppointments
    if (permissionKey === 'canCreateAppointments') {
      console.log('🔍 [hasPermission] canCreateAppointments check:', {
        userRole,
        permissionKey,
        permissionValue: permissions[permissionKey],
        hasIt,
        allPermissions: permissions,
        loading
      });
    }
    
    return hasIt;
  };

  const canAccess = (requiredPermissions: string[]): boolean => {
    // Se è manager, ha accesso a tutto
    if (userRole === "manager") return true;
    // Verifica se ha almeno uno dei permessi richiesti
    return requiredPermissions.some(permission => permissions[permission] === true);
  };

  return { permissions, loading, userRole, hasPermission, canAccess };
}
