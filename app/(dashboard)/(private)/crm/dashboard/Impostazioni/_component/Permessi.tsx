"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Shield, Settings, Trash } from "lucide-react";
import { getSalonId } from '@/utils/getSalonId';
import { usePermissions } from '../usePermission';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  isOwner?: boolean;
  user_id?: string;
}

interface Permission {
  id: string;
  user_id: string;
  permesso: string;
  valore: boolean;
}

interface PermissionGroup {
  name: string;
  description: string;
  permissions: {
    key: string;
    label: string;
    description: string;
  }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: "Calendario e Appuntamenti",
    description: "Gestione del calendario e degli appuntamenti",
    permissions: [
      { key: "canViewAppointments", label: "Visualizza Appuntamenti", description: "Può vedere tutti gli appuntamenti" },
      { key: "canCreateAppointments", label: "Crea Appuntamenti", description: "Può creare nuovi appuntamenti" },
      { key: "canEditAppointments", label: "Modifica Appuntamenti", description: "Può modificare appuntamenti esistenti" },
      { key: "canDeleteAppointments", label: "Elimina Appuntamenti", description: "Può eliminare appuntamenti" },
      { key: "canManageOthersAppointments", label: "Gestisci Appuntamenti Altrui", description: "Può gestire appuntamenti di altri membri" }
    ]
  },
  {
    name: "Prenotazioni Online",
    description: "Gestione delle prenotazioni ricevute dal sito web",
    permissions: [
      { key: "canViewOnlineBookings", label: "Visualizza Prenotazioni Online", description: "Può vedere le prenotazioni online" },
      { key: "canManageOnlineBookings", label: "Gestisci Prenotazioni Online", description: "Può confermare, annullare e gestire le prenotazioni online" },
      { key: "canViewOnlineBookingDetails", label: "Visualizza Dettagli Prenotazioni", description: "Può vedere i dettagli completi delle prenotazioni online" },
      { key: "canExportOnlineBookings", label: "Esporta Prenotazioni Online", description: "Può esportare i dati delle prenotazioni online" }
    ]
  },
  {
    name: "Clienti",
    description: "Gestione anagrafica clienti",
    permissions: [
      { key: "canViewClients", label: "Visualizza Clienti", description: "Può vedere l'anagrafica clienti" },
      { key: "canCreateClients", label: "Crea Clienti", description: "Può aggiungere nuovi clienti" },
      { key: "canEditClients", label: "Modifica Clienti", description: "Può modificare dati clienti" },
      { key: "canDeleteClients", label: "Elimina Clienti", description: "Può eliminare clienti" },
      { key: "canExportClients", label: "Esporta Clienti", description: "Può esportare dati clienti" }
    ]
  },
  {
    name: "Finanze",
    description: "Gestione finanziaria e incassi",
    permissions: [
      { key: "canViewFinance", label: "Visualizza Finanze", description: "Può vedere report finanziari" },
      { key: "canManagePayments", label: "Gestisci Pagamenti", description: "Può gestire pagamenti e incassi" },
      { key: "canViewReports", label: "Visualizza Report", description: "Può vedere report dettagliati" },
      { key: "canExportFinance", label: "Esporta Dati Finanziari", description: "Può esportare dati finanziari" }
    ]
  },
  {
    name: "Servizi",
    description: "Gestione servizi offerti",
    permissions: [
      { key: "canViewServices", label: "Visualizza Servizi", description: "Può vedere l'elenco servizi" },
      { key: "canCreateServices", label: "Crea Servizi", description: "Può aggiungere nuovi servizi" },
      { key: "canEditServices", label: "Modifica Servizi", description: "Può modificare servizi esistenti" },
      { key: "canDeleteServices", label: "Elimina Servizi", description: "Può eliminare servizi" },
      { key: "canManagePricing", label: "Gestisci Prezzi", description: "Può modificare prezzi dei servizi" }
    ]
  },
  {
    name: "Magazzino",
    description: "Gestione inventario e prodotti",
    permissions: [
      { key: "canViewInventory", label: "Visualizza Magazzino", description: "Può vedere l'inventario" },
      { key: "canManageInventory", label: "Gestisci Magazzino", description: "Può modificare quantità e prodotti" },
      { key: "canViewSuppliers", label: "Visualizza Fornitori", description: "Può vedere i fornitori" },
      { key: "canManageSuppliers", label: "Gestisci Fornitori", description: "Può gestire i fornitori" }
    ]
  },
  {
    name: "Amministrazione",
    description: "Funzioni amministrative avanzate",
    permissions: [
      { key: "canManageTeam", label: "Gestisci Team", description: "Può aggiungere/rimuovere membri del team" },
      { key: "canManagePermissions", label: "Gestisci Permessi", description: "Può modificare i permessi di altri utenti" },
      { key: "canViewSystemSettings", label: "Visualizza Impostazioni Sistema", description: "Può vedere le impostazioni del sistema" },
      { key: "canEditSystemSettings", label: "Modifica Impostazioni Sistema", description: "Può modificare le impostazioni del sistema" }
    ]
  }
];

