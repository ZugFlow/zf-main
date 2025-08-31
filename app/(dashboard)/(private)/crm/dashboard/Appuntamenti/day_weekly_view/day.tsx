'use client';

// Extend the Window interface to include __SHOW_NAVBAR_SECONDARIA__
declare global {
  interface Window {
    __SHOW_NAVBAR_SECONDARIA__?: boolean;
  }
}

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Calendar, X } from "lucide-react";
// IMPORTAZIONE SOLO ESM: NON USARE require() PER date-fns!
import { format, startOfDay, endOfDay, addDays, subDays, parse, differenceInMinutes, addMinutes } from "date-fns";
// Helper to format duration: convert minutes into hours or minutes display
function formatDuration(duration: number): string {
  if (duration < 60) {
    return `${duration} min`;
  }
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}.${minutesStr}h`;
}
import { createClient } from "@/utils/supabase/client";
import { getSalonId, canEditAppointment } from '@/utils/getSalonId';
import { FaCalendarAlt, FaTasks, FaArrowLeft, FaArrowRight, FaChevronLeft, FaChevronRight, FaTrash } from "react-icons/fa"; // Removed FaCut
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import { FaEdit, FaEye, FaClock } from "react-icons/fa";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDayView } from "./MobileDayView";

// OTTIMIZZAZIONE: Lazy Avatar Component
const LazyAvatar = React.memo(({ member, className }: { member: Member; className?: string }) => {
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


import NavbarSecondaria from "./navbar_secondaria_day";
import { useToast } from "@/hooks/use-toast";
import { useLocalization } from "@/hooks/useLocalization";
import { CreateOrder } from "../../_CreateOrder/CreateOrder";
import { EditServicesModal } from "../../_CreateOrder/modaleditcard";
import { listenForAppointmentEvents, APPOINTMENT_EVENTS, dispatchAppointmentEvent } from '../../utils/appointmentEvents';
import SettingCalendar from "./SettingCalendar";
import { ChevronDown, Menu, Calendar as CalendarIcon, Clock, UserPlus, Check, Trash, Filter } from "lucide-react";

import FocusIcon from "./FocusIcon";
import StatoCard from "./StatoCard"; // Import the StatoCard component
import { TaskEditModal, Task } from "./TaskEditModal";

import { APPOINTMENT_STATUSES } from "@/components/status";
import dynamic from "next/dynamic";
import { formatTime, formatTimeString, TimeFormat } from "./timeUtils";
import { getUserTimeFormat, setupAppointmentsSubscription, setupDeletedAppointmentsSubscription } from "../../query/query";

import CreatePausaForm from "../../_CreateOrder/pausa";




const supabase = createClient();

interface Appointment {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  team_id: string;
  servizio: string;
  accesso: string; // Tipo di accesso (es. "Invitation")
  status: string; // Changed from stato to status
  progresso: number; // Percentuale di completamento
  membri?: string[]; // URL immagini membri
  services?: Array<{ id: string; name: string; price: number; }>;
  color_card?: string[] | string; // Array of colors for the card, or string for backward compatibility
  prefer_card_style?: "filled" | "top" | "bottom" | "left" | "right"; // Style preference for color application
  alone?: string | number; // Add this line to fix the error
  note?: string; // Optional note field
  task?: boolean; // Indicates if this is a task
  email?: string; // Email address for customer notifications
  user_id?: string; // User ID who created the appointment/task
}

interface Member {
  id: string;
  name: string;
  ColorMember?: string; // Aggiungi il campo ColorMember
  avatar_url?: string;
  visible_users?: boolean;
  order_column?: number;
  email?: string;
  phone_number?: string;
}

function snapTo5Minutes(date: Date) {
  const minutes = date.getMinutes();
  const remainder = minutes % 5;
  if (remainder === 0) return date;
  date.setMinutes(minutes - remainder + (remainder < 3 ? 0 : 5));
  return date;
}

interface DailyCalendarProps {
  hasPermission?: (permission: string) => boolean;
  userRole?: string | null;
  updateModalState?: (isOpen: boolean) => void;
  // Add toggle functions for mobile navbar
  toggleDay?: () => void;
  toggleClients?: () => void;
  toggleServices?: () => void;
  togglePermessiFerie?: () => void;
  toggleOnlineBookings?: () => void;
  toggleTaskManager?: () => void;
  toggleImpostazioni?: () => void;
  // Add visibility states for mobile navbar
  showDay?: boolean;
  showClients?: boolean;
  showGestioneServizi?: boolean;
  showPermessiFerie?: boolean;
  showOnlineBookings?: boolean;
  showTaskManager?: boolean;
  showImpostazioni?: boolean;
}

function DailyCalendar({ 
  hasPermission, 
  userRole, 
  updateModalState,
  // Add toggle functions for mobile navbar
  toggleDay,
  toggleClients,
  toggleServices,
  togglePermessiFerie,
  toggleOnlineBookings,
  toggleTaskManager,
  toggleImpostazioni,
  // Add visibility states for mobile navbar
  showDay,
  showClients,
  showGestioneServizi,
  showPermessiFerie,
  showOnlineBookings,
  showTaskManager,
  showImpostazioni
}: DailyCalendarProps = {}) {
  // Mobile detection
  const isMobile = useIsMobile();
  const { t, formatDate } = useLocalization();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hourHeight, setHourHeight] = useState(180); // Default height for each hour
  const [hoverEffectEnabled, setHoverEffectEnabled] = useState(true);
  const [alternativeViewEnabled, setAlternativeViewEnabled] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null); // State for selected appointment
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog visibility
  // const [isEditOrderOpen, setIsEditOrderOpen] = useState(false); // State for EditOrderForm dialog
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false); // Add new state for CreateOrder
  const [isCreatePausaOpen, setIsCreatePausaOpen] = useState(false); // Add new state for CreatePausa
  const [cellClickDropdown, setCellClickDropdown] = useState<{
    isOpen: boolean;
    hourTime: Date;
    memberId: string;
    x: number;
    y: number;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMonthlyView, setIsMonthlyView] = useState(false); // State for toggling monthly view
  const [dailyViewDate, setDailyViewDate] = useState(new Date()); // Add this line
  const [membersPerPage, setMembersPerPage] = useState(8); // Default to 8
  const [startHour, setStartHour] = useState("00:00");
  const [finishHour, setFinishHour] = useState("23:59");
  const [daysToShow, setDaysToShow] = useState(1); // Add state for days to show (default 1 for daily view)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ time: Date; memberId?: string } | null>(null);
  // Ref to throttle drag-over DOM updates
  const dragAnimationFrame = useRef<number | null>(null);
  const lastDragOverData = useRef<{ time: Date; memberId?: string; clientX: number; clientY: number } | null>(null);
  const [resizeGhost, setResizeGhost] = useState<{ top: number; height: number } | null>(null);

  const [resizing, setResizing] = useState<{
    appointment: Appointment;
    startY: number;
    initialDuration: number;
    newDuration?: number;
  } | null>(null);
  type InitialFormDataType = {
    data: string;
    orarioInizio: string;
    orarioFine: string;
    team_id?: string;
  };
  const [initialFormData, setInitialFormData] = useState<InitialFormDataType | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isWeeklyView, setIsWeeklyView] = useState(false); // Add state for weekly view
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);

  // AnteprimaCard hover states
  const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null);
  const [showAnteprimaCard, setShowAnteprimaCard] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to store state setters for use in nested functions
  const hoverStateRef = useRef({
    setHoveredAppointment,
    setShowAnteprimaCard,
    setMousePosition
  });
  
  // Update ref when state setters change
  useEffect(() => {
    hoverStateRef.current = {
      setHoveredAppointment,
      setShowAnteprimaCard,
      setMousePosition
    };
  }, [setHoveredAppointment, setShowAnteprimaCard, setMousePosition]);



  // Real-time subscription refs
  const appointmentsSubscriptionRef = useRef<any>(null);
  const deletedAppointmentsSubscriptionRef = useRef<any>(null);

  // Effetto: pulizia automatica degli ID membri selezionati che non esistono più in teamMembers
  // OTTIMIZZATO: usa un ref per evitare loop infiniti
  const lastTeamMembersRef = useRef<string[]>([]);
  useEffect(() => {
    const currentTeamMemberIds = teamMembers.map(m => m.id);
    const hasTeamMembersChanged = JSON.stringify(currentTeamMemberIds) !== JSON.stringify(lastTeamMembersRef.current);
    
    if (hasTeamMembersChanged && selectedTeamMemberIds.length > 0 && teamMembers.length > 0) {
      const validIds = selectedTeamMemberIds.filter(id => teamMembers.some(m => m.id === id));
      if (validIds.length !== selectedTeamMemberIds.length) {
        setSelectedTeamMemberIds(validIds);
        try {
          localStorage.setItem('selectedTeamMemberIds', JSON.stringify(validIds));
        } catch (e) {}
      }
      lastTeamMembersRef.current = currentTeamMemberIds;
    }
  }, [teamMembers]); // Rimossa selectedTeamMemberIds dalle dipendenze per evitare loop

  // Cleanup globale per gli elementi di resize e drag quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        // Rimuovi tutti gli elementi di resize che potrebbero essere rimasti
        const resizeElements = document.querySelectorAll('[id*="resize-ghost"]');
        resizeElements.forEach(el => el.remove());
        
        // Rimuovi tutti gli elementi di drag che potrebbero essere rimasti
        const dragElements = document.querySelectorAll('[id*="drag-ghost"]');
        dragElements.forEach(el => el.remove());
        
        // Rimuovi le classi di resize dalle card
        document.querySelectorAll('.resizing-card').forEach(el => {
          el.classList.remove('z-[1000]', 'resizing-card');
          (el as HTMLElement).style.position = '';
        });
        
        // Cancella eventuali animation frame pendenti
        if ((window as any).resizeAnimationFrame) {
          cancelAnimationFrame((window as any).resizeAnimationFrame);
          (window as any).resizeAnimationFrame = null;
        }
        
        if (dragAnimationFrame.current) {
          cancelAnimationFrame(dragAnimationFrame.current);
          dragAnimationFrame.current = null;
        }
      }
      
      // Cleanup hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, []);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<(string | null)[]>([]); // Add state for status filters
  const [currentStatus, setCurrentStatus] = useState<string>(''); 
  const [rowHeight, setRowHeight] = useState(200); // Aumentato da 160 a 200
  const [lastDeletedAppointment, setLastDeletedAppointment] = useState<Appointment | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showDeletedAppointments, setShowDeletedAppointments] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showDeletedAppointments');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [startMemberIndex, setStartMemberIndex] = useState(0);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<{ group_id: string; team_member_id: string }[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null); // Add salonId state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("24"); // State for time format preference
  const [isDateChanging, setIsDateChanging] = useState(false); // State for date change animation
  const [cardSizeSetting, setCardSizeSetting] = useState<string>("normal"); // State for card size setting
  const [cardAlignmentSetting, setCardAlignmentSetting] = useState<string>("center"); // State for card alignment setting
  const [hideOutsideHoursSetting, setHideOutsideHoursSetting] = useState<boolean>(false); // State for hide outside hours setting
  
  // OTTIMIZZAZIONE: Debouncing per il rendering del calendario
  const [debouncedAppointments, setDebouncedAppointments] = useState<Appointment[]>([]);
  const [isCalendarRendering, setIsCalendarRendering] = useState(false);
  

  
  // OTTIMIZZAZIONE: Virtualizzazione del calendario
  const [visibleHours, setVisibleHours] = useState<{ start: number; end: number }>({ start: 0, end: 24 });
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  


  const currentHourRef = useRef<HTMLTableRowElement | null>(null);
  
  // Performance optimization refs for DOM caching and throttling
  const dragCacheRef = useRef<{
    lastCellElement: Element | null;
    lastCellRect: DOMRect | null;
    lastUpdate: number;
  }>({ lastCellElement: null, lastCellRect: null, lastUpdate: 0 });
  
  const resizeCacheRef = useRef<{
    lastCellElement: Element | null;
    lastCellRect: DOMRect | null;
    lastUpdate: number;
  }>({ lastCellElement: null, lastCellRect: null, lastUpdate: 0 });

  const isCompactMode = hourHeight < 100; // Threshold for compact mode

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMemberFilter, setShowMemberFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null); // Add focusedMemberId state
  const [showArchivedAppointments, setShowArchivedAppointments] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showMobileView, setShowMobileView] = useState(true); // Add this state

  // Non nascondere più la navbar per PermessiFerie
  const shouldHideNavbar = false; // isMobile && showPermessiFerie;

  // Helper function to handle date changes with animation in mobile
  const handleDateChange = useCallback((newDate: Date) => {
    setIsDateChanging(true);
    setTimeout(() => {
      setDailyViewDate(newDate);
      setIsDateChanging(false);
      // Emit event to sync with sidebar
      const event = new CustomEvent('calendar:dateChanged', {
        detail: { date: newDate.toISOString() }
      });
      window.dispatchEvent(event);
    }, 150); // Short animation duration
  }, []);

  // Stile per aggiungere margine in basso alle card su mobile - RIMOSSO per eliminare striscia bianca
  const mobileCardStyle: React.CSSProperties = {
    marginBottom: 0, // Rimosso margine per eliminare striscia bianca in basso
  };
  const { toast } = useToast();

  // Funzione per verificare la sovrapposizione tra due appuntamenti
  const doAppointmentsOverlap = (a1: Appointment, a2: Appointment) => {
    const a1Start = parse(`${a1.data} ${a1.orarioInizio}`, "yyyy-MM-dd HH:mm", new Date());
    const a1End = parse(`${a1.data} ${a1.orarioFine}`, "yyyy-MM-dd HH:mm", new Date());
    const a2Start = parse(`${a2.data} ${a2.orarioInizio}`, "yyyy-MM-dd HH:mm", new Date());
    const a2End = parse(`${a2.data} ${a2.orarioFine}`, "yyyy-MM-dd HH:mm", new Date());
    return a1Start < a2End && a2Start < a1End;
  };
  
  // Funzione helper per calcolare l'intervallo di sovrapposizione
  const getOverlapInterval = (appointments: Appointment[]) => {
    if (appointments.length < 2) return null;
    
    let minStart = parse(appointments[0].orarioInizio, "HH:mm", new Date());
    let maxEnd = parse(appointments[0].orarioFine, "HH:mm", new Date());
    
    appointments.forEach(apt => {
      const start = parse(apt.orarioInizio, "HH:mm", new Date());
      const end = parse(apt.orarioFine, "HH:mm", new Date());
      minStart = start < minStart ? start : minStart;
      maxEnd = end > maxEnd ? end : maxEnd;
    });
    
    return { start: minStart, end: maxEnd };
  };
  
  // OTTIMIZZATO: Funzione per creare sub-colonne dinamiche con early returns e cache
  const organizeAppointmentsInDynamicColumns = (preFilteredAppointments: Appointment[], memberId: string, date: Date) => {
    const columns: { [key: string]: number } = {};
    const subColumns: { [key: string]: number } = {};
    const totalSubColumns: { [key: string]: number } = {};
    const overlappingMap: { [key: string]: boolean } = {};
    
    const selectedDateStr = format(date, "yyyy-MM-dd");
    
    // OTTIMIZZATO: usa appuntamenti pre-filtrati invece di ri-filtrare
    const memberAppointments = preFilteredAppointments.filter(appointment => 
      appointment.team_id === memberId && appointment.data === selectedDateStr
    );

    // Early return se non ci sono appuntamenti
    if (memberAppointments.length === 0) {
      return { columns, subColumns, totalSubColumns, overlappingMap, totalColumns: 1 };
    }

    // Early return se c'è solo un appuntamento
    if (memberAppointments.length === 1) {
      const appointment = memberAppointments[0];
      columns[appointment.id] = 0;
      subColumns[appointment.id] = 0;
      totalSubColumns[appointment.id] = 1;
      return { columns, subColumns, totalSubColumns, overlappingMap, totalColumns: 1 };
    }
    
    const sortedAppointments = [...memberAppointments].sort((a, b) => {
      const aStart = parse(`${a.data} ${a.orarioInizio}`, "yyyy-MM-dd HH:mm", new Date());
      const bStart = parse(`${b.data} ${b.orarioInizio}`, "yyyy-MM-dd HH:mm", new Date());
      return aStart.getTime() - bStart.getTime();
    });

    // Trova tutti i gruppi di sovrapposizione
    const overlapGroups: Appointment[][] = [];
    const processedAppointments = new Set<string>();

    sortedAppointments.forEach(apt => {
      if (processedAppointments.has(apt.id)) return;
      
      const overlappingGroup = [apt];
      processedAppointments.add(apt.id);
      
      // Trova tutti gli appuntamenti che si sovrappongono con questo
      sortedAppointments.forEach(other => {
        if (other.id !== apt.id && !processedAppointments.has(other.id) && doAppointmentsOverlap(apt, other)) {
          overlappingGroup.push(other);
          processedAppointments.add(other.id);
        }
      });
      
      // Trova sovrapposizioni transitive (A si sovrappone con B, B si sovrappone con C)
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        sortedAppointments.forEach(candidate => {
          if (!processedAppointments.has(candidate.id)) {
            const hasOverlap = overlappingGroup.some(groupMember => 
              doAppointmentsOverlap(candidate, groupMember)
            );
            if (hasOverlap) {
              overlappingGroup.push(candidate);
              processedAppointments.add(candidate.id);
              foundNew = true;
            }
          }
        });
      }
      
      overlapGroups.push(overlappingGroup);
    });

    // Assegna colonne e sub-colonne
    overlapGroups.forEach((group, groupIndex) => {
      if (group.length === 1) {
        // Appuntamento singolo senza sovrapposizioni
        columns[group[0].id] = 0;
        subColumns[group[0].id] = 0;
        totalSubColumns[group[0].id] = 1;
      } else {
        // Gruppo con sovrapposizioni - crea sub-colonne
        const groupId = `group_${groupIndex}`;
        
        // Ordina il gruppo per ora di inizio per l'assegnazione delle sub-colonne
        const sortedGroup = [...group].sort((a, b) => {
          const aStart = parse(`${a.data} ${a.orarioInizio}`, "yyyy-MM-dd HH:mm", new Date());
          const bStart = parse(`${b.data} ${b.orarioInizio}`, "yyyy-MM-dd HH:mm", new Date());
          return aStart.getTime() - bStart.getTime();
        });
        
        // Assegna sub-colonne usando un algoritmo greedy
        sortedGroup.forEach(apt => {
          let subColumn = 0;
          
          // Trova la prima sub-colonna disponibile
          while (
            sortedGroup.some(other => 
              other !== apt && 
              subColumns[other.id] === subColumn &&
              doAppointmentsOverlap(apt, other)
            )
          ) {
            subColumn++;
          }
          
          columns[apt.id] = 0; // Tutti gli appuntamenti sovrapposti condividono la colonna principale
          subColumns[apt.id] = subColumn;
          overlappingMap[apt.id] = true;
        });
        
        // Calcola il numero totale di sub-colonne per questo gruppo
        const maxSubColumn = Math.max(...sortedGroup.map(apt => subColumns[apt.id]));
        sortedGroup.forEach(apt => {
          totalSubColumns[apt.id] = maxSubColumn + 1;
        });
      }
    });

    return { 
      columns, 
      subColumns, 
      totalSubColumns, 
      overlappingMap,
      totalColumns: 1 // Manteniamo sempre una colonna principale per membro
    };
  };
  const fetchAppointments = async (forceRefresh = false, includeDeleted = showDeletedAppointments) => {
    console.log('Fetching appointments for day view...', { 
      forceRefresh, 
      currentAppointmentsCount: appointments.length,
      hasSubscription: !!appointmentsSubscriptionRef.current
    });
    
    // Set fetching flag to prevent real-time updates during fetch
    if (appointmentsSubscriptionRef.current?.setFetching) {
      appointmentsSubscriptionRef.current.setFetching(true);
      console.log('Set fetching flag to true');
    }
    

    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error getting user:", userError?.message);
        return;
      }
      setCurrentUserId(user.id);
    
      // Get salon_id using utility function
      const salonId = await getSalonId();
      
      if (!salonId) {
        console.error("No salon_id found for user:", user.id);
        return;
      }

      // First fetch orders - explicitly include status column (including deleted ones for toggle functionality)
      // For regular appointments: show all salon appointments (shared between team members)
      // For tasks: show only current user's tasks (like in TaskManager)
      let query = supabase
        .from("orders")
        .select("*, status, color_card, prefer_card_style, task")
        .eq('salon_id', salonId);
      
      // If includeDeleted is false, exclude deleted appointments at database level
      if (!includeDeleted) {
        query = query.neq('status', 'Eliminato');
      }
      
      // Show all appointments and tasks for the salon (consistent with weekly/monthly views)
      
      const { data: orders, error: ordersError } = await query.order('orarioInizio', { ascending: true });
    
      if (ordersError) {
        console.error("Error fetching orders:", ordersError.message);
        return;
      }
      
      console.log(`Fetched ${orders?.length || 0} orders for day view`);
    
      // Filter: show all regular appointments; tasks only if they belong to current user
      const visibleOrders = (orders || []).filter((order: any) => !order?.task || order.user_id === user.id);

      // Then fetch associated services for each visible order
      const appointmentsWithServices = await Promise.all(
        visibleOrders.map(async (order) => {
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
    
      console.log('Setting appointments state with fetched data for day view', {
        count: appointmentsWithServices?.length || 0,
        hasData: !!appointmentsWithServices,
        sampleAppointment: appointmentsWithServices?.[0]
      });
      setAppointments(appointmentsWithServices);
      

    } catch (error) {
      console.error("Unexpected error in fetchAppointments:", error);
    } finally {
      // Reset fetching flag
      if (appointmentsSubscriptionRef.current?.setFetching) {
        appointmentsSubscriptionRef.current.setFetching(false);
        console.log('Set fetching flag to false');
      }
      console.log('Fetch appointments completed');
    }
  };



  const addAppointment = async (newAppointment: Appointment) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const appointmentWithUserId = {
        ...newAppointment,
        user_id: user.id  // Add user_id to the appointment
      };

      const { data, error } = await supabase
        .from("orders")
        .insert(appointmentWithUserId)
        .select()
        .single();

      if (error) throw error;

      // Fetch services for the new appointment to ensure it has the complete data
      const { data: services, error: servicesError } = await supabase
        .from("order_services")
        .select("*")
        .eq('order_id', data.id);

      if (servicesError) {
        console.error(`Error fetching services for new appointment ${data.id}:`, servicesError.message);
      }

      // Transform services to match the expected format
      const transformedServices = (services || []).map(service => ({
        id: service.service_id || service.id,
        name: service.servizio || service.name || 'Servizio sconosciuto',
        price: service.price || 0
      }));

      // Create complete appointment object with services
      const completeAppointment = {
        ...data,
        services: transformedServices
      };

      // Add to local state immediately
      setAppointments(prev => [...prev, completeAppointment]);

      // Invia notifica al cliente se l'email è presente
      if (newAppointment.email && newAppointment.email.trim() !== '') {
        console.log("📧 Invio notifica di conferma al cliente:", newAppointment.email);
        
        try {
          const notificationData = {
            to: newAppointment.email,
            customerName: newAppointment.nome,
            serviceName: transformedServices.length > 0 ? transformedServices[0].name : "Servizio",
            appointmentDate: newAppointment.data,
            appointmentTime: newAppointment.orarioInizio,
            templateType: 'confirmation'
          };

          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData),
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log("✅ Notifica di conferma inviata con successo al cliente");
          } else {
            console.error("❌ Errore nell'invio notifica al cliente:", result.error);
          }
        } catch (notificationError) {
          console.error("❌ Errore generale nell'invio notifica al cliente:", notificationError);
        }
      } else {
        console.log("ℹ️ Nessuna email cliente disponibile per l'invio della notifica");
      }

      // Force refresh after a short delay to ensure real-time sync
      setTimeout(() => {
        fetchAppointments(true);
      }, 1000);

    } catch (error) {
      console.error("Errore nella creazione dell'appuntamento:", error);
    }
  };

  // OTTIMIZZATO: Separare i useEffect per migliorare le performance
  
  // useEffect 1: Caricamento dati critici (user + salon)
  useEffect(() => {
    const loadCriticalData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const user = userData?.user;

        if (userError || !user) {
          console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
          setIsLoadingMembers(false);
          return;
        }

        // Get salon_id using utility function (works for both managers and collaborators)
        const salonId = await getSalonId();

        if (!salonId) {
          console.error("Nessun salon_id trovato per l'utente");
          setIsLoadingMembers(false);
          return;
        }

        setSalonId(salonId);
        setUserId(user.id); // Set userId for task filtering

        // Carica team members e setting SizeCard
        const [teamResult, hoursSettingsResult] = await Promise.allSettled([
          supabase
            .from("team")
            .select("id, name, email, phone_number, ColorMember, avatar_url, visible_users, order_column")
            .eq("salon_id", salonId)
            .order('order_column', { ascending: true }),
          supabase
            .from("hoursettings")
            .select("hide_outside_hours, SizeCard, CardAlignment")
            .eq("user_id", user.id)
            .eq("salon_id", salonId)
            .single()
        ]);

        const teamData = teamResult.status === 'fulfilled' ? teamResult.value.data : [];
        const teamError = teamResult.status === 'fulfilled' ? teamResult.value.error : teamResult.reason;
        
        // Recupera tutti i setting dalla tabella hoursettings (impostazioni personali)
        if (hoursSettingsResult.status === 'fulfilled' && hoursSettingsResult.value.data) {
          setHideOutsideHoursSetting(hoursSettingsResult.value.data.hide_outside_hours || false);
          setCardSizeSetting(hoursSettingsResult.value.data.SizeCard || "normal");
          setCardAlignmentSetting(hoursSettingsResult.value.data.CardAlignment || "center");
        } else {
          // Default values se non trovato
          setHideOutsideHoursSetting(false);
          setCardSizeSetting("normal");
          setCardAlignmentSetting("center");
        }

        if (teamError) {
          console.error("Errore nel recupero dei membri del team:", teamError.message);
          setIsLoadingMembers(false);
          return;
        }

        const visibleMemberIds = teamData
          ?.filter(member => member.visible_users)
          .map(member => member.id) || [];

        setTeamMembers(teamData || []);
        setSelectedTeamMemberIds(visibleMemberIds);
        setIsLoadingMembers(false);

        // Carica appuntamenti solo dopo aver ottenuto i dati critici
        fetchAppointments(false, showDeletedAppointments);

      } catch (error) {
        console.error("Errore durante l'inizializzazione:", error);
        setIsLoadingMembers(false);
      }
    };

    loadCriticalData();
  }, []);

  // useEffect 2: Setup real-time subscriptions
  useEffect(() => {
    if (!salonId) return; // Wait for salonId to be available

    console.log('Setting up real-time subscriptions for day view...');

    // Setup appointments subscription with a small delay to ensure initial fetch completes first
    const setupSubscriptions = () => {
      console.log('Setting up appointments subscription for day view...');
      const appointmentsSub = setupAppointmentsSubscription(setAppointments);
      if (appointmentsSub) {
        appointmentsSubscriptionRef.current = appointmentsSub;
        console.log('Appointments subscription set up successfully');
      } else {
        console.log('Failed to set up appointments subscription');
      }

      // Setup deleted appointments subscription
      const deletedAppointmentsSub = setupDeletedAppointmentsSubscription(checkDeletedOrders);
      if (deletedAppointmentsSub) {
        deletedAppointmentsSubscriptionRef.current = deletedAppointmentsSub;
      }
    };

    // Small delay to ensure initial fetch completes before setting up real-time subscriptions
    const timer = setTimeout(setupSubscriptions, 100);

    // Listen for appointment creation events from navbar
    const removeEventListener = listenForAppointmentEvents(
      APPOINTMENT_EVENTS.CREATED,
      () => {
        console.log('Appointment created event received in day view, refreshing appointments...');
        fetchAppointments(true, showDeletedAppointments); // Force refresh
      }
    );

    // Listen for custom appointment created event
    const handleAppointmentCreated = () => {
      console.log('Custom appointment created event received in day view');
      // Force refresh to ensure real-time update
      fetchAppointments(true, showDeletedAppointments);
    };

    // Listen for custom appointment updated event
    const handleAppointmentUpdated = (detail: any) => {
      console.log('Custom appointment updated event received in day view:', detail);
      // Force refresh to ensure real-time update
      fetchAppointments(true, showDeletedAppointments);
    };

    const removeCreatedListener = listenForAppointmentEvents(APPOINTMENT_EVENTS.CREATED, handleAppointmentCreated);
    const removeUpdatedListener = listenForAppointmentEvents(APPOINTMENT_EVENTS.UPDATED, handleAppointmentUpdated);

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions for day view...');
      clearTimeout(timer);
      if (appointmentsSubscriptionRef.current) {
        appointmentsSubscriptionRef.current.unsubscribe();
        appointmentsSubscriptionRef.current = null;
      }
      if (deletedAppointmentsSubscriptionRef.current) {
        deletedAppointmentsSubscriptionRef.current.unsubscribe();
        deletedAppointmentsSubscriptionRef.current = null;
      }
      removeEventListener();
      removeCreatedListener();
      removeUpdatedListener();
    };
  }, [salonId]); // Depend on salonId

  // useEffect 3: Caricamento dati non critici in background
  useEffect(() => {
    const loadNonCriticalData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        // Carica dati non critici in parallelo
        await Promise.all([
          // Users per page
          supabase
            .from("users_per_page")
            .select("number")
            .eq("user_id", user.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                setMembersPerPage(data.number || 8);
              }
            }),
          
          // Groups
          supabase
            .from("groups")
            .select("*")
            .eq('salon_id', salonId)
            .then(({ data, error }) => {
              if (!error) {
                setGroups(data || []);
              }
            }),
          
          // Group members
          supabase
            .from("chat_group_members")
            .select("*, groups!inner(salon_id)")
            .eq('groups.salon_id', salonId)
            .then(({ data, error }) => {
              if (!error) {
                setGroupMembers(data || []);
              }
            }),
          
          // Time format
          getUserTimeFormat()
            .then(format => setTimeFormat(format as TimeFormat))
            .catch(() => setTimeFormat("24"))
        ]);

      } catch (error) {
        console.error("Errore nel caricamento dati non critici:", error);
      }
    };

    // Ritarda il caricamento dei dati non critici per non bloccare l'UI
    const timer = setTimeout(loadNonCriticalData, 100);
    return () => clearTimeout(timer);
  }, []);

  // useEffect 3: Setup subscriptions (dopo che i dati critici sono caricati)
  useEffect(() => {
    if (!salonId) return;

    // Setup subscriptions con debouncing
    let teamRefreshTimeout: NodeJS.Timeout;
    const subscription = supabase
      .channel('realtime:team')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team' }, () => {
        clearTimeout(teamRefreshTimeout);
        teamRefreshTimeout = setTimeout(() => fetchAppointments(true, showDeletedAppointments), 300); // Force refresh
      })
      .subscribe();

    let appointmentRefreshTimeout: NodeJS.Timeout;
    const appointmentSubscription = supabase
      .channel('realtime:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        clearTimeout(appointmentRefreshTimeout);
        appointmentRefreshTimeout = setTimeout(() => fetchAppointments(true, showDeletedAppointments), 200); // Force refresh
      })
      .subscribe();

    const removeEventListener = listenForAppointmentEvents(
      APPOINTMENT_EVENTS.CREATED,
              (detail) => fetchAppointments(true, showDeletedAppointments) // Force refresh
    );

    return () => {
      clearTimeout(teamRefreshTimeout);
      clearTimeout(appointmentRefreshTimeout);
      supabase.removeChannel(subscription);
      supabase.removeChannel(appointmentSubscription);
      removeEventListener();
    };
  }, [salonId]);



  // useEffect 4: Caricamento filtri stato (localStorage)
  useEffect(() => {
    const loadStatusFilters = () => {
      try {
        const savedFilters = localStorage.getItem('statusFilters');
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          if (Array.isArray(parsedFilters)) {
            setSelectedStatusFilters(parsedFilters);
          }
        }
      } catch (error) {
        console.error('Errore nel caricare i filtri di stato salvati:', error);
      }
    };

    loadStatusFilters();
  }, []);

  // OTTIMIZZAZIONE: Debouncing per gli appuntamenti per evitare re-render troppo frequenti
  useEffect(() => {
    console.log('Debounced appointments effect triggered', {
      appointmentsCount: appointments?.length || 0,
      hasAppointments: !!appointments
    });
    
    // Imposta immediatamente gli appuntamenti per evitare il delay visivo
    setDebouncedAppointments(appointments);
    
    // Usa il debouncing solo per il flag di rendering, non per i dati
    setIsCalendarRendering(true);
    const timer = setTimeout(() => {
      setIsCalendarRendering(false);
    }, 50); // 50ms di debouncing solo per il rendering

    return () => clearTimeout(timer);
  }, [appointments]);

  // OTTIMIZZAZIONE: Virtualizzazione con Intersection Observer
  useEffect(() => {
    if (!calendarContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleElements = entries.filter(entry => entry.isIntersecting);
        if (visibleElements.length === 0) return;

        const hourIndices = visibleElements.map(entry => 
          parseInt(entry.target.getAttribute('data-hour-index') || '0')
        );
        
        const start = Math.max(0, Math.min(...hourIndices) - 2); // Buffer di 2 ore
        const end = Math.min(24, Math.max(...hourIndices) + 2); // Buffer di 2 ore
        
        setVisibleHours({ start, end });
      },
      { 
        root: calendarContainerRef.current,
        rootMargin: '100px 0px', // Carica con margine di 100px
        threshold: 0.1 
      }
    );

    // Osserva tutte le righe delle ore
    const hourRows = calendarContainerRef.current.querySelectorAll('[data-hour-index]');
    hourRows.forEach(row => observer.observe(row));

    return () => observer.disconnect();
  }, []);

  // OTTIMIZZAZIONE: Calcola ore visibili con working hours
  const getVisibleHours = useMemo(() => {
    const userStartHour = parseInt(startHour.split(':')[0]);
    const userEndHour = parseInt(finishHour.split(':')[0]);
    
    // Durante orari di lavoro, renderizza tutte le ore
    const currentHour = new Date().getHours();
    const isWorkingHours = currentHour >= userStartHour && currentHour <= userEndHour;
    
    if (isWorkingHours || debouncedAppointments.length < 50) {
      return { start: 0, end: 24 }; // Render tutto se pochi appuntamenti
    }
    
    return visibleHours;
  }, [startHour, finishHour, visibleHours, debouncedAppointments.length]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    // Ottimizzazione: usa un debounce per evitare aggiornamenti troppo frequenti
    let updateTimeout: NodeJS.Timeout;
    
    const subscription = supabase
      .channel('realtime:orders_and_services')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          // Debounce per evitare aggiornamenti troppo frequenti
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(async () => {
            if (payload.eventType === 'INSERT') {
              // Skip tasks of other users
              const inserted = payload.new as { task?: boolean; user_id?: string; id: string };
              if (inserted?.task && currentUserId && inserted.user_id !== currentUserId) {
                return;
              }
              // Fetch services for the new order
              const { data: services } = await supabase
                .from("order_services")
                .select("*")
                .eq('order_id', payload.new.id);

              // Add the new appointment with its services
              setAppointments(prev => {
                // Check if the appointment already exists to avoid duplicates
                const exists = prev.some(app => app.id === payload.new.id);
                if (exists) {
                  return prev;
                }
                
                const newAppointment = {
                  ...payload.new as Appointment,
                  services: services || []
                };
                
                return [...prev, newAppointment];
              });
            } else if (payload.eventType === 'DELETE') {
              setAppointments(prev => 
                prev.filter(app => app.id !== payload.old.id)
              );
            } else if (payload.eventType === 'UPDATE') {
              // If this is a task belonging to another user, ensure it's not shown
              const updated = payload.new as { task?: boolean; user_id?: string; id: string };
              if (updated?.task && currentUserId && updated.user_id !== currentUserId) {
                setAppointments(prev => prev.filter(app => app.id !== updated.id));
                return;
              }
              // Fetch updated services
              const { data: services } = await supabase
                .from("order_services")
                .select("*")
                .eq('order_id', payload.new.id);

              setAppointments(prev => 
                prev.map(app => 
                  app.id === payload.new.id 
                    ? { ...(payload.new as Appointment), services: services || [] }
                    : app
                )
              );
            }
          }, 150);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_services' },
        async (payload) => {
          // Debounce anche per i servizi
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(async () => {
            const orderId = (payload.new as { order_id: string })?.order_id || (payload.old as { order_id: string })?.order_id;
            
            // Fetch all services for the affected order
            const { data: services } = await supabase
              .from("order_services")
              .select("*")
              .eq('order_id', orderId);

            // Update the appointments state
            setAppointments(prev => 
              prev.map(app => 
                app.id === orderId 
                  ? { ...app, services: services || [] }
                  : app
              )
            );
          }, 150);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(updateTimeout);
      supabase.removeChannel(subscription);
    };
  }, [currentUserId]);
useEffect(() => {
  const fetchCalendarHours = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
      return;
    }

    const { data, error } = await supabase
      .from("hoursettings")
      .select("start_hour, finish_hour")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Errore nel recupero degli orari del calendario:", error.message);
    } else {
      setStartHour(data?.start_hour || "00:00");
      setFinishHour(data?.finish_hour || "23:59");
    }
  };

  fetchCalendarHours();
}, []);

  useEffect(() => {
    if (!isMonthlyView) {
      setTimeout(() => {
        currentHourRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [isMonthlyView, dailyViewDate]);

  // Calculate filtered members (memoized)
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) =>
      selectedTeamMemberIds.includes(member.id)
    );
  }, [teamMembers, selectedTeamMemberIds]);

  // OTTIMIZZATO: Memo con cache e calcolo lazy per le colonne usando debouncedAppointments
  const memberColumnData = useMemo(() => {
    if (filteredMembers.length === 0 || debouncedAppointments.length === 0) {
      return {};
    }
    
    const result: { [key: string]: ReturnType<typeof organizeAppointmentsInDynamicColumns> } = {};
    const selectedDateStr = format(dailyViewDate, "yyyy-MM-dd");
    
    // Pre-filtra gli appuntamenti per la data selezionata per evitare calcoli ripetuti
    const todayAppointments = debouncedAppointments.filter(appointment => 
      appointment.data === selectedDateStr && 
      (showDeletedAppointments || appointment.status !== 'Eliminato')
    );
    
    // Solo se ci sono appuntamenti oggi, calcola le colonne
    if (todayAppointments.length === 0) {
      filteredMembers.forEach(member => {
        result[member.id] = { 
          columns: {}, 
          subColumns: {}, 
          totalSubColumns: {}, 
          overlappingMap: {},
          totalColumns: 1 
        };
      });
      return result;
    }
    
    // Calcola solo per i membri che hanno effettivamente appuntamenti
    const membersWithAppointments = filteredMembers.filter(member => 
      todayAppointments.some(apt => apt.team_id === member.id)
    );
    
    membersWithAppointments.forEach(member => {
      result[member.id] = organizeAppointmentsInDynamicColumns(todayAppointments, member.id, dailyViewDate);
    });
    
    // Aggiungi risultati vuoti per membri senza appuntamenti
    filteredMembers.forEach(member => {
      if (!result[member.id]) {
        result[member.id] = { 
          columns: {}, 
          subColumns: {}, 
          totalSubColumns: {}, 
          overlappingMap: {},
          totalColumns: 1 
        };
      }
    });
    
    return result;
  }, [debouncedAppointments, filteredMembers, dailyViewDate, showDeletedAppointments]);

  // Calculate displayed members (sliding window, memoized)
  const displayedMembers = useMemo(() => {
    if (filteredMembers.length <= 4)
      return filteredMembers;
    return filteredMembers.slice(startMemberIndex, startMemberIndex + 4);
  }, [filteredMembers, startMemberIndex]);

  // Navigation controls
  const slideNext = useCallback(() => {
    if (startMemberIndex + 4 < filteredMembers.length) {
      setStartMemberIndex(startMemberIndex + 1);
    }
  }, [startMemberIndex, filteredMembers.length]);

  const slidePrev = useCallback(() => {
    if (startMemberIndex > 0) {
      setStartMemberIndex(startMemberIndex - 1);
    }
  }, [startMemberIndex]);

  // Check if there are more members to display
  const hasMoreLeft = startMemberIndex > 0;
  const hasMoreRight = startMemberIndex + 4 < filteredMembers.length;

  // Update startMemberIndex if the filtered list changes
  useEffect(() => {
    if (startMemberIndex > filteredMembers.length - 4 && filteredMembers.length > 4) {
      setStartMemberIndex(Math.max(0, filteredMembers.length - 4));
    } else if (startMemberIndex > 0 && filteredMembers.length <= 4) {
      setStartMemberIndex(0);
    }
  }, [filteredMembers.length, startMemberIndex]);

  // Handle team member visibility toggle - ottimizzato con useCallback
  const handleToggleMember = useCallback(async (memberId: string) => {
    // Controllo veloce prima di elaborare
    if (selectedTeamMemberIds.includes(memberId) && selectedTeamMemberIds.length <= 1) {
      toast({
        title: "Impossibile deselezionare",
        description: "Devi avere almeno un membro selezionato",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    let updatedMembers: string[];
    if (selectedTeamMemberIds.includes(memberId)) {
      updatedMembers = selectedTeamMemberIds.filter(id => id !== memberId);
    } else {
      updatedMembers = [...selectedTeamMemberIds, memberId];
    }
    
    setSelectedTeamMemberIds(updatedMembers);
    
    // Operazione localStorage asincrona per non bloccare l'UI
    try {
      localStorage.setItem('selectedTeamMemberIds', JSON.stringify(updatedMembers));
    } catch (error) {
      console.error("Errore nel salvataggio della selezione:", error);
    }
  }, [selectedTeamMemberIds, toast]); // Rimosso teamMembers dalle dipendenze

  // Funzioni fetchGroups e fetchGroupMembers rimosse - ora integrate nel useEffect ottimizzato

  // Handle group change
  const handleGroupChange = useCallback(async (groupId: string | null) => {
    setSelectedGroupId(groupId);
    
    if (!groupId) {
      // If no group selected, show all team members
      if (teamMembers.length === 0) {
        return;
      }
      const allMemberIds = teamMembers.map(member => member.id);
      setSelectedTeamMemberIds(allMemberIds);
      // Salva in localStorage
      try {
        localStorage.setItem('selectedTeamMemberIds', JSON.stringify(allMemberIds));
        localStorage.setItem('selectedGroupId', '');
      } catch (error) {
        console.error("Errore nel salvataggio della selezione:", error);
      }
      return;
    }
    // Filter team members by the selected group
    const groupMemberIds = groupMembers
      .filter(gm => gm.group_id === groupId)
      .map(gm => gm.team_member_id);
    
    if (groupMemberIds.length === 0) {
      // Fallback a tutti i membri disponibili se il gruppo è vuoto
      if (teamMembers.length > 0) {
        const allMemberIds = teamMembers.map(member => member.id);
        setSelectedTeamMemberIds(allMemberIds);
        try {
          localStorage.setItem('selectedTeamMemberIds', JSON.stringify(allMemberIds));
          localStorage.setItem('selectedGroupId', '');
        } catch (error) {
          console.error("Errore nel salvataggio della selezione:", error);
        }
      }
      return;
    }
    
    setSelectedTeamMemberIds(groupMemberIds);
    // Salva in localStorage
    try {
      localStorage.setItem('selectedTeamMemberIds', JSON.stringify(groupMemberIds));
      localStorage.setItem('selectedGroupId', groupId);
    } catch (error) {
      console.error("Errore nel salvataggio della selezione:", error);
    }
  }, [teamMembers, groupMembers]);

  // Calculate group-filtered members (memoized)
  const groupFilteredMembers = useMemo(() =>
    selectedGroupId
      ? teamMembers.filter(member => groupMembers
          .filter(gm => gm.group_id === selectedGroupId)
          .map(gm => gm.team_member_id)
          .includes(member.id))
      : teamMembers,
    [selectedGroupId, teamMembers, groupMembers]
  );

  // OTTIMIZZATO: Memoized filtered appointments usando debouncedAppointments
  const filteredAppointments = useMemo(() => {
    return debouncedAppointments.filter((appointment) => {
      // First filter by team member
      const teamFilter = selectedTeamMemberIds.length === 0 ? true : selectedTeamMemberIds.includes(appointment.team_id);
      // Then filter by status - show/hide "Eliminato" appointments based on toggle
      const statusFilter = showDeletedAppointments ? true : appointment.status !== 'Eliminato';
      
      // Show all appointments and tasks for the salon (consistent with weekly/monthly views)
      
      return teamFilter && statusFilter;
    });
  }, [debouncedAppointments, selectedTeamMemberIds, showDeletedAppointments, userId]);

  // Refetch appointments when showDeletedAppointments changes
  useEffect(() => {
    if (salonId) {
      fetchAppointments(false, showDeletedAppointments);
    }
  }, [showDeletedAppointments]);

  // Save showDeletedAppointments to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showDeletedAppointments', JSON.stringify(showDeletedAppointments));
    }
  }, [showDeletedAppointments]);

  // DEBUG: useEffect rimosso per migliorare le performance - evita re-render ad ogni cambio appointments



  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  // Use paginatedMembers for pagination (memoized)
  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice(
      (currentPage - 1) * membersPerPage,
      currentPage * membersPerPage
    );
  }, [filteredMembers, currentPage, membersPerPage]);

  const checkDeletedOrders = async () => {
    const { data, error } = await supabase
      .from('Deleted_Orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error checking Deleted_Orders:', error);
      return;
    }
    
    setCanUndo(data && data.length > 0);
    if (data && data.length > 0) {
      setLastDeletedAppointment(data[0]);
    }
  };

  const moveAppointmentToDeletedOrders = async (appointmentId: string) => {
    try {
      // Recupera l'appuntamento corrente
      const { data: appointmentData, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", appointmentId)
        .single();

      if (fetchError) throw fetchError;

      if (appointmentData) {
        // Rimuovere il campo id per permettere a Supabase di generare un nuovo id
        const { id, ...appointmentWithoutId } = appointmentData;
        setLastDeletedAppointment(appointmentData);  // Salva l'appuntamento cancellato

        // Inserisci l'appuntamento in Deleted_Orders
        const { error: insertError } = await supabase
          .from("Deleted_Orders")
          .insert(appointmentWithoutId);

        if (insertError) throw insertError;

        // Rimuovi l'appuntamento da orders
        const { error: deleteError } = await supabase
          .from("orders")
          .delete()
          .eq("id", appointmentId);

        if (deleteError) throw deleteError;

        // Aggiorna lo stato localmente
        setAppointments((prev) => prev.filter((app) => app.id !== appointmentId));
        checkDeletedOrders();
      }
    } catch (error) {
      console.error("Errore durante lo spostamento dell'appuntamento:", error);
    }
  };

  const handleDelete = async (appointmentId: string) => {
    try {
      await moveAppointmentToDeletedOrders(appointmentId);
      // Clear localStorage after deletion
      localStorage.removeItem('selectedTeamMemberIds');
      localStorage.removeItem('selectedGroupId');
    } catch (error) {
      console.error("Errore nella cancellazione dell'appuntamento:", error);
    }
  };



  // Gestione click/tap su card: apre il modal di modifica appuntamento
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [editOrderInitialData, setEditOrderInitialData] = useState<{ data: string; orarioInizio: string; orarioFine: string } | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [isEditServicesOpen, setIsEditServicesOpen] = useState(false); // State for EditServicesModal
  const [isTaskEditModalOpen, setIsTaskEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | Appointment | null>(null);
  

  // Gestione click/tap su card: apre il dialog di modifica appuntamento
  const handleCardClick = (appointment: Appointment, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // Non aprire il modal se stiamo facendo resize
    if (isResizing) return;

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
    updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string; status?: string }
  ) => {
    if (!selectedAppointment) return;
    
    console.log('handleSaveServices called with:', { services, updatedData });
    console.log('Services count:', services.length);
    
    const originalServices = selectedAppointment.services || [];
    
    // Update local state immediately for services, date, times, and status
    setAppointments(prev => prev.map(app =>
      app.id === selectedAppointment.id ? { 
        ...app, 
        services,
        ...(updatedData && updatedData)
      } : app
    ));
    
    // Update selectedAppointment state as well
    if (updatedData) {
      setSelectedAppointment(prev => prev ? { ...prev, ...updatedData } : prev);
    }
    
    try {
      // Handle new services (those with temp_ prefix) and existing services
      const newServices = services.filter(s => s.id.startsWith('temp_'));
      const existingServices = services.filter(s => !s.id.startsWith('temp_'));
      
      console.log('Processing services:', { newServices, existingServices });
      
      // Insert new services
      if (newServices.length > 0) {
        const newServiceInserts = newServices.map(service => ({
          order_id: selectedAppointment.id,
          servizio: service.name,
          price: service.price
        }));
        
        console.log('Inserting new services:', newServiceInserts);
        
        const { error: insertError } = await supabase
          .from('order_services')
          .insert(newServiceInserts);
          
        if (insertError) {
          console.error('Error inserting new services:', insertError);
          throw insertError;
        }
      }
      
      // Update existing services
      for (const service of existingServices) {
        console.log('Updating service:', service);
        
        const { error: updateError } = await supabase
          .from('order_services')
          .update({
            servizio: service.name,
            price: service.price
          })
          .eq('id', service.id);
          
        if (updateError) {
          console.error('Error updating service:', service.id, updateError);
          throw updateError;
        }
      }
      
      // Delete services that were removed (exist in original but not in new)
      const removedServices = originalServices.filter(
        original => !services.find(s => s.id === original.id)
      );
      
      console.log('Removed services:', removedServices);
      
      if (removedServices.length > 0) {
        const { error: deleteError } = await supabase
          .from('order_services')
          .delete()
          .in('id', removedServices.map(s => s.id));
          
        if (deleteError) {
          console.error('Error deleting removed services:', deleteError);
          throw deleteError;
        }
      }
      
      // Fetch updated services from database to get correct IDs
      await fetchAppointments(false, showDeletedAppointments);
      
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
        const updatedServices = app.services?.filter(service => service.id !== serviceId) || [];
        return { ...app, services: updatedServices };
      }
      return app;
    }));

    // Update selectedAppointment as well to keep modal in sync
    setSelectedAppointment(prev => {
      if (!prev) return prev;
      const updatedServices = prev.services?.filter(service => service.id !== serviceId) || [];
      return { ...prev, services: updatedServices };
    });
    
    // Delete service from order_services table using both service_id and order_id
    try {
      const { error } = await supabase
        .from('order_services')
        .delete()
        .eq('service_id', serviceId)
        .eq('order_id', orderId);
      
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

const handleDragStart = (e: React.DragEvent<HTMLDivElement>, appt: Appointment) => {
  if (appt.status === 'pagato' || appt.status === 'Eliminato') {
    e.preventDefault(); // Explicitly prevent drag for paid appointments and eliminated appointments
    return;
  }

  // Controlla i permessi per modificare l'appuntamento
  if (hasPermission) {
    canEditAppointment(appt.team_id, hasPermission || (() => false)).then(canEdit => {
      if (!canEdit) {
        e.preventDefault(); // Prevent drag if user cannot edit the appointment
        return;
      }
    });
  }
  
  // Check if document is available (for SSR compatibility)
  if (typeof document === 'undefined') return;
  
  e.dataTransfer.effectAllowed = "move"; // Set allowed effect
  e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  e.dataTransfer.setData("appointmentId", appt.id);

  // AGGIORNATO: Cleanup di eventuali elementi rimasti da drag precedenti
  if (typeof document !== 'undefined') {
    const existingGhostLine = document.getElementById('drag-ghost-line');
    if (existingGhostLine) existingGhostLine.remove();
    const existingBubble = document.getElementById('drag-ghost-bubble');
    if (existingBubble) existingBubble.remove();
  }

  // AGGIORNATO: Crea la ghost line con stili più robusti
  const ghostLine = document.createElement('div');
  ghostLine.id = 'drag-ghost-line';
  ghostLine.style.position = 'fixed';
  ghostLine.style.width = '200px';
  ghostLine.style.height = '3px';
  ghostLine.style.background = 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)';
  ghostLine.style.zIndex = '9999';
  ghostLine.style.pointerEvents = 'none';
  ghostLine.style.borderRadius = '2px';
  ghostLine.style.opacity = '0';
  ghostLine.style.left = '-1000px';
  ghostLine.style.top = '-1000px';
  ghostLine.style.boxShadow = 'none';
  ghostLine.style.transition = 'none'; // Disabilita le transizioni per performance
  document.body.appendChild(ghostLine);

  // AGGIORNATO: Cleanup più robusto
  const handleDragEnd = () => {
    // Cancella eventuali frame pendenti
    if (dragAnimationFrame.current) {
      window.cancelAnimationFrame(dragAnimationFrame.current);
      dragAnimationFrame.current = null;
    }
    
    if (typeof document !== 'undefined') {
      const ghostLine = document.getElementById('drag-ghost-line');
      if (ghostLine) ghostLine.remove();
      const bubble = document.getElementById('drag-ghost-bubble');
      if (bubble) bubble.remove();
    }
    
    // Reset degli stati
    setDragPreview(null);
    
    // Clear drag cache on drag end
    dragCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
    
    if (e.currentTarget) {
      e.currentTarget.removeEventListener('dragend', handleDragEnd);
    }
  };
  
  if (e.currentTarget) {
    e.currentTarget.addEventListener('dragend', handleDragEnd);
  }
};  const calculateOffsetMinutes = (e: React.DragEvent | MouseEvent, cellRect: DOMRect) => {
    const offsetY = e.clientY - cellRect.top;
    const fractionOfHour = offsetY / cellRect.height;
    return 60 * fractionOfHour;
  };

  // Optimized function to get cell info with caching and throttling
  const getCachedCellInfo = (
    clientX: number, 
    clientY: number, 
    cacheRef: React.MutableRefObject<{
      lastCellElement: Element | null;
      lastCellRect: DOMRect | null;
      lastUpdate: number;
    }>,
    throttleMs = 16 // ~60fps throttling
  ) => {
    const now = Date.now();
    
    // Throttle DOM queries to improve performance
    if (now - cacheRef.current.lastUpdate < throttleMs) {
      return {
        element: cacheRef.current.lastCellElement,
        rect: cacheRef.current.lastCellRect
      };
    }
    
    const elementUnderCursor = document.elementFromPoint(clientX, clientY);
    const nearestCell = elementUnderCursor?.closest('td');
    
    if (nearestCell) {
      const cellRect = nearestCell.getBoundingClientRect();
      // Update cache
      cacheRef.current = {
        lastCellElement: nearestCell,
        lastCellRect: cellRect,
        lastUpdate: now
      };
      return { element: nearestCell, rect: cellRect };
    }
    
    return { element: null, rect: null };
  };

  // Funzione per verificare se un orario è fuori dall'orario di lavoro
  const isOutsideWorkingHours = (time: Date): boolean => {
    if (!hideOutsideHoursSetting) return false;
    
    const timeStr = format(time, "HH:mm");
    const isBeforeStart = timeStr < startHour;
    const isAfterFinish = timeStr > finishHour;
    
    return isBeforeStart || isAfterFinish;
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLTableCellElement>,
    hourTime: Date,
    memberId: string
  ) => {
    e.preventDefault();
    
    if (typeof document === 'undefined') return;

    const cellRect = e.currentTarget.getBoundingClientRect();
    const offsetMinutes = calculateOffsetMinutes(e, cellRect);
    const newDropTime = snapTo5Minutes(new Date(hourTime.getTime() + offsetMinutes * 60000));

    // Recupera l'appuntamento che si sta trascinando
    const appointmentId = e.dataTransfer.getData("appointmentId");
    let isEndOutsideHours = false;
    
    if (appointmentId) {
      const draggedAppointment = appointments.find(app => app.id === appointmentId);
      if (draggedAppointment) {
        // Calcola la durata dell'appuntamento
        const originalStart = parse(draggedAppointment.orarioInizio, "HH:mm", new Date());
        const originalEnd = parse(draggedAppointment.orarioFine, "HH:mm", new Date());
        const durationMinutes = differenceInMinutes(originalEnd, originalStart);
        
        // Verifica se l'orario di fine sarebbe fuori dall'orario di lavoro
        const endTime = addMinutes(newDropTime, durationMinutes);
        isEndOutsideHours = isOutsideWorkingHours(endTime);
      }
    }

    // Verifica se l'orario di drop è fuori dall'orario di lavoro
    const isOutsideHours = isOutsideWorkingHours(newDropTime) || isEndOutsideHours;
    
    // Imposta l'effetto di drop in base al risultato
    if (isOutsideHours) {
      e.dataTransfer.dropEffect = "none";
    } else {
      e.dataTransfer.dropEffect = "move";
    }

    // Aggiorna lo stato solo se cambia la cella o il time slot (non a ogni pixel)
    if (!dragPreview || dragPreview.time.getTime() !== newDropTime.getTime() || dragPreview.memberId !== memberId) {
      setDragPreview({ time: newDropTime, memberId });
    }

    // Salva i dati dell'ultimo dragOver
    lastDragOverData.current = { time: newDropTime, memberId, clientX: e.clientX, clientY: e.clientY };

    // AGGIORNATO: Gestione più stabile della ghost line
    // Cancella il frame precedente se esiste
    if (dragAnimationFrame.current) {
      window.cancelAnimationFrame(dragAnimationFrame.current);
    }

    // Usa requestAnimationFrame per aggiornare la linea blu solo una volta per frame
    dragAnimationFrame.current = window.requestAnimationFrame(() => {
      dragAnimationFrame.current = null;
      const dragData = lastDragOverData.current;
      if (!dragData) return;
      
      const { clientX, clientY } = dragData;
      
      // Ottieni la cella target
      const { rect: cachedCellRect } = getCachedCellInfo(clientX, clientY, dragCacheRef);
      const targetRect = cachedCellRect || cellRect;

      // AGGIORNATO: Gestione più robusta della ghost line
      let ghostLine = document.getElementById('drag-ghost-line');
      if (!ghostLine) {
        ghostLine = document.createElement('div');
        ghostLine.id = 'drag-ghost-line';
        ghostLine.style.position = 'fixed';
        ghostLine.style.height = '3px';
        ghostLine.style.zIndex = '9999';
        ghostLine.style.pointerEvents = 'none';
        ghostLine.style.borderRadius = '2px';
        ghostLine.style.boxShadow = 'none';
        ghostLine.style.transition = 'none'; // Disabilita le transizioni per performance
        document.body.appendChild(ghostLine);
      }

      // AGGIORNATO: Aggiorna sempre la posizione e il colore
      ghostLine.style.left = `${targetRect.left}px`;
      ghostLine.style.width = `${targetRect.width}px`;
      ghostLine.style.top = `${clientY}px`;

      // Cambia il colore della linea in base al fatto che sia fuori orario
      if (isOutsideHours) {
        ghostLine.style.background = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
        ghostLine.style.opacity = '0.8';
      } else {
        ghostLine.style.background = 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)';
        ghostLine.style.opacity = '0.9';
      }

      // AGGIORNATO: Gestione più robusta della bubble
      let bubble = document.getElementById('drag-ghost-bubble');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'drag-ghost-bubble';
        bubble.style.position = 'absolute';
        bubble.style.left = '50%';
        bubble.style.transform = 'translateX(-50%)';
        bubble.style.padding = '4px 12px';
        bubble.style.borderRadius = '6px';
        bubble.style.fontSize = '12px';
        bubble.style.fontWeight = 'bold';
        bubble.style.whiteSpace = 'nowrap';
        bubble.style.top = '-28px';
        bubble.style.boxShadow = 'none';
        bubble.style.transition = 'none'; // Disabilita le transizioni per performance
        ghostLine.appendChild(bubble);
      }

      // Cambia il colore e il testo della bubble in base al fatto che sia fuori orario
      if (isOutsideHours) {
        bubble.style.background = '#ef4444';
        bubble.style.color = 'white';
        let newTimeText = `${formatTime(dragData.time, timeFormat)} - Fuori orario`;
        
        // Se l'appuntamento si estenderebbe oltre l'orario di lavoro, mostra un messaggio più specifico
        if (isEndOutsideHours && !isOutsideWorkingHours(dragData.time)) {
          newTimeText = `${formatTime(dragData.time, timeFormat)} - Si estenderebbe oltre l'orario`;
        }
        
        bubble.textContent = newTimeText;
      } else {
        bubble.style.background = '#3b82f6';
        bubble.style.color = 'white';
        bubble.textContent = formatTime(dragData.time, timeFormat);
      }
    });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableCellElement>) => {
    // AGGIORNATO: Gestione più precisa del dragLeave
    const relatedTarget = e.relatedTarget as Element;
    
    // Verifica se stiamo effettivamente uscendo dal calendario
    const isLeavingCalendar = !relatedTarget || !relatedTarget.closest('table');
    const isLeavingCell = relatedTarget && !relatedTarget.closest('td');
    
    // Solo nascondi la preview se stiamo effettivamente uscendo dal calendario
    if (isLeavingCalendar) {
      // Cancella eventuale frame in coda
      if (dragAnimationFrame.current) {
        window.cancelAnimationFrame(dragAnimationFrame.current);
        dragAnimationFrame.current = null;
      }
      
      setDragPreview(null);
      
      // Nascondi la ghost line solo quando esci completamente dal calendario
      if (typeof document !== 'undefined') {
        const ghostLine = document.getElementById('drag-ghost-line');
        if (ghostLine) {
          ghostLine.style.opacity = '0.3';
        }
        // Rimuovi la bubble
        const bubble = document.getElementById('drag-ghost-bubble');
        if (bubble) bubble.remove();
      }
      
      // Clear drag cache when leaving calendar
      dragCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
    }
    // Se stiamo solo passando da una cella all'altra, non fare nulla
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLTableCellElement>,
    hourTime: Date,
    memberId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const appointmentId = e.dataTransfer.getData("appointmentId");
    if (!appointmentId) return;
  
    const cellRect = e.currentTarget.getBoundingClientRect();
    const offsetMinutes = calculateOffsetMinutes(e, cellRect);
    const newDropTime = new Date(hourTime.getTime() + offsetMinutes * 60000);
    const droppedDate = snapTo5Minutes(newDropTime);

    // Verifica se l'orario di drop è fuori dall'orario di lavoro
    const isOutsideHours = isOutsideWorkingHours(droppedDate);
    
    if (isOutsideHours) {
      // Mostra un toast di avviso
      toast({
        title: "Impossibile spostare l'appuntamento",
        description: `Non è possibile spostare l'appuntamento fuori dall'orario di lavoro (${startHour} - ${finishHour})`,
        variant: "destructive",
      });
      
      // Rimuovi gli elementi visivi del drag
      setDragPreview(null);
      if (typeof document !== 'undefined') {
        const ghostLine = document.getElementById('drag-ghost-line');
        if (ghostLine) ghostLine.remove();
        const bubble = document.getElementById('drag-ghost-bubble');
        if (bubble) bubble.remove();
      }
      if (dragAnimationFrame.current) {
        window.cancelAnimationFrame(dragAnimationFrame.current);
        dragAnimationFrame.current = null;
      }
      dragCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
      
      return;
    }
  
    // Trova l'appuntamento originale
    const originalAppointment = appointments.find(app => app.id === appointmentId);
    if (!originalAppointment) return;
  
    // Calcola la durata originale in minuti
    const originalStart = parse(originalAppointment.orarioInizio, "HH:mm", new Date());
    const originalEnd = parse(originalAppointment.orarioFine, "HH:mm", new Date());
    const durationMinutes = differenceInMinutes(originalEnd, originalStart);
  
    // Calcola il nuovo orario di fine mantenendo la stessa durata
    const newStart = format(droppedDate, "HH:mm");
    const newEnd = format(
      addMinutes(droppedDate, durationMinutes),
      "HH:mm"
    );

    // Verifica anche se l'orario di fine è fuori dall'orario di lavoro
    const endTime = addMinutes(droppedDate, durationMinutes);
    const isEndOutsideHours = isOutsideWorkingHours(endTime);
    
    if (isEndOutsideHours) {
      // Mostra un toast di avviso
      toast({
        title: "Impossibile spostare l'appuntamento",
        description: `L'appuntamento si estenderebbe oltre l'orario di lavoro (${startHour} - ${finishHour})`,
        variant: "destructive",
      });
      
      // Rimuovi gli elementi visivi del drag
      setDragPreview(null);
      if (typeof document !== 'undefined') {
        const ghostLine = document.getElementById('drag-ghost-line');
        if (ghostLine) ghostLine.remove();
        const bubble = document.getElementById('drag-ghost-bubble');
        if (bubble) bubble.remove();
      }
      if (dragAnimationFrame.current) {
        window.cancelAnimationFrame(dragAnimationFrame.current);
        dragAnimationFrame.current = null;
      }
      dragCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
      
      return;
    }
    
    const targetDateStr = format(dailyViewDate, "yyyy-MM-dd");
    const updatedAppointment = {
      ...originalAppointment,
      orarioInizio: newStart,
      orarioFine: newEnd,
      data: targetDateStr,
      team_id: memberId,
    };
    
    // OTTIMIZZAZIONE: Aggiorna immediatamente lo stato locale per movimento veloce
    setAppointments(prev => 
      prev.map(app => 
        app.id === appointmentId ? updatedAppointment : app
      )
    );

    // AGGIORNATO: Pulizia più robusta degli elementi visivi del drag
    setDragPreview(null);
    
    // Cancella eventuale frame in coda PRIMA di rimuovere gli elementi
    if (dragAnimationFrame.current) {
      window.cancelAnimationFrame(dragAnimationFrame.current);
      dragAnimationFrame.current = null;
    }
    
    // Rimuovi la linea blu e la bubble subito dopo il drop
    if (typeof document !== 'undefined') {
      const ghostLine = document.getElementById('drag-ghost-line');
      if (ghostLine) ghostLine.remove();
      const bubble = document.getElementById('drag-ghost-bubble');
      if (bubble) bubble.remove();
      
      // Pulizia aggiuntiva per sicurezza
      const allDragElements = document.querySelectorAll('[id*="drag-ghost"]');
      allDragElements.forEach(el => el.remove());
    }
    
    // Clear drag cache after operation
    dragCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
  
    // Aggiorna il database in background senza bloccare l'UI
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          orarioInizio: newStart,
          orarioFine: newEnd,
          data: targetDateStr,
          team_id: memberId,
        })
        .eq("id", appointmentId);
  
      if (error) {
        console.error("Errore nell'aggiornamento:", error.message);
        // In caso di errore, ripristina lo stato precedente
        setAppointments(prev => 
          prev.map(app => 
            app.id === appointmentId ? originalAppointment : app
          )
        );
      } else {
        // Dispatch a specific event for appointment moves to ensure Sidebar updates
        dispatchAppointmentEvent(APPOINTMENT_EVENTS.UPDATED);
        console.log('Dispatched appointment updated event after move');
      }
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      // In caso di errore, ripristina lo stato precedente
      setAppointments(prev => 
        prev.map(app => 
          app.id === appointmentId ? originalAppointment : app
        )
      );
      
      // Dispatch event even on error to ensure Sidebar is notified
      dispatchAppointmentEvent(APPOINTMENT_EVENTS.UPDATED);
      console.log('Dispatched appointment updated event after move error');
    }

    // Add white border to the moved card
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const movedCard = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
        if (movedCard) {
          movedCard.classList.add('border-white');
          setTimeout(() => {
            movedCard.classList.remove('border-white');
          }, 2000);
        }
      }, 50); // Small delay to ensure DOM is updated
    }
  };

