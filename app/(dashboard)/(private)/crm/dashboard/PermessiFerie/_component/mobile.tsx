'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from '@/utils/getSalonId';
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { Tables } from '@/types/database.types';
import { usePermissions } from '../../Impostazioni/usePermission';

// Components
import PermissionDialogs from './PermissionDialogs';
import { Member, WorkHours, HolidayBalance, FormData, Permission } from './types';

// Icons
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Edit, 
  Trash, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search,
  Download,
  Upload,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  CalendarDays,
  Users,
  Building2,
  FileText,
  BarChart3,
  RefreshCw,
  Clock3,
  Menu,
  Home,
  List,
  PlusCircle
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const supabase = createClient();

interface PermessiFerieMobileProps {
  members?: Member[];
  permissions?: Permission[];
  holidayBalances?: HolidayBalance[];
  workHours?: WorkHours[];
  isLoading?: boolean;
  currentUser?: any;
  isManager?: boolean;
  session?: any;
  salonId?: string;
  onRefresh?: () => void;
  onBack?: () => void;
}

export default function PermessiFerieMobile({
  members: propMembers = [],
  permissions: propPermissions = [],
  holidayBalances: propHolidayBalances = [],
  workHours: propWorkHours = [],
  isLoading: propIsLoading = false,
  currentUser: propCurrentUser = null,
  isManager: propIsManager = false,
  session: propSession = null,
  salonId: propSalonId = '',
  onRefresh,
  onBack
}: PermessiFerieMobileProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>(propMembers);
  const [permissions, setPermissions] = useState<Permission[]>(propPermissions);
  const [holidayBalances, setHolidayBalances] = useState<HolidayBalance[]>(propHolidayBalances);
  const [workHours, setWorkHours] = useState<WorkHours[]>(propWorkHours);
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(propCurrentUser);
  const [isManager, setIsManager] = useState(propIsManager);
  const [session, setSession] = useState<any>(propSession);
  const [isRealtimeUpdating, setIsRealtimeUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'permissions' | 'working-hours'>('permissions');
  const [activePermissionSection, setActivePermissionSection] = useState<'pending' | 'archived'>('pending');
  const [salonId, setSalonId] = useState<string>(propSalonId);

  // Get permissions
  const { hasPermission, loading: permissionsLoading } = usePermissions(session);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  // Form states
  const [formData, setFormData] = useState<FormData>({
    member_id: '',
    type: 'ferie',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
    notes: ''
  });

  // Effect per impostare automaticamente il member_id per i non-manager
  useEffect(() => {
    if (isCreateDialogOpen && !isManager && currentUser && members.length > 0) {
      const currentMember = members.find(m => m.user_id === currentUser.id);
      if (currentMember) {
        setFormData(prev => ({ ...prev, member_id: currentMember.id }));
      }
    }
  }, [isCreateDialogOpen, isManager, currentUser, members]);

  // Effect per impostare automaticamente selectedMember per i non-manager
  useEffect(() => {
    if (!isManager && currentUser && members.length > 0 && selectedMember === 'all') {
      const currentMember = members.find(m => m.user_id === currentUser.id);
      if (currentMember) {
        setSelectedMember(currentMember.id);
      }
    }
  }, [isManager, currentUser, members, selectedMember]);

  // Sync data from props
  useEffect(() => {
    setMembers(propMembers);
    setPermissions(propPermissions);
    setHolidayBalances(propHolidayBalances);
    setWorkHours(propWorkHours);
    setIsLoading(propIsLoading);
    setCurrentUser(propCurrentUser);
    setIsManager(propIsManager);
    setSession(propSession);
    setSalonId(propSalonId);
  }, [propMembers, propPermissions, propHolidayBalances, propWorkHours, propIsLoading, propCurrentUser, propIsManager, propSession, propSalonId]);

  // Fetch data on component mount (only if no props provided)
  useEffect(() => {
    // If props are provided, don't fetch data
    if (propMembers.length > 0 || propPermissions.length > 0) {
      return;
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.id) {
        setCurrentUser(session.user);
        
        // Check if user is a manager (first check profiles table, then team table)
        let isUserManager = false;
        
        // First check if user is manager in profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (!profileError && profileData?.role === 'manager') {
          isUserManager = true;
          console.log('👑 User is manager in profiles table');
        } else {
          // If not manager in profiles, check team table
          const { data: teamData, error: teamError } = await supabase
            .from('team')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single();
          
          if (!teamError && teamData?.role === 'manager') {
            isUserManager = true;
            console.log('👑 User is manager in team table');
          }
        }
        
        setIsManager(isUserManager);
      }
    };
    getSession();

    fetchData();
  }, [propMembers.length, propPermissions.length]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const currentSalonId = await getSalonId();
      
      if (!currentSalonId) {
        console.error('❌ Salon ID not found');
        toast({
          title: "Errore",
          description: "Impossibile identificare il salone. Verifica di essere autenticato correttamente.",
          variant: "destructive"
        });
        return;
      }
      
      setSalonId(currentSalonId);
      
      // Fetch members from the 'team' table
      const { data: membersData, error: membersError } = await supabase
        .from('team')
        .select('id, name, email, phone_number, ColorMember, order_column, avatar_url, role, is_active, user_id')
        .eq('salon_id', currentSalonId)
        .eq('is_active', true)
        .order('order_column', { ascending: true });

      if (membersError) {
        console.error('❌ Error fetching members:', membersError);
        toast({
          title: "Errore",
          description: "Impossibile caricare i membri del team",
          variant: "destructive"
        });
        throw membersError;
      }
      
      // Transform members data to match our interface
      const formattedMembers: Member[] = (membersData || []).map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        avatar_url: member.avatar_url,
        role: member.role || 'member',
        ColorMember: member.ColorMember,
        user_id: member.user_id
      }));
      
      setMembers(formattedMembers);

      // Fetch permissions from database with salon_id filter
      let permissionsQuery = supabase
        .from('permessiferie')
        .select('*')
        .eq('salon_id', currentSalonId);

      // Se non è manager, mostra solo i propri permessi
      if (!isManager && currentUser) {
        const currentMember = formattedMembers.find(m => m.user_id === currentUser.id);
        if (currentMember) {
          permissionsQuery = permissionsQuery.eq('member_id', currentMember.id);
        }
      }

      const { data: permissionsData, error: permissionsError } = await permissionsQuery
        .order('created_at', { ascending: false });

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        toast({
          title: "Errore",
          description: "Impossibile caricare i permessi",
          variant: "destructive"
        });
      }

      // Use real data from database
      let permissions: Permission[] = [];
      
      if (permissionsData && permissionsData.length > 0) {
        permissions = permissionsData.map(p => ({
          id: p.id,
          member_id: p.member_id,
          member_name: formattedMembers.find(m => m.id === p.member_id)?.name || 'Membro sconosciuto',
          salon_id: p.salon_id || '',
          type: p.type,
          start_date: p.start_date,
          end_date: p.end_date,
          start_time: p.start_time,
          end_time: p.end_time,
          status: p.status,
          reason: p.reason,
          notes: p.notes || undefined,
          created_at: p.created_at,
          updated_at: p.updated_at,
          approved_by: p.approved_by,
          approved_at: p.approved_at,
          rejection_reason: p.rejection_reason,
          archived: p.archived || false
        }));
      }
      
      setPermissions(permissions);

      // Fetch holiday balances from database
      const currentYear = new Date().getFullYear();
      const { data: balancesData, error: balancesError } = await supabase
        .from('holiday_balances')
        .select(`
          id,
          member_id,
          year,
          total_days,
          used_days,
          pending_days,
          notes,
          created_at,
          updated_at
        `)
        .eq('salon_id', currentSalonId)
        .eq('year', currentYear);

      if (balancesError) {
        console.error('❌ Error fetching holiday balances:', balancesError);
        // Fallback: usa il calcolo manuale con 25 giorni di default
        const membersToShow = !isManager && currentUser 
          ? formattedMembers.filter(m => m.user_id === currentUser.id)
          : formattedMembers;
        
        const fallbackBalances: HolidayBalance[] = membersToShow.map(member => {
          const usedDays = permissions
            .filter(p => p.member_id === member.id && p.type === 'ferie' && p.status === 'approved')
            .reduce((acc, p) => acc + calculateDaysBetween(p.start_date, p.end_date), 0);
          
          return {
            member_id: member.id,
            member_name: member.name,
            year: currentYear,
            total_days: 30, // Modificato da 25 a 30 giorni
            used_days: usedDays,
            remaining_days: 30 - usedDays,
            pending_days: permissions
              .filter(p => p.member_id === member.id && p.type === 'ferie' && p.status === 'pending')
              .reduce((acc, p) => acc + calculateDaysBetween(p.start_date, p.end_date), 0)
          };
        });
        
        setHolidayBalances(fallbackBalances);
      } else {
        // Usa i dati dal database
        const membersToShow = !isManager && currentUser 
          ? formattedMembers.filter(m => m.user_id === currentUser.id)
          : formattedMembers;
        
        // Crea un map dei bilanci dal database
        const balancesMap = new Map(balancesData?.map(b => [b.member_id, b]) || []);
        
        const balances: HolidayBalance[] = membersToShow.map(member => {
          const dbBalance = balancesMap.get(member.id);
          
          if (dbBalance) {
            // Usa i dati dal database
            return {
              id: dbBalance.id,
              member_id: member.id,
              member_name: member.name,
              year: dbBalance.year,
              total_days: dbBalance.total_days,
              used_days: dbBalance.used_days || 0,
              remaining_days: dbBalance.total_days - (dbBalance.used_days || 0),
              pending_days: dbBalance.pending_days || 0,
              notes: dbBalance.notes,
              created_at: dbBalance.created_at,
              updated_at: dbBalance.updated_at
            };
          } else {
            // Fallback per membri senza bilancio configurato
            const usedDays = permissions
              .filter(p => p.member_id === member.id && p.type === 'ferie' && p.status === 'approved')
              .reduce((acc, p) => acc + calculateDaysBetween(p.start_date, p.end_date), 0);
            
            return {
              member_id: member.id,
              member_name: member.name,
              year: currentYear,
              total_days: 30, // Modificato da 25 a 30 giorni
              used_days: usedDays,
              remaining_days: 30 - usedDays,
              pending_days: permissions
                .filter(p => p.member_id === member.id && p.type === 'ferie' && p.status === 'pending')
                .reduce((acc, p) => acc + calculateDaysBetween(p.start_date, p.end_date), 0)
            };
          }
        });
        
        setHolidayBalances(balances);
      }

      // Fetch dati reali delle ore lavorate dal database
      const fetchRealWorkHours = async () => {
        try {
          let workHoursQuery = supabase
            .from('work_hours')
            .select(`
              id,
              member_id,
              date,
              start_time,
              end_time,
              total_hours,
              break_time,
              notes,
              status,
              created_at,
              updated_at,
              team:member_id(name)
            `)
            .eq('salon_id', currentSalonId)
            .eq('status', 'completed');

          // Se non è manager, mostra solo le proprie ore
          if (!isManager && currentUser) {
            const currentMember = formattedMembers.find(m => m.user_id === currentUser.id);
            if (currentMember) {
              workHoursQuery = workHoursQuery.eq('member_id', currentMember.id);
            }
          }

          const { data: workHoursData, error: workHoursError } = await workHoursQuery
            .order('date', { ascending: false })
            .limit(50); // Limita a 50 record per mobile

          if (workHoursError) {
            console.error('❌ Error fetching work hours:', workHoursError);
            throw workHoursError;
          }

          // Trasforma i dati per matchare l'interfaccia WorkHours
          const transformedWorkHours: WorkHours[] = (workHoursData || []).map(wh => ({
            id: wh.id,
            member_id: wh.member_id,
            member_name: (wh.team as any)?.name || 'Membro sconosciuto',
            date: wh.date,
            start_time: wh.start_time,
            end_time: wh.end_time,
            total_hours: wh.total_hours,
            break_time: wh.break_time,
            notes: wh.notes,
            status: wh.status,
            created_at: wh.created_at,
            updated_at: wh.updated_at
          }));

          setWorkHours(transformedWorkHours);
        } catch (error) {
          console.error('❌ Error in fetchRealWorkHours:', error);
          setWorkHours([]);
        }
      };

      await fetchRealWorkHours();

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    try {
      let memberId = formData.member_id;
      if (!isManager && currentUser) {
        const currentMember = members.find(m => m.user_id === currentUser.id);
        if (currentMember) {
          memberId = currentMember.id;
          
          if (formData.member_id && formData.member_id !== currentMember.id) {
            toast({
              title: "Errore",
              description: "Puoi creare permessi solo per te stesso",
              variant: "destructive"
            });
            return;
          }
        }
      }

      if (!memberId || !formData.start_date || !formData.end_date || !formData.reason) {
        toast({
          title: "Errore",
          description: "Compila tutti i campi obbligatori",
          variant: "destructive"
        });
        return;
      }

      const selectedMember = members.find(m => m.id === memberId);
      if (!selectedMember) {
        toast({
          title: "Errore",
          description: "Membro non trovato",
          variant: "destructive"
        });
        return;
      }

      const currentSalonId = await getSalonId();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      // If a manager creates a permission for themselves, auto-approve it
      let statusToSet: 'pending' | 'approved' = 'pending';
      let approvedBy: string | null = null;
      let approvedAt: string | null = null;
      if (isManager && currentUser) {
        const currentMember = members.find(m => m.user_id === currentUser.id);
        if (currentMember && memberId === currentMember.id) {
          statusToSet = 'approved';
          approvedBy = user.id;
          approvedAt = new Date().toISOString();
        }
      }

      const { data: savedPermission, error: saveError } = await supabase
        .from('permessiferie')
        .insert([{
          member_id: memberId,
          salon_id: currentSalonId,
          type: formData.type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          status: statusToSet,
          approved_by: approvedBy,
          approved_at: approvedAt,
          reason: formData.reason,
          notes: formData.notes || null
        }])
        .select()
        .single();

      if (saveError) {
        console.error('Database save failed:', saveError);
        toast({
          title: "Errore",
          description: "Impossibile salvare il permesso nel database",
          variant: "destructive"
        });
        return;
      }

      const newPermission: Permission = {
        id: savedPermission.id,
        member_id: savedPermission.member_id,
        member_name: selectedMember.name,
        salon_id: savedPermission.salon_id || currentSalonId || '',
        type: savedPermission.type,
        start_date: savedPermission.start_date,
        end_date: savedPermission.end_date,
        start_time: savedPermission.start_time || null,
        end_time: savedPermission.end_time || null,
        status: savedPermission.status,
        reason: savedPermission.reason,
        notes: savedPermission.notes ?? undefined,
        created_at: savedPermission.created_at,
        updated_at: savedPermission.updated_at || new Date().toISOString(),
        approved_by: savedPermission.approved_by || null,
        approved_at: savedPermission.approved_at || null,
        rejection_reason: savedPermission.rejection_reason || null
      };

      setPermissions(prev => [newPermission, ...prev]);
      setIsCreateDialogOpen(false);
      setFormData({
        member_id: '',
        type: 'ferie',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        reason: '',
        notes: ''
      });

      toast({
        title: "Successo",
        description: "Permesso creato con successo",
      });

    } catch (error) {
      console.error('Error creating permission:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il permesso",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePermissionStatus = async (permissionId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      if (!isManager) {
        toast({
          title: "Errore",
          description: "Solo i manager possono approvare o rifiutare permessi",
          variant: "destructive"
        });
        return;
      }

      const permissionToUpdate = permissions.find(p => p.id === permissionId);
      if (!permissionToUpdate) {
        toast({
          title: "Errore",
          description: "Permesso non trovato",
          variant: "destructive"
        });
        return;
      }

      const currentMember = members.find(m => m.user_id === user.id);
      if (currentMember && permissionToUpdate.member_id === currentMember.id) {
        toast({
          title: "Errore",
          description: "Non puoi approvare o rifiutare i tuoi stessi permessi",
          variant: "destructive"
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('permessiferie')
        .update({ 
          status, 
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', permissionId);

      if (updateError) {
        console.error('Database update failed:', updateError);
        toast({
          title: "Errore",
          description: "Impossibile aggiornare il permesso nel database",
          variant: "destructive"
        });
        return;
      }

      setPermissions(prev => prev.map(p => 
        p.id === permissionId 
          ? { 
              ...p, 
              status, 
              approved_by: user.id,
              approved_at: new Date().toISOString()
            }
          : p
      ));

      toast({
        title: "Successo",
        description: `Permesso ${status === 'approved' ? 'approvato' : 'rifiutato'} con successo`,
      });

    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il permesso",
        variant: "destructive"
      });
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      const permissionToDelete = permissions.find(p => p.id === permissionId);
      if (!permissionToDelete) {
        toast({
          title: "Errore",
          description: "Permesso non trovato",
          variant: "destructive"
        });
        return;
      }

      if (!isManager) {
        const currentMember = members.find(m => m.user_id === user.id);
        if (!currentMember || permissionToDelete.member_id !== currentMember.id) {
          toast({
            title: "Errore",
            description: "Puoi eliminare solo i tuoi permessi",
            variant: "destructive"
          });
          return;
        }
        
        if (permissionToDelete.status !== 'pending') {
          toast({
            title: "Errore",
            description: "Puoi eliminare solo i permessi in attesa di approvazione",
            variant: "destructive"
          });
          return;
        }
      }

      const { error: deleteError } = await supabase
        .from('permessiferie')
        .delete()
        .eq('id', permissionId);

      if (deleteError) {
        console.warn('Database delete failed, using local delete:', deleteError);
      }

      setPermissions(prev => prev.filter(p => p.id !== permissionId));
      toast({
        title: "Successo",
        description: "Permesso eliminato con successo",
      });
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il permesso",
        variant: "destructive"
      });
    }
  };

  const handleArchivePermission = async (permissionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      const permissionToArchive = permissions.find(p => p.id === permissionId);
      if (!permissionToArchive) {
        toast({
          title: "Errore",
          description: "Permesso non trovato",
          variant: "destructive"
        });
        return;
      }

      if (permissionToArchive.status === 'pending') {
        toast({
          title: "Errore",
          description: "Puoi archiviare solo permessi approvati o rifiutati",
          variant: "destructive"
        });
        return;
      }

      const { error: archiveError } = await supabase
        .from('permessiferie')
        .update({ archived: true })
        .eq('id', permissionId);

      if (archiveError) {
        console.error('Database archive failed:', archiveError);
        toast({
          title: "Errore",
          description: "Impossibile archiviare il permesso nel database",
          variant: "destructive"
        });
        return;
      }

      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, archived: true } : p
      ));

      toast({
        title: "Successo",
        description: "Permesso archiviato con successo",
      });

    } catch (error) {
      console.error('Error archiving permission:', error);
      toast({
        title: "Errore",
        description: "Impossibile archiviare il permesso",
        variant: "destructive"
      });
    }
  };

  const handleRestorePermission = async (permissionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      const permissionToRestore = permissions.find(p => p.id === permissionId);
      if (!permissionToRestore) {
        toast({
          title: "Errore",
          description: "Permesso non trovato",
          variant: "destructive"
        });
        return;
      }

      const { error: restoreError } = await supabase
        .from('permessiferie')
        .update({ archived: false })
        .eq('id', permissionId);

      if (restoreError) {
        console.error('Database restore failed:', restoreError);
        toast({
          title: "Errore",
          description: "Impossibile ripristinare il permesso nel database",
          variant: "destructive"
        });
        return;
      }

      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, archived: false } : p
      ));

      toast({
        title: "Successo",
        description: "Permesso ripristinato con successo",
      });

    } catch (error) {
      console.error('Error restoring permission:', error);
      toast({
        title: "Errore",
        description: "Impossibile ripristinare il permesso",
        variant: "destructive"
      });
    }
  };

  // Helper function to safely calculate days between dates
  const calculateDaysBetween = (startDate: string, endDate: string): number => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch (error) {
      console.error('Error calculating days between dates:', startDate, endDate, error);
      return 0;
    }
  };

  // Filter permissions based on selected filters and section
  const filteredPermissions = permissions.filter(permission => {
    const matchesMember = selectedMember === 'all' || permission.member_id === selectedMember;
    const matchesStatus = selectedStatus === 'all' || permission.status === selectedStatus;
    const matchesType = selectedType === 'all' || permission.type === selectedType;
    const matchesSearch = searchTerm === '' || 
      permission.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.reason.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by section
    const matchesSection = activePermissionSection === 'pending' 
      ? !permission.archived && permission.status === 'pending'
      : permission.archived;

    return matchesMember && matchesStatus && matchesType && matchesSearch && matchesSection;
  });

  // Separate permissions for different sections
  const pendingPermissions = permissions.filter(permission => 
    !permission.archived && permission.status === 'pending'
  );
  
  const archivedPermissions = permissions.filter(permission => 
    permission.archived
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Permessi & Ferie</h1>
              <p className="text-sm text-muted-foreground">
                {isManager ? 'Gestione Team' : 'I tuoi permessi'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center space-x-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Nuovo</span>
          </Button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="px-4 py-2 border-b border-border">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'permissions' | 'working-hours')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="permissions" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Permessi</span>
            </TabsTrigger>
            <TabsTrigger value="working-hours" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Ore</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Permission Sub-tabs */}
        {activeTab === 'permissions' && (
          <div className="mt-3">
            <Tabs value={activePermissionSection} onValueChange={(value) => setActivePermissionSection(value as 'pending' | 'archived')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending" className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Da Approvare</span>
                  {pendingPermissions.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      {pendingPermissions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Archiviati</span>
                  {archivedPermissions.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      {archivedPermissions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca permessi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter Row */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {isManager && (
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger className="w-auto min-w-[120px]">
                        <SelectValue placeholder="Membro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-auto min-w-[100px]">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="pending">In attesa</SelectItem>
                      <SelectItem value="approved">Approvato</SelectItem>
                      <SelectItem value="rejected">Rifiutato</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-auto min-w-[100px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="ferie">Ferie</SelectItem>
                      <SelectItem value="permesso">Permesso</SelectItem>
                      <SelectItem value="malattia">Malattia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Holiday Balance Summary */}
              {holidayBalances.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Bilancio Ferie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {holidayBalances.map((balance) => (
                      <div key={balance.member_id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback>{balance.member_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{balance.member_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {balance.used_days}/{balance.total_days} giorni usati
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-semibold text-primary">
                            {balance.remaining_days} rimanenti
                          </p>
                          {balance.pending_days > 0 && (
                            <p className="text-xs text-orange-600">
                              {balance.pending_days} in attesa
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Permissions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {activePermissionSection === 'pending' ? 'Permessi da Approvare' : 'Permessi Archiviati'}
                  </h3>
                  <Badge variant="secondary">{filteredPermissions.length}</Badge>
                </div>

                {filteredPermissions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      {activePermissionSection === 'pending' ? (
                        <>
                          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground text-center">
                            Nessun permesso in attesa di approvazione
                          </p>
                        </>
                      ) : (
                        <>
                          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground text-center">
                            Nessun permesso archiviato
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredPermissions.map((permission) => (
                      <Card key={permission.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex flex-col space-y-3">
                            {/* Header con avatar e nome */}
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback>{permission.member_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{permission.member_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {permission.created_at ? format(new Date(permission.created_at), 'dd/MM/yyyy', { locale: it }) : 'Data non disponibile'}
                                </p>
                              </div>
                            </div>

                            {/* Badges e informazioni */}
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={permission.type === 'ferie' ? 'default' : 'secondary'} className="text-xs">
                                  {permission.type}
                                </Badge>
                                <Badge 
                                  variant={
                                    permission.status === 'approved' ? 'default' :
                                    permission.status === 'rejected' ? 'destructive' : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {permission.status === 'pending' ? 'In attesa' :
                                   permission.status === 'approved' ? 'Approvato' : 'Rifiutato'}
                                </Badge>
                                {permission.archived && (
                                  <Badge variant="outline" className="text-xs">
                                    Archivato
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm font-medium">{permission.reason}</p>
                              
                              <div className="text-sm text-muted-foreground">
                                <p>
                                  {permission.start_date ? format(new Date(permission.start_date), 'dd/MM/yyyy', { locale: it }) : 'Data non disponibile'} - 
                                  {permission.end_date ? format(new Date(permission.end_date), 'dd/MM/yyyy', { locale: it }) : 'Data non disponibile'}
                                </p>
                                {permission.start_time && permission.end_time && (
                                  <p>
                                    {permission.start_time} - {permission.end_time}
                                  </p>
                                )}
                              </div>

                              {permission.notes && (
                                <p className="text-sm text-muted-foreground">
                                  Note: {permission.notes}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                              {isManager && permission.status === 'pending' && !permission.archived && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdatePermissionStatus(permission.id, 'approved')}
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdatePermissionStatus(permission.id, 'rejected')}
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}

                              {/* Archive/Restore actions */}
                              {isManager && permission.status !== 'pending' && (
                                <>
                                  {!permission.archived ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleArchivePermission(permission.id)}
                                      className="h-8 w-8 p-0 flex-shrink-0"
                                    >
                                      <FileText className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRestorePermission(permission.id)}
                                      className="h-8 w-8 p-0 flex-shrink-0"
                                    >
                                      <RefreshCw className="h-4 w-4 text-green-600" />
                                    </Button>
                                  )}
                                </>
                              )}

                              {/* Delete action */}
                              {(isManager || (!isManager && permission.status === 'pending' && !permission.archived)) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeletePermission(permission.id)}
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <Trash className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Working Hours Tab */}
          {activeTab === 'working-hours' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ore Lavorate</h3>
                <Badge variant="secondary">{workHours.length}</Badge>
              </div>

              {workHours.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Nessuna ora registrata
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {workHours.slice(0, 20).map((workHour) => (
                    <Card key={workHour.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback>{workHour.member_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{workHour.member_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {workHour.date ? format(new Date(workHour.date), 'dd/MM/yyyy', { locale: it }) : 'Data non disponibile'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="font-semibold text-primary">
                              {workHour.total_hours}h
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {workHour.start_time} - {workHour.end_time}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Permission Dialogs */}
      <PermissionDialogs
        isCreateDialogOpen={isCreateDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        editingPermission={editingPermission}
        formData={formData}
        members={!isManager && currentUser 
          ? members.filter(m => m.user_id === currentUser.id)
          : members}
        isManager={isManager}
        currentUser={currentUser}
        onCreateDialogChange={setIsCreateDialogOpen}
        onEditDialogChange={setIsEditDialogOpen}
        onFormDataChange={(data) => setFormData({...formData, ...data})}
        onEditingPermissionChange={(permission) => setEditingPermission(permission)}
        onCreatePermission={handleCreatePermission}
        onUpdatePermission={async () => {
          if (editingPermission) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                toast({
                  title: "Errore",
                  description: "Utente non autenticato",
                  variant: "destructive"
                });
                return;
              }

              if (!isManager) {
                const currentMember = members.find(m => m.user_id === user.id);
                if (!currentMember || editingPermission.member_id !== currentMember.id) {
                  toast({
                    title: "Errore",
                    description: "Puoi modificare solo i tuoi permessi",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (editingPermission.status !== 'pending') {
                  toast({
                    title: "Errore",
                    description: "Puoi modificare solo i permessi in attesa di approvazione",
                    variant: "destructive"
                  });
                  return;
                }
              } else {
                const currentMember = members.find(m => m.user_id === user.id);
                if (currentMember && editingPermission.member_id === currentMember.id) {
                  toast({
                    title: "Errore",
                    description: "Non puoi modificare lo stato dei tuoi stessi permessi",
                    variant: "destructive"
                  });
                  return;
                }
              }

              const { error: updateError } = await supabase
                .from('permessiferie')
                .update({ 
                  status: editingPermission.status
                })
                .eq('id', editingPermission.id);

              if (updateError) {
                console.warn('Database update failed, using local update:', updateError);
              }

              setPermissions(prev => prev.map(p => 
                p.id === editingPermission.id ? editingPermission : p
              ));
              setIsEditDialogOpen(false);
              setEditingPermission(null);
              toast({
                title: "Successo",
                description: "Permesso aggiornato con successo",
              });
            } catch (error) {
              console.error('Error updating permission:', error);
              toast({
                title: "Errore",
                description: "Impossibile aggiornare il permesso",
                variant: "destructive"
              });
            }
          }
        }}
      />
    </div>
  );
}
