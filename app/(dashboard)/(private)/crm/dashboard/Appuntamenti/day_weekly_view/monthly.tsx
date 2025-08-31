import React, { useState, useEffect, useRef } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CalendarIcon, X } from "lucide-react";
// Dropdown state for cell click
type CellClickDropdown = {
  isOpen: boolean;
  day: Date;
  x: number;
  y: number;
};
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, subMonths, addMonths } from "date-fns";
import { it } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight, FaTrash } from "react-icons/fa";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { createClient } from "@/utils/supabase/client";
import { getSalonId, canEditAppointment } from '@/utils/getSalonId';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


import { Clock, Plus } from 'lucide-react';
import { StatoCardMonthly } from "./StatoCardMonthly";
import { CreateOrder } from '../../_CreateOrder/CreateOrder';
import CreatePausaForm from '../../_CreateOrder/pausa';
import { listenForAppointmentEvents, APPOINTMENT_EVENTS } from "../../utils/appointmentEvents";
import { setupAppointmentsSubscription, setupDeletedAppointmentsSubscription } from "../../query/query";
import NavbarSecondaria from "./navbar_secondaria_monthly";
import { EditServicesModal } from "../../_CreateOrder/modaleditcard";
import { TaskEditModal } from "./TaskEditModal";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";

const supabase = createClient();