const handleResizeStart = (e: React.MouseEvent, appointment: Appointment) => {
  if (appointment.status === 'pagato' || appointment.status === 'Eliminato') return; // Prevent resizing if status is "pagato" or "Eliminato"
  
  // Controlla i permessi per modificare l'appuntamento
  if (hasPermission) {
    canEditAppointment(appointment.team_id, hasPermission || (() => false)).then(canEdit => {
      if (!canEdit) {
        return; // Prevent resize if user cannot edit the appointment
      }
    });
  }
  
  // Check if document is available (for SSR compatibility)
  if (typeof document === 'undefined') return;
  e.stopPropagation();
  
  const startTime = parse(appointment.orarioInizio, "HH:mm", new Date());
  const endTime = parse(appointment.orarioFine, "HH:mm", new Date());
  const duration = differenceInMinutes(endTime, startTime);
  
  // Solo imposta lo stato di resize, NON modificare la card visivamente
  setResizing({
    appointment,
    startY: e.clientY,
    initialDuration: duration
  });
  
  // NON modificare la card o creare elementi visivi qui
  // Questo verrà fatto solo quando l'utente inizia effettivamente a muovere il mouse
  e.preventDefault();
};

const handleResizeMove = (e: MouseEvent) => {
  if (!resizing) return;
  
  // Check if document is available (for SSR compatibility)
  if (typeof document === 'undefined') return;
  
  // Controllo di sicurezza: se resizing è null, non procedere
  if (!resizing) {
    // Cleanup di sicurezza
    const resizeGhostLine = document.getElementById('resize-ghost-line');
    if (resizeGhostLine) resizeGhostLine.remove();
    const bubble = document.getElementById('resize-ghost-bubble');
    if (bubble) bubble.remove();
    return;
  }
  
  // Al primo movimento del mouse, inizializza gli elementi visivi
  if (!document.getElementById('resize-ghost-line')) {
    setIsResizing(true); // Imposta il flag di resize solo quando inizia il movimento
    
    // Modifica la card solo quando inizia il movimento
    const resizeHandle = document.querySelector(`[data-appointment-id="${resizing.appointment.id}"] .cursor-ns-resize`);
    const card = resizeHandle?.closest('.shadow-md');
    if (card) {
      card.classList.add('z-[1000]', 'resizing-card');
      (card as HTMLElement).style.position = 'absolute';
    }
    
    // Crea la linea fantasma solo quando inizia il movimento
    const resizeGhostLine = document.createElement('div');
    resizeGhostLine.id = 'resize-ghost-line';
    resizeGhostLine.style.position = 'fixed';
    resizeGhostLine.style.width = '200px';
    resizeGhostLine.style.height = '3px';
    resizeGhostLine.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
    resizeGhostLine.style.zIndex = '9999';
    resizeGhostLine.style.pointerEvents = 'none';
    resizeGhostLine.style.borderRadius = '2px';
    resizeGhostLine.style.opacity = '0.9';
    resizeGhostLine.style.left = '-1000px';
    resizeGhostLine.style.top = '-1000px';
    resizeGhostLine.style.boxShadow = 'none';
    document.body.appendChild(resizeGhostLine);
  }
  
  // Use requestAnimationFrame with improved throttling for consistent 60fps
  if ((window as any).resizeAnimationFrame) {
    cancelAnimationFrame((window as any).resizeAnimationFrame);
  }
  
  (window as any).resizeAnimationFrame = requestAnimationFrame(() => {
    if (!resizing) return;
    
    const deltaY = e.clientY - resizing.startY;
    const minutesDelta = Math.round((deltaY / hourHeight) * 60 / 5) * 5;
    const newDuration = Math.max(resizing.initialDuration + minutesDelta, 5);
    
    // Optimized cell detection with caching (removed 5px threshold)
    const { rect: cachedCellRect } = getCachedCellInfo(e.clientX, e.clientY, resizeCacheRef);
    
    // Update ghost line position with improved performance
    const resizeGhostLine = document.getElementById('resize-ghost-line');
    if (resizeGhostLine) {
      const targetY = e.clientY;
      
      if (cachedCellRect) {
        // Use cached cell rect for smooth updates without threshold
        resizeGhostLine.style.left = `${cachedCellRect.left}px`;
        resizeGhostLine.style.width = `${cachedCellRect.width}px`;
      } else {
        // Fallback: keep the last known width and position, just update Y
        if (!resizeGhostLine.style.left || resizeGhostLine.style.left === '-1000px') {
          resizeGhostLine.style.left = `${e.clientX - 100}px`;
          resizeGhostLine.style.width = '200px';
        }
      }
      
      resizeGhostLine.style.top = `${targetY}px`;
      resizeGhostLine.style.opacity = '0.9';
      resizeGhostLine.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
      resizeGhostLine.style.boxShadow = 'none';
      
      // Calculate the new end time for the bubble
      const startTime = parse(resizing.appointment.orarioInizio, "HH:mm", new Date());
      const newEndTime = addMinutes(startTime, newDuration);
      const newEndTimeStr = format(newEndTime, "HH:mm");
      
      // Verifica se il nuovo orario di fine è fuori dall'orario di lavoro
      const isEndOutsideHours = isOutsideWorkingHours(newEndTime);
      
      // Add or update duration bubble - only if time changed
      let bubble = document.getElementById('resize-ghost-bubble');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'resize-ghost-bubble';
        bubble.style.position = 'absolute';
        bubble.style.left = '50%';
        bubble.style.transform = 'translateX(-50%)';
        bubble.style.padding = '4px 12px';
        bubble.style.borderRadius = '6px';
        bubble.style.fontSize = '12px';
        bubble.style.fontWeight = 'bold';
        bubble.style.whiteSpace = 'nowrap';
        bubble.style.top = '-28px';
        bubble.style.boxShadow = 'none';
        resizeGhostLine.appendChild(bubble);
      }
      
      // Cambia il colore e il testo della bubble in base al fatto che sia fuori orario
      if (isEndOutsideHours) {
        bubble.style.background = '#ef4444';
        bubble.style.color = 'white';
        const bubbleText = `${newEndTimeStr} - Fuori orario`;
        if (bubble.textContent !== bubbleText) {
          bubble.textContent = bubbleText;
        }
        
        // Cambia anche il colore della linea fantasma
        resizeGhostLine.style.background = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
        resizeGhostLine.style.opacity = '0.8';
      } else {
        bubble.style.background = '#10b981';
        bubble.style.color = 'white';
        if (bubble.textContent !== newEndTimeStr) {
          bubble.textContent = newEndTimeStr;
        }
        
        // Ripristina il colore normale della linea fantasma
        resizeGhostLine.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
        resizeGhostLine.style.opacity = '0.9';
      }
    }
    
    // Only update state if duration has actually changed
    if (newDuration !== resizing.newDuration) {
        setResizing((prev) => prev ? { ...prev, newDuration } : null);
        setResizeGhost({
            top: (parse(resizing.appointment.orarioInizio, "HH:mm", new Date()).getMinutes() / 60) * 100,
            height: (newDuration / 60) * 100,
        });
    }
  });
};
const handleResizeEnd = async () => {
  if (!resizing) return;

  // Cancel any pending animation frame
  if ((window as any).resizeAnimationFrame) {
    cancelAnimationFrame((window as any).resizeAnimationFrame);
    (window as any).resizeAnimationFrame = null;
  }

  // PULIZIA IMMEDIATA E FORZATA di tutti gli elementi di resize
  const cleanupResizeElements = () => {
    if (typeof document !== 'undefined') {
      // Rimuovi la ghost line
      const resizeGhostLine = document.getElementById('resize-ghost-line');
      if (resizeGhostLine) {
        resizeGhostLine.remove();
      }
      
      // Rimuovi la bubble
      const bubble = document.getElementById('resize-ghost-bubble');
      if (bubble) {
        bubble.remove();
      }

      // Rimuovi le classi di resize dalle card
      document.querySelectorAll('.resizing-card').forEach(el => {
        el.classList.remove('z-[1000]', 'resizing-card');
        (el as HTMLElement).style.position = '';
      });

      // Rimuovi anche eventuali elementi con ID simili che potrebbero essere rimasti
      document.querySelectorAll('[id*="resize-ghost"]').forEach(el => {
        el.remove();
      });
    }
  };

  // Esegui la pulizia immediatamente
  cleanupResizeElements();

  const startTime = parse(resizing.appointment.orarioInizio, "HH:mm", new Date());
  const newEndTime = addMinutes(startTime, resizing.newDuration ?? resizing.initialDuration);
  const newEndTimeStr = format(newEndTime, "HH:mm");

  // Verifica se il nuovo orario di fine è fuori dall'orario di lavoro
  const isEndOutsideHours = isOutsideWorkingHours(newEndTime);
  
  if (isEndOutsideHours) {
    // Mostra un toast di avviso
    toast({
      title: "Impossibile ridimensionare l'appuntamento",
      description: `L'appuntamento si estenderebbe oltre l'orario di lavoro (${startHour} - ${finishHour})`,
      variant: "destructive",
    });
    
    // Reset immediato degli stati
    setResizeGhost(null);
    setResizing(null);
    setIsResizing(false);
    
    // Clear resize cache after operation
    resizeCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
    
    // Esegui una seconda pulizia per sicurezza
    setTimeout(cleanupResizeElements, 50);
    
    return;
  }

  // Solo se c'è stata una modifica effettiva della durata
  if (resizing.newDuration && resizing.newDuration !== resizing.initialDuration) {
    const updatedAppointment = {
      ...resizing.appointment,
      orarioFine: newEndTimeStr
    };

    // OTTIMIZZAZIONE: Aggiorna immediatamente lo stato locale per resize veloce
    setAppointments(prev => 
      prev.map(app => 
        app.id === resizing.appointment.id ? updatedAppointment : app
      )
    );

    // Aggiorna il database in background senza bloccare l'UI
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          orarioFine: newEndTimeStr,
        })
        .eq("id", resizing.appointment.id);

      if (error) {
        console.error("Error updating appointment:", error);
        // In caso di errore, ripristina lo stato precedente
        setAppointments(prev => 
          prev.map(app => 
            app.id === resizing.appointment.id ? resizing.appointment : app
          )
        );
      }
    } catch (error) {
      console.error("Errore nel salvataggio resize:", error);
      // In caso di errore, ripristina lo stato precedente
      setAppointments(prev => 
        prev.map(app => 
          app.id === resizing.appointment.id ? resizing.appointment : app
        )
      );
    }
  }

  // Reset immediato degli stati
  setResizeGhost(null);
  setResizing(null);
  setIsResizing(false);
  
  // Clear resize cache after operation
  resizeCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
  
  // Esegui una seconda pulizia per sicurezza dopo un breve delay
  setTimeout(cleanupResizeElements, 50);
};

