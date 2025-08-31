'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, parse, addDays, subDays, differenceInMinutes, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MoreVertical, Clock, User, Scissors, Filter, Eye, Trash, Settings, Check, Minus, Calendar, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
} from "@/components/ui/dropdown-menu";
import { APPOINTMENT_STATUSES } from "@/components/status";
import { EditServicesModal } from "../../_CreateOrder/modaleditcard";
import PausaMobile from "../../_CreateOrder/PausaMobile";
import { CreateOrderMobile } from "../../_CreateOrder/CreateOrderMobile";
import EditOrderFormMobile from "../../_CreateOrder/EditOrderFormMobile";
import { dispatchAppointmentEvent, APPOINTMENT_EVENTS } from '../../utils/appointmentEvents';
import { MobileNavbar } from "../../navbarMobile";

// Mobile optimization libraries
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import { useGesture } from '@use-gesture/react';
import { useMediaQuery } from 'react-responsive';
import { isMobile as isMobileDevice, isTablet as isTabletDevice, isBrowser } from 'react-device-detect';

interface Appointment {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  team_id: string;
  servizio: string;
  accesso: string; // Tipo di accesso (es. "Invitation")
  status: string;
  progresso: number;
  membri?: string[];
  services?: Array<{ id: string; name: string; price: number; }>;
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

interface MobileDayViewProps {
  appointments: Appointment[];
  teamMembers: Member[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onCreateAppointment?: () => void;
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

export function MobileDayView({
  appointments,
  teamMembers,
  selectedDate,
  onDateChange,
  onCreateAppointment,
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
}: MobileDayViewProps) {
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<(string | null)[]>([]);
  const [showDeletedAppointments, setShowDeletedAppointments] = useState(false);
  const [customStatuses, setCustomStatuses] = useState<{ value: string, label: string, color: string }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([selectedDate]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  
  // Edit modal states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isEditServicesOpen, setIsEditServicesOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);

  // Debug logs for modal state - REMOVED for performance

  // Create Order modal states
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isCreatePausaOpen, setIsCreatePausaOpen] = useState(false);

  // Debounced date change handler to prevent rapid calls
  const debouncedDateChange = useCallback((newDate: Date) => {
    if (isChangingDate) return; // Prevent multiple rapid calls
    
    setIsChangingDate(true);
    onDateChange(newDate);
    
    // Update calendar month to match the new date
    setCalendarMonth(newDate);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsChangingDate(false);
    }, 300);
  }, [onDateChange, isChangingDate]);

  // Handle date selection in calendar
  const handleDateSelection = useCallback((date: Date) => {
    if (!isMultiSelectMode) {
      // Single date selection mode
      setSelectedDates([date]);
      debouncedDateChange(date);
      setShowCalendar(false);
    } else {
      // Multi-select mode
      setSelectedDates(prev => {
        const dateStr = date.toISOString().split('T')[0];
        const isSelected = prev.some(d => d.toISOString().split('T')[0] === dateStr);
        
        if (isSelected) {
          // Remove date if already selected
          return prev.filter(d => d.toISOString().split('T')[0] !== dateStr);
        } else {
          // Add date if not selected
          return [...prev, date];
        }
      });
    }
  }, [isMultiSelectMode, debouncedDateChange]);

  // Apply selected dates to main view
  const applySelectedDates = useCallback(() => {
    if (selectedDates.length === 1) {
      debouncedDateChange(selectedDates[0]);
    } else if (selectedDates.length > 1) {
      // For multiple dates, use the first one as primary and store others for filtering
      debouncedDateChange(selectedDates[0]);
    }
    setShowCalendar(false);
  }, [selectedDates, debouncedDateChange]);

