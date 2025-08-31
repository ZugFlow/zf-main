"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { SupabaseClient } from '@supabase/supabase-js';
import { usePermissions } from "./Impostazioni/usePermission";
import { Session } from "@supabase/auth-helpers-nextjs";
import { getSalonId, getCurrentTeamMemberId, updateTeamMemberSidebarState } from "@/utils/getSalonId";

import { Navbar } from "./navbar";

import DayCalendar from "./Appuntamenti/day_weekly_view/day"; // Import DailyCalendar component from day.tsx
import MonthlyCalendar from "./Appuntamenti/day_weekly_view/monthly"; // Add this import
import WeeklyCalendar from "./Appuntamenti/day_weekly_view/weekly"; // Add this import
import { OnboardingHelper } from './Appuntamenti/helper';

import IncassiGiornalieri from "./Finanze/Incassi";

import AnagraficaClienti from "./Clienti/AnagraficaClienti";
import { AnagraficaClientiMobile } from "./Clienti/AnagraficaClientiMobile";
import LoyaltyCoupons from "./Clienti/Loyalty";
import GestioneMagazzino from "./GestioneMagazzino/GestioneMagazzino";
import WarehouseDashboard from "./GestioneMagazzino/WarehouseDashboard";
import ImpostazioniAvanzate from "./Impostazioni/ImpostazioniAvanzate";
import GestioneServizi from "./Servizi/GestioneServizi/GestioneServizi";

import Profilo from "./Profile/Profilo";
import PermessiFeriePage from "./PermessiFerie/page";
import OnlineBookingsPage from "./PrenotazioniOnline/page";
import ArchivedAppointments from "./Appuntamenti/ArchivedAppointments";
import TaskManager from "./TaskManager/page";
import { TaskCreateModal } from "./TaskManager/modal";
import { ChatGroupsModal } from '@/components/chat/ChatGroupsModal';
import { SearchModal } from "./Appuntamenti/day_weekly_view/search";

import dynamic from "next/dynamic";
const CenterNotification = dynamic(() => import("./notification/CenterNotification"), { ssr: false });
import { useIsMobile } from '@/hooks/use-mobile';
import clsx from 'clsx';
import SidebarPage from './Sidebar/page';
import SettingsSidebar from './Sidebar/SettingsSidebar';
import { dispatchAppointmentEvent, APPOINTMENT_EVENTS } from './utils/appointmentEvents';

import { InactivityIndicator } from '@/components/InactivityIndicator';
// Rimuovo tutti i riferimenti ai file di debug eliminati