useEffect(() => {
  if (resizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
  } else {
      setResizeGhost(null); // Reset del ghost
      
      // Cleanup aggiuntivo quando resizing diventa null
      if (typeof document !== 'undefined') {
        const resizeGhostLine = document.getElementById('resize-ghost-line');
        if (resizeGhostLine) resizeGhostLine.remove();
        const bubble = document.getElementById('resize-ghost-bubble');
        if (bubble) bubble.remove();
        
        document.querySelectorAll('.resizing-card').forEach(el => {
          el.classList.remove('z-[1000]', 'resizing-card');
          (el as HTMLElement).style.position = '';
        });
      }
  }
  return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      
      // Cleanup di sicurezza nel return
      if (typeof document !== 'undefined') {
        const resizeGhostLine = document.getElementById('resize-ghost-line');
        if (resizeGhostLine) resizeGhostLine.remove();
        const bubble = document.getElementById('resize-ghost-bubble');
        if (bubble) bubble.remove();
      }
  };
}, [resizing]);


  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.classList.add('z-50');
  };
  
  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('z-50');
  };


  // Mostra un menu dropdown quando si clicca su una cella
  const handleCellClick = (hourTime: Date, memberId: string, event?: React.MouseEvent) => {
    if (isResizing) return; // Prevent cell click while resizing
    
    // Per i manager, admin e owner, consenti sempre la creazione di appuntamenti
    if (userRole === 'manager' || userRole === 'admin' || userRole === 'owner') {
      if (event) {
        event.stopPropagation();
        setCellClickDropdown({
          isOpen: true,
          hourTime,
          memberId,
          x: event.clientX,
          y: event.clientY,
        });
      }
      return;
    }
    
    // Controlla se l'utente ha i permessi per creare appuntamenti
    if (!hasPermission || !hasPermission('canCreateAppointments')) {
      return; // Non aprire il dropdown se non ha i permessi
    }
    
    if (event) {
      event.stopPropagation();
      setCellClickDropdown({
        isOpen: true,
        hourTime,
        memberId,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleCreateAppointment = () => {
    if (!cellClickDropdown) return;
    const selectedDate = format(dailyViewDate, "yyyy-MM-dd");
    const startTime = format(cellClickDropdown.hourTime, "HH:mm");
    const endTime = format(addMinutes(cellClickDropdown.hourTime, 30), "HH:mm");
    setInitialFormData({
      data: selectedDate,
      orarioInizio: startTime,
      orarioFine: endTime,
      team_id: cellClickDropdown?.memberId,
    });
    setIsCreateOrderOpen(true);
    setIsDialogOpen(false); // Ensure DialogDay is closed
    setCellClickDropdown(null);
  };

  const handleCreatePausa = () => {
    if (!cellClickDropdown) return;
    const selectedDate = format(dailyViewDate, "yyyy-MM-dd");
    const startTime = format(cellClickDropdown.hourTime, "HH:mm");
    const endTime = format(addMinutes(cellClickDropdown.hourTime, 30), "HH:mm");
    setInitialFormData({
      data: selectedDate,
      orarioInizio: startTime,
      orarioFine: endTime,
      team_id: cellClickDropdown?.memberId,
    });
    setIsCreatePausaOpen(true);
    setCellClickDropdown(null);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedAppointment) return;
    
    try {
      // Remove from Deleted_Orders
      await supabase
        .from('Deleted_Orders')
        .delete()
        .eq('data', lastDeletedAppointment.data)
        .eq('orarioInizio', lastDeletedAppointment.orarioInizio)
        .eq('orarioFine', lastDeletedAppointment.orarioFine)
        .eq('nome', lastDeletedAppointment.nome);

      // Add back to Orders
      await supabase
        .from('orders')
        .insert(lastDeletedAppointment);

      setLastDeletedAppointment(null);
      fetchAppointments(false, showDeletedAppointments);
      await checkDeletedOrders(); // Aggiorna lo stato dopo il ripristino
    } catch (error) {
      console.error('Error restoring appointment:', error);
    }
  };

  useEffect(() => {
    checkDeletedOrders();

    // Sottoscrivi ai cambiamenti nella tabella Deleted_Orders
    const subscription = supabase
      .channel('deleted_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Deleted_Orders' },
        () => {
          checkDeletedOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedAppointment) return;
  
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return;
  
    const { error } = await supabase
      .from('orders')
      .update({ 
        stato: newStatus,
        status: newStatus, // Save the status in the orders table
        user_id: userData.user.id // Save the user_id with the status
      })
      .eq('id', selectedAppointment.id);
  
    if (error) {
      console.error('Error updating status:', error);
    } else {
      setCurrentStatus(newStatus);
      
      // Aggiorna immediatamente lo stato locale dell'appuntamento
      setAppointments(prev => 
        prev.map(app => 
          app.id === selectedAppointment.id 
            ? { ...app, status: newStatus }
            : app
        )
      );
      
      // Ricarica gli appuntamenti per sicurezza
      fetchAppointments(false, showDeletedAppointments);
    }
  };

  // Function to handle trash icon click for pause appointments
  const handlePauseDelete = async (appointment: Appointment, e: React.MouseEvent) => {
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
        fetchAppointments(true, showDeletedAppointments);
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

// Funzione per calcolare lo stile di background della card appuntamento
// Funzione per calcolare la luminosità di un colore hex
function getLuminance(hex: string): number {
  const rgb = hex.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) || [0, 0, 0];
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Funzione per calcolare il contrasto tra due colori
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Funzione per adattare i colori per il dark mode
function adaptColorForDarkMode(color: string): string {
  const isDarkMode = document.documentElement.classList.contains('dark');
  if (!isDarkMode) return color;
  
  // Se il colore è troppo chiaro per il dark mode, lo scuriamo
  const luminance = getLuminance(color);
  if (luminance > 0.5) {
    // Converti in RGB, scurisci e riconverti in hex
    const rgb = color.match(/[A-Za-z0-9]{2}/g)?.map(v => parseInt(v, 16)) || [0, 0, 0];
    const darkened = rgb.map(c => Math.max(0, c * 0.6)); // Scura del 40%
    return `#${darkened.map(c => c.toString(16).padStart(2, '0')).join('')}`;
  }
  
  return color;
}

function getAppointmentCardStyle(appointment: Appointment): React.CSSProperties {
  // Supporta sia stringa che array (ma sempre array da Supabase)
  let colors: string[] = [];
  if (Array.isArray(appointment.color_card)) {
    colors = appointment.color_card.filter(c => typeof c === 'string' && c.startsWith('#'));
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
  
  const style = appointment.prefer_card_style || 'filled';
  // Alone luminoso
  const alone = appointment.alone || '';
  let boxShadow = undefined;
  if (alone && alone !== '' && colors.length > 0) {
    const alonePx = parseInt(String(alone)); // Più ampio per effetto luminoso
    // Glow luminoso: spread e blur, più trasparente
    boxShadow = `0 0 ${alonePx * 2}px ${alonePx}px ${colors[0]}, 0 0 ${alonePx * 3}px ${alonePx * 2}px ${colors[0]}55, 0 0 ${alonePx * 4}px ${alonePx * 3}px ${colors[0]}33`;
  }
  
  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  if (colors.length === 0) {
    return { 
      background: isDarkMode ? '#1e293b' : '#fff', // slate-800 in dark mode
      boxShadow 
    };
  }
  
  // Adatta i colori per il dark mode
  const adaptedColors = colors.map(color => adaptColorForDarkMode(color));
  
  if (style === 'filled') {
    if (adaptedColors.length === 2) {
      return { background: `linear-gradient(90deg, ${adaptedColors[0]}, ${adaptedColors[1]})`, boxShadow };
    } else {
      return { background: adaptedColors[0], boxShadow };
    }
  }
  
  if (style === 'top' || style === 'bottom' || style === 'left' || style === 'right') {
    return {
      background: isDarkMode ? '#1e293b' : '#fff', // slate-800 in dark mode
      boxShadow
    };
  }
  
  // fallback
  return { 
    background: isDarkMode ? '#1e293b' : '#fff', // slate-800 in dark mode
    boxShadow 
  };
}
const renderCalendarGrid = () => {
  const startTime = parse("00:00", "HH:mm", new Date());
  const finishTime = parse("23:59", "HH:mm", new Date());
  const userStartTime = parse(startHour, "HH:mm", new Date());
  const userFinishTime = parse(finishHour, "HH:mm", new Date());
  const totalMinutes = differenceInMinutes(finishTime, startTime);
  const hours = Array.from({ length: 24 }, (_, i) => {
    const time = new Date(startTime.getTime() + i * 60 * 60 * 1000); // Increment by 1 hour
    return formatTime(time, timeFormat);
  });

  // Calcola le ore visibili se hideOutsideHoursSetting è attivo
  const visibleHours = hideOutsideHoursSetting 
    ? hours.filter((time, index) => {
        const currentHourStr = time;
        const isBeforeStart = currentHourStr < startHour;
        const isAfterFinish = currentHourStr > finishHour;
        return !isBeforeStart && !isAfterFinish;
      })
    : hours;

  // Calcola l'intervallo dinamico basato sugli appuntamenti e orari di lavoro
  const getDynamicTimeRange = () => {
    if (hideOutsideHoursSetting) {
      // Se nascondi fuori orario, usa solo l'intervallo di lavoro
      return {
        startHour: parse(startHour, "HH:mm", new Date()).getHours(),
        endHour: parse(finishHour, "HH:mm", new Date()).getHours()
      };
    }

    // Se non nascondi fuori orario, mostra tutte le 24 ore come nella vista settimanale
    return {
      startHour: 0,
      endHour: 23
    };
  };

  const dynamicRange = getDynamicTimeRange();
  const dynamicHours = hours.slice(dynamicRange.startHour, dynamicRange.endHour + 1);

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinutes;
  const startTotalMinutes = startTime.getHours() * 60 + startTime.getMinutes();

  // OTTIMIZZAZIONE: Mostra loading anche durante il rendering del calendario
  if (isLoadingMembers && teamMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Caricamento configurazione calendario...</p>
      </div>
    );
  }

  // OTTIMIZZAZIONE: Indicatore di rendering quando stanno cambiando gli appuntamenti - RIMOSSO
  // if (isCalendarRendering && debouncedAppointments.length === 0) {
  //   return (
  //     <div className="flex items-center justify-center h-full min-h-[400px]">
  //       <div className="text-center">
  //         <div className="animate-pulse rounded-full h-6 w-6 bg-purple-600 mx-auto mb-2"></div>
  //         <p className="text-xs text-gray-500">Aggiornamento calendario...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
              {/* Mobile view */}
        {isMobile && showMobileView && (
          <MobileDayView
            appointments={appointments}
            teamMembers={teamMembers}
            selectedDate={dailyViewDate}
            onDateChange={setDailyViewDate}
            onCreateAppointment={handleCreateAppointment}
            hasPermission={hasPermission}
            userRole={userRole}
            updateModalState={updateModalState}
            // Pass toggle functions for mobile navbar
            toggleDay={toggleDay}
            toggleClients={toggleClients}
            toggleServices={toggleServices}
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
        )}
      
      {/* Desktop view */}
      {(!isMobile || !showMobileView) && (
        <>
          {/* Navbar Secondaria - Hidden on mobile */}
          <NavbarSecondaria
            dailyViewDate={dailyViewDate}
            setDailyViewDate={setDailyViewDate}
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
            selectedTeamMemberIds={selectedTeamMemberIds}
            handleToggleMember={handleToggleMember}
            hourHeight={hourHeight}
            onHourHeightChange={setHourHeight}
            teamMembers={teamMembers}
            appointments={appointments}
            selectedStatusFilters={selectedStatusFilters}
            setSelectedStatusFilters={setSelectedStatusFilters}
            showDeletedAppointments={showDeletedAppointments}
            setShowDeletedAppointments={setShowDeletedAppointments}
            daysToShow={daysToShow}
            setDaysToShow={setDaysToShow}
            setSelectedTeamMemberIds={setSelectedTeamMemberIds}
          />
          
          <div className="flex-1 overflow-auto" style={{ margin: 0, padding: 0 }}>
        <div className="relative w-full min-w-fit h-full" ref={calendarContainerRef}>
          {/* Desktop Date Picker Modal */}
          {showDatePicker && (
            <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Seleziona Data</h2>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
                    >
                      <X className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
                
                {/* Quick date options */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        handleDateChange(new Date());
                        setShowDatePicker(false);
                      }}
                      className="p-3 text-center rounded-xl bg-blue-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-100 dark:hover:bg-slate-700 transition-all duration-200"
                      disabled={isDateChanging}
                    >
                      Oggi
                    </button>
                    <button
                      onClick={() => {
                        handleDateChange(addDays(new Date(), 1));
                        setShowDatePicker(false);
                      }}
                      className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                      disabled={isDateChanging}
                    >
                      Domani
                    </button>
                    <button
                      onClick={() => {
                        handleDateChange(addDays(new Date(), 7));
                        setShowDatePicker(false);
                      }}
                      className="p-3 text-center rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                      disabled={isDateChanging}
                    >
                      +7 giorni
                    </button>
                  </div>
                </div>
                
                {/* Calendar grid */}
                <div className="p-6">
                  {(() => {
                    const today = new Date();
                    const currentMonth = dailyViewDate.getMonth();
                    const currentYear = dailyViewDate.getFullYear();
                    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
                    const startDate = new Date(firstDayOfMonth);
                    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
                    
                    const days = [];
                    for (let i = 0; i < 42; i++) {
                      const date = new Date(startDate);
                      date.setDate(startDate.getDate() + i);
                      days.push(date);
                    }
                    
                    return (
                      <div>
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-6">
                          <button
                            onClick={() => {
                              const newDate = new Date(currentYear, currentMonth - 1, Math.min(dailyViewDate.getDate(), new Date(currentYear, currentMonth, 0).getDate()));
                              handleDateChange(newDate);
                            }}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                            disabled={isDateChanging}
                          >
                            <FaChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </button>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {(() => {
                              const months = [
                                t('month.january', 'Gennaio'),
                                t('month.february', 'Febbraio'),
                                t('month.march', 'Marzo'),
                                t('month.april', 'Aprile'),
                                t('month.may', 'Maggio'),
                                t('month.june', 'Giugno'),
                                t('month.july', 'Luglio'),
                                t('month.august', 'Agosto'),
                                t('month.september', 'Settembre'),
                                t('month.october', 'Ottobre'),
                                t('month.november', 'Novembre'),
                                t('month.december', 'Dicembre')
                              ];
                              const month = months[currentMonth];
                              return `${month} ${currentYear}`;
                            })()}
                          </h3>
                          <button
                            onClick={() => {
                              const newDate = new Date(currentYear, currentMonth + 1, Math.min(dailyViewDate.getDate(), new Date(currentYear, currentMonth + 2, 0).getDate()));
                              handleDateChange(newDate);
                            }}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                            disabled={isDateChanging}
                          >
                            <FaChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                        
                        {/* Days of week */}
                        <div className="grid grid-cols-7 gap-1 mb-3">
                          {[
                            t('day.sunday', 'Dom'),
                            t('day.monday', 'Lun'),
                            t('day.tuesday', 'Mar'),
                            t('day.wednesday', 'Mer'),
                            t('day.thursday', 'Gio'),
                            t('day.friday', 'Ven'),
                            t('day.saturday', 'Sab')
                          ].map((day) => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                          {days.map((date, index) => {
                            const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                            const isSelected = format(date, 'yyyy-MM-dd') === format(dailyViewDate, 'yyyy-MM-dd');
                            const isCurrentMonth = date.getMonth() === currentMonth;
                            const hasAppointments = appointments.some(apt => apt.data === format(date, 'yyyy-MM-dd') && apt.status !== t('calendar.deleted', 'Eliminato'));
                            
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  handleDateChange(date);
                                  setShowDatePicker(false);
                                }}
                                className={`
                                  relative p-4 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105
                                  ${isSelected 
                                    ? 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-300' 
                                    : isToday 
                                      ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/40 ring-1 ring-purple-300' 
                                      : isCurrentMonth 
                                        ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700' 
                                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }
                                  ${hasAppointments && !isSelected ? 'after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-2 after:h-2 after:bg-purple-400 after:rounded-full' : ''}
                                `}
                                disabled={isDateChanging}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          
          {/* Main calendar table */}
          <table 
            className="w-full border-separate border-spacing-0 border-x border-[#EDEDED] dark:border-gray-700 min-w-[900px] font-apple bg-[#F7F8FA] dark:bg-gray-900"
            style={{
              height: hideOutsideHoursSetting 
                ? `${hourHeight * visibleHours.length}px`
                : `${hourHeight * dynamicHours.length}px`
            }}
          >
            <thead className="sticky top-0 z-40 shadow-md">
              <tr className="h-12 bg-[#F8F9FA] dark:bg-gray-800 border-b border-[#EDEDED] dark:border-gray-700">
                <th
                  className="text-base font-semibold text-slate-700 dark:text-gray-200 w-24 bg-[#F8F9FA] dark:bg-gray-800 border-r border-[#EDEDED] dark:border-gray-700 p-0 m-0 text-center pr-4 select-none"
                  style={{ top: 0, position: 'sticky', zIndex: 41, minWidth: 90 }}
                >
                  {t('calendar.time', 'Ora')}
                </th>

                {filteredMembers.map((member) => {
                  // Conta gli appuntamenti per il membro nella giornata selezionata
                  const dailyAppointmentCount = appointments.filter(
                    (appointment) =>
                      appointment.team_id === member.id &&
                      appointment.data === format(dailyViewDate, "yyyy-MM-dd") &&
                      appointment.status !== t('calendar.deleted', 'Eliminato')
                  ).length;
                  return (
                    <th
                      key={member.id}
                      className="text-sm font-normal text-slate-700 dark:text-gray-200 bg-[#F8F9FA] dark:bg-gray-800 border-r border-[#EDEDED] dark:border-gray-700 p-0 m-0 text-center select-none"
                      style={{ width: `${100 / filteredMembers.length}%`, minWidth: '150px' }}
                    >
                      <div className="flex items-center justify-center gap-2 py-2 relative">
                        <LazyAvatar member={member} className="h-8 w-8" />
                        <span className="font-normal">{member.name}</span>
                        {/* FocusIcon accanto al nome membro */}
                        <FocusIcon
                          focused={focusedMemberId === member.id}
                          onClick={e => {
                            e.stopPropagation();
                            setFocusedMemberId(focusedMemberId === member.id ? null : member.id);
                          }}
                        />
                        {/* Notifica appuntamenti giornalieri spostata a destra - stile professionale */}
                        <span
                          className="inline-flex items-center justify-center ml-2"
                          style={{ minWidth: 24, minHeight: 24 }}
                        >
                          <span
                            className="rounded-full bg-white border border-purple-600 text-purple-700 text-xs font-semibold px-2 py-0.5 shadow-sm transition-colors duration-150"
                            style={{
                              minWidth: 24,
                              minHeight: 24,
                              fontSize: 13,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 4px 0 rgba(80, 0, 120, 0.08)',
                              letterSpacing: '0.01em',
                              fontWeight: 600
                            }}
                            title="Appuntamenti in giornata"
                          >
                            {dailyAppointmentCount}
                          </span>
                        </span>
                      </div>
                    </th>
                  );
                })}

              </tr>
            </thead>
            <tbody className="relative">
              {/* Current time indicator */}
              <div 
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{
                  top: (() => {
                    const currentTotalMinutes = currentHour * 60 + currentMinutes;
                    const startTotalMinutes = parse(startHour, "HH:mm", new Date()).getHours() * 60 + parse(startHour, "HH:mm", new Date()).getMinutes();
                    const finishTotalMinutes = parse(finishHour, "HH:mm", new Date()).getHours() * 60 + parse(finishHour, "HH:mm", new Date()).getMinutes();
                    const totalCellMinutes = visibleHours.length * 60;
                    const totalHeight = hourHeight * visibleHours.length;
                    if (hideOutsideHoursSetting) {
                      // Hide or clamp line outside work hours
                      if (currentTotalMinutes < startTotalMinutes || currentTotalMinutes > finishTotalMinutes) {
                        return "-1000px";
                      }
                      const relativeMinutes = currentTotalMinutes - startTotalMinutes;
                      const position = (relativeMinutes / totalCellMinutes) * totalHeight;
                      return `${position}px`;
                    } else {
                      // Usa l'intervallo dinamico per calcolare la posizione
                      const totalDynamicMinutes = (dynamicRange.endHour - dynamicRange.startHour + 1) * 60;
                      const currentMinutesFromStart = (currentHour - dynamicRange.startHour) * 60 + currentMinutes;
                      
                      // Verifica se l'ora corrente è nell'intervallo dinamico
                      if (currentHour >= dynamicRange.startHour && currentHour <= dynamicRange.endHour) {
                        return `${(currentMinutesFromStart / totalDynamicMinutes) * (hourHeight * dynamicHours.length)}px`;
                      } else {
                        // Se l'ora corrente è fuori dall'intervallo, non mostrare l'indicatore
                        return '-1000px';
                      }
                    }
                  })(),
                  transform: 'translateY(-50%)',
                  zIndex: 30
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-3 w-3 rounded-full -ml-2 animate-pulse shadow-lg" style={{ backgroundColor: '#4ca7a8' }} />
                  <div className="h-[1px] w-full shadow-sm" style={{ backgroundColor: '#4ca7a8' }} />
                </div>
              </div>
              {(hideOutsideHoursSetting ? visibleHours : dynamicHours).map((time, visibleIndex) => {
                // Trova l'indice originale nell'array completo delle ore
                const originalIndex = hours.indexOf(time);
                const hourTime = new Date(startTime.getTime() + originalIndex * 60 * 60 * 1000);
                const isCurrentHour =
                  originalIndex === currentHour &&
                  format(dailyViewDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isOutsideRange = hourTime < userStartTime || hourTime > userFinishTime;
                const currentHourStr = format(hourTime, "HH:mm");
              
                // Check if current hour is before start time or after finish time
                const isBeforeStart = currentHourStr < startHour;
                const isAfterFinish = currentHourStr > finishHour;
                const isOutsideWorkHours = isBeforeStart || isAfterFinish;
                
                // OTTIMIZZAZIONE: Virtualizzazione - renderizza solo ore visibili
                const visibleRange = getVisibleHours;
                const isHourVisible = originalIndex >= visibleRange.start && originalIndex <= visibleRange.end;
                
                return (
                    <tr
                    key={originalIndex}
                    data-hour-index={originalIndex}
                    ref={originalIndex === currentTime.getHours() ? currentHourRef : null}
                    style={{ 
                      height: hideOutsideHoursSetting 
                        ? `max(${hourHeight}px, 160px)`
                        : `${hourHeight}px`
                    }}
                    className="bg-[#fafafa] dark:bg-gray-900" // Cambiato da bg-white a un grigio leggermente più scuro
                    >
                    {/* Colonna orari */}
                    <td
                      className="w-24 border-r border-[#EDEDED] dark:border-gray-700 bg-[#F8F9FA] dark:bg-gray-800 text-center align-top relative select-none"
                      style={{
                        minWidth: 90,
                        padding: 0,
                        margin: 0,
                        minHeight: hideOutsideHoursSetting ? `${hourHeight}px` : `${hourHeight}px`,
                        height: hideOutsideHoursSetting ? `${hourHeight}px` : `${hourHeight}px`,
                        position: 'relative',
                        verticalAlign: 'top',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'stretch',
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                        boxSizing: 'border-box',
                      }}>
                        <span className="flex items-center justify-center w-full h-full text-[15px] font-semibold text-slate-700 dark:text-gray-200 leading-5 text-center" style={{height: '25%', minHeight: 0, padding: 0, margin: 0, boxSizing: 'border-box'}}>
                          {time}
                        </span>
                        {[15, 30, 45].map((minutes, subIndex) => {
                          const quarterTime = new Date(hourTime.getTime() + minutes * 60 * 1000);
                          return (
                            <span
                              key={subIndex}
                              className="flex items-center justify-center w-full text-[12px] text-slate-600 dark:text-gray-400 leading-4 text-center"
                              style={{
                                height: '25%',
                                minHeight: 0,
                                padding: 0,
                                margin: 0,
                                boxSizing: 'border-box',
                              }}
                            >
                              {format(quarterTime, 'HH:mm')}
                            </span>
                          );
                        })}
                        {/* Highlight ora corrente */}
                        {isCurrentHour && (
                          <div
                            className="absolute left-0 right-0 top-0 h-[2px] bg-blue-600 animate-pulse"
                            style={{ zIndex: 3 }}
                          ></div>
                        )}
                        <div
                          className="absolute left-0 right-0 bg-[#EDEDED] dark:bg-gray-700"
                          style={{ zIndex: 2, top: '-1.8px', height: '2px' }}
                        ></div>
                      </div>
                    </td>
                    {filteredMembers.map((member, columnIndex) => (
                      <td
                      key={member.id}
                      className={[
                        'border-r border-[#EDEDED] dark:border-gray-700 relative group transition-all duration-200',
                        isCurrentHour ? 'z-[1]' : '',
                        isOutsideWorkHours ? 'bg-[#F5F6F7] dark:bg-gray-800' : '',
                        focusedMemberId && focusedMemberId !== member.id ? 'calendar-col-dimmed' : ''
                      ].join(' ')}
                      style={{
                        padding: 0,
                        margin: 0,
                        minHeight: hideOutsideHoursSetting ? `${hourHeight}px` : `${hourHeight}px`,
                        height: hideOutsideHoursSetting ? `${hourHeight}px` : `${hourHeight}px`,
                        position: 'relative',
                      }}
                      onDragOver={(e) => handleDragOver(e, hourTime, member.id)}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, hourTime, member.id)}
                      >
                      {/* Creare 4 sub-celle da 15 minuti ciascuna */}
                      {[0, 15, 30, 45].map((minutes, subIndex) => {
                        const quarterTime = new Date(hourTime.getTime() + minutes * 60 * 1000);
                        return (
                        <div
                          key={subIndex}
                          className={[
                            "absolute left-0 right-0 h-[25%] transition-all duration-200 cursor-pointer",
                            "border-b border-dashed border-[#E2E8F0]",
                            isOutsideWorkHours ? "hover:bg-[#EAEBEC]" : "hover:bg-[#EBF2FF]"
                          ].join(" ")}
                          style={{ top: `${(minutes / 60) * 100}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellClick(quarterTime, member.id, e);
                          }}
                        />
                        );
                      })}
                      
                      {dragPreview &&
                        dragPreview.memberId === member.id &&
                        format(dragPreview.time, "HH") === format(hourTime, "HH") && (
                        // Removed blue overlay, only ghost line and bubble are shown
                        null
                      )}
                      
                      {debouncedAppointments
                        .filter(
                          (appointment) =>
                            appointment.team_id === member.id &&
                            appointment.data === format(dailyViewDate, "yyyy-MM-dd") &&
                            (
                              showDeletedAppointments || appointment.status !== t('calendar.deleted', 'Eliminato')
                            ) &&
                            parse(appointment.orarioInizio, "HH:mm", new Date()).getHours() === hourTime.getHours() &&
                            (selectedStatusFilters.length === 0 || 
                              selectedStatusFilters.includes(appointment.status) ||
                              (selectedStatusFilters.includes('') && !appointment.status) ||
                              (selectedStatusFilters.some(filter => filter === null) && appointment.status === null)
                            )
                        )
                        .sort((a, b) => {
                        // Sort by start time first
                        const startTimeA = parse(a.orarioInizio, "HH:mm", new Date());
                        const startTimeB = parse(b.orarioInizio, "HH:mm", new Date());
                        return startTimeA.getTime() - startTimeB.getTime();
                        })
                        .map((appointment, i, filteredAppointments) => {
                        if (isCompactMode) {
                          return (
                          <div
                            key={appointment.id}
                            className="text-xs text-gray-700 flex items-center justify-center"
                            style={{
                            padding: "5px",
                            background: teamMembers.find(member => member.id === appointment.team_id)?.ColorMember || '#e4b875', // Usa il colore del membro o un colore di fallback
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            marginLeft: `${i * 5}px`, // Shift overlapping cards to the right
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            }}
                          >
                            {appointment.nome} ({appointment.orarioInizio} - {appointment.orarioFine})
                          </div>
                          );
                        } else {
                          const startTimeParsed = parse(appointment.orarioInizio, "HH:mm", new Date());
                          const endTimeParsed = parse(appointment.orarioFine, "HH:mm", new Date());
                          const duration = differenceInMinutes(endTimeParsed, startTimeParsed);
            
                          // Utilizza la nuova logica di organizzazione delle colonne
                          const memberColData = memberColumnData[appointment.team_id];
                          const { subColumns, totalSubColumns, overlappingMap } = memberColData || { subColumns: {}, totalSubColumns: {}, overlappingMap: {} };
                          
                          const isOverlapping = overlappingMap[appointment.id] || false;
                          const subColumn = subColumns[appointment.id] || 0;
                          const totalSubColumn = totalSubColumns[appointment.id] || 1;
                          
                          const memberColor = teamMembers.find(member => member.id === appointment.team_id)?.ColorMember || '#e4b875';
                          
                          // Gestisci i colori personalizzati delle card
                          let cardColor = appointment.status === 'pagato' ? 'gray' : memberColor;
                          
                          // Se la card ha colori personalizzati, usali
                          if (appointment.color_card) {
                            let colors: string[] = [];
                            if (Array.isArray(appointment.color_card)) {
                              colors = appointment.color_card.filter(c => typeof c === 'string' && c.startsWith('#'));
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
                            
                            if (colors.length > 0) {
                              const isDarkMode = document.documentElement.classList.contains('dark');
                              const adaptedColors = colors.map(color => adaptColorForDarkMode(color));
                              cardColor = adaptedColors[0]; // Usa il primo colore per la card
                            }
                          }

                          // Controlla se la card Pausa è in conflitto con altri appuntamenti
                          const isPausaInConflict = appointment.status === 'Pausa' && appointments.some(otherAppointment => 
                            otherAppointment.id !== appointment.id &&
                            otherAppointment.team_id === appointment.team_id &&
                            otherAppointment.data === appointment.data &&
                            otherAppointment.status !== 'Eliminato' &&
                            otherAppointment.status !== 'Pausa' &&
                            doAppointmentsOverlap(appointment, otherAppointment)
                          );

                          const isCurrentTimeAbove = startTotalMinutes <= currentTotalMinutes &&
                          currentTotalMinutes <= startTotalMinutes + totalMinutes &&
                          originalIndex === Math.floor((currentTotalMinutes - startTotalMinutes) / 60) &&
                          parse(appointment.orarioInizio, "HH:mm", new Date()) <= currentTime &&
                          currentTime <= parse(appointment.orarioFine, "HH:mm", new Date());

                          // Calculate card width and position using our dynamic column logic and SizeCard setting
                          const getCardWidth = () => {
                            switch (cardSizeSetting) {
                              case "compact":
                                return 70; // 70% - si adatta al testo
                              case "expanded":
                                return 98; // 98% - occupazione completa
                              case "normal":
                              default:
                                return 85; // 85% - dimensione standard bilanciata
                            }
                          };
                          
                          const cardWidth = getCardWidth();
                          // Add 1px gap between cards (convert to percentage of cell width)
                          const gapWidth = 1; // 1% gap between cards
                          const availableWidth = isOverlapping ? cardWidth - ((totalSubColumn - 1) * gapWidth) : cardWidth;
                          const individualWidth = isOverlapping ? availableWidth / totalSubColumn : cardWidth;
                          // Calcola la posizione in base al setting di allineamento
                          const getLeftPosition = () => {
                            if (isOverlapping) {
                              return subColumn * (individualWidth + gapWidth);
                            }
                            
                            switch (cardAlignmentSetting) {
                              case "left":
                                return 0;
                              case "right":
                                return 100 - cardWidth;
                              case "center":
                              default:
                                return (100 - cardWidth) / 2;
                            }
                          };
                          
                          const leftPosition = getLeftPosition();

                          const isShortAppointment = duration <= 10;

                          interface TextSizeResult {
                            time: { fontSize: number; className: string; text: string; displayMode: 'full' | 'truncated' };
                            name: { fontSize: number; className: string; text: string; displayMode: 'full' | 'initials' | 'truncated' | 'wrapped' };
    service: { fontSize: number; className: string; text: string; displayMode: 'full' | 'truncated' | 'count' };
                            shouldWrap: boolean;
                            layout: 'horizontal' | 'vertical' | 'compact';
                            spacing: {
                              timeMargin: string;
                              nameMargin: string;
                              serviceMargin: string;
                            };
                          }

                          // Funzione per misurare il testo con precisione migliorata
                          const measureText = (text: string, fontSize: number, fontWeight: string = '600', fontFamily: string = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif') => {
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            if (!context) return { width: 0, height: 0 };
                            
                            context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                            const metrics = context.measureText(text);
                            return {
                              width: metrics.width,
                              height: fontSize * 1.2,
                              actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || fontSize,
                              actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || fontSize * 0.2
                            };
                          };

                          // Funzione intelligente per decidere il layout della card
                          const decideCardLayout = (duration: number, totalSubColumn: number, availableWidth: number, availableHeight: number): 'horizontal' | 'vertical' | 'compact' => {
                            // Calcola il numero totale di membri attivi
                            const totalMembers = filteredMembers.length;
                            
                            // Regole per il layout
                            if (totalSubColumn >= 4 || duration <= 15) {
                              return 'compact';
                            } else if (totalSubColumn >= 3 || duration <= 30) {
                              return 'vertical';
                            } else if (availableWidth > 200 && duration >= 30) {
                              return 'horizontal';
                            } else {
                              return 'vertical';
                            }
                          };

                          // Funzione intelligente per decidere il display mode del nome con priorità
                          const decideNameDisplayMode = (name: string, availableWidth: number, availableHeight: number, fontSize: number, totalSubColumn: number, duration: number, layout: string) => {
                            if (!name) return { mode: 'initials' as const, text: '' };
                            
                            // Trova il membro del team
                            const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                            const memberInitials = teamMember ? getInitials(teamMember.name) : '';
                            
                            // Crea le diverse varianti del testo
                            // Per appuntamenti di 20 minuti, rimuovi l'icona membro
                            const fullName = duration === 20 ? name : `${memberInitials} • ${name}`;
                            const initialsOnly = duration === 20 ? getInitials(name) : `${memberInitials}-${getInitials(name)}`;
                            const shortName = name.length > 20 ? name.substring(0, 17) + '...' : name;
                            const shortFullName = duration === 20 ? shortName : `${memberInitials} • ${shortName}`;
                            
                            const fullNameWidth = measureText(fullName, fontSize).width;
                            const initialsWidth = measureText(initialsOnly, fontSize).width;
                            const shortFullNameWidth = measureText(shortFullName, fontSize).width;
                            
                            // Calcola il numero totale di membri attivi
                            const totalMembers = filteredMembers.length;
                            
                            // Calcola se c'è spazio per il wrapping (altezza sufficiente per 2 righe)
                            const lineHeight = fontSize * 1.2;
                            const canWrap = availableHeight >= lineHeight * 2.2; // Spazio per 2 righe + margine ridotto
                            
                            // Per card lunghe (durata >= 30 min), permettere sempre il wrapping se c'è spazio
                            const isLongCard = duration >= 30;
                            const shouldAllowWrap = canWrap && (isLongCard || availableHeight > lineHeight * 3);
                            
                            // Calcola se il wrapping è vantaggioso (nome lungo e spazio sufficiente)
                            const isNameLong = name.length > 12;
                            const hasEnoughWidthForWrap = availableWidth > 120; // Minimo 120px per il wrapping
                            
                            // Calcola se il wrapping migliorerebbe la leggibilità
                            const wouldBenefitFromWrap = isNameLong && hasEnoughWidthForWrap && (
                              fullNameWidth > availableWidth * 0.6 || // Nome troppo largo per una riga
                              (duration >= 30 && availableHeight > lineHeight * 3) // Card lunga con molto spazio verticale
                            );
                            
                            // Regole per decidere il display mode con considerazioni aggiuntive
                            const rules = [
                              // Regola 1: Layout compact - sempre iniziali (ma non per card da 30+ minuti)
                              { condition: layout === 'compact' && duration < 30, mode: 'initials' as const, text: initialsOnly },
                              
                              // Regola 2: Se la card è molto piccola (4+ colonne), usa sempre iniziali (ma non per card da 30+ minuti)
                              { condition: totalSubColumn >= 4 && duration < 30, mode: 'initials' as const, text: initialsOnly },
                              
                              // Regola 3: Se ci sono molti membri (6+), usa sempre iniziali (ma non per card da 30+ minuti)
                              { condition: totalMembers >= 6 && duration < 30, mode: 'initials' as const, text: initialsOnly },
                              
                              // Regola 4: Se la card è piccola (3 colonne) e il nome è lungo, usa iniziali (ma non per card da 30+ minuti)
                              { condition: totalSubColumn === 3 && name.length > 15 && duration < 30, mode: 'initials' as const, text: initialsOnly },
                              
                              // Regola 5: Se siamo su mobile e ci sono 4+ membri, usa iniziali (ma non per card da 30+ minuti)
                              { condition: isMobile && totalMembers >= 4 && duration < 30, mode: 'initials' as const, text: initialsOnly },
                              
                              // Regola 6: Se la colonna è molto stretta (<150px), usa iniziali (ma non per card da 30+ minuti)
                              { condition: (100 / filteredMembers.length) * window.innerWidth * 0.8 < 150 && duration < 30, mode: 'initials' as const, text: initialsOnly },
                              
                              // Regola 7: Se il nome è lungo e c'è spazio per il wrapping, usa wrapped
                              { condition: wouldBenefitFromWrap && shouldAllowWrap, mode: 'wrapped' as const, text: fullName },
                              
                              // Regola 7.5: Per card da 30+ minuti, priorità al nome completo se c'è spazio
                              { condition: duration >= 30 && fullNameWidth <= availableWidth * 0.9, mode: 'full' as const, text: fullName },
                              
                              // Regola 8: Se il nome completo non ci sta nella larghezza disponibile, prova il nome corto
                              { condition: fullNameWidth > availableWidth * 0.9 && shortFullNameWidth <= availableWidth * 0.9, mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 9: Se nemmeno il nome corto ci sta, usa iniziali
                              { condition: fullNameWidth > availableWidth * 0.9, mode: 'initials' as const, text: initialsOnly },
                              
                              // Regola 10: Se il nome è molto lungo (>25 caratteri), usa il nome corto
                              { condition: name.length > 25, mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 11: Se ci sta tutto, usa il nome completo
                              { condition: true, mode: 'full' as const, text: fullName }
                            ];
                            
                            for (const rule of rules) {
                              if (rule.condition) {
                                return {
                                  mode: rule.mode,
                                  text: rule.text
                                };
                              }
                            }
                            
                            return { mode: 'full' as const, text: fullName };
                          };

                          // Funzione intelligente per decidere il display mode del servizio con priorità
                          const decideServiceDisplayMode = (service: string, availableWidth: number, fontSize: number, totalSubColumn: number, duration: number, layout: string) => {
                            if (!service) return { mode: 'truncated' as const, text: '' };
                            
                            const fullServiceWidth = measureText(service, fontSize).width;
                            const shortService = service.length > 25 ? service.substring(0, 22) + '...' : service;
                            const shortServiceWidth = measureText(shortService, fontSize).width;
                            
                            // Calcola il numero totale di membri attivi
                            const totalMembers = filteredMembers.length;
                            
                            // Regole per il servizio con considerazioni aggiuntive
                            const rules = [
                              // Regola 1: Layout compact - non mostrare servizi
                              { condition: layout === 'compact', mode: 'truncated' as const, text: '' },
                              
                              // Regola 2: Se la card è molto piccola, non mostrare il servizio
                              // Per appuntamenti da 15 minuti, mostra solo il numero di servizi
                              { condition: totalSubColumn >= 4, mode: 'truncated' as const, text: '' },
                              { condition: duration === 15, mode: 'count' as const, text: '' },
                              { condition: duration < 15, mode: 'truncated' as const, text: '' },
                              
                              // Regola 3: Se ci sono molti membri (6+), non mostrare il servizio
                              { condition: totalMembers >= 6, mode: 'truncated' as const, text: '' },
                              
                              // Regola 4: Se siamo su mobile e ci sono 4+ membri, non mostrare il servizio
                              { condition: isMobile && totalMembers >= 4, mode: 'truncated' as const, text: '' },
                              
                              // Regola 5: Se la colonna è molto stretta (<150px), non mostrare il servizio
                              { condition: (100 / filteredMembers.length) * window.innerWidth * 0.8 < 150, mode: 'truncated' as const, text: '' },
                              
                              // Regola 6: Per card da 20 minuti, 25 minuti e 50 minuti affiancate, non mostrare i servizi
                              // Card da 30 minuti affiancate: mostra i servizi in linea con lo status
                              { condition: (duration === 20 || duration === 25 || duration === 50) && totalSubColumn > 1, mode: 'truncated' as const, text: '' },
                              
                              // Regola 7: Se il servizio è molto lungo (>30 caratteri), troncalo
                              { condition: service.length > 30, mode: 'truncated' as const, text: shortService },
                              
                              // Regola 8: Se il servizio non ci sta nella larghezza, troncalo
                              { condition: fullServiceWidth > availableWidth * 0.8, mode: 'truncated' as const, text: shortService },
                              
                              // Regola 9: Se ci sta tutto, usa il servizio completo
                              { condition: true, mode: 'full' as const, text: service }
                            ];
                            
                            for (const rule of rules) {
                              if (rule.condition) {
                                return rule;
                              }
                            }
                            
                            return { mode: 'full' as const, text: service };
                          };

                          const getTextSize = (duration: number, width: number, totalSubColumn: number): TextSizeResult => {
                            // Calcola le dimensioni reali della card basate su dati reali
                            const cardWidth = width; // Larghezza in percentuale
                            const cardHeight = Math.max((duration / 60) * 100, 5); // Altezza in percentuale
                            
                            // Usa le dimensioni reali del calendario se disponibili
                            const actualColumnWidth = (100 / filteredMembers.length) * window.innerWidth * 0.8 || 200;
                            const actualCardWidth = (cardWidth / 100) * actualColumnWidth;
                            const actualCardHeight = (cardHeight / 100) * 60; // Altezza cella fissa
                            
                            // Calcola la larghezza effettiva disponibile per il testo (sottrai padding e margini)
                            const cardPadding = 24; // 12px padding su ogni lato
                            const effectiveCardWidth = actualCardWidth - cardPadding;
                            
                            // Calcola l'altezza effettiva disponibile per il testo
                            const cardPaddingVertical = 20; // 10px padding su top e bottom
                            const effectiveCardHeight = actualCardHeight - cardPaddingVertical;
                            
                            // Decidi il layout della card
                            const layout = decideCardLayout(duration, totalSubColumn, effectiveCardWidth, effectiveCardHeight);
                            
                            // Calcola le dimensioni disponibili per ogni sezione basate sul layout
                            let timeAvailableWidth, timeAvailableHeight, nameAvailableWidth, nameAvailableHeight, serviceAvailableWidth, serviceAvailableHeight;
                            
                            if (layout === 'compact') {
                              // Layout compatto: tutto in una riga
                              timeAvailableWidth = effectiveCardWidth * 0.4;
                              timeAvailableHeight = effectiveCardHeight * 0.8;
                              nameAvailableWidth = effectiveCardWidth * 0.5;
                              nameAvailableHeight = effectiveCardHeight * 0.8;
                              serviceAvailableWidth = 0; // Non mostrare servizi in layout compatto
                              serviceAvailableHeight = 0;
                            } else if (layout === 'horizontal') {
                              // Layout orizzontale: tempo e nome sulla stessa riga, servizi sotto
                              timeAvailableWidth = effectiveCardWidth * 0.35;
                              timeAvailableHeight = effectiveCardHeight * 0.4;
                              nameAvailableWidth = effectiveCardWidth * 0.6;
                              nameAvailableHeight = effectiveCardHeight * 0.4;
                              serviceAvailableWidth = effectiveCardWidth * 0.9;
                              serviceAvailableHeight = effectiveCardHeight * 0.3;
                            } else {
                              // Layout verticale: tutto in colonna
                              timeAvailableWidth = effectiveCardWidth * 0.9;
                              timeAvailableHeight = effectiveCardHeight * 0.25;
                              nameAvailableWidth = effectiveCardWidth * 0.9;
                              // Per card lunghe, dare più spazio al nome
                              nameAvailableHeight = duration >= 30 ? effectiveCardHeight * 0.5 : effectiveCardHeight * 0.35;
                              serviceAvailableWidth = effectiveCardWidth * 0.8;
                              serviceAvailableHeight = effectiveCardHeight * 0.25;
                            }
                            
                            // Per appuntamenti da 10 minuti, rimuovi il rettangolo servizi
                            if (duration <= 10) {
                              serviceAvailableWidth = 0;
                              serviceAvailableHeight = 0;
                            }
                            
                            // Determina le dimensioni del font basate su schermo e numero di membri
                            const totalMembers = filteredMembers.length;
                            
                            // Calcola le dimensioni del font ottimali basate su schermo e membri
                            let baseFontSizes = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
                            
                            // Aggiusta le dimensioni del font basate sulla dimensione dello schermo
                            if (isMobile) {
                              baseFontSizes = [6, 7, 8, 9, 10, 11, 12, 13, 14];
                            } else if (window.innerWidth <= 1024) {
                              baseFontSizes = [7, 8, 9, 10, 11, 12, 13, 14, 15];
                            } else if (window.innerWidth > 1440) {
                              baseFontSizes = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
                            }
                            
                            // Aggiusta ulteriormente basato sul numero di membri
                            if (totalMembers >= 6) {
                              baseFontSizes = baseFontSizes.map(size => Math.max(size - 2, 6));
                            } else if (totalMembers >= 4) {
                              baseFontSizes = baseFontSizes.map(size => Math.max(size - 1, 7));
                            }
                            
                            // Per card da 30+ minuti, aumenta le dimensioni del font se possibile
                            if (duration >= 30) {
                              baseFontSizes = baseFontSizes.map(size => Math.min(size + 1, 20));
                            }
                            
                            // Aggiusta basato sulla larghezza della colonna
                            if (actualColumnWidth < 150) {
                              baseFontSizes = baseFontSizes.map(size => Math.max(size - 1, 6));
                            } else if (actualColumnWidth > 300) {
                              baseFontSizes = baseFontSizes.map(size => Math.min(size + 1, 20));
                            }
                            
                            // Aggiusta basato sul layout
                            if (layout === 'compact') {
                              baseFontSizes = baseFontSizes.map(size => Math.max(size - 1, 6));
                            }
                            
                            let bestTimeFontSize = baseFontSizes[3] || 10;
                            let bestNameFontSize = baseFontSizes[4] || 12;
                            let bestServiceFontSize = baseFontSizes[2] || 10;
                            
                            // Trova la dimensione ottimale per il tempo
                            for (const fontSize of baseFontSizes) {
                              // Usa lo stesso timeText che verrà usato nel rendering
                              // Per card da 20 minuti, rimuovi i minuti (quelli dentro parentesi)
                              // Per card da 15 minuti sole, mostra orario di fine + minuti
                              const timeText = duration === 20 
                                ? `${appointment.orarioInizio} - ${appointment.orarioFine}`
                                : duration === 15 && totalSubColumn === 1
                                ? `${appointment.orarioFine} ${duration}m`
                                : `${duration}m | ${appointment.orarioInizio} - ${appointment.orarioFine}`;
                              const { width } = measureText(timeText, fontSize);
                              if (width <= timeAvailableWidth && fontSize * 1.2 <= timeAvailableHeight) {
                                bestTimeFontSize = fontSize;
                              } else {
                                break;
                              }
                            }
                            
                            // Trova la dimensione ottimale per il nome
                            for (const fontSize of baseFontSizes) {
                              const nameText = appointment.nome || '';
                              const { width } = measureText(nameText, fontSize);
                              // Per il wrapping, considera che il testo può andare a capo
                              const canFitInWidth = width <= nameAvailableWidth || (nameText.length > 12 && nameAvailableWidth > 120);
                              if (canFitInWidth && fontSize * 1.2 <= nameAvailableHeight) {
                                bestNameFontSize = fontSize;
                              } else {
                                break;
                              }
                            }
                            
                            // Trova la dimensione ottimale per il servizio
                            for (const fontSize of baseFontSizes) {
                              const serviceText = appointment.servizio || '';
                              const { width } = measureText(serviceText, fontSize);
                              if (width <= serviceAvailableWidth && fontSize * 1.2 <= serviceAvailableHeight) {
                                bestServiceFontSize = fontSize;
                              } else {
                                break;
                              }
                            }
                            
                            // Decidi il display mode per ogni elemento con considerazioni aggiuntive
                            // Aggiungi il numero di servizi dopo gli orari
                            const servicesCount = appointment.services ? appointment.services.length : 0;
                            // Per card da 20 minuti, rimuovi i minuti (quelli dentro parentesi)
                            // Per card da 15 minuti sole, mostra orario di fine + minuti
                            const timeText = duration === 20 
                              ? `${appointment.orarioInizio} - ${appointment.orarioFine}`
                              : duration === 15 && totalSubColumn === 1
                              ? `${appointment.orarioFine} ${duration}m`
                              : `${duration}m | ${appointment.orarioInizio} - ${appointment.orarioFine}`;
                            const timeDisplayMode = measureText(timeText, bestTimeFontSize).width <= timeAvailableWidth ? 'full' : 'truncated';
                            
                            const nameDisplay = decideNameDisplayMode(
                              appointment.nome || '', 
                              nameAvailableWidth, 
                              nameAvailableHeight, 
                              bestNameFontSize, 
                              totalSubColumn, 
                              duration,
                              layout
                            );
                            
                            const serviceDisplay = decideServiceDisplayMode(
                              appointment.servizio || '', 
                              serviceAvailableWidth, 
                              bestServiceFontSize, 
                              totalSubColumn, 
                              duration,
                              layout
                            );
                            
                            // Calcola gli spazi tra gli elementi basati sul layout
                            let spacing;
                            if (layout === 'compact') {
                              spacing = {
                                timeMargin: '0',
                                nameMargin: '0 0 0 4px',
                                serviceMargin: '0'
                              };
                            } else if (layout === 'horizontal') {
                              spacing = {
                                timeMargin: '0 8px 0 0',
                                nameMargin: '0 0 4px 0',
                                serviceMargin: (duration === 25 || duration === 30) ? '1px 0 0 0' : '6px 0 0 0'
                              };
                            } else {
                              spacing = {
                                timeMargin: '0 0 4px 0',
                                nameMargin: '0 0 4px 0',
                                serviceMargin: (duration === 25 || duration === 30) ? '1px 0 0 0' : '6px 0 0 0'
                              };
                            }
                            
                            return {
                              time: {
                                fontSize: bestTimeFontSize,
                                className: `text-[${bestTimeFontSize}px]`,
                                text: timeText,
                                displayMode: timeDisplayMode
                              },
                              name: {
                                fontSize: bestNameFontSize,
                                className: `text-[${bestNameFontSize}px]`,
                                text: nameDisplay.text,
                                displayMode: nameDisplay.mode
                              },
                              service: {
                                fontSize: bestServiceFontSize,
                                className: `text-[${bestServiceFontSize}px]`,
                                text: serviceDisplay.text,
                                displayMode: serviceDisplay.mode
                              },
                              shouldWrap: nameDisplay.mode === 'full' && nameDisplay.text.length > 15,
                              layout: layout,
                              spacing: spacing
                            };
                          };

                          const cardStyle = {
                          backgroundColor: cardColor,
                          backgroundImage: appointment.status ? `radial-gradient(circle at 2px 2px, rgba(0, 0, 0, 0.05) 1px, transparent 1px)` : 'none',
                          backgroundSize: appointment.status ? '8px 8px' : 'auto',
                          top: `${(startTimeParsed.getMinutes() / 60) * 100}%`,
                          height: `${Math.max((duration / 60) * 100, 5)}%`,
                          left: `${leftPosition}%`,
                          width: `${individualWidth}%`,
                          whiteSpace: "normal",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          };

                          // DEBUG: Rimosso console.log per migliorare performance

                          // Helper functions from cardday.tsx
                          const getContrastColor = (hexColor: string): string => {
                            if (!hexColor.startsWith("#") || hexColor.length < 7) return "#000";
                            const isDarkMode = document.documentElement.classList.contains('dark');
                            
                            // In dark mode, prefer white text for better contrast
                            if (isDarkMode) {
                              const r = parseInt(hexColor.slice(1, 3), 16);
                              const g = parseInt(hexColor.slice(3, 5), 16);
                              const b = parseInt(hexColor.slice(5, 7), 16);
                              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                              // In dark mode, use white text for most colors, black only for very light colors
                              return brightness > 200 ? "#000000" : "#FFFFFF";
                            }
                            
                            // Light mode logic (original)
                            const r = parseInt(hexColor.slice(1, 3), 16);
                            const g = parseInt(hexColor.slice(3, 5), 16);
                            const b = parseInt(hexColor.slice(5, 7), 16);
                            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                            return brightness > 128 ? "#000000" : "#FFFFFF";
                          };

                          const getInitials = (name: string) => {
                          if (!name || typeof name !== 'string' || name.trim() === '') return 'SN';
                          const trimmedName = name.trim();
                          const [firstName, lastName] = trimmedName.split(' ');
                          const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
                          const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
                          return firstInitial + lastInitial || firstInitial || 'SN';
                          };

                          const getClientNameDisplay = (name: string | undefined | null, duration: number, totalSubColumn: number, totalMembers: number, appointment?: Appointment) => {
                            if (!name || typeof name !== 'string' || name.trim() === '') return 'Senza nome';
                            const trimmedName = name.trim();
                            
                            // Per card da 50 minuti affiancate, sempre mostrare il nome completo (non le iniziali)
                            if (duration === 50 && totalSubColumn > 1) {
                              return trimmedName;
                            }
                            
                            // Se ci sono 4 membri attivi e 3 card affiancate (totalSubColumn === 3)
                            // e la somma delle lettere di nome+cognome > 18, mostra solo le iniziali
                            if (
                              totalMembers === 4 &&
                              totalSubColumn === 3 &&
                              trimmedName.replace(/\s+/g, '').length > 18
                            ) {
                              return getInitials(trimmedName);
                            }
                            // Se ci sono 4+ card e durata <= 30, mostra solo le iniziali (regola esistente)
                            if (totalSubColumn >= 4 && duration <= 30) {
                              return getInitials(trimmedName);
                            }
                            
                          // Rimuove la logica speciale per 20 minuti: non mostrare servizi/prezzi per 20m
                          return trimmedName;
                          };

                          // Helper function to get service display text for 10-minute appointments
                          const getServiceDisplayFor10Min = (appointment: Appointment) => {
                            if (!appointment.services || appointment.services.length === 0) {
                              return appointment.servizio || '';
                            }
                            
                            if (appointment.services.length === 1) {
                              return appointment.services[0].name || appointment.servizio || '';
                            }
                            
                            // If multiple services, show count
                            return `${appointment.services.length} ${appointment.services.length === 1 ? 'servizio' : 'servizi'}`;
                          };

                          // Helper function to get service display text for 20-minute appointments
                          const getServiceDisplayFor20Min = (appointment: Appointment) => {
                            if (!appointment.services || appointment.services.length === 0) {
                              return appointment.servizio || '';
                            }
                            
                            if (appointment.services.length === 1) {
                              return appointment.services[0].name || appointment.servizio || '';
                            }
                            
                            if (appointment.services.length === 2) {
                              return `${appointment.services[0].name} - ${appointment.services[1].name}`;
                            }
                            
                            // If more than 2 services, show count
                            return `${appointment.services.length} ${appointment.services.length === 1 ? 'servizio' : 'servizi'}`;
                          };

                          // Helper function to get service display text for 25-minute appointments (same as 20-minute)
                          const getServiceDisplayFor25Min = (appointment: Appointment) => {
                            if (!appointment.services || appointment.services.length === 0) {
                              return appointment.servizio || '';
                            }
                            
                            if (appointment.services.length === 1) {
                              return appointment.services[0].name || appointment.servizio || '';
                            }
                            
                            if (appointment.services.length === 2) {
                              return `${appointment.services[0].name} - ${appointment.services[1].name}`;
                            }
                            
                            // If more than 2 services, show count
                            return `${appointment.services.length} ${appointment.services.length === 1 ? 'servizio' : 'servizi'}`;
                          };

                          // Helper function to get service display text for 30-minute appointments (same as 25-minute)
                          const getServiceDisplayFor30Min = (appointment: Appointment) => {
                            if (!appointment.services || appointment.services.length === 0) {
                              return appointment.servizio || '';
                            }
                            
                            if (appointment.services.length === 1) {
                              return appointment.services[0].name || appointment.servizio || '';
                            }
                            
                            if (appointment.services.length === 2) {
                              return `${appointment.services[0].name} - ${appointment.services[1].name}`;
                            }
                            
                            // If more than 2 services, show count
                            return `${appointment.services.length} ${appointment.services.length === 1 ? 'servizio' : 'servizi'}`;
                          };

                          // Card style logic from cardday.tsx
                          const teamColor = appointment.status === "pagato" 
                          ? "#a0aec0" 
                          : teamMembers.find((m) => m.id === appointment.team_id)?.ColorMember || "#0078d4";
                          
                          const isCancelled = appointment.status === "cancelled";
                          const isDeleted = appointment.status === "deleted";
                          const isEliminato = appointment.status === t('calendar.deleted', 'Eliminato'); // Add check for "Eliminato" status
                          
                          const colorCardString = Array.isArray(appointment.color_card)
                            ? appointment.color_card[0]
                            : appointment.color_card;
                          const textColor = (isCancelled || isDeleted || isEliminato) 
                            ? '#9CA3AF'
                            : colorCardString && !isCancelled
                              ? getContrastColor(colorCardString)
                              : '#1f2937';
                          
                          const outlookModernStyle = {
                            background: 'white', // Sempre sfondo bianco
                            borderLeft: (isCancelled || isDeleted || isEliminato)
                              ? '4px solid transparent'
                              : (colorCardString && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(colorCardString))
                                ? `4px solid ${colorCardString}`
                                : '4px solid #0078d4',
                            boxShadow: (isCancelled || isDeleted || isEliminato) ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease'
                          };

                          // Applica il colore selezionato dall'utente (color_card) come background
                          // Glow fix: usa sempre il boxShadow di getAppointmentCardStyle se presente
                          const appointmentCardStyle = getAppointmentCardStyle(appointment);
                          let boxShadow = appointmentCardStyle.boxShadow;
                          const isDarkMode = document.documentElement.classList.contains('dark');
                          
                          if (isEliminato) {
                            boxShadow = '0 0 0 2px #fecaca, 0 2px 8px rgba(220,38,38,0.08)';
                          } else if (isCancelled || isDeleted) {
                            boxShadow = 'none';
                          } else if (boxShadow == null) {
                            // fallback ombra neutra solo se non c'è alone
                            boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.02)';
                          }
                          
                          // Determina il colore del testo in base al background
                          let textColorForCard = textColor;
                          if (appointment.color_card && appointment.prefer_card_style === 'filled') {
                            // Se la card ha colori personalizzati, calcola il contrasto
                            let colors: string[] = [];
                            if (Array.isArray(appointment.color_card)) {
                              colors = appointment.color_card.filter(c => typeof c === 'string' && c.startsWith('#'));
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
                            
                            if (colors.length > 0) {
                              const adaptedColors = colors.map(color => adaptColorForDarkMode(color));
                              textColorForCard = getContrastColor(adaptedColors[0]);
                            }
                          }
                          const modernCardStyle: React.CSSProperties = {
                            ...cardStyle,
                            ...appointmentCardStyle,
                            // Se non filled, forza background appropriato per dark mode
                            ...(appointment.prefer_card_style && appointment.prefer_card_style !== 'filled' ? { 
                              background: isDarkMode ? '#1e293b' : '#fff' 
                            } : {}),
                            borderLeft: outlookModernStyle.borderLeft,
                            backdropFilter: (isCancelled || isDeleted || isEliminato) ? 'none' : 'blur(12px)',
                            WebkitBackdropFilter: (isCancelled || isDeleted || isEliminato) ? 'none' : 'blur(12px)',
                            opacity: isCancelled ? 0.6 : isEliminato ? 0.7 : isDeleted ? 0.4 : 1,
                            color: textColorForCard,
                            border: (isCancelled || isDeleted || isEliminato) 
                              ? isEliminato 
                                ? '3px solid #dc2626'
                                : '1px dashed rgba(156, 163, 175, 0.7)'
                              : isDarkMode 
                                ? '1px solid rgba(255, 255, 255, 0.1)' 
                                : '1px solid rgba(0, 0, 0, 0.06)',
                            boxShadow,
                            borderRadius: '12px',
                            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
                            fontSize: '13px',
                            fontWeight: '400',
                            lineHeight: '1.4',
                            letterSpacing: '-0.003em',
                            zIndex: 30,
                            padding: '0',
                            margin: '0', // Assicurati che non ci sia margine
                            overflow: 'visible', // Glow visibile anche fuori
                            textOverflow: 'ellipsis',
                            position: 'absolute', // Corretto: deve essere absolute per il posizionamento nella cella
                            boxSizing: 'border-box', // Assicurati che padding e border siano inclusi nel calcolo dimensioni
                            cursor: (appointment.status === 'Eliminato' || appointment.status === 'pagato') ? 'not-allowed' : 'pointer',
                            // PAUSA: stile con linee oblique più soft
                            ...(appointment.status === 'Pausa' && {
                              backgroundColor: isDarkMode ? '#334155' : '#f6f7fa',
                              backgroundImage: isDarkMode 
                                ? `repeating-linear-gradient(135deg, #475569 0px, #475569 8px, #334155 8px, #334155 16px)`
                                : `repeating-linear-gradient(135deg, #dbe3ea 0px, #dbe3ea 8px, #f6f7fa 8px, #f6f7fa 16px)`,
                              border: '1.0px solid #60a5fa', // azzurrino
                              color: isDarkMode ? '#94a3b8' : '#7b8794',
                              boxShadow: '0 0 0 1px #bae6fd', // alone azzurrino chiaro
                              opacity: 1,
                            }),
                          };

                          const verticalLineStyle: React.CSSProperties = {
                            position: 'absolute' as React.CSSProperties['position'],
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            backgroundColor: colorCardString || '#0078d4',
                            borderRadius: '2px 0 0 2px',
                          };

                          return (
                            <div
                              key={appointment.id}
                              draggable={appointment.status !== 'pagato' && appointment.status !== 'Eliminato'}
                              onDragStart={(e) => handleDragStart(e, appointment)}
                              className={`appointment-card absolute flex flex-col justify-between`}
                              style={{ ...modernCardStyle, ...mobileCardStyle }}
                              onClick={(e) => {
                                if (appointment.status === 'Pausa') {
                                  e.stopPropagation();
                                  return;
                                }
                                handleCardClick(appointment, e);
                              }}
                              onTouchEnd={isMobile ? (e) => {
                                if (appointment.status === 'Pausa') {
                                  e.stopPropagation();
                                  return;
                                }
                                handleCardClick(appointment, e);
                              } : undefined}
                              title={appointment.status === 'Pausa' && isPausaInConflict 
                                ? "⚠️ ATTENZIONE: Questa pausa è in conflitto con un altro appuntamento nello stesso orario!"
                                : undefined
                              }
                            >

                              {/* Mostra la barra verticale solo se filled o default */}
                              {(!appointment.prefer_card_style || appointment.prefer_card_style === 'filled') && (
                                <div style={verticalLineStyle}></div>
                              )}
                              {/* Color bar rendering based on prefer_card_style */}
                              {(() => {
                                const style = appointment.prefer_card_style || 'filled';
                                let colors: string[] = [];
                                if (Array.isArray(appointment.color_card)) {
                                  colors = appointment.color_card.filter(c => typeof c === 'string' && c.startsWith('#'));
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
                              {/* Purple square indicator */}
                              <div 
                                className="absolute w-2 h-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded z-50 cursor-pointer hover:scale-125 hover:shadow-lg transition-all duration-300 ease-out group"
                                style={{
                                  top: '-1px',
                                  right: '-1px',
                                  boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3), 0 1px 3px rgba(0,0,0,0.2)',
                                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                                }}
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  hoverStateRef.current.setMousePosition({ x: e.clientX, y: e.clientY });
                                  hoverStateRef.current.setHoveredAppointment(appointment);
                                  
                                  // Add a small delay before showing the tooltip
                                  if (hoverTimeoutRef.current) {
                                    clearTimeout(hoverTimeoutRef.current);
                                  }
                                  hoverTimeoutRef.current = setTimeout(() => {
                                    hoverStateRef.current.setShowAnteprimaCard(true);
                                  }, 300);
                                }}
                                onMouseMove={(e) => {
                                  e.stopPropagation();
                                  hoverStateRef.current.setMousePosition({ x: e.clientX, y: e.clientY });
                                }}
                                onMouseLeave={(e) => {
                                  e.stopPropagation();
                                  if (hoverTimeoutRef.current) {
                                    clearTimeout(hoverTimeoutRef.current);
                                    hoverTimeoutRef.current = null;
                                  }
                                  hoverStateRef.current.setHoveredAppointment(null);
                                  hoverStateRef.current.setShowAnteprimaCard(false);
                                }}
                              >
                              </div>
                              {/* Existing card content */}
                              <div className={`relative flex flex-col ${duration <= 10 ? 'justify-center' : duration < 25 ? 'justify-center' : 'justify-between'} h-full overflow-hidden`}>
                                {/* Durata in minuti: spostata vicino al bottone stato se appuntamento solo e durata <= 15 */}
                                {totalSubColumn === 1 && duration <= 15 ? null : (duration <= 10 || (duration === 15 && totalSubColumn === 1)) ? null : (
                                  <span
                                    className="absolute top-2 right-2 text-[10px] font-semibold text-gray-500 z-20 select-none pointer-events-none"
                                    style={{ letterSpacing: '-0.01em', lineHeight: 1, background: 'none', borderRadius: 0, padding: 0, boxShadow: 'none' }}
                                    title="Durata appuntamento in minuti"
                                  >
                                    {formatDuration(duration)}
                                  </span>
                                )}
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
                                {/* Notion style pausa card if alone */}
                                {appointment.status === 'Pausa' && totalSubColumn === 1 ? (
                                  <div className="flex flex-col items-center justify-center h-full w-full text-center" style={{zIndex:2, position:'relative', padding:'18px 8px 14px 8px'}}>
                                    {duration > 39 && (
                                      <span style={{fontSize:'2.1rem', lineHeight:1, marginBottom:6, userSelect:'none'}}>☕</span>
                                    )}
                                    <span style={{fontWeight:700, fontSize:'1.13rem', color:'#2d3748', letterSpacing:'-0.01em'}}>Pausa</span>
                                    <span style={{
                                      position:'absolute',
                                      left:10,
                                      bottom:10,
                                      background:'#F3F4F6',
                                      borderRadius:'6px',
                                      padding:'2px 10px',
                                      fontSize:'0.93rem',
                                      fontWeight:600,
                                      color:'#374151',
                                      letterSpacing:'-0.01em',
                                      border:'1px solid #E5E7EB',
                                      boxShadow:'0 1px 2px 0 rgba(0,0,0,0.03)',
                                      zIndex:3,
                                                                          }}>{(duration <= 10) ? `${appointment.orarioInizio} - ${appointment.orarioFine}` : (duration === 15 && totalSubColumn === 1) ? `${appointment.orarioFine} ${duration}m` : (duration === 20 && totalSubColumn === 1) ? appointment.orarioFine : `${appointment.orarioInizio} - ${appointment.orarioFine}`}</span>
                                    
                                    {/* Trash icon for pause deletion */}
                                    <button
                                      onClick={(e) => handlePauseDelete(appointment, e)}
                                      className="absolute bottom-2 right-2 z-20 p-1.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors duration-200 border border-red-300"
                                      title="Elimina pausa"
                                      style={{
                                        backdropFilter: 'blur(4px)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      <FaTrash className="w-3 h-3 text-red-600" />
                                    </button>
                                  </div>
                                ) : hourHeight <= 150 ? (
                                  // Compact layout for zoom level 150 - Notion style
                                  <div className="flex flex-row justify-between items-center" style={{ padding: '8px 10px', position: 'relative', zIndex: 2 }}>
                                  {duration >= 25 ? (
                                    <div className="flex flex-col items-start">
                                    {salonId && (
                                      <div 
                                      className="mb-1"
                                      onClick={(e) => e.stopPropagation()}
                                      >
                                                                                                                <StatoCard 
                                        salonId={salonId} 
                                        orderId={appointment.id} 
                                        compact={true} 
                                        onStatusUpdate={fetchAppointments}
                                        size={duration <= 15 || (duration === 20 && totalSubColumn === 1) || (duration === 25 && totalSubColumn === 1) || (duration === 30 && totalSubColumn === 1) ? "xs" : "normal"}
                                        textOnly={duration <= 15 || (duration === 20 && totalSubColumn === 1) || (duration === 25 && totalSubColumn === 1) || (duration === 30 && totalSubColumn === 1)}
                                        task={appointment.task}
                                      />
                                      </div>
                                    )}
                                    <span
                                      className="font-medium"
                                      style={{ 
                                        fontSize: '10px', 
                                        lineHeight: '1.3', 
                                        marginTop: '2px',
                                        opacity: 1,
                                    fontWeight: '600',
                                    letterSpacing: '-0.01em',
                                    color: '#18181b', // nero più intenso
                                    textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none'
                                  }}
                                >
                                  {(duration <= 10) ? `${appointment.orarioInizio} - ${appointment.orarioFine}` : (duration === 15 && totalSubColumn === 1) ? `${appointment.orarioFine} ${duration}m` : (duration === 20 && totalSubColumn === 1) || (duration === 25 && totalSubColumn === 1) || (duration === 30 && totalSubColumn === 1) ? appointment.orarioFine : ((duration === 25 && totalSubColumn > 1) || (duration === 30 && totalSubColumn === 3 && filteredMembers.length === 3)) ? `${appointment.orarioFine} ${getInitials(appointment.nome)}` : `${appointment.orarioInizio} - ${appointment.orarioFine}`}
                                  {duration > 10 && (() => {
                                    const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                    return teamMember ? <span className="inline-flex ml-1 align-middle"><LazyAvatar member={teamMember} className="border border-gray-200 w-4 h-4" /></span> : null;
                                  })()}
                                </span>
                                </div>
                              ) : (
                                <span
                                className="font-medium flex items-center gap-1"
                                style={{ 
                                  fontSize: '10px', 
                                  lineHeight: '1.3',
                                  opacity: 1,
                                  fontWeight: '600',
                                  letterSpacing: '-0.01em',
                                  color: '#18181b', // nero più intenso
                                  textDecoration: (isCancelled || isDeleted) ? 'line-through' : 'none'
                                }}
                                >
                                {(duration <= 10) ? `${appointment.orarioInizio} - ${appointment.orarioFine}` : (duration === 15 && totalSubColumn === 1) ? `${appointment.orarioFine} ${duration}m` : (duration === 20 && totalSubColumn === 1) || (duration === 25 && totalSubColumn === 1) || (duration === 30 && totalSubColumn === 1) ? appointment.orarioFine : ((duration === 25 && totalSubColumn > 1) || (duration === 30 && totalSubColumn === 3 && filteredMembers.length === 3)) ? `${appointment.orarioFine} ${getInitials(appointment.nome)}` : `${appointment.orarioInizio} - ${appointment.orarioFine}`}
                                {duration > 10 && (() => {
                                  const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                  return teamMember ? <span className="inline-flex ml-1 align-middle"><LazyAvatar member={teamMember} className="border border-gray-200 w-4 h-4" /></span> : null;
                                })()}
                                {appointment.task && (
                                  <span 
                                    className="flex-shrink-0 bg-blue-100 text-blue-700 text-[8px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                    title="Task"
                                  >
                                    TASK
                                  </span>
                                )}
                                </span>
                              )}
                              <span
                                className="font-semibold flex items-center gap-1"
                                style={{ 
                                fontSize: '12px', 
                                lineHeight: '1.2',
                                fontWeight: '600',
                                letterSpacing: '-0.02em',
                                color: appointment.color_card && !isCancelled && !isDeleted && !isEliminato ? textColor : '#374151',
                                textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none'
                                }}
                              >
                                {isEliminato && <FaTrash className="w-4 h-4 text-red-600 flex-shrink-0 animate-bounce" title="Appuntamento eliminato" />}
                                <span className="truncate">
                                  {appointment.status === 'Pausa' && isPausaInConflict 
                                    ? "CONF" 
                                    : getInitials(appointment.nome)
                                  }
                                </span>
                                
                                {/* Trash icon for pause deletion in compact layout */}
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
                              </span>
                              </div>
                            ) : (
                              // Standard Notion modern layout
                              <div className="flex flex-col h-full" style={{ 
                                padding: duration <= 10 ? '4px 12px 0px 12px' : 
                                         (duration === 15 && totalSubColumn === 1) ? '4px 12px 0px 12px' : 
                                         (duration === 20 && totalSubColumn === 1) ? '4px 12px 0px 12px' : 
                                         (duration === 25 && totalSubColumn === 1) ? '4px 12px 0px 12px' : 
                                         (duration === 30 && totalSubColumn === 1) ? '4px 12px 0px 12px' : 
                                         '10px 12px' 
                              }}>
                              {/* Time and client name layout based on duration */}
                              {(duration <= 10 || (duration === 15 && totalSubColumn === 1) || (duration === 20 && totalSubColumn === 1) || (duration === 25 && totalSubColumn === 1) || (duration === 30 && totalSubColumn === 1) || ((duration === 25 && totalSubColumn > 1) || (duration === 30 && totalSubColumn === 3 && filteredMembers.length === 3))) ? (
                                // For appointments ≤ 10 minutes OR 15-minute/20-minute appointments when alone: time on first line, client name on second line
                                <>
                                  {/* Duration in top-right for 15-minute and 20-minute cards */}
                                  {(duration === 15 && totalSubColumn === 1) && (
                                    <span
                                      className="absolute top-2 right-2 text-[10px] font-semibold text-gray-500 z-20 select-none pointer-events-none"
                                      style={{ letterSpacing: '-0.01em', lineHeight: 1, background: 'none', borderRadius: 0, padding: 0, boxShadow: 'none' }}
                                      title="Durata appuntamento in minuti"
                                    >
                                      {formatDuration(duration)}
                                    </span>
                                  )}
                                  <div className="flex items-center space-x-1 mb-0.5">
                                    <span
                                      className="font-medium flex items-center gap-1"
                                      style={{ 
                                        fontSize: (duration === 15 && totalSubColumn === 1) || (duration === 20 && totalSubColumn === 1) || (duration === 25 && totalSubColumn === 1) || (duration === 30 && totalSubColumn === 1) ? '10px' : '9px', 
                                        lineHeight: '1.3',
                                        opacity: 1,
                                        letterSpacing: '-0.01em',
                                        fontWeight: '600',
                                        color: '#18181b', // nero più intenso
                                        textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                      }}
                                    >
                                      <span>{appointment.orarioInizio} - {appointment.orarioFine}</span>
                                      {appointment.task && (
                                        <span 
                                          className="flex-shrink-0 bg-blue-100 text-blue-700 text-[9px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                          title="Task"
                                        >
                                          TASK
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <span
                                    className="font-semibold truncate flex items-center gap-1"
                                    style={{ 
                                                                              fontSize: (duration === 15 && totalSubColumn === 1) || (duration === 20 && totalSubColumn === 1) || (duration === 25 && totalSubColumn === 1) || (duration === 30 && totalSubColumn === 1) ? '10px' : '9px', 
                                      lineHeight: '1.2',
                                      color: appointment.color_card && !isCancelled && !isDeleted && !isEliminato ? textColor : '#1F2937',
                                      letterSpacing: '-0.02em',
                                      fontWeight: '600',
                                      textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                      display: 'inline-flex',
                                    }}
                                  >
                                    {isEliminato && <FaTrash className="w-3 h-3 text-red-600 flex-shrink-0 animate-bounce" title="Appuntamento eliminato" />}
                                    <span className="truncate">
                                      {appointment.status === 'Pausa' && isPausaInConflict
                                        ? "CONFLITTO"
                                        : getClientNameDisplay(appointment.nome || "Senza nome", duration, totalSubColumn, filteredMembers.length, appointment)
                                      }
                                    </span>
                                    
                                    {/* Trash icon for pause deletion in 2-line layout */}
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
                                  </span>
                                </>
                                                              ) : (duration <= 24 && !(duration === 15 && totalSubColumn === 1) && !(duration === 20 && totalSubColumn === 1)) ? (
                                // For appointments 11-24 minutes (excluding 15-minute and 20-minute when alone): vertical layout with time, name, and services
                                <div className="flex flex-col h-full" style={{ padding: '0px 12px 8px 12px' }}>
                                  {/* Time at top */}
                                  <span
                                    className="font-medium flex items-center gap-1 mb-1"
                                    style={{ 
                                      fontSize: '10px', 
                                      lineHeight: '1.3',
                                      opacity: 1,
                                      letterSpacing: '-0.01em',
                                      fontWeight: '600',
                                      color: '#18181b',
                                      textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                    }}
                                  >
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
                                  
                                  {/* User name in the middle */}
                                  <span
                                    className="font-semibold truncate flex items-center gap-1 mb-1"
                                    style={{ 
                                      fontSize: '11px', 
                                      lineHeight: '1.2',
                                      color: appointment.color_card && !isCancelled && !isDeleted && !isEliminato ? textColor : '#1F2937',
                                      letterSpacing: '-0.02em',
                                      fontWeight: '600',
                                      textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                      display: 'inline-flex',
                                    }}
                                  >
                                    {isEliminato && <FaTrash className="w-3 h-3 text-red-600 flex-shrink-0 animate-bounce" title="Appuntamento eliminato" />}
                                    <span className="truncate">
                                      {appointment.status === 'Pausa' && isPausaInConflict
                                        ? "CONFLITTO"
                                        : getClientNameDisplay(appointment.nome || "Senza nome", duration, totalSubColumn, filteredMembers.length, appointment)
                                      }
                                    </span>
                                  </span>


                              
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
                              ) : (
                                // For appointments >= 25 minutes: time at top, client name below
                                <>
                                  <div className="flex items-center space-x-1 mb-2">
                                    <span
                                      className="font-medium flex items-center gap-1"
                                      style={{ 
                                        fontSize: '11px', 
                                        lineHeight: '1.3',
                                        opacity: 1,
                                        letterSpacing: '-0.01em',
                                        fontWeight: '700',
                                        color: '#18181b', // nero più intenso
                                        textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                        // Sposta più sotto se 4 membri, 4 card affiancate, durata <= 30 O durata >= 35
                                        position: (filteredMembers.length === 4 && totalSubColumn === 4 && (duration <= 30 || duration >= 35)) ? 'relative' : undefined,
                                        top: (filteredMembers.length === 4 && totalSubColumn === 4 && (duration <= 30 || duration >= 35)) ? '12px' : undefined,
                                        marginBottom: (filteredMembers.length === 4 && totalSubColumn === 4 && (duration <= 30 || duration >= 35)) ? '2px' : undefined,
                                      }}
                                    >
                                      {(duration <= 10) ? `${appointment.orarioInizio} - ${appointment.orarioFine}` : (duration === 15 && totalSubColumn === 1) ? `${appointment.orarioFine} ${duration}m` : (duration === 20 && totalSubColumn === 1) || (duration === 25 && totalSubColumn === 1) || (duration === 30 && totalSubColumn === 1) ? appointment.orarioFine : ((duration === 25 && totalSubColumn > 1) || (duration === 30 && totalSubColumn === 3 && filteredMembers.length === 3)) ? `${appointment.orarioFine} ${getInitials(appointment.nome)}` : `${appointment.orarioInizio} - ${appointment.orarioFine}`}
                                      {appointment.task && (
                                        <span 
                                          className="flex-shrink-0 bg-blue-100 text-blue-700 text-[9px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                          title="Task"
                                        >
                                          TASK
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <span
                                    className="font-semibold truncate flex items-center gap-1"
                                    style={{ 
                                      fontSize: isShortAppointment ? '13px' : '14px', 
                                      lineHeight: '1.25',
                                      color: appointment.color_card && !isCancelled && !isDeleted && !isEliminato ? textColor : '#1F2937',
                                      letterSpacing: '-0.02em',
                                      fontWeight: 600,
                                      marginBottom: 4,
                                      textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none'
                                    }}
                                  >
                                    {isEliminato && <FaTrash className="w-5 h-5 text-red-600 flex-shrink-0 animate-bounce" title="Appuntamento eliminato" />}
                                    <span className="truncate">
                                      {appointment.status === 'Pausa' && isPausaInConflict
                                        ? "CONFLITTO"
                                        : getClientNameDisplay(appointment.nome || "Senza nome", duration, totalSubColumn, filteredMembers.length, appointment)
                                      }
                                    </span>
                                    
                                    {/* Trash icon for pause deletion in vertical layout */}
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
                                  </span>
                                </>
                              )}


              {/* Show services if enough space (≥ 25 minutes) - Enhanced Notion style */}
              {duration >= 25 && totalSubColumn === 1 && Array.isArray(appointment.services) && (appointment.services?.length ?? 0) > 0 && (
                <div className="mt-1">
                  {/* Per tutte le card da 25+ minuti, mostra solo numero servizi e prezzo totale */}
                  <div className="flex items-center justify-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/25 rounded-lg border border-blue-100 dark:border-blue-800/40 shadow-sm w-fit">
                    <svg className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                     <span className="text-blue-700 dark:text-blue-300 font-semibold" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
                       {(appointment.services as Array<{ id: string; name: string; price: number }>).length} {((appointment.services as Array<{ id: string; name: string; price: number }>).length) === 1 ? 'servizio' : 'servizi'}
                     </span>
                    {Array.isArray(appointment.services) && (appointment.services?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0) > 0 && (
                      <>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                           <span className="text-green-600 dark:text-green-400 font-bold" style={{ fontSize: '10px' }}>
                             €{(appointment.services?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0)}
                           </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
                              {/* Status component - position based on card height */}
                              {appointment.status && salonId && (
                                (() => {
                                  // Riduci dimensione bottone stato se 3 card affiancate, 4 membri attivi, durata <= 25 min
                                  const isSmallStato = (filteredMembers.length === 4 && duration <= 25 && (totalSubColumn === 3 || totalSubColumn === 2));
                                  // Se appuntamento solo e durata <= 15, mostra la durata subito prima del bottone stato (rimosso, ora mostrato nell'orario)
                                  const showInlineDuration = false;
                                  // Applica stato-xs per card di 15 minuti o meno o 20/25 minuti quando sole
                                  const isVerySmallStato = duration <= 15 || ((duration === 20 || duration === 25) && totalSubColumn === 1);
                                  // Per card da 25/30 minuti affiancate, mostra i servizi nella stessa riga dello status
                                  const is25MinSideBy = false;
                                  
                                  return (
                                    <>
                                      {/* Per card da 25/30 minuti affiancate, mostra i servizi a sinistra */}
                                      {is25MinSideBy && appointment.services && appointment.services.length > 0 && !(totalSubColumn >= 4 && filteredMembers.length > 1) && (
                                        <div 
                                          className="absolute bottom-2 left-2 z-10 flex items-center gap-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/25 rounded-md border border-blue-100 dark:border-blue-800/40 shadow-sm">
                                            <svg className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-blue-700 dark:text-blue-300 font-semibold" style={{ fontSize: '10px', letterSpacing: '-0.01em' }}>
                                              {appointment.services.length} {appointment.services.length === 1 ? 'servizio' : 'servizi'}
                                            </span>
                                            {appointment.services.reduce((sum, s) => sum + (s.price || 0), 0) > 0 && !(totalSubColumn === 3 && duration >= 25 && duration <= 45 && filteredMembers.length === 2) && !(totalSubColumn >= 4 && filteredMembers.length > 1) && !(duration === 30 && totalSubColumn === 2 && filteredMembers.length > 3) && (
                                              <>
                                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                                <svg className="w-2.5 h-2.5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-green-600 dark:text-green-400 font-semibold" style={{ fontSize: '9px' }}>
                                                  €{appointment.services.reduce((sum, s) => sum + (s.price || 0), 0)}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div
                                        className={`absolute ${(duration <= 10 && duration !== 15) ? 'top-2 right-2' : 'bottom-2 right-2'} z-10 flex items-center gap-1 ${isSmallStato || isVerySmallStato ? 'stato-xs' : ''}`}
                                        style={{
                                          maxWidth: (duration <= 10 || (duration === 15 && totalSubColumn === 1)) ? 'none' : 'auto',
                                          visibility: salonId && appointment.id ? 'visible' : 'hidden',
                                          right: (duration <= 10) ? '8px' : '8px',
                                          transform: (duration <= 10 || (duration === 15 && totalSubColumn === 1)) ? 'translateX(0)' : 'none',
                                          minWidth: (duration === 15 && totalSubColumn === 1) ? '50px' : 'auto',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <StatoCard
                                          salonId={salonId}
                                          orderId={appointment.id}
                                          compact={true}
                                          onStatusUpdate={fetchAppointments}
                                          buttonColor="#fff"
                                          size={duration <= 15 || ((duration === 20 || duration === 25) && totalSubColumn === 1) ? "xs" : "normal"}
                                          textOnly={duration <= 15 || ((duration === 20 || duration === 25) && totalSubColumn === 1) || (filteredMembers.length === 4 && totalSubColumn === 4 && duration <= 30)}
                                          task={appointment.task}
                                        />
                                      </div>
                                    </>
                                  );
                                })()
                              )}

                              {/* Icona di avviso per pausa in conflitto */}
                              {appointment.status === 'Pausa' && isPausaInConflict && (
                                <div 
                                  className="absolute top-2 left-2 z-20 bg-red-100 rounded-full p-1 border border-red-400 shadow-sm"
                                  title="Pausa in conflitto con altro appuntamento!"
                                >
                                  <span className="text-red-600 text-xs font-bold">⚠️</span>
                                </div>
                              )}
                              </div>
                            )}
                            
                            {/* Resize handle - modern Notion style */}
                            {appointment.status !== 'pagato' && appointment.status !== 'Eliminato' && (
                              <div
                              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-4 flex justify-center items-end bg-transparent z-50 group/resizehandle"
                              style={{ pointerEvents: 'none' }}
                              >
                              <div
                                className="w-8 h-1 mb-1 rounded-full bg-gray-400/60 shadow-sm opacity-0 group-hover:opacity-90 transition-all duration-200 resize-handle hover:bg-gray-500/70"
                                style={{ 
                                  pointerEvents: 'auto', 
                                  cursor: 'ns-resize',
                                  backdropFilter: 'blur(4px)'
                                }}
                                onMouseDown={(e) => {
                                e.stopPropagation();
                                handleResizeStart(e, appointment);
                                }}
                              />
                              </div>
                            )}
                            </div>
                          </div>
                          );
                        }
                        })}
                      </td>
                    ))}
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view - keep the existing mobile view */}
      <div className="block md:hidden flex-1 flex flex-col overflow-hidden" style={{ margin: 0, padding: 0 }}>
        {/* Toggle button for mobile header - Always visible */}
        <div className="fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 z-30 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 active:scale-95 hover:shadow-md"
                title="Apri calendario"
              >
                <CalendarIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              <button
                onClick={() => setShowMemberFilter(!showMemberFilter)}
                className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 active:scale-95 hover:shadow-md"
                title="Filtra membri"
              >
                <UserPlus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 active:scale-95 hover:shadow-md"
                title="Filtra stati"
              >
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Quick date info and navigation */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => {
                  handleDateChange(subDays(dailyViewDate, 1));
                }}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                disabled={isDateChanging}
              >
                <FaChevronLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {(() => {
                  const day = dailyViewDate.getDate();
                  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
                  const month = months[dailyViewDate.getMonth()];
                  return `${day} ${month}`;
                })()}
              </div>
              
              <button 
                onClick={() => {
                  handleDateChange(addDays(dailyViewDate, 1));
                }}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                disabled={isDateChanging}
              >
                <FaChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Modern date picker overlay - Full screen mobile */}
        {showDatePicker && (
          <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Seleziona Data</h2>
              <button
                onClick={() => setShowDatePicker(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {/* Quick date options */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Opzioni rapide</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        handleDateChange(new Date());
                        setShowDatePicker(false);
                      }}
                      className="p-4 text-center rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
                      disabled={isDateChanging}
                    >
                      Oggi
                    </button>
                    <button
                      onClick={() => {
                        handleDateChange(addDays(new Date(), 1));
                        setShowDatePicker(false);
                      }}
                      className="p-4 text-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-95 disabled:opacity-50"
                      disabled={isDateChanging}
                    >
                      Domani
                    </button>
                    <button
                      onClick={() => {
                        handleDateChange(addDays(new Date(), 7));
                        setShowDatePicker(false);
                      }}
                      className="p-4 text-center rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-all duration-200 active:scale-95 disabled:opacity-50"
                      disabled={isDateChanging}
                    >
                      +7 giorni
                    </button>
                  </div>
                </div>
                
                {/* Calendar grid */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendario</h3>
                  {(() => {
                    const today = new Date();
                    const currentMonth = dailyViewDate.getMonth();
                    const currentYear = dailyViewDate.getFullYear();
                    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
                    const startDate = new Date(firstDayOfMonth);
                    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
                    
                    const days = [];
                    for (let i = 0; i < 42; i++) {
                      const date = new Date(startDate);
                      date.setDate(startDate.getDate() + i);
                      days.push(date);
                    }
                    
                    return (
                      <div>
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-6">
                          <button
                            onClick={() => {
                              const newDate = new Date(currentYear, currentMonth - 1, Math.min(dailyViewDate.getDate(), new Date(currentYear, currentMonth, 0).getDate()));
                              handleDateChange(newDate);
                            }}
                            className="p-3 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95 disabled:opacity-50"
                            disabled={isDateChanging}
                          >
                            <FaChevronLeft className="h-5 w-5 text-gray-600" />
                          </button>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {(() => {
                              const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
                              const month = months[currentMonth];
                              return `${month} ${currentYear}`;
                            })()}
                          </h3>
                          <button
                            onClick={() => {
                              const newDate = new Date(currentYear, currentMonth + 1, Math.min(dailyViewDate.getDate(), new Date(currentYear, currentMonth + 2, 0).getDate()));
                              handleDateChange(newDate);
                            }}
                            className="p-3 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95 disabled:opacity-50"
                            disabled={isDateChanging}
                          >
                            <FaChevronRight className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                        
                        {/* Days of week */}
                        <div className="grid grid-cols-7 gap-2 mb-4">
                          {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day) => (
                            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-3">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-2">
                          {days.map((date, index) => {
                            const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                            const isSelected = format(date, 'yyyy-MM-dd') === format(dailyViewDate, 'yyyy-MM-dd');
                            const isCurrentMonth = date.getMonth() === currentMonth;
                            const hasAppointments = appointments.some(apt => apt.data === format(date, 'yyyy-MM-dd'));
                            
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  handleDateChange(date);
                                  setShowDatePicker(false);
                                }}
                                className={`
                                  relative aspect-square flex items-center justify-center text-base font-medium rounded-xl transition-all duration-200 calendar-day-button
                                  ${isSelected 
                                    ? 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-300' 
                                    : isToday 
                                      ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 ring-1 ring-purple-300' 
                                      : isCurrentMonth 
                                        ? 'text-gray-900 hover:bg-gray-100' 
                                        : 'text-gray-400 hover:bg-gray-50'
                                  }
                                  ${hasAppointments && !isSelected ? 'after:absolute after:bottom-2 after:left-1/2 after:transform after:-translate-x-1/2 after:w-2 after:h-2 after:bg-purple-400 after:rounded-full' : ''}
                                `}
                                disabled={isDateChanging}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member filter overlay - Full screen mobile */}
        {showMemberFilter && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Filtra Membri</h2>
              <button
                onClick={() => setShowMemberFilter(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 pb-8">
                {/* Groups section */}
                {groups.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Gruppi</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          handleGroupChange(null);
                          setShowMemberFilter(false);
                        }}
                        className={`w-full p-3 text-left rounded-xl border transition-all duration-200 ${
                          !selectedGroupId 
                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Tutti i membri</span>
                          {!selectedGroupId && <Check className="h-5 w-5" />}
                        </div>
                      </button>
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            handleGroupChange(group.id);
                            setShowMemberFilter(false);
                          }}
                          className={`w-full p-3 text-left rounded-xl border transition-all duration-200 ${
                            selectedGroupId === group.id 
                              ? 'bg-blue-50 border-blue-300 text-blue-700' 
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{group.name}</span>
                            {selectedGroupId === group.id && <Check className="h-5 w-5" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual members */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Membri del team</h3>
                  <div className="space-y-3">
                    {teamMembers.map((member) => {
                      const isSelected = selectedTeamMemberIds.includes(member.id);
                      const memberAppointmentCount = appointments.filter(
                        (appointment) =>
                          appointment.team_id === member.id &&
                          appointment.data === format(dailyViewDate, "yyyy-MM-dd") &&
                                                      appointment.status !== t('calendar.deleted', 'Eliminato')
                      ).length;
                      
                      return (
                        <button
                          key={member.id}
                          onClick={() => handleToggleMember(member.id)}
                          className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.avatar_url} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <div className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                  {member.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {memberAppointmentCount} appuntamenti oggi
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status filter overlay - Full screen mobile */}
        {showStatusFilter && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Filtra Stati</h2>
              <button
                onClick={() => setShowStatusFilter(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 pb-8">

                {/* Status filters */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stati appuntamenti</h3>
                  <div className="space-y-3">
                    {APPOINTMENT_STATUSES.map((status) => {
                      const isSelected = selectedStatusFilters.includes(status.value);
                      const appointmentCount = appointments.filter(appointment => appointment.status === status.value).length;
                      
                      return (
                        <button
                          key={status.value}
                          onClick={() => {
                            const newFilters = isSelected
                              ? selectedStatusFilters.filter(f => f !== status.value)
                              : [...selectedStatusFilters, status.value];
                            setSelectedStatusFilters(newFilters);
                            try {
                              localStorage.setItem('statusFilters', JSON.stringify(newFilters));
                            } catch (error) {
                              console.error("Errore nel salvataggio dei filtri:", error);
                            }
                          }}
                          className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                            isSelected 
                              ? 'bg-green-50 border-green-300' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              <div className="text-left">
                                <div className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                                  {status.label}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointmentCount} appuntamenti
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-green-600 border-green-600' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Show deleted appointments toggle */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Opzioni avanzate</h3>
                  <button
                    onClick={() => {
                      setShowDeletedAppointments(!showDeletedAppointments);
                      setShowStatusFilter(false);
                    }}
                    className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                      showDeletedAppointments 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Trash className="h-5 w-5 text-red-500" />
                        <div className="text-left">
                          <div className={`font-medium ${showDeletedAppointments ? 'text-red-700' : 'text-gray-900'}`}>
                            Mostra appuntamenti eliminati
                          </div>
                          <div className="text-sm text-gray-500">
                            {t('calendar.show_deleted', 'Visualizza anche gli appuntamenti con stato "Eliminato"')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          showDeletedAppointments 
                            ? 'bg-red-600 border-red-600' 
                            : 'border-gray-300'
                        }`}>
                          {showDeletedAppointments && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Mobile schedule view */}
        <div className="flex-1 overflow-y-auto px-4 pb-0 space-y-4" style={{ paddingTop: '68px' }}>
          {/* Date indicator for mobile */}
          <div className={`mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-200 transition-opacity duration-200 ${isDateChanging ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  {(() => {
                    const days = [
  t('day.sunday', 'Domenica'),
  t('day.monday', 'Lunedì'),
  t('day.tuesday', 'Martedì'),
  t('day.wednesday', 'Mercoledì'),
  t('day.thursday', 'Giovedì'),
  t('day.friday', 'Venerdì'),
  t('day.saturday', 'Sabato')
];
                    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
                    const dayName = days[dailyViewDate.getDay()];
                    const day = dailyViewDate.getDate();
                    const month = months[dailyViewDate.getMonth()];
                    const year = dailyViewDate.getFullYear();
                    return `${dayName}, ${day} ${month} ${year}`;
                  })()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {(() => {
                  const todayAppointmentsCount = appointments.filter(appointment => {
                    const isToday = appointment.data === format(dailyViewDate, "yyyy-MM-dd");
                    const statusFilter = showDeletedAppointments || appointment.status !== t('calendar.deleted', 'Eliminato');
                    const memberFilter = selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(appointment.team_id);
                    const statusFilterMatch = selectedStatusFilters.length === 0 || 
                      selectedStatusFilters.includes(appointment.status) ||
                      (selectedStatusFilters.includes('') && !appointment.status) ||
                      (selectedStatusFilters.some(filter => filter === null) && appointment.status === null);
                    
                    return isToday && statusFilter && memberFilter && statusFilterMatch;
                  }).length;
                  return todayAppointmentsCount === 1 ? `1 ${t('calendar.appointment', 'appuntamento')}` : `${todayAppointmentsCount} ${t('calendar.appointments', 'appuntamenti')}`;
                })()}
              </div>
            </div>
          </div>

          {/* Mobile appointments cards */}
          <div className={`space-y-3 transition-opacity duration-200 ${isDateChanging ? 'opacity-50' : 'opacity-100'}`}>
            {(() => {
              // Filtra gli appuntamenti del giorno corrente
              const todayAppointments = appointments.filter(appointment => {
                const isToday = appointment.data === format(dailyViewDate, "yyyy-MM-dd");
                const statusFilter = showDeletedAppointments || appointment.status !== t('calendar.deleted', 'Eliminato');
                const memberFilter = selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(appointment.team_id);
                const statusFilterMatch = selectedStatusFilters.length === 0 || 
                  selectedStatusFilters.includes(appointment.status) ||
                  (selectedStatusFilters.includes('') && !appointment.status) ||
                  (selectedStatusFilters.some(filter => filter === null) && appointment.status === null);
                
                return isToday && statusFilter && memberFilter && statusFilterMatch;
              }).sort((a, b) => {
                // Ordina per orario di inizio
                const timeA = parse(a.orarioInizio, "HH:mm", new Date());
                const timeB = parse(b.orarioInizio, "HH:mm", new Date());
                return timeA.getTime() - timeB.getTime();
              });

              if (todayAppointments.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarIcon className="h-10 w-10 text-purple-600" />
                    </div>
                    <p className="text-gray-900 text-xl font-semibold mb-2">{t('calendar.no_appointments', 'Nessun appuntamento')}</p>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      {selectedStatusFilters.length > 0 || selectedTeamMemberIds.length > 0 
                        ? t('calendar.no_appointments_filter', 'Nessun appuntamento corrisponde ai filtri applicati per questa data')
                        : `Non ci sono appuntamenti per ${format(dailyViewDate, "dd/MM/yyyy")}`
                      }
                    </p>
                    <button 
                      onClick={() => handleDateChange(new Date())}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
                      disabled={isDateChanging}
                    >
                      {t('calendar.back_to_today', 'Torna ad oggi')}
                    </button>
                  </div>
                );
              }

              // Touch handling state for tap-vs-scroll detection
              let touchStartY = 0;
              let touchStartX = 0;
              const TAP_THRESHOLD = 10; // px

              // Touch handlers for tap-vs-scroll
              const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
                const touch = e.touches[0];
                touchStartY = touch.clientY;
                touchStartX = touch.clientX;
              };
              
              const handleTouchEnd = (appointment: any) => (e: React.TouchEvent<HTMLDivElement>) => {
                const touch = e.changedTouches[0];
                const deltaY = Math.abs(touch.clientY - touchStartY);
                const deltaX = Math.abs(touch.clientX - touchStartX);
                if (deltaY < TAP_THRESHOLD && deltaX < TAP_THRESHOLD) {
                  if (appointment.status !== 'Pausa') {
                    handleCardClick(appointment, e as any);
                  }
                }
              };

              return todayAppointments.map((appointment) => {
                const member = teamMembers.find(m => m.id === appointment.team_id);
                const memberColor = member?.ColorMember || '#e4b875';
                const startTime = parse(appointment.orarioInizio, "HH:mm", new Date());
                const endTime = parse(appointment.orarioFine, "HH:mm", new Date());
                const duration = differenceInMinutes(endTime, startTime);

                const isCancelled = appointment.status === "cancelled";
                const isDeleted = appointment.status === "deleted";
                const isEliminato = appointment.status === t('calendar.deleted', 'Eliminato');
                const isPausa = appointment.status === "Pausa";

                // Stile della card in base allo stato
                const getCardStyle = () => {
                  // ...existing code...
                  const appointmentCardStyle = getAppointmentCardStyle(appointment);
                  const boxShadow = appointmentCardStyle.boxShadow;
                  const isDarkMode = document.documentElement.classList.contains('dark');
                  
                  if (isPausa) {
                    return {
                      backgroundColor: isDarkMode ? '#334155' : '#f6f7fa',
                      backgroundImage: isDarkMode 
                        ? `repeating-linear-gradient(135deg, #475569 0px, #475569 8px, #334155 8px, #334155 16px)`
                        : `repeating-linear-gradient(135deg, #dbe3ea 0px, #dbe3ea 8px, #f6f7fa 8px, #f6f7fa 16px)`,
                      border: '2px solid #60a5fa',
                      color: isDarkMode ? '#94a3b8' : '#7b8794',
                      boxShadow: '0 0 0 1px #bae6fd',
                    } as React.CSSProperties;
                  }
                  if (isEliminato) {
                    const eliminatoBoxShadow = boxShadow ? `${boxShadow}, 0 0 0 1px #fecaca` : '0 0 0 1px #fecaca';
                    return {
                      backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2',
                      border: '2px solid #dc2626',
                      color: isDarkMode ? '#fca5a5' : '#9CA3AF',
                      boxShadow: eliminatoBoxShadow,
                      opacity: 0.7,
                    } as React.CSSProperties;
                  }
                  if (isCancelled || isDeleted) {
                    return {
                      backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                      border: '1px dashed rgba(156, 163, 175, 0.7)',
                      color: isDarkMode ? '#9ca3af' : '#9CA3AF',
                      opacity: 0.6,
                      boxShadow: boxShadow as string,
                    } as React.CSSProperties;
                  }
                  const standardBoxShadow = boxShadow
                    ? `${boxShadow}, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  return {
                    ...appointmentCardStyle,
                    backgroundColor: appointment.status === 'pagato'
                      ? (isDarkMode ? '#1e293b' : '#f3f4f6')
                      : (typeof appointmentCardStyle.background === 'string'
                          ? appointmentCardStyle.background
                          : (isDarkMode ? '#1e293b' : '#fff')),
                    border: `2px solid ${memberColor}`,
                    color: isDarkMode ? '#f1f5f9' : '#1f2937',
                    boxShadow: standardBoxShadow,
                  } as React.CSSProperties;
                };

                // Forza il re-render della card quando cambia lo stato
                const cardKey = `${appointment.id}-${appointment.status}`;
                return (
                  <div
                    key={cardKey}
                    className="rounded-xl p-4 transition-all duration-200 hover:shadow-lg relative bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    style={getCardStyle()}
                    onClick={(e) => {
                      if (!isMobile && appointment.status !== 'Pausa') {
                        handleCardClick(appointment, e);
                      }
                    }}
                    onTouchStart={isMobile ? handleTouchStart : undefined}
                    onTouchEnd={isMobile ? handleTouchEnd(appointment) : undefined}
                  >
                    {/* Linea colorata a sinistra rimossa in mobile */}
                    {/* Header della card */}
                    <div className="flex items-start justify-between mb-3" style={{ marginLeft: 10 }}>
                      {/* Icona utente standard a cerchio */}
                      <div className="flex items-center mr-3">
                        <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400" style={{ width: 38, height: 38 }}>
                          {/* Heroicons User SVG */}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a7.5 7.5 0 0115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V19.5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-slate-100">
                            {isPausa ? 'Pausa' : (appointment.nome || 'Senza nome')}
                          </h3>
                          {isPausa && (
                            <span className="text-xl">☕</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                          {member?.name || 'Membro sconosciuto'}
                        </p>
                      </div>
                      {/* Orario e durata */}
                      <div className="text-right">
                        <div className="font-mono text-sm font-medium text-gray-900 dark:text-slate-100">
                          {appointment.orarioInizio} - {appointment.orarioFine}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {formatDuration(duration)}
                        </div>
                      </div>
                    </div>

                    {/* Servizi (se presenti e non è una pausa) */}
                    {!isPausa && appointment.services && appointment.services.length > 0 && (
                      <div className="mb-3">
                        {duration === 15 ? (
                          // Per appuntamenti da 15 minuti, mostra solo il numero di servizi con carattere ridotto
                          <div className="flex">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800" style={{ fontSize: '10px' }}>
                              {appointment.services.length} {appointment.services.length === 1 ? 'servizio' : 'servizi'}
                            </span>
                          </div>
                        ) : (
                          // Per altri appuntamenti, mostra i nomi dei servizi
                          <div className="flex flex-col gap-2">
                            {appointment.services.map((service, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                style={{ marginBottom: 2 }}
                              >
                                {(service as any).servizio || service.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Note o informazioni aggiuntive */}
                    {appointment.note && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-slate-300">{appointment.note}</p>
                      </div>
                    )}

                    {/* Footer con stato */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex items-center space-x-2">
                        {appointment.status && salonId && (
                          <StatoCard
                            salonId={salonId}
                            orderId={appointment.id}
                            compact={true}
                            onStatusUpdate={fetchAppointments}
                            buttonColor="#fff"
                            textOnly={false}
                            task={appointment.task}
                          />
                        )}
                      </div>
                      {/* Indicatori di stato speciali */}
                      {isEliminato && (
                        <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                          <Trash className="h-4 w-4" />
                          <span className="text-xs font-medium">Eliminato</span>
                        </div>
                      )}
                      {isPausa && (
                        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-medium">Pausa</span>
                        </div>
                      )}
                      {appointment.status === 'pagato' && (
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <Check className="h-4 w-4" />
                          <span className="text-xs font-medium">Pagato</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const toggleMemberExpansion = (memberId: string) => {
    if (expandedMembers.includes(memberId)) {
      setExpandedMembers(expandedMembers.filter(id => id !== memberId));
    } else {
      setExpandedMembers([...expandedMembers, memberId]);
    }
  };

  const handleTabChange = (memberId: string) => {
    setActiveTab(activeTab === memberId ? null : memberId);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    // Set the selected appointment
    setSelectedAppointment(appointment);
    
    // Open the dialog
    setIsDialogOpen(true);
  };

  // RIMOSSO: useEffect di monitoring che causava re-render inutili

  // Helper function to get status color
  const getStatusColor = (status: string | null): string => {
    if (!status) return 'gray'; // Default color for null/undefined status
    const statusItem = APPOINTMENT_STATUSES.find(s => s.value === status);
    return statusItem ? statusItem.color : 'gray'; // Return the color or gray as fallback
  };


  // Lazy import to avoid SSR issues
  const EditOrderForm = React.useMemo(() => {
    try {
      return require("../../_CreateOrder/EditOrderFormMobile").default;
    } catch {
      return null;
    }
  }, []);

  // Funzione per il salvataggio della modifica
  const handleEditOrderSave = async (updated: { data: string; orarioInizio: string; orarioFine: string }) => {
    if (!editOrderId) return;
    // Aggiorna localmente
    setAppointments((prev) => prev.map(app =>
      app.id === editOrderId ? { ...app, ...updated } : app
    ));
    // Aggiorna su Supabase
    try {
      await supabase.from('orders').update({
        data: updated.data,
        orarioInizio: updated.orarioInizio,
        orarioFine: updated.orarioFine,
      }).eq('id', editOrderId);
    } catch (error) {
      // Gestisci errore
    }
    setIsEditOrderOpen(false);
    setEditOrderId(null);
    setEditOrderInitialData(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-gray-900" style={{ margin: 0, padding: 0 }}>
      {/* Sidebar for appointment info RIMOSSO: SidebarCardInfo */}
      {/* Dialogs */}

      {/* Only mount CreateOrder when open, to ensure fresh data fetch */}
      {isCreateOrderOpen && (
        <CreateOrder
          isDialogOpen={isCreateOrderOpen}
          setIsDialogOpen={setIsCreateOrderOpen}
          initialFormData={initialFormData}
          onAppointmentCreated={fetchAppointments}
        />
      )}
      
      {/* CreatePausa Modal */}
      {isCreatePausaOpen && (
        <CreatePausaForm
          open={isCreatePausaOpen}
          onOpenChange={setIsCreatePausaOpen}
          initialFormData={initialFormData}
          onPausaCreated={fetchAppointments}
        />
      )}
      
      {/* EditOrderForm Modal */}
      {isEditOrderOpen && EditOrderForm && editOrderInitialData && (
        <EditOrderForm
          open={isEditOrderOpen}
          onClose={() => { setIsEditOrderOpen(false); setEditOrderId(null); setEditOrderInitialData(null); }}
          initialData={editOrderInitialData}
          onSave={handleEditOrderSave}
        />
      )}
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
        onTaskUpdated={fetchAppointments}
      />

      {/* Dropdown menu per la cella (shadcn, con icone navbar-consistenti) */}
      {cellClickDropdown?.isOpen && (
        <DropdownMenu open={cellClickDropdown.isOpen} onOpenChange={(open) => { if (!open) setCellClickDropdown(null); }}>
          <DropdownMenuTrigger asChild>
            <div
              style={{ position: "fixed", left: cellClickDropdown.x, top: cellClickDropdown.y, zIndex: 9999, width: 0, height: 0 }}
              tabIndex={-1}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={4} align="start" style={{ minWidth: 180 }}>
            {(userRole === 'manager' || userRole === 'admin' || userRole === 'owner' || (hasPermission && hasPermission('canCreateAppointments'))) && (
              <DropdownMenuItem onClick={handleCreateAppointment}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Crea nuovo appuntamento
              </DropdownMenuItem>
            )}
            {(userRole === 'manager' || userRole === 'admin' || userRole === 'owner' || (hasPermission && hasPermission('canCreateAppointments'))) && (
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
      
      {/* Main content area with calendar and sidebar */}
      <div className="flex-1 flex h-full">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto min-w-fit" style={{ margin: 0, padding: 0 }}>
          <div className="min-w-fit h-full" style={{ background: 'none', margin: 0, padding: 0 }}>
            {renderCalendarGrid()}
          </div>
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
                    selectedTeamMemberIds.includes(member.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-400 bg-gray-200 hover:border-gray-500 hover:bg-gray-300'
                  }`}>
                    <LazyAvatar
                      member={member}
                      className={`w-8 h-8 ${!selectedTeamMemberIds.includes(member.id) ? 'opacity-60' : ''}`}
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

      {/* AnteprimaCard hover tooltip */}
      {showAnteprimaCard && hoveredAppointment && (
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
 
        </div>
      )}
    </div>
  );
}

// Memo con controllo ottimizzato delle props per evitare re-render inutili
export default React.memo(DailyCalendar, (prevProps, nextProps) => {
  // Il componente non ha props esterne, quindi può sempre essere memoizzato
  return true;
});