'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, parse, isToday, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Time,
  User,
  Cut,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Add,
  OverflowMenuVertical,
  View,
  ViewOff,
  Rotate,
  MagicWand,
  UserFollow,
  Checkmark,
  Chat
} from '@carbon/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StableAvatar } from '@/components/ui/stable-avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import { getSalonId, canEditAppointment } from '@/utils/getSalonId';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { APPOINTMENT_STATUSES } from "@/components/status";
import { EditServicesModal } from "../_CreateOrder/modaleditcard";
import { CreateOrder } from "../_CreateOrder/CreateOrder";
import { CreateClientModal } from "../Clienti/_component/CreateClientModal";
import FormModal from "../Servizi/GestioneServizi/_component/FormModalServices";
import CreatePausaForm from "../_CreateOrder/pausa";
import { dispatchAppointmentEvent, APPOINTMENT_EVENTS, listenForAppointmentEvents } from '../utils/appointmentEvents';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '../Impostazioni/usePermission';
import { setupAppointmentsSubscription, setupDeletedAppointmentsSubscription } from '../query/query';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { useCarbonNotifications } from '@/hooks/use-carbon-notifications';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Appointment {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  team_id: string;
  servizio: string;
  accesso: string;
  status: string;
  progresso: number;
  membri?: string[];
  services?: Service[];
  color_card?: string[] | string;
  prefer_card_style?: "filled" | "top" | "bottom" | "left" | "right";
  alone?: string | number;
  note?: string;
  task?: boolean;
  salon_id?: string;
}

interface Member {
  id: string;
  name: string;
  ColorMember?: string;
  avatar_url?: string;
  visible_users?: boolean;
  order_column?: number;
  email?: string;
  phone_number?: string;
}

