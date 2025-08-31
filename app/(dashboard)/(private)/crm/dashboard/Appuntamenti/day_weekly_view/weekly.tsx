'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, startOfDay, endOfDay, addDays, subDays, parse, differenceInMinutes, addMinutes, startOfWeek } from "date-fns";
// Helper to format durations consistently
function formatDuration(duration: number): string {
  if (duration < 60) return `${duration} min`;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (minutes === 0) return `${hours}h`;
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}.${minutesStr}h`;
}
import { it } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";
import { getSalonId, canEditAppointment } from '@/utils/getSalonId';


import { FaCalendarAlt, FaTasks, FaArrowLeft, FaArrowRight, FaChevronLeft, FaChevronRight, FaTrash } from "react-icons/fa"; // Removed FaCut
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { EditServicesModal } from "../../_CreateOrder/modaleditcard";
import { TaskEditModal, Task } from "./TaskEditModal";
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
import NavbarSecondaria from "./navbar_secondaria_weekly";
import { useToast } from "@/hooks/use-toast";
import { CreateOrder } from "../../_CreateOrder/CreateOrder";
import SettingCalendar from "./SettingCalendar";
import { ChevronDown, Menu, Calendar as CalendarIcon, Clock, UserPlus } from "lucide-react";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import FocusIcon from "./FocusIcon";
import StatoCard from "./StatoCard"; // Import the StatoCard component

import { APPOINTMENT_STATUSES } from "@/components/status";
import dynamic from "next/dynamic";
import { formatTime, formatTimeString, TimeFormat } from "./timeUtils";
import { getUserTimeFormat, setupAppointmentsSubscription, setupDeletedAppointmentsSubscription } from "../../query/query";
import { listenForAppointmentEvents, APPOINTMENT_EVENTS } from "../../utils/appointmentEvents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
import CreatePausaForm from "../../_CreateOrder/pausa";

const supabase = createClient();

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
  task?: boolean; // Indicates if this is a task
  email?: string; // Add email property for notification
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

interface WeeklyCalendarProps {
  hasPermission?: (permission: string) => boolean;
  userRole?: string | null;
}

function WeeklyCalendar({ hasPermission, userRole }: WeeklyCalendarProps = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true); // Start with loading state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hourHeight, setHourHeight] = useState(180); // Default height for each hour
  const [hoverEffectEnabled, setHoverEffectEnabled] = useState(true);
  const [alternativeViewEnabled, setAlternativeViewEnabled] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null); // State for selected appointment
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog visibility
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false); // Add new state for CreateOrder
  const [isCreatePausaOpen, setIsCreatePausaOpen] = useState(false); // Add new state for CreatePausa
  const [cellClickDropdown, setCellClickDropdown] = useState<{
    isOpen: boolean;
    hourTime: Date;
    dayDate: Date;
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
  const [dragPreview, setDragPreview] = useState<{ time: Date; dayDate?: Date; memberId?: string } | null>(null);
  // Ref to throttle drag-over DOM updates
  const dragAnimationFrame = useRef<number | null>(null);
  const lastDragOverData = useRef<{ time: Date; dayDate?: Date; memberId?: string; clientX: number; clientY: number } | null>(null);
  const [resizeGhost, setResizeGhost] = useState<{ top: number; height: number } | null>(null);

  const [resizing, setResizing] = useState<{
    appointment: Appointment;
    startY: number;
    initialDuration: number;
    newDuration?: number;
  } | null>(null);
  const [initialFormData, setInitialFormData] = useState<{
    data: string;
    orarioInizio: string;
    orarioFine: string;
    team_id?: string;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isWeeklyView, setIsWeeklyView] = useState(false); // Add state for weekly view
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<(string | null)[]>([]); // Add state for status filters
  const [currentStatus, setCurrentStatus] = useState<string>(''); 
  const [rowHeight, setRowHeight] = useState(200); // Aumentato da 160 a 200
  const [lastDeletedAppointment, setLastDeletedAppointment] = useState<Appointment | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [isSettingCalendarOpen, setIsSettingCalendarOpen] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showDeletedAppointments, setShowDeletedAppointments] = useState(false);
  const [startMemberIndex, setStartMemberIndex] = useState(0);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<{ group_id: string; team_member_id: string }[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null); // Add salonId state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("24"); // State for time format preference
  const [cardSizeSetting, setCardSizeSetting] = useState<string>("normal"); // State for card size setting
  const [cardAlignmentSetting, setCardAlignmentSetting] = useState<string>("center"); // State for card alignment setting
  const [hideOutsideHoursSetting, setHideOutsideHoursSetting] = useState<boolean>(false); // State for hide outside hours setting
  const [isEditServicesOpen, setIsEditServicesOpen] = useState(false); // State for EditServicesModal
  const [isTaskEditModalOpen, setIsTaskEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | Appointment | null>(null);

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
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null); // Add focusedMemberId state
  const [daysToShow, setDaysToShow] = useState<number | null>(null); // Number of days to display (1-7), null until loaded
  const [isDaysToShowLoaded, setIsDaysToShowLoaded] = useState(false); // Track if daysToShow has been loaded
  const [isInitializing, setIsInitializing] = useState(true); // Track if component is initializing

  // Real-time subscription refs
  const appointmentsSubscriptionRef = useRef<any>(null);
  const deletedAppointmentsSubscriptionRef = useRef<any>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isLargeScreen = useMediaQuery("(min-width: 1440px)");
  const { toast } = useToast();

  // Hook per rilevare le dimensioni dello schermo
  const [screenDimensions, setScreenDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Hook per rilevare le dimensioni del container del calendario
  const [calendarDimensions, setCalendarDimensions] = useState({
    width: 0,
    height: 0,
    columnWidth: 0
  });

  // Ref per il container del calendario
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Effetto per rilevare le dimensioni dello schermo
  useEffect(() => {
    const handleResize = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effetto per rilevare le dimensioni del calendario
  useEffect(() => {
    const updateCalendarDimensions = () => {
      if (calendarContainerRef.current) {
        const rect = calendarContainerRef.current.getBoundingClientRect();
        const totalMembers = teamMembers.filter(m => selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(m.id)).length;
        const columnWidth = totalMembers > 0 ? rect.width / totalMembers : rect.width;
        
        setCalendarDimensions({
          width: rect.width,
          height: rect.height,
          columnWidth: columnWidth
        });
      }
    };

    updateCalendarDimensions();
    window.addEventListener('resize', updateCalendarDimensions);
    return () => window.removeEventListener('resize', updateCalendarDimensions);
  }, [teamMembers, selectedTeamMemberIds]);

  // Load daysToShow from database on component mount
  useEffect(() => {
    const loadDaysToShow = async () => {
      try {
        const salonId = await getSalonId();
        if (!salonId) {
          console.error("Salon ID non disponibile");
          setDaysToShow(4); // Fallback default
          setIsDaysToShowLoaded(true);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from("team")
          .select("rowmonthly")
          .eq("salon_id", salonId)
          .limit(1)
          .single();

        if (error) {
          console.error("Errore nel caricare il numero di giorni:", error);
          setDaysToShow(4); // Fallback default
        } else if (data?.rowmonthly && data.rowmonthly >= 1 && data.rowmonthly <= 7) {
          setDaysToShow(data.rowmonthly);
        } else {
          setDaysToShow(4); // Fallback default
        }
        
        setIsDaysToShowLoaded(true);
      } catch (error) {
        console.error("Errore nel caricare il numero di giorni:", error);
        setDaysToShow(4); // Fallback default
        setIsDaysToShowLoaded(true);
      }
    };

    loadDaysToShow();
  }, []);

  // Calculate week dates (configurable number of days starting from selected date)
  const weekDates = useMemo(() => {
    if (!daysToShow || daysToShow === null) return []; // Return empty array until daysToShow is loaded
    const dates = [];
    for (let i = 0; i < daysToShow; i++) {
      dates.push(addDays(dailyViewDate, i));
    }
    return dates;
  }, [dailyViewDate, daysToShow]);

  // Helper functions
  const getInitials = (name: string) => {
    const [firstName, lastName] = name.split(' ');
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  // Helper function to render team member avatar
  const renderTeamMemberAvatar = (teamMember: Member | undefined, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6', 
      lg: 'w-8 h-8'
    };
    
    const textSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };

    if (teamMember?.avatar_url) {
      return (
        <Avatar className={`${sizeClasses[size]} border border-gray-200`}>
          <AvatarImage
            src={teamMember.avatar_url}
            alt={teamMember.name}
            className="object-cover"
          />
          <AvatarFallback 
            className={`${textSizes[size]} font-medium text-white`}
            style={{ backgroundColor: teamMember.ColorMember || '#e4b875' }}
          >
            {getInitials(teamMember.name)}
          </AvatarFallback>
        </Avatar>
      );
    } else {
      return (
        <Avatar className={`${sizeClasses[size]} border border-gray-200`}>
          <AvatarFallback 
            className={`${textSizes[size]} font-medium text-white`}
            style={{ backgroundColor: teamMember?.ColorMember || '#e4b875' }}
          >
            {teamMember ? getInitials(teamMember.name) : '?'}
          </AvatarFallback>
        </Avatar>
      );
    }
  };

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
  
  // Funzione per creare sub-colonne dinamiche solo per le sovrapposizioni - updated for weekly view
  const organizeAppointmentsInDynamicColumns = (appointments: Appointment[], date: Date) => {
    const columns: { [key: string]: number } = {};
    const subColumns: { [key: string]: number } = {}; // Sub-colonne per le sovrapposizioni
    const totalSubColumns: { [key: string]: number } = {}; // Numero totale di sub-colonne per ogni sovrapposizione
    const overlappingMap: { [key: string]: boolean } = {};
    
    const selectedDateStr = format(date, "yyyy-MM-dd");
    
    const dayAppointments = appointments.filter(
      (appointment) => {
        const dateMatch = appointment.data === selectedDateStr;
        // Esclude gli appuntamenti eliminati se showDeletedAppointments è false
        const statusFilter = showDeletedAppointments ? true : appointment.status !== 'Eliminato';
        // Filter by selected team members
        const teamFilter = selectedTeamMemberIds.length === 0 ? true : selectedTeamMemberIds.includes(appointment.team_id);
        return dateMatch && statusFilter && teamFilter;
      }
    );
    
    const sortedAppointments = [...dayAppointments].sort((a, b) => {
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
      totalColumns: 1 // Manteniamo sempre una colonna principale per giorno
    };
  };

  const fetchAppointments = async (forceRefresh = false) => {
    console.log('Fetching appointments for weekly view...', { forceRefresh });
    
    // Set fetching flag to prevent real-time updates during fetch
    if (appointmentsSubscriptionRef.current?.setFetching) {
      appointmentsSubscriptionRef.current.setFetching(true);
    }
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error getting user:", userError?.message);
        return;
      }
    
      // First fetch orders - explicitly include status column (including deleted ones for toggle functionality)
      // Get salon_id using utility function
      const salonId = await getSalonId();
      
      if (!salonId) {
        console.error("No salon_id found for user:", user.id);
        return;
      }

      // Use salon_id instead of user_id to share appointments between team members
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*, status, color_card, prefer_card_style, task")
        .eq('salon_id', salonId)
        .order('orarioInizio', { ascending: true });
    
      if (ordersError) {
        console.error("Error fetching orders:", ordersError.message);
        return;
      }
      
      console.log(`Fetched ${orders?.length || 0} orders for weekly view`);
    
      // Then fetch associated services for each order
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
    
      console.log('Setting appointments state with fetched data for weekly view');
      setAppointments(appointmentsWithServices);
    } catch (error) {
      console.error("Unexpected error in fetchAppointments:", error);
    } finally {
      // Reset fetching flag
      if (appointmentsSubscriptionRef.current?.setFetching) {
        appointmentsSubscriptionRef.current.setFetching(false);
      }
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

      // Create complete appointment object with services
      const completeAppointment = {
        ...data,
        services: services || []
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
            serviceName: services && services.length > 0 ? services[0].servizio : "Servizio",
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

  // Memo per memorizzare il risultato del calcolo delle colonne per ogni giorno
  const dayColumnData = useMemo(() => {
    const result: { [key: string]: ReturnType<typeof organizeAppointmentsInDynamicColumns> } = {};
    
    weekDates.forEach(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      result[dateStr] = organizeAppointmentsInDynamicColumns(appointments, date);
    });
    
    return result;
  }, [appointments, weekDates, showDeletedAppointments, selectedTeamMemberIds]);

  const fetchUsersPerPage = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
  
    if (userError || !user) {
      console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
      return;
    }
  
    const { data, error } = await supabase
      .from("users_per_page") // Updated table name
      .select("number")
      .eq("user_id", user.id)
      .single();
  
    if (error) {
      console.error("Errore nel recupero del numero di membri per pagina:", error.message);
      return;
    }
  
    setMembersPerPage(data?.number || 8); // Default to 8 if no data
  };

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    let currentSalonId: string | null = null;
    
    const initializeData = async () => {
      try {
        // Get user and salon ID first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError?.message);
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(initializeData, 1000 * retryCount);
            return;
          }
          return;
        }

        // Get salon ID with retry logic
        let salonId = null;
        for (let i = 0; i < 3; i++) {
          try {
            salonId = await getSalonId();
            if (salonId) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.warn(`Salon ID attempt ${i + 1} failed:`, error);
            if (i === 2) {
              console.error("Failed to get salon ID after 3 attempts");
              return;
            }
          }
        }

        if (!salonId) {
          console.error("No salon_id found for user:", user.id);
          return;
        }

        if (!isMounted) return;

        // Set salon ID first
        currentSalonId = salonId;
        setSalonId(salonId);

        // Fetch data in parallel
        const [appointmentsResult, usersPerPageResult, groupsResult, groupMembersResult] = await Promise.allSettled([
          fetchAppointments(),
          fetchUsersPerPage(),
          fetchGroups(),
          fetchGroupMembers()
        ]);

        if (!isMounted) return;

        // Handle results
        if (appointmentsResult.status === 'rejected') {
          console.error('Failed to fetch appointments:', appointmentsResult.reason);
        }
        if (usersPerPageResult.status === 'rejected') {
          console.error('Failed to fetch users per page:', usersPerPageResult.reason);
        }
        if (groupsResult.status === 'rejected') {
          console.error('Failed to fetch groups:', groupsResult.reason);
        }
        if (groupMembersResult.status === 'rejected') {
          console.error('Failed to fetch group members:', groupMembersResult.reason);
        }

        // Load time format
        try {
          const format = await getUserTimeFormat();
          if (isMounted) {
            setTimeFormat(format as TimeFormat);
          }
        } catch (error) {
          console.error("Error loading time format:", error);
          if (isMounted) {
            setTimeFormat("24"); // Default to 24-hour format
          }
        }

        // Load saved status filters
        try {
          const savedFilters = localStorage.getItem('statusFilters');
          if (savedFilters && isMounted) {
            const parsedFilters = JSON.parse(savedFilters);
            if (Array.isArray(parsedFilters)) {
              setSelectedStatusFilters(parsedFilters);
            }
          }
        } catch (error) {
          console.error('Errore nel caricare i filtri di stato salvati:', error);
        }

        // Fetch team members
        await fetchTeamMembersWithRetry(salonId, user);

        // Mark initialization as complete
        if (isMounted) {
          setIsInitializing(false);
        }

      } catch (error) {
        console.error('Error in initializeData:', error);
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          setTimeout(initializeData, 1000 * retryCount);
        } else if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    const fetchTeamMembersWithRetry = async (salonId: string, user: any) => {
      try {
        setIsLoadingMembers(true);
        
        const [teamResult, hoursSettingsResult] = await Promise.allSettled([
          supabase
            .from("team")
            .select("id, name, email, phone_number, ColorMember, avatar_url, visible_users, order_column")
            .eq("salon_id", salonId)
            .eq("is_active", true)
            .order('order_column', { ascending: true }),
          supabase
            .from("hourssettings")
            .select("hide_outside_hours, SizeCard, CardAlignment")
            .eq("user_id", user.id)
            .eq("salon_id", salonId)
            .single()
        ]);

        if (!isMounted) return;

        const data = teamResult.status === 'fulfilled' ? teamResult.value.data : [];
        const error = teamResult.status === 'fulfilled' ? teamResult.value.error : teamResult.reason;

        if (error) {
          console.error("Errore nel recupero dei membri del team:", error.message);
          setIsLoadingMembers(false);
          return;
        }

        // Set settings
        if (hoursSettingsResult.status === 'fulfilled' && hoursSettingsResult.value.data) {
          setHideOutsideHoursSetting(hoursSettingsResult.value.data.hide_outside_hours || false);
          setCardSizeSetting(hoursSettingsResult.value.data.SizeCard || "normal");
          setCardAlignmentSetting(hoursSettingsResult.value.data.CardAlignment || "center");
        } else {
          setHideOutsideHoursSetting(false);
          setCardSizeSetting("normal");
          setCardAlignmentSetting("center");
        }

        // Set team members
        const visibleMemberIds = data
          ?.filter(member => member.visible_users)
          .map(member => member.id) || [];

        if (isMounted) {
          setTeamMembers(data || []);
          setSelectedTeamMemberIds(visibleMemberIds);
          setIsLoadingMembers(false);
        }

      } catch (error) {
        console.error('Error fetching team members:', error);
        if (isMounted) {
          setIsLoadingMembers(false);
        }
      }
    };

    initializeData();

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted && isInitializing) {
        console.warn('Initialization timeout reached, forcing completion');
        setIsInitializing(false);
      }
    }, 30000); // 30 seconds timeout

    // Setup subscriptions
    const subscription = supabase
      .channel('realtime:team')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team' },
        () => {
          if (isMounted) {
            // Re-fetch team members when team changes
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user && currentSalonId && isMounted) {
                fetchTeamMembersWithRetry(currentSalonId, user);
              }
            });
          }
        }
      )
      .subscribe();

    // Setup real-time subscriptions
    const appointmentsSub = setupAppointmentsSubscription(setAppointments);
    if (appointmentsSub) {
      appointmentsSubscriptionRef.current = appointmentsSub;
    }

    const deletedAppointmentsSub = setupDeletedAppointmentsSubscription(checkDeletedOrders);
    if (deletedAppointmentsSub) {
      deletedAppointmentsSubscriptionRef.current = deletedAppointmentsSub;
    }

    // Event listeners
    const removeEventListener = listenForAppointmentEvents(
      APPOINTMENT_EVENTS.CREATED,
      () => {
        if (isMounted) {
          console.log('Appointment created event received in weekly view, refreshing appointments...');
          fetchAppointments(true);
        }
      }
    );

    const handleAppointmentCreated = () => {
      if (isMounted) {
        console.log('Custom appointment created event received in weekly view, refreshing appointments...');
        fetchAppointments(true);
      }
    };

    window.addEventListener('appointment-created', handleAppointmentCreated);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      supabase.removeChannel(subscription);
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
  }, []); // Remove salonId dependency to prevent loops

  // Carica il numero di giorni da visualizzare dal localStorage
  useEffect(() => {
    try {
      const savedDaysToShow = localStorage.getItem('daysToShow');
      if (savedDaysToShow) {
        const days = parseInt(savedDaysToShow);
        if (days >= 1 && days <= 7) {
          setDaysToShow(days);
        }
      }
    } catch (error) {
      console.error("Errore nel caricamento del numero di giorni dal localStorage:", error);
    }
  }, []);

  // Salva il numero di giorni da visualizzare nel localStorage quando cambia
  useEffect(() => {
    if (daysToShow !== null) {
      try {
        localStorage.setItem('daysToShow', daysToShow.toString());
      } catch (error) {
        console.error("Errore nel salvataggio del numero di giorni nel localStorage:", error);
      }
    }
  }, [daysToShow]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  // Removed duplicate subscription - now using the advanced setupAppointmentsSubscription function

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

  // Calculate filtered members (still used for member selection in navbar and settings)
  const filteredMembers = useMemo(() => {
    return teamMembers; // In weekly view, we show all members but filter in appointment display
  }, [teamMembers]);

  // Weekly view shows 4 days, no pagination needed
  const displayedDays = weekDates;

  // Handle team member visibility toggle
  const handleToggleMember = useCallback(async (memberId: string) => {
    console.log("Toggle member:", memberId);
    let updatedMembers: string[];
    if (selectedTeamMemberIds.includes(memberId)) {
      // Impedisci la deselezione se questo è l'unico membro selezionato
      if (selectedTeamMemberIds.length <= 1) {
        toast({
          title: "Impossibile deselezionare",
          description: "Devi avere almeno un membro selezionato",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      // Remove from selection if already selected
      updatedMembers = selectedTeamMemberIds.filter(id => id !== memberId);
      console.log("Membri dopo rimozione:", updatedMembers);
      setSelectedTeamMemberIds(updatedMembers);
    } else {
      // Add to selection if not selected
      updatedMembers = [...selectedTeamMemberIds, memberId];
      console.log("Membri dopo aggiunta:", updatedMembers);
      setSelectedTeamMemberIds(updatedMembers);
    }
    // Salva la selezione dei membri nel localStorage
    try {
      localStorage.setItem('selectedTeamMemberIds', JSON.stringify(updatedMembers));
    } catch (error) {
      console.error("Errore nel salvataggio della selezione:", error);
    }
  }, [selectedTeamMemberIds, teamMembers, toast]);

  // Fetch groups
  const fetchGroups = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
  
    if (userError || !user) {
      console.error("Error getting user:", userError?.message);
      return;
    }

    // Get salon_id for shared data
    const salonId = await getSalonId();
    if (!salonId) {
      console.error("No salon_id found for user:", user.id);
      return;
    }
  
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq('salon_id', salonId);
  
    if (error) {
      console.error("Error fetching groups:", error.message);
      return;
    }
  
    setGroups(data || []);
  };

  // Fetch group members
  const fetchGroupMembers = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
  
    if (userError || !user) {
      console.error("Error getting user:", userError?.message);
      return;
    }

    // Get salon_id for shared data
    const salonId = await getSalonId();
    if (!salonId) {
      console.error("No salon_id found for user:", user.id);
      return;
    }
  
    const { data, error } = await supabase
      .from("chat_group_members")
      .select("*, groups!inner(salon_id)")
      .eq('groups.salon_id', salonId);
  
    if (error) {
      console.error("Error fetching group members:", error.message);
      return;
    }
  
    setGroupMembers(data || []);
  };

  // Handle group change
  const handleGroupChange = useCallback(async (groupId: string | null) => {
    console.log("Cambio gruppo a:", groupId);
    setSelectedGroupId(groupId);
    
    if (!groupId) {
      // If no group selected, show all team members
      const allMemberIds = teamMembers.map(member => member.id);
      console.log("Seleziono tutti i membri:", allMemberIds.length);
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
    console.log("Seleziono membri del gruppo:", groupMemberIds.length);
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

  // Memoized filtered appointments for weekly view
  const filteredAppointments = useMemo(() => {
    const weekDateStrings = weekDates.map(date => format(date, "yyyy-MM-dd"));
    return appointments.filter((appointment) => {
      // Filter by week dates
      const dateFilter = weekDateStrings.includes(appointment.data);
      // Filter by selected team members
      const teamFilter = selectedTeamMemberIds.length === 0 ? true : selectedTeamMemberIds.includes(appointment.team_id);
      // Filter by status - show/hide "Eliminato" appointments based on toggle
      const statusFilter = showDeletedAppointments ? true : appointment.status !== 'Eliminato';
      // Debug logging for eliminated appointments
      if (appointment.status === 'Eliminato') {
        console.log(`Appointment ${appointment.id} has status \"Eliminato\", showDeletedAppointments: ${showDeletedAppointments}, will show: ${statusFilter}`);
      }
      return dateFilter && teamFilter && statusFilter;
    });
  }, [appointments, weekDates, selectedTeamMemberIds, showDeletedAppointments]);

  // Debug: log quando cambiano gli appuntamenti o lo stato di visualizzazione
  useEffect(() => {
    console.log('Filtered appointments recalculated for weekly view:', {
      totalAppointments: appointments.length,
      filteredAppointments: filteredAppointments.length,
      showDeletedAppointments,
      weekDates: weekDates.map(d => format(d, "yyyy-MM-dd")),
      selectedTeamMembers: selectedTeamMemberIds.length,
      appointmentsWithEliminato: appointments.filter(app => app.status === 'Eliminato').length
    });
  }, [appointments, filteredAppointments, showDeletedAppointments, weekDates, selectedTeamMemberIds]);

  // Weekly view doesn't need pagination
  // const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  // const paginatedMembers = useMemo(() => {
  //   return filteredMembers.slice(
  //     (currentPage - 1) * membersPerPage,
  //     currentPage * membersPerPage
  //   );
  // }, [filteredMembers, currentPage, membersPerPage]);

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
    } catch (error) {
      console.error("Errore nella cancellazione dell'appuntamento:", error);
    }
  };

  const handleCardClick = (appointment: Appointment, e: React.MouseEvent<HTMLDivElement>) => {
    if (resizing || isResizing) return; // Prevent card click action if resizing
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle')) return; // Prevent opening if clicking on resize handle
    e.stopPropagation(); // Prevent event bubbling to the cell

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

  const handleSaveServices = async (
    services: { id: string; name: string; price: number }[], 
    updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string; status?: string }
  ) => {
    console.log('📥 [Weekly] Received from modal:', {
      servicesCount: services.length,
      updatedData,
      hasStatus: !!updatedData?.status
    });
    if (!selectedAppointment) return;
    
    const originalServices = selectedAppointment.services || [];
    
    // Update local state immediately for services, date, times and status
    setAppointments(prev => prev.map(app =>
      app.id === selectedAppointment.id ? { 
        ...app, 
        services,
        ...(updatedData && updatedData) // Aggiorna anche data, orari e status se forniti
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
      
      // Insert new services
      if (newServices.length > 0) {
        const newServiceInserts = newServices.map(service => ({
          order_id: selectedAppointment.id,
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
          .eq('id', service.id);
          
        if (updateError) {
          throw updateError;
        }
      }
      
      // Delete services that were removed (exist in original but not in new)
      const removedServices = originalServices.filter(
        original => !services.find(s => s.id === original.id)
      );
      
      if (removedServices.length > 0) {
        const { error: deleteError } = await supabase
          .from('order_services')
          .delete()
          .in('id', removedServices.map(s => s.id));
          
        if (deleteError) {
          throw deleteError;
        }
      }
      
      // Handle status update if provided
      if (updatedData?.status) {
        console.log('🔄 [Weekly] Updating status:', {
          appointmentId: selectedAppointment.id,
          newStatus: updatedData.status,
          originalStatus: selectedAppointment.status
        });
        
        try {
          // Get current user
          const { data: userData } = await supabase.auth.getUser();
          if (!userData?.user?.id) {
            throw new Error('User not authenticated');
          }

          const { error: statusError } = await supabase
            .from('orders')
            .update({ 
              stato: updatedData.status,
              status: updatedData.status, // Save the status in the orders table
              user_id: userData.user.id // Save the user_id with the status
            })
            .eq('id', selectedAppointment.id);

          if (statusError) {
            console.error('❌ [Weekly] Status update error:', statusError);
            throw statusError;
          }
          
          console.log('✅ [Weekly] Status updated successfully');
        } catch (error) {
          console.error('Error updating status:', error);
          throw error;
        }
      }
      
      // Fetch updated services from database to get correct IDs
      await fetchAppointments();
      
      toast({
        title: "Dati aggiornati",
        description: updatedData 
          ? updatedData.status 
            ? "I servizi, i dati e lo status dell'appuntamento sono stati salvati con successo"
            : "I servizi e i dati dell'appuntamento sono stati salvati con successo"
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

  // Add ghost line for visual feedback - positioned initially outside viewport
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
  document.body.appendChild(ghostLine);

  // Clean up ghost line, bubble, and listeners on drag end
  const handleDragEnd = () => {
    if (typeof document !== 'undefined') {
      const ghostLine = document.getElementById('drag-ghost-line');
      if (ghostLine) ghostLine.remove();
      const bubble = document.getElementById('drag-ghost-bubble');
      if (bubble) bubble.remove();
    }
    // Clear drag cache on drag end
    dragCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
    if (e.currentTarget) {
      e.currentTarget.removeEventListener('dragend', handleDragEnd);
    }
  };
  
  if (e.currentTarget) {
    e.currentTarget.addEventListener('dragend', handleDragEnd);
  }
};

const calculateOffsetMinutes = (e: React.DragEvent | MouseEvent, cellRect: DOMRect) => {
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
    dayDate: Date
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
    if (!dragPreview || dragPreview.time.getTime() !== newDropTime.getTime() || dragPreview.dayDate?.getTime() !== dayDate.getTime()) {
      setDragPreview({ time: newDropTime, dayDate });
    }

    // Salva i dati dell'ultimo dragOver
    lastDragOverData.current = { time: newDropTime, dayDate, clientX: e.clientX, clientY: e.clientY };

    // Usa requestAnimationFrame per aggiornare la linea blu solo una volta per frame
    if (dragAnimationFrame.current == null) {
      dragAnimationFrame.current = window.requestAnimationFrame(() => {
        dragAnimationFrame.current = null;
        const dragData = lastDragOverData.current;
        if (!dragData) return;
        const { clientX, clientY } = dragData;
        // Ottieni la cella target
        const { rect: cachedCellRect } = getCachedCellInfo(clientX, clientY, dragCacheRef);
        const targetRect = cachedCellRect || cellRect;

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
          document.body.appendChild(ghostLine);
        }

        // Cambia il colore della linea in base al fatto che sia fuori orario
        if (isOutsideHours) {
          ghostLine.style.background = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
          ghostLine.style.opacity = '0.8';
        } else {
          ghostLine.style.background = 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)';
          ghostLine.style.opacity = '0.9';
        }

        ghostLine.style.left = `${targetRect.left}px`;
        ghostLine.style.width = `${targetRect.width}px`;
        ghostLine.style.top = `${clientY}px`;

        // Add or update time bubble
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
          ghostLine.appendChild(bubble);
        }

        // Cambia il colore e il testo della bubble in base al fatto che sia fuori orario
        if (isOutsideHours) {
          bubble.style.background = '#ef4444';
          bubble.style.color = 'white';
          let newTimeText = `${formatTime(dragData.time, timeFormat)} - Fuori orario`;
          
          // Se l'appuntamento si estende oltre l'orario di lavoro, mostra un messaggio più specifico
          if (isEndOutsideHours && !isOutsideWorkingHours(dragData.time)) {
            newTimeText = `${formatTime(dragData.time, timeFormat)} - Si estende oltre l'orario`;
          }
          
          if (bubble.textContent !== newTimeText) {
            bubble.textContent = newTimeText;
          }
        } else {
          bubble.style.background = '#3b82f6';
          bubble.style.color = 'white';
          const newTimeText = formatTime(dragData.time, timeFormat);
          if (bubble.textContent !== newTimeText) {
            bubble.textContent = newTimeText;
          }
        }
      });
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableCellElement>) => {
    // Cancella eventuale frame in coda
    if (dragAnimationFrame.current) {
      window.cancelAnimationFrame(dragAnimationFrame.current);
      dragAnimationFrame.current = null;
    }
    // Only hide the preview if we're actually leaving the calendar area
    const relatedTarget = e.relatedTarget as Element;
    const isLeavingCalendar = relatedTarget && !relatedTarget.closest('table');
    
    if (isLeavingCalendar) {
      setDragPreview(null);
      // Hide ghost line when truly leaving the calendar
      if (typeof document !== 'undefined') {
        const ghostLine = document.getElementById('drag-ghost-line');
        if (ghostLine) {
          ghostLine.style.opacity = '0.3';
        }
        // Remove bubble if present
        const bubble = document.getElementById('drag-ghost-bubble');
        if (bubble) bubble.remove();
      }
      // Clear drag cache when leaving calendar
      dragCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLTableCellElement>,
    hourTime: Date,
    dayDate: Date
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
    
    const targetDateStr = format(dayDate, "yyyy-MM-dd");
    const updatedAppointment = {
      ...originalAppointment,
      orarioInizio: newStart,
      orarioFine: newEnd,
      data: targetDateStr,
    };
    
    // OTTIMIZZAZIONE: Aggiorna immediatamente lo stato locale per movimento veloce
    setAppointments(prev => 
      prev.map(app => 
        app.id === appointmentId ? updatedAppointment : app
      )
    );

    // Rimuovi immediatamente gli elementi visivi del drag
    setDragPreview(null);
    // Rimuovi la linea blu e la bubble subito dopo il drop
    if (typeof document !== 'undefined') {
      const ghostLine = document.getElementById('drag-ghost-line');
      if (ghostLine) ghostLine.remove();
      const bubble = document.getElementById('drag-ghost-bubble');
      if (bubble) bubble.remove();
    }
    // Cancella eventuale frame in coda
    if (dragAnimationFrame.current) {
      window.cancelAnimationFrame(dragAnimationFrame.current);
      dragAnimationFrame.current = null;
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
      }
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      // In caso di errore, ripristina lo stato precedente
      setAppointments(prev => 
        prev.map(app => 
          app.id === appointmentId ? originalAppointment : app
        )
      );
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
  setIsResizing(true); // Set resizing flag
  const startTime = parse(appointment.orarioInizio, "HH:mm", new Date());
  const endTime = parse(appointment.orarioFine, "HH:mm", new Date());
  const duration = differenceInMinutes(endTime, startTime);
  
  setResizing({
    appointment,
    startY: e.clientY,
    initialDuration: duration
  });
  
  // Aggiungi solo la classe per il resize, rimuovi la scala
  const card = e.currentTarget.closest('.shadow-md');
  if (card) {
    card.classList.add('z-[1000]', 'resizing-card');
    (card as HTMLElement).style.position = 'absolute'; // Fix the position of the resizing card
  }

  // Create ghost line for resize visual feedback
  const resizeGhostLine = document.createElement('div');
  resizeGhostLine.id = 'resize-ghost-line';
  resizeGhostLine.style.position = 'fixed';
  resizeGhostLine.style.width = '200px'; // Initial width, will be updated in handleResizeMove
  resizeGhostLine.style.height = '3px';
  resizeGhostLine.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
  resizeGhostLine.style.zIndex = '9999';
  resizeGhostLine.style.pointerEvents = 'none';
  resizeGhostLine.style.borderRadius = '2px';
  resizeGhostLine.style.opacity = '0.9';
  resizeGhostLine.style.left = '-1000px'; // Hide initially
  resizeGhostLine.style.top = '-1000px';
  resizeGhostLine.style.boxShadow = 'none';
  document.body.appendChild(resizeGhostLine);

  // Update ghost line position immediately with cached cell alignment
  const { rect: initialCellRect } = getCachedCellInfo(e.clientX, e.clientY, resizeCacheRef);
  if (initialCellRect) {
    resizeGhostLine.style.left = `${initialCellRect.left}px`;
    resizeGhostLine.style.width = `${initialCellRect.width}px`;
    resizeGhostLine.style.top = `${e.clientY}px`;
  } else {
    // Fallback if no cell found
    resizeGhostLine.style.left = `${e.clientX - 100}px`;
    resizeGhostLine.style.width = '200px';
    resizeGhostLine.style.top = `${e.clientY}px`;
  }
  
  e.preventDefault();
};

const handleResizeMove = (e: MouseEvent) => {
  if (!resizing) return;
  
  // Check if document is available (for SSR compatibility)
  if (typeof document === 'undefined') return;
  
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

  const startTime = parse(resizing.appointment.orarioInizio, "HH:mm", new Date());
  const newEndTime = addMinutes(startTime, resizing.newDuration ?? 0);
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
    
    // Clean up resize ghost line and bubble immediately
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

    setResizeGhost(null);
    setResizing(null);
    
    // Aggiungi un delay per evitare che il click venga triggerato subito dopo il resize
    setTimeout(() => {
      setIsResizing(false);
    }, 150);
    
    // Clear resize cache after operation
    resizeCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
    
    return;
  }

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

  // Clean up resize ghost line and bubble immediately
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

  setResizeGhost(null);
  setResizing(null);
  
  // Aggiungi un delay per evitare che il click venga triggerato subito dopo il resize
  setTimeout(() => {
    setIsResizing(false);
  }, 150);

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
  
  // Clear resize cache after operation
  resizeCacheRef.current = { lastCellElement: null, lastCellRect: null, lastUpdate: 0 };
};

useEffect(() => {
  if (resizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
  } else {
      setResizeGhost(null); // Reset del ghost
  }
  return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
  };
}, [resizing]);


  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.classList.add('z-50');
  };
  
  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('z-50');
  };

  const handleCellClick = (hourTime: Date, dayDate: Date, memberId: string, event?: React.MouseEvent) => {
    if (isResizing) return; // Prevent cell click while resizing
    
    // Controlla se l'utente ha i permessi per creare appuntamenti
    if (!hasPermission || !hasPermission('canCreateAppointments')) {
      return; // Non aprire il dropdown se non ha i permessi
    }
    
    // Get click position for dropdown
    const rect = event?.currentTarget.getBoundingClientRect();
    const x = event?.clientX || (rect ? rect.left + rect.width / 2 : 0);
    const y = event?.clientY || (rect ? rect.top + rect.height / 2 : 0);
    
    setCellClickDropdown({
      isOpen: true,
      hourTime,
      dayDate,
      memberId,
      x,
      y
    });
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
      team_id: cellClickDropdown.memberId,
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
      team_id: cellClickDropdown.memberId,
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
      fetchAppointments();
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
      fetchAppointments();
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
        fetchAppointments(true);
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
function getAppointmentCardStyle(appointment: Appointment): React.CSSProperties {
  // Debug: log dei colori
  console.log('Weekly - Appointment color_card:', appointment.color_card, 'for appointment:', appointment.id);
  
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
  
  console.log('Weekly - Parsed colors:', colors, 'for appointment:', appointment.id);
  
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
    console.log('Weekly - No colors found, returning white background for appointment:', appointment.id);
    return { background: '#fff', boxShadow };
  }
  if (style === 'filled') {
    if (colors.length === 2) {
      console.log('Weekly - Applying gradient background:', colors, 'for appointment:', appointment.id);
      return { background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`, boxShadow };
    } else {
      console.log('Weekly - Applying solid background:', colors[0], 'for appointment:', appointment.id);
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

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinutes;
  const startTotalMinutes = startTime.getHours() * 60 + startTime.getMinutes();

  console.log("Days to show:", daysToShow);
  console.log("Current date:", format(dailyViewDate, "yyyy-MM-dd"));
  console.log("Dates shown:", weekDates.map(d => format(d, "yyyy-MM-dd")));
  console.log("Selected team members:", selectedTeamMemberIds.length);

  // Show loading state while initializing or daysToShow is being loaded
  if (isInitializing || !isDaysToShowLoaded || daysToShow === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          {isInitializing ? "Caricamento calendario..." : "Caricamento configurazione calendario..."}
        </p>
      </div>
    );
  }

    return (
      <div className="flex flex-col h-full overflow-hidden">
      {/* Navbar Secondaria */}
      <NavbarSecondaria
        dailyViewDate={dailyViewDate}
        setDailyViewDate={setDailyViewDate}
        filteredMembers={teamMembers}
        startMemberIndex={0}
        hasMoreLeft={false}
        hasMoreRight={false}
        slidePrev={() => {}}
        slideNext={() => {}}
        showMemberDropdown={showMemberDropdown}
        setShowMemberDropdown={setShowMemberDropdown}
        groups={groups}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        handleGroupChange={handleGroupChange}
        groupFilteredMembers={groupFilteredMembers}
        selectedTeamMemberIds={selectedTeamMemberIds}
        setSelectedTeamMemberIds={setSelectedTeamMemberIds}
        handleToggleMember={handleToggleMember}
        setIsSettingCalendarOpen={setIsSettingCalendarOpen}
        hourHeight={hourHeight}
        onHourHeightChange={setHourHeight}
        teamMembers={teamMembers}
        appointments={appointments}
        selectedStatusFilters={selectedStatusFilters}
        setSelectedStatusFilters={setSelectedStatusFilters}
        showDeletedAppointments={showDeletedAppointments}
        setShowDeletedAppointments={setShowDeletedAppointments}
        daysToShow={daysToShow ?? 4}
        setDaysToShow={(value: number) => setDaysToShow(value)}
      />
      
      {/* Desktop view */}
      <div className="hidden md:block flex-1 overflow-auto" ref={calendarContainerRef}>
        <div className="relative w-full min-w-fit h-full">
          {/* Main calendar table */}
          <table className="w-full border-separate border-spacing-0 border-x border-[#EDEDED] min-w-[900px] font-apple bg-[#F7F8FA]">
            <thead className="sticky top-0 z-40 shadow-md">
              <tr className="h-12 bg-[#F8F9FA] border-b border-[#EDEDED]">
                <th
                  className="text-base font-semibold text-slate-700 w-24 bg-[#F8F9FA] border-r border-[#EDEDED] p-0 m-0 text-center pr-4 select-none"
                  style={{ top: 0, position: 'sticky', zIndex: 41, minWidth: 90 }}
                >
                  Ora
                </th>

                {weekDates.map((date, index) => {
                  // Conta gli appuntamenti per il giorno
                  const dailyAppointmentCount = appointments.filter(
                    (appointment) =>
                      appointment.data === format(date, "yyyy-MM-dd") &&
                      appointment.status !== "Eliminato" &&
                      (selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(appointment.team_id))
                  ).length;
                  
                  return (
                    <th
                      key={format(date, "yyyy-MM-dd")}
                      className="text-sm font-normal text-slate-700 bg-[#F8F9FA] border-r border-[#EDEDED] p-0 m-0 text-center select-none"
                      style={{ width: `${100 / weekDates.length}%`, minWidth: '200px' }}
                    >
                      <div className="flex items-center justify-center gap-2 py-2 relative">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-base">{format(date, "dd/MM")}</span>
                          <span className="text-xs text-slate-500 uppercase">{format(date, "EEEE", { locale: it })}</span>
                        </div>
                        {/* Notifica appuntamenti giornalieri */}
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
              {/* Current time indicator - show across all days */}
              <div 
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{
                  top: (() => {
                    const currentTotal = currentHour * 60 + currentMinutes;
                    const startParts = parse(startHour, "HH:mm", new Date());
                    const finishParts = parse(finishHour, "HH:mm", new Date());
                    const startTotal = startParts.getHours() * 60 + startParts.getMinutes();
                    const finishTotal = finishParts.getHours() * 60 + finishParts.getMinutes();
                    const cellTotal = visibleHours.length * 60;
                    const cellHeight = hourHeight * visibleHours.length;
                    if (hideOutsideHoursSetting) {
                      if (currentTotal < startTotal || currentTotal > finishTotal) {
                        return "-1000px";
                      }
                      const rel = currentTotal - startTotal;
                      return `${(rel / cellTotal) * cellHeight}px`;
                    } else {
                      return `${(currentTotal / (24 * 60)) * (hourHeight * 24)}px`;
                    }
                  })(),
                  transform: 'translateY(-50%)',
                  zIndex: 30,
                  display: weekDates.some(date => format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) ? 'block' : 'none'
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-3 w-3 rounded-full -ml-2 animate-pulse shadow-lg" style={{ backgroundColor: '#4ca7a8' }} />
                  <div className="h-[1px] w-full shadow-sm" style={{ backgroundColor: '#4ca7a8' }} />
                </div>
              </div>
              {visibleHours.map((time, visibleIndex) => {
                // Trova l'indice originale nell'array completo delle ore
                const originalIndex = hours.indexOf(time);
                const hourTime = new Date(startTime.getTime() + originalIndex * 60 * 60 * 1000);
                const isCurrentHour =
                  originalIndex === currentHour &&
                  weekDates.some(date => format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
                const isOutsideRange = hourTime < userStartTime || hourTime > userFinishTime;
                const currentHourStr = format(hourTime, "HH:mm");
              
                // Check if current hour is before start time or after finish time
                const isBeforeStart = currentHourStr < startHour;
                const isAfterFinish = currentHourStr > finishHour;
                const isOutsideWorkHours = isBeforeStart || isAfterFinish;
                
                return (
                    <tr
                    key={originalIndex}
                    ref={originalIndex === currentTime.getHours() ? currentHourRef : null}
                    style={{ height: `max(${hourHeight}px, 160px)` }}
                    className="bg-[#fafafa]" // Cambiato da bg-white a un grigio leggermente più scuro
                    >
                    {/* Colonna orari */}
                    <td
                      className="w-24 border-r border-[#EDEDED] bg-[#F8F9FA] text-center align-top relative select-none"
                      style={{
                        minWidth: 90,
                        padding: 0,
                        margin: 0,
                        minHeight: `${hourHeight}px`,
                        height: `${hourHeight}px`,
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
                        <span className="flex items-center justify-center w-full h-full text-[15px] font-semibold text-slate-700 leading-5 text-center" style={{height: '25%', minHeight: 0, padding: 0, margin: 0, boxSizing: 'border-box'}}>
                          {time}
                        </span>
                        {[15, 30, 45].map((minutes, subIndex) => {
                          const quarterTime = new Date(hourTime.getTime() + minutes * 60 * 1000);
                          return (
                            <span
                              key={subIndex}
                              className="flex items-center justify-center w-full text-[12px] text-slate-600 leading-4 text-center"
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
                          className="absolute left-0 right-0 bg-[#EDEDED]"
                          style={{ zIndex: 2, top: '-1.8px', height: '2px' }}
                        ></div>
                      </div>
                    </td>
                    {weekDates.map((date, columnIndex) => (
                      <td
                      key={format(date, "yyyy-MM-dd")}
                      className={[
                        'border-r border-[#EDEDED] relative group transition-all duration-200',
                        isCurrentHour ? 'z-[1]' : '',
                        isOutsideWorkHours ? 'bg-[#F5F6F7]' : '',
                      ].join(' ')}
                      style={{
                        padding: 0,
                        margin: 0,
                        minHeight: `${hourHeight}px`,
                        height: `${hourHeight}px`,
                        position: 'relative',
                      }}
                      onDragOver={(e) => handleDragOver(e, hourTime, date)}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, hourTime, date)}
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
                            handleCellClick(quarterTime, date, '', e);
                          }}
                        />
                        );
                      })}
                      
                      {dragPreview &&
                        dragPreview.dayDate &&
                        format(dragPreview.dayDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
                        format(dragPreview.time, "HH") === format(hourTime, "HH") && (
                        // Removed blue overlay, only ghost line and bubble are shown
                        null
                      )}
                      
                      {appointments
                        .filter(
                          (appointment) =>
                            appointment.data === format(date, "yyyy-MM-dd") &&
                            (selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(appointment.team_id)) &&
                            (
                              showDeletedAppointments || appointment.status !== "Eliminato"
                            ) &&
                            parse(appointment.orarioInizio, "HH:mm", new Date()).getHours() ===
                            hourTime.getHours() &&
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
                            className="text-xs text-gray-700 flex items-center justify-start"
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
                            {(() => {
                              const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                              const memberName = teamMember ? teamMember.name.split(' ')[0] : '';
                              return `${memberName}: ${appointment.nome} (${appointment.orarioInizio} - ${appointment.orarioFine})`;
                            })()}
                          </div>
                          );
                        } else {
                          const startTimeParsed = parse(appointment.orarioInizio, "HH:mm", new Date());
                          const endTimeParsed = parse(appointment.orarioFine, "HH:mm", new Date());
                          const duration = differenceInMinutes(endTimeParsed, startTimeParsed);
            
                          // Utilizza la nuova logica di organizzazione delle colonne per giorno
                          const dayColData = dayColumnData[format(date, "yyyy-MM-dd")];
                          const { subColumns, totalSubColumns, overlappingMap } = dayColData || { subColumns: {}, totalSubColumns: {}, overlappingMap: {} };
                          
                          const isOverlapping = overlappingMap[appointment.id] || false;
                          const subColumn = subColumns[appointment.id] || 0;
                          const totalSubColumn = totalSubColumns[appointment.id] || 1;
                          // Numero membri attivi (visibili) in questa vista
                          const activeMembers = teamMembers.filter(m => selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(m.id)).length;
                          

                          // Logica uniforme: usa color_card se presente e valido, altrimenti colore membro, altrimenti fallback
                          let cardColor = undefined;
                          let colorCardStringLocal = undefined;
                          if (appointment.color_card) {
                            if (Array.isArray(appointment.color_card)) {
                              colorCardStringLocal = appointment.color_card[0];
                            } else {
                              colorCardStringLocal = appointment.color_card;
                            }
                            // Verifica che sia un colore valido hex
                            if (typeof colorCardStringLocal === 'string' && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(colorCardStringLocal)) {
                              cardColor = colorCardStringLocal;
                            }
                          }
                          if (!cardColor) {
                            cardColor = teamMembers.find(member => member.id === appointment.team_id)?.ColorMember || '#e4b875';
                          }
                          if (appointment.status === 'pagato') {
                            cardColor = 'gray';
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

                          // SISTEMA UNIFICATO DI ADATTAMENTO TESTO AVANZATA - VERSIONE MIGLIORATA
                          interface TextSizeResult {
                            time: { fontSize: number; className: string; text: string; displayMode: 'full' | 'truncated' };
                            name: { fontSize: number; className: string; text: string; displayMode: 'full' | 'initials' | 'truncated' | 'wrapped' };
                            service: { fontSize: number; className: string; text: string; displayMode: 'full' | 'truncated' };
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
                            const totalMembers = teamMembers.filter(m => selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(m.id)).length;
                            
                            // Regole per il layout
                            if (totalSubColumn >= 4 || duration <= 15) {
                              return 'compact';
                            } else if (totalSubColumn >= 3 || duration <= 25) {
                              return 'vertical';
                            } else if (availableWidth > 200 && duration > 30) {
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
                            // Rimuovi le iniziali del membro (c'è già l'icona del membro)
                            const fullName = name;
                            const initialsOnly = getInitials(name);
                            const shortName = name.length > 20 ? name.substring(0, 17) + '...' : name;
                            const shortFullName = shortName;
                            
                            const fullNameWidth = measureText(fullName, fontSize).width;
                            const initialsWidth = measureText(initialsOnly, fontSize).width;
                            const shortFullNameWidth = measureText(shortFullName, fontSize).width;
                            
                            // Calcola il numero totale di membri attivi
                            const totalMembers = teamMembers.filter(m => selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(m.id)).length;
                            
                            // Calcola se c'è spazio per il wrapping (altezza sufficiente per 2 righe)
                            const lineHeight = fontSize * 1.2;
                            const canWrap = availableHeight >= lineHeight * 2.2; // Spazio per 2 righe + margine ridotto
                            
                            // Per card lunghe (durata > 30 min ma <= 60 min), permettere sempre il wrapping se c'è spazio - uguagliare card di 60 min alle card di 40 min
                            const isLongCard = duration > 30 && duration <= 60;
                            const shouldAllowWrap = canWrap && (isLongCard || availableHeight > lineHeight * 3);
                            
                            // Calcola se il wrapping è vantaggioso (nome lungo e spazio sufficiente)
                            const isNameLong = name.length > 12;
                            const hasEnoughWidthForWrap = availableWidth > 120; // Minimo 120px per il wrapping
                            
                            // Calcola se il wrapping migliorerebbe la leggibilità
                            const wouldBenefitFromWrap = isNameLong && hasEnoughWidthForWrap && (
                              fullNameWidth > availableWidth * 0.6 || // Nome troppo largo per una riga
                              (duration > 30 && duration <= 60 && availableHeight > lineHeight * 3) // Card lunga con molto spazio verticale - uguagliare card di 60 min alle card di 40 min
                            );
                            
                            // Regole per decidere il display mode con considerazioni aggiuntive
                            const rules = [
                              // Regola 1: Layout compact - usa nome corto
                              { condition: layout === 'compact', mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 2: Se la card è molto piccola (4+ colonne), usa nome corto
                              { condition: totalSubColumn >= 4, mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 3: Se ci sono molti membri (6+), usa nome corto
                              { condition: totalMembers >= 6, mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 4: Se la card è piccola (3 colonne) e il nome è lungo, usa nome corto
                              { condition: totalSubColumn === 3 && name.length > 15, mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 5: Se siamo su mobile e ci sono 4+ membri, usa nome corto
                              { condition: isMobile && totalMembers >= 4, mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 6: Se la colonna è molto stretta (<150px), usa nome corto
                              { condition: calendarDimensions.columnWidth < 150, mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 7: Se il nome è lungo e c'è spazio per il wrapping, usa wrapped
                              { condition: wouldBenefitFromWrap && shouldAllowWrap, mode: 'wrapped' as const, text: fullName },
                              
                              // Regola 8: Se il nome completo non ci sta nella larghezza disponibile, prova il nome corto
                              { condition: fullNameWidth > availableWidth * 0.9 && shortFullNameWidth <= availableWidth * 0.9, mode: 'truncated' as const, text: shortFullName },
                              
                              // Regola 9: Se nemmeno il nome corto ci sta, usa iniziali del cliente (non del membro)
                              { condition: fullNameWidth > availableWidth * 0.9, mode: 'initials' as const, text: getInitials(name) },
                              
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
                            const totalMembers = teamMembers.filter(m => selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(m.id)).length;
                            
                            // Regole per il servizio con considerazioni aggiuntive
                            const rules = [
                              // Regola 1: Layout compact - non mostrare servizi
                              { condition: layout === 'compact', mode: 'truncated' as const, text: '' },
                              
                              // Regola 2: Se la card è molto piccola, non mostrare il servizio
                              { condition: totalSubColumn >= 4 || duration <= 15, mode: 'truncated' as const, text: '' },
                              
                              // Regola 3: Se ci sono molti membri (6+), non mostrare il servizio
                              { condition: totalMembers >= 6, mode: 'truncated' as const, text: '' },
                              
                              // Regola 4: Se siamo su mobile e ci sono 4+ membri, non mostrare il servizio
                              { condition: isMobile && totalMembers >= 4, mode: 'truncated' as const, text: '' },
                              
                              // Regola 5: Se la colonna è molto stretta (<150px), non mostrare il servizio
                              { condition: calendarDimensions.columnWidth < 150, mode: 'truncated' as const, text: '' },
                              
                              // Regola 6: Per card da 20 minuti affiancate, non mostrare i servizi
                              { condition: duration === 20 && totalSubColumn > 1, mode: 'truncated' as const, text: '' },
                              
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
                            const actualColumnWidth = calendarDimensions.columnWidth || 200;
                            const actualCardWidth = (cardWidth / 100) * actualColumnWidth;
                            const actualCardHeight = (cardHeight / 100) * 60; // Altezza cella fissa
                            
                            // Calcola la larghezza effettiva disponibile per il testo (sottrai padding e margini)
                            const cardPadding = 24; // 12px padding su ogni lato
                            const effectiveCardWidth = actualCardWidth - cardPadding;
                            
                            // Calcola l'altezza effettiva disponibile per il testo
                            const cardPaddingVertical = duration === 10 ? 12 : 20; // Ridotto padding per appuntamenti di 10 minuti
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
                              // Per card lunghe, dare più spazio al nome - uguagliare card di 60 min alle card di 40 min
                              nameAvailableHeight = (duration > 30 && duration <= 60) ? effectiveCardHeight * 0.5 : effectiveCardHeight * 0.35;
                              serviceAvailableWidth = effectiveCardWidth * 0.8;
                              serviceAvailableHeight = effectiveCardHeight * 0.25;
                            }
                            
                            // Determina le dimensioni del font basate su schermo e numero di membri
                            const totalMembers = teamMembers.filter(m => selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(m.id)).length;
                            
                            // Calcola le dimensioni del font ottimali basate su schermo e membri
                            let baseFontSizes = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
                            
                            // Aggiusta le dimensioni del font basate sulla dimensione dello schermo
                            if (isMobile) {
                              baseFontSizes = [6, 7, 8, 9, 10, 11, 12, 13, 14];
                            } else if (isTablet) {
                              baseFontSizes = [7, 8, 9, 10, 11, 12, 13, 14, 15];
                            } else if (isLargeScreen) {
                              baseFontSizes = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
                            }
                            
                            // Aggiusta ulteriormente basato sul numero di membri
                            if (totalMembers >= 6) {
                              baseFontSizes = baseFontSizes.map(size => Math.max(size - 2, 6));
                            } else if (totalMembers >= 4) {
                              baseFontSizes = baseFontSizes.map(size => Math.max(size - 1, 7));
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
                              // Usa lo stesso timeText che verrà usato nel rendering (stesso del day view)
                              // Per card da 20 minuti, rimuovi i minuti (quelli dentro parentesi)
                              // Per card da 15 minuti sole, mostra orario di fine + minuti
                              // Per card da 40 minuti con 7 giorni attivi e 2 card affiancate, mostra solo gli orari (la durata sarà un badge separato)
                              const timeText = duration === 20 
                                ? `${appointment.orarioInizio} - ${appointment.orarioFine}`
                                : duration === 15 && totalSubColumn === 1
                                ? `${appointment.orarioFine} ${duration}m`
                                : `${appointment.orarioInizio} - ${appointment.orarioFine}`;
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
                            // Aggiungi il numero di servizi dopo gli orari (stesso del day view)
                            const servicesCount = appointment.services ? appointment.services.length : 0;
                            // Per card da 20 minuti, rimuovi i minuti (quelli dentro parentesi)
                            // Per card da 15 minuti sole, mostra orario di inizio e fine (i minuti sono in alto a destra)
                            // Per card da 40 minuti con 7 giorni attivi e 2 card affiancate, mostra solo gli orari (la durata sarà un badge separato)
                            const timeText = duration === 20 
                              ? `${appointment.orarioInizio} - ${appointment.orarioFine}`
                              : duration === 15 && totalSubColumn === 1
                              ? `${appointment.orarioInizio} - ${appointment.orarioFine}`
                              : `${appointment.orarioInizio} - ${appointment.orarioFine}`;
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
                                timeMargin: (duration === 15 || duration === 20) ? '0 0 0 0' : '4px 0 0 0',
                                nameMargin: '0 0 0 4px',
                                serviceMargin: '0'
                              };
                            } else if (layout === 'horizontal') {
                              spacing = {
                                timeMargin: (duration === 15 || duration === 20) ? '0 8px 0 0' : '4px 8px 0 0',
                                nameMargin: '0 0 4px 0',
                                serviceMargin: duration === 25 ? '1px 0 0 0' : '3px 0 0 0'
                              };
                            } else {
                              spacing = {
                                timeMargin: (duration === 15 || duration === 20) ? '0 0 4px 0' : '4px 0 4px 0',
                                nameMargin: '0 0 4px 0',
                                serviceMargin: duration === 25 ? '1px 0 0 0' : '3px 0 0 0'
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

                          // Usa solo le proprietà di posizionamento e dimensione, il background viene da getAppointmentCardStyle
                          const cardStyle = {
                            top: `${(startTimeParsed.getMinutes() / 60) * 100}%`,
                            height: `${Math.max((duration / 60) * 100, 5)}%`,
                            left: `${leftPosition}%`,
                            width: `${individualWidth}%`,
                            whiteSpace: "normal",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          };

                          // DEBUG: Log per capire il posizionamento
                          if (appointment.orarioInizio === "15:00") {
                            console.log('DEBUG 15:00 appointment:', {
                              orarioInizio: appointment.orarioInizio,
                              startTimeParsed: startTimeParsed,
                              minutes: startTimeParsed.getMinutes(),
                              calculatedTop: (startTimeParsed.getMinutes() / 60) * 100,
                              hourTime: hourTime,
                              hourTimeHour: hourTime.getHours()
                            });
                          }

                          // Helper functions from cardday.tsx
                          const getContrastColor = (hexColor: string): string => {
                          if (!hexColor.startsWith("#") || hexColor.length < 7) return "#000";
                          const r = parseInt(hexColor.slice(1, 3), 16);
                          const g = parseInt(hexColor.slice(3, 5), 16);
                          const b = parseInt(hexColor.slice(5, 7), 16);
                          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                          return brightness > 128 ? "#000000" : "#FFFFFF";
                          };

                          const getClientNameDisplay = (name: string, duration: number, totalSubColumn: number, totalMembers: number) => {
                            // Se ci sono 7 giorni, mostra solo le iniziali
                            if (daysToShow === 7) {
                              return getInitials(name);
                            }
                            // Se ci sono 4 membri attivi e 3 card affiancate (totalSubColumn === 3)
                            // e la somma delle lettere di nome+cognome > 18, mostra solo le iniziali
                            if (
                              totalMembers === 4 &&
                              totalSubColumn === 3 &&
                              name &&
                              name.replace(/\s+/g, '').length > 18
                            ) {
                              return getInitials(name);
                            }
                            // Se ci sono 4+ card e durata <= 25, mostra solo le iniziali (regola esistente)
                            if (totalSubColumn >= 4 && duration <= 25) {
                              return getInitials(name);
                            }
                            return name || '';
                          };

                          // Card style logic from cardday.tsx
                          const teamColor = appointment.status === "pagato" 
                          ? "#a0aec0" 
                          : teamMembers.find((m) => m.id === appointment.team_id)?.ColorMember || "#0078d4";
                          
                          const isCancelled = appointment.status === "cancelled";
                          const isDeleted = appointment.status === "deleted";
                          const isEliminato = appointment.status === "Eliminato"; // Add check for "Eliminato" status
                          
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
                          if (isEliminato) {
                            boxShadow = '0 0 0 2px #fecaca, 0 2px 8px rgba(220,38,38,0.08)';
                          } else if (isCancelled || isDeleted) {
                            boxShadow = 'none';
                          } else if (boxShadow == null) {
                            // fallback ombra neutra solo se non c'è alone
                            boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.02)';
                          }
                          const modernCardStyle: React.CSSProperties = {
                            ...appointmentCardStyle, // background e boxShadow da getAppointmentCardStyle
                            ...cardStyle, // posizionamento e dimensioni
                            // Se non filled, forza background bianco
                            ...(appointment.prefer_card_style && appointment.prefer_card_style !== 'filled' ? { background: '#fff' } : {}),
                            borderLeft: outlookModernStyle.borderLeft,
                            backdropFilter: (isCancelled || isDeleted || isEliminato) ? 'none' : 'blur(12px)',
                            WebkitBackdropFilter: (isCancelled || isDeleted || isEliminato) ? 'none' : 'blur(12px)',
                            opacity: isCancelled ? 0.6 : isEliminato ? 0.7 : isDeleted ? 0.4 : 1,
                            color: textColor,
                            border: (isCancelled || isDeleted || isEliminato) 
                              ? isEliminato 
                                ? '3px solid #dc2626'
                                : '1px dashed rgba(156, 163, 175, 0.7)'
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
                              backgroundColor: '#f6f7fa',
                              backgroundImage: `repeating-linear-gradient(135deg, #dbe3ea 0px, #dbe3ea 8px, #f6f7fa 8px, #f6f7fa 16px)`,
                              border: '1.0px solid #60a5fa', // azzurrino
                              color: '#7b8794',
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
                              style={modernCardStyle}
                              onClick={(e) => {
                                if (appointment.status === 'Pausa') {
                                  e.stopPropagation();
                                  return;
                                }
                                handleCardClick(appointment, e);
                              }}
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
                              {/* Existing card content */}
                              <div className={`relative flex flex-col ${duration === 20 ? 'justify-start' : (duration < 25 ? 'justify-center' : 'justify-between')} h-full overflow-hidden`}>
                                {/* Duration display - for single cards with longer appointments, 10-minute appointments, 15-minute appointments, and 40-minute appointments with 7 days and 2 cards */}
                                {(totalSubColumn === 1 && ((duration > 15 && duration <= 45) || duration === 10 || duration === 15)) || 
                                 (duration === 40 && daysToShow === 7 && totalSubColumn === 2) ? (
                                  <span
                                    className="absolute top-1.5 right-1.5 text-[9px] font-semibold text-gray-500 z-20 select-none pointer-events-none bg-white/80 rounded px-1"
                                    style={{ 
                                      letterSpacing: '-0.01em', 
                                      lineHeight: 1,
                                      backdropFilter: 'blur(4px)'
                                    }}
                                    title="Durata appuntamento in minuti"
                                  >
                                    {duration}m
                                  </span>
                                ) : null}
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
                                  <div className="flex flex-col items-start justify-center h-full w-full text-left" style={{zIndex:2, position:'relative', padding:'18px 8px 14px 8px'}}>
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
                                      fontSize:'0.85rem',
                                      fontWeight:600,
                                      color:'#374151',
                                      letterSpacing:'-0.01em',
                                      border:'1px solid #E5E7EB',
                                      boxShadow:'0 1px 2px 0 rgba(0,0,0,0.03)',
                                      zIndex:3,
                                    }}>{duration <= 10 ? (
                                      <span className="flex items-center gap-1" style={{ fontSize: '11px' }}>
                                        {appointment.orarioFine} ({duration}m)
                                        {duration > 5 && duration !== 20 && duration !== 30 && (() => {
                                          const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                          return renderTeamMemberAvatar(teamMember, 'sm');
                                        })()}
                                      </span>
                                    ) : duration === 15 && totalSubColumn === 1 ? `${appointment.orarioInizio} - ${appointment.orarioFine} (${duration}m)` : duration === 20 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 25 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 30 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 25 && totalSubColumn > 1 ? `${appointment.orarioFine} (${duration}m) ${getInitials(appointment.nome)}` : `${appointment.orarioInizio} - ${appointment.orarioFine} (${duration}m)`}</span>
                                    
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
                                  <div className="flex flex-row justify-between items-center" style={{ padding: duration === 15 ? '4px 10px' : (duration === 20 ? '0px 10px 8px 10px' : '8px 10px'), position: 'relative', zIndex: 2 }}>
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
  size={duration <= 15 ? "xs" : "sm"}
  textOnly={duration <= 15}
  sevenDaysMode={daysToShow === 7}
/>
                                      </div>
                                    )}
                                    <span
                                      className="font-medium flex items-center gap-1"
                                      style={{ 
                                        fontSize: '9px', 
                                        lineHeight: '1.3', 
                                        marginTop: duration === 20 ? '0px' : '2px',
                                        opacity: 1,
                                    fontWeight: '600',
                                    letterSpacing: '-0.01em',
                                    color: '#18181b', // nero più intenso
                                    textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none'
                                  }}
                                >
                                  {duration <= 10 ? (
                                    <span className="flex items-center gap-1">
                                      {duration > 5 && (() => {
                                        const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                        return renderTeamMemberAvatar(teamMember, 'sm');
                                      })()}
                                      {appointment.orarioFine} ({duration}m)
                                    </span>
                                  ) : duration === 15 && totalSubColumn === 1 ? `${appointment.orarioInizio} - ${appointment.orarioFine} (${duration}m)` : duration === 20 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 25 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 30 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 25 && totalSubColumn > 1 ? `${appointment.orarioFine} (${duration}m) ${getInitials(appointment.nome)}` : `${appointment.orarioInizio} - ${appointment.orarioFine} (${duration}m)`}
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
                              ) : (
                                <span
                                className="font-medium flex items-center gap-1"
                                style={{ 
                                  fontSize: '9px', 
                                  lineHeight: '1.3',
                                  opacity: 1,
                                  fontWeight: '600',
                                  letterSpacing: '-0.01em',
                                  color: '#18181b', // nero più intenso
                                  textDecoration: (isCancelled || isDeleted) ? 'line-through' : 'none'
                                }}
                                >
                                {duration <= 10 ? (
                                  <span className="flex items-center gap-1">
                                    {duration > 5 && (() => {
                                      const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                      return renderTeamMemberAvatar(teamMember, 'sm');
                                    })()}
                                    {appointment.orarioFine} ({duration}m)
                                  </span>
                                ) : duration === 15 && totalSubColumn === 1 ? `${appointment.orarioInizio} - ${appointment.orarioFine} (${duration}m)` : duration === 20 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 25 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 30 && totalSubColumn === 1 ? `${appointment.orarioFine} (${duration}m)` : duration === 25 && totalSubColumn > 1 ? `${appointment.orarioFine} (${duration}m) ${getInitials(appointment.nome)}` : `${appointment.orarioInizio} - ${appointment.orarioFine} (${duration}m)`}
                                {appointment.task && (
                                  <span 
                                    className="flex-shrink-0 bg-blue-100 text-blue-700 text-[8px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                    title="Task"
                                  >
                                    TASK
                                  </span>
                                )}
                                </span>
                              )}                                <span
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
                                <span className="truncate flex items-center gap-2">
                                  {appointment.status === 'Pausa' && isPausaInConflict 
                                    ? "CONF" 
                                    : (() => {
                                        // Find team member
                                        const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                        
                                        return (
                                          <>
                                            {/* Team member avatar spostato accanto all'orario in alto a sinistra */}
                                            {/* Client name - show only if not 7 days */}
                                            {daysToShow !== 7 && (
                                              <span>{getInitials(appointment.nome)}</span>
                                            )}

                                          </>
                                        );
                                      })()
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
                              <div className="flex flex-col h-full" style={{ padding: duration === 10 ? '6px 12px' : duration === 15 ? '6px 12px' : (duration === 20 ? '0px 12px 8px 12px' : '10px 12px') }}>
                              {/* SISTEMA UNIFICATO: Calcola le dimensioni del testo una volta sola */}
                              {(() => {
                                // SISTEMA UNIFICATO MIGLIORATO: Usa il nostro sistema avanzato getTextSize
                                const textSizes = getTextSize(duration, individualWidth, totalSubColumn);
                                
                                // Converti il risultato nel formato compatibile
                                const sizes = {
                                  timeSize: duration === 15
                                    ? '9px'
                                    : (duration === 20
                                        ? Math.max((textSizes.time.fontSize || 10) - 2, 6) + 'px'
                                        : textSizes.time.fontSize + 'px'), // Riduci leggermente l'orario per 20 minuti
                                  nameSize: textSizes.name.fontSize + 'px',
                                  timeWeight: '600',
                                  nameWeight: '600'
                                };
                                
                                return (
                                  <>
                                    {/* Layout intelligente basato sul sistema migliorato */}
                                    {(() => {
                                      if (textSizes.layout === 'compact') {
                                        // Layout compatto per appuntamenti di 5 minuti: orario e icona team a sinistra, stato in alto a destra
                                        if (duration === 5) {
                                          return (
                                            <div className="flex items-center justify-between h-full w-full" style={{ padding: '1px 1px 1px 0px' }}>
                                              {/* Data inizio/fine a sinistra giustificata */}
                                              <div className="flex items-center justify-start gap-1" style={{ marginLeft: '-2px' }}>
                                                {(() => {
                                                  const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                                  // Non mostrare icona team per appuntamenti da 5 minuti quando ci sono 7 giorni visibili e 2 card affiancate
                                                  if (duration === 5 && daysToShow === 7 && totalSubColumn === 2) {
                                                    return null;
                                                  }
                                                  return renderTeamMemberAvatar(teamMember, 'sm');
                                                })()}
                                                <span
                                                  className="font-medium text-left"
                                                  style={{ 
                                                    fontSize: '9px',
                                                    lineHeight: '1.0',
                                                    fontWeight: '600',
                                                    color: '#18181b',
                                                    textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                                    whiteSpace: 'nowrap'
                                                  }}
                                                >
                                                  {appointment.orarioInizio}-{appointment.orarioFine} ({duration}m)
                                                  {!(activeMembers === 3 && totalSubColumn >= 2) && appointment.services && appointment.services.length > 0 && (
                                                    <span 
                                                      className="ml-1 bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-[7px] font-semibold"
                                                      title={`${appointment.services.length} ${appointment.services.length === 1 ? 'servizio' : 'servizi'}`}
                                                    >
                                                      {appointment.services.length}
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                              
                                              {/* Stato a destra giustificato - nascosto quando ci sono 7 giorni attivi e card affiancate */}
                                              {salonId && appointment.id && !(daysToShow === 7 && totalSubColumn >= 2) && (
                                                <div 
                                                  className="flex items-center"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <StatoCard
                                                    salonId={salonId}
                                                    orderId={appointment.id}
                                                    compact={true}
                                                    onStatusUpdate={fetchAppointments}
                                                    buttonColor="#fff"
                                                    size="xs"
                                                    textOnly={true}
                                                    task={appointment.task}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                        // Layout compatto per appuntamenti di 10 minuti: 2 righe
                                        else if (duration === 10) {
                                          return (
                                            <div className="flex flex-col h-full justify-between" style={{ padding: '0px 4px 4px 4px', gap: '2px' }}>
                                              {/* Prima riga: durata + orario + icona membro + stato */}
                                              <div className="flex items-center justify-start w-full gap-2">
                                                <span
                                                  className="font-medium text-left flex items-center gap-1"
                                                  style={{ 
                                                    fontSize: '9px',
                                                    lineHeight: '1.1',
                                                    fontWeight: '600',
                                                    color: '#18181b',
                                                    textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                                  }}
                                                >
                                                  {duration > 5 && (() => {
                                                    const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                                    return renderTeamMemberAvatar(teamMember, 'sm');
                                                  })()}
                                                  {appointment.orarioInizio}-{appointment.orarioFine}
                                                  {appointment.task && (
                                                    <span 
                                                      className="ml-1 bg-blue-100 text-blue-700 text-[6px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                                      title="Task"
                                                    >
                                                      T
                                                    </span>
                                                  )}
                                                </span>
                                                
                                                {/* Stato sulla stessa riga, più a sinistra */}
                                                {salonId && appointment.id && (
                                                  <div onClick={(e) => e.stopPropagation()}>
                                                    <StatoCard
                                                      salonId={salonId}
                                                      orderId={appointment.id}
                                                      compact={true}
                                                      onStatusUpdate={fetchAppointments}
                                                      buttonColor="#fff"
                                                      size="xs"
                                                      textOnly={true}
                                                      task={appointment.task}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                              
                                              {/* Trash icon for pause deletion in compact layout */}
                                              {appointment.status === 'Pausa' && (
                                                <button
                                                  onClick={(e) => handlePauseDelete(appointment, e)}
                                                  className="absolute top-1 right-1 p-0.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors duration-200 border border-red-300 flex-shrink-0 z-20"
                                                  title="Elimina pausa"
                                                  style={{
                                                    backdropFilter: 'blur(4px)',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                  }}
                                                >
                                                  <FaTrash className="w-2 h-2 text-red-600" />
                                                </button>
                                              )}
                                            </div>
                                          );
                                        } else {
                                          // Layout compatto originale per altre durate
                                          return (
                                            <div className="flex items-center justify-between w-full" style={{ gap: '4px' }}>
                                              <span
                                                className="font-medium flex-shrink-0 flex items-center gap-1"
                                                style={{ 
                                                  fontSize: sizes.timeSize,
                                                  lineHeight: '1.2',
                                                  fontWeight: sizes.timeWeight,
                                                  color: '#18181b',
                                                  textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                                  margin: textSizes.spacing.timeMargin,
                                                }}
                                              >
                                                {(() => {
                                                  const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                                  return (duration > 5 && duration !== 20 && duration !== 30) ? renderTeamMemberAvatar(teamMember, 'sm') : null;
                                                })()}
                                                {textSizes.time.text}
                                                {appointment.task && (
                                                  <span 
                                                    className="flex-shrink-0 bg-blue-100 text-blue-700 text-[8px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                                    title="Task"
                                                  >
                                                    TASK
                                                  </span>
                                                )}
                                              </span>
                                              <span
                                                className="font-semibold truncate flex items-center gap-1 min-w-0 flex-1"
                                                style={{ 
                                                  fontSize: sizes.nameSize,
                                                  lineHeight: '1.2',
                                                  color: appointment.color_card && !isCancelled && !isDeleted && !isEliminato ? textColor : '#1F2937',
                                                  fontWeight: sizes.nameWeight,
                                                  textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                                  margin: textSizes.spacing.nameMargin,
                                                }}
                                              >
                                                {isEliminato && <FaTrash className="w-3 h-3 text-red-600 flex-shrink-0" />}
                                                {/* Show name only if not 7 days */}
                                                {daysToShow !== 7 && (
                                                  <span className={textSizes.name.displayMode === 'wrapped' ? 'break-words' : 'truncate'}>
                                                    {appointment.status === 'Pausa' && isPausaInConflict
                                                      ? "CONF"
                                                      : textSizes.name.text
                                                    }
                                                  </span>
                                                )}
                                                
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
                                          );
                                        }
                                      } else if (textSizes.layout === 'horizontal') {
                                        // Layout orizzontale: tempo e nome sulla stessa riga, servizi sotto
                                        return (
                                          <>
                                            <div className="flex items-start justify-between" style={{ gap: '8px', marginBottom: '4px' }}>
                                              <span
                                                className="font-medium flex-shrink-0 flex items-center gap-1"
                                                style={{ 
                                                  fontSize: sizes.timeSize,
                                                  lineHeight: '1.2',
                                                  fontWeight: sizes.timeWeight,
                                                  color: '#18181b',
                                                  textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                                  margin: textSizes.spacing.timeMargin,
                                                }}
                                              >
                                                {(() => {
                                                  const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                                  return (duration > 5 && duration !== 20 && duration !== 30) ? renderTeamMemberAvatar(teamMember, 'sm') : null;
                                                })()}
                                                {textSizes.time.text}
                                                {appointment.task && (
                                                  <span 
                                                    className="flex-shrink-0 bg-blue-100 text-blue-700 text-[8px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                                    title="Task"
                                                  >
                                                    TASK
                                                  </span>
                                                )}
                                              </span>
                                              <span
                                                className="font-semibold truncate flex items-center gap-1 min-w-0 flex-1"
                                                style={{ 
                                                  fontSize: sizes.nameSize,
                                                  lineHeight: '1.2',
                                                  color: appointment.color_card && !isCancelled && !isDeleted && !isEliminato ? textColor : '#1F2937',
                                                  fontWeight: sizes.nameWeight,
                                                  textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                                  margin: textSizes.spacing.nameMargin,
                                                }}
                                              >
                                                {isEliminato && <FaTrash className="w-3 h-3 text-red-600 flex-shrink-0" />}
                                                {/* Show name only if not 7 days */}
                                                {daysToShow !== 7 && (
                                                  <span className={textSizes.name.displayMode === 'wrapped' ? 'break-words' : 'truncate'}>
                                                    {appointment.status === 'Pausa' && isPausaInConflict
                                                      ? "CONF"
                                                      : textSizes.name.text
                                                    }
                                                  </span>
                                                )}
                                                 
                                                 {/* Trash icon for pause deletion in horizontal layout */}
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
                                           </>
                                         );
                                      } else {
                                        // Layout verticale: tutto in colonna
                                        return (
                                          <div className="flex flex-col">
                                             <span
                                              className="font-medium flex items-center gap-1"
                                              style={{ 
                                                fontSize: sizes.timeSize,
                                                lineHeight: '1.2',
                                                fontWeight: sizes.timeWeight,
                                                color: '#18181b',
                                                textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                                margin: textSizes.spacing.timeMargin,
                                              }}
                                            >
                                               {(() => {
                                                 const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                                 return (duration > 5 && duration !== 20 && duration !== 30) ? renderTeamMemberAvatar(teamMember, 'sm') : null;
                                               })()}
                                               {textSizes.time.text}
                                              {appointment.task && (
                                                <span 
                                                  className="flex-shrink-0 bg-blue-100 text-blue-700 text-[8px] px-1 py-0.5 rounded-full font-semibold border border-blue-200"
                                                  title="Task"
                                                >
                                                  TASK
                                                </span>
                                              )}
                                            </span>
                                            <span
                                              className="font-semibold truncate flex items-center gap-1"
                                              style={{ 
                                                fontSize: sizes.nameSize,
                                                lineHeight: '1.2',
                                                color: appointment.color_card && !isCancelled && !isDeleted && !isEliminato ? textColor : '#1F2937',
                                                fontWeight: sizes.nameWeight,
                                                textDecoration: (isCancelled || isDeleted || isEliminato) ? 'line-through' : 'none',
                                                margin: textSizes.spacing.nameMargin,
                                              }}
                                            >
                                               {isEliminato && <FaTrash className="w-3 h-3 text-red-600 flex-shrink-0" />}
                                              {/* Show name only if not 7 days */}
                                              {daysToShow !== 7 && (
                                                <span className={textSizes.name.displayMode === 'wrapped' ? 'break-words' : 'truncate'}>
                                                  {appointment.status === 'Pausa' && isPausaInConflict
                                                    ? "CONFLITTO"
                                                    : textSizes.name.text
                                                  }
                                                </span>
                                              )}
                                              
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
                                          </div>
                                        );
                                      }
                                    })()}

                                    {/* Duration in top-right for 55-minute appointments */}
                                    {duration === 55 && (
                                      <span
                                        className="absolute top-2 right-2 bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-[10px] font-semibold z-20 select-none pointer-events-none"
                                        style={{ letterSpacing: '-0.01em', lineHeight: 1 }}
                                        title="Durata appuntamento in minuti"
                                      >
                                        {duration} min
                                      </span>
                                    )}

                                    {/* Show services count and price only for single cards (no overlaps) and duration >= 25 */}
                                    {duration >= 25 && totalSubColumn === 1 && Array.isArray(appointment.services) && (appointment.services?.length ?? 0) > 0 && textSizes.layout !== 'compact' && (
                                      <div className="mt-1">
                                        <div className="flex items-center justify-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/25 rounded-lg border border-blue-100 dark:border-blue-800/40 shadow-sm w-fit">
                                          <svg className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                          </svg>
                                           <span className="text-blue-700 dark:text-blue-300 font-semibold" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
                                             {(appointment.services?.length ?? 0)} {((appointment.services?.length ?? 0) === 1 ? 'servizio' : 'servizi')}
                                           </span>
                                           {(appointment.services?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0) > 0 && (
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

                                    {/* Do not show services for 20-minute appointments */}
                                    {false && duration === 20 && Array.isArray(appointment.services) && ((appointment.services?.length ?? 0) > 0) && (
                                      <div className="mt-1">
                                        <div className="flex items-center justify-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/25 rounded-lg border border-blue-100 dark:border-blue-800/40 shadow-sm w-fit">
                                          <svg className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                          </svg>
                                           <span className="text-blue-700 dark:text-blue-300 font-semibold" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
                                             {(appointment.services?.length ?? 0)} {((appointment.services?.length ?? 0) === 1 ? 'servizio' : 'servizi')}
                                           </span>
                                           {(appointment.services?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0) > 0 && (
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

                                    {/* Show services count only for 15-minute appointments */}
                                    {duration === 15 && appointment.services && appointment.services.length > 0 && (
                                      <div className="mt-1">
                                        <div className="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/25 rounded-md border border-blue-100 dark:border-blue-800/40 shadow-sm w-fit">
                                          <svg className="w-2.5 h-2.5 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                          </svg>
                                          <span className="text-blue-700 dark:text-blue-300 font-semibold" style={{ fontSize: '7px', letterSpacing: '-0.01em' }}>
                                            {appointment.services.length} {appointment.services.length === 1 ? 'servizio' : 'servizi'}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Show individual services fallback for smaller cards */}
                                    {(duration < 25 || textSizes.layout === 'compact') && duration !== 10 && duration !== 5 && duration !== 15 && duration !== 20 && appointment.services && appointment.services.length > 0 && (
                                      (() => {
                                        // Calcoli semplificati
                                        const cardHeight = Math.max((duration / 60) * 100, 5);
                                        const actualColumnWidth = calendarDimensions.columnWidth || 200;
                                        const actualCardWidth = (individualWidth / 100) * actualColumnWidth;
                                        const actualCardHeight = (cardHeight / 100) * 60;
                                        
                                        // Spazio disponibile (più permissivo)
                                        const effectiveCardWidth = actualCardWidth - 20; // Ridotto padding
                                        const effectiveCardHeight = actualCardHeight - 15; // Ridotto padding
                                        
                                        // Condizioni molto più permissive
                                        const hasEnoughSpace = textSizes.layout !== 'compact' && effectiveCardHeight > 15;
                                        
                                        // Per servizi singoli, calcolo intelligente con wrapping se necessario
                                        if (appointment.services.length === 1) {
                                          // Per card da 20 minuti, mostra numero servizi e prezzo come per le card da 55 min
                                          if (duration === 20) {
                                            return (
                                              <div>
                                               <div className="flex items-center justify-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/25 rounded-lg border border-blue-100 dark:border-blue-800/40 shadow-sm w-fit">
                                                  <svg className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                  </svg>
                                                  <span className="text-blue-700 dark:text-blue-300 font-semibold" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
                                                    {appointment.services.length} {appointment.services.length === 1 ? 'servizio' : 'servizi'}
                                                  </span>
                                                  {appointment.services.reduce((sum, s) => sum + (s.price || 0), 0) > 0 && (
                                                    <>
                                                      <span className="text-gray-400 dark:text-gray-500">•</span>
                                                      <div className="flex items-center gap-1">
                                                        <svg className="w-2.5 h-2.5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-green-600 dark:text-green-400 font-bold" style={{ fontSize: '10px' }}>
                                                          €{appointment.services.reduce((sum, s) => sum + (s.price || 0), 0)}
                                                        </span>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          const service = appointment.services[0];
                                          const serviceText = (service as any).servizio || service.name;
                                          const serviceWidth = measureText(serviceText, textSizes.service.fontSize).width;
                                          
                                          // Calcola se il servizio ci sta completamente
                                          const canFitCompletely = serviceWidth <= effectiveCardWidth * 0.9;
                                          const hasEnoughHeightForWrapping = effectiveCardHeight > 25; // Spazio per wrapping
                                          
                                          // Mostra sempre il servizio se c'è spazio, anche con wrapping
                                          if (hasEnoughSpace && (canFitCompletely || hasEnoughHeightForWrapping)) {
                                            return (
                                              <div 
                                                className="flex items-start gap-1" 
                                                style={{ 
                                                  margin: textSizes.spacing.serviceMargin,
                                                  marginBottom: textSizes.layout === 'horizontal' ? '8px' : '4px'
                                                }}
                                              >
                                                <span
                                                  className="px-1.5 py-0.5 rounded bg-[#F6F7F9] border border-[#E5E7EB] text-gray-800 font-medium shadow-sm"
                                                  style={{
                                                    fontSize: textSizes.service.fontSize + 'px',
                                                    lineHeight: '1.1',
                                                    letterSpacing: '-0.01em',
                                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                    maxWidth: canFitCompletely ? 'none' : '100%',
                                                    wordBreak: 'break-word'
                                                  }}
                                                >
                                                  <span style={{fontSize:'0.7em',color:'#a3a3a3',marginRight:'2px',display:'inline-block'}}>&#8226;</span>
                                                  {serviceText}
                                                </span>
                                              </div>
                                            );
                                          }
                                        }
                                        
                                        // Per servizi multipli, mostra sempre tutti i servizi con wrapping intelligente
                                        if (appointment.services.length > 1 && hasEnoughSpace) {
                                          // Per card da 20 minuti, mostra numero servizi e prezzo come per le card da 55 min
                                          if (duration === 20) {
                                            return (
                                              <div>
                                               <div className="flex items-center justify-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/25 rounded-lg border border-blue-100 dark:border-blue-800/40 shadow-sm w-fit">
                                                  <svg className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                  </svg>
                                                  <span className="text-blue-700 dark:text-blue-300 font-semibold" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
                                                    {appointment.services.length} {appointment.services.length === 1 ? 'servizio' : 'servizi'}
                                                  </span>
                                                  {appointment.services.reduce((sum, s) => sum + (s.price || 0), 0) > 0 && (
                                                    <>
                                                      <span className="text-gray-400 dark:text-gray-500">•</span>
                                                      <div className="flex items-center gap-1">
                                                        <svg className="w-2.5 h-2.5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-green-600 dark:text-green-400 font-bold" style={{ fontSize: '10px' }}>
                                                          €{appointment.services.reduce((sum, s) => sum + (s.price || 0), 0)}
                                                        </span>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          // Show service count instead of individual services when 3 cards are side by side
                                          if (totalSubColumn === 3) {
                                            return (
                                              <div 
                                                className="flex flex-wrap gap-1" 
                                                style={{ 
                                                  margin: textSizes.spacing.serviceMargin,
                                                  marginBottom: textSizes.layout === 'horizontal' ? '8px' : '4px',
                                                  maxWidth: '100%'
                                                }}
                                              >
                                                <span
                                                  className="px-1.5 py-0.5 rounded bg-[#F6F7F9] border border-[#E5E7EB] text-gray-800 font-medium shadow-sm"
                                                  style={{
                                                    fontSize: textSizes.service.fontSize + 'px',
                                                    lineHeight: '1.1',
                                                    letterSpacing: '-0.01em',
                                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                    maxWidth: '100%',
                                                    wordBreak: 'break-word'
                                                  }}
                                                >
                                                  <span style={{fontSize:'0.7em',color:'#a3a3a3',marginRight:'2px',display:'inline-block'}}>&#8226;</span>
                                                  {appointment.services.length} {appointment.services.length === 1 ? 'servizio' : 'servizi'}
                                                </span>
                                              </div>
                                            );
                                          }
                                          
                                          // Calcola se i primi 2 servizi ci stanno sulla stessa riga (per ottimizzazione)
                                          const firstTwoServices = appointment.services.slice(0, 2);
                                          let totalWidth = 0;
                                          const serviceWidths = firstTwoServices.map(service => {
                                            const serviceText = (service as any).servizio || service.name;
                                            const width = measureText(serviceText, textSizes.service.fontSize).width + 20; // +20 per padding
                                            totalWidth += width + 4; // +4 per gap
                                            return { service, text: serviceText, width };
                                          });
                                          
                                          const canFitOnSameLine = totalWidth <= effectiveCardWidth;
                                          const hasEnoughHeightForWrapping = effectiveCardHeight > 35; // Spazio per 2 righe
                                          
                                          return (
                                            <div 
                                              className="flex flex-wrap gap-1" 
                                              style={{ 
                                                margin: textSizes.spacing.serviceMargin,
                                                marginBottom: textSizes.layout === 'horizontal' ? '8px' : '4px',
                                                maxWidth: '100%'
                                              }}
                                            >
                                              {appointment.services.map((service, index) => {
                                                const serviceText = (service as any).servizio || service.name;
                                                const serviceWidth = measureText(serviceText, textSizes.service.fontSize).width;
                                                
                                                // Se non ci stanno sulla stessa riga e c'è altezza per wrapping, mostra nome completo
                                                const shouldShowFullName = !canFitOnSameLine && hasEnoughHeightForWrapping;
                                                
                                                // Altrimenti, tronca se necessario
                                                const displayText = shouldShowFullName || serviceWidth <= effectiveCardWidth * 0.9 
                                                  ? serviceText 
                                                  : serviceText.substring(0, Math.floor(effectiveCardWidth * 0.8 / textSizes.service.fontSize * 2)) + '...';
                                                
                                                return (
                                                  <span
                                                    key={index}
                                                    className="px-1.5 py-0.5 rounded bg-[#F6F7F9] border border-[#E5E7EB] text-gray-800 font-medium shadow-sm"
                                                    style={{
                                                      fontSize: textSizes.service.fontSize + 'px',
                                                      lineHeight: '1.1',
                                                      letterSpacing: '-0.01em',
                                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                      maxWidth: canFitOnSameLine ? 'none' : '100%',
                                                      wordBreak: 'break-word'
                                                    }}
                                                  >
                                                    <span style={{fontSize:'0.7em',color:'#a3a3a3',marginRight:'2px',display:'inline-block'}}>&#8226;</span>
                                                    {displayText}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          );
                                        }
                                        
                                        // Fallback: mostra sempre i nomi dei servizi, anche se troncati
                                        return (
                                          <div 
                                            className="flex flex-wrap gap-1" 
                                            style={{ 
                                              margin: textSizes.spacing.serviceMargin,
                                              marginBottom: textSizes.layout === 'horizontal' ? '8px' : '4px',
                                              maxWidth: '100%'
                                            }}
                                          >
                                            {appointment.services.map((service, index) => {
                                              const serviceText = (service as any).servizio || service.name;
                                              const serviceWidth = measureText(serviceText, textSizes.service.fontSize).width;
                                              
                                              // Tronca se necessario, ma mostra sempre qualcosa
                                              const displayText = serviceWidth <= effectiveCardWidth * 0.8 
                                                ? serviceText 
                                                : serviceText.substring(0, Math.floor(effectiveCardWidth * 0.7 / textSizes.service.fontSize * 2)) + '...';
                                              
                                              return (
                                                <span
                                                  key={index}
                                                  className="px-1.5 py-0.5 rounded bg-[#F6F7F9] border border-[#E5E7EB] text-gray-800 font-medium shadow-sm"
                                                  style={{
                                                    fontSize: textSizes.service.fontSize + 'px',
                                                    lineHeight: '1.1',
                                                    letterSpacing: '-0.01em',
                                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                    maxWidth: '100%',
                                                    wordBreak: 'break-word'
                                                  }}
                                                >
                                                  <span style={{fontSize:'0.7em',color:'#a3a3a3',marginRight:'2px',display:'inline-block'}}>&#8226;</span>
                                                  {displayText}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        );
                                      })()
                                    )}
                                  </>
                                );
                              })()}






                              {/* Status component - position based on card height (same as day.tsx) */}
                              {appointment.status && salonId && duration !== 10 && (
                                (() => {
                                  // Calcola i membri attivi per la vista settimanale
                                  const activeMembersCount = teamMembers.filter(m => selectedTeamMemberIds.length === 0 || selectedTeamMemberIds.includes(m.id)).length;
                                  
                                  // Riduci dimensione bottone stato se 3 card affiancate, 4 membri attivi, durata <= 25 min
                                  const isSmallStato = (activeMembersCount === 4 && duration <= 25 && (totalSubColumn === 3 || totalSubColumn === 2));
                                  // Se appuntamento solo e durata <= 15, mostra la durata subito prima del bottone stato (rimosso, ora mostrato nell'orario)
                                  const showInlineDuration = false;
                                  // Applica stato-xs per card di 15 minuti o meno o 20/25 minuti quando sole
                                  const isVerySmallStato = duration <= 15 || ((duration === 20 || duration === 25) && totalSubColumn === 1);
                                  // Per card da 25/30 minuti affiancate, mostra i servizi nella stessa riga dello status
                                  const is25MinSideBy = (duration === 25 || duration === 30) && totalSubColumn > 1;
                                  
                                  return (
                                    <>
                                      {/* Non mostrare servizi nelle affiancate quando 3 membri attivi */}
                                      {is25MinSideBy && !(activeMembersCount === 3 && totalSubColumn >= 2) && appointment.services && appointment.services.length > 0 && !(totalSubColumn >= 4 && activeMembersCount > 1) && (
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
                                            {appointment.services.reduce((sum, s) => sum + (s.price || 0), 0) > 0 && !(totalSubColumn === 3 && duration >= 25 && duration <= 45 && activeMembersCount === 2) && !(totalSubColumn >= 4 && activeMembersCount > 1) && (
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
                                      
                                      {/* StatoCard generale - escluso per appuntamenti di 5 minuti che hanno il loro StatoCard dedicato */}
                                      {duration !== 5 && (
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
                                            textOnly={duration <= 15 || ((duration === 20 || duration === 25) && totalSubColumn === 1) || (activeMembersCount === 4 && totalSubColumn === 4 && duration <= 30)}
                                            task={appointment.task}
                                          />
                                        </div>
                                      )}
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
      <div className="block md:hidden">
        {/* Date picker and controls for mobile */}
        <div className="fixed top-16 left-0 right-0 bg-white z-20 p-4 border-b flex items-center justify-between">
          <button 
            onClick={() => setDailyViewDate(new Date())}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
          >
            Oggi
          </button>
          
          <div className="flex items-center space-x-2">
            <button onClick={() => setDailyViewDate(subDays(dailyViewDate, 1))} className="p-2 rounded-full hover:bg-gray-100">
              <FaChevronLeft className="h-4 w-4" />
            </button>
            
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm"
            >
              <span>{format(dailyViewDate, "dd/MM/yyyy")}</span>
              <CalendarIcon className="h-4 w-4" />
            </button>
            
            <button onClick={() => setDailyViewDate(addDays(dailyViewDate, 1))} className="p-2 rounded-full hover:bg-gray-100">
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {showDatePicker && (
          <div className="absolute z-30 mt-2 bg-white shadow-lg rounded-lg p-4">
            {/* You can implement a date picker UI here */}
            <div className="flex justify-end">
              <button 
                onClick={() => setShowDatePicker(false)}
                className="text-sm text-gray-600"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile schedule view */}
        <div className="divide-y" style={{ paddingTop: '120px' }}>
          {filteredMembers
            .filter(member => !activeTab || member.id === activeTab)
            .map(member => (
              <div key={member.id} className="py-2">
                {/* Member header with expand/collapse */}
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => toggleMemberExpansion(member.id)}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: member.ColorMember || '#e4b875' }}
                    ></div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      expandedMembers.includes(member.id) ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>
                
                {/* Expanded schedule view */}
                {expandedMembers.includes(member.id) && (
                  <div className="mt-2 max-h-96 overflow-y-auto">
                    {hours.map((time, index) => {
                      const hourTime = new Date(startTime.getTime() + index * 60 * 60 * 1000);
                      const currentHourStr = format(hourTime, "HH:mm");
                      
                      const formattedSelectedDate = format(dailyViewDate, "yyyy-MM-dd");

                      const hourAppointments = appointments.filter(appointment => {
                        const teamMatch = appointment.team_id === member.id;
                        const dateMatch = appointment.data === formattedSelectedDate;
                        const timeMatch = appointment.orarioInizio <= currentHourStr && appointment.orarioFine > currentHourStr;
                        // Applica il filtro per gli appuntamenti eliminati basato sullo stato showDeletedAppointments
                        const statusFilter = showDeletedAppointments ? true : appointment.status !== 'Eliminato';
                        return teamMatch && dateMatch && timeMatch && statusFilter;
                      });
                      
                      return (
                        <div 
                          key={index}
                          className={`flex py-2 px-3 ${
                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                        >
                          <div className="w-16 text-sm text-gray-500">
                            {format(hourTime, "HH:mm")}
                          </div>
                          <div className="flex-1">
                            {hourAppointments.length > 0 ? (
                              <div className="space-y-2">
                                {hourAppointments.map(appointment => {
                                  // Calculate duration and other variables outside of JSX
                                  const startTime = parse(appointment.orarioInizio, "HH:mm", new Date());
                                  const endTime = parse(appointment.orarioFine, "HH:mm", new Date());
                                  const duration = differenceInMinutes(endTime, startTime);
                                  // Calcola totalSubColumn per questo appuntamento usando dayColumnData
                                  const dateStr = format(dailyViewDate, "yyyy-MM-dd");
                                  const columnData = dayColumnData[dateStr];
                                  const totalSubColumn = columnData?.totalSubColumns?.[appointment.id] || 1;

                                  return (
                                    <div
                                      key={appointment.id}
                                      className="p-2 rounded-lg text-sm"
                                      style={{
                                        backgroundColor: appointment.status === 'pagato' 
                                          ? 'gray' 
                                          : (member.ColorMember || '#e4b875'),
                                        opacity: 0.8
                                      }}
                                      onClick={() => handleAppointmentClick(appointment)}
                                    >
                                      <div className="font-medium text-white">
                                        {appointment.nome}
                                      </div>
                                      <div className="text-xs text-white/80">
                                        {duration <= 10 ? (
                                          <span className="flex items-center gap-1">
                                            {duration > 5 && duration !== 20 && duration !== 30 && (() => {
                                              const teamMember = teamMembers.find(m => m.id === appointment.team_id);
                                              return renderTeamMemberAvatar(teamMember, 'sm');
                                            })()}
                                            {appointment.orarioFine}
                                          </span>
                                        ) : duration === 15 && totalSubColumn === 1 ? `${appointment.orarioInizio} - ${appointment.orarioFine}` : duration === 20 && totalSubColumn === 1 ? appointment.orarioFine : duration === 25 && totalSubColumn === 1 ? appointment.orarioFine : duration === 30 && totalSubColumn === 1 ? appointment.orarioFine : `${appointment.orarioInizio} - ${appointment.orarioFine}`}
                                      </div>
                                      {appointment.services && appointment.services.length > 0 && duration !== 10 && (
                                        <div className={`text-xs text-white/80 ${duration === 15 ? 'mt-0' : 'mt-1'}`}>
                                          {duration === 15 ? (
                                            // Per appuntamenti da 15 minuti, mostra solo il numero di servizi con carattere ridotto
                                            <span style={{ fontSize: '10px' }}>
                                              {appointment.services.length} {appointment.services.length === 1 ? 'servizio' : 'servizi'}
                                            </span>
                                          ) : (
                                            // Per altri appuntamenti, mostra i nomi dei servizi
                                            appointment.services.map(s => s.name).join(', ')
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div 
                                className="h-8 w-full border border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
                                onClick={(e) => handleCellClick(hourTime, dailyViewDate, member.id, e)}
                              >
                                <span className="text-xs text-gray-400">+ Agg. appuntamento</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

  // Pagination is not used in weekly view, so these functions are not needed.
  // If you want to keep them for future use, define totalPages accordingly.
  // For now, you can safely remove or comment out these functions.

  // const goToPreviousPage = () => {
  //   if (currentPage > 1) {
  //     setCurrentPage(prev => prev - 1);
  //   }
  // };
  
  // const goToNextPage = () => {
  //   if (currentPage < totalPages) {
  //     setCurrentPage(prev => prev + 1);
  //   }
  // };

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
    // Non aprire il modal se l'appuntamento è un task
    if (appointment.task) {
      console.log('Task appointments cannot be edited via modal');
      return;
    }

    // Set the selected appointment
    setSelectedAppointment(appointment);
    
    // Open the EditServicesModal
    setIsEditServicesOpen(true);
  };

  // Salva la selezione dei membri nel localStorage quando cambia
  useEffect(() => {
    // Salva solo se c'è almeno un membro selezionato
    if (selectedTeamMemberIds.length > 0) {
      localStorage.setItem('selectedTeamMemberIds', JSON.stringify(selectedTeamMemberIds));
    }
  }, [selectedTeamMemberIds]);

  // Recupera la selezione dei membri dal localStorage al caricamento
  useEffect(() => {
    const savedSelection = localStorage.getItem('selectedTeamMemberIds');
    if (savedSelection) {
      try {
        const parsedSelection = JSON.parse(savedSelection);
        if (Array.isArray(parsedSelection) && parsedSelection.length > 0) {
          setSelectedTeamMemberIds(parsedSelection);
        }
      } catch (error) {
        console.error("Errore nel parsing della selezione salvata:", error);
      }
    }
  }, []);

  // Monitoraggio dei cambiamenti nella selezione dei membri
  useEffect(() => {
    console.log("selectedTeamMemberIds è cambiato:", selectedTeamMemberIds);
    
    // Se abbiamo selezionato dei membri e filteredMembers è vuoto, forza il calcolo
    if (selectedTeamMemberIds.length > 0 && filteredMembers.length === 0) {
      const filtered = teamMembers.filter((member) =>
        selectedTeamMemberIds.includes(member.id)
      );
      console.log("Ricalcolo forzato dei membri filtrati:", filtered.length);
    }
  }, [selectedTeamMemberIds]);

  // Helper function to get status color
  const getStatusColor = (status: string | null): string => {
    if (!status) return 'gray'; // Default color for null/undefined status
    const statusItem = APPOINTMENT_STATUSES.find(s => s.value === status);
    return statusItem ? statusItem.color : 'gray'; // Return the color or gray as fallback
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-gray-900" style={{ margin: 0, padding: 0 }}>



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
      {/* Main content area with calendar and sidebar */}
      <div className="flex-1 flex h-full">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto min-w-fit" style={{ margin: 0, padding: 0 }}>
          <div className="min-w-fit h-full" style={{ background: 'none', margin: 0, padding: 0 }}>
            {renderCalendarGrid()}
          </div>
        </div>

        {/* Team Members Sidebar */}
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
      </div>

      {/* Modal per nuovo appuntamento */}
      <CreateOrder
        isDialogOpen={isCreateOrderOpen}
        setIsDialogOpen={setIsCreateOrderOpen}
        initialFormData={initialFormData}
      />
      {/* Modal per nuova pausa */}
      {isCreatePausaOpen && (
        <CreatePausaForm
          open={isCreatePausaOpen}
          onOpenChange={setIsCreatePausaOpen}
          initialFormData={initialFormData}
          onPausaCreated={() => setIsCreatePausaOpen(false)}
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
    </div>
  );
}

export default React.memo(WeeklyCalendar);
