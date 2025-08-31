"use client";

import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UserNav } from './UserNav';
import { 
  CurrencyDollar,
  UserMultiple,
  Gift,
  Package,
  Dashboard,
  Calendar,
  Time,
  Calendar as CalendarIcon,
  Cut,
  Add,
  Settings,
  UserFollow,
  ShoppingBag,
  MagicWand,
  StarFilled,
  CalendarSettings,
  Globe,
  Checkmark,
  SidePanelOpen,
  SidePanelClose,
  Notification,
  Search,
  Wifi,
  WifiOff,
  Warning,
  Chat,
  Help,
} from '@carbon/icons-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CreateOrder } from './_CreateOrder/CreateOrder';
import { CreateClientModal } from './Clienti/_component/CreateClientModal';
import FormModal from "./Servizi/GestioneServizi/_component/FormModalServices";
import CreatePausaForm from './_CreateOrder/pausa';
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import clsx from 'clsx';
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from "@/utils/getSalonId";
import { dispatchAppointmentEvent, APPOINTMENT_EVENTS, listenForAppointmentEvents } from './utils/appointmentEvents';
import { dispatchTaskEvent, TASK_EVENTS, listenForTaskEvents } from './utils/taskEvents';
import { MobileNavbar } from './navbarMobile';
import { listenForChatNotificationEvents, type ChatNotificationDetail } from './utils/chatEvents';
import { useLocalization } from '@/hooks/useLocalization';



  // Definizione delle prop per Navbar
interface NavbarProps {
  // Funzioni toggle
  toggleEarnings: () => void;
  toggleClients: () => void;
  toggleLoyalty: () => void;
  toggleServices: () => void;
  toggleMagazzino: () => void;
  toggleWarehouseDashboard: () => void;
  toggleDay: () => void;
  toggleMonthly: () => void;
  toggleWeekly: () => void;
  toggleImpostazioni: () => void;
  toggleProfile: () => void;
  togglePermessiFerie: () => void;
  toggleOnlineBookings: () => void;
  toggleTaskManager: () => void;
  toggleArchivedAppointments: () => void;
  toggleSearch: () => void;
  setShowSearch: (show: boolean) => void;
  toggleSidebar: () => void;
  
  // Stati di visibilità
  showEarnings: boolean;
  showSearch: boolean;
  showClients: boolean;
  showLoyalty: boolean;
  showGestioneServizi: boolean;
  showMagazzino: boolean;
  showWarehouseDashboard: boolean;
  showDay: boolean;
  showMonthly: boolean;
  showWeekly: boolean;
  showImpostazioni: boolean;
  showProfile: boolean;
  showPermessiFerie: boolean;
  showOnlineBookings: boolean;
  showTaskManager: boolean;
  showArchivedAppointments: boolean;
  showSidebar: boolean;

  // Permessi
  hasPermission: (permissionKey: string) => boolean;
  canAccess: (requiredPermissions: string[]) => boolean;
  userRole: string | null;
  hideMobileNavbar?: boolean;
  updateModalState?: (isOpen: boolean) => void;
  
  // Task creation modal
  isTaskCreateModalOpen?: boolean;
  setIsTaskCreateModalOpen?: (open: boolean) => void;
}