export default function SidebarPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<(string | null)[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customStatuses, setCustomStatuses] = useState<{ value: string, label: string, color: string }[]>([]);
  const [showDeletedAppointments, setShowDeletedAppointments] = useState(false);
  const [sidebarSelectedDate, setSidebarSelectedDate] = useState(selectedDate);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Real-time subscription refs
  const appointmentsSubscriptionRef = useRef<any>(null);
  const deletedAppointmentsSubscriptionRef = useRef<any>(null);
  
  // Add fetch prevention flags
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // Edit modal states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditServicesOpen, setIsEditServicesOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('appointment');
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [isCreatePausaModalOpen, setIsCreatePausaModalOpen] = useState(false);
  const [showChatSection, setShowChatSection] = useState(false);
  const notifications = useCarbonNotifications();
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());

  // Get permissions
  const { hasPermission, loading: permissionsLoading, userRole } = usePermissions(session);

  // Initialize component - SINGLE INITIALIZATION
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    try {
      const supabase = createClient();
      
      // Get session for permissions
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      const salonIdResult = await getSalonId();
      if (!salonIdResult) {
        console.error('No salon ID found');
        return;
      }
      setSalonId(salonIdResult);

      await Promise.all([
        fetchAppointments(salonIdResult),
        fetchTeamMembers(salonIdResult),
        fetchCustomStatuses()
      ]);
    } catch (error) {
      console.error('Error initializing component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced fetch appointments with fetch prevention
  const fetchAppointments = async (salonId: string, forceRefresh = false) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current && !forceRefresh) {
      console.log('Skipping fetchAppointments - already fetching');
      return;
    }
    
    console.log('Fetching appointments for Sidebar...', { 
      forceRefresh, 
      currentAppointmentsCount: appointments.length,
      hasSubscription: !!appointmentsSubscriptionRef.current
    });
    
    isFetchingRef.current = true;
    
    // Set fetching flag to prevent real-time updates during fetch
    if (appointmentsSubscriptionRef.current?.setFetching) {
      appointmentsSubscriptionRef.current.setFetching(true);
      console.log('Set fetching flag to true for Sidebar');
    }
    
    if (isRefreshing && !forceRefresh) {
      console.log('Skipping fetchAppointments - already refreshing');
      isFetchingRef.current = false;
      return;
    }

    try {
      setIsRefreshing(true);
      const supabase = createClient();
      
      // First fetch orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('salon_id', salonId)
        .eq('task', false) // Only appointments, not tasks
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      // Then fetch associated services for each order
      const appointmentsWithServices = await Promise.all(
        (orders || []).map(async (order) => {
          const { data: services, error: servicesError } = await supabase
            .from('order_services')
            .select('*')
            .eq('order_id', order.id);

          if (servicesError) {
            console.error(`Error fetching services for order ${order.id}:`, servicesError.message);
            return order;
          }

          return {
            ...order,
            services: services || []
          };
        })
      );

      console.log('Setting appointments state with fetched data for Sidebar', {
        count: appointmentsWithServices?.length || 0,
        hasData: !!appointmentsWithServices
      });
      setAppointments(appointmentsWithServices);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
      // Reset fetching flag
      if (appointmentsSubscriptionRef.current?.setFetching) {
        appointmentsSubscriptionRef.current.setFetching(false);
        console.log('Set fetching flag to false for Sidebar');
      }
      console.log('Fetch appointments completed for Sidebar');
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (salonId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .order('order_column', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        return;
      }

      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Fetch custom statuses
  const fetchCustomStatuses = async () => {
    try {
      const supabase = createClient();
      const { data: statusData, error } = await supabase
        .from('booking_status_texts')
        .select('*')
        .order('order_column');

      if (error) {
        console.error('Error fetching custom statuses:', error);
        return;
      }

      const customStatusesList = statusData?.map(status => ({
        value: status.status_text,
        label: status.status_text,
        color: status.color || 'gray'
      })) || [];

      setCustomStatuses(customStatusesList);
    } catch (error) {
      console.error('Error fetching custom statuses:', error);
    }
  };

  // Listen for date changes from calendar components
  useEffect(() => {
    const handleDateChangeEvent = (event: CustomEvent) => {
      if (event.detail && event.detail.date) {
        const newDate = new Date(event.detail.date);
        setSidebarSelectedDate(newDate);
        setSelectedDate(newDate);
      }
    };

    window.addEventListener('calendar:dateChanged', handleDateChangeEvent as EventListener);

    return () => {
      window.removeEventListener('calendar:dateChanged', handleDateChangeEvent as EventListener);
    };
  }, []);

  // CONSOLIDATED real-time subscriptions setup - SINGLE useEffect
  useEffect(() => {
    if (!salonId || hasInitializedRef.current === false) return;

    console.log('Setting up consolidated real-time subscriptions for Sidebar...');

    // Cleanup previous subscriptions
    if (appointmentsSubscriptionRef.current) {
      appointmentsSubscriptionRef.current.unsubscribe();
      appointmentsSubscriptionRef.current = null;
    }
    if (deletedAppointmentsSubscriptionRef.current) {
      deletedAppointmentsSubscriptionRef.current.unsubscribe();
      deletedAppointmentsSubscriptionRef.current = null;
    }

    const setupSubscriptions = () => {
      console.log('Setting up appointments subscription for Sidebar...');
      const appointmentsSub = setupAppointmentsSubscription(setAppointments, undefined);
      if (appointmentsSub) {
        appointmentsSubscriptionRef.current = appointmentsSub;
        console.log('Appointments subscription set up successfully for Sidebar');
      } else {
        console.log('Failed to set up appointments subscription for Sidebar');
      }

      // Setup deleted appointments subscription
      const deletedAppointmentsSub = setupDeletedAppointmentsSubscription(() => {
        console.log('Deleted appointments change detected in Sidebar, refreshing...');
        if (salonId && !isFetchingRef.current) {
          fetchAppointments(salonId, true);
        }
      });
      if (deletedAppointmentsSub) {
        deletedAppointmentsSubscriptionRef.current = deletedAppointmentsSub;
      }
    };

    // Small delay to ensure initial fetch completes before setting up real-time subscriptions
    const timer = setTimeout(setupSubscriptions, 100);

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions for Sidebar...');
      clearTimeout(timer);
      if (appointmentsSubscriptionRef.current) {
        appointmentsSubscriptionRef.current.unsubscribe();
        appointmentsSubscriptionRef.current = null;
      }
      if (deletedAppointmentsSubscriptionRef.current) {
        deletedAppointmentsSubscriptionRef.current.unsubscribe();
        deletedAppointmentsSubscriptionRef.current = null;
      }
    };
  }, [salonId]); // Only depend on salonId

  // CONSOLIDATED event listeners - SINGLE useEffect
  useEffect(() => {
    if (!salonId) return;

    // Listen for appointment creation events from navbar
    const handleAppointmentCreated = () => {
      console.log('Appointment created event received in Sidebar, refreshing appointments...');
      if (salonId && !isFetchingRef.current) {
        fetchAppointments(salonId, true); // Force refresh
      }
    };

    // Listen for appointment events to update in real-time (silently)
    const cleanupCreated = listenForAppointmentEvents(APPOINTMENT_EVENTS.CREATED, () => {
      console.log('Appointment created event received in Sidebar');
      if (salonId && !isFetchingRef.current) {
        fetchAppointments(salonId);
      }
    });

    const cleanupUpdated = listenForAppointmentEvents(APPOINTMENT_EVENTS.UPDATED, () => {
      console.log('Appointment updated event received in Sidebar - this should trigger for moves');
      if (salonId && !isFetchingRef.current) {
        fetchAppointments(salonId);
      }
    });

    const cleanupDeleted = listenForAppointmentEvents(APPOINTMENT_EVENTS.DELETED, () => {
      console.log('Appointment deleted event received in Sidebar');
      if (salonId && !isFetchingRef.current) {
        fetchAppointments(salonId);
      }
    });

    window.addEventListener('appointment-created', handleAppointmentCreated);

    // Listen for chat toggle events from navbar
    const handleToggleChat = () => {
      console.log('Chat toggle event received in Sidebar');
      setShowChatSection(!showChatSection);
    };
    window.addEventListener('sidebar:toggleChat', handleToggleChat);

    // Emit chat state changes to main dashboard
    const emitChatStateChange = () => {
      const event = new CustomEvent('sidebar:chatStateChanged', {
        detail: { isOpen: showChatSection }
      });
      window.dispatchEvent(event);
    };

    return () => {
      cleanupCreated();
      cleanupUpdated();
      cleanupDeleted();
      window.removeEventListener('appointment-created', handleAppointmentCreated);
      window.removeEventListener('sidebar:toggleChat', handleToggleChat);
    };
  }, [salonId, toast]);

  // Emit chat state changes when showChatSection changes
  useEffect(() => {
    const event = new CustomEvent('sidebar:chatStateChanged', {
      detail: { isOpen: showChatSection }
    });
    window.dispatchEvent(event);
  }, [showChatSection]);

  // CONSOLIDATED additional subscriptions - SINGLE useEffect
  useEffect(() => {
    if (!salonId) return;

    const supabase = createClient();
    
    // Setup team members subscription
    const teamSubscription = supabase
      .channel('team_changes_sidebar')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'team',
          filter: `salon_id=eq.${salonId}`
        },
        (payload) => {
          console.log('Realtime team change detected in Sidebar:', payload);
          // Refresh team members when team changes
          fetchTeamMembers(salonId);
        }
      )
      .subscribe();

    // Setup booking status texts subscription
    const statusSubscription = supabase
      .channel('status_changes_sidebar')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'booking_status_texts'
        },
        (payload) => {
          console.log('Realtime booking_status_texts change detected in Sidebar:', payload);
          // Refresh custom statuses when they change
          fetchCustomStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamSubscription);
      supabase.removeChannel(statusSubscription);
    };
  }, [salonId]);

  // Global chat notifications (Carbon style) for incoming messages
  useEffect(() => {
    // Require authenticated user
    if (!session?.user?.id) return;

    const supabase = createClient();
    const currentUserId = session.user.id as string;

    // Helper to safely show a notification once per message id
    const notifyOnce = (id: string, title: string, subtitle?: string) => {
      if (notifiedMessageIdsRef.current.has(id)) return;
      notifiedMessageIdsRef.current.add(id);
      notifications.info(title, subtitle);
    };

    // Direct messages to me
    const directChannel = supabase
      .channel(`notify:direct_messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${currentUserId}`
        },
        async (payload) => {
          try {
            const message = payload.new as any;
            // Ignore if I sent it (shouldn't happen due to filter, but safe)
            if (message.sender_id === currentUserId) return;

            // Fetch sender info
            const { data: teamData } = await supabase
              .from('team')
              .select('user_id, name, email, avatar_url')
              .eq('user_id', message.sender_id)
              .eq('is_active', true)
              .single();

            const senderName = teamData?.name || 'Nuovo messaggio';
            notifyOnce(
              message.id,
              `Nuovo messaggio da ${senderName}`,
              (message.content || '').toString()
            );
          } catch (err) {
            // Best effort - avoid blocking
          }
        }
      )
      .subscribe();

    // Group messages (RLS should ensure I only receive for groups I can read)
    const groupChannel = supabase
      .channel(`notify:chat_messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          try {
            const message = payload.new as any;
            // Ignore my own messages
            if (message.user_id === currentUserId) return;

            // Fetch sender and group info
            const [{ data: teamData }, { data: groupData }] = await Promise.all([
              supabase
                .from('team')
                .select('user_id, name')
                .eq('user_id', message.user_id)
                .eq('is_active', true)
                .single(),
              supabase
                .from('chat_groups')
                .select('id, name')
                .eq('id', message.group_id)
                .single()
            ]);

            const senderName = teamData?.name || 'Membro';
            const groupName = groupData?.name ? ` in ${groupData.name}` : '';
            notifyOnce(
              message.id,
              `Nuovo messaggio da ${senderName}${groupName}`,
              (message.content || '').toString()
            );
          } catch (err) {
            // Best effort
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(directChannel);
      supabase.removeChannel(groupChannel);
    };
  }, [session?.user?.id]);

  // Listen for sidebar date change events from other components
  useEffect(() => {
    const handleSidebarDateChange = (event: CustomEvent) => {
      if (event.detail && event.detail.date) {
        const newDate = new Date(event.detail.date);
        setSidebarSelectedDate(newDate);
        setSelectedDate(newDate);
      }
    };

    window.addEventListener('sidebar:dateChanged', handleSidebarDateChange as EventListener);

    return () => {
      window.removeEventListener('sidebar:dateChanged', handleSidebarDateChange as EventListener);
    };
  }, []);

  // Update sidebar date when prop changes (without emitting events)
  useEffect(() => {
    setSidebarSelectedDate(selectedDate);
  }, [selectedDate]);

  // Debug effect to monitor appointment changes
  useEffect(() => {
    console.log('Sidebar appointments updated:', {
      count: appointments.length,
      sampleAppointments: appointments.slice(0, 3).map(apt => ({
        id: apt.id,
        nome: apt.nome,
        data: apt.data,
        orarioInizio: apt.orarioInizio,
        team_id: apt.team_id
      }))
    });
  }, [appointments]);

  // Listen for events to close sidebar when others open
  useEffect(() => {
    const handleOtherSidebarOpened = () => {
      // This will be handled by the parent component
      console.log('Settings sidebar opened, appointments sidebar should close');
    };

    window.addEventListener('settings-sidebar-opened', handleOtherSidebarOpened);

    return () => {
      window.removeEventListener('settings-sidebar-opened', handleOtherSidebarOpened);
    };
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      // Clean up subscriptions
      if (appointmentsSubscriptionRef.current) {
        appointmentsSubscriptionRef.current.unsubscribe();
        appointmentsSubscriptionRef.current = null;
      }
      if (deletedAppointmentsSubscriptionRef.current) {
        deletedAppointmentsSubscriptionRef.current.unsubscribe();
        deletedAppointmentsSubscriptionRef.current = null;
      }
    };
  }, []);

  // Combine default and custom statuses
  const allStatuses = useMemo(() => {
    const defaultStatuses = Object.entries(APPOINTMENT_STATUSES).map(([key, status]) => ({
      value: key,
      label: status.label,
      color: status.color
    }));
    return [...defaultStatuses, ...customStatuses];
  }, [customStatuses]);

  // Filter appointments based on search, status, and members
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        appointment.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.servizio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.services && appointment.services.some(service => 
          (service as any).servizio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      // Status filter - exclude deleted appointments unless explicitly requested
      const matchesStatus = selectedStatusFilters.length === 0 
        ? showDeletedAppointments ? true : appointment.status !== 'Eliminato' // Don't show deleted by default
        : selectedStatusFilters.includes(appointment.status);

      // Member filter
      const matchesMember = selectedMembers.length === 0 || 
        selectedMembers.includes(appointment.team_id);

      return matchesSearch && matchesStatus && matchesMember;
    });
  }, [appointments, searchTerm, selectedStatusFilters, selectedMembers, showDeletedAppointments]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: { [key: string]: Appointment[] } = {};
    
    filteredAppointments.forEach(appointment => {
      const dateKey = appointment.data;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });

    // Sort appointments within each date by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.orarioInizio.localeCompare(b.orarioInizio));
    });

    return grouped;
  }, [filteredAppointments]);

  // Helper functions
  const getStatusColor = (status: string) => {
    const statusConfig = allStatuses.find(s => s.value === status);
    if (statusConfig) {
      switch (statusConfig.color) {
        case 'green': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700/50';
        case 'yellow': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700/50';
        case 'red': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700/50';
        case 'blue': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700/50';
        case 'purple': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700/50';
        default: return 'bg-gray-100 dark:bg-slate-800/50 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700/50';
      }
    }
    return 'bg-gray-100 dark:bg-slate-800/50 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700/50';
  };

  const getDuration = (start: string, end: string) => {
    const startTime = parse(start, 'HH:mm', new Date());
    const endTime = parse(end, 'HH:mm', new Date());
    const diffInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return Math.round(diffInMinutes);
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    // Non aprire il modal se l'appuntamento è un task
    if (appointment.task) {
      console.log('Task appointments cannot be edited via modal');
      return;
    }

    // Controlla i permessi per modificare l'appuntamento usando la utility function
    canEditAppointment(appointment.team_id, hasPermission || (() => false)).then(canEdit => {
      if (canEdit) {
        setSelectedAppointment(appointment);
        setIsEditServicesOpen(true);
      } else {
        console.log('User cannot edit this appointment - insufficient permissions');
        toast({
          title: "Accesso Negato",
          description: "Non hai i permessi per modificare questo appuntamento",
          variant: "destructive",
        });
      }
    });
  };



  const handleDeleteService = async (serviceId: string, orderId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('order_services')
        .delete()
        .eq('order_id', orderId)
        .eq('service_id', serviceId);

      if (error) throw error;

      toast({
        title: "Servizio rimosso",
        description: "Il servizio è stato rimosso dall'appuntamento.",
      });

      dispatchAppointmentEvent(APPOINTMENT_EVENTS.UPDATED);
      // Refresh appointments
      if (salonId) {
        await fetchAppointments(salonId);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il servizio.",
        variant: "destructive",
      });
    }
  };

  const handleSaveServices = async (services: Service[], updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string }) => {
    if (!selectedAppointment) return;
    
    try {
      const supabase = createClient();
      const updateData: any = { services };
      
      if (updatedData) {
        if (updatedData.data) updateData.data = updatedData.data;
        if (updatedData.orarioInizio) updateData.orarioInizio = updatedData.orarioInizio;
        if (updatedData.orarioFine) updateData.orarioFine = updatedData.orarioFine;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      toast({
        title: "Servizi aggiornati",
        description: "I servizi sono stati aggiornati con successo.",
      });

      dispatchAppointmentEvent(APPOINTMENT_EVENTS.UPDATED);
      // Refresh appointments
      if (salonId) {
        await fetchAppointments(salonId);
      }
    } catch (error) {
      console.error('Error updating services:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare i servizi.",
        variant: "destructive",
      });
    }
  };

  // Memoize team member lookups for better performance
  const teamMemberMap = useMemo(() => {
    const map = new Map();
    teamMembers.forEach(member => {
      map.set(member.id, member);
    });
    return map;
  }, [teamMembers]);

  // Appointment Card Component
  const AppointmentCard = React.memo(({ appointment }: { appointment: Appointment }) => {
    const teamMember = teamMemberMap.get(appointment.team_id);
    
    // Memoize avatar URL to prevent unnecessary re-renders
    const avatarUrl = React.useMemo(() => teamMember?.avatar_url || '', [teamMember?.avatar_url]);
    const memberName = React.useMemo(() => teamMember?.name || 'Membro', [teamMember?.name]);
    const memberInitial = React.useMemo(() => memberName.charAt(0) || '?', [memberName]);

    return (
      <motion.div
        key={`appointment-${appointment.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg dark:hover:shadow-xl mb-3 overflow-hidden group bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600/50"
          onClick={() => handleAppointmentClick(appointment)}
        >
          <CardContent className="p-4">
            {/* Header with client name and status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700/60 dark:to-slate-600/60 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-blue-100 dark:ring-slate-600/50">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 truncate text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {appointment.nome}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getStatusColor(appointment.status)} text-xs px-2 py-0.5 rounded-full font-medium shadow-sm`}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StableAvatar
                  src={avatarUrl}
                  alt={memberName}
                  fallback={memberInitial}
                  className="w-6 h-6 border border-gray-200 dark:border-slate-700 shadow-sm flex-shrink-0 ring-1 ring-gray-200/50 dark:ring-slate-700/50"
                  fallbackClassName="bg-gradient-to-br from-violet-100 to-purple-200 dark:from-slate-700/60 dark:to-slate-600/60 text-violet-700 dark:text-slate-200 font-bold text-xs ring-1 ring-violet-200 dark:ring-slate-600/50"
                />
                <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">
                  {getDuration(appointment.orarioInizio, appointment.orarioFine)} min
                </span>
              </div>
            </div>

            {/* Time and service */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <Time className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {appointment.orarioInizio} - {appointment.orarioFine}
                </span>
              </div>

              {/* Services badges */}
              {appointment.services && appointment.services.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {appointment.services.slice(0, 2).map((service, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 dark:from-slate-700/60 dark:to-slate-600/60 text-violet-700 dark:text-slate-200 text-xs font-medium border border-violet-200 dark:border-slate-600/50 shadow-sm"
                    >
                      {(service as any).servizio || service.name}
                    </span>
                  ))}
                  {appointment.services.length > 2 && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 text-xs font-medium border border-gray-200/50 dark:border-slate-700/50">
                      +{appointment.services.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Footer with member and price */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-900 dark:text-slate-100">
                  {memberName}
                </span>
              </div>
              
              {appointment.services && appointment.services.length > 0 && (
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    €{appointment.services.reduce((sum, service) => sum + service.price, 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  });

  // Add proper display name for debugging
  AppointmentCard.displayName = 'AppointmentCard';

  if (isLoading) {
    return (
      <div className="hidden md:flex w-80 min-w-80 max-w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex w-80 min-w-80 max-w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-col h-full shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50/50 dark:from-slate-800/30 to-gray-50/30 dark:to-slate-800/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">
              {showChatSection ? 'Chat' : 'Appuntamenti'}
            </h2>
            {isRefreshing && !showChatSection && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!showChatSection && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (salonId) {
                    console.log('Manual refresh triggered in Sidebar');
                    fetchAppointments(salonId, true);
                    fetchTeamMembers(salonId);
                    fetchCustomStatuses();
                    toast({
                      title: "Aggiornamento manuale",
                      description: "Dati aggiornati manualmente.",
                      duration: 1500,
                    });
                  }
                }}
                disabled={isRefreshing}
                className="text-muted-foreground hover:text-primary hover:bg-accent p-2 rounded-md transition-all duration-200"
              >
                <Rotate className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChatSection(!showChatSection)}
              className="text-muted-foreground hover:text-primary hover:bg-accent p-2 rounded-md transition-all duration-200"
            >
              <Chat className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters - Only show for appointments */}
        {!showChatSection && (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-slate-400" />
              <Input
                placeholder="Cerca appuntamenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 h-9 text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              />
            </div>

            {/* Filters Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full justify-between text-sm text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-md transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filtri</span>
                {selectedStatusFilters.length > 0 || selectedMembers.length > 0 || showDeletedAppointments ? (
                  <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary border-primary/20">
                    {selectedStatusFilters.length + selectedMembers.length + (showDeletedAppointments ? 1 : 0)}
                  </Badge>
                ) : null}
              </div>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </>
        )}
      </div>

      {/* Filters Panel - Only show for appointments */}
      {!showChatSection && (
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/20 flex-shrink-0"
            >
              <div className="p-4 space-y-4">
                {/* Status Filters */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Stato</h4>
                  <div className="flex flex-wrap gap-1">
                    {allStatuses.slice(0, 6).map((status) => (
                      <Badge
                        key={status.value}
                        variant={selectedStatusFilters.includes(status.value) ? "default" : "outline"}
                        className={`cursor-pointer text-xs transition-all duration-200 ${
                          selectedStatusFilters.includes(status.value)
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-accent border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedStatusFilters(prev =>
                            prev.includes(status.value)
                              ? prev.filter(s => s !== status.value)
                              : [...prev, status.value]
                          );
                        }}
                      >
                        {status.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Member Filters */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Membri</h4>
                  <div className="flex flex-wrap gap-1">
                    {teamMembers.slice(0, 4).map((member) => (
                      <Badge
                        key={member.id}
                        variant={selectedMembers.includes(member.id) ? "default" : "outline"}
                        className={`cursor-pointer text-xs transition-all duration-200 ${
                          selectedMembers.includes(member.id)
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-accent border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedMembers(prev =>
                            prev.includes(member.id)
                              ? prev.filter(id => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                      >
                        {member.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Show Deleted Appointments Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Mostra eliminati</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeletedAppointments(!showDeletedAppointments)}
                    className={`text-xs transition-colors duration-200 ${showDeletedAppointments ? 'text-destructive hover:text-destructive/80' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {showDeletedAppointments ? 'Nascondi' : 'Mostra'}
                  </Button>
                </div>

                {/* Clear Filters */}
                {(selectedStatusFilters.length > 0 || selectedMembers.length > 0 || showDeletedAppointments) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStatusFilters([]);
                      setSelectedMembers([]);
                      setShowDeletedAppointments(false);
                    }}
                    className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors duration-200"
                  >
                    Cancella filtri
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Content Area */}
      {showChatSection ? (
        <ChatSidebar 
          isOpen={showChatSection} 
          onClose={() => setShowChatSection(false)} 
          inline={true}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {Object.keys(appointmentsByDate).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Time className="h-12 w-12 text-gray-500 dark:text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                Nessun appuntamento
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4 text-sm">
                {searchTerm || selectedStatusFilters.length > 0 || selectedMembers.length > 0 || showDeletedAppointments
                  ? 'Nessun appuntamento trovato con i filtri applicati'
                  : appointments.length === 0 
                    ? 'Nessun appuntamento nel sistema'
                    : 'Nessun appuntamento per i filtri selezionati'
                }
              </p>
              {hasPermission?.('canCreateAppointments') && (
                <Button 
                  onClick={() => {
                    setIsCreateOrderOpen(true);
                  }}
                  className="bg-blue-600 dark:bg-slate-700 hover:bg-blue-700 dark:hover:bg-slate-600 text-white shadow-sm"
                >
                  <Add className="h-4 w-4 mr-2" />
                  Nuovo appuntamento
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(appointmentsByDate)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, dateAppointments]) => {
                  const dateObj = new Date(date);
                  const isCurrentDate = isToday(dateObj);
                  
                  return (
                    <div key={date} className="space-y-3">
                      {/* Date Header */}
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          isCurrentDate 
                            ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <button
                            onClick={() => {
                              setSidebarSelectedDate(dateObj);
                              setSelectedDate(dateObj);
                              // Emit event to sync with calendar
                              const event = new CustomEvent('sidebar:dateChanged', {
                                detail: { date: dateObj.toISOString() }
                              });
                              window.dispatchEvent(event);
                            }}
                            className={`text-left hover:bg-accent rounded-lg p-2 -m-2 transition-all duration-200 ${
                              isCurrentDate ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            <h3 className={`font-semibold text-sm ${
                              isCurrentDate ? 'text-primary' : 'text-foreground'
                            }`}>
                              {format(dateObj, 'EEEE d MMMM', { locale: it })}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-slate-400">
                              {format(dateObj, 'dd/MM/yyyy')}
                            </p>
                          </button>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-gray-100/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400">
                          {dateAppointments.length}
                        </Badge>
                      </div>

                      {/* Appointments for this date */}
                      <div className="space-y-2">
                        {dateAppointments.map((appointment) => (
                          <AppointmentCard key={appointment.id} appointment={appointment} />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <EditServicesModal
        isOpen={isEditServicesOpen}
        onClose={() => {
          setIsEditServicesOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSave={handleSaveServices}
        onDeleteService={handleDeleteService}
      />

      <CreateOrder
        isDialogOpen={isCreateOrderOpen}
        setIsDialogOpen={setIsCreateOrderOpen}
        actionType={selectedAction}
        onAppointmentCreated={() => {
          dispatchAppointmentEvent(APPOINTMENT_EVENTS.CREATED);
          setIsCreateOrderOpen(false);
          // Refresh appointments
          if (salonId) {
            fetchAppointments(salonId);
          }
        }}
      />

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => {
          setIsCreateClientModalOpen(false);
        }}
      />

      {/* Modal Nuovo Servizio */}
      <FormModal
        isDialogOpen={isCreateServiceModalOpen}
        setIsDialogOpen={(open) => {
          setIsCreateServiceModalOpen(open);
        }}
      />

      {/* Modal Nuova Pausa */}
      {isCreatePausaModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-md w-full p-0 border border-gray-200 dark:border-slate-700">
            <CreatePausaForm
              open={isCreatePausaModalOpen}
              onOpenChange={(open) => {
                setIsCreatePausaModalOpen(open);
              }}
              initialFormData={null}
              onPausaCreated={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