// Types for sidebar data
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

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { permissions, loading: permissionsLoading, userRole, hasPermission, canAccess } = usePermissions(session);
  const isMobile = useIsMobile();
  
  // Inactivity and auto-refresh management - TEMPORARILY DISABLED to fix loop
  // const { isInactive, triggerRefresh, notifyPageChange } = usePageChangeRefresh({
  //   enableAutoRefresh: true,
  //   refreshOnPageChange: true,
  //   inactivityThreshold: 3 * 60 * 1000, // 3 minutes
  //   debugMode: process.env.NODE_ENV === 'development'
  // });
  
  // Dummy functions to prevent errors
  const isInactive = false;
  const triggerRefresh = () => {};
  const notifyPageChange = (page?: string) => {};
  
  // States for sidebar data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingSidebarData, setIsLoadingSidebarData] = useState(false);
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | null>(null);
  
  // Add fetch prevention flags
  const hasFetchedSession = useRef(false);
  const hasFetchedSidebarData = useRef(false);
  const isFetchingSidebarData = useRef(false);
  
  // Sistema di monitoraggio per rilevare blocchi (RIMOSSO)
  // const lastActivityRef = useRef<number>(Date.now());
  // const isSystemBlockedRef = useRef<boolean>(false);
  
  // Avvia il debugger semplice in modalità sviluppo (DISABILITATO PER EVITARE LOOP)
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  //     // Avvia il monitoraggio del sistema dopo 2 secondi
  //     setTimeout(() => {
  //       if ((window as any).startSimpleDebug) {
  //         (window as any).startSimpleDebug();
  //         console.log('🔍 [Dashboard] Simple debugger started');
  //       }
  //     }, 2000);
  //   }
  // }, []);
  
  // Monitora l'attività del sistema (TEMPORANEAMENTE DISABILITATO)
  // useEffect(() => {
  //   const updateActivity = () => {
  //     lastActivityRef.current = Date.now();
  //   };
  //   
  //   const checkSystemHealth = () => {
  //     const now = Date.now();
  //     const timeSinceLastActivity = now - lastActivityRef.current;
  //     
  //     // Se non c'è attività da 5 minuti e siamo in loading, il sistema è bloccato
  //     if (timeSinceLastActivity > 5 * 60 * 1000 && isLoading && !isSystemBlockedRef.current) {
  //       console.warn('⚠️ [Dashboard] System appears to be blocked, forcing refresh...');
  //       isSystemBlockedRef.current = true;
  //       
  //       // Forza un refresh della pagina
  //       window.location.reload();
  //     }
  //   };
  //   
  //   // Eventi per monitorare l'attività
  //   const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  //   activityEvents.forEach(event => {
  //     document.addEventListener(event, updateActivity, { passive: true });
  //   });
  //   
  //   // Controlla la salute del sistema ogni minuto (ridotto da ogni 10 secondi)
  //   const healthCheckInterval = setInterval(checkSystemHealth, 60000);
  //   
  //   return () => {
  //     activityEvents.forEach(event => {
  //       document.removeEventListener(event, updateActivity);
  //     });
  //     clearInterval(healthCheckInterval);
  //   };
  // }, [isLoading]);

  // Listen for events to close sidebar when others open
  useEffect(() => {
    const handleOtherSidebarOpened = () => {
      setShowSidebar(false);
    };

    const handleSettingsSidebarOpened = () => {
      setShowSidebar(false);
    };

    window.addEventListener('settings-sidebar-opened', handleOtherSidebarOpened);
    window.addEventListener('appointments-sidebar-opened', handleSettingsSidebarOpened);

    return () => {
      window.removeEventListener('settings-sidebar-opened', handleOtherSidebarOpened);
      window.removeEventListener('appointments-sidebar-opened', handleSettingsSidebarOpened);
    };
  }, []);

  // Debug log per sessione e permessi - OPTIMIZED
  useEffect(() => {
    console.log('🏠 [Dashboard] Session and permissions state:', {
      session: session?.user?.id,
      permissionsLoading,
      userRole,
      permissions: Object.keys(permissions || {}).length // Log count instead of full object
    });
  }, [session?.user?.id, permissionsLoading, userRole]); // Remove permissions from dependency
  
  // Function to fetch sidebar data - OPTIMIZED
  const fetchSidebarData = async (forceRefresh = false) => {
    if (!session?.user) return;
    
    // Prevent duplicate fetches
    if (isFetchingSidebarData.current && !forceRefresh) {
      console.log('Skipping fetchSidebarData - already fetching');
      return;
    }
    
    if (hasFetchedSidebarData.current && !forceRefresh) {
      console.log('Skipping fetchSidebarData - already fetched');
      return;
    }
    
    setIsLoadingSidebarData(true);
    isFetchingSidebarData.current = true;
    
    try {
      const supabase = createClient();
      const salonId = await getSalonId();
      
      if (!salonId) {
        console.error("No salon_id found for sidebar data");
        return;
      }

      // Fetch appointments
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*, status, color_card, prefer_card_style, task")
        .eq('salon_id', salonId)
        .order('orarioInizio', { ascending: true });

      if (ordersError) {
        console.error("Error fetching orders for sidebar:", ordersError.message);
        return;
      }

      // Fetch services for each order
      const appointmentsWithServices = await Promise.all(
        (orders || []).map(async (order) => {
          const { data: services, error: servicesError } = await supabase
            .from("order_services")
            .select("*")
            .eq('order_id', order.id);

          if (servicesError) {
            console.error(`Error fetching services for order ${order.id}:`, servicesError.message);
            return order;
          }

          // Transform services to match the expected format
          const transformedServices = (services || []).map(service => ({
            id: service.service_id || service.id,
            name: service.servizio || service.name || 'Servizio sconosciuto',
            price: service.price || 0
          }));

          return {
            ...order,
            services: transformedServices
          };
        })
      );

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from("team")
        .select("id, name, email, phone_number, ColorMember, avatar_url, visible_users, order_column")
        .eq("salon_id", salonId)
        .eq("is_active", true)
        .order('order_column', { ascending: true });

      if (membersError) {
        console.error("Error fetching team members for sidebar:", membersError.message);
        return;
      }

      setAppointments(appointmentsWithServices);
      setTeamMembers(members || []);
      hasFetchedSidebarData.current = true;
    } catch (error) {
      console.error("Error fetching sidebar data:", error);
    } finally {
      setIsLoadingSidebarData(false);
      isFetchingSidebarData.current = false;
    }
  };

  // CONSOLIDATED session and team member management - SINGLE useEffect
  useEffect(() => {
    if (hasFetchedSession.current) return;
    hasFetchedSession.current = true;
    
    const supabase = createClient();
    let retryCount = 0;
    const maxRetries = 3;
    let timeoutId: NodeJS.Timeout;
    let refreshIntervalId: NodeJS.Timeout;
    let hasSetupAutoRefresh = false; // Flag per evitare setup multipli
    
    // Timeout più breve per Vercel (5 secondi invece di 10)
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    const sessionTimeout = isVercel ? 5000 : 10000;
    
    // Funzione per refrescare automaticamente la sessione
    const setupAutoRefresh = (session: any) => {
      if (hasSetupAutoRefresh) return; // Evita setup multipli
      hasSetupAutoRefresh = true;
      
      if (refreshIntervalId) clearInterval(refreshIntervalId);
      
      // Refresha il token ogni 45 minuti (prima della scadenza di 1 ora)
      refreshIntervalId = setInterval(async () => {
        try {
          console.log('🔄 [Dashboard] Auto-refreshing session...');
          const { error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error('❌ [Dashboard] Session refresh failed:', error);
            // Se il refresh fallisce, reindirizza al login
            window.location.href = '/auth/login';
          } else {
            console.log('✅ [Dashboard] Session refreshed successfully');
          }
        } catch (error) {
          console.error('❌ [Dashboard] Error during session refresh:', error);
        }
      }, 45 * 60 * 1000); // 45 minuti
    };
    
    const getSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Timeout di sicurezza per evitare caricamenti infiniti
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session timeout')), sessionTimeout);
        });
        
        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);
        
        const { data: { session }, error: sessionError } = result;
        
        clearTimeout(timeoutId);
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          
          // Retry logic per errori di rete
          if (retryCount < maxRetries && (sessionError.message.includes('network') || sessionError.message.includes('timeout'))) {
            retryCount++;
            console.log(`🔄 Retrying session fetch (${retryCount}/${maxRetries})...`);
            setTimeout(getSession, 2000 * retryCount); // Backoff esponenziale
            return;
          }
          
          setError('Errore di autenticazione. Riprova.');
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        
        // Setup auto-refresh se abbiamo una sessione valida
        if (session?.user) {
          setupAutoRefresh(session);
        }
        
        // Get current team member ID and sidebar state
        if (session?.user) {
          try {
            const teamMemberId = await getCurrentTeamMemberId();
            setCurrentTeamMemberId(teamMemberId);
            
            if (teamMemberId) {
              // Load initial sidebar state from database
              const { data: teamData, error } = await supabase
                .from('team')
                .select('sidebar')
                .eq('id', teamMemberId)
                .single();
              
              if (!error && teamData) {
                setShowSidebar(teamData.sidebar);
              }
            }
          } catch (teamError) {
            console.error('Team member error:', teamError);
            // Don't set error for team member issues, just log
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        
        // Retry logic per errori generici
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying session initialization (${retryCount}/${maxRetries})...`);
          setTimeout(getSession, 2000 * retryCount);
          return;
        }
        
        setError('Errore di inizializzazione. Riprova.');
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    getSession();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (refreshIntervalId) clearInterval(refreshIntervalId);
    };
  }, []);

  // CONSOLIDATED sidebar data fetching - SINGLE useEffect
  useEffect(() => {
    if (isFetchingSidebarData.current) return;
    isFetchingSidebarData.current = true;
    
    const fetchData = async () => {
      try {
        await fetchSidebarData(true);
      } catch (error) {
        console.error('Sidebar data fetch error:', error);
      } finally {
        isFetchingSidebarData.current = false;
      }
    };
    
    fetchData();
    
    // Cleanup più aggressivo per Vercel
    return () => {
      isFetchingSidebarData.current = false;
    };
  }, []);
  
  // Gestione memoria specifica per Vercel
  useEffect(() => {
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    
    if (isVercel) {
      // Cleanup memoria ogni 2 minuti su Vercel
      const memoryCleanup = setInterval(() => {
        if ('memory' in performance) {
          const memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
          if (memoryUsage > 50) { // Se memoria > 50MB
            console.log('🧹 [Vercel] Memory cleanup triggered:', memoryUsage.toFixed(2), 'MB');
            // Forza garbage collection se disponibile
            if ('gc' in window) {
              (window as any).gc();
            }
          }
        }
      }, 120000); // Ogni 2 minuti
      
      return () => clearInterval(memoryCleanup);
    }
  }, []);

  // CONSOLIDATED event listeners - SINGLE useEffect
  useEffect(() => {
    const updateActivity = () => {
      // lastActivityRef.current = Date.now(); // RIMOSSO
    };
    
    const handleOtherSidebarOpened = () => {
      if (showSidebar) {
        setShowSidebar(false);
      }
      if (showSettingsSidebar) {
        setShowSettingsSidebar(false);
      }
    };
    
    const handleDateChangeEvent = (event: CustomEvent) => {
      const newDate = event.detail.date;
      if (newDate) {
        updateSelectedDate(newDate);
      }
    };
    
    const handleAppointmentEvent = () => {
      // Trigger refresh of appointments data
      triggerRefresh();
    };
    
    const handleSidebarChatStateChange = (event: CustomEvent) => {
      const { isOpen } = event.detail;
      setSidebarChatOpen(isOpen);
    };
    
    const handleInactivityRefresh = () => {
      console.log('🔄 [Dashboard] Inactivity refresh triggered');
      setIsRefreshing(true);
      
      // Retry logic per Vercel
      const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
      const maxRetries = isVercel ? 5 : 3;
      let retryCount = 0;
      
      const attemptRefresh = async () => {
        try {
          // Reset all states
          resetAllStates();
          
          // Force session refresh
          const supabase = createClient();
          await supabase.auth.refreshSession();
          
          // Reload sidebar data
          await fetchSidebarData(true);
          
          console.log('✅ [Dashboard] Refresh completed successfully');
          setIsRefreshing(false);
        } catch (error) {
          console.error('❌ [Dashboard] Refresh failed:', error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            console.log(`🔄 [Dashboard] Retrying refresh (${retryCount}/${maxRetries})...`);
            setTimeout(attemptRefresh, 2000 * retryCount);
          } else {
            console.error('❌ [Dashboard] Max retries reached, forcing page reload');
            window.location.reload();
          }
        }
      };
      
      attemptRefresh();
    };

    // Add event listeners
    window.addEventListener('sidebar:dateChanged', handleDateChangeEvent as EventListener);
    window.addEventListener('calendar:dateChanged', handleDateChangeEvent as EventListener);
    window.addEventListener('appointment:created', handleAppointmentEvent);
    window.addEventListener('appointment:updated', handleAppointmentEvent);
    window.addEventListener('appointment:deleted', handleAppointmentEvent);
    window.addEventListener('sidebar:chatStateChanged', handleSidebarChatStateChange as EventListener);
    window.addEventListener('inactivity:refresh', handleInactivityRefresh);

    return () => {
      // Cleanup all event listeners
      window.removeEventListener('sidebar:dateChanged', handleDateChangeEvent as EventListener);
      window.removeEventListener('calendar:dateChanged', handleDateChangeEvent as EventListener);
      window.removeEventListener('appointment:created', handleAppointmentEvent);
      window.removeEventListener('appointment:updated', handleAppointmentEvent);
      window.removeEventListener('appointment:deleted', handleAppointmentEvent);
      window.removeEventListener('sidebar:chatStateChanged', handleSidebarChatStateChange as EventListener);
      window.removeEventListener('inactivity:refresh', handleInactivityRefresh);
    };
  }, [session?.user?.id, hasPermission]); // Only depend on user ID and permission check



  const [showEarnings, setShowEarnings] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showClients, setShowClients] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currentView') === 'clients';
    }
    return false;
  });
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showMagazzino, setShowMagazzino] = useState(false);
  const [showWarehouseDashboard, setShowWarehouseDashboard] = useState(false);
  const [showImpostazioni, setShowImpostazioni] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currentView') === 'impostazioni';
    }
    return false;
  });
  const [showGestioneServizi, setShowGestioneServizi] = useState(false);
  const [showDay, setShowDay] = useState(true); // Sempre true di default
  const [showMonthly, setShowMonthly] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showPermessiFerie, setShowPermessiFerie] = useState(false);
  const [showOnlineBookings, setShowOnlineBookings] = useState(false);
  const [showArchivedAppointments, setShowArchivedAppointments] = useState(false);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [isTaskCreateModalOpen, setIsTaskCreateModalOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState('appuntamenti');
  const [showChat, setShowChat] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [sidebarChatOpen, setSidebarChatOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [previousView, setPreviousView] = useState<string>('day');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Funzione per aggiornare lo stato dei modal
  const updateModalState = (isOpen: boolean) => {
    setIsAnyModalOpen(isOpen || isTaskCreateModalOpen);
  };

  // Update modal state when task creation modal changes
  useEffect(() => {
    setIsAnyModalOpen(isTaskCreateModalOpen);
  }, [isTaskCreateModalOpen]);

  // Non nascondere più la navbar per PermessiFerie
  const shouldHideNavbar = false; // isMobile && showPermessiFerie;

  // CONSOLIDATED state management - SINGLE useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Forza sempre la vista Day al refresh, indipendentemente dalla vista precedente
      setShowEarnings(false);
      setShowReport(false);
      setShowClients(false);
      setShowLoyalty(false);
      setShowMagazzino(false);
      setShowWarehouseDashboard(false);
      setShowImpostazioni(false);
      setShowGestioneServizi(false);
      setShowDay(true); // Sempre true al refresh
      setShowMonthly(false);
      setShowWeekly(false);
      setShowProfile(false);
      setShowPermessiFerie(false);
      setShowOnlineBookings(false);
      setShowTaskManager(false);
      setShowChat(false);
      setShowSearch(false);
    }
  }, []); // Empty dependency array - only run once

  // CONSOLIDATED localStorage management - SINGLE useEffect
  useEffect(() => {
    if (showClients) {
      localStorage.setItem('currentView', 'clients');
    } else if (showDay) {
      localStorage.setItem('currentView', 'day');
    } else if (showImpostazioni) {
      localStorage.setItem('currentView', 'impostazioni');
    }
  }, [showClients, showDay, showImpostazioni]);

  // CONSOLIDATED cleanup effect - SINGLE useEffect
  useEffect(() => {
    return () => {
      // Cleanup function - resetta tutti gli stati quando il componente viene smontato
      setShowEarnings(false);
      setShowReport(false);
      setShowClients(false);
      setShowLoyalty(false);
      setShowMagazzino(false);
      setShowWarehouseDashboard(false);
      setShowImpostazioni(false);
      setShowGestioneServizi(false);
      setShowDay(false);
      setShowMonthly(false);
      setShowWeekly(false);
      setShowProfile(false);
      setShowPermessiFerie(false);
      setShowOnlineBookings(false);
      setShowTaskManager(false);
      setShowChat(false);
      setShowSearch(false);
    };
  }, []); // Empty dependency array - only run once

  // Funzione helper per resettare tutti gli stati
  const resetAllStates = () => {
    setShowEarnings(false);
    setShowReport(false);
    setShowClients(false);
    setShowLoyalty(false);
    setShowMagazzino(false);
    setShowWarehouseDashboard(false);
    setShowImpostazioni(false);
    setShowGestioneServizi(false);
    setShowDay(false);
    setShowMonthly(false);
    setShowWeekly(false);
    setShowProfile(false);
    setShowPermessiFerie(false);
    setShowOnlineBookings(false);
    setShowTaskManager(false);
    setShowChat(false);
    setShowSearch(false);
    setShowSettingsSidebar(false);
  };

  const toggleEarnings = () => {
    resetAllStates();
    setShowEarnings(true);
    notifyPageChange('earnings');
  };

  const toggleReport = () => {
    resetAllStates();
    setShowReport(true);
    notifyPageChange('report');
  };

  // Modifica la funzione toggleClients per mantenere la coerenza
  const toggleClients = () => {
    resetAllStates();
    setShowClients(true);
    localStorage.setItem('currentView', 'clients');
    notifyPageChange('clients');
  };

  const toggleLoyalty = () => {
    resetAllStates();
    setShowLoyalty(true);
    notifyPageChange('loyalty');
  };

  const toggleMagazzino = () => {
    resetAllStates();
    setShowMagazzino(true);
    notifyPageChange('magazzino');
  };

  const toggleWarehouseDashboard = () => {
    resetAllStates();
    setShowWarehouseDashboard(true);
    notifyPageChange('warehouse');
  };

  const toggleImpostazioni = () => {
    resetAllStates();
    setShowSettingsSidebar(true);
    setShowImpostazioni(true);
    localStorage.setItem('currentView', 'impostazioni');
    notifyPageChange('impostazioni');
    
    // Emit event to close other sidebars
    const event = new CustomEvent('settings-sidebar-opened');
    window.dispatchEvent(event);
  };

  const toggleGestioneServizi = () => {
    resetAllStates();
    setShowGestioneServizi(true);
    notifyPageChange('servizi');
  };

  // Modifica la funzione toggleDay per mantenere la coerenza
  const toggleDay = () => {
    resetAllStates();
    setShowDay(true);
    localStorage.setItem('currentView', 'day');
    notifyPageChange('day');
  };

  const toggleMonthly = () => {
    resetAllStates();
    setShowMonthly(true);
    notifyPageChange('monthly');
  };

  const toggleWeekly = () => {
    resetAllStates();
    setShowWeekly(true);
    notifyPageChange('weekly');
  };

  const toggleProfile = () => {
    resetAllStates();
    setShowProfile(true);
    notifyPageChange('profile');
  };

  const togglePermessiFerie = () => {
    resetAllStates();
    setShowPermessiFerie(true);
    notifyPageChange('permessi');
  };

  const toggleOnlineBookings = () => {
    resetAllStates();
    setShowOnlineBookings(true);
    notifyPageChange('bookings');
  };

  const toggleTaskManager = () => {
    resetAllStates();
    setShowTaskManager(true);
    notifyPageChange('tasks');
  };

  const toggleSidebar = async () => {
    const newSidebarState = !showSidebar;
    setShowSidebar(newSidebarState);
    
    // Emit event when sidebar opens/closes
    if (newSidebarState) {
      const event = new CustomEvent('appointments-sidebar-opened');
      window.dispatchEvent(event);
    }
    
    // Save sidebar state to database if we have a team member ID
    if (currentTeamMemberId) {
      const success = await updateTeamMemberSidebarState(currentTeamMemberId, newSidebarState);
      if (!success) {
        console.error('Failed to save sidebar state to database');
      }
    }
  };

  const toggleArchivedAppointments = () => {
    resetAllStates();
    setShowArchivedAppointments(true);
    notifyPageChange('archived');
  };

  const toggleSearch = () => {
    // Salva la vista corrente prima di aprire la ricerca
    if (showDay) setPreviousView('day');
    else if (showWeekly) setPreviousView('weekly');
    else if (showMonthly) setPreviousView('monthly');
    else if (showTaskManager) setPreviousView('task');
    else setPreviousView('day'); // Default fallback
    
    resetAllStates();
    setShowSearch(true);
    notifyPageChange('search');
  };

  // Function to update selected date for sidebar
  const updateSelectedDate = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Inactivity Indicator */}
      <InactivityIndicator 
        isInactive={isInactive} 
        isRefreshing={isRefreshing}
      />
      
      {/* System Health Monitor (RIMOSSO) */}
      
      {/* Nascondi la navbar principale in mobile quando siamo in componenti con MobileNavbar */}
      {(!isMobile || (isMobile && !showClients && !showDay && !showOnlineBookings)) && (
        <Navbar 
          // Funzioni toggle
          toggleEarnings={toggleEarnings} 
          toggleClients={toggleClients} 
          toggleLoyalty={toggleLoyalty} 
          toggleMagazzino={toggleMagazzino} 
          toggleWarehouseDashboard={toggleWarehouseDashboard}
          toggleImpostazioni={toggleImpostazioni}
          toggleServices={toggleGestioneServizi}
          toggleDay={toggleDay}
          toggleMonthly={toggleMonthly}
          toggleWeekly={toggleWeekly}
          toggleProfile={toggleProfile}
          togglePermessiFerie={togglePermessiFerie}
          toggleOnlineBookings={toggleOnlineBookings}
          toggleTaskManager={toggleTaskManager}
          toggleSidebar={toggleSidebar}
          toggleArchivedAppointments={toggleArchivedAppointments}
          toggleSearch={toggleSearch}
          setShowSearch={setShowSearch}
          
          // Stati di visibilità
          showEarnings={showEarnings}
          showClients={showClients}
          showLoyalty={showLoyalty}
          showGestioneServizi={showGestioneServizi}
          showMagazzino={showMagazzino}
          showWarehouseDashboard={showWarehouseDashboard}
          showDay={showDay}
          showMonthly={showMonthly}
          showWeekly={showWeekly}
          showImpostazioni={showImpostazioni}
          showProfile={showProfile}
          showPermessiFerie={showPermessiFerie}
          showOnlineBookings={showOnlineBookings}
          showTaskManager={showTaskManager}
          showSidebar={showSidebar}
          showArchivedAppointments={showArchivedAppointments}
          showSearch={showSearch}
          
          // Permessi
          hasPermission={hasPermission}
          canAccess={canAccess}
          userRole={userRole}
          hideMobileNavbar={isAnyModalOpen}
          updateModalState={updateModalState}
          
          // Task creation modal
          isTaskCreateModalOpen={isTaskCreateModalOpen}
          setIsTaskCreateModalOpen={setIsTaskCreateModalOpen}
        />
      )}
      {/* Render CenterNotification global sidebar */}
      <CenterNotification open={notificationOpen} setOpen={setNotificationOpen} />
      
      {/* Main content with sidebars */}
      <div className={clsx(
        "flex-1 flex overflow-hidden transition-all duration-300",
        isMobile && (showClients || showDay || showOnlineBookings) ? "pt-0" : "pt-16"
      )}>
        {/* Left Sidebar */}
        {showSidebar && hasPermission('canViewAppointments') && (
          <div className="hidden md:flex flex-shrink-0">
            <SidebarPage />
          </div>
        )}
        
        {/* Settings Sidebar */}
        {showSettingsSidebar && canAccess(['canViewSystemSettings', 'isAdmin']) && (
          <div className="hidden md:flex flex-shrink-0">
            <SettingsSidebar
              isOpen={showSettingsSidebar}
              onClose={() => setShowSettingsSidebar(false)}
              onTabChange={setSettingsActiveTab}
              activeTab={settingsActiveTab}
            />
          </div>
        )}
        
        {/* Main content */}
        <div className={clsx(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300 min-w-0",
          showSidebar ? "ml-0" : ""
        )}>
          {/* Show loading state while initializing or permissions are loading */}
          {(isLoading || permissionsLoading) && (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
                </div>
                <p className="text-sm text-gray-500">
                  {isLoading ? "Caricamento..." : "Caricamento permessi..."}
                </p>
              </div>
            </div>
          )}
          
          {/* Show error state */}
          {error && !isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Errore</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  Ricarica pagina
                </button>
              </div>
            </div>
          )}
          
          {!isLoading && !permissionsLoading && !error && (
            <>
              {showProfile && (
                <div className="flex-1 overflow-auto">
                  <Profilo />
                </div>
              )}
              {showDay && hasPermission('canViewAppointments') && (
                <div className={clsx(
                  "flex-1 overflow-hidden",
                  isMobile ? "fixed inset-0 z-50 bg-white" : ""
                )}>
                  <DayCalendar 
                    hasPermission={hasPermission}
                    userRole={userRole}
                    // Pass toggle functions for mobile navbar
                    toggleDay={toggleDay}
                    toggleClients={toggleClients}
                    toggleServices={toggleGestioneServizi}
                    togglePermessiFerie={togglePermessiFerie}
                    toggleOnlineBookings={toggleOnlineBookings}
                    toggleTaskManager={toggleTaskManager}
                    toggleImpostazioni={toggleImpostazioni}
                    // Pass visibility states for mobile navbar
                    showDay={showDay}
                    showClients={showClients}
                    showGestioneServizi={showGestioneServizi}
                    showPermessiFerie={showPermessiFerie}
                    showOnlineBookings={showOnlineBookings}
                    showTaskManager={showTaskManager}
                    showImpostazioni={showImpostazioni}
                  />
                </div>
              )}
              {showWeekly && hasPermission('canViewAppointments') && (
                <div className="flex-1 overflow-auto">
                  <WeeklyCalendar 
                    hasPermission={hasPermission}
                    userRole={userRole}
                  />
                </div>
              )}
              {showMonthly && hasPermission('canViewAppointments') && (
                <div className="flex-1 overflow-auto">
                  <MonthlyCalendar
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    selectedTeamMemberIds={selectedTeamMemberIds}
                    hasPermission={hasPermission}
                    canAccess={canAccess}
                  />
                </div>
              )}
              {showEarnings && hasPermission('canViewFinance') && (
                <div className="flex-1 overflow-auto">
                  <IncassiGiornalieri />
                </div>
              )}
              {showClients && hasPermission('canViewClients') && (
                <div className="flex-1 overflow-auto">
                  {isMobile ? (
                    <AnagraficaClientiMobile 
                      hasPermission={hasPermission}
                      userRole={userRole}
                      // Pass toggle functions for mobile navbar
                      toggleDay={toggleDay}
                      toggleClients={toggleClients}
                      toggleServices={toggleGestioneServizi}
                      togglePermessiFerie={togglePermessiFerie}
                      toggleOnlineBookings={toggleOnlineBookings}
                      toggleTaskManager={toggleTaskManager}
                      toggleImpostazioni={toggleImpostazioni}
                      // Pass visibility states for mobile navbar
                      showDay={showDay}
                      showClients={showClients}
                      showGestioneServizi={showGestioneServizi}
                      showPermessiFerie={showPermessiFerie}
                      showOnlineBookings={showOnlineBookings}
                      showTaskManager={showTaskManager}
                      showImpostazioni={showImpostazioni}
                    />
                  ) : (
                    <AnagraficaClienti />
                  )}
                </div>
              )}
              {showLoyalty && hasPermission('canViewClients') && (
                <div className="flex-1 overflow-auto">
                  <LoyaltyCoupons />
                </div>
              )}
              {showMagazzino && hasPermission('canViewInventory') && (
                <div className="flex-1 overflow-auto">
                  <GestioneMagazzino />
                </div>
              )}
              {showWarehouseDashboard && hasPermission('canViewInventory') && (
                <div className="flex-1 overflow-auto">
                  <WarehouseDashboard />
                </div>
              )}
              {showImpostazioni && canAccess(['canViewSystemSettings', 'isAdmin']) && (
                <div className="flex-1 overflow-auto">
                  <ImpostazioniAvanzate 
                    activeTab={settingsActiveTab}
                    onTabChange={setSettingsActiveTab}
                  />
                </div>
              )}
              {showGestioneServizi && hasPermission('canViewServices') && (
                <div className="flex-1 overflow-auto">
                  <GestioneServizi />
                </div>
              )}
              {showPermessiFerie && hasPermission('canViewAppointments') && (
                <div className="flex-1 overflow-auto">
                  <PermessiFeriePage />
                </div>
              )}
              {showOnlineBookings && hasPermission('canViewAppointments') && (
                <div className="flex-1 overflow-auto">
                  <OnlineBookingsPage 
                    // Pass toggle functions for mobile navbar
                    toggleDay={toggleDay}
                    toggleClients={toggleClients}
                    toggleOnlineBookings={toggleOnlineBookings}
                    // Pass visibility states for mobile navbar
                    showDay={showDay}
                    showClients={showClients}
                    showOnlineBookings={showOnlineBookings}
                  />
                </div>
              )}
              {showTaskManager && hasPermission('canViewAppointments') && (
                <div className="flex-1 overflow-auto">
                  <TaskManager 
                    params={{}} 
                    searchParams={{}} 
                  />
                </div>
              )}
              {showSearch && (
                <div className="flex-1 overflow-hidden">
                  <SearchModal onClose={() => {
                    setShowSearch(false);
                    // Torna alla vista precedente
                    switch (previousView) {
                      case 'weekly':
                        setShowWeekly(true);
                        break;
                      case 'monthly':
                        setShowMonthly(true);
                        break;
                      case 'task':
                        setShowTaskManager(true);
                        break;
                      default:
                        setShowDay(true);
                        break;
                    }
                  }} />
                </div>
              )}
              
              {/* Message when user doesn't have permission */}
              {showEarnings && !hasPermission('canViewFinance') && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare questa sezione.</p>
                  </div>
                </div>
              )}
              {showClients && !hasPermission('canViewClients') && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare l'anagrafica clienti.</p>
                  </div>
                </div>
              )}
              {showLoyalty && !hasPermission('canViewClients') && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare il sistema fedeltà.</p>
                  </div>
                </div>
              )}
              {(showMagazzino || showWarehouseDashboard) && !hasPermission('canViewInventory') && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare il magazzino.</p>
                  </div>
                </div>
              )}
              {showImpostazioni && !canAccess(['canViewSystemSettings', 'isAdmin']) && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare le impostazioni.</p>
                  </div>
                </div>
              )}
              {showGestioneServizi && !hasPermission('canViewServices') && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare la gestione servizi.</p>
                  </div>
                </div>
              )}
              {showPermessiFerie && !hasPermission('canViewAppointments') && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare i permessi e ferie.</p>
                  </div>
                </div>
              )}
              {showOnlineBookings && !hasPermission('canViewAppointments') && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare le prenotazioni online.</p>
                  </div>
                </div>
              )}
              {(showDay || showWeekly || showMonthly) && !hasPermission('canViewAppointments') && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accesso Negato</h3>
                    <p className="text-gray-500">Non hai i permessi per visualizzare il calendario appuntamenti.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Chat Modal */}
        {showChatModal && hasPermission('canViewAppointments') && (
          <ChatGroupsModal 
            open={showChatModal} 
            onOpenChange={setShowChatModal} 
          />
        )}

        {/* Global Task Create Modal */}
        <TaskCreateModal 
          isOpen={isTaskCreateModalOpen}
          onClose={() => {
            setIsTaskCreateModalOpen(false);
            updateModalState(false);
          }}
        />
      </div>
     
    
    </div>
  );
}