export function Navbar({
  // Funzioni toggle
  toggleEarnings,
  toggleClients,
  toggleLoyalty,
  toggleServices,
  toggleMagazzino,
  toggleWarehouseDashboard,
  toggleDay,
  toggleMonthly,
  toggleWeekly,
  toggleImpostazioni,
  toggleProfile,
  togglePermessiFerie,
  toggleOnlineBookings,
  toggleTaskManager,
  toggleArchivedAppointments,
  toggleSearch,
  setShowSearch,
  toggleSidebar,
  
  // Stati di visibilità
  showEarnings,
  showSearch,
  showClients,
  showLoyalty,
  showGestioneServizi,
  showMagazzino,
  showWarehouseDashboard,
  showDay,
  showMonthly,
  showWeekly,
  showImpostazioni,
  showProfile,
  showPermessiFerie,
  showOnlineBookings,
  showTaskManager,
  showArchivedAppointments,
  showSidebar,

  // Permessi
  hasPermission,
  canAccess,
  userRole,
  hideMobileNavbar = false,
  updateModalState,
  
  // Task creation modal
  isTaskCreateModalOpen,
  setIsTaskCreateModalOpen,
}: NavbarProps) {
  const { t } = useLocalization();

  // Debug log per vedere i permessi nella navbar
  useEffect(() => {
    console.log('🔧 [Navbar] Permission check:', {
      canCreateAppointments: hasPermission('canCreateAppointments'),
      canCreateClients: hasPermission('canCreateClients'),
      canCreateServices: hasPermission('canCreateServices'),
      userRole
    });
  }, [hasPermission, userRole]);

  // Imposta 'day' come valore iniziale
  const [activeIcon, setActiveIcon] = useState<string>('day');
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('appointment');
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [isCreatePausaModalOpen, setIsCreatePausaModalOpen] = useState(false);
  
  // Stati per i dropdown menus
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);

  // Stato notifiche chat
  const [hasChatAlert, setHasChatAlert] = useState(false);
  const [latestChatNotification, setLatestChatNotification] = useState<ChatNotificationDetail | null>(null);
  const [chatCount, setChatCount] = useState(0);
  // Stato notifiche prenotazioni online
  const [hasBookingAlert, setHasBookingAlert] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  
  // Use the media query hook to detect mobile screens
  const isMobile = useMediaQuery("(max-width: 1024px)");

  // Stato per i conteggi degli appuntamenti
  const [dayCount, setDayCount] = useState<number | null>(null);
  const [weekCount, setWeekCount] = useState<number | null>(null);
  const [monthCount, setMonthCount] = useState<number | null>(null);
  const [taskCount, setTaskCount] = useState<number | null>(null);

  // Stati per il monitoraggio della connessione
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('connecting');
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isConnectionIndicatorVisible, setIsConnectionIndicatorVisible] = useState(false);
  const [realtimeConnectionStatus, setRealtimeConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('connecting');

  // Temporarily use static values for connection display until we implement proper event system
  const appointmentsStatus = connectionStatus;
  const appointmentsError = lastError;
  const reconnectAppointments = () => {
    console.log('🔄 [Navbar] Reconnect requested');
    // This will be implemented when we add the event system
  };
  const appointmentsLoaded = true;
  const appointmentsHeartbeatStatus = connectionStatus;
  const appointmentsHeartbeatActive = connectionStatus === 'connected';
  const appointmentsHeartbeatCount = 0;

  // Use appointment hook data for connection manager values
  const managerStatus = appointmentsStatus;
  const managerConnected = appointmentsStatus === 'connected';
  const heartbeatActive = appointmentsHeartbeatActive;
  const heartbeatCount = appointmentsHeartbeatCount;
  const heartbeatError = appointmentsError;
  const reconnectAttempts = 0;
  const healthScore = appointmentsStatus === 'connected' ? 100 : 0;
  const connectionHealth = appointmentsStatus === 'connected' ? 'excellent' as const : 'critical' as const;
  const reconnectManager = reconnectAppointments;
  const forceHeartbeat = () => {};

  // Click outside functionality for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close New dropdown if clicking outside
      if (isNewDropdownOpen && !target.closest('[data-dropdown="new"]')) {
        setIsNewDropdownOpen(false);
      }
      
      // Close Menu dropdown if clicking outside
      if (isMenuDropdownOpen && !target.closest('[data-dropdown="menu"]')) {
        setIsMenuDropdownOpen(false);
      }
    };

    if (isNewDropdownOpen || isMenuDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNewDropdownOpen, isMenuDropdownOpen]);

  // Ref per gestire le sottoscrizioni agli eventi
  const eventListenersRef = useRef<(() => void)[]>([]);

  // Funzione per testare la connessione a Supabase
  const testConnection = async () => {
    const supabase = createClient();
    const startTime = Date.now();
    
    try {
      setConnectionStatus('connecting');
      
      // Test di connessione semplice
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (error) {
        throw error;
      }
      
      setConnectionStatus('connected');
      setConnectionLatency(latency);
      setLastError(null);
      
      console.log('✅ [Navbar] Connection test successful, latency:', latency + 'ms');
    } catch (error) {
      console.error('❌ [Navbar] Connection test failed:', error);
      setConnectionStatus('error');
      setLastError(error instanceof Error ? error.message : 'Errore di connessione');
      setConnectionLatency(null);
    }
  };

  // Monitoraggio periodico della connessione
  useEffect(() => {
    // Test iniziale
    testConnection();
    
    // Test periodico ogni 30 secondi
    const interval = setInterval(testConnection, 30000);
    
    // Test quando la pagina riprende il focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        testConnection();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Sottoscrizione notifiche chat globali
  useEffect(() => {
    const cleanup = listenForChatNotificationEvents(() => {
      // No-op: we derive chatCount from unread direct messages to keep it consistent with per-member badges
    });
    return () => cleanup();
  }, []);

  // Keep chatCount in sync with unread direct messages (sum across senders)
  const fetchUnreadDirectCount = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_unread_direct_counts');
      if (!error && Array.isArray(data)) {
        const total = (data as any[]).reduce((sum, row: any) => sum + (row.unread_count ?? 0), 0);
        setChatCount(total);
      }
    } catch {}
  };

  useEffect(() => {
    fetchUnreadDirectCount();
    const supabase = createClient();
    let channel: any = null;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        channel = supabase
          .channel(`realtime:direct_unread_nav_${user.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${user.id}`,
          }, () => {
            fetchUnreadDirectCount();
          })
          .subscribe();
      } catch {}
    })();

    const handleUnreadChanged = () => fetchUnreadDirectCount();
    window.addEventListener('chat:unreadCountsChanged', handleUnreadChanged);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('chat:unreadCountsChanged', handleUnreadChanged);
    };
  }, []);
  // Controlla se ci sono prenotazioni online attive al mount
  useEffect(() => {
    const fetchBookingAlert = async () => {
      const supabase = createClient();
      const salonId = await getSalonId();
      if (!salonId) return;
      const { count, error } = await supabase
        .from('online_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('salon_id', salonId)
        .eq('archived', false)
        .eq('status', 'pending');
      setBookingCount(count ?? 0);
      setHasBookingAlert(!error && count != null && count > 0);
    };

    fetchBookingAlert();
    // Refresh on custom event when bookings change
    const handleBookingsUpdated = () => fetchBookingAlert();
    window.addEventListener('onlineBookings:updated', handleBookingsUpdated);
    return () => window.removeEventListener('onlineBookings:updated', handleBookingsUpdated);
  }, []);

  // Mostra l'indicatore di connessione solo per gravi errori
  useEffect(() => {
    // Mostra solo per errori critici o disconnessioni
    if (connectionStatus === 'error' || 
        (connectionStatus === 'disconnected' && heartbeatCount > 0) ||
        (managerStatus === 'error' && heartbeatCount > 0) ||
        (realtimeConnectionStatus === 'error' && heartbeatCount > 0)) {
      setIsConnectionIndicatorVisible(true);
    } else {
      // Nascondi dopo 3 secondi se tutto è OK
      const timer = setTimeout(() => {
        setIsConnectionIndicatorVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, managerStatus, realtimeConnectionStatus, heartbeatCount]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIcon = localStorage.getItem('activeIcon');
      // Se non c'è nulla in localStorage, imposta 'day'
      if (!savedIcon) {
        setActiveIcon('day');
        localStorage.setItem('activeIcon', 'day');
      } else {
        setActiveIcon(savedIcon);
      }
    }
  }, []);

  useEffect(() => {
    if (activeIcon) {
      localStorage.setItem('activeIcon', activeIcon);
    }
  }, [activeIcon]);

  // Funzione per aggiornare i conteggi degli appuntamenti
  const fetchAppointmentCounts = async () => {
    const supabase = createClient();
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dayStr = `${yyyy}-${mm}-${dd}`;
      
      // Calcolo inizio/fine settimana (lunedì-domenica)
      const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - dayOfWeek + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      const weekEnd = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
      
      // Calcolo inizio/fine mese
      const firstDay = `${yyyy}-${mm}-01`;
      const lastDay = `${yyyy}-${mm}-${new Date(yyyy, today.getMonth() + 1, 0).getDate()}`;
      
      // Giorno
      const { count: dayCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('data', dayStr)
        .neq('status', 'Eliminato');
      
      // Settimana
      const { count: weekCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('data', weekStart)
        .lte('data', weekEnd)
        .neq('status', 'Eliminato');
      
      // Mese
      const { count: monthCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('data', firstDay)
        .lte('data', lastDay)
        .neq('status', 'Eliminato');
      
      setDayCount(dayCount ?? 0);
      setWeekCount(weekCount ?? 0);
      setMonthCount(monthCount ?? 0);
      
      console.log('📊 [Navbar] Appointment counts updated:', {
        day: dayCount ?? 0,
        week: weekCount ?? 0,
        month: monthCount ?? 0
      });
    } catch (error) {
      console.error('❌ [Navbar] Error fetching appointment counts:', error);
    }
  };

  // Funzione per aggiornare il conteggio dei task
  const fetchTaskCount = async () => {
    const supabase = createClient();
    try {
      const salonId = await getSalonId();
      if (!salonId) {
        console.error('❌ [Navbar] No salon ID found for task count');
        return;
      }

      let query = supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('task', true)
        .neq('status', 'Eliminato') // Esclude i task eliminati
        .eq('salon_id', salonId);

      // Tutti gli utenti vedono solo i propri task (manager inclusi)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: teamData } = await supabase
          .from('team')
          .select('id')
          .eq('user_id', user.id)
          .eq('salon_id', salonId)
          .single();

        if (teamData) {
          query = query.eq('team_id', teamData.id);
          console.log('📋 [Navbar] Filtering tasks for user:', teamData.id);
        }
      }

      const { count: taskCount } = await query;
      
      setTaskCount(taskCount ?? 0);
      
      console.log('📋 [Navbar] Task count updated:', taskCount ?? 0);
    } catch (error) {
      console.error('❌ [Navbar] Error fetching task count:', error);
    }
  };

  // Carica i conteggi iniziali
  useEffect(() => {
    fetchAppointmentCounts();
    fetchTaskCount();
  }, []);

  // Sottoscrizione agli eventi degli appuntamenti per aggiornamenti in tempo reale
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Ascolta gli eventi di creazione appuntamenti
    const createdCleanup = listenForAppointmentEvents(
      APPOINTMENT_EVENTS.CREATED,
      (detail) => {
        console.log('📅 [Navbar] Appointment created event received:', detail);
        // Aggiorna i conteggi dopo un breve delay per assicurarsi che il database sia aggiornato
        setTimeout(() => {
          fetchAppointmentCounts();
          fetchTaskCount();
        }, 500);
      }
    );
    cleanupFunctions.push(createdCleanup);

    // Ascolta gli eventi di aggiornamento appuntamenti
    const updatedCleanup = listenForAppointmentEvents(
      APPOINTMENT_EVENTS.UPDATED,
      (detail) => {
        console.log('📅 [Navbar] Appointment updated event received:', detail);
        // Aggiorna i conteggi dopo un breve delay
        setTimeout(() => {
          fetchAppointmentCounts();
          fetchTaskCount();
        }, 500);
      }
    );
    cleanupFunctions.push(updatedCleanup);

    // Ascolta gli eventi di eliminazione appuntamenti
    const deletedCleanup = listenForAppointmentEvents(
      APPOINTMENT_EVENTS.DELETED,
      (detail) => {
        console.log('📅 [Navbar] Appointment deleted event received:', detail);
        // Aggiorna i conteggi dopo un breve delay
        setTimeout(() => {
          fetchAppointmentCounts();
          fetchTaskCount();
        }, 500);
      }
    );
    cleanupFunctions.push(deletedCleanup);

    // Ascolta gli eventi di creazione task
    const taskCreatedCleanup = listenForTaskEvents(
      TASK_EVENTS.CREATED,
      (detail) => {
        console.log('📋 [Navbar] Task created event received:', detail);
        // Aggiorna i conteggi dopo un breve delay
        setTimeout(() => {
          fetchTaskCount();
        }, 500);
      }
    );
    cleanupFunctions.push(taskCreatedCleanup);

    // Ascolta gli eventi di aggiornamento task
    const taskUpdatedCleanup = listenForTaskEvents(
      TASK_EVENTS.UPDATED,
      (detail) => {
        console.log('📋 [Navbar] Task updated event received:', detail);
        // Aggiorna i conteggi dopo un breve delay
        setTimeout(() => {
          fetchTaskCount();
        }, 500);
      }
    );
    cleanupFunctions.push(taskUpdatedCleanup);

    // Ascolta gli eventi di eliminazione task
    const taskDeletedCleanup = listenForTaskEvents(
      TASK_EVENTS.DELETED,
      (detail) => {
        console.log('📋 [Navbar] Task deleted event received:', detail);
        // Aggiorna i conteggi dopo un breve delay
        setTimeout(() => {
          fetchTaskCount();
        }, 500);
      }
    );
    cleanupFunctions.push(taskDeletedCleanup);

    // Ascolta gli eventi di cambio stato task
    const taskStatusChangedCleanup = listenForTaskEvents(
      TASK_EVENTS.STATUS_CHANGED,
      (detail) => {
        console.log('📋 [Navbar] Task status changed event received:', detail);
        // Aggiorna i conteggi dopo un breve delay
        setTimeout(() => {
          fetchTaskCount();
        }, 500);
      }
    );
    cleanupFunctions.push(taskStatusChangedCleanup);

    // Salva le funzioni di cleanup per la rimozione
    eventListenersRef.current = cleanupFunctions;

    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  // IBM Carbon inspired button styles with consistent font and professional dark theme support
  const carbonButtonStyle = (isActive: boolean) => {
    return clsx(
      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg border font-["Manrope"]',
      {
        // Active state - Professional blue with elegant shadow
        'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-800/80 shadow-sm ring-1 ring-blue-100/50 dark:ring-slate-700/50': isActive,
        // Inactive state - Professional gray with smooth hover effects
        'text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-slate-600 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 hover:shadow-sm': !isActive,
      }
    );
  };

  const getCountDisplay = (count: number | null, type: string) => {
    if (count === null) return null;
    return (
      <Badge 
        variant="secondary" 
        className={clsx(
          'ml-2 px-2 py-0.5 text-xs font-medium font-["Manrope"] shadow-sm',
          {
            'bg-blue-100 dark:bg-slate-700/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-slate-600/50': type === 'active',
            'bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700/50': type === 'inactive'
          }
        )}
      >
        {count}
      </Badge>
    );
  };

  const handleIconClick = (iconName: string, callback: () => void) => {
    callback();
  };

  // Funzione per ottenere l'icona dello stato di connessione
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={14} className="text-green-500" />;
      case 'connecting':
        return <Wifi size={14} className="text-yellow-500 animate-pulse" />;
      case 'error':
      case 'disconnected':
        return <WifiOff size={14} className="text-red-500" />;
      default:
        return <Warning size={14} className="text-orange-500" />;
    }
  };

  // Funzione per ottenere il testo dello stato di connessione
  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return connectionLatency ? `${connectionLatency}ms` : t('navbar.connected', 'Connesso');
      case 'connecting':
        return t('navbar.connecting', 'Connessione...');
      case 'error':
        return t('navbar.error', 'Errore');
      case 'disconnected':
        return t('navbar.disconnected', 'Disconnesso');
      default:
        return t('navbar.unknown', 'Sconosciuto');
    }
  };

  // Funzione per ottenere il colore dello stato di connessione
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return connectionLatency && connectionLatency > 2000 
          ? 'text-orange-500 dark:text-orange-400' 
          : 'text-green-500 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'error':
      case 'disconnected':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className={clsx(
      "fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-gray-200 dark:border-slate-700/50 h-16 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80",
      isMobile && "hidden"
    )}>
      <div className="px-6 py-2 h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          {/* Left Section - Sidebar Toggle and Logo */}
          <div className="flex items-center gap-6">
            {/* Sidebar Toggle Button */}
            {hasPermission('canViewAppointments') && (
              <div className="fixed left-0 top-0 z-50 h-16 w-6 bg-blue-600 dark:bg-slate-800 border-0 rounded-none flex items-center justify-center transition-all duration-200 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleIconClick('sidebar', toggleSidebar)}
                  className="h-full w-full flex items-center justify-center hover:bg-blue-700 dark:hover:bg-slate-700 transition-colors duration-200 border-0 rounded-none"
                  title={showSidebar ? t('navbar.close_sidebar', 'Chiudi sidebar') : t('navbar.open_sidebar', 'Apri sidebar')}
                >
                  {showSidebar ? (
                    <SidePanelClose 
                      size={16} 
                      className="transition-colors duration-200 text-white"
                    />
                  ) : (
                    <SidePanelOpen 
                      size={16} 
                      className="transition-colors duration-200 text-white"
                    />
                  )}
                </Button>
              </div>
            )}
            
            {/* Logo */}
            <div className="flex items-center gap-0 ml-8">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={36} 
                height={36}
                className="object-contain bg-transparent"
                style={{ backgroundColor: 'transparent' }}
              />
              <Link
                href="/dashboard"
                className="text-xl font-medium text-gray-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative font-['Manrope']"
              >
                <span className="absolute -top-2.5 left-[5.8em] text-[10px] font-bold text-violet-600 dark:text-violet-400 font-['Manrope']">Beta</span>
                ZugFlow
              </Link>
            </div>
          </div>

          {/* Center Section - Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              {hasPermission('canViewAppointments') && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleIconClick('day', toggleDay)}
                    className={carbonButtonStyle(showDay)}
                  >
                    <Time size={16} className={showDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'} />
                    <span>{t('navbar.day', 'Giorno')}</span>
                    {getCountDisplay(dayCount, showDay ? 'active' : 'inactive')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleIconClick('weekly', toggleWeekly)}
                    className={carbonButtonStyle(showWeekly)}
                  >
                    <Calendar size={16} className={showWeekly ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'} />
                    <span>{t('navbar.week', 'Settimana')}</span>
                    {getCountDisplay(weekCount, showWeekly ? 'active' : 'inactive')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleIconClick('monthly', toggleMonthly)}
                    className={carbonButtonStyle(showMonthly)}
                  >
                    <CalendarIcon size={16} className={showMonthly ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'} />
                    <span>{t('navbar.month', 'Mese')}</span>
                    {getCountDisplay(monthCount, showMonthly ? 'active' : 'inactive')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleIconClick('taskManager', toggleTaskManager)}
                    className={carbonButtonStyle(showTaskManager)}
                  >
                    <Checkmark size={16} className={showTaskManager ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'} />
                    <span>{t('navbar.tasks', 'Task')}</span>
                    {getCountDisplay(taskCount, showTaskManager ? 'active' : 'inactive')}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Right Section - Actions and User */}
          {!isMobile && (
            <div className="flex items-center gap-4">
              {/* Connection Status Indicator - Solo per errori critici */}
              {isConnectionIndicatorVisible && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-sm">
                        {getConnectionIcon()}
                        <span className={clsx(
                          'text-xs font-medium font-["Manrope"]',
                          getConnectionColor()
                        )}>
                          {getConnectionText()}
                        </span>
                        
                        {/* Error indicators only */}
                        {(heartbeatError || appointmentsError || lastError) && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs text-red-500 dark:text-red-400">
                              ERR
                            </span>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="bottom" 
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg rounded-md p-2 font-['Manrope']"
                    >
                      <div className="text-xs">
                        <div className="font-medium mb-1 text-red-600 dark:text-red-400">{t('navbar.connection_error', 'Errore di Connessione')}</div>
                        <div className="space-y-1 text-gray-600 dark:text-slate-300">
                          {lastError && (
                            <div className="text-red-500 dark:text-red-400">{t('navbar.database_error', 'Errore Database')}: {lastError}</div>
                          )}
                          {heartbeatError && (
                            <div className="text-red-500 dark:text-red-400">{t('navbar.heartbeat_error', 'Errore Heartbeat')}: {heartbeatError}</div>
                          )}
                          {appointmentsError && (
                            <div className="text-red-500 dark:text-red-400">{t('navbar.realtime_error', 'Errore Real-time')}: {appointmentsError}</div>
                          )}
                          {reconnectAttempts > 0 && (
                            <div className="text-blue-500 dark:text-blue-400">{t('navbar.reconnection_attempts', 'Tentativi riconnessione')}: {reconnectAttempts}</div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                            {t('navbar.auto_reconnection', 'Tentativo di riconnessione automatica...')}
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Search Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (showSearch) {
                    // Se la ricerca è già aperta, la chiude e torna alla vista precedente
                    setShowSearch(false);
                    // Torna alla vista precedente (questa logica è già nel page.tsx)
                  } else {
                    // Se la ricerca è chiusa, la apre
                    toggleSearch();
                  }
                }}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 text-sm font-normal transition-all duration-200 rounded-md font-['Manrope']",
                  showSearch 
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-600/50 shadow-sm" 
                    : "text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                )}
              >
                <Search size={16} />
              </Button>

              {/* Notification Button (Chat) */}
              <DropdownMenu open={isChatDropdownOpen} onOpenChange={(open) => {
                setIsChatDropdownOpen(open);
                // Do not clear chat counters on mere open; clear only on explicit action
              }}>
                <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={clsx(
                        "relative flex items-center gap-2 px-3 py-2 text-sm font-normal transition-all duration-200 rounded-md font-['Manrope']",
                        (chatCount > 0 || hasBookingAlert)
                          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-sm animate-[pulse_1.8s_ease-in-out_infinite]"
                          : "text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <Notification size={16} className={clsx((chatCount > 0 || hasBookingAlert) && 'text-red-600 dark:text-red-400')} />
                      {(chatCount > 0 || hasBookingAlert) && (
                        <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_2px_rgba(15,23,42,1)]" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-80 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-md font-['Manrope']">
                  <DropdownMenuLabel className="text-gray-900 dark:text-slate-100 font-medium px-4 py-2">{t('navbar.notifications', 'Notifiche')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* Prenotazioni */}
                  {bookingCount > 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Calendar size={16} className="text-gray-600 dark:text-gray-400" />
                      {t('navbar.booking_confirmation', 'Hai')} <span className="font-semibold">{bookingCount}</span> {bookingCount === 1 ? t('navbar.booking_confirmation_singular', 'prenotazione da confermare') : t('navbar.booking_confirmation_plural', 'prenotazioni da confermare')}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-500" />
                      {t('navbar.no_bookings', 'Nessuna prenotazione')}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  {/* Chat counter */}
                  <div className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Chat size={16} className="text-gray-600 dark:text-gray-400" />
                    {t('navbar.unread_messages', 'Messaggi da leggere')}: <span className="font-semibold">{chatCount}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      // navigate to bookings and clear booking alert
                      toggleOnlineBookings();
                      setHasBookingAlert(false);
                      setIsChatDropdownOpen(false);
                    }}
                  >
                    {t('navbar.view_bookings', 'Visualizza prenotazioni')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      const event = new CustomEvent('sidebar:toggleChat');
                      window.dispatchEvent(event);
                      // Clear chat counters when user explicitly opens chat
                      setHasChatAlert(false);
                      setChatCount(0);
                      setIsChatDropdownOpen(false);
                    }}
                  >
                    {t('navbar.open_chat', 'Apri chat')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* New Button */}
              {(hasPermission('canCreateAppointments') || hasPermission('canCreateClients') || hasPermission('canCreateServices')) && (
                <DropdownMenu open={isNewDropdownOpen} onOpenChange={setIsNewDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-slate-700 text-white hover:bg-blue-700 dark:hover:bg-slate-600 transition-all duration-200 font-normal rounded-md font-['Manrope'] shadow-sm"
                      variant="default"
                      size="sm"
                    >
                      <Add size={16} />
                      <span>{t('navbar.new', 'Nuovo')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg rounded-md font-['Manrope']"
                    data-dropdown="new"
                  >
                    <DropdownMenuLabel className="text-gray-900 dark:text-slate-100 font-medium px-4 py-2 font-['Manrope']">{t('navbar.create_new', 'Crea nuovo')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {hasPermission('canCreateAppointments') && (
                      <DropdownMenuItem
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer rounded-md font-['Manrope']"
                        onClick={() => {
                          console.log('📅 [Navbar] New appointment button clicked (desktop)');
                          setSelectedAction('appointment');
                          setIsCreateOrderOpen(true);
                          updateModalState?.(true);
                          setIsNewDropdownOpen(false);
                        }}
                      >
                        <Calendar size={16} className="text-gray-600 dark:text-slate-400" />
                        <span>{t('navbar.new_appointment', 'Nuovo appuntamento')}</span>
                      </DropdownMenuItem>
                    )}
                    {hasPermission('canCreateClients') && (
                      <DropdownMenuItem
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer rounded-md font-['Manrope']"
                        onClick={() => {
                          setSelectedAction('client');
                          setIsCreateClientModalOpen(true);
                          updateModalState?.(true);
                          setIsNewDropdownOpen(false);
                        }}
                      >
                        <UserFollow size={16} className="text-gray-600 dark:text-slate-400" />
                        <span>{t('navbar.new_client', 'Nuovo cliente')}</span>
                      </DropdownMenuItem>
                    )}
                    {hasPermission('canCreateServices') && (
                      <>
                        <DropdownMenuItem
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer rounded-md font-['Manrope']"
                          onClick={() => {
                            setIsCreateServiceModalOpen(true);
                            updateModalState?.(true);
                            setIsNewDropdownOpen(false);
                          }}
                        >
                          <Cut size={16} className="text-gray-600 dark:text-slate-400" />
                          <span>{t('navbar.new_service', 'Nuovo servizio')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer rounded-md font-['Manrope']"
                          onClick={() => {
                            setIsCreatePausaModalOpen(true);
                            updateModalState?.(true);
                            setIsNewDropdownOpen(false);
                          }}
                        >
                          <Time size={16} className="text-gray-600 dark:text-slate-400" />
                          <span>{t('navbar.new_break', 'Nuova pausa')}</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {hasPermission('canViewAppointments') && (
                      <DropdownMenuItem
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer rounded-md font-['Manrope']"
                        onClick={() => {
                          console.log('📋 [Navbar] New task button clicked');
                          // Only open the create modal without switching pages
                          setIsTaskCreateModalOpen?.(true);
                          updateModalState?.(true);
                          setIsNewDropdownOpen(false);
                        }}
                      >
                        <Checkmark size={16} className="text-gray-600 dark:text-slate-400" />
                        <span>{t('navbar.new_task', 'Nuovo task')}</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Support Admin Button - Solo per admin */}
              {userRole === 'admin' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/dashboard/admin/support-tickets">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 px-3 py-2 text-sm font-normal text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-200 rounded-md font-['Manrope'] border border-violet-200 dark:border-violet-700/50"
                        >
                          <Help size={16} />
                          <span>Support Admin</span>
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg rounded-md p-2 font-['Manrope']">
                      <div className="text-xs">
                        <div className="font-medium mb-1 text-violet-600 dark:text-violet-400">Pannello Supporto</div>
                        <div className="text-gray-600 dark:text-slate-300">
                          Gestisci i ticket di supporto degli utenti
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Menu Dropdown */}
              {(hasPermission('canViewClients') || hasPermission('canViewServices') || hasPermission('canViewFinance') || hasPermission('canViewInventory')) && (
                <DropdownMenu open={isMenuDropdownOpen} onOpenChange={setIsMenuDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-normal text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-md font-['Manrope']"
                    >
                      <Globe size={16} />
                      <span>{t('navbar.menu', 'Menu')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg rounded-md font-['Manrope']"
                    data-dropdown="menu"
                  >
                    <DropdownMenuLabel className="text-gray-900 dark:text-slate-100 font-medium px-4 py-2 font-['Manrope']">{t('navbar.main_menu', 'Menu principale')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {hasPermission('canViewClients') && (
                      <DropdownMenuItem
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors rounded-md font-["Manrope"]',
                          showClients ? '!bg-blue-50 dark:!bg-slate-800/80 text-blue-700 dark:text-blue-300 font-medium shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        )}
                        onClick={() => {
                          handleIconClick('clients', toggleClients);
                          setIsMenuDropdownOpen(false);
                        }}
                      >
                        <UserMultiple size={16} />
                        <span>{t('navbar.clients', 'Clienti')}</span>
                      </DropdownMenuItem>
                    )}
                    {hasPermission('canViewServices') && (
                      <DropdownMenuItem
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors rounded-md font-["Manrope"]',
                          showGestioneServizi ? '!bg-blue-50 dark:!bg-slate-800/80 text-blue-700 dark:text-blue-300 font-medium shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        )}
                        onClick={() => {
                          handleIconClick('services', toggleServices);
                          setIsMenuDropdownOpen(false);
                        }}
                      >
                        <Cut size={16} />
                        <span>{t('navbar.services', 'Servizi')}</span>
                      </DropdownMenuItem>
                    )}
                    {hasPermission('canViewAppointments') && (
                      <DropdownMenuItem
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors rounded-md font-["Manrope"]',
                          showPermessiFerie ? '!bg-blue-50 dark:!bg-slate-800/80 text-blue-700 dark:text-blue-300 font-medium shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        )}
                        onClick={() => {
                          handleIconClick('permessiFerie', togglePermessiFerie);
                          setIsMenuDropdownOpen(false);
                        }}
                      >
                        <CalendarSettings size={16} />
                        <span>{t('navbar.staff_management', 'Gestione Personale')}</span>
                      </DropdownMenuItem>
                    )}
                    {hasPermission('canViewAppointments') && (
                      <DropdownMenuItem
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors rounded-md font-["Manrope"]',
                          showOnlineBookings ? '!bg-blue-50 dark:!bg-slate-800/80 text-blue-700 dark:text-blue-300 font-medium shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        )}
                        onClick={() => {
                          handleIconClick('onlineBookings', toggleOnlineBookings);
                          setIsMenuDropdownOpen(false);
                        }}
                      >
                        <Globe size={16} />
                        <span>{t('navbar.online_bookings', 'Prenotazioni Online')}</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Navigation */}
              <UserNav 
                toggleImpostazioni={toggleImpostazioni}
                isInSettings={showImpostazioni}
                toggleProfile={toggleProfile}
                isInProfile={showProfile}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Order dialog - pass the selected action */}
      <CreateOrder
        isDialogOpen={isCreateOrderOpen}
        setIsDialogOpen={(open) => {
          setIsCreateOrderOpen(open);
          updateModalState?.(open);
        }}
        actionType={selectedAction}
        onAppointmentCreated={() => {
          // Dispatch event to notify calendar components
          dispatchAppointmentEvent(APPOINTMENT_EVENTS.CREATED);
        }}
      />

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => {
          setIsCreateClientModalOpen(false);
          updateModalState?.(false);
        }}
      />

      {/* Modal Nuovo Servizio */}
      <FormModal
        isDialogOpen={isCreateServiceModalOpen}
        setIsDialogOpen={(open) => {
          setIsCreateServiceModalOpen(open);
          updateModalState?.(open);
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
                updateModalState?.(open);
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