// OTTIMIZZAZIONE: Lazy Avatar Component
const LazyAvatar = React.memo(({ member, className }: { member: TeamMember; className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Use useCallback to prevent infinite re-renders
  const handleLoad = React.useCallback(() => {
    setIsLoaded(true);
  }, []);
  
  const handleError = React.useCallback(() => {
    setError(true);
  }, []);
  
  // Reset states when member changes
  React.useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [member.avatar_url]);
  
  return (
    <Avatar className={className}>
      {member.avatar_url && !error ? (
        <AvatarImage 
          src={member.avatar_url} 
          alt={member.name}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        />
      ) : null}
      <AvatarFallback 
        style={{ 
          opacity: (!member.avatar_url || error || !isLoaded) ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        {member.name.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
});

const daysOfWeek = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

interface MonthlyCalendarProps {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  selectedTeamMemberIds: string[];
  hasPermission: (permissionKey: string) => boolean;
  canAccess: (requiredPermissions: string[]) => boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  colorMember: string;
  order_column: number;
  avatar_url?: string;
  visible_users: boolean;
}

// Add helper function for contrast color
function getContrastColor(hexColor: string): string {
  if (!hexColor.startsWith("#") || hexColor.length < 7) return "#000";
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#FFFFFF";
}

// Funzione per calcolare lo stile di background della card appuntamento (moderna come day.tsx e weekly.tsx)
function getAppointmentCardStyle(appointment: any): React.CSSProperties {
  // Debug: log dei colori
  console.log('Monthly - Appointment color_card:', appointment.color_card, 'for appointment:', appointment.id);
  
  // Supporta sia stringa che array (ma sempre array da Supabase)
  let colors: string[] = [];
  if (Array.isArray(appointment.color_card)) {
    colors = appointment.color_card.filter((c: any) => typeof c === 'string' && c.startsWith('#'));
  } else if (typeof appointment.color_card === 'string') {
    try {
      // Prova a fare il parse se è una stringa tipo '["#FFB5E2"]'
      const parsed = JSON.parse(appointment.color_card);
      if (Array.isArray(parsed)) {
        colors = parsed.filter((c: any) => typeof c === 'string' && c.startsWith('#'));
      }
    } catch {
      if (appointment.color_card.startsWith('#')) colors = [appointment.color_card];
    }
  }
  
  console.log('Monthly - Parsed colors:', colors, 'for appointment:', appointment.id);
  
  const style = appointment.prefer_card_style || 'filled';
  // Alone luminoso
  const alone = appointment.alone || '';
  let boxShadow = undefined;
  if (alone && alone !== '' && colors.length > 0) {
    const alonePx = parseInt(String(alone)); // Più ampio per effetto luminoso
    // Glow luminoso: spread e blur, più trasparente
    boxShadow = `0 0 ${alonePx * 2}px ${alonePx}px ${colors[0]}, 0 0 ${alonePx * 3}px ${alonePx * 2}px ${colors[0]}55, 0 0 ${alonePx * 4}px ${alonePx * 3}px ${colors[0]}33`;
  }
  if (colors.length === 0) {
    console.log('Monthly - No colors found, returning white background for appointment:', appointment.id);
    return { background: '#fff', boxShadow };
  }
  if (style === 'filled') {
    if (colors.length === 2) {
      console.log('Monthly - Applying gradient background:', colors, 'for appointment:', appointment.id);
      return { background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`, boxShadow };
    } else {
      console.log('Monthly - Applying solid background:', colors[0], 'for appointment:', appointment.id);
      return { background: colors[0], boxShadow };
    }
  }
  if (style === 'top' || style === 'bottom' || style === 'left' || style === 'right') {
    return {
      background: '#fff', // Sempre bianco per gli stili bar
      boxShadow
    };
  }
  // fallback
  return { background: '#fff', boxShadow };
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ 
  currentDate, 
  setCurrentDate,
  selectedTeamMemberIds,
  hasPermission,
  canAccess
}) => {
  const supabase = createClient();
  // Dropdown per click su cella vuota
  const [cellClickDropdown, setCellClickDropdown] = useState<CellClickDropdown | null>(null);
  // Funzione per creare appuntamento dal dropdown
  const handleCreateAppointment = () => {
    if (!cellClickDropdown) return;
    const selectedDate = format(cellClickDropdown.day, "yyyy-MM-dd");
    // Default orario: 10:00-10:30
    setInitialFormData({
      data: selectedDate,
      orarioInizio: "10:00",
      orarioFine: "10:30",
      // team_id opzionale, monthly non ha membro selezionato
    });
    setIsCreateOrderOpen(true);
    setCellClickDropdown(null);
  };

  // Funzione per creare pausa dal dropdown
  const [isCreatePausaOpen, setIsCreatePausaOpen] = useState(false);
  const handleCreatePausa = () => {
    if (!cellClickDropdown) return;
    const selectedDate = format(cellClickDropdown.day, "yyyy-MM-dd");
    setInitialFormData({
      data: selectedDate,
      orarioInizio: "10:00",
      orarioFine: "10:30",
    });
    setIsCreatePausaOpen(true);
    setCellClickDropdown(null);
  };
  const todayCellRef = useRef<HTMLDivElement>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedAppointmentForDialog, setSelectedAppointmentForDialog] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isEditServicesOpen, setIsEditServicesOpen] = useState(false);
  const [isTaskEditModalOpen, setIsTaskEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [dragPreview, setDragPreview] = useState<{ time: Date; date: Date } | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<any>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'agenda'>('agenda');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // States for day appointments modal
  const [isDayAppointmentsModalOpen, setIsDayAppointmentsModalOpen] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<Date | null>(null);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<any[]>([]);
  
  // States for navbar
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [startMemberIndex, setStartMemberIndex] = useState(0);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSettingCalendarOpen, setIsSettingCalendarOpen] = useState(false);
  const [hourHeight, setHourHeight] = useState(200);
  
  // Real-time subscription refs
  const appointmentsSubscriptionRef = useRef<any>(null);
  const deletedAppointmentsSubscriptionRef = useRef<any>(null);
  
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<(string | null)[]>([]);
  const [showDeletedAppointments, setShowDeletedAppointments] = useState(false);
  const [daysToShow, setDaysToShow] = useState(7); // Aggiungi stato per giorni da mostrare
  
  // Responsive behavior for agenda
  const isLargeScreen = useMediaQuery("(min-width: 1400px)");
const isMobile = useMediaQuery("(max-width: 768px)");
  const [showAgenda, setShowAgenda] = useState(true);
  
  // Auto-hide agenda when screen is below 1400px
  useEffect(() => {
    setShowAgenda(isLargeScreen);
  }, [isLargeScreen]);

  const startMonth = startOfMonth(currentDate);
  const endMonth = endOfMonth(currentDate);
  const startGrid = startOfWeek(startMonth, { weekStartsOn: 1 });
  const endGrid = endOfWeek(endMonth, { weekStartsOn: 1 });

  const days = [];
  let day = startGrid;
  while (day <= endGrid) {
    days.push(day);
    day = addDays(day, 1);
  }

  const fetchAppointments = async (userParam = user, forceRefresh = false) => {
    console.log('Fetching appointments for monthly view...');
    
    // Set fetching flag to prevent real-time updates during fetch
    if (appointmentsSubscriptionRef.current?.setFetching) {
      appointmentsSubscriptionRef.current.setFetching(true);
    }
    

    
    try {
      const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");

      let query = supabase
      .from("orders")
      .select(`
        *,
        team:team_id (
          id,
          name,
          ColorMember
        )
      `)
      .gte("data", startDate)
      .lte("data", endDate);

    // Get salon_id for filtering shared appointments
    const salonId = await getSalonId();
    if (salonId) {
      query = query.eq('salon_id', salonId);
    } else {
      console.error("No salon_id found, cannot load appointments");
      return;
    }

    // Applica filtri team members
    if (!showAll && selectedMembers.length > 0) {
      query = query.in('team_id', selectedMembers);
    }

    const { data: orders, error } = await query.order('orarioInizio', { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      return;
    }

    // Fetch associated services for each order
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

        return {
          ...order,
          services: services || []
        };
      })
    );

    console.log('Setting appointments state with fetched data for monthly view');
    setAppointments(appointmentsWithServices);
    
    // Salva in cache globale solo se i dati sono validi

  } catch (error) {
    console.error("Unexpected error in fetchAppointments:", error);
  } finally {
    // Reset fetching flag
    if (appointmentsSubscriptionRef.current?.setFetching) {
      appointmentsSubscriptionRef.current.setFetching(false);
    }
  }
};

  const fetchTeamMembers = async () => {
    setIsLoadingTeam(true);
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
        setIsLoadingTeam(false);
        return;
      }

      // Get salon_id using global utility function
      const salonId = await getSalonId();
      if (!salonId) {
        console.error("Nessun salon_id trovato per l'utente");
        setIsLoadingTeam(false);
        return;
      }

      // Recupera i membri del salon specifico invece di tutti
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .eq("salon_id", salonId)
        .order("order_column", { ascending: true });

      if (error) {
        console.error("Team fetch error:", error);
        setIsLoadingTeam(false);
        return;
      }

      if (data) {
        const formattedMembers = data.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          phone_number: member.phone_number,
          colorMember: member.ColorMember,
          order_column: member.order_column,
          avatar_url: member.avatar_url,
          visible_users: member.visible_users
        }));
        
        setTeamMembers(formattedMembers);
        
        // Filtra e imposta gli ID dei membri visibili per default
        const visibleMemberIds = formattedMembers
          .filter(member => member.visible_users)
          .map(member => member.id);
        
        setSelectedMembers(visibleMemberIds);
      }
    } catch (err) {
      console.error("Unexpected error in fetchTeamMembers:", err);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  // Carica user una sola volta all'avvio
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Carica i filtri salvati dal localStorage con ID utente
      if (user) {
        try {
          const statusFiltersKey = `statusFilters_${user.id}`;
          const showDeletedKey = `showDeletedAppointments_${user.id}`;
          
          const savedStatusFilters = localStorage.getItem(statusFiltersKey);
          const savedShowDeleted = localStorage.getItem(showDeletedKey);
          
          if (savedStatusFilters) {
            const parsedFilters = JSON.parse(savedStatusFilters);
            if (Array.isArray(parsedFilters)) {
              setSelectedStatusFilters(parsedFilters);
            }
          }
          if (savedShowDeleted) {
            const parsedShowDeleted = JSON.parse(savedShowDeleted);
            if (typeof parsedShowDeleted === 'boolean') {
              setShowDeletedAppointments(parsedShowDeleted);
            }
          }
        } catch (error) {
          console.error('Errore nel caricamento dei filtri dal localStorage:', error);
        }
      }
    };
    loadUser();
    fetchTeamMembers();
  }, []);

  // Carica il numero di giorni salvato dal database
  useEffect(() => {
    const loadDaysToShow = async () => {
      if (!user) return;

      try {
        const salonId = await getSalonId();
        if (!salonId) return;

        const { data, error } = await supabase
          .from("team")
          .select("rowmonthly")
          .eq("salon_id", salonId)
          .limit(1)
          .single();

        if (error) {
          console.error("Errore nel caricare il numero di giorni:", error);
          return;
        }

        if (data?.rowmonthly && data.rowmonthly >= 1 && data.rowmonthly <= 7) {
          setDaysToShow(data.rowmonthly);
        }
      } catch (error) {
        console.error("Errore nel caricare il numero di giorni:", error);
      }
    };

    loadDaysToShow();
  }, [user]);

  // Update filtered members when teamMembers changes
  useEffect(() => {
    setFilteredMembers(teamMembers.filter(member => member.visible_users));
  }, [teamMembers]);

  useEffect(() => {
    if (!user) return;
    // Usa sempre lo stato aggiornato
    fetchAppointments(user, false);

    // Setup real-time subscriptions using the advanced functions
    const appointmentsSub = setupAppointmentsSubscription(setAppointments);
    if (appointmentsSub) {
      appointmentsSubscriptionRef.current = appointmentsSub;
    }

    // Setup deleted appointments subscription
    const deletedAppointmentsSub = setupDeletedAppointmentsSubscription(() => {
      // Monthly view doesn't have checkDeletedOrders function, so we'll just refresh
      fetchAppointments(user, true);
    });
    if (deletedAppointmentsSub) {
      deletedAppointmentsSubscriptionRef.current = deletedAppointmentsSub;
    }

    // Listen for appointment creation events from navbar
    const removeEventListener = listenForAppointmentEvents(
      APPOINTMENT_EVENTS.CREATED,
      () => {
        console.log('Appointment created event received in monthly view, refreshing appointments...');
        fetchAppointments(user, true);
      }
    );

    // Listen for custom appointment created event
    const handleAppointmentCreated = () => {
      console.log('Custom appointment created event received in monthly view, refreshing appointments...');
      fetchAppointments(user, true); // Force refresh
    };

    window.addEventListener('appointment-created', handleAppointmentCreated);

    return () => {
      if (appointmentsSubscriptionRef.current) {
        appointmentsSubscriptionRef.current.unsubscribe();
        appointmentsSubscriptionRef.current = null;
      }
      if (deletedAppointmentsSubscriptionRef.current) {
        deletedAppointmentsSubscriptionRef.current.unsubscribe();
        deletedAppointmentsSubscriptionRef.current = null;
      }
      removeEventListener();
      window.removeEventListener('appointment-created', handleAppointmentCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, selectedMembers, showAll, selectedStatusFilters, showDeletedAppointments, user]);

  // Forza il refetch degli appuntamenti quando currentDate cambia
  useEffect(() => {
    if (!user) return;
    fetchAppointments(user, false);
  }, [currentDate, user, selectedMembers, showAll, selectedStatusFilters, showDeletedAppointments]);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getMiniCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days = [];
    let day = start;
    
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const handleMemberSelection = async (memberId: string) => {
    setShowAll(false);
    const updatedMembers = selectedMembers.includes(memberId)
      ? selectedMembers.filter(id => id !== memberId)
      : [...selectedMembers, memberId];
    
    setSelectedMembers(updatedMembers);
  };

  const handleAllSelection = async () => {
    setShowAll(prev => !prev);
    if (!showAll) {
      setSelectedMembers([]);
    }
  };

  const scrollToToday = () => {
    setCurrentDate(new Date());
    setTimeout(() => {
      if (todayCellRef.current) {
        todayCellRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  // Helper functions for navbar
  const slidePrev = () => {
    setStartMemberIndex(Math.max(0, startMemberIndex - 1));
  };

  const slideNext = () => {
    setStartMemberIndex(Math.min(filteredMembers.length - 4, startMemberIndex + 1));
  };

  const handleToggleMember = async (memberId: string) => {
    // Quando si seleziona un membro, disabilita showAll
    setShowAll(false);
    
    // Toggle member selection logic
    const updatedMembers = selectedMembers.includes(memberId)
      ? selectedMembers.filter(id => id !== memberId)
      : [...selectedMembers, memberId];
    
    setSelectedMembers(updatedMembers);
  };

  const handleToggleShowAll = async () => {
    setShowAll(true);
    setSelectedMembers([]);
  };
  
  // Salva i filtri di stato nel localStorage con ID utente
  useEffect(() => {
    const saveFilters = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        const key = userId ? `statusFilters_${userId}` : 'statusFilters';
        localStorage.setItem(key, JSON.stringify(selectedStatusFilters));
      } catch (error) {
        console.error('Errore nel salvare i filtri di stato:', error);
      }
    };
    saveFilters();
  }, [selectedStatusFilters]);

  // Salva lo stato showDeletedAppointments nel localStorage con ID utente
  useEffect(() => {
    const saveDeletedState = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        const key = userId ? `showDeletedAppointments_${userId}` : 'showDeletedAppointments';
        localStorage.setItem(key, JSON.stringify(showDeletedAppointments));
      } catch (error) {
        console.error('Errore nel salvare lo stato showDeletedAppointments:', error);
      }
    };
    saveDeletedState();
  }, [showDeletedAppointments]);

  const handleGroupChange = (groupId: string | null) => {
    setSelectedGroupId(groupId);
  };

  const onHourHeightChange = (height: number) => {
    setHourHeight(height);
  };

  // Funzione per gestire il click sulla card
  const handleCardClick = (appointment: any, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // Non aprire il modal se è una pausa
    if (appointment.status === 'Pausa') {
      return;
    }

    // Se l'appuntamento è un task, apri il modal di modifica task
    if (appointment.task) {
      setSelectedTask(appointment);
      setIsTaskEditModalOpen(true);
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

  // Funzione per salvare i servizi modificati
  const handleSaveServices = async (
    services: { id: string; name: string; price: number }[], 
    updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string }
  ) => {
    if (!selectedAppointment) return;
    
    const originalServices = selectedAppointment.services || [];
    
    // Update local state immediately for services, date and times
    setAppointments(prev => prev.map(app =>
      app.id === selectedAppointment.id ? { 
        ...app, 
        services,
        ...(updatedData && updatedData) // Aggiorna anche data e orari se forniti
      } : app
    ));
    
    // Update selectedAppointment state as well
    if (updatedData) {
      setSelectedAppointment((prev: any) => prev ? { ...prev, ...updatedData } : prev);
    }
    
    try {
      // Aggiorna data e orari se sono stati modificati
      if (updatedData && Object.keys(updatedData).length > 0) {
        const { error: updateError } = await supabase
          .from('orders')
          .update(updatedData)
          .eq('id', selectedAppointment.id);
          
        if (updateError) {
          throw updateError;
        }
      }
      
      // Handle new services (those with temp_ prefix) and existing services
      const newServices = services.filter(s => s.id.startsWith('temp_'));
      const existingServices = services.filter(s => !s.id.startsWith('temp_'));
      
      // Insert new services
      if (newServices.length > 0) {
        const newServiceInserts = newServices.map(service => ({
          order_id: selectedAppointment.id,
          service_id: Number(service.id.replace('temp_', '')),
          servizio: service.name,
          price: service.price
        }));
        
        const { error: insertError } = await supabase
          .from('order_services')
          .insert(newServiceInserts);
          
        if (insertError) {
          throw insertError;
        }
      }
      
      // Update existing services
      for (const service of existingServices) {
        const { error: updateError } = await supabase
          .from('order_services')
          .update({
            servizio: service.name,
            price: service.price
          })
          .eq('order_id', selectedAppointment.id)
          .eq('service_id', Number(service.id));
          
        if (updateError) {
          throw updateError;
        }
      }
      
      // Delete services that were removed (exist in original but not in new)
      const removedServices = originalServices.filter(
        (original: any) => !services.find(s => s.id === original.id)
      );
      
      if (removedServices.length > 0) {
        const { error: deleteError } = await supabase
          .from('order_services')
          .delete()
          .eq('order_id', selectedAppointment.id)
          .in('service_id', removedServices.map((s: any) => Number(s.id)));
          
        if (deleteError) {
          throw deleteError;
        }
      }
      
      // Fetch updated services from database to get correct IDs
      fetchAppointments(user, true);
      
      toast({
        title: "Dati aggiornati",
        description: updatedData 
          ? "I servizi e i dati dell'appuntamento sono stati salvati con successo" 
          : "I servizi sono stati salvati con successo",
      });
      
    } catch (error) {
      console.error('Error updating services:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio dei servizi",
        variant: "destructive",
      });
      
      // Revert local state on error
      setAppointments(prev => prev.map(app =>
        app.id === selectedAppointment.id ? selectedAppointment : app
      ));
    }
  };

  // Funzione per eliminare un singolo servizio
  const handleDeleteService = async (serviceId: string, orderId: string) => {
    if (!selectedAppointment) return;
    
    // Update local state immediately - remove the service
    setAppointments(prev => prev.map(app => {
      if (app.id === selectedAppointment.id) {
        const updatedServices = app.services?.filter((service: any) => service.id !== serviceId) || [];
        return { ...app, services: updatedServices };
      }
      return app;
    }));

    // Update selectedAppointment as well to keep modal in sync
    setSelectedAppointment((prev: any) => {
      if (!prev) return prev;
      const updatedServices = prev.services?.filter((service: any) => service.id !== serviceId) || [];
      return { ...prev, services: updatedServices };
    });
    
    // Delete service from order_services table using order_id and service_id
    try {
      // Handle both temp_ prefixed services and existing services
      const actualServiceId = serviceId.startsWith('temp_') ? serviceId.replace('temp_', '') : serviceId;
      
      const { error } = await supabase
        .from('order_services')
        .delete()
        .eq('order_id', orderId)
        .eq('service_id', Number(actualServiceId));
      
      if (error) {
        console.error('Error deleting service:', error);
        toast({
          title: "Errore",
          description: "Impossibile eliminare il servizio. Riprova.",
          variant: "destructive",
        });
        
        // Revert local state on error
        setAppointments(prev => prev.map(app =>
          app.id === selectedAppointment.id ? selectedAppointment : app
        ));
        setSelectedAppointment(selectedAppointment);
        return;
      }

      toast({
        title: "Servizio eliminato",
        description: "Il servizio è stato eliminato con successo",
      });
      
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del servizio",
        variant: "destructive",
      });
      
      // Revert local state on error
      setAppointments(prev => prev.map(app =>
        app.id === selectedAppointment.id ? selectedAppointment : app
      ));
      setSelectedAppointment(selectedAppointment);
    }
  };

  // Function to handle trash icon click for pause appointments
  const handlePauseDelete = async (appointment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Eliminato' })
        .eq('id', appointment.id);

      if (error) {
        console.error('Error deleting pause:', error);
        toast({
          title: "Errore",
          description: "Impossibile eliminare la pausa.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Successo",
          description: "Pausa eliminata con successo.",
        });
        fetchAppointments(user, true);
      }
    } catch (error) {
      console.error('Error deleting pause:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la pausa.",
        variant: "destructive",
      });
    }
  };

  // Function to handle clicking on the notification dot
  const handleNotificationDotClick = (day: Date, dayAppointments: any[]) => {
    setSelectedDayForModal(day);
    setSelectedDayAppointments(dayAppointments);
    setIsDayAppointmentsModalOpen(true);
  };

  // Funzioni per il drag and drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, appointment: any) => {
    if (appointment.status === 'pagato' || appointment.status === 'Eliminato') {
      e.preventDefault();
      return;
    }

    // Controlla i permessi per modificare l'appuntamento
    if (hasPermission) {
      canEditAppointment(appointment.team_id, hasPermission || (() => false)).then(canEdit => {
        if (!canEdit) {
          e.preventDefault(); // Prevent drag if user cannot edit the appointment
          return;
        }
      });
    }
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    e.dataTransfer.setData("appointmentId", appointment.id);
    setDraggedAppointment(appointment);

    // Cleanup quando il drag termina
    const handleDragEnd = () => {
      setDragPreview(null);
      setDraggedAppointment(null);
    };

    // Aggiungi listener per drag end
    document.addEventListener('dragend', handleDragEnd, { once: true });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const fractionOfDay = offsetY / rect.height;
    const hours = Math.floor(fractionOfDay * 24);
    const minutes = Math.floor((fractionOfDay * 24 - hours) * 60);
    
    // Snap to 15-minute intervals
    const snappedMinutes = Math.round(minutes / 15) * 15;
    const newTime = new Date(day);
    newTime.setHours(hours, snappedMinutes, 0, 0);

    setDragPreview({ time: newTime, date: day });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget as Element;
    const isLeavingCalendar = relatedTarget && !relatedTarget.closest('.calendar-day');
    
    if (isLeavingCalendar) {
      setDragPreview(null);
    }
  };

  // Cleanup globale per il drag
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDragPreview(null);
      setDraggedAppointment(null);
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, day: Date) => {
    e.preventDefault();
    e.stopPropagation();
    
    const appointmentId = e.dataTransfer.getData("appointmentId");
    if (!appointmentId || !draggedAppointment) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const fractionOfDay = offsetY / rect.height;
    const hours = Math.floor(fractionOfDay * 24);
    const minutes = Math.floor((fractionOfDay * 24 - hours) * 60);
    
    // Snap to 15-minute intervals
    const snappedMinutes = Math.round(minutes / 15) * 15;
    const newTime = new Date(day);
    newTime.setHours(hours, snappedMinutes, 0, 0);

    // Calcola la durata originale
    const originalStart = new Date(`${draggedAppointment.data}T${draggedAppointment.orarioInizio}`);
    const originalEnd = new Date(`${draggedAppointment.data}T${draggedAppointment.orarioFine}`);
    const durationMinutes = (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60);

    // Calcola il nuovo orario di fine
    const newEndTime = new Date(newTime.getTime() + durationMinutes * 60 * 1000);
    
    const newStartTimeStr = newTime.toTimeString().slice(0, 5);
    const newEndTimeStr = newEndTime.toTimeString().slice(0, 5);
    const newDateStr = format(day, "yyyy-MM-dd");

    // Aggiorna immediatamente lo stato locale
    const updatedAppointment = {
      ...draggedAppointment,
      data: newDateStr,
      orarioInizio: newStartTimeStr,
      orarioFine: newEndTimeStr,
    };

    setAppointments(prev => 
      prev.map(app => 
        app.id === appointmentId ? updatedAppointment : app
      )
    );

    // Pulisci il drag preview
    setDragPreview(null);
    setDraggedAppointment(null);

    // Aggiorna il database in background
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          data: newDateStr,
          orarioInizio: newStartTimeStr,
          orarioFine: newEndTimeStr,
        })
        .eq("id", appointmentId);

      if (error) {
        console.error("Errore nell'aggiornamento:", error.message);
        // In caso di errore, ripristina lo stato precedente
        setAppointments(prev => 
          prev.map(app => 
            app.id === appointmentId ? draggedAppointment : app
          )
        );
        toast({
          title: "Errore",
          description: "Impossibile spostare l'appuntamento",
          variant: "destructive",
        });
      } else {
        // Cache system removed - no longer needed
        
        toast({
          title: "Appuntamento spostato",
          description: "L'appuntamento è stato spostato con successo",
        });
      }
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      // In caso di errore, ripristina lo stato precedente
      setAppointments(prev => 
        prev.map(app => 
          app.id === appointmentId ? draggedAppointment : app
        )
      );
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  // Calculate filtered members and navigation states
  const hasMoreLeft = startMemberIndex > 0;
  const hasMoreRight = startMemberIndex + 4 < filteredMembers.length;
  const groupFilteredMembers = teamMembers;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <NavbarSecondaria
        dailyViewDate={currentDate}
        setDailyViewDate={setCurrentDate}
        filteredMembers={filteredMembers}
        startMemberIndex={startMemberIndex}
        hasMoreLeft={hasMoreLeft}
        hasMoreRight={hasMoreRight}
        slidePrev={slidePrev}
        slideNext={slideNext}
        showMemberDropdown={showMemberDropdown}
        setShowMemberDropdown={setShowMemberDropdown}
        groups={groups}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        handleGroupChange={handleGroupChange}
        groupFilteredMembers={groupFilteredMembers}
        selectedTeamMemberIds={selectedMembers}
        handleToggleMember={handleToggleMember}
        setIsSettingCalendarOpen={setIsSettingCalendarOpen}
        hourHeight={hourHeight}
        onHourHeightChange={onHourHeightChange}
        teamMembers={teamMembers}
        appointments={appointments}
        selectedStatusFilters={selectedStatusFilters}
        setSelectedStatusFilters={setSelectedStatusFilters}
        showDeletedAppointments={showDeletedAppointments}
        setShowDeletedAppointments={setShowDeletedAppointments}
        daysToShow={daysToShow}
        setDaysToShow={setDaysToShow}
      />
      <div className="flex flex-1 overflow-hidden">
        {showAgenda && (
          <div className="w-80 border-r bg-gray-50 flex flex-col max-[127.625px]:hidden">
          <div className="h-[52px] flex items-center border-b px-2"> {/* Modified for consistent height */}
            <div className="flex space-x-2 w-full">
              <button
                onClick={() => setActiveView('agenda')}
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'agenda'
                    ? 'bg-violet-100 text-violet-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>

        {/* Solo la sezione agenda, rimosso il tab "membri" */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 border-b"> {/* Changed from p-4 */}
            <div className="flex items-center justify-between mb-2"> {/* Changed from mb-3 */}
              <input
                type="text"
                placeholder="Cerca appuntamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" /* Modified padding and text size */
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="ml-2 p-1 text-xs text-gray-500 hover:text-gray-700" /* Adjusted padding and text size */
                >
                  ✕
                </button>
              )}
            </div>
            {selectedDate && (
              <div className="text-xs text-gray-600"> {/* Changed from text-sm */}
                Visualizzazione: {format(selectedDate, "d MMMM yyyy", { locale: it })}
              </div>
            )}
          </div>
          {isLoadingTeam ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
              </div>
              <p className="mt-4 text-sm text-gray-500">Caricamento configurazione calendario...</p>
            </div>
          ) : (
            <div className="divide-y" style={{ fontSize: `${Math.max(11, Math.round(hourHeight / 16))}px`, transition: 'font-size 0.2s' }}>
              {appointments
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                .filter(appointment => {
                  const appointmentDate = new Date(appointment.data);
                  const matchesSearch = appointment.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    appointment.note?.toLowerCase().includes(searchTerm.toLowerCase());
                  // Se selectedDate è null, mostra tutti gli appuntamenti del mese
                  const matchesDate = selectedDate
                    ? isSameDay(appointmentDate, selectedDate)
                    : (appointmentDate >= startOfMonth(currentDate) && appointmentDate <= endOfMonth(currentDate));
                  const matchesTeamMember = showAll || selectedMembers.includes(appointment.team_id);
                  let matchesStatus = true;
                  if (selectedStatusFilters.length > 0) {
                    matchesStatus = selectedStatusFilters.some(filter => {
                      if (filter === null || filter === '') {
                        return !appointment.status || appointment.status === '' || appointment.status === null;
                      }
                      if (filter === 'deleted') {
                        return appointment.status === 'Eliminato' || appointment.status === 'deleted';
                      }
                      return appointment.status === filter;
                    });
                  }
                  // Mostra appuntamenti eliminati se showDeletedAppointments è attivo
                  const isDeleted = appointment.status === 'Eliminato' || appointment.status === 'deleted';
                  const matchesDeleted = showDeletedAppointments ? true : !isDeleted;
                  return matchesSearch && matchesDate && matchesTeamMember && matchesStatus && matchesDeleted;
                })
                // Applica la slice solo se c'è un giorno selezionato
                .filter((_, idx, arr) => selectedDate ? idx < Math.max(1, Math.floor((hourHeight - 24) / 32)) : true)
                .map((appointment) => (
                                    <div
                    key={appointment.id}
                    draggable={appointment.status !== 'pagato' && appointment.status !== 'Eliminato'}
                    onDragStart={(e) => handleDragStart(e, appointment)}
                    className="transition-all cursor-pointer relative border shadow-sm hover:shadow flex flex-col min-h-[48px]"
                    style={{
                      ...getAppointmentCardStyle(appointment),
                      padding: '8px 10px',
                      marginBottom: '4px',
                      minHeight: `${Math.max(48, Math.round(hourHeight * 0.24))}px`,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      width: '100%',
                      maxWidth: '100%',
                      transition: 'min-height 0.2s',
                      borderRadius: '12px',
                      border: appointment.status === 'Eliminato' || appointment.status === 'deleted'
                        ? '3px solid #dc2626'
                        : appointment.status === 'Pausa'
                          ? '1.0px solid #60a5fa'
                          : '1px solid rgba(0, 0, 0, 0.06)',
                      opacity: appointment.status === 'Eliminato' || appointment.status === 'deleted' ? 0.7 : 1,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
                      fontSize: '13px',
                      fontWeight: '400',
                      lineHeight: '1.4',
                      letterSpacing: '-0.003em',
                      // PAUSA: stile con linee oblique più soft
                      ...(appointment.status === 'Pausa' && {
                        backgroundColor: '#f6f7fa',
                        backgroundImage: `repeating-linear-gradient(135deg, #dbe3ea 0px, #dbe3ea 8px, #f6f7fa 8px, #f6f7fa 16px)`,
                        color: '#7b8794',
                        boxShadow: '0 0 0 1px #bae6fd',
                        opacity: 1,
                      }),
                      // Effetto durante il drag
                      ...(draggedAppointment?.id === appointment.id && {
                        opacity: 0.5,
                        transform: 'scale(0.95)',
                      }),
                    }}
                    onClick={(e) => handleCardClick(appointment, e)}
                  >

                    <div className="flex items-center justify-between mb-0.5 w-full">
                      <span className="text-[11px] font-medium text-gray-500 truncate max-w-[60%]">
                        {format(new Date(appointment.data), "EEEE, d MMMM", { locale: it })}
                      </span>
                      {appointment.status && (
                        <span className="ml-1">
                          <StatoCardMonthly orderId={appointment.id} status={appointment.status} onStatusUpdate={() => fetchAppointments(user, true)} task={appointment.task} />
                        </span>
                      )}
                    </div>
                    {/* Mostra la barra verticale solo se filled o default */}
                    {(!appointment.prefer_card_style || appointment.prefer_card_style === 'filled') && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: Array.isArray(appointment.color_card) 
                          ? appointment.color_card[0] 
                          : appointment.color_card || '#0078d4',
                        borderRadius: '2px 0 0 2px',
                      }}></div>
                    )}
                    {/* Color bar rendering based on prefer_card_style */}
                    {(() => {
                      const style = appointment.prefer_card_style || 'filled';
                      let colors: string[] = [];
                      if (Array.isArray(appointment.color_card)) {
                        colors = appointment.color_card.filter((c: any) => typeof c === 'string' && c.startsWith('#'));
                      } else if (typeof appointment.color_card === 'string') {
                        try {
                          const parsed = JSON.parse(appointment.color_card);
                          if (Array.isArray(parsed)) {
                            colors = parsed.filter((c: any) => typeof c === 'string' && c.startsWith('#'));
                          }
                        } catch {
                          if (appointment.color_card.startsWith('#')) colors = [appointment.color_card];
                        }
                      }
                      if (style === 'top' && colors.length > 0) {
                        return <div style={{position:'absolute',top:0,left:0,right:0,height:'6px',borderTopLeftRadius:12,borderTopRightRadius:12,background:colors.length===2?`linear-gradient(90deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                      }
                      if (style === 'bottom' && colors.length > 0) {
                        return <div style={{position:'absolute',bottom:0,left:0,right:0,height:'6px',borderBottomLeftRadius:12,borderBottomRightRadius:12,background:colors.length===2?`linear-gradient(90deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                      }
                      if (style === 'left' && colors.length > 0) {
                        return <div style={{position:'absolute',top:0,bottom:0,left:0,width:'6px',borderTopLeftRadius:12,borderBottomLeftRadius:12,background:colors.length===2?`linear-gradient(180deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                      }
                      if (style === 'right' && colors.length > 0) {
                        return <div style={{position:'absolute',top:0,bottom:0,right:0,width:'6px',borderTopRightRadius:12,borderBottomRightRadius:12,background:colors.length===2?`linear-gradient(180deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                      }
                      return null;
                    })()}
                    {/* Se è una pausa, mostra l'immagine come background */}
                    {appointment.status === 'Pausa' && (
                      <img
                        src="/pausa.jpg"
                        alt="Pausa"
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: '12px',
                          height: '100%',
                          width: 'auto',
                          objectFit: 'contain',
                          opacity: 0.35,
                          filter: 'saturate(1.7) contrast(1.2)',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                    )}
                    <div 
                      className="text-[13px] font-medium truncate w-full leading-tight pr-8" 
                      title={appointment.nome}
                      style={{
                        color: (() => {
                          const isCancelled = appointment.status === "cancelled";
                          const isDeleted = appointment.status === "deleted";
                          const isEliminato = appointment.status === "Eliminato";
                          
                          if (isCancelled || isDeleted || isEliminato) {
                            return '#9CA3AF';
                          }
                          
                          const colorCardString = Array.isArray(appointment.color_card)
                            ? appointment.color_card[0]
                            : appointment.color_card;
                          
                          if (colorCardString && !isCancelled) {
                            return getContrastColor(colorCardString);
                          }
                          
                          return '#1f2937';
                        })()
                      }}
                    >
                      {appointment.nome}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 w-full">
                      <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[11px] text-gray-600 truncate flex items-center gap-1">
                        {appointment.orarioInizio} - {appointment.orarioFine}
                        {appointment.task && (
                          <span 
                            className="flex-shrink-0 bg-blue-100 text-blue-700 text-[8px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                            title="Task"
                          >
                            TASK
                          </span>
                        )}
                      </span>
                    </div>
                    {/* Show services if present */}
                    {appointment.services && appointment.services.length > 0 && (
                      <div className="mt-1 pr-8"> {/* Add right padding to avoid status overlap */}
                        <div className="flex flex-wrap gap-1">
                          {appointment.services.map((service: any, index: number) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-white/80 border border-gray-200 text-gray-700"
                              style={{
                                fontSize: '8px',
                                lineHeight: '1.2',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                              title={service.servizio || service.name}
                            >
                              {service.servizio || service.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {appointment.note && (
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 truncate w-full" title={appointment.note}>{appointment.note}</p>
                    )}
                    
                    {/* Trash icon for pause deletion */}
                    {appointment.status === 'Pausa' && (
                      <button
                        onClick={(e) => handlePauseDelete(appointment, e)}
                        className="absolute bottom-1 right-1 p-1 rounded-full bg-red-100 hover:bg-red-200 transition-colors duration-200 border border-red-300 flex-shrink-0 z-20"
                        title="Elimina pausa"
                        style={{
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <FaTrash className="w-2.5 h-2.5 text-red-600" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
        </div>
        )}

      <div className="flex-1 flex bg-white overflow-hidden">
        {/* Main content area with calendar and sidebar */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="grid grid-cols-7 text-center border-b bg-white sticky top-0 z-20">
            {daysOfWeek.map((day, index) => (
              <div 
                key={day} 
                className={`py-3 text-sm font-medium text-gray-500 ${
                  (index + 1) % 7 === new Date().getDay() ? 'bg-violet-100' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Loading state for main calendar */}
          {isLoadingTeam && teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
              </div>
              <p className="mt-4 text-sm text-gray-500">Caricamento configurazione calendario...</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(0,1fr)] divide-x divide-y border-gray-200">
            {days.map((day, index) => {
              const dayAppointments = appointments.filter((appointment) => {
                const appointmentDate = new Date(appointment.data);
                const isSelectedTeamMember = showAll || selectedMembers.includes(appointment.team_id);
                
                // Applica filtri di stato
                let statusMatch = true;
                if (selectedStatusFilters.length > 0) {
                  statusMatch = selectedStatusFilters.some(filter => {
                    if (filter === null || filter === '') {
                      return !appointment.status || appointment.status === '' || appointment.status === null;
                    }
                    // Normalizza "Eliminato" e "deleted"
                    if (filter === 'deleted') {
                      return appointment.status === 'Eliminato' || appointment.status === 'deleted';
                    }
                    return appointment.status === filter;
                  });
                }
                
                // Gestisci appuntamenti eliminati
                const isDeleted = appointment.status === 'Eliminato' || appointment.status === 'deleted';
                const showDeletedMatch = showDeletedAppointments ? true : !isDeleted;
                
                return isSameDay(appointmentDate, day) && isSelectedTeamMember && statusMatch && showDeletedMatch;
              });

              return (
                <div
                  key={index}
                  ref={isSameDay(day, new Date()) ? todayCellRef : null}
                  className={`p-1 border-r border-b relative calendar-day ${
                    isSameMonth(day, currentDate) 
                      ? "bg-white" 
                      : "bg-gray-50"
                  } ${
                    isSameDay(day, new Date()) 
                      ? "border-blue-500 border-l-4" 
                      : ""
                  } ${
                    selectedDate && isSameDay(selectedDate, day)
                      ? "bg-violet-50 ring-2 ring-violet-500 ring-inset"
                      : ""
                  } ${
                    dragPreview && isSameDay(dragPreview.date, day)
                      ? "bg-blue-50 ring-2 ring-blue-300"
                      : ""
                  }`}
                  style={{ minHeight: `${hourHeight}px` }}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                  onClick={(e) => {
                    // Solo click su spazio bianco, non su appuntamento
                    if (e.target === e.currentTarget || e.target === e.currentTarget.firstChild) {
                      // Controlla se l'utente ha i permessi per creare appuntamenti
                      if (!hasPermission || !hasPermission('canCreateAppointments')) {
                        return; // Non aprire il dropdown se non ha i permessi
                      }
                      
                      // Prendi posizione click per dropdown
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e as React.MouseEvent).clientX;
                      const y = (e as React.MouseEvent).clientY;
                      setCellClickDropdown({
                        isOpen: true,
                        day,
                        x,
                        y
                      });
                    }
                  }}
                >
      {/* Dropdown menu per la cella (come weekly) */}
      {cellClickDropdown?.isOpen && (
        <DropdownMenu open={cellClickDropdown.isOpen} onOpenChange={(open) => { if (!open) setCellClickDropdown(null); }}>
          <DropdownMenuTrigger asChild>
            <div
              style={{ position: "fixed", left: cellClickDropdown.x, top: cellClickDropdown.y, zIndex: 9999, width: 0, height: 0 }}
              tabIndex={-1}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={4} align="start" style={{ minWidth: 180, boxShadow: 'none' }}>
            {hasPermission && hasPermission('canCreateAppointments') && (
              <DropdownMenuItem onClick={handleCreateAppointment}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Crea nuovo appuntamento
              </DropdownMenuItem>
            )}
            {hasPermission && hasPermission('canCreateAppointments') && (
              <DropdownMenuItem onClick={handleCreatePausa}>
                <Clock className="w-4 h-4 mr-2" />
                Inserisci pausa
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setCellClickDropdown(null)} className="text-red-500">
              <X className="w-4 h-4 mr-2" />
              Annulla
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
                      <div className="flex justify-between items-center">
                        <div className={`text-sm p-1 ${
                          isSameDay(day, new Date())
                            ? "font-bold text-blue-600"
                            : isSameMonth(day, currentDate)
                              ? "text-gray-900"
                              : "text-gray-400"
                        }`}>
                          {format(day, "d")}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasPermission('canCreateAppointments') && (
                            <Plus 
                              className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer" 
                              onClick={() => setIsCreateOrderOpen(true)}
                            />
                          )}
                          {dayAppointments.length > 2 && (
                            <div 
                              className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                              onClick={() => handleNotificationDotClick(day, dayAppointments)}
                            >
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              <span className="text-[10px] text-red-600 font-medium">
                                +{dayAppointments.length - 2}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-0.5 mt-0.5 max-w-[95%] mx-auto">
                        {/* Drag preview indicator */}
                        {dragPreview && isSameDay(dragPreview.date, day) && (
                          <div
                            className="absolute left-0 right-0 z-50 pointer-events-none"
                            style={{
                              top: `${(dragPreview.time.getHours() * 60 + dragPreview.time.getMinutes()) / (24 * 60) * 100}%`,
                              transform: 'translateY(-50%)',
                            }}
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-3 w-3 rounded-full -ml-2 bg-blue-500 shadow-lg" />
                              <div className="h-[2px] w-full bg-blue-500 shadow-sm" />
                              {/* Time indicator */}
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-md shadow-lg">
                                {format(dragPreview.time, 'HH:mm')}
                              </div>
                            </div>
                          </div>
                        )}
                        {(() => {
                          // Calcola quanti appuntamenti mostrare in base allo zoom
                          const maxToShow = Math.max(1, Math.floor((hourHeight - 24) / 32));
                          return dayAppointments
                            .sort((a, b) => {
                              const timeA = new Date(`${a.data}T${a.orarioInizio}`).getTime();
                              const timeB = new Date(`${b.data}T${b.orarioInizio}`).getTime();
                              return timeA - timeB;
                            })
                            .slice(0, maxToShow)
                            .map((appointment) => {
                              const now = new Date();
                              const appointmentTime = new Date(`${appointment.data}T${appointment.orarioInizio}`);
                              const isPast = appointmentTime < now;
                              return (
                                <div
                                  key={appointment.id}
                                  draggable={appointment.status !== 'pagato' && appointment.status !== 'Eliminato'}
                                  onDragStart={(e) => handleDragStart(e, appointment)}
                                  className={`px-2 py-2 text-xs cursor-pointer transition-all relative ${
                                    isPast ? "" : "shadow-sm hover:shadow"
                                  }`}
                                  style={{
                                    ...getAppointmentCardStyle(appointment),
                                    borderRadius: '12px',
                                    border: appointment.status === 'Eliminato' || appointment.status === 'deleted'
                                      ? '3px solid #dc2626'
                                      : appointment.status === 'Pausa'
                                        ? '1.0px solid #60a5fa'
                                        : '1px solid rgba(0, 0, 0, 0.06)',
                                    opacity: appointment.status === 'Eliminato' || appointment.status === 'deleted' ? 0.7 : 1,
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
                                    fontSize: '13px',
                                    fontWeight: '400',
                                    lineHeight: '1.4',
                                    letterSpacing: '-0.003em',
                                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                    // PAUSA: stile con linee oblique più soft
                                    ...(appointment.status === 'Pausa' && {
                                      backgroundColor: '#f6f7fa',
                                      backgroundImage: `repeating-linear-gradient(135deg, #dbe3ea 0px, #dbe3ea 8px, #f6f7fa 8px, #f6f7fa 16px)`,
                                      color: '#7b8794',
                                      boxShadow: '0 0 0 1px #bae6fd',
                                      opacity: 1,
                                    }),
                                    // Effetto durante il drag
                                    ...(draggedAppointment?.id === appointment.id && {
                                      opacity: 0.5,
                                      transform: 'scale(0.95)',
                                    }),
                                  }}
                                  onClick={(e) => handleCardClick(appointment, e)}
                                >

                                  {/* Mostra la barra verticale solo se filled o default */}
                                  {(!appointment.prefer_card_style || appointment.prefer_card_style === 'filled') && (
                                    <div style={{
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: '4px',
                                      backgroundColor: Array.isArray(appointment.color_card) 
                                        ? appointment.color_card[0] 
                                        : appointment.color_card || '#0078d4',
                                      borderRadius: '2px 0 0 2px',
                                    }}></div>
                                  )}
                                  {/* Color bar rendering based on prefer_card_style */}
                                  {(() => {
                                    const style = appointment.prefer_card_style || 'filled';
                                    let colors: string[] = [];
                                    if (Array.isArray(appointment.color_card)) {
                                      colors = appointment.color_card.filter((c: any) => typeof c === 'string' && c.startsWith('#'));
                                    } else if (typeof appointment.color_card === 'string') {
                                      try {
                                        const parsed = JSON.parse(appointment.color_card);
                                        if (Array.isArray(parsed)) {
                                          colors = parsed.filter((c: any) => typeof c === 'string' && c.startsWith('#'));
                                        }
                                      } catch {
                                        if (appointment.color_card.startsWith('#')) colors = [appointment.color_card];
                                      }
                                    }
                                    if (style === 'top' && colors.length > 0) {
                                      return <div style={{position:'absolute',top:0,left:0,right:0,height:'6px',borderTopLeftRadius:12,borderTopRightRadius:12,background:colors.length===2?`linear-gradient(90deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                                    }
                                    if (style === 'bottom' && colors.length > 0) {
                                      return <div style={{position:'absolute',bottom:0,left:0,right:0,height:'6px',borderBottomLeftRadius:12,borderBottomRightRadius:12,background:colors.length===2?`linear-gradient(90deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                                    }
                                    if (style === 'left' && colors.length > 0) {
                                      return <div style={{position:'absolute',top:0,bottom:0,left:0,width:'6px',borderTopLeftRadius:12,borderBottomLeftRadius:12,background:colors.length===2?`linear-gradient(180deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                                    }
                                    if (style === 'right' && colors.length > 0) {
                                      return <div style={{position:'absolute',top:0,bottom:0,right:0,width:'6px',borderTopRightRadius:12,borderBottomRightRadius:12,background:colors.length===2?`linear-gradient(180deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                                    }
                                    return null;
                                  })()}
                                  {/* Se è una pausa, mostra l'immagine come background */}
                                  {appointment.status === 'Pausa' && (
                                    <img
                                      src="/pausa.jpg"
                                      alt="Pausa"
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        right: '12px',
                                        height: '100%',
                                        width: 'auto',
                                        objectFit: 'contain',
                                        opacity: 0.35,
                                        filter: 'saturate(1.7) contrast(1.2)',
                                        pointerEvents: 'none',
                                        zIndex: 1,
                                      }}
                                    />
                                  )}
                                  {/* Trash icon for pause appointments in calendar cells */}
                                  {appointment.status === 'Pausa' && (
                                    <button
                                      onClick={(e) => handlePauseDelete(appointment, e)}
                                      className="absolute bottom-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      title="Elimina pausa"
                                    >
                                      <FaTrash className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                  {/* Status in top right */}
                                  {appointment.status && (
                                    <div className="absolute top-1 right-1 z-10">
                                      <StatoCardMonthly 
                                        orderId={appointment.id} 
                                        status={appointment.status} 
                                        onStatusUpdate={() => fetchAppointments(user, true)} 
                                        task={appointment.task}
                                      />
                                    </div>
                                  )}
                                  <div className="font-medium text-[10px] flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span className="flex items-center gap-1">
                                      {appointment.orarioInizio} - {appointment.orarioFine}
                                      {appointment.task && (
                                        <span 
                                          className="flex-shrink-0 bg-blue-100 text-blue-700 text-[7px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                          title="Task"
                                        >
                                          TASK
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div 
                                    className="font-medium truncate text-[10px] pr-16"
                                    style={{
                                      color: (() => {
                                        const isCancelled = appointment.status === "cancelled";
                                        const isDeleted = appointment.status === "deleted";
                                        const isEliminato = appointment.status === "Eliminato";
                                        
                                        if (isCancelled || isDeleted || isEliminato) {
                                          return '#9CA3AF';
                                        }
                                        
                                        const colorCardString = Array.isArray(appointment.color_card)
                                          ? appointment.color_card[0]
                                          : appointment.color_card;
                                        
                                        if (colorCardString && !isCancelled) {
                                          return getContrastColor(colorCardString);
                                        }
                                        
                                        return '#1f2937';
                                      })()
                                    }}
                                    title={appointment.nome}
                                  >
                                    {appointment.nome}
                                  </div>
                                  {/* Show services if present */}
                                  {appointment.services && appointment.services.length > 0 && (
                                    <div className="mt-1 pr-16">
                                      <div className="flex flex-wrap gap-1">
                                        {appointment.services.map((service: any, index: number) => (
                                          <span
                                            key={index}
                                            className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-white/80 border border-gray-200 text-gray-700"
                                            style={{
                                              fontSize: '8px',
                                              lineHeight: '1.2',
                                              whiteSpace: 'nowrap',
                                              flexShrink: 0,
                                            }}
                                            title={service.servizio || service.name}
                                          >
                                            {service.servizio || service.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                        })()}
                      </div>
                    </div>
              );
            })}
          </div>
        )}
        </div>
        
        {/* Team Members Sidebar - Hidden on mobile */}
        {!isMobile && (
          <div className="w-16 bg-gray-50 border-l border-gray-200 flex flex-col items-center py-4 space-y-3 overflow-y-auto">
            <div className="text-xs font-medium text-gray-500 mb-2">Team</div>
            {teamMembers
              .filter(member => member.visible_users !== false)
              .sort((a, b) => (a.order_column || 0) - (b.order_column || 0))
              .map((member) => (
                <div
                  key={member.id}
                  className="relative group cursor-pointer"
                  title={member.name}
                  onClick={() => handleToggleMember(member.id)}
                >
                  <div className={`w-10 h-10 rounded-full border-2 transition-colors duration-200 flex items-center justify-center shadow-sm ${
                    selectedMembers.includes(member.id) || showAll
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-400 bg-gray-200 hover:border-gray-500 hover:bg-gray-300'
                  }`}>
                    <LazyAvatar
                      member={member}
                      className={`w-8 h-8 ${!(selectedMembers.includes(member.id) || showAll) ? 'opacity-60' : ''}`}
                    />
                  </div>
                  {/* Member name tooltip */}
                  <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {member.name}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      </div>
   
      {/* Modal per modificare i servizi delle card */}
      {EditServicesModal && (
        <EditServicesModal
          isOpen={isEditServicesOpen}
          onClose={() => setIsEditServicesOpen(false)}
          appointment={selectedAppointment}
          onSave={handleSaveServices}
          onDeleteService={handleDeleteService}
        />
      )}

      {/* Modal per modificare i task */}
      <TaskEditModal
        isOpen={isTaskEditModalOpen}
        onClose={() => {
          setIsTaskEditModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdated={() => fetchAppointments(user, true)}
      />

      <CreateOrder
        isDialogOpen={isCreateOrderOpen}
        setIsDialogOpen={setIsCreateOrderOpen}
        initialFormData={initialFormData}
        onAppointmentCreated={() => fetchAppointments(user, true)}
      />
      {isCreatePausaOpen && (
        <CreatePausaForm
          open={isCreatePausaOpen}
          onOpenChange={setIsCreatePausaOpen}
          initialFormData={initialFormData}
          onPausaCreated={() => {
            setIsCreatePausaOpen(false);
            fetchAppointments(user, true);
          }}
        />
      )}

      {/* Modal per visualizzare tutti gli appuntamenti del giorno */}
      <Dialog open={isDayAppointmentsModalOpen} onOpenChange={setIsDayAppointmentsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Appuntamenti del {selectedDayForModal && format(selectedDayForModal, "EEEE, d MMMM yyyy", { locale: it })}
            </DialogTitle>
            <DialogDescription>
              {selectedDayAppointments.length} appuntamento{selectedDayAppointments.length !== 1 ? 'i' : ''} per questo giorno
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
            <div className="space-y-3">
              {selectedDayAppointments
                .sort((a, b) => {
                  const timeA = new Date(`${a.data}T${a.orarioInizio}`).getTime();
                  const timeB = new Date(`${b.data}T${b.orarioInizio}`).getTime();
                  return timeA - timeB;
                })
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    draggable={appointment.status !== 'pagato' && appointment.status !== 'Eliminato'}
                    onDragStart={(e) => handleDragStart(e, appointment)}
                    className="p-4 rounded-xl shadow-lg border relative hover:shadow-xl transition-all duration-200 group cursor-pointer"
                    style={{
                      ...getAppointmentCardStyle(appointment),
                      borderRadius: '16px',
                      border: appointment.status === 'Eliminato' || appointment.status === 'deleted'
                        ? '3px solid #dc2626'
                        : appointment.status === 'Pausa'
                          ? '1.0px solid #60a5fa'
                          : '1px solid rgba(0, 0, 0, 0.08)',
                      opacity: appointment.status === 'Eliminato' || appointment.status === 'deleted' ? 0.7 : 1,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
                      fontSize: '13px',
                      fontWeight: '400',
                      lineHeight: '1.4',
                      letterSpacing: '-0.003em',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      // PAUSA: stile con linee oblique più soft
                      ...(appointment.status === 'Pausa' && {
                        backgroundColor: '#f6f7fa',
                        backgroundImage: `repeating-linear-gradient(135deg, #dbe3ea 0px, #dbe3ea 8px, #f6f7fa 8px, #f6f7fa 16px)`,
                        color: '#7b8794',
                        boxShadow: '0 0 0 1px #bae6fd',
                        opacity: 1,
                      }),
                      // Effetto durante il drag
                      ...(draggedAppointment?.id === appointment.id && {
                        opacity: 0.5,
                        transform: 'scale(0.95)',
                      }),
                    }}
                    onClick={(e) => handleCardClick(appointment, e)}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/80 rounded-lg shadow-sm">
                          <Clock className="h-3 w-3 text-gray-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          {appointment.orarioInizio} - {appointment.orarioFine}
                          {appointment.task && (
                            <span 
                              className="flex-shrink-0 bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-full font-semibold border border-blue-200"
                              title="Task"
                            >
                              TASK
                            </span>
                          )}
                        </span>
                      </div>
                      {appointment.status && (
                        <div className="flex items-center gap-2">
                          <StatoCardMonthly 
                            orderId={appointment.id} 
                            status={appointment.status} 
                            onStatusUpdate={() => fetchAppointments(user, true)} 
                            task={appointment.task}
                          />
                        </div>
                      )}
                    </div>

                    {/* Mostra la barra verticale solo se filled o default */}
                    {(!appointment.prefer_card_style || appointment.prefer_card_style === 'filled') && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: Array.isArray(appointment.color_card) 
                          ? appointment.color_card[0] 
                          : appointment.color_card || '#0078d4',
                        borderRadius: '2px 0 0 2px',
                      }}></div>
                    )}

                    {/* Color bar rendering based on prefer_card_style */}
                    {(() => {
                      const style = appointment.prefer_card_style || 'filled';
                      let colors: string[] = [];
                      if (Array.isArray(appointment.color_card)) {
                        colors = appointment.color_card.filter((c: any) => typeof c === 'string' && c.startsWith('#'));
                      } else if (typeof appointment.color_card === 'string') {
                        try {
                          const parsed = JSON.parse(appointment.color_card);
                          if (Array.isArray(parsed)) {
                            colors = parsed.filter((c: any) => typeof c === 'string' && c.startsWith('#'));
                          }
                        } catch {
                          if (appointment.color_card.startsWith('#')) colors = [appointment.color_card];
                        }
                      }
                      if (style === 'top' && colors.length > 0) {
                        return <div style={{position:'absolute',top:0,left:0,right:0,height:'6px',borderTopLeftRadius:12,borderTopRightRadius:12,background:colors.length===2?`linear-gradient(90deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                      }
                      if (style === 'bottom' && colors.length > 0) {
                        return <div style={{position:'absolute',bottom:0,left:0,right:0,height:'6px',borderBottomLeftRadius:12,borderBottomRightRadius:12,background:colors.length===2?`linear-gradient(90deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                      }
                      if (style === 'left' && colors.length > 0) {
                        return <div style={{position:'absolute',top:0,bottom:0,left:0,width:'6px',borderTopLeftRadius:12,borderBottomLeftRadius:12,background:colors.length===2?`linear-gradient(180deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                      }
                      if (style === 'right' && colors.length > 0) {
                        return <div style={{position:'absolute',top:0,bottom:0,right:0,width:'6px',borderTopRightRadius:12,borderBottomRightRadius:12,background:colors.length===2?`linear-gradient(180deg,${colors[0]},${colors[1]})`:colors[0],zIndex:40,pointerEvents:'none',margin:0,padding:0,boxSizing:'border-box'}} />;
                      }
                      return null;
                    })()}

                    {/* Se è una pausa, mostra l'immagine come background */}
                    {appointment.status === 'Pausa' && (
                      <img
                        src="/pausa.jpg"
                        alt="Pausa"
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: '12px',
                          height: '100%',
                          width: 'auto',
                          objectFit: 'contain',
                          opacity: 0.35,
                          filter: 'saturate(1.7) contrast(1.2)',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Trash icon for pause appointments */}
                    {appointment.status === 'Pausa' && (
                      <button
                        onClick={(e) => handlePauseDelete(appointment, e)}
                        className="absolute bottom-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Elimina pausa"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-[11px] font-medium"
                        style={{
                          color: (() => {
                            const isCancelled = appointment.status === "cancelled";
                            const isDeleted = appointment.status === "deleted";
                            const isEliminato = appointment.status === "Eliminato";
                            
                            if (isCancelled || isDeleted || isEliminato) {
                              return '#9CA3AF';
                            }
                            
                            const colorCardString = Array.isArray(appointment.color_card)
                              ? appointment.color_card[0]
                              : appointment.color_card;
                            
                            if (colorCardString && !isCancelled) {
                              return getContrastColor(colorCardString);
                            }
                            
                            return '#1f2937';
                          })()
                        }}
                      >
                        {appointment.nome}
                      </p>

                      {/* Show services in modal */}
                      {appointment.services && appointment.services.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              Servizi ({appointment.services.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {appointment.services.map((service: any, index: number) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 rounded-lg bg-white/90 border border-gray-200 text-gray-700 text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                                style={{
                                  fontSize: '11px',
                                  lineHeight: '1.3',
                                }}
                              >
                                {service.servizio || service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {appointment.note && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              Note
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{appointment.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
                     </div>

           <DialogFooter className="flex-shrink-0 pt-4 border-t">
             <DialogClose asChild>
               <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                 Chiudi
               </button>
             </DialogClose>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyCalendar;
