'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from '@/utils/getSalonId';
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { Tables } from '@/types/database.types';
import { usePermissions } from '../Impostazioni/usePermission';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocalization } from '@/hooks/useLocalization';

// Components
import PermessiFerie from './_component/PermessiFerie';
import PermessiFerieMobile from './_component/mobile';
import PermissionDialogs from './_component/PermissionDialogs';
import OreLavorative from './_component/OreLavorative';
import NavbarSecondaria from './_component/NavbarSecondaria';
import HolidayBalanceManager from './_component/HolidayBalanceManager';

import { Member, WorkHours, HolidayBalance, FormData, Permission } from './_component/types';

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
  Clock3
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

export default function PermessiFeriePage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t, formatDate, formatCurrency, currentLanguage } = useLocalization();
  const [members, setMembers] = useState<Member[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [holidayBalances, setHolidayBalances] = useState<HolidayBalance[]>([]);
  const [workHours, setWorkHours] = useState<WorkHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isManager, setIsManager] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isRealtimeUpdating, setIsRealtimeUpdating] = useState(false);
  const [isNavbarFixed, setIsNavbarFixed] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('permissions');
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [currentSection, setCurrentSection] = useState<'permissions' | 'working-hours'>('permissions');
  const [salonId, setSalonId] = useState<string>('');
  const [forceMobile, setForceMobile] = useState(false);

  // Get permissions
  const { hasPermission, loading: permissionsLoading } = usePermissions(session);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

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
        console.log('🔒 Non-manager user: auto-selecting own member_id:', currentMember.id);
      }
    }
  }, [isManager, currentUser, members, selectedMember]);

  // Debug: log dello stato di protezione
  useEffect(() => {
    console.log('🔒 Protection status:', {
      isManager,
      currentUser: currentUser?.id,
      selectedMember,
      permissionsCount: permissions.length,
      membersCount: members.length,
      currentMember: members.find(m => m.user_id === currentUser?.id)?.name
    });
  }, [isManager, currentUser, selectedMember, permissions.length, members.length]);
  
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

  // Fetch data on component mount
  useEffect(() => {
    // Get current session for permissions
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
        
        console.log('🔐 Permission check:', {
          userId: session.user.id,
          userEmail: session.user.email,
          isManager: isUserManager,
          profileRole: profileData?.role,
          teamRole: profileError ? 'N/A' : (await supabase.from('team').select('role').eq('user_id', session.user.id).eq('is_active', true).single()).data?.role
        });
        
        // Fetch data after determining manager status
        await fetchData(isUserManager, session.user);
      } else {
        // If no session, fetch data without manager privileges
        await fetchData(false, null);
      }
    };
    getSession();
  }, []);

  // Real-time subscription for permissions and team members
  useEffect(() => {
    const setupSubscriptions = async () => {
      try {
        const salonId = await getSalonId();
        console.log('🔧 Setting up realtime subscriptions for salon_id:', salonId);
        
        // Subscribe to changes in permessiferie table (without filter for testing)
        const permessiferieSubscription = supabase
          .channel('permessiferie_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'permessiferie'
            },
            (payload) => {
              console.log('🔄 Permessiferie real-time update received:', payload);
              
              // Show updating indicator
              setIsRealtimeUpdating(true);
              
              // Show toast notification
              const eventType = payload.eventType;
              let message = '';
              if (eventType === 'INSERT') message = t('permessi.new_permission_created', 'Nuovo permesso creato');
              else if (eventType === 'UPDATE') message = t('permessi.permission_updated', 'Permesso aggiornato');
              else if (eventType === 'DELETE') message = t('permessi.permission_deleted', 'Permesso eliminato');
              
              if (message) {
                toast({
                  title: t('permessi.realtime_update', 'Aggiornamento in tempo reale'),
                  description: message,
                  duration: 3000,
                });
              }
              
              // Refresh data when changes occur
              fetchData(isManager, currentUser).finally(() => {
                // Hide updating indicator after a short delay
                setTimeout(() => setIsRealtimeUpdating(false), 1000);
              });
            }
          )
          .subscribe((status) => {
            console.log('📡 Permessiferie subscription status:', status);
          });

        // Subscribe to changes in team table (without filter for testing)
        const teamSubscription = supabase
          .channel('team_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'team'
            },
            (payload) => {
              console.log('👥 Team real-time update received:', payload);
              
              // Show updating indicator
              setIsRealtimeUpdating(true);
              
              // Show toast notification
              const eventType = payload.eventType;
              let message = '';
              if (eventType === 'INSERT') message = t('permessi.new_member_added', 'Nuovo membro aggiunto');
              else if (eventType === 'UPDATE') message = t('permessi.member_updated', 'Membro aggiornato');
              else if (eventType === 'DELETE') message = t('permessi.member_removed', 'Membro rimosso');
              
              if (message) {
                toast({
                  title: t('permessi.team_update', 'Aggiornamento team'),
                  description: message,
                  duration: 3000,
                });
              }
              
              // Refresh data when team changes occur
              fetchData(isManager, currentUser).finally(() => {
                // Hide updating indicator after a short delay
                setTimeout(() => setIsRealtimeUpdating(false), 1000);
              });
            }
          )
          .subscribe((status) => {
            console.log('📡 Team subscription status:', status);
          });

        console.log('✅ Realtime subscriptions setup completed');

        // Cleanup subscriptions on unmount
        return () => {
          console.log('🧹 Cleaning up realtime subscriptions');
          permessiferieSubscription.unsubscribe();
          teamSubscription.unsubscribe();
        };
      } catch (error) {
        console.error('❌ Error setting up realtime subscriptions:', error);
      }
    };

    setupSubscriptions();
  }, []);

  // Refresh data function
  const refreshData = () => {
    fetchData(isManager, currentUser);
  };

  const fetchData = async (isUserManager: boolean = isManager, currentUserData: any = currentUser) => {
    try {
      setIsLoading(true);
      const currentSalonId = await getSalonId();
      
      if (!currentSalonId) {
        console.error('❌ Salon ID not found');
        toast({
          title: t('permessi.error_salon_not_found', 'Errore: Salone non trovato'),
          description: t('permessi.cannot_identify_salon', 'Impossibile identificare il salone. Riprova più tardi.'),
          variant: "destructive"
        });
        return;
      }
      
      setSalonId(currentSalonId);
      
      console.log('🔍 Fetching members for salon_id:', currentSalonId);
      
      // Fetch members from the 'team' table (same as GestioneMembri)
      const { data: membersData, error: membersError } = await supabase
        .from('team')
        .select('id, name, email, phone_number, ColorMember, order_column, avatar_url, role, is_active, user_id')
        .eq('salon_id', currentSalonId)
        .eq('is_active', true)
        .order('order_column', { ascending: true });

      if (membersError) {
        console.error('❌ Error fetching members:', membersError);
        toast({
          title: t('permessi.error_loading_members', 'Errore nel caricamento membri'),
          description: t('permessi.cannot_load_team_members', 'Impossibile caricare i membri del team. Riprova più tardi.'),
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
      
      // Debug: log members data
      console.log('🔍 Page - Members loaded:', {
        membersCount: formattedMembers.length,
        members: formattedMembers,
        salonId: currentSalonId,
        isManager: isUserManager,
        currentUserId: currentUserData?.id
      });

      // Fetch permissions from database with salon_id filter
      console.log('🔍 Fetching permissions for salon_id:', currentSalonId);
      
      let permissionsQuery = supabase
        .from('permessiferie')
        .select('*')
        .eq('salon_id', currentSalonId);

      // Se non è manager, mostra solo i propri permessi
      if (!isUserManager && currentUserData) {
        // Trova il member_id dell'utente corrente
        const currentMember = formattedMembers.find(m => m.user_id === currentUserData.id);
        if (currentMember) {
          permissionsQuery = permissionsQuery.eq('member_id', currentMember.id);
          console.log('🔒 User is not manager, showing only own permissions for member_id:', currentMember.id);
        }
      }

      const { data: permissionsData, error: permissionsError } = await permissionsQuery
        .order('created_at', { ascending: false });

      console.log('📊 Permissions query result:', { permissionsData, permissionsError });

      // Debug: check all permissions without salon_id filter (only for managers)
      if (isUserManager) {
        const { data: allPermissions, error: allPermissionsError } = await supabase
          .from('permessiferie')
          .select('*')
          .limit(10);
        
        console.log('🔍 All permissions in database:', { allPermissions, allPermissionsError });
      }

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        toast({
          title: t('permessi.error_loading_permissions', 'Errore nel caricamento permessi'),
          description: t('permessi.cannot_load_permissions', 'Impossibile caricare i permessi. Riprova più tardi.'),
          variant: "destructive"
        });
      }

      // Use real data from database
      let permissions: Permission[] = [];
      
      if (permissionsData && permissionsData.length > 0) {
        permissions = permissionsData.map(p => ({
          id: p.id,
          member_id: p.member_id,
          member_name: formattedMembers.find(m => m.id === p.member_id)?.name || t('permessi.unknown_member', 'Membro sconosciuto'),
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
      
      console.log('📊 Permissions loaded:', {
        totalPermissions: permissions.length,
        isManager: isUserManager,
        permissionsByStatus: {
          pending: permissions.filter(p => p.status === 'pending').length,
          approved: permissions.filter(p => p.status === 'approved').length,
          rejected: permissions.filter(p => p.status === 'rejected').length
        },
        permissionsByType: {
          ferie: permissions.filter(p => p.type === 'ferie').length,
          permesso: permissions.filter(p => p.type === 'permesso').length,
          malattia: permissions.filter(p => p.type === 'malattia').length,
          altro: permissions.filter(p => p.type === 'altro').length
        }
      });

      // Fetch holiday balances from database
      console.log('🔍 Fetching holiday balances for salon_id:', currentSalonId);
      
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
        const membersToShow = !isUserManager && currentUserData 
          ? formattedMembers.filter(m => m.user_id === currentUserData.id)
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
        const membersToShow = !isUserManager && currentUserData 
          ? formattedMembers.filter(m => m.user_id === currentUserData.id)
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
          console.log('🔍 Fetching real work hours for salon_id:', currentSalonId);
          
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
              console.log('🔒 User is not manager, showing only own work hours for member_id:', currentMember.id);
            }
          }

          const { data: workHoursData, error: workHoursError } = await workHoursQuery
            .order('date', { ascending: false })
            .limit(100); // Limita a 100 record per performance

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

          console.log('✅ Work hours fetched:', {
            count: transformedWorkHours.length,
            sample: transformedWorkHours.slice(0, 2)
          });

          setWorkHours(transformedWorkHours);
        } catch (error) {
          console.error('❌ Error in fetchRealWorkHours:', error);
          setWorkHours([]);
          
          // Fallback: usa dati vuoti invece di mock
          toast({
            title: t('permessi.attention', 'Attenzione'),
            description: t('permessi.cannot_load_work_hours', 'Impossibile caricare le ore lavorate. Riprova più tardi.'),
            variant: "destructive"
          });
        }
      };

      // Esegui il fetch delle ore reali
      await fetchRealWorkHours();

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('permessi.error_loading_data', 'Errore nel caricamento dati'),
        description: t('permessi.cannot_load_data', 'Impossibile caricare i dati. Riprova più tardi.'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time subscription for permissions table (filtered by salon_id)
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
        try {
            const currentSalonId = await getSalonId();
            console.log('🔧 Setting up realtime subscription for salon_id:', currentSalonId);

                  // Subscription per permessi e ferie
      const permessiSubscription = supabase
        .channel('permessiferie_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'permessiferie',
            filter: `salon_id=eq.${currentSalonId}`
          },
          (payload) => {
            console.log('🔄 Permessi realtime update received:', payload);

            // Show toast notification
            const eventType = payload.eventType;
            let message = '';
            if (eventType === 'INSERT') message = 'Nuovo permesso creato';
            else if (eventType === 'UPDATE') message = 'Permesso aggiornato';
            else if (eventType === 'DELETE') message = 'Permesso eliminato';

            if (message) {
              toast({
                title: 'Aggiornamento in tempo reale',
                description: message,
                duration: 3000,
              });
            }

            // Refresh data
            fetchData(isManager, currentUser);
          }
        )
        .subscribe((status) => {
          console.log('📡 Permessi subscription status:', status);
        });

      // Subscription per ore lavorate
      const workHoursSubscription = supabase
        .channel('work_hours_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'work_hours',
            filter: `salon_id=eq.${currentSalonId}`
          },
          (payload) => {
            console.log('🔄 Work hours realtime update received:', payload);

            // Show toast notification
            const eventType = payload.eventType;
            let message = '';
            if (eventType === 'INSERT') message = 'Nuove ore registrate';
            else if (eventType === 'UPDATE') message = 'Ore aggiornate';
            else if (eventType === 'DELETE') message = 'Ore eliminate';

            if (message) {
              toast({
                title: 'Aggiornamento ore lavorate',
                description: message,
                duration: 3000,
              });
            }

            // Refresh work hours data
            fetchData(isManager, currentUser);
          }
        )
        .subscribe((status) => {
          console.log('📡 Work hours subscription status:', status);
        });

            // Cleanup subscriptions on unmount
            return () => {
                console.log('🧹 Cleaning up subscriptions');
                permessiSubscription.unsubscribe();
                workHoursSubscription.unsubscribe();
            };
        } catch (error) {
            console.error('❌ Error setting up realtime subscription:', error);
        }
    };

    setupRealtimeSubscription();
}, [fetchData, toast]);

  const handleCreatePermission = async () => {
    try {
      console.log('🔄 Creating permission with formData:', formData);
      console.log('👤 Current user:', currentUser);
      console.log('👥 Members:', members);
      console.log('👑 Is manager:', isManager);

      // Per i non-manager, imposta automaticamente il member_id e verifica che non stiano creando permessi per altri
      let memberId = formData.member_id;
      if (!isManager && currentUser) {
        const currentMember = members.find(m => m.user_id === currentUser.id);
        console.log('🔍 Current member found:', currentMember);
        if (currentMember) {
          // Forza l'uso del proprio member_id per i non-manager
          memberId = currentMember.id;
          
          // Verifica che non stiano cercando di creare un permesso per qualcun altro
          if (formData.member_id && formData.member_id !== currentMember.id) {
                              toast({
          title: t('permessi.error_creating_permission', 'Errore nella creazione permesso'),
          description: t('permessi.create_only_for_yourself', 'Puoi creare permessi solo per te stesso'),
          variant: "destructive"
        });
            return;
          }
        }
      }

      console.log('🎯 Final memberId:', memberId);

      // Validate form data
      if (!memberId || !formData.start_date || !formData.end_date || !formData.reason) {
        console.error('❌ Validation failed:', { memberId, start_date: formData.start_date, end_date: formData.end_date, reason: formData.reason });
        toast({
          title: t('permessi.error_creating_permission', 'Errore nella creazione permesso'),
          description: t('permessi.fill_required_fields', 'Compila tutti i campi obbligatori'),
          variant: "destructive"
        });
        return;
      }

      const selectedMember = members.find(m => m.id === memberId);
      if (!selectedMember) {
        toast({
          title: t('permessi.error_creating_permission', 'Errore nella creazione permesso'),
          description: t('permessi.member_not_found', 'Membro non trovato'),
          variant: "destructive"
        });
        return;
      }

      const currentSalonId = await getSalonId();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('common.error', 'Errore'),
          description: t('permessi.user_not_authenticated', 'Utente non autenticato'),
          variant: "destructive"
        });
        return;
      }

      console.log('➕ Creating permission:', { member_id: memberId, salon_id: currentSalonId, user_id: user.id });

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
          console.log('✅ Auto-approving self-created manager permission');
        }
      }

      // Try to save to database first
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
          title: t('permessi.error_creating_permission', 'Errore nella creazione permesso'),
          description: t('permessi.cannot_create_permission', 'Impossibile creare il permesso. Riprova più tardi.'),
          variant: "destructive"
        });
        return;
      }

      // Use saved permission from database
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
        title: t('permessi.success', 'Successo'),
        description: t('permessi.permission_created_success', 'Permesso creato con successo'),
      });

    } catch (error) {
      console.error('Error creating permission:', error);
      toast({
        title: t('permessi.error_creating_permission', 'Errore nella creazione permesso'),
        description: t('permessi.cannot_create_permission', 'Impossibile creare il permesso. Riprova più tardi.'),
        variant: "destructive"
      });
    }
  };

  const handleUpdatePermissionStatus = async (permissionId: string, status: 'approved' | 'rejected') => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      // Verifica che solo i manager possano approvare/rifiutare permessi
      if (!isManager) {
        toast({
          title: t('permessi.error_updating_permission', 'Errore nell\'aggiornamento permesso'),
          description: t('permessi.only_managers_approve', 'Solo i manager possono approvare/rifiutare permessi'),
          variant: "destructive"
        });
        return;
      }

      // Trova il permesso da aggiornare
      const permissionToUpdate = permissions.find(p => p.id === permissionId);
      if (!permissionToUpdate) {
        toast({
          title: t('common.error', 'Errore'),
          description: t('permessi.permission_not_found', 'Permesso non trovato'),
          variant: "destructive"
        });
        return;
      }

      // Verifica che il manager non stia approvando/rifiutando i propri permessi
      const currentMember = members.find(m => m.user_id === user.id);
      if (currentMember && permissionToUpdate.member_id === currentMember.id) {
        toast({
          title: t('permessi.error_updating_permission', 'Errore nell\'aggiornamento permesso'),
          description: t('permessi.cannot_approve_own', 'Non puoi approvare/rifiutare i tuoi permessi'),
          variant: "destructive"
        });
        return;
      }



      // Try to update in database first
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
          title: t('permessi.error_updating_permission', 'Errore nell\'aggiornamento permesso'),
          description: t('permessi.cannot_update_permission', 'Impossibile aggiornare il permesso. Riprova più tardi.'),
          variant: "destructive"
        });
        return;
      }

      // Update local state
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
        title: t('permessi.success', 'Successo'),
        description: status === 'approved' ? t('permessi.permission_approved_success', 'Permesso approvato con successo') : t('permessi.permission_rejected_success', 'Permesso rifiutato con successo'),
      });

    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: t('permessi.error_updating_permission', 'Errore nell\'aggiornamento permesso'),
        description: t('permessi.cannot_update_permission', 'Impossibile aggiornare il permesso. Riprova più tardi.'),
        variant: "destructive"
      });
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      // Trova il permesso da eliminare
      const permissionToDelete = permissions.find(p => p.id === permissionId);
      if (!permissionToDelete) {
        toast({
          title: "Errore",
          description: "Permesso non trovato",
          variant: "destructive"
        });
        return;
      }

      // Verifica i permessi di eliminazione
      if (!isManager) {
        // I non-manager possono eliminare solo i propri permessi in attesa
        const currentMember = members.find(m => m.user_id === user.id);
        if (!currentMember || permissionToDelete.member_id !== currentMember.id) {
                  toast({
          title: t('permessi.error_deleting_permission', 'Errore nell\'eliminazione permesso'),
          description: t('permessi.cannot_delete_others', 'Non puoi eliminare i permessi di altri utenti'),
          variant: "destructive"
        });
          return;
        }
        
        if (permissionToDelete.status !== 'pending') {
          toast({
            title: t('permessi.error_deleting_permission', 'Errore nell\'eliminazione permesso'),
            description: t('permessi.cannot_delete_approved', 'Non puoi eliminare permessi già approvati/rifiutati'),
            variant: "destructive"
          });
          return;
        }
      }

      console.log('🗑️ Deleting permission:', { permissionId, userId: user.id, isManager });

      // Try to delete from database first
      const { error: deleteError } = await supabase
        .from('permessiferie')
        .delete()
        .eq('id', permissionId);

      if (deleteError) {
        console.warn('Database delete failed, using local delete:', deleteError);
      }

      // Update local state
      setPermissions(prev => prev.filter(p => p.id !== permissionId));
      toast({
        title: t('permessi.success', 'Successo'),
        description: t('permessi.permission_deleted_success', 'Permesso eliminato con successo'),
      });
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast({
        title: t('permessi.error_deleting_permission', 'Errore nell\'eliminazione permesso'),
        description: t('permessi.cannot_delete_permission', 'Impossibile eliminare il permesso. Riprova più tardi.'),
        variant: "destructive"
      });
    }
  };

  const handleArchivePermission = async (permissionId: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      // Trova il permesso da archiviare
      const permissionToArchive = permissions.find(p => p.id === permissionId);
      if (!permissionToArchive) {
        toast({
          title: "Errore",
          description: "Permesso non trovato",
          variant: "destructive"
        });
        return;
      }

      // Verifica che il permesso sia approvato o rifiutato
      if (permissionToArchive.status === 'pending') {
        toast({
          title: t('permessi.error_archiving_permission', 'Errore nell\'archiviazione permesso'),
          description: t('permessi.cannot_archive_pending', 'Non puoi archiviare permessi in attesa'),
          variant: "destructive"
        });
        return;
      }

      console.log('📦 Archiving permission:', { permissionId, userId: user.id });

      // Update in database
      const { error: archiveError } = await supabase
        .from('permessiferie')
        .update({ archived: true })
        .eq('id', permissionId);

      if (archiveError) {
        console.error('Database archive failed:', archiveError);
        toast({
          title: t('permessi.error_archiving_permission', 'Errore nell\'archiviazione permesso'),
          description: t('permessi.cannot_archive_permission', 'Impossibile archiviare il permesso. Riprova più tardi.'),
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, archived: true } : p
      ));

      toast({
        title: t('permessi.success', 'Successo'),
        description: t('permessi.permission_archived_success', 'Permesso archiviato con successo'),
      });

    } catch (error) {
      console.error('Error archiving permission:', error);
      toast({
        title: t('permessi.error_archiving_permission', 'Errore nell\'archiviazione permesso'),
        description: t('permessi.cannot_archive_permission', 'Impossibile archiviare il permesso. Riprova più tardi.'),
        variant: "destructive"
      });
    }
  };

  const handleRestorePermission = async (permissionId: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Errore",
          description: "Utente non autenticato",
          variant: "destructive"
        });
        return;
      }

      // Trova il permesso da ripristinare
      const permissionToRestore = permissions.find(p => p.id === permissionId);
      if (!permissionToRestore) {
        toast({
          title: "Errore",
          description: "Permesso non trovato",
          variant: "destructive"
        });
        return;
      }

      console.log('🔄 Restoring permission:', { permissionId, userId: user.id });

      // Update in database
      const { error: restoreError } = await supabase
        .from('permessiferie')
        .update({ archived: false })
        .eq('id', permissionId);

      if (restoreError) {
        console.error('Database restore failed:', restoreError);
        toast({
          title: t('permessi.error_restoring_permission', 'Errore nel ripristino permesso'),
          description: t('permessi.cannot_restore_permission', 'Impossibile ripristinare il permesso. Riprova più tardi.'),
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, archived: false } : p
      ));

      toast({
        title: t('permessi.success', 'Successo'),
        description: t('permessi.permission_restored_success', 'Permesso ripristinato con successo'),
      });

    } catch (error) {
      console.error('Error restoring permission:', error);
      toast({
        title: t('permessi.error_restoring_permission', 'Errore nel ripristino permesso'),
        description: t('permessi.cannot_restore_permission', 'Impossibile ripristinare il permesso. Riprova più tardi.'),
        variant: "destructive"
      });
    }
  };

  // Handler per il tasto "Permessi & Ferie"
  const handlePermissionsAndHolidays = () => {
    setCurrentSection('permissions');
    setActiveMainTab('permissions');
    setActiveSubTab('list');
  };

  // Handler per il tasto "Orari Lavoro"
  const handleWorkingHours = () => {
    setCurrentSection('working-hours');
  };

  const handleManageHolidayBalances = () => {
    setCurrentSection('permissions');
    setActiveSubTab('balances');
  };

  // Helper function to safely format dates
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

  // Debug: log current state for UI components
  console.log('🎨 UI Components - Current state:', {
    membersCount: members.length,
    isManager,
    currentUserId: currentUser?.id,
    selectedMember,
    permissionsCount: permissions.length
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">{t('permessi.loading', 'Caricamento...')}</span>
      </div>
    );
  }

  // Show mobile version on mobile devices or when forced
  if (isMobile || forceMobile) {
    return (
      <PermessiFerieMobile
        members={members}
        permissions={permissions}
        holidayBalances={holidayBalances}
        workHours={workHours}
        isLoading={isLoading}
        currentUser={currentUser}
        isManager={isManager}
        session={session}
        salonId={salonId}
        onRefresh={refreshData}
        onBack={() => {
          // Torna alla dashboard - imposta showPermessiFerie a false
          // Questo farà tornare alla vista principale della dashboard
          if (typeof window !== 'undefined') {
            // Invece di usare window.history.back(), resetta lo stato
            // Questo verrà gestito dal componente padre
            window.location.href = '/dashboard';
          }
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Navbar Secondaria - Fixed */}
      <div className="sticky top-0 z-30 bg-background border-b border-border shadow-sm">
        <NavbarSecondaria
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          activeMainTab={activeMainTab}
          setActiveMainTab={setActiveMainTab}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          members={members}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          showMemberDropdown={showMemberDropdown}
          setShowMemberDropdown={setShowMemberDropdown}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          permissions={permissions}
          isManager={isManager}
          currentUser={currentUser}
          onRefresh={refreshData}
          onCreatePermission={() => setIsCreateDialogOpen(true)}
          onExport={() => {
            // TODO: Implement export functionality
            toast({
              title: t('permessi.export', 'Esportazione'),
              description: t('permessi.export_in_development', 'Funzionalità di esportazione in sviluppo'),
            });
          }}
          onTestRealtime={() => {
            console.log('🧪 Testing realtime connection...');
            toast({
              title: t('permessi.test_realtime', 'Test connessione realtime'),
              description: t('permessi.check_console_logs', 'Controlla i log della console'),
              duration: 3000,
            });
          }}
          onToggleMobile={!isMobile ? () => {
            setForceMobile(!forceMobile);
            toast({
              title: forceMobile ? t('permessi.desktop_mode', 'Modalità desktop') : t('permessi.mobile_mode', 'Modalità mobile'),
              description: forceMobile ? t('permessi.switched_to_desktop', 'Passato alla modalità desktop') : t('permessi.switched_to_mobile', 'Passato alla modalità mobile'),
              duration: 2000,
            });
          } : undefined}
          onPermissionsAndHolidays={handlePermissionsAndHolidays}
          onWorkingHours={handleWorkingHours}
          onManageHolidayBalances={handleManageHolidayBalances}
          currentSection={currentSection}
          isLoading={isLoading}
          isRealtimeUpdating={isRealtimeUpdating}
          isNavbarFixed={isNavbarFixed}
          setIsNavbarFixed={setIsNavbarFixed}
        />
      </div>

      {/* Main content: scrollable area */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="space-y-6">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Permessi & Ferie Content */}
              {currentSection === 'permissions' && (
                <div className="space-y-4">
                  
                  
                  {/* Lista Permessi Tab */}
                  {activeSubTab === 'list' && (
                    <PermessiFerie
                      permissions={permissions}
                      members={members}
                      holidayBalances={holidayBalances}
                      isManager={isManager}
                      currentUser={currentUser}
                      selectedMember={selectedMember}
                      selectedStatus={selectedStatus}
                      selectedType={selectedType}
                      searchTerm={searchTerm}
                      activeSubTab={activeSubTab}
                      onMemberChange={setSelectedMember}
                      onStatusChange={setSelectedStatus}
                      onTypeChange={setSelectedType}
                      onSearchChange={setSearchTerm}
                      onUpdateStatus={handleUpdatePermissionStatus}
                      onEdit={(permission: Permission) => {
                        setEditingPermission(permission);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={handleDeletePermission}
                      onCreatePermission={() => setIsCreateDialogOpen(true)}
                      onArchive={handleArchivePermission}
                      onRestore={handleRestorePermission}
                    />
                  )}



                  {/* Altri tab gestiti dal componente PermessiFerie */}
                  {isManager && (activeSubTab === 'calendar' || activeSubTab === 'reports' || activeSubTab === 'balances') && (
                    <PermessiFerie
                      permissions={permissions}
                      members={members}
                      holidayBalances={holidayBalances}
                      isManager={isManager}
                      currentUser={currentUser}
                      selectedMember={selectedMember}
                      selectedStatus={selectedStatus}
                      selectedType={selectedType}
                      searchTerm={searchTerm}
                      activeSubTab={activeSubTab}
                      onMemberChange={setSelectedMember}
                      onStatusChange={setSelectedStatus}
                      onTypeChange={setSelectedType}
                      onSearchChange={setSearchTerm}
                      onUpdateStatus={handleUpdatePermissionStatus}
                      onEdit={(permission: Permission) => {
                        setEditingPermission(permission);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={handleDeletePermission}
                      onCreatePermission={() => setIsCreateDialogOpen(true)}
                      onArchive={handleArchivePermission}
                      onRestore={handleRestorePermission}
                    />
                  )}
                </div>
              )}

              {/* Orari Lavoro Content */}
              {currentSection === 'working-hours' && (
                <div className="space-y-4">
                  <OreLavorative 
                    workHours={workHours}
                    members={members}
                    isManager={isManager}
                    currentUser={currentUser}
                    salonId={salonId}
                    permissions={permissions} // Passo i permessi al componente
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permission Dialogs */}
      <PermissionDialogs
        isCreateDialogOpen={isCreateDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        editingPermission={editingPermission}
        formData={formData}
        members={members}
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
              // Get current user
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                toast({
                  title: "Errore",
                  description: "Utente non autenticato",
                  variant: "destructive"
                });
                return;
              }

              // Verifica i permessi di modifica
              if (!isManager) {
                // I non-manager possono modificare solo i propri permessi in attesa
                const currentMember = members.find(m => m.user_id === user.id);
                if (!currentMember || editingPermission.member_id !== currentMember.id) {
                                toast({
                title: t('permessi.error_updating_permission', 'Errore nell\'aggiornamento permesso'),
                description: t('permessi.cannot_edit_others', 'Non puoi modificare i permessi di altri utenti'),
                variant: "destructive"
              });
                  return;
                }
                
                if (editingPermission.status !== 'pending') {
                                  toast({
                  title: t('permessi.error_updating_permission', 'Errore nell\'aggiornamento permesso'),
                  description: t('permessi.cannot_edit_approved', 'Non puoi modificare permessi già approvati/rifiutati'),
                  variant: "destructive"
                });
                  return;
                }
              } else {
                // I manager non possono modificare lo stato dei propri permessi
                const currentMember = members.find(m => m.user_id === user.id);
                if (currentMember && editingPermission.member_id === currentMember.id) {
                                  toast({
                  title: t('permessi.error_updating_permission', 'Errore nell\'aggiornamento permesso'),
                  description: t('permessi.cannot_edit_own_status', 'Non puoi modificare lo stato dei tuoi permessi'),
                  variant: "destructive"
                });
                  return;
                }
              }

              console.log('✏️ Updating permission:', { permissionId: editingPermission.id, userId: user.id, isManager });

              // Try to update in database first
              const { error: updateError } = await supabase
                .from('permessiferie')
                .update({ 
                  status: editingPermission.status
                })
                .eq('id', editingPermission.id);

              if (updateError) {
                console.warn('Database update failed, using local update:', updateError);
              }

              // Update local state
              setPermissions(prev => prev.map(p => 
                p.id === editingPermission.id ? editingPermission : p
              ));
              setIsEditDialogOpen(false);
              setEditingPermission(null);
              toast({
                title: t('permessi.success', 'Successo'),
                description: t('permessi.permission_updated_success', 'Permesso aggiornato con successo'),
              });
            } catch (error) {
              console.error('Error updating permission:', error);
                    toast({
        title: t('permessi.error_updating_permission', 'Errore nell\'aggiornamento permesso'),
        description: t('permessi.cannot_update_permission', 'Impossibile aggiornare il permesso. Riprova più tardi.'),
        variant: "destructive"
      });
            }
          }
        }}
      />
    </div>
  );
}