  // Enhanced swipe handlers with react-swipeable
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => debouncedDateChange(addDays(selectedDate, 1)),
    onSwipedRight: () => debouncedDateChange(subDays(selectedDate, 1)),
    trackMouse: false,
    delta: 50,
    swipeDuration: 500,
    preventScrollOnSwipe: true,
  });

  // Pull to refresh gesture
  const [refreshY, setRefreshY] = useState(0);
  const refreshBind = useGesture({
    onDrag: ({ movement: [, y], direction: [, dy], cancel }) => {
      if (y > 0 && dy > 0) {
        setRefreshY(y);
        if (y > 100) {
          // Trigger refresh
          handleRefresh();
          cancel();
        }
      }
    },
    onDragEnd: () => {
      setRefreshY(0);
    }
  });

  const handleRefresh = useCallback(async () => {
    if (isChangingDate) return; // Don't refresh if date is changing
    
    setIsRefreshing(true);
    // Simulate refresh - you can add actual refresh logic here
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [isChangingDate]);

  // Check if data is loaded and update loading states
  useEffect(() => {
    // Update loading states based on actual data availability
    if (teamMembers.length > 0) {
      setIsLoadingMembers(false);
    }
    
    // Appointments are considered loaded when the array is available (even if empty)
    setIsLoadingAppointments(false);
  }, [teamMembers, appointments]);

  // Update selectedDates when selectedDate prop changes - OPTIMIZED
  useEffect(() => {
    const newDateStr = format(selectedDate, 'yyyy-MM-dd');
    const currentDateStr = selectedDates[0] ? format(selectedDates[0], 'yyyy-MM-dd') : '';
    
    // Only update if the date actually changed
    if (newDateStr !== currentDateStr) {
      setSelectedDates([selectedDate]);
    }
  }, [selectedDate]);

  // Validate appointments have correct salon_id - OPTIMIZED with debouncing
  const validateAppointmentsRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    // Debounce validation to avoid excessive calls
    if (validateAppointmentsRef.current) {
      clearTimeout(validateAppointmentsRef.current);
    }
    
    validateAppointmentsRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const salonId = await getSalonId();
        
        if (salonId && appointments.length > 0) {
          // Check if any appointments don't have the correct salon_id
          const invalidAppointments = appointments.filter(app => !app.salon_id || app.salon_id !== salonId);
          
          if (invalidAppointments.length > 0) {
            console.warn('⚠️ MobileDayView: Found appointments with incorrect salon_id:', {
              totalAppointments: appointments.length,
              invalidCount: invalidAppointments.length,
              expectedSalonId: salonId,
              invalidAppointments: invalidAppointments.slice(0, 3).map(app => ({
                id: app.id,
                salon_id: app.salon_id,
                data: app.data,
                nome: app.nome
              }))
            });
          }
        }
      } catch (error) {
        console.error('Error validating appointments salon_id:', error);
      }
    }, 1000); // Debounce for 1 second

    return () => {
      if (validateAppointmentsRef.current) {
        clearTimeout(validateAppointmentsRef.current);
      }
    };
  }, [appointments]);

  // Reset multi-select mode when calendar is closed
  useEffect(() => {
    if (!showCalendar) {
      setIsMultiSelectMode(false);
    }
  }, [showCalendar]);

  // Fetch custom statuses - OPTIMIZED to run only once
  useEffect(() => {
    const fetchCustomStatuses = async () => {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.id) return;
        
        const { data, error } = await supabase
          .from("settings")
          .select("key, value")
          .eq("user_id", userData.user.id)
          .eq("type", "appointment_status")
          .eq("enabled", true)
          .order("created_at", { ascending: true });
          
        if (!error && data) {
          const statuses = data.map((s: { key: string, value: string }) => ({
            value: s.key,
            label: s.key.charAt(0).toUpperCase() + s.key.slice(1),
            color: '#8b5cf6',
          }));
          setCustomStatuses(statuses);
        }
      } catch (e) {
        // fail silent
      }
    };
    
    fetchCustomStatuses();
  }, []); // Empty dependency array - runs only once

  // Combine system and custom statuses - OPTIMIZED
  const allStatuses = React.useMemo(() => {
    const systemValues = APPOINTMENT_STATUSES.map(s => s.value);
    const filteredCustom = customStatuses.filter(s => !systemValues.includes(s.value));
    return [...APPOINTMENT_STATUSES, ...filteredCustom];
  }, [customStatuses]);

  // Calculate status counts for all appointments - OPTIMIZED
  const statusCounts = React.useMemo(() => {
    const counts: Record<string | 'null' | 'empty', number> = {};
    
    if (!appointments.length) return counts;
    
    // Use the same filtering logic as filteredAppointments but without date filtering
    const filteredForCounts = appointments.filter(app => {
      // Filter by member
      if (selectedMembers.length > 0 && !selectedMembers.includes(app.team_id)) {
        return false;
      }
      
      // Filter by status
      if (selectedStatusFilters.length > 0) {
        if (selectedStatusFilters.includes('deleted')) {
          if (app.status !== 'Eliminato') return false;
        } else {
          if (!selectedStatusFilters.includes(app.status)) return false;
        }
      }
      
      // Filter deleted appointments
      if (showDeletedAppointments) {
        return app.status === 'Eliminato';
      } else {
        return app.status !== 'Eliminato';
      }
    });
    
    for (const app of filteredForCounts) {
      let status = app.status || 'empty';
      if (status === 'Eliminato') status = 'deleted';
      counts[status] = (counts[status] || 0) + 1;
    }
    
    return counts;
  }, [appointments, selectedMembers, selectedStatusFilters, showDeletedAppointments]);

  // Handle status filter toggle
  const handleStatusFilterToggle = (status: string | null) => {
    if (status === 'deleted') {
      setShowDeletedAppointments(!showDeletedAppointments);
      return;
    }
    
    const updatedFilters = selectedStatusFilters.includes(status)
      ? selectedStatusFilters.filter(s => s !== status)
      : [...selectedStatusFilters, status];
    
    setSelectedStatusFilters(updatedFilters);
  };

  // Filter appointments based on selected filters - OPTIMIZED
  const filteredAppointments = React.useMemo(() => {
    let filtered = appointments;

    // Remove any potential duplicates by ID first
    const uniqueAppointments = filtered.filter((appointment, index, self) => 
      index === self.findIndex(a => a.id === appointment.id)
    );

    // Filter by selected dates (support for multiple dates)
    const selectedDateStrings = selectedDates.map(date => format(date, 'yyyy-MM-dd'));
    const dateFilteredAppointments = uniqueAppointments.filter(app => {
      // Ensure app.data is in the correct format (yyyy-MM-dd)
      const appointmentDate = app.data;
      
      // Handle different possible date formats
      let normalizedAppointmentDate = appointmentDate;
      if (appointmentDate && appointmentDate.includes('T')) {
        // If date is in ISO format, extract just the date part
        normalizedAppointmentDate = appointmentDate.split('T')[0];
      }
      
      return selectedDateStrings.includes(normalizedAppointmentDate);
    });

    // Filter by member
    if (selectedMembers.length > 0) {
      filtered = dateFilteredAppointments.filter(app => selectedMembers.includes(app.team_id));
    } else {
      filtered = dateFilteredAppointments;
    }

    // Filter by status
    if (selectedStatusFilters.length > 0) {
      filtered = filtered.filter(app => {
        if (selectedStatusFilters.includes('deleted')) {
          return app.status === 'Eliminato';
        }
        return selectedStatusFilters.includes(app.status);
      });
    }

    // Filter deleted appointments - if showDeletedAppointments is true, show only deleted
    // if false, hide deleted appointments
    if (showDeletedAppointments) {
      filtered = filtered.filter(app => app.status === 'Eliminato');
    } else {
      filtered = filtered.filter(app => app.status !== 'Eliminato');
    }

    return filtered;
  }, [appointments, selectedDates, selectedMembers, selectedStatusFilters, showDeletedAppointments]);

  // Raggruppa appuntamenti per ora con protezione duplicati - OPTIMIZED
  const appointmentsByHour = React.useMemo(() => {
    const grouped = filteredAppointments.reduce((acc, appointment) => {
      const hour = appointment.orarioInizio.split(':')[0];
      if (!acc[hour]) acc[hour] = [];
      
      // Check if appointment already exists in this hour group
      const exists = acc[hour].some(existing => existing.id === appointment.id);
      if (!exists) {
        acc[hour].push(appointment);
      }
      
      return acc;
    }, {} as Record<string, Appointment[]>);

    // Sort appointments within each hour by start time
    Object.keys(grouped).forEach(hour => {
      grouped[hour].sort((a, b) => a.orarioInizio.localeCompare(b.orarioInizio));
    });

    return grouped;
  }, [filteredAppointments]);

  // Funzione per ottenere lo stile della card con design moderno e bordi migliorati - OPTIMIZED with useCallback
  const getAppointmentCardStyle = useCallback((appointment: Appointment): React.CSSProperties => {
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
    const alone = appointment.alone || '';
    
    // Converti i colori in versioni più eleganti e moderne
    const getSubtleColor = (color: string): string => {
      return color + '15'; // 15% di opacità per un look più sottile
    };
    
    const getSubtleGradient = (color1: string, color2: string): string => {
      return `linear-gradient(135deg, ${getSubtleColor(color1)}, ${getSubtleColor(color2)})`;
    };
    
    // Ombra moderna e sottile
    const modernShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    const hoverShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    
    let boxShadow = modernShadow;
    if (alone && alone !== '' && colors.length > 0) {
      const alonePx = parseInt(String(alone));
      // Glow luminoso più sottile e moderno
      boxShadow = `${modernShadow}, 0 0 ${alonePx * 2}px ${alonePx * 0.8}px ${colors[0]}30`;
    }
    
    // Stile speciale per Pausa - design più moderno
    if (appointment.status === 'Pausa') {
      return {
        backgroundColor: '#f8fafc',
        backgroundImage: `repeating-linear-gradient(45deg, #e2e8f0 0px, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)`,
        color: '#64748b',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '1.5',
        letterSpacing: '-0.01em',
        cursor: 'not-allowed',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      };
    }
    
    // Stile per appuntamenti eliminati/cancellati - design più elegante
    if (appointment.status === 'cancelled' || appointment.status === 'deleted' || appointment.status === 'Eliminato') {
      return {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        opacity: appointment.status === 'Eliminato' ? 0.8 : appointment.status === 'deleted' ? 0.6 : 0.7,
        borderRadius: '16px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '1.5',
        letterSpacing: '-0.01em',
        cursor: 'not-allowed',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      };
    }
    
    // Stile per appuntamenti pagati - design più pulito
    if (appointment.status === 'pagato') {
      return {
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '16px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '1.5',
        letterSpacing: '-0.01em',
        cursor: 'not-allowed',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      };
    }
    
    // Applica i colori personalizzati con design moderno
    if (colors.length === 0) {
      return {
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '1.5',
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        boxShadow: modernShadow,
      };
    }
    
    if (style === 'filled') {
      if (colors.length === 2) {
        return {
          background: getSubtleGradient(colors[0], colors[1]),
          borderRadius: '16px',
          border: `1px solid ${colors[0]}30`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
          fontSize: '13px',
          fontWeight: '500',
          lineHeight: '1.5',
          letterSpacing: '-0.01em',
          cursor: 'pointer',
          boxShadow: boxShadow,
        };
      } else {
        return {
          background: getSubtleColor(colors[0]),
          borderRadius: '16px',
          border: `1px solid ${colors[0]}30`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
          fontSize: '13px',
          fontWeight: '500',
          lineHeight: '1.5',
          letterSpacing: '-0.01em',
          cursor: 'pointer',
          boxShadow: boxShadow,
        };
      }
    }
    
    // Per gli stili bar (top, bottom, left, right) usa design moderno
    if (style === 'top' || style === 'bottom' || style === 'left' || style === 'right') {
      return {
        background: '#ffffff',
        borderRadius: '16px',
        border: `1px solid ${colors.length > 0 ? colors[0] + '30' : '#e5e7eb'}`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '1.5',
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        boxShadow: modernShadow,
      };
    }
    
    // Fallback con design moderno
    return {
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      fontSize: '13px',
      fontWeight: '500',
      lineHeight: '1.5',
      letterSpacing: '-0.01em',
      cursor: 'pointer',
      boxShadow: modernShadow,
    };
  }, [appointments, selectedMembers, selectedStatusFilters, showDeletedAppointments, selectedDates]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pagato': return 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'cancelled': return 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200 shadow-sm';
      case 'deleted': return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200 shadow-sm';
      case 'Eliminato': return 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200 shadow-sm';
      case 'Pausa': return 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border-sky-200 shadow-sm';
      default: return 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200 shadow-sm';
    }
  }, []);

  const getDuration = useCallback((start: string, end: string) => {
    const startTime = parse(start, 'HH:mm', new Date());
    const endTime = parse(end, 'HH:mm', new Date());
    return differenceInMinutes(endTime, startTime);
  }, []);

  const handleAppointmentClick = async (appointment: Appointment) => {
    if (appointment.status === 'Pausa') {
      return;
    }
    
    // Temporarily bypass permission check for testing
    setSelectedAppointment(appointment);
    setIsEditOrderOpen(true);
    
    // Original permission check (commented for now)
    /*
    const canEdit = await canEditAppointment(appointment.team_id, hasPermission || (() => false));
    if (canEdit) {
      setSelectedAppointment(appointment);
      setIsEditOrderOpen(true);
    } else {
      toast({
        title: "Accesso Negato",
        description: "Non hai i permessi per modificare questo appuntamento",
        variant: "destructive",
      });
    }
    */
  };

  // Handle save order from EditOrderFormMobile - OPTIMIZED
  const handleSaveOrder = useCallback(async (
    services: Array<{ id: string; name: string; price: number }>, 
    updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string }
  ) => {
    if (!selectedAppointment) return;
    
    try {
      const supabase = createClient();
      
      // Update appointment data if provided
      if (updatedData) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            data: updatedData.data,
            orarioInizio: updatedData.orarioInizio,
            orarioFine: updatedData.orarioFine
          })
          .eq('id', selectedAppointment.id);
          
        if (updateError) throw updateError;
      }
      
      // Handle services updates
      const originalServices = selectedAppointment.services || [];
      
      // Insert new services (those with temp_ prefix)
      const newServices = services.filter(s => s.id.startsWith('temp_'));
      if (newServices.length > 0) {
        const newServiceInserts = newServices.map(service => ({
          order_id: selectedAppointment.id,
          servizio: service.name,
          price: service.price
        }));
        
        const { error: insertError } = await supabase
          .from('order_services')
          .insert(newServiceInserts);
          
        if (insertError) throw insertError;
      }
      
      // Update existing services
      const existingServices = services.filter(s => !s.id.startsWith('temp_'));
      for (const service of existingServices) {
        const { error: updateError } = await supabase
          .from('order_services')
          .update({
            servizio: service.name,
            price: service.price
          })
          .eq('id', service.id);
          
        if (updateError) throw updateError;
      }
      
      // Delete removed services
      const removedServices = originalServices.filter(
        original => !services.find(s => s.id === original.id)
      );
      
      for (const service of removedServices) {
        const { error: deleteError } = await supabase
          .from('order_services')
          .delete()
          .eq('id', service.id);
          
        if (deleteError) throw deleteError;
      }
      
      toast({
        title: "Modifiche salvate",
        description: "L'appuntamento è stato aggiornato con successo",
      });
      
      // Close modal
      setIsEditOrderOpen(false);
      setSelectedAppointment(null);
      
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        variant: "destructive",
      });
    }
  }, [selectedAppointment, toast]);

  // Handle save services from modal (keeping for EditServicesModal if needed)
  // Handle save services from modal - OPTIMIZED
  const handleSaveServices = useCallback(async (
    services: Array<{ id: string; name: string; price: number }>, 
    updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string }
  ) => {
    if (!selectedAppointment) return;
    
    try {
      const supabase = createClient();
      
      // Update appointment data if provided
      if (updatedData && Object.keys(updatedData).length > 0) {
        const { error: updateError } = await supabase
          .from('orders')
          .update(updatedData)
          .eq('id', selectedAppointment.id);
          
        if (updateError) throw updateError;
      }
      
      // Handle services updates
      const originalServices = selectedAppointment.services || [];
      
      // Insert new services (those with temp_ prefix)
      const newServices = services.filter(s => s.id.startsWith('temp_'));
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
          
        if (insertError) throw insertError;
      }
      
      // Update existing services
      const existingServices = services.filter(s => !s.id.startsWith('temp_'));
      for (const service of existingServices) {
        const { error: updateError } = await supabase
          .from('order_services')
          .update({
            servizio: service.name,
            price: service.price
          })
          .eq('order_id', selectedAppointment.id)
          .eq('service_id', Number(service.id));
          
        if (updateError) throw updateError;
      }
      
      // Delete removed services
      const removedServices = originalServices.filter(
        original => !services.find(s => s.id === original.id)
      );
      
      if (removedServices.length > 0) {
        const { error: deleteError } = await supabase
          .from('order_services')
          .delete()
          .eq('order_id', selectedAppointment.id)
          .in('service_id', removedServices.map(s => Number(s.id)));
          
        if (deleteError) throw deleteError;
      }
      
      toast({
        title: "Modifiche salvate",
        description: "L'appuntamento è stato aggiornato con successo",
      });
      
      // Close modal
      setIsEditServicesOpen(false);
      setSelectedAppointment(null);
      
    } catch (error) {
      console.error('Error saving services:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        variant: "destructive",
      });
    }
  }, [selectedAppointment, toast]);

  // Handle delete service from modal - OPTIMIZED
  const handleDeleteService = useCallback(async (serviceId: string, orderId: string) => {
    try {
      const supabase = createClient();
      
      // Handle both temp_ prefixed services and existing services
      const actualServiceId = serviceId.startsWith('temp_') ? serviceId.replace('temp_', '') : serviceId;
      
      const { error } = await supabase
        .from('order_services')
        .delete()
        .eq('order_id', orderId)
        .eq('service_id', Number(actualServiceId));
        
      if (error) throw error;
      
      toast({
        title: "Servizio eliminato",
        description: "Il servizio è stato rimosso con successo",
      });
      
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il servizio",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Virtualized list item renderer with improved modern design - OPTIMIZED
  const AppointmentCard = React.memo(({ appointment }: { appointment: Appointment }) => {
    // Get team member data efficiently using memoized map
    const teamMember = teamMemberMap.get(appointment.team_id);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startX, setStartX] = useState(0);

    // Memoize touch handlers to prevent recreation on every render
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      setStartY(e.touches[0].clientY);
      setStartX(e.touches[0].clientX);
      setIsDragging(false);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      if (!startY || !startX) return;
      
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = Math.abs(currentY - startY);
      const deltaX = Math.abs(currentX - startX);
      
      // Se il movimento è più orizzontale che verticale, o se è un movimento verticale significativo
      if (deltaX > 10 || deltaY > 10) {
        setIsDragging(true);
        // Previeni lo scroll se stiamo interagendo con la card
        if (deltaX > deltaY || deltaY < 20) {
          e.preventDefault();
        }
      }
    }, [startY, startX]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      if (!isDragging) {
        // Solo se non stiamo trascinando, esegui il click
        handleAppointmentClick(appointment);
      }
      setIsDragging(false);
      setStartY(0);
      setStartX(0);
    }, [isDragging, appointment]);

    const handleClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleAppointmentClick(appointment);
    }, [appointment]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={{ 
          scale: 1.02,
          y: -2,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: isDragging ? 1 : 0.98 }}
      >
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl active:scale-98 mb-4 overflow-hidden group mobile-touch-feedback"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          style={{
            ...getAppointmentCardStyle(appointment),
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
        <CardContent className="py-4 px-5">
          {/* Header with client name and status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate text-base group-hover:text-blue-700 transition-colors duration-200">
                  {appointment.nome}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge className={`${getStatusColor(appointment.status)} text-xs px-3 py-1 rounded-full font-medium shadow-sm`}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {/* Team Member Icon */}
              <Avatar className="w-8 h-8 border-2 border-white shadow-sm group-hover:shadow-md transition-shadow duration-200 flex-shrink-0">
                <AvatarImage 
                  src={teamMember?.avatar_url || ''} 
                  alt={teamMember?.name || 'Membro'}
                />
                <AvatarFallback className="bg-gradient-to-br from-violet-100 to-purple-200 text-violet-700 font-bold text-xs">
                  {teamMember?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500 font-semibold bg-gray-50 px-2 py-1 rounded-full">
                {getDuration(appointment.orarioInizio, appointment.orarioFine)} min
              </span>
            </div>
          </div>

          {/* Service and time with improved layout */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {appointment.orarioInizio} - {appointment.orarioFine}
              </span>
            </div>

            {/* Services badges with improved styling */}
            {appointment.services && appointment.services.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {appointment.services.map((service, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 text-xs font-semibold border border-violet-200 shadow-sm"
                  >
                    {(service as any).servizio || service.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer with member and price - improved design */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {selectedMembers.length > 0 && (
                <>
                  <div className="w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-gray-700">
                      {teamMember?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {teamMember?.name || 'Membro'}
                  </span>
                </>
              )}
            </div>
            
            {appointment.services && appointment.services.length > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold text-green-600">
                  €{appointment.services.reduce((sum, service) => sum + service.price, 0).toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 font-medium">Totale</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
    );
  });

  // Responsive breakpoints - DEVONO essere qui, subito dopo l'inizio del componente!
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isDesktop = useMediaQuery({ minWidth: 1025 });

  // Memoize team member lookups for better performance
  const teamMemberMap = useMemo(() => {
    const map = new Map();
    teamMembers.forEach(member => {
      map.set(member.id, member);
    });
    return map;
  }, [teamMembers]);

  // Show loading screen while data is being loaded
  if (isLoadingMembers || isLoadingAppointments) {
    return (
      <div 
        className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0) + 6rem)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)'
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
          </div>
          <p className="text-base font-medium text-gray-700 text-center mb-4">
            {isLoadingMembers ? 'Caricamento membri del team...' : 'Caricamento appuntamenti...'}
          </p>
          <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-violet-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading indicator when changing date
  if (isChangingDate) {
    return (
      <div 
        className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0) + 6rem)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)'
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-base font-medium text-gray-700 text-center">Aggiornamento calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={
        `min-h-screen w-full bg-[#f8fafc] mobile-safe-top mobile-safe-bottom safe-area ` +
        (isMobile ? 'mobile-layout ' : isTablet ? 'tablet-layout ' : 'desktop-layout ')
      }
      style={{
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        position: isMobileDevice ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        paddingTop: 'calc(env(safe-area-inset-top, 0) + 6rem)'
      }}
      {...swipeHandlers}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {refreshY > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: refreshY }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-violet-100 flex items-center justify-center overflow-hidden"
            style={{ height: Math.min(refreshY, 100) }}
          >
            <div className="flex items-center gap-2 text-violet-700">
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
                className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full"
              />
              <span className="text-sm font-medium">
                {isRefreshing ? 'Aggiornamento...' : 'Trascina per aggiornare'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Header Container with both navbars */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white">
        {/* Mobile Navigation Bar */}
        <div className="border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
          <div className="w-full">
            <MobileNavbar
              toggleDay={toggleDay || (() => {})}
              toggleClients={toggleClients || (() => {})}
              toggleOnlineBookings={toggleOnlineBookings || (() => {})}
              showDay={showDay ?? true}
              showClients={showClients ?? false}
              showOnlineBookings={showOnlineBookings ?? false}
              hasPermission={hasPermission || (() => false)}
              canAccess={(requiredPermissions: string[]) => requiredPermissions.every(p => hasPermission?.(p) || false)}
            />
          </div>
        </div>

        {/* Main Navbar - Responsive and Adaptive */}
        <motion.div 
          className="border-b border-gray-100 touch-manipulation"
          style={{ 
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translate3d(0, 0, 0)',
            WebkitTransform: 'translate3d(0, 0, 0)',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            paddingLeft: 'max(1rem, env(safe-area-inset-left, 1rem))',
            paddingRight: 'max(1rem, env(safe-area-inset-right, 1rem))'
          }}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
        {/* Responsive Quick Actions Bar */}
        <div className="flex items-center justify-between w-full min-w-0">
          {/* Left side - Primary actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
            {/* Today Button - Always visible */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Button
                onClick={() => debouncedDateChange(new Date())}
                className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-xs font-semibold shadow-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-200 active:scale-95 p-0"
                title="Oggi"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </motion.div>

            {/* Filter Status Button - Hidden on very small screens */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden xs:block flex-shrink-0">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowFilterModal(true)}
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-semibold transition-all duration-200 border-2 p-0 relative ${
                  selectedStatusFilters.length > 0 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-300 shadow-md' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                title="Filtri"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                {selectedStatusFilters.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-[6px] sm:text-[8px] font-bold text-white">
                      {selectedStatusFilters.length}
                    </span>
                  </div>
                )}
              </Button>
            </motion.div>

            {/* Show Deleted Button - Hidden on small screens */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeletedAppointments(!showDeletedAppointments)}
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-semibold transition-all duration-200 border-2 p-0 relative ${
                  showDeletedAppointments 
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-300 shadow-md' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                title="Eliminati"
              >
                <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </motion.div>

            {/* Member Selection Button - Hidden on small screens */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMemberDropdown(true)}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-semibold transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 p-0 relative"
                title="Membri"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-[6px] sm:text-[8px] font-bold text-white">
                    {selectedMembers.length > 0 ? selectedMembers.length : teamMembers.length}
                  </span>
                </div>
              </Button>
            </motion.div>

            {/* Calendar Navigation Group */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Previous Day Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = subDays(selectedDate, 1);
                    onDateChange(newDate);
                  }}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-semibold transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 p-0"
                  title="Giorno precedente"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </motion.div>

              {/* Calendar Button - Always visible but smaller on mobile */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalendar(true)}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-semibold transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 p-0 relative"
                  title="Calendario"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-[6px] sm:text-[8px] font-bold text-white">
                      {selectedDates.length}
                    </span>
                  </div>
                </Button>
              </motion.div>

              {/* Next Day Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = addDays(selectedDate, 1);
                    onDateChange(newDate);
                  }}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-semibold transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 p-0"
                  title="Giorno successivo"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Right side - Essential actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Create (Appointment / Pausa) Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                  <Button
                    className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-xs font-semibold shadow-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-200 active:scale-95 p-0"
                    title="Crea"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsCreateOrderOpen(true)}>
                  Nuovo appuntamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCreatePausaOpen(true)}>
                  Nuova pausa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Hamburger Menu - Only on very small screens */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0 xs:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHamburgerMenu(true)}
                className="h-8 w-8 rounded-full text-xs font-semibold transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 p-0"
                title="Menu"
              >
                <Menu className="h-3 w-3" />
              </Button>
            </motion.div>
            

          </div>
        </div>

        {/* Secondary Actions Bar - Only visible on larger screens */}
        <div className="hidden md:flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-100">
          {/* Filter Status Button - Full size on desktop */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowFilterModal(true)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 relative ${
                selectedStatusFilters.length > 0 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-300 shadow-md' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
              title="Filtri"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtri
              {selectedStatusFilters.length > 0 && (
                <div className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                  {selectedStatusFilters.length}
                </div>
              )}
            </Button>
          </motion.div>

          {/* Show Deleted Button - Full size on desktop */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeletedAppointments(!showDeletedAppointments)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${
                showDeletedAppointments 
                  ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-300 shadow-md' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
              title="Eliminati"
            >
              <Trash className="h-4 w-4 mr-2" />
              Eliminati
            </Button>
          </motion.div>

          {/* Member Selection Button - Full size on desktop */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMemberDropdown(true)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              title="Membri"
            >
              <Eye className="h-4 w-4 mr-2" />
              Membri
              <div className="ml-2 px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs font-bold">
                {selectedMembers.length > 0 ? selectedMembers.length : teamMembers.length}
              </div>
            </Button>
          </motion.div>
        </div>
      </motion.div>
      </div>

      {/* Hamburger Menu Modal - For very small screens */}
      <AnimatePresence>
        {showHamburgerMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full max-w-full max-h-full rounded-none overflow-y-auto bg-white border-none shadow-none p-0 flex flex-col"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-3 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHamburgerMenu(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors h-8 w-8"
                  aria-label="Chiudi menu"
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </Button>
                <h1 className="text-base font-bold text-gray-900 flex-1 text-center mx-3 truncate">Menu Azioni</h1>
                <div className="w-8"></div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {/* Filter Status Button */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowFilterModal(true);
                      setShowHamburgerMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                      selectedStatusFilters.length > 0 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                      <Filter className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-base font-bold text-gray-900 truncate block">Filtri</span>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedStatusFilters.length > 0 ? `${selectedStatusFilters.length} filtri attivi` : 'Nessun filtro attivo'}
                      </p>
                    </div>
                    {selectedStatusFilters.length > 0 && (
                      <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                        {selectedStatusFilters.length}
                      </div>
                    )}
                  </motion.button>

                  {/* Show Deleted Button */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDeletedAppointments(!showDeletedAppointments);
                      setShowHamburgerMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                      showDeletedAppointments 
                        ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-md' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-200 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                      <Trash className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-base font-bold text-gray-900 truncate block">Eliminati</span>
                      <p className="text-sm text-gray-500 mt-1">
                        {showDeletedAppointments ? 'Visibili' : 'Nascosti'}
                      </p>
                    </div>
                    {showDeletedAppointments && (
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </motion.button>

                  {/* Member Selection Button */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowMemberDropdown(true);
                      setShowHamburgerMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-base font-bold text-gray-900 truncate block">Membri</span>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedMembers.length > 0 ? `${selectedMembers.length} selezionati` : `${teamMembers.length} disponibili`}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
                      {selectedMembers.length > 0 ? selectedMembers.length : teamMembers.length}
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Selection Modal */}
      <AnimatePresence>
        {showMemberDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full max-w-full max-h-full rounded-none overflow-y-auto bg-white border-none shadow-none p-0 flex flex-col"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-3 shadow-sm">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMemberDropdown(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors h-8 w-8"
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </Button>
                </motion.div>
                <h1 className="text-base font-bold text-gray-900 flex-1 text-center mx-3 truncate">Seleziona membri</h1>
                <div className="flex gap-1">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMembers([])}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      Cancella
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMembers(teamMembers.map(m => m.id))}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      Tutti
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {teamMembers.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-2 text-base">Nessun membro disponibile</p>
                    <p className="text-sm text-gray-500">Non ci sono membri da selezionare</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member, index) => (
                      <motion.button
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedMembers(prev => 
                            prev.includes(member.id) 
                              ? prev.filter(id => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                          selectedMembers.includes(member.id) 
                            ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 shadow-md' 
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <Avatar className="h-12 w-12 border-3 border-white shadow-md flex-shrink-0">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-100 to-purple-200 text-violet-700 font-bold text-sm">
                            {member.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-base font-bold text-gray-900 truncate block">{member.name}</span>
                          {member.email && (
                            <p className="text-sm text-gray-500 mt-1 truncate">{member.email}</p>
                          )}
                          {member.phone_number && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{member.phone_number}</p>
                          )}
                        </div>
                        {selectedMembers.includes(member.id) && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 rounded-2xl font-bold transition-all duration-200 active:scale-95 shadow-lg text-base"
                    onClick={() => setShowMemberDropdown(false)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Conferma ({selectedMembers.length > 0 ? selectedMembers.length : teamMembers.length} membri)
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Status Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full max-w-full max-h-full rounded-none overflow-y-auto bg-white border-none shadow-none p-0 flex flex-col"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-3 shadow-sm">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilterModal(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors h-8 w-8"
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </Button>
                </motion.div>
                <h1 className="text-base font-bold text-gray-900 flex-1 text-center mx-3 truncate">Seleziona filtri</h1>
                <div className="flex gap-1">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStatusFilters([])}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      Cancella
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStatusFilters(allStatuses.map(s => s.value))}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      Tutti
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {allStatuses.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Filter className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-2 text-base">Nessun filtro disponibile</p>
                    <p className="text-sm text-gray-500">Non ci sono stati da filtrare</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {allStatuses.map((status, index) => (
                      <motion.button
                        key={status.value || 'empty'}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedStatusFilters(prev => 
                            prev.includes(status.value) 
                              ? prev.filter(s => s !== status.value)
                              : [...prev, status.value]
                          );
                        }}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                          selectedStatusFilters.includes(status.value)
                            ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 shadow-md' 
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                            style={{ backgroundColor: status.color }}
                          />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-base font-bold text-gray-900 truncate block">{status.label}</span>
                          <p className="text-sm text-gray-500 mt-1">
                            {statusCounts[status.value ?? 'empty'] || 0} appuntamenti
                          </p>
                        </div>
                        {selectedStatusFilters.includes(status.value) && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 rounded-2xl font-bold transition-all duration-200 active:scale-95 shadow-lg text-base"
                    onClick={() => setShowFilterModal(false)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Conferma ({selectedStatusFilters.length > 0 ? selectedStatusFilters.length : allStatuses.length} filtri)
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apple Style Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full max-w-full max-h-full rounded-none overflow-y-auto bg-white border-none shadow-none p-0 flex flex-col"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-3 shadow-sm">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCalendar(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors h-8 w-8"
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </Button>
                </motion.div>
                <h1 className="text-base font-bold text-gray-900 flex-1 text-center mx-3 truncate">
                  {isMultiSelectMode ? 'Seleziona date' : 'Seleziona data'}
                </h1>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                    className={`p-1.5 rounded-full transition-colors h-8 w-8 ${
                      isMultiSelectMode 
                        ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={isMultiSelectMode ? 'Modalità singola' : 'Modalità multipla'}
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                  </Button>
                </motion.div>
              </div>

              {/* Calendar Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCalendarMonth(subDays(startOfMonth(calendarMonth), 1))}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                  </motion.div>
                  
                  <motion.h2 
                    className="text-lg font-bold text-gray-900"
                    key={format(calendarMonth, 'yyyy-MM')}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {format(calendarMonth, 'MMMM yyyy', { locale: it })}
                  </motion.h2>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCalendarMonth(addDays(endOfMonth(calendarMonth), 1))}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </Button>
                  </motion.div>
                </div>

                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, index) => (
                    <div key={day} className="text-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const start = startOfMonth(calendarMonth);
                    const end = endOfMonth(calendarMonth);
                    const startDate = new Date(start);
                    startDate.setDate(startDate.getDate() - start.getDay());
                    
                    const days = eachDayOfInterval({
                      start: startDate,
                      end: new Date(end.getTime() + (6 - end.getDay()) * 24 * 60 * 60 * 1000)
                    });

                    return days.map((day, index) => {
                      const isCurrentMonth = isSameMonth(day, calendarMonth);
                      const isSelected = selectedDates.some(d => isSameDay(d, day));
                      const isCurrentDay = isToday(day);
                      const dayStr = day.toISOString().split('T')[0];
                      

                      
                      return (
                        <motion.button
                          key={day.toISOString()}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.01 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (isCurrentMonth) {
                              handleDateSelection(day);
                            }
                          }}
                          disabled={!isCurrentMonth}
                          className={`
                            relative h-12 w-full rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-200
                            ${isCurrentMonth 
                              ? isSelected
                                ? 'bg-violet-600 text-white shadow-lg'
                                : isCurrentDay
                                  ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                                  : 'bg-white text-gray-900 hover:bg-violet-50 hover:text-violet-700 border border-gray-200'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          <span className="relative z-10 text-xs">
                            {format(day, 'd')}
                          </span>
                          

                          
                          {isSelected && (
                            <motion.div
                              layoutId={`selectedDay-${dayStr}`}
                              className="absolute inset-0 bg-violet-600 rounded-xl"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                          {isCurrentDay && !isSelected && (
                            <motion.div
                              className="absolute inset-0 bg-violet-100 rounded-xl border-2 border-violet-300"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      );
                    });
                  })()}
                </div>

                {/* Selected Dates Display */}
                {isMultiSelectMode && selectedDates.length > 0 && (
                  <div className="mt-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
                    <h3 className="font-semibold text-violet-900 mb-3 text-sm">Date selezionate:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates.map((date, index) => (
                        <motion.div
                          key={date.toISOString()}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-violet-300 shadow-sm"
                        >
                          <span className="text-sm font-medium text-violet-700">
                            {format(date, 'dd/MM')}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setSelectedDates(prev => prev.filter(d => !isSameDay(d, date)));
                            }}
                            className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                          >
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-8 space-y-3">
                  {isMultiSelectMode ? (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={applySelectedDates}
                        disabled={selectedDates.length === 0}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Applica {selectedDates.length} {selectedDates.length === 1 ? 'data' : 'date'}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => {
                          debouncedDateChange(new Date());
                          setShowCalendar(false);
                        }}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-lg"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Vai a oggi
                      </Button>
                    </motion.div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const yesterday = subDays(selectedDate, 1);
                          if (isMultiSelectMode) {
                            setSelectedDates([yesterday]);
                          } else {
                            debouncedDateChange(yesterday);
                            setShowCalendar(false);
                          }
                        }}
                        className="w-full py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 border-violet-200 text-violet-700 hover:bg-violet-50"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Ieri
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const tomorrow = addDays(selectedDate, 1);
                          if (isMultiSelectMode) {
                            setSelectedDates([tomorrow]);
                          } else {
                            debouncedDateChange(tomorrow);
                            setShowCalendar(false);
                          }
                        }}
                        className="w-full py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 border-violet-200 text-violet-700 hover:bg-violet-50"
                      >
                        Domani
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Content Area */}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 1rem) + 5rem)',
          height: 'calc(100vh - env(safe-area-inset-top, 0) - 6rem)'
        }}
        {...refreshBind()}
      >
        <div className="p-3 pt-6">
          {/* Date Card - Always visible */}
          <motion.div 
            className="mb-6 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => setShowCalendar(true)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 hover:from-violet-100 hover:to-purple-100 transition-all duration-200 active:scale-95 shadow-sm"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex flex-col items-start gap-1">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  {selectedDates.length === 1 
                    ? format(selectedDates[0], 'EEEE d MMMM', { locale: it })
                    : `${selectedDates.length} date selezionate`
                  }
                </h1>
                <div className="inline-block px-3 py-1 bg-white rounded-full border border-violet-200 shadow-sm">
                  <p className="text-sm font-semibold text-violet-700">
                    {selectedDates.length === 1 
                      ? format(selectedDates[0], 'dd/MM/yyyy')
                      : `${format(selectedDates[0], 'dd/MM')} - ${format(selectedDates[selectedDates.length - 1], 'dd/MM')}`
                    }
                  </p>
                </div>
              </div>
              
              {/* Appointment Counter */}
              <div className="flex flex-col items-center gap-1">
                <div className="px-3 py-1.5 bg-violet-600 rounded-full shadow-sm">
                  <p className="text-sm font-bold text-white">
                    {filteredAppointments.length}
                  </p>
                </div>
                <p className="text-xs font-medium text-violet-700">
                  {filteredAppointments.length === 1 ? 'appuntamento' : 'appuntamenti'}
                </p>
              </div>
              
              {isChangingDate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl"
                >
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </motion.div>
              )}
            </motion.button>
          </motion.div>

          {/* Content based on whether there are appointments */}
          {Object.keys(appointmentsByHour).length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center py-8"
            >
              <Clock className="h-12 w-12 text-violet-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun appuntamento
              </h3>
              <p className="text-violet-600 mb-4 text-sm">
                {selectedMembers.length > 0 
                  ? `Nessun appuntamento per ${selectedDates.length === 1 
                      ? format(selectedDates[0], 'dd/MM/yyyy')
                      : `${selectedDates.length} date selezionate`
                    } per i membri selezionati`
                  : `Nessun appuntamento per ${selectedDates.length === 1 
                      ? format(selectedDates[0], 'dd/MM/yyyy')
                      : `${selectedDates.length} date selezionate`
                    }`
                }
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => setIsCreateOrderOpen(true)} className="w-full bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo appuntamento
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            Object.entries(appointmentsByHour)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([hour, hourAppointments]) => (
                <motion.div 
                  key={hour} 
                  className="space-y-2 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                    >
                      <span className="text-violet-600 font-semibold text-xs">
                        {hour}:00
                      </span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {hour}:00 - {parseInt(hour) + 1}:00
                        </h3>
                        <div className="px-1.5 py-0.5 bg-violet-50 rounded-md border border-violet-200 flex-shrink-0">
                          <span className="text-xs font-medium text-violet-700">
                            {hourAppointments.length} app.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {hourAppointments
                      .filter((appointment, index, self) => 
                        // Additional safety check to prevent duplicates in rendering
                        index === self.findIndex(a => a.id === appointment.id)
                      )
                      .map((appointment, index) => (
                        <motion.div
                          key={`${appointment.id}-${hour}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <AppointmentCard appointment={appointment} />
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              ))
          )}
        </div>
      </div>

      {/* Edit Order Modal */}
      <EditOrderFormMobile
        open={isEditOrderOpen}
        onClose={() => {
          console.log('🔍 Closing modal');
          setIsEditOrderOpen(false);
          setSelectedAppointment(null);
          updateModalState?.(false);
        }}
        appointment={selectedAppointment}
        onSave={handleSaveOrder}
        onDeleteService={handleDeleteService}
        updateModalState={updateModalState}
      />

      {/* Edit Services Modal (keeping as backup) */}
      <EditServicesModal
        isOpen={isEditServicesOpen}
        onClose={() => {
          setIsEditServicesOpen(false);
          setSelectedAppointment(null);
          updateModalState?.(false);
        }}
        appointment={selectedAppointment}
        onSave={handleSaveServices}
        onDeleteService={handleDeleteService}
      />

      {/* Create Order Modal */}
      <CreateOrderMobile
        isDialogOpen={isCreateOrderOpen}
        setIsDialogOpen={(open: boolean) => {
          setIsCreateOrderOpen(open);
          updateModalState?.(open);
        }}
        actionType="appointment"
        onAppointmentCreated={() => {
          dispatchAppointmentEvent(APPOINTMENT_EVENTS.CREATED);
          setIsCreateOrderOpen(false);
          updateModalState?.(false);
        }}
      />

      {/* Create Pausa Modal */}
      <PausaMobile
        isDialogOpen={isCreatePausaOpen}
        setIsDialogOpen={(open: boolean) => {
          setIsCreatePausaOpen(open);
          updateModalState?.(open);
        }}
        initialFormData={{
          data: format(selectedDate, 'yyyy-MM-dd'),
          orarioInizio: '10:00',
          orarioFine: '',
          team_id: ''
        }}
        onPausaCreated={() => {
          setIsCreatePausaOpen(false);
          updateModalState?.(false);
        }}
      />
    </div>
  );
} 