export default function Permessi() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const { toast } = useToast();

  // Get permissions
  const { hasPermission, loading: permissionsLoading } = usePermissions(session);

  useEffect(() => {
    // Get current session for permissions
    const getSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    fetchData();
  }, []);

  // 🔒 Controllo autorizzazione - Solo chi ha canManagePermissions può accedere
  if (!permissionsLoading && !hasPermission('canManagePermissions')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h3>
            <p className="text-gray-600 mb-4">
              Non hai i permessi per gestire i permessi del team.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Permesso Richiesto</span>
              </div>
              <p className="text-sm text-red-600 mt-2">
                Contatta il titolare per ottenere il permesso "Gestisci Permessi".
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchData = async () => {
    const supabase = createClient();
    setLoading(true);
    try {
      console.log("Fetching team and permission data...");
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        console.error("User error:", userError?.message || "User not authenticated");
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Get salon_id using utility function
      const salonId = await getSalonId();

      if (!salonId) {
        console.error("No salon_id found for user:", user.id);
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      console.log("Using salon_id:", salonId);

      // Fetch active team members from team table
      const { data: teamMembers, error: teamError } = await supabase
        .from("team")
        .select("id, name, email, avatar_url, role, user_id")
        .eq("salon_id", salonId)
        .eq("is_active", true)
        .order("name");

      if (teamError) {
        console.error("Team fetch error:", teamError);
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Fetch owner from profiles table
      const { data: ownerData, error: ownerError } = await supabase
        .from("profiles")
        .select("id, email, avatar")
        .eq("salon_id", salonId)
        .single();

      let allMembers: TeamMember[] = [];

      // Add team members
      if (teamMembers) {
        allMembers = teamMembers.map(member => ({
          id: member.user_id || member.id, // Use user_id for permissions, fallback to team id
          name: member.name || "Nome non disponibile",
          email: member.email || "",
          role: member.role || "member",
          avatar_url: member.avatar_url,
          user_id: member.user_id,
          isOwner: false
        }));
      }

      // Add owner if exists and not already in team
      if (ownerData && !ownerError) {
        const ownerExists = allMembers.find(m => m.id === ownerData.id);
        if (!ownerExists) {
          const owner: TeamMember = {
            id: ownerData.id,
            name: ownerData.email || "Titolare",
            email: ownerData.email || "",
            role: "manager",
            avatar_url: ownerData.avatar,
            isOwner: true
          };
          allMembers.unshift(owner);
        } else {
          // Mark existing member as owner
          allMembers = allMembers.map(member => 
            member.id === ownerData.id ? { ...member, isOwner: true } : member
          );
        }
      }

      // Fetch permissions for all members
      const memberIds = allMembers.map(member => member.id);
      let perms: Permission[] = [];
      
      if (memberIds.length > 0) {
        const { data: permsData, error: permsError } = await supabase
          .from("permissions")
          .select("*")
          .in("user_id", memberIds);
        
        if (permsError) {
          console.error("Permissions fetch error:", permsError);
        } else {
          perms = permsData || [];
        }
      }
      
      setTeamMembers(allMembers);
      setPermissions(perms);
      
      // Select first member by default
      if (allMembers.length > 0) {
        setSelectedMember(allMembers[0].id);
      }
    } catch (error) {
      console.error("Errore nel caricamento:", error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei dati",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserPermissions = (userId: string) => {
    // Trova il membro del team per ottenere il user_id corretto
    const member = teamMembers.find(m => m.id === userId);
    const actualUserId = member?.user_id || userId;
    
    const userPerms = permissions.filter(p => p.user_id === actualUserId);
    return userPerms.reduce((acc, perm) => {
      acc[perm.permesso] = perm.valore;
      return acc;
    }, {} as Record<string, boolean>);
  };

  const updatePermission = async (userId: string, permissionKey: string, value: boolean) => {
    const supabase = createClient();
    setUpdating(`${userId}-${permissionKey}`);

    try {
      // Trova il membro del team per ottenere il user_id corretto
      const member = teamMembers.find(m => m.id === userId);
      const actualUserId = member?.user_id || userId;
      
      console.log(`Updating permission: ${permissionKey} = ${value} for user: ${actualUserId}`);
      
      // Check if permission already exists
      const existingPermission = permissions.find(
        p => p.user_id === actualUserId && p.permesso === permissionKey
      );

      if (existingPermission) {
        console.log('Updating existing permission:', existingPermission.id);
        // Update existing permission
        const { error } = await supabase
          .from("permissions")
          .update({ 
            valore: value,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingPermission.id);

        if (error) {
          console.error('Error updating permission:', error);
          throw error;
        }

        // Update local state
        setPermissions(prev => 
          prev.map(p => 
            p.id === existingPermission.id 
              ? { ...p, valore: value }
              : p
          )
        );
      } else {
        console.log('Creating new permission');
        // Create new permission with timestamps
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("permissions")
          .insert({
            user_id: actualUserId,
            permesso: permissionKey,
            valore: value,
            created_at: now,
            updated_at: now
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating permission:', error);
          throw error;
        }

        console.log('New permission created:', data);
        // Add to local state
        setPermissions(prev => [...prev, data]);
      }

      // Trigger reload in other tabs/components
      localStorage.setItem('permissionsUpdated', Date.now().toString());

      toast({
        title: "Successo",
        description: `Permesso "${permissionKey}" ${value ? 'attivato' : 'disattivato'} con successo`
      });
    } catch (error: any) {
      console.error("Errore nell'aggiornamento del permesso:", error);
      toast({
        title: "Errore",
        description: `Errore nell'aggiornamento del permesso: ${error.message || 'Errore sconosciuto'}`,
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const resetAllPermissions = async (userId: string) => {
    const supabase = createClient();
    setUpdating(`reset-${userId}`);

    try {
      // Trova il membro del team per ottenere il user_id corretto
      const member = teamMembers.find(m => m.id === userId);
      const actualUserId = member?.user_id || userId;
      
      console.log(`Resetting all permissions for user: ${actualUserId}`);
      
      const { error } = await supabase
        .from("permissions")
        .delete()
        .eq("user_id", actualUserId);

      if (error) throw error;

      // Remove from local state
      setPermissions(prev => prev.filter(p => p.user_id !== actualUserId));

      // Trigger reload in other tabs/components
      localStorage.setItem('permissionsUpdated', Date.now().toString());

      toast({
        title: "Successo",
        description: "Tutti i permessi sono stati rimossi"
      });
    } catch (error) {
      console.error("Errore nella rimozione:", error);
      toast({
        title: "Errore",
        description: "Errore nella rimozione dei permessi",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const grantAllPermissions = async (userId: string) => {
    const supabase = createClient();
    setUpdating(`grant-all-${userId}`);

    try {
      console.log(`Granting all permissions to user: ${userId}`);
      
      // Verifica che il membro esista e abbia un user_id valido
      const selectedMemberData = teamMembers.find(m => m.id === userId);
      console.log('Selected member data:', selectedMemberData);
      
      if (!selectedMemberData) {
        throw new Error('Membro del team non trovato');
      }
      
      // Usa il user_id del membro del team, non l'id
      const actualUserId = selectedMemberData.user_id || userId;
      console.log('Using actual user_id:', actualUserId);
      
      // Verifica che il user_id esista nella tabella team
      const { data: teamMember, error: teamError } = await supabase
        .from("team")
        .select("id, user_id, name")
        .eq("user_id", actualUserId)
        .single();
      
      if (teamError || !teamMember) {
        console.error('User not found in team table:', actualUserId);
        throw new Error(`L'utente con ID ${actualUserId} non è presente nella tabella team`);
      }
      
      console.log('Team member found:', teamMember);
      
      // Get all unique permission keys
      const allPermissionKeys = PERMISSION_GROUPS
        .flatMap(group => group.permissions)
        .map(perm => perm.key);

      console.log('All permission keys:', allPermissionKeys);

      // Create permissions data with timestamps
      const now = new Date().toISOString();
      const permissionsData = allPermissionKeys.map(key => ({
        user_id: actualUserId,
        permesso: key,
        valore: true,
        created_at: now,
        updated_at: now
      }));

      console.log(`Creating ${permissionsData.length} permissions for user_id: ${actualUserId}`);

      // First, delete existing permissions for this user
      const { error: deleteError } = await supabase
        .from("permissions")
        .delete()
        .eq("user_id", actualUserId);

      if (deleteError) {
        console.error('Error deleting existing permissions:', deleteError);
        throw deleteError;
      }

      console.log('Existing permissions deleted successfully');

      // Then insert all permissions
      const { data, error } = await supabase
        .from("permissions")
        .insert(permissionsData)
        .select();

      if (error) {
        console.error('Error creating permissions:', error);
        throw error;
      }

      console.log(`Successfully created ${data?.length || 0} permissions`);

      // Update local state
      setPermissions(prev => [
        ...prev.filter(p => p.user_id !== actualUserId),
        ...(data || [])
      ]);

      // Trigger reload in other tabs/components
      localStorage.setItem('permissionsUpdated', Date.now().toString());

      toast({
        title: "Successo",
        description: `Tutti i permessi sono stati assegnati (${allPermissionKeys.length} permessi)`
      });
    } catch (error: any) {
      console.error("Errore nell'assegnazione dei permessi:", error);
      toast({
        title: "Errore",
        description: `Errore nell'assegnazione dei permessi: ${error.message || 'Errore sconosciuto'}`,
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const selectedMemberData = teamMembers.find(m => m.id === selectedMember);
  const userPermissions = selectedMember ? getUserPermissions(selectedMember) : {};
  const isOwner = selectedMemberData?.isOwner;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Gestione Permessi</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci i permessi dei membri del team
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
        {/* Sidebar - Lista Membri */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-3 md:p-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Membri del Team
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Seleziona un membro per gestire i suoi permessi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-2 md:p-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className={`p-2 md:p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedMember === member.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedMember(member.id)}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <Avatar className="h-7 w-7 md:h-8 md:w-8">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback>
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium text-xs md:text-sm truncate">{member.name}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground truncate">{member.email}</div>
                  </div>
                  {member.isOwner && (
                    <Badge variant="secondary" className="text-[10px] md:text-xs">Titolare</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Content - Permessi */}
        <div className="lg:col-span-3">
          {selectedMemberData ? (
            <Card>
              <CardHeader className="p-3 md:p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12">
                      <AvatarImage src={selectedMemberData.avatar_url} />
                      <AvatarFallback>
                        {selectedMemberData.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base md:text-lg">
                        {selectedMemberData.name}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        {selectedMemberData.email} • {selectedMemberData.role}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetAllPermissions(selectedMember!)}
                      disabled={updating === `reset-${selectedMember}` || isOwner}
                      className="text-xs md:text-sm"
                    >
                      {updating === `reset-${selectedMember}` ? (
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      ) : (
                        <Trash className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                      <span className="hidden md:inline ml-2">Rimuovi Tutti</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => grantAllPermissions(selectedMember!)}
                      disabled={updating === `grant-all-${selectedMember}` || isOwner}
                      className="text-xs md:text-sm"
                    >
                      {updating === `grant-all-${selectedMember}` ? (
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-2" />
                      ) : null}
                      <span>Assegna Tutti</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isOwner ? (
                  // Messaggio speciale per il titolare
                  <div className="p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Account Titolare</h3>
                    <p className="text-gray-600 mb-4">
                      Questo è l'account del titolare del gestionale. Ha automaticamente accesso completo a tutte le funzionalità del sistema.
                    </p>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-center gap-2 text-green-700">
                        <Shield className="h-5 w-5" />
                        <span className="font-semibold">Permessi Completi Attivi</span>
                      </div>
                      <p className="text-sm text-green-600 mt-2">
                        Non è possibile modificare i permessi dell'account titolare per motivi di sicurezza.
                      </p>
                    </div>
                  </div>
                ) : (
                  // Gestione permessi normale per gli altri utenti
                  <div className="space-y-6">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.name} className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.description}
                          </p>
                        </div>
                        <div className="grid gap-3">
                          {group.permissions.map((permission) => {
                            const isEnabled = userPermissions[permission.key] || false;
                            const isUpdating = updating === `${selectedMember}-${permission.key}`;
                            
                            return (
                              <div
                                key={permission.key}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <label className="font-medium text-sm">
                                      {permission.label}
                                    </label>
                                    {isEnabled && (
                                      <Badge variant="secondary" className="text-xs">
                                        Attivo
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {permission.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isUpdating && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  )}
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) =>
                                      updatePermission(selectedMember!, permission.key, checked)
                                    }
                                    disabled={isUpdating}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {group !== PERMISSION_GROUPS[PERMISSION_GROUPS.length - 1] && (
                          <Separator />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-6 md:p-12">
                <div className="text-center">
                  <Users className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold">Seleziona un membro</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Scegli un membro del team per gestire i suoi permessi
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}