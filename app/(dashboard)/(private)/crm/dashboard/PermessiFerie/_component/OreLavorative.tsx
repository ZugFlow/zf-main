'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocalization } from "@/hooks/useLocalization";
import { format, startOfWeek, addWeeks, addDays, subWeeks, eachDayOfInterval, isSameDay, isToday, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";
import { 
  ClockIcon,
  BarChart3,
  CalendarDays,
  Plus,
  AlertCircle,
  Settings,
  Users,
  Copy,
  Eye,
  EyeOff,
  Bell,
  CheckCircle,
  XCircle,
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Upload,

  Calendar,
  Clock,
  User,
  Building2,
  FileText,
  RefreshCw,
  Clock3,
  Coffee,
  Sun,
  Moon,
  Zap,
  Shield,
  ShieldCheck,
  ShieldX,
  Loader2
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { 
  WorkHours, 
  WeeklySchedule, 
  DailySchedule, 
  ExtraSchedule, 
  ShiftRequest, 
  AvailabilityRequest,
  ScheduleNotification,
  WorkingHoursFormData,
  ExtraScheduleFormData,
  ShiftRequestFormData,
  AvailabilityRequestFormData,
  Member,
  Permission
} from './types';
import StatsCardsOrari from './StatsCardsOrari';

interface OreLavorativeProps {
  workHours: WorkHours[];
  members: Member[];
  isManager: boolean;
  currentUser: any;
  salonId: string;
  permissions?: Permission[]; // Aggiungo i permessi come prop opzionale
}

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunedì', short: 'Lun' },
  { id: 2, name: 'Martedì', short: 'Mar' },
  { id: 3, name: 'Mercoledì', short: 'Mer' },
  { id: 4, name: 'Giovedì', short: 'Gio' },
  { id: 5, name: 'Venerdì', short: 'Ven' },
  { id: 6, name: 'Sabato', short: 'Sab' },
  { id: 0, name: 'Domenica', short: 'Dom' }
];

const TIME_PRESETS = [
  { label: '9:00-17:00', start: '09:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
  { label: '8:00-16:00', start: '08:00', end: '16:00', break_start: '12:00', break_end: '13:00' },
  { label: '8:30-17:30', start: '08:30', end: '17:30', break_start: '12:30', break_end: '13:30' },
  { label: '9:30-18:30', start: '09:30', end: '18:30', break_start: '13:00', break_end: '14:00' },
  { label: '10:00-19:00', start: '10:00', end: '19:00', break_start: '13:30', break_end: '14:30' },
  { label: 'Solo mattina', start: '09:00', end: '13:00', break_start: '', break_end: '' },
  { label: 'Solo pomeriggio', start: '14:00', end: '18:00', break_start: '', break_end: '' },
];

const supabase = createClient();

export default function OreLavorative({ 
  workHours, 
  members, 
  isManager, 
  currentUser, 
  salonId,
  permissions = [] // Default a array vuoto
}: OreLavorativeProps) {
  const { toast } = useToast();
  const { t, formatDate, formatCurrency, currentLanguage } = useLocalization();

  // State management
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [monthlyEdits, setMonthlyEdits] = useState<Record<string, {
    start_time?: string;
    end_time?: string;
    break_start?: string;
    break_end?: string;
    is_working_day?: boolean;
  }>>({});
  
  // Data states
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>([]);
  const [dailySchedules, setDailySchedules] = useState<DailySchedule[]>([]);
  const [extraSchedules, setExtraSchedules] = useState<ExtraSchedule[]>([]);
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [availabilityRequests, setAvailabilityRequests] = useState<AvailabilityRequest[]>([]);
  const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
  
  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmittingWeeklySchedule, setIsSubmittingWeeklySchedule] = useState(false);
  const [isSubmittingExtraSchedule, setIsSubmittingExtraSchedule] = useState(false);
  const [isSubmittingShiftRequest, setIsSubmittingShiftRequest] = useState(false);
  const [isSubmittingAvailabilityRequest, setIsSubmittingAvailabilityRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [isWeeklyScheduleDialogOpen, setIsWeeklyScheduleDialogOpen] = useState(false);
  const [isExtraScheduleDialogOpen, setIsExtraScheduleDialogOpen] = useState(false);
  const [isShiftRequestDialogOpen, setIsShiftRequestDialogOpen] = useState(false);
  const [isAvailabilityRequestDialogOpen, setIsAvailabilityRequestDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  
  // Form states
  const [weeklyScheduleForm, setWeeklyScheduleForm] = useState<WorkingHoursFormData>({
    member_id: '',
    week_start_date: format(currentWeek, 'yyyy-MM-dd'),
    schedules: {}
  });
  
  const [extraScheduleForm, setExtraScheduleForm] = useState<ExtraScheduleFormData>({
    member_id: '',
    date: '',
    start_time: '',
    end_time: '',
    type: 'extra',
    reason: ''
  });
  
  const [shiftRequestForm, setShiftRequestForm] = useState<ShiftRequestFormData>({
    requested_date: '',
    current_start_time: '',
    current_end_time: '',
    requested_start_time: '',
    requested_end_time: '',
    reason: ''
  });
  
  const [availabilityRequestForm, setAvailabilityRequestForm] = useState<AvailabilityRequestFormData>({
    date: '',
    start_time: '',
    end_time: '',
    type: 'available',
    reason: ''
  });

  // Add new state for enhanced time entry
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [bulkDays, setBulkDays] = useState<number[]>([]);
  const [showBulkOptions, setShowBulkOptions] = useState(false);

  // Calculate stats
  const totalHours = workHours.reduce((acc, wh) => acc + wh.total_hours, 0);
  const averageHours = workHours.length > 0 ? totalHours / workHours.length : 0;
  const totalDays = workHours.length;

  // Helper function to get permissions for a specific date
  const getPermissionsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const permissions = filteredPermissions.filter(permission => {
      const startDate = new Date(permission.start_date);
      const endDate = new Date(permission.end_date);
      const checkDate = new Date(dateString);
      return checkDate >= startDate && checkDate <= endDate;
    });
    
    // Raggruppa per tipo e mostra solo il primo di ogni tipo
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.type]) {
        acc[permission.type] = permission;
      }
      return acc;
    }, {} as Record<string, Permission>);
    
    return Object.values(groupedPermissions);
  };

  // Get current member if not manager
  const currentMember = !isManager && currentUser 
    ? members.find(m => m.user_id === currentUser.id)
    : null;

  // Filtra i dati per i non-manager
  const filteredWorkHours = !isManager && currentMember 
    ? workHours.filter(wh => wh.member_id === currentMember.id)
    : workHours;

  const filteredWeeklySchedules = !isManager && currentMember
    ? weeklySchedules.filter(ws => ws.member_id === currentMember.id)
    : weeklySchedules;

  const filteredExtraSchedules = !isManager && currentMember
    ? extraSchedules.filter(es => es.member_id === currentMember.id)
    : extraSchedules;

  const filteredShiftRequests = !isManager && currentMember
    ? shiftRequests.filter(sr => sr.member_id === currentMember.id)
    : shiftRequests;

  const filteredAvailabilityRequests = !isManager && currentMember
    ? availabilityRequests.filter(ar => ar.member_id === currentMember.id)
    : availabilityRequests;

  const filteredNotifications = !isManager && currentMember
    ? notifications.filter(n => n.member_id === currentMember.id)
    : notifications;

  // Filtra i permessi approvati per la visualizzazione nelle ore lavorative
  const approvedPermissions = permissions.filter(p => p.status === 'approved');
  const filteredPermissions = !isManager && currentMember
    ? approvedPermissions.filter(p => p.member_id === currentMember.id)
    : approvedPermissions;

  // Debug: log members data
  useEffect(() => {
    console.log('🔍 OreLavorative - Members data:', {
      membersCount: members.length,
      members: members.map(m => ({ id: m.id, name: m.name, user_id: m.user_id })),
      isManager,
      currentUser: currentUser?.id,
      salonId,
      currentMember: currentMember?.id
    });
  }, [members, isManager, currentUser, salonId, currentMember]);

  // Debug: log filtered data
  useEffect(() => {
    console.log('🔍 OreLavorative - Filtered data:', {
      originalWorkHours: workHours.length,
      filteredWorkHours: filteredWorkHours.length,
      originalWeeklySchedules: weeklySchedules.length,
      filteredWeeklySchedules: filteredWeeklySchedules.length,
      originalExtraSchedules: extraSchedules.length,
      filteredExtraSchedules: filteredExtraSchedules.length,
      originalShiftRequests: shiftRequests.length,
      filteredShiftRequests: filteredShiftRequests.length,
      originalAvailabilityRequests: availabilityRequests.length,
      filteredAvailabilityRequests: filteredAvailabilityRequests.length,
      originalNotifications: notifications.length,
      filteredNotifications: filteredNotifications.length
    });
    
    // Debug weekly schedules
    console.log('🔍 Weekly Schedules:', weeklySchedules.map(ws => ({
      id: ws.id,
      member_id: ws.member_id,
      week_start_date: ws.week_start_date,
      is_active: ws.is_active
    })));
    
    // Debug daily schedules
    console.log('🔍 Daily Schedules:', dailySchedules.map(ds => ({
      id: ds.id,
      weekly_schedule_id: ds.weekly_schedule_id,
      day_of_week: ds.day_of_week,
      start_time: ds.start_time,
      end_time: ds.end_time
    })));
  }, [workHours, filteredWorkHours, weeklySchedules, filteredWeeklySchedules, extraSchedules, filteredExtraSchedules, shiftRequests, filteredShiftRequests, availabilityRequests, filteredAvailabilityRequests, notifications, filteredNotifications, dailySchedules]);

  // Fetch working hours data
  const fetchWorkingHoursData = useCallback(async () => {
    if (!salonId) return;
    
    try {
      setIsLoadingData(true);
      setError(null);

      // Fetch weekly schedules
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_schedules')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true);

      if (weeklyError) {
        console.error('Error fetching weekly schedules:', weeklyError);
        throw weeklyError;
      }
      setWeeklySchedules(weeklyData || []);

      // Fetch daily schedules only if we have weekly schedules
      if (weeklyData && weeklyData.length > 0) {
        const weeklyIds = weeklyData.map(ws => ws.id);
        const { data: dailyData, error: dailyError } = await supabase
          .from('daily_schedules')
          .select('*')
          .in('weekly_schedule_id', weeklyIds);

        if (dailyError) {
          console.error('Error fetching daily schedules:', dailyError);
          throw dailyError;
        }
        setDailySchedules(dailyData || []);
      } else {
        // Clear daily schedules if no weekly schedules
        setDailySchedules([]);
      }

      // Fetch extra schedules
      const { data: extraData, error: extraError } = await supabase
        .from('extra_schedules')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_approved', true);

      if (extraError) {
        console.error('Error fetching extra schedules:', extraError);
        throw extraError;
      }
      setExtraSchedules(extraData || []);

      // Fetch shift requests
      const { data: shiftData, error: shiftError } = await supabase
        .from('shift_requests')
        .select('*')
        .eq('salon_id', salonId);

      if (shiftError) {
        console.error('Error fetching shift requests:', shiftError);
        throw shiftError;
      }
      setShiftRequests(shiftData || []);

      // Fetch availability requests
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability_requests')
        .select('*')
        .eq('salon_id', salonId);

      if (availabilityError) {
        console.error('Error fetching availability requests:', availabilityError);
        throw availabilityError;
      }
      setAvailabilityRequests(availabilityData || []);

      // Fetch notifications
      const { data: notificationData, error: notificationError } = await supabase
        .from('schedule_notifications')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (notificationError) {
        console.error('Error fetching notifications:', notificationError);
        throw notificationError;
      }
      setNotifications(notificationData || []);

    } catch (error) {
      console.error('Error fetching working hours data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati degli orari",
        variant: "destructive"
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [salonId, toast]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!salonId) return;

    const setupSubscriptions = async () => {
      const weeklySchedulesSub = supabase
        .channel('weekly_schedules_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'weekly_schedules',
            filter: `salon_id=eq.${salonId}`
          },
          (payload) => {
            console.log('Weekly schedules update:', payload);
            // Debounce the fetch to avoid multiple rapid calls
            setTimeout(() => {
              fetchWorkingHoursData().catch(error => {
                console.error('Error in subscription fetch:', error);
              });
            }, 100);
          }
        )
        .subscribe();

      const dailySchedulesSub = supabase
        .channel('daily_schedules_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_schedules'
          },
          (payload) => {
            console.log('Daily schedules update:', payload);
            // Debounce the fetch to avoid multiple rapid calls
            setTimeout(() => {
              fetchWorkingHoursData().catch(error => {
                console.error('Error in subscription fetch:', error);
              });
            }, 100);
          }
        )
        .subscribe();

      const extraSchedulesSub = supabase
        .channel('extra_schedules_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'extra_schedules',
            filter: `salon_id=eq.${salonId}`
          },
          (payload) => {
            console.log('Extra schedules update:', payload);
            // Debounce the fetch to avoid multiple rapid calls
            setTimeout(() => {
              fetchWorkingHoursData().catch(error => {
                console.error('Error in subscription fetch:', error);
              });
            }, 100);
          }
        )
        .subscribe();

      const shiftRequestsSub = supabase
        .channel('shift_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shift_requests',
            filter: `salon_id=eq.${salonId}`
          },
          (payload) => {
            console.log('Shift requests update:', payload);
            // Debounce the fetch to avoid multiple rapid calls
            setTimeout(() => {
              fetchWorkingHoursData().catch(error => {
                console.error('Error in subscription fetch:', error);
              });
            }, 100);
          }
        )
        .subscribe();

      const availabilityRequestsSub = supabase
        .channel('availability_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'availability_requests',
            filter: `salon_id=eq.${salonId}`
          },
          (payload) => {
            console.log('Availability requests update:', payload);
            // Debounce the fetch to avoid multiple rapid calls
            setTimeout(() => {
              fetchWorkingHoursData().catch(error => {
                console.error('Error in subscription fetch:', error);
              });
            }, 100);
          }
        )
        .subscribe();

      const notificationsSub = supabase
        .channel('schedule_notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'schedule_notifications',
            filter: `salon_id=eq.${salonId}`
          },
          (payload) => {
            console.log('Notifications update:', payload);
            // Debounce the fetch to avoid multiple rapid calls
            setTimeout(() => {
              fetchWorkingHoursData().catch(error => {
                console.error('Error in subscription fetch:', error);
              });
            }, 100);
          }
        )
        .subscribe();

      return () => {
        weeklySchedulesSub.unsubscribe();
        dailySchedulesSub.unsubscribe();
        extraSchedulesSub.unsubscribe();
        shiftRequestsSub.unsubscribe();
        availabilityRequestsSub.unsubscribe();
        notificationsSub.unsubscribe();
      };
    };

    const cleanup = setupSubscriptions();
    return () => {
      cleanup.then(unsubscribe => unsubscribe());
    };
  }, [salonId, fetchWorkingHoursData]);

  // Load data on mount and when salonId changes
  useEffect(() => {
    fetchWorkingHoursData();
  }, [fetchWorkingHoursData]);

  // Get current week schedules
  const getCurrentWeekSchedules = useCallback(() => {
    const weekStartStr = format(currentWeek, 'yyyy-MM-dd');
    const weekEndStr = format(addWeeks(currentWeek, 1), 'yyyy-MM-dd');

    return dailySchedules.filter(schedule => {
      const weeklySchedule = weeklySchedules.find(ws => ws.id === schedule.weekly_schedule_id);
      if (!weeklySchedule) return false;

      // Calcola la data esatta del record giornaliero partendo dal lunedì della settimana
      const baseMonday = startOfWeek(parseISO(weeklySchedule.week_start_date), { weekStartsOn: 1 });
      const offsetDays = schedule.day_of_week === 0 ? 6 : schedule.day_of_week - 1;
      const scheduleDateStr = format(addDays(baseMonday, offsetDays), 'yyyy-MM-dd');

      return scheduleDateStr >= weekStartStr && scheduleDateStr < weekEndStr;
    });
  }, [currentWeek, dailySchedules, weeklySchedules]);

  // Get current week extra schedules
  const getCurrentWeekExtraSchedules = useCallback(() => {
    const weekStart = format(currentWeek, 'yyyy-MM-dd');
    const weekEnd = format(addWeeks(currentWeek, 1), 'yyyy-MM-dd');
    
    return extraSchedules.filter(schedule => 
      schedule.date >= weekStart && schedule.date < weekEnd
    );
  }, [currentWeek, extraSchedules]);

  // Get member's schedule for a specific day
  const getMemberDaySchedule = useCallback((memberId: string, date: Date) => {
    const dayOfWeek = date.getDay();
    
    // Trova il weekly_schedule per il membro e la settimana
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    
    const weeklySchedule = weeklySchedules.find(ws => 
      ws.member_id === memberId && 
      ws.week_start_date === weekStartStr &&
      ws.is_active
    );
    
    if (!weeklySchedule) {
      console.log(`🔍 No weekly schedule found for member ${memberId} on week ${weekStartStr}`);
      return null;
    }
    
    // Trova il daily_schedule per quel giorno
    const dailySchedule = dailySchedules.find(ds => 
      ds.weekly_schedule_id === weeklySchedule.id && 
      ds.day_of_week === dayOfWeek
    );
    
    if (!dailySchedule) {
      console.log(`🔍 No daily schedule found for member ${memberId} on day ${dayOfWeek} (week ${weekStartStr})`);
    }
    
    return dailySchedule;
  }, [weeklySchedules, dailySchedules]);

  // Get member's extra schedule for a specific date
  const getMemberExtraSchedule = useCallback((memberId: string, date: string) => {
    return extraSchedules.find(schedule => 
      schedule.member_id === memberId && schedule.date === date
    );
  }, [extraSchedules]);

  // Upsert a daily schedule for a specific date (used by monthly editor)
  const upsertDailyScheduleForDate = useCallback(async (
    memberId: string,
    date: Date,
    payload: { start_time: string; end_time: string; break_start?: string | null; break_end?: string | null; is_working_day: boolean }
  ) => {
    // Determine week start (Monday) and day_of_week for daily_schedules
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay(); // 0..6 (0 = Sunday)

    // Find or create weekly schedule for member/week
    let weeklySchedule = weeklySchedules.find(ws => ws.member_id === memberId && ws.week_start_date === weekStartStr);
    if (!weeklySchedule) {
      const { data: newWeekly, error: weeklyErr } = await supabase
        .from('weekly_schedules')
        .insert({ member_id: memberId, salon_id: salonId, week_start_date: weekStartStr, is_active: true })
        .select()
        .single();
      if (weeklyErr) throw weeklyErr;
      weeklySchedule = newWeekly as any;
      setWeeklySchedules(prev => [...prev.filter(ws => !(ws.member_id === memberId && ws.week_start_date === weekStartStr)), weeklySchedule!]);
    }

    // Check existing daily schedule record for this day
    const existing = dailySchedules.find(ds => ds.weekly_schedule_id === weeklySchedule!.id && ds.day_of_week === dayOfWeek);

    if (!payload.is_working_day) {
      // Delete daily schedule if exists
      if (existing) {
        const { error: delErr } = await supabase
          .from('daily_schedules')
          .delete()
          .eq('weekly_schedule_id', weeklySchedule!.id)
          .eq('day_of_week', dayOfWeek);
        if (delErr) throw delErr;
        setDailySchedules(prev => prev.filter(ds => !(ds.weekly_schedule_id === weeklySchedule!.id && ds.day_of_week === dayOfWeek)));
      }
      return;
    }

    if (existing) {
      const { data: updated, error: updErr } = await supabase
        .from('daily_schedules')
        .update({
          start_time: payload.start_time,
          end_time: payload.end_time,
          is_working_day: true,
          break_start: payload.break_start || null,
          break_end: payload.break_end || null
        })
        .eq('weekly_schedule_id', weeklySchedule!.id)
        .eq('day_of_week', dayOfWeek)
        .select()
        .single();
      if (updErr) throw updErr;
      const updatedRow = updated as any;
      setDailySchedules(prev => prev.map(ds => (ds.id === existing.id ? updatedRow : ds)));
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('daily_schedules')
        .insert({
          weekly_schedule_id: weeklySchedule!.id,
          day_of_week: dayOfWeek,
          start_time: payload.start_time,
          end_time: payload.end_time,
          is_working_day: true,
          break_start: payload.break_start || null,
          break_end: payload.break_end || null
        })
        .select()
        .single();
      if (insErr) throw insErr;
      setDailySchedules(prev => [...prev, inserted as any]);
    }
  }, [dailySchedules, weeklySchedules, salonId]);

  const handleMonthlyFieldChange = useCallback((dateStr: string, field: 'start_time' | 'end_time' | 'break_start' | 'break_end' | 'is_working_day', value: string | boolean) => {
    setMonthlyEdits(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value as any
      }
    }));
  }, []);

  const handleMonthlySave = useCallback(async (memberId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = getMemberDaySchedule(memberId, date);
    const edit = monthlyEdits[dateStr] || {};
    const isWorking = edit.is_working_day ?? existing?.is_working_day ?? !!(existing?.start_time && existing?.end_time);
    const startTime = edit.start_time ?? existing?.start_time ?? '';
    const endTime = edit.end_time ?? existing?.end_time ?? '';
    const breakStart = (edit.break_start ?? existing?.break_start) || null;
    const breakEnd = (edit.break_end ?? existing?.break_end) || null;

    if (isWorking) {
      if (!startTime || !endTime) {
        toast({ title: 'Errore', description: 'Inserisci inizio e fine turno', variant: 'destructive' });
        return;
      }
      if (!(startTime < endTime)) {
        toast({ title: 'Errore', description: "L'orario di fine deve essere successivo all'inizio", variant: 'destructive' });
        return;
      }
      if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
        toast({ title: 'Errore', description: 'Compila entrambi gli orari di pausa o lascia vuoto', variant: 'destructive' });
        return;
      }
      if (breakStart && breakEnd && !(startTime < breakStart && breakStart < breakEnd && breakEnd < endTime)) {
        toast({ title: 'Errore', description: 'La pausa deve essere compresa tra inizio e fine turno', variant: 'destructive' });
        return;
      }
    }

    try {
      await upsertDailyScheduleForDate(memberId, date, {
        start_time: startTime,
        end_time: endTime,
        break_start: breakStart,
        break_end: breakEnd,
        is_working_day: !!isWorking
      });
      toast({ title: 'Salvato', description: `Orario del ${format(date, 'dd/MM', { locale: it })} aggiornato` });
    } catch (e) {
      console.error('Monthly save error', e);
      toast({ title: 'Errore', description: 'Impossibile salvare l\'orario', variant: 'destructive' });
    }
  }, [monthlyEdits, getMemberDaySchedule, upsertDailyScheduleForDate, toast]);

  const handleMonthlyClear = useCallback(async (memberId: string, date: Date) => {
    try {
      await upsertDailyScheduleForDate(memberId, date, {
        start_time: '00:00',
        end_time: '00:00',
        break_start: null,
        break_end: null,
        is_working_day: false
      });
      const dateStr = format(date, 'yyyy-MM-dd');
      setMonthlyEdits(prev => ({ ...prev, [dateStr]: {} }));
      toast({ title: 'Rimosso', description: `Turno del ${format(date, 'dd/MM', { locale: it })} rimosso` });
    } catch (e) {
      console.error('Monthly clear error', e);
      toast({ title: 'Errore', description: 'Impossibile rimuovere il turno', variant: 'destructive' });
    }
  }, [upsertDailyScheduleForDate, toast]);

  // Handle weekly schedule creation/update
  const handleWeeklyScheduleSubmit = async () => {
    try {
      setIsSubmittingWeeklySchedule(true);
      setError(null);

      // Validate form
      if (!weeklyScheduleForm.member_id) {
        throw new Error('Seleziona un dipendente');
      }

      if (!weeklyScheduleForm.week_start_date) {
        throw new Error('Data inizio settimana richiesta');
      }

      // Normalizza la data di inizio settimana al lunedì
      const normalizedWeekStart = format(
        startOfWeek(parseISO(weeklyScheduleForm.week_start_date), { weekStartsOn: 1 }),
        'yyyy-MM-dd'
      );

      // Validate that at least one day is selected
      const workingDays = Object.entries(weeklyScheduleForm.schedules)
        .filter(([_, schedule]) => schedule.is_working_day);
      
      if (workingDays.length === 0) {
        throw new Error('Seleziona almeno un giorno di lavoro');
      }

      // Validate time fields for working days
      for (const [dayOfWeek, schedule] of workingDays) {
        if (!schedule.start_time || !schedule.end_time) {
          const dayName = DAYS_OF_WEEK.find(d => d.id === parseInt(dayOfWeek))?.name || 'giorno';
          throw new Error(`Inserisci orario di inizio e fine per ${dayName}`);
        }
        
        if (schedule.start_time >= schedule.end_time) {
          const dayName = DAYS_OF_WEEK.find(d => d.id === parseInt(dayOfWeek))?.name || 'giorno';
          throw new Error(`L'orario di fine deve essere successivo all'orario di inizio per ${dayName}`);
        }

        // Validate break times if present
        if ((schedule.break_start && !schedule.break_end) || (!schedule.break_start && schedule.break_end)) {
          const dayName = DAYS_OF_WEEK.find(d => d.id === parseInt(dayOfWeek))?.name || 'giorno';
          throw new Error(`Compila inizio e fine pausa per ${dayName} o lascia entrambi i campi vuoti`);
        }

        if (schedule.break_start && schedule.break_end) {
          const dayName = DAYS_OF_WEEK.find(d => d.id === parseInt(dayOfWeek))?.name || 'giorno';
          if (!(schedule.start_time < schedule.break_start && schedule.break_start < schedule.break_end && schedule.break_end < schedule.end_time)) {
            throw new Error(`La pausa deve essere compresa tra l'orario di inizio e fine per ${dayName}`);
          }
        }
      }

      // Check if schedule already exists for this member and week
      const existingSchedule = weeklySchedules.find(ws => 
        ws.member_id === weeklyScheduleForm.member_id && 
        ws.week_start_date === normalizedWeekStart
      );

      let weeklyScheduleId: string;
      let newWeeklySchedule: any = null;

      if (existingSchedule) {
        // Update existing schedule
        const { data: updatedSchedule, error: updateError } = await supabase
          .from('weekly_schedules')
          .update({ is_active: true })
          .eq('id', existingSchedule.id)
          .select()
          .single();

        if (updateError) throw updateError;
        weeklyScheduleId = updatedSchedule.id;
        newWeeklySchedule = updatedSchedule;

        // Delete existing daily schedules
        await supabase
          .from('daily_schedules')
          .delete()
          .eq('weekly_schedule_id', weeklyScheduleId);
      } else {
        // Create new weekly schedule
        const { data: newSchedule, error: createError } = await supabase
          .from('weekly_schedules')
          .insert({
            member_id: weeklyScheduleForm.member_id,
            salon_id: salonId,
            week_start_date: normalizedWeekStart,
            is_active: true
          })
          .select()
          .single();

        if (createError) throw createError;
        weeklyScheduleId = newSchedule.id;
        newWeeklySchedule = newSchedule;
      }

      // Insert daily schedules
      const dailySchedulesToInsert = Object.entries(weeklyScheduleForm.schedules)
        .filter(([_, schedule]) => schedule.is_working_day)
        .map(([dayOfWeek, schedule]) => ({
          weekly_schedule_id: weeklyScheduleId,
          day_of_week: parseInt(dayOfWeek),
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_working_day: true, // Always set to true for working days
          break_start: schedule.break_start || null,
          break_end: schedule.break_end || null,
          notes: schedule.notes || null
        }));

      let newDailySchedules: any[] = [];
      if (dailySchedulesToInsert.length > 0) {
        const { data: insertedDailySchedules, error: dailyError } = await supabase
          .from('daily_schedules')
          .insert(dailySchedulesToInsert)
          .select();

        if (dailyError) throw dailyError;
        newDailySchedules = insertedDailySchedules || [];
      }

      // Update local state immediately to avoid subscription conflicts
      if (newWeeklySchedule) {
        setWeeklySchedules(prev => {
          const filtered = prev.filter(ws => 
            !(ws.member_id === newWeeklySchedule.member_id && ws.week_start_date === newWeeklySchedule.week_start_date)
          );
          return [...filtered, newWeeklySchedule];
        });
      }

      if (newDailySchedules.length > 0) {
        setDailySchedules(prev => {
          const filtered = prev.filter(ds => ds.weekly_schedule_id !== weeklyScheduleId);
          return [...filtered, ...newDailySchedules];
        });
      }

      // Create notification
      const member = members.find(m => m.id === weeklyScheduleForm.member_id);
      if (member) {
        await supabase
          .from('schedule_notifications')
          .insert({
            member_id: weeklyScheduleForm.member_id,
            salon_id: salonId,
            type: 'schedule_change',
            title: 'Orario Settimanale Aggiornato',
            message: `L'orario settimanale per ${member.name} è stato aggiornato`,
            is_read: false
          });
      }

      toast({
        title: "Successo",
        description: "Orario settimanale salvato con successo",
      });
      setIsWeeklyScheduleDialogOpen(false);
      
      // Reset form completely
      setWeeklyScheduleForm({
        member_id: '',
        week_start_date: format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        schedules: {}
      });
      
      // Reset bulk operations
      setBulkDays([]);
      setShowBulkOptions(false);
      setSelectedPreset('');

    } catch (error) {
      console.error('Error saving weekly schedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage || "Impossibile salvare l'orario settimanale",
        variant: "destructive"
      });
      
      // Don't close dialog on error, let user fix and retry
    } finally {
      setIsSubmittingWeeklySchedule(false);
    }
  };

  // Handle extra schedule creation
  const handleExtraScheduleSubmit = async () => {
    try {
      setIsSubmittingExtraSchedule(true);
      setError(null);

      // Validate form
      if (!extraScheduleForm.member_id) {
        throw new Error('Seleziona un dipendente');
      }

      if (!extraScheduleForm.date || !extraScheduleForm.start_time || !extraScheduleForm.end_time) {
        throw new Error('Compila tutti i campi obbligatori');
      }

      if (!(extraScheduleForm.start_time < extraScheduleForm.end_time)) {
        throw new Error("L'orario di fine deve essere successivo all'orario di inizio");
      }

      // Check for schedule overlap
      const hasOverlap = await supabase.rpc('check_schedule_overlap', {
        member_uuid: extraScheduleForm.member_id,
        check_date: extraScheduleForm.date,
        check_start: extraScheduleForm.start_time,
        check_end: extraScheduleForm.end_time
      });

      if (hasOverlap.data) {
        throw new Error('Orario in conflitto con un orario esistente');
      }

      // Insert extra schedule
      const { data: newSchedule, error: createError } = await supabase
        .from('extra_schedules')
        .insert({
          member_id: extraScheduleForm.member_id,
          salon_id: salonId,
          date: extraScheduleForm.date,
          start_time: extraScheduleForm.start_time,
          end_time: extraScheduleForm.end_time,
          type: extraScheduleForm.type,
          reason: extraScheduleForm.reason || null,
          is_approved: isManager // Auto-approve if manager
        })
        .select()
        .single();

      if (createError) throw createError;

      // Create notification
      const member = members.find(m => m.id === extraScheduleForm.member_id);
      if (member) {
        await supabase
          .from('schedule_notifications')
          .insert({
            member_id: extraScheduleForm.member_id,
            salon_id: salonId,
            type: 'schedule_change',
            title: 'Orario Straordinario Creato',
            message: `Nuovo orario straordinario per ${member.name} il ${format(parseISO(extraScheduleForm.date), 'dd/MM/yyyy')}`,
            is_read: false
          });
      }

      toast({
        title: "Successo",
        description: "Orario straordinario creato con successo",
      });
      setIsExtraScheduleDialogOpen(false);
      
      // Reset form
      setExtraScheduleForm({
        member_id: '',
        date: '',
        start_time: '',
        end_time: '',
        type: 'extra',
        reason: ''
      });

    } catch (error) {
      console.error('Error creating extra schedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage || "Impossibile creare l'orario straordinario",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingExtraSchedule(false);
    }
  };

  // Handle shift request
  const handleShiftRequestSubmit = async () => {
    try {
      setIsSubmittingShiftRequest(true);
      setError(null);

      // Validate form
      if (!shiftRequestForm.requested_date || !shiftRequestForm.reason) {
        throw new Error('Compila tutti i campi obbligatori');
      }

      if (!shiftRequestForm.current_start_time || !shiftRequestForm.current_end_time || !shiftRequestForm.requested_start_time || !shiftRequestForm.requested_end_time) {
        throw new Error('Inserisci tutti gli orari richiesti');
      }

      if (!(shiftRequestForm.current_start_time < shiftRequestForm.current_end_time)) {
        throw new Error("L'orario attuale di fine deve essere successivo all'orario attuale di inizio");
      }

      if (!(shiftRequestForm.requested_start_time < shiftRequestForm.requested_end_time)) {
        throw new Error("L'orario richiesto di fine deve essere successivo all'orario richiesto di inizio");
      }

      // Get current member
      const currentMember = members.find(m => m.user_id === currentUser.id);
      if (!currentMember) {
        throw new Error('Membro non trovato');
      }

      // Insert shift request
      const { data: newRequest, error: createError } = await supabase
        .from('shift_requests')
        .insert({
          member_id: currentMember.id,
          salon_id: salonId,
          requested_date: shiftRequestForm.requested_date,
          current_start_time: shiftRequestForm.current_start_time,
          current_end_time: shiftRequestForm.current_end_time,
          requested_start_time: shiftRequestForm.requested_start_time,
          requested_end_time: shiftRequestForm.requested_end_time,
          reason: shiftRequestForm.reason,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Create notification for manager
      await supabase
        .from('schedule_notifications')
        .insert({
          member_id: currentMember.id,
          salon_id: salonId,
          type: 'shift_request',
          title: 'Nuova Richiesta Cambio Turno',
          message: `Richiesta cambio turno per ${currentMember.name} il ${format(parseISO(shiftRequestForm.requested_date), 'dd/MM/yyyy')}`,
          is_read: false,
          related_id: newRequest.id
        });

      toast({
        title: "Successo",
        description: "Richiesta cambio turno inviata con successo",
      });
      setIsShiftRequestDialogOpen(false);
      
      // Reset form
      setShiftRequestForm({
        requested_date: '',
        current_start_time: '',
        current_end_time: '',
        requested_start_time: '',
        requested_end_time: '',
        reason: ''
      });

    } catch (error) {
      console.error('Error submitting shift request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage || "Impossibile inviare la richiesta",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingShiftRequest(false);
    }
  };

  // Handle availability request
  const handleAvailabilityRequestSubmit = async () => {
    try {
      setIsSubmittingAvailabilityRequest(true);
      setError(null);

      // Validate form
      if (!availabilityRequestForm.date || !availabilityRequestForm.start_time || !availabilityRequestForm.end_time) {
        throw new Error('Compila tutti i campi obbligatori');
      }

      if (!(availabilityRequestForm.start_time < availabilityRequestForm.end_time)) {
        throw new Error("L'orario di fine deve essere successivo all'orario di inizio");
      }

      // Get current member
      const currentMember = members.find(m => m.user_id === currentUser.id);
      if (!currentMember) {
        throw new Error('Membro non trovato');
      }

      // Insert availability request
      const { data: newRequest, error: createError } = await supabase
        .from('availability_requests')
        .insert({
          member_id: currentMember.id,
          salon_id: salonId,
          date: availabilityRequestForm.date,
          start_time: availabilityRequestForm.start_time,
          end_time: availabilityRequestForm.end_time,
          type: availabilityRequestForm.type,
          reason: availabilityRequestForm.reason || null,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Create notification for manager
      await supabase
        .from('schedule_notifications')
        .insert({
          member_id: currentMember.id,
          salon_id: salonId,
          type: 'availability_request',
          title: 'Nuova Richiesta Disponibilità',
          message: `Richiesta disponibilità per ${currentMember.name} il ${format(parseISO(availabilityRequestForm.date), 'dd/MM/yyyy')}`,
          is_read: false,
          related_id: newRequest.id
        });

      toast({
        title: "Successo",
        description: "Richiesta disponibilità inviata con successo",
      });
      setIsAvailabilityRequestDialogOpen(false);
      
      // Reset form
      setAvailabilityRequestForm({
        date: '',
        start_time: '',
        end_time: '',
        type: 'available',
        reason: ''
      });

    } catch (error) {
      console.error('Error submitting availability request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage || "Impossibile inviare la richiesta",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingAvailabilityRequest(false);
    }
  };

  // Handle request approval/rejection
  const handleRequestAction = async (requestId: string, type: 'shift' | 'availability', action: 'approve' | 'reject') => {
    try {
      const table = type === 'shift' ? 'shift_requests' : 'availability_requests';
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      const { data: updatedRequest, error: updateError } = await supabase
        .from(table)
        .update({
          status,
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          ...(action === 'reject' && { rejection_reason: 'Rifiutato dal manager' })
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create notification
      const member = members.find(m => m.id === updatedRequest.member_id);
      if (member) {
        await supabase
          .from('schedule_notifications')
          .insert({
            member_id: updatedRequest.member_id,
            salon_id: salonId,
            type: 'approval',
            title: `Richiesta ${action === 'approve' ? 'Approvata' : 'Rifiutata'}`,
            message: `La tua richiesta ${type === 'shift' ? 'cambio turno' : 'disponibilità'} è stata ${action === 'approve' ? 'approvata' : 'rifiutata'}`,
            is_read: false,
            related_id: requestId
          });
      }

      toast({
        title: "Successo",
        description: `Richiesta ${action === 'approve' ? 'approvata' : 'rifiutata'} con successo`,
      });

    } catch (error) {
      console.error('Error handling request action:', error);
      toast({
        title: "Errore",
        description: "Impossibile processare la richiesta",
        variant: "destructive"
      });
    }
  };

  // Duplicate week schedule
  const handleDuplicateWeek = async () => {
    try {
      const nextWeek = addWeeks(currentWeek, 1);
      const nextWeekStart = format(nextWeek, 'yyyy-MM-dd');
      
      // Get current week schedules
      const currentWeekSchedules = weeklySchedules.filter(ws => 
        ws.week_start_date === format(currentWeek, 'yyyy-MM-dd')
      );

      if (currentWeekSchedules.length === 0) {
        toast({
          title: "Nessun orario da duplicare",
          description: "Non ci sono orari settimanali per la settimana corrente",
          variant: "destructive"
        });
        return;
      }

      for (const weeklySchedule of currentWeekSchedules) {
        // Check if schedule already exists for next week
        const existingNextWeekSchedule = weeklySchedules.find(ws => 
          ws.member_id === weeklySchedule.member_id && 
          ws.week_start_date === nextWeekStart
        );

        let weeklyScheduleId: string;

        if (existingNextWeekSchedule) {
          // Update existing schedule
          const { data: updatedSchedule, error: updateError } = await supabase
            .from('weekly_schedules')
            .update({ is_active: true })
            .eq('id', existingNextWeekSchedule.id)
            .select()
            .single();

          if (updateError) throw updateError;
          weeklyScheduleId = updatedSchedule.id;

          // Delete existing daily schedules
          await supabase
            .from('daily_schedules')
            .delete()
            .eq('weekly_schedule_id', weeklyScheduleId);
        } else {
          // Create new weekly schedule
          const { data: newSchedule, error: createError } = await supabase
            .from('weekly_schedules')
            .insert({
              member_id: weeklySchedule.member_id,
              salon_id: salonId,
              week_start_date: nextWeekStart,
              is_active: true
            })
            .select()
            .single();

          if (createError) throw createError;
          weeklyScheduleId = newSchedule.id;
        }

        // Get daily schedules for current week
        const currentDailySchedules = dailySchedules.filter(ds => 
          ds.weekly_schedule_id === weeklySchedule.id
        );

        // Duplicate daily schedules
        if (currentDailySchedules.length > 0) {
          const newDailySchedules = currentDailySchedules.map(ds => ({
            weekly_schedule_id: weeklyScheduleId,
            day_of_week: ds.day_of_week,
            start_time: ds.start_time,
            end_time: ds.end_time,
            break_start: ds.break_start,
            break_end: ds.break_end,
            notes: ds.notes
          }));

          const { error: dailyError } = await supabase
            .from('daily_schedules')
            .insert(newDailySchedules);

          if (dailyError) throw dailyError;
        }
      }

      // Refresh data after duplication
      await fetchWorkingHoursData();

      toast({
        title: "Successo",
        description: "Settimana duplicata con successo",
      });

    } catch (error) {
      console.error('Error duplicating week:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      toast({
        title: "Errore",
        description: `Impossibile duplicare la settimana: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  // Toggle schedule lock


  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('schedule_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Add new functions for enhanced time entry
  const applyPreset = (preset: typeof TIME_PRESETS[0]) => {
    const updatedSchedules = { ...weeklyScheduleForm.schedules };
    
    DAYS_OF_WEEK.forEach(day => {
      if (updatedSchedules[day.id]?.is_working_day) {
        updatedSchedules[day.id] = {
          ...updatedSchedules[day.id],
          start_time: preset.start,
          end_time: preset.end,
          break_start: preset.break_start,
          break_end: preset.break_end
        };
      }
    });
    
    setWeeklyScheduleForm(prev => ({
      ...prev,
      schedules: updatedSchedules
    }));
    
    toast({
      title: "Preset applicato",
      description: `Orario ${preset.label} applicato ai giorni selezionati`,
    });
  };

  const copyFromPreviousDay = (currentDayId: number) => {
    const previousDayId = currentDayId === 0 ? 6 : currentDayId - 1;
    const previousSchedule = weeklyScheduleForm.schedules[previousDayId];
    
    if (previousSchedule) {
      setWeeklyScheduleForm(prev => ({
        ...prev,
        schedules: {
          ...prev.schedules,
          [currentDayId]: {
            ...prev.schedules[currentDayId],
            is_working_day: previousSchedule.is_working_day,
            start_time: previousSchedule.start_time,
            end_time: previousSchedule.end_time,
            break_start: previousSchedule.break_start,
            break_end: previousSchedule.break_end
          }
        }
      }));
      
      toast({
        title: "Copiato",
        description: `Orario copiato da ${DAYS_OF_WEEK.find(d => d.id === previousDayId)?.name}`,
      });
    }
  };

  const applyToMultipleDays = (dayIds: number[], schedule: any) => {
    const updatedSchedules = { ...weeklyScheduleForm.schedules };
    
    dayIds.forEach(dayId => {
      updatedSchedules[dayId] = {
        ...updatedSchedules[dayId],
        ...schedule
      };
    });
    
    setWeeklyScheduleForm(prev => ({
      ...prev,
      schedules: updatedSchedules
    }));
    
    toast({
      title: "Applicato",
      description: `Orario applicato a ${dayIds.length} giorni`,
    });
  };

  const toggleBulkDay = (dayId: number) => {
    setBulkDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const applyBulkPreset = (preset: typeof TIME_PRESETS[0]) => {
    if (bulkDays.length === 0) {
      toast({
        title: "Nessun giorno selezionato",
        description: "Seleziona i giorni a cui applicare il preset",
        variant: "destructive",
      });
      return;
    }
    
    const schedule = {
      is_working_day: true,
      start_time: preset.start,
      end_time: preset.end,
      break_start: preset.break_start,
      break_end: preset.break_end
    };
    
    applyToMultipleDays(bulkDays, schedule);
    setBulkDays([]);
    setShowBulkOptions(false);
  };

  const enableAllWeekdays = () => {
    const updatedSchedules = { ...weeklyScheduleForm.schedules };
    
    DAYS_OF_WEEK.forEach(day => {
      if (day.id !== 0) { // Skip Sunday
        updatedSchedules[day.id] = {
          ...updatedSchedules[day.id],
          is_working_day: true
        };
      }
    });
    
    setWeeklyScheduleForm(prev => ({
      ...prev,
      schedules: updatedSchedules
    }));
    
    toast({
      title: "Giorni abilitati",
      description: "Tutti i giorni feriali sono ora abilitati",
    });
  };

  const enableAllDays = () => {
    const updatedSchedules = { ...weeklyScheduleForm.schedules };
    
    DAYS_OF_WEEK.forEach(day => {
      updatedSchedules[day.id] = {
        ...updatedSchedules[day.id],
        is_working_day: true
      };
    });
    
    setWeeklyScheduleForm(prev => ({
      ...prev,
      schedules: updatedSchedules
    }));
    
    toast({
      title: "Giorni abilitati",
      description: "Tutti i giorni inclusa la domenica sono ora abilitati",
    });
  };

  const disableAllDays = () => {
    const updatedSchedules = { ...weeklyScheduleForm.schedules };
    
    DAYS_OF_WEEK.forEach(day => {
      updatedSchedules[day.id] = {
        ...updatedSchedules[day.id],
        is_working_day: false
      };
    });
    
    setWeeklyScheduleForm(prev => ({
      ...prev,
      schedules: updatedSchedules
    }));
    
    toast({
      title: "Giorni disabilitati",
      description: "Tutti i giorni sono ora disabilitati",
    });
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Caricamento orari di lavoro...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Errore nel caricamento dei dati: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (members.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nessun membro del team trovato. Verifica che ci siano dipendenti attivi nel sistema.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controlli principali */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{t('ore.title', 'Gestione Orari di Lavoro')}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Notifiche */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {filteredNotifications.filter(n => !n.is_read).length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {filteredNotifications.filter(n => !n.is_read).length}
              </Badge>
            )}
          </Button>
          

          
          {/* Nuovo orario (solo manager) */}
          {isManager && (
            <Button onClick={() => {
              setError(null); // Reset error when opening dialog
              // Initialize form with current week if not already set
              if (!weeklyScheduleForm.week_start_date) {
                setWeeklyScheduleForm(prev => ({
                  ...prev,
                  week_start_date: format(currentWeek, 'yyyy-MM-dd')
                }));
              }
              setIsWeeklyScheduleDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('ore.actions.new_schedule', 'Nuovo Orario')}
            </Button>
          )}
          
          {/* Richieste dipendente */}
          {!isManager && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('ore.actions.requests', 'Richieste')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsShiftRequestDialogOpen(true)}>
                  <Clock className="h-4 w-4 mr-2" />
                  {t('ore.actions.shift_change', 'Cambio Turno')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAvailabilityRequestDialogOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('ore.actions.extra_availability', 'Disponibilità Extra')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stats Cards per Orari di Lavoro */}
      <StatsCardsOrari 
        workHours={filteredWorkHours}
        members={members}
        weeklySchedules={filteredWeeklySchedules}
        extraSchedules={filteredExtraSchedules}
        shiftRequests={filteredShiftRequests}
        availabilityRequests={filteredAvailabilityRequests}
      />

      {/* Switch vista Settimanale/Mensile */}
      <div className="mt-2 mb-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'weekly' | 'monthly')}>
          <TabsList>
            <TabsTrigger value="weekly">{t('ore.tabs.weekly', 'Settimanale')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('ore.tabs.monthly', 'Mensile')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Vista Mensile */}
      {viewMode === 'monthly' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[220px] text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: it })}
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {isManager && (
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Seleziona dipendente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i dipendenti</SelectItem>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
              const memberInFocus = isManager ? (selectedMember === 'all' ? null : members.find(m => m.id === selectedMember) || null) : currentMember;
              if (!memberInFocus) {
                return (
                                  <Alert>
                  <AlertDescription>{t('ore.monthly.select_employee', 'Seleziona un dipendente per modificare gli orari mensili.')}</AlertDescription>
                </Alert>
                );
              }
              return (
                <div className="table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">{t('ore.table.day', 'Giorno')}</TableHead>
                        <TableHead>{t('ore.table.start', 'Inizio')}</TableHead>
                        <TableHead>{t('ore.table.end', 'Fine')}</TableHead>
                        <TableHead>{t('ore.table.break_start', 'Pausa Inizio')}</TableHead>
                        <TableHead>{t('ore.table.break_end', 'Pausa Fine')}</TableHead>
                        <TableHead className="w-[170px]">{t('ore.table.actions', 'Azioni')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {days.map(d => {
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const existing = getMemberDaySchedule(memberInFocus.id, d);
                        const isWorking = monthlyEdits[dateStr]?.is_working_day ?? existing?.is_working_day ?? !!(existing?.start_time && existing?.end_time);
                        const startVal = monthlyEdits[dateStr]?.start_time ?? existing?.start_time ?? '';
                        const endVal = monthlyEdits[dateStr]?.end_time ?? existing?.end_time ?? '';
                        const breakStartVal = monthlyEdits[dateStr]?.break_start ?? (existing?.break_start || '');
                        const breakEndVal = monthlyEdits[dateStr]?.break_end ?? (existing?.break_end || '');
                        return (
                          <TableRow key={dateStr} className={isToday(d) ? 'bg-muted/40' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{format(d, 'dd', { locale: it })}</span>
                                <span className="text-xs text-muted-foreground">{format(d, 'EEE', { locale: it })}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input type="time" value={startVal} onChange={e => handleMonthlyFieldChange(dateStr, 'start_time', e.target.value)} disabled={!isWorking} />
                            </TableCell>
                            <TableCell>
                              <Input type="time" value={endVal} onChange={e => handleMonthlyFieldChange(dateStr, 'end_time', e.target.value)} disabled={!isWorking} />
                            </TableCell>
                            <TableCell>
                              <Input type="time" value={breakStartVal} onChange={e => handleMonthlyFieldChange(dateStr, 'break_start', e.target.value)} disabled={!isWorking} />
                            </TableCell>
                            <TableCell>
                              <Input type="time" value={breakEndVal} onChange={e => handleMonthlyFieldChange(dateStr, 'break_end', e.target.value)} disabled={!isWorking} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch checked={!!isWorking} onCheckedChange={(val) => handleMonthlyFieldChange(dateStr, 'is_working_day', val)} />
                                <Button size="sm" variant="default" onClick={() => handleMonthlySave(memberInFocus.id, d)}>{t('ore.actions.save', 'Salva')}</Button>
                                <Button size="sm" variant="ghost" onClick={() => handleMonthlyClear(memberInFocus.id, d)}>{t('ore.actions.clear', 'Pulisci')}</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Filtri e controlli */}
      {viewMode === 'weekly' && (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">{t('ore.weekly.title', 'Orari Settimanali')}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[200px] text-center">
                  {format(currentWeek, 'dd MMM yyyy', { locale: it })} - {format(addWeeks(currentWeek, 1), 'dd MMM yyyy', { locale: it })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isManager && (
                <>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('ore.filters.all_employees', 'Tutti i dipendenti')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('ore.filters.all_employees', 'Tutti i dipendenti')}</SelectItem>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={handleDuplicateWeek}>
                    <Copy className="h-4 w-4 mr-2" />
                    {t('ore.actions.duplicate_week', 'Duplica Settimana')}
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => setIsExtraScheduleDialogOpen(true)}>
                    <Zap className="h-4 w-4 mr-2" />
                    {t('ore.actions.extra_schedule', 'Orario Straordinario')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabella orari settimanali */}
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">{t('ore.table.employee', 'Dipendente')}</TableHead>
                  {DAYS_OF_WEEK.map(day => {
                    // Calcola la data corretta per ogni giorno della settimana
                    const dayDate = new Date(currentWeek);
                    dayDate.setDate(currentWeek.getDate() + day.id - 1); // -1 perché lunedì è 1, ma vogliamo partire da 0
                    if (day.id === 0) { // Domenica
                      dayDate.setDate(currentWeek.getDate() + 6);
                    }
                    
                    return (
                      <TableHead key={day.id} className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{day.short}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(dayDate, 'dd/MM', { locale: it })}
                          </span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isManager ? members : currentMember ? [currentMember] : []).map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    {DAYS_OF_WEEK.map(day => {
                      // Calcola la data corretta per ogni giorno della settimana
                      const dayDate = new Date(currentWeek);
                      dayDate.setDate(currentWeek.getDate() + day.id - 1); // -1 perché lunedì è 1, ma vogliamo partire da 0
                      if (day.id === 0) { // Domenica
                        dayDate.setDate(currentWeek.getDate() + 6);
                      }
                      
                      const daySchedule = getMemberDaySchedule(member.id, dayDate);
                      const extraSchedule = getMemberExtraSchedule(member.id, format(dayDate, 'yyyy-MM-dd'));
                      const dayPermissions = getPermissionsForDate(dayDate);
                      
                      // Debug per il primo membro
                      if (member.id === members[0]?.id) {
                        console.log(`🔍 Day ${day.name} (${day.id}):`, {
                          dayDate: format(dayDate, 'yyyy-MM-dd'),
                          dayOfWeek: dayDate.getDay(),
                          hasSchedule: !!daySchedule,
                          schedule: daySchedule ? {
                            start_time: daySchedule.start_time,
                            end_time: daySchedule.end_time
                          } : null,
                          permissions: dayPermissions.length
                        });
                      }
                      
                      return (
                        <TableCell key={day.id} className="text-center">
                          {daySchedule ? (
                            <div className="space-y-1">
                              {/* Orario normale */}
                              <div className="text-sm font-medium">
                                {daySchedule.start_time} - {daySchedule.end_time}
                              </div>
                              {daySchedule.break_start && daySchedule.break_end && (
                                                              <div className="text-xs text-muted-foreground">
                                {t('ore.schedule.break', 'Pausa')}: {daySchedule.break_start} - {daySchedule.break_end}
                              </div>
                              )}
                              
                              {/* Orario straordinario (se presente) */}
                              {extraSchedule && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="text-sm font-medium text-blue-600">
                                    {extraSchedule.start_time} - {extraSchedule.end_time}
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {extraSchedule.type === 'extra' ? t('ore.schedule.extra', 'Orario Extra') : 
                                     extraSchedule.type === 'overtime' ? t('ore.schedule.overtime', 'Straordinario') :
                                     extraSchedule.type === 'holiday' ? t('ore.schedule.holiday', 'Festivo') : t('ore.schedule.closing', 'Chiusura')}
                                  </Badge>
                                  {extraSchedule.reason && (
                                    <div className="text-xs text-muted-foreground">
                                      {extraSchedule.reason}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Permessi approvati (se presenti) */}
                              {dayPermissions.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  {dayPermissions.map(permission => (
                                    <div key={permission.id} className="mb-1 p-1 rounded bg-yellow-50 border border-yellow-200">
                                      <div className="text-xs font-medium text-yellow-800 text-center">
                                        {permission.type === 'ferie' ? '🏖️ Ferie' :
                                         permission.type === 'permesso' ? '📋 Permesso' :
                                         permission.type === 'malattia' ? '🏥 Malattia' : '📝 Altro'}
                                      </div>
                                      {permission.start_time && permission.end_time && (
                                        <div className="text-xs text-center text-yellow-600">
                                          {permission.start_time} - {permission.end_time}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : extraSchedule ? (
                            // Solo orario straordinario (senza orario normale)
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-blue-600">
                                {extraSchedule.start_time} - {extraSchedule.end_time}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {extraSchedule.type === 'extra' ? 'Orario Extra' : 
                                 extraSchedule.type === 'overtime' ? 'Straordinario' :
                                 extraSchedule.type === 'holiday' ? 'Festivo' : 'Chiusura'}
                              </Badge>
                              {extraSchedule.reason && (
                                <div className="text-xs text-muted-foreground">
                                  {extraSchedule.reason}
                                </div>
                              )}
                              
                              {/* Permessi approvati (se presenti) */}
                              {dayPermissions.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  {dayPermissions.map(permission => (
                                    <div key={permission.id} className="mb-1 p-1 rounded bg-yellow-50 border border-yellow-200">
                                      <div className="text-xs font-medium text-yellow-800 text-center">
                                        {permission.type === 'ferie' ? '🏖️ Ferie' :
                                         permission.type === 'permesso' ? '📋 Permesso' :
                                         permission.type === 'malattia' ? '🏥 Malattia' : '📝 Altro'}
                                      </div>
                                      {permission.start_time && permission.end_time ? (
                                        <div className="text-xs text-center text-yellow-600">
                                          {permission.start_time} - {permission.end_time}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-center text-yellow-600 font-medium">
                                          ⏰ Tutto il giorno
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : dayPermissions.length > 0 ? (
                            // Mostra permessi approvati
                            <div className="space-y-1">
                              {dayPermissions.map(permission => (
                                <div key={permission.id} className="p-2 rounded-lg border-2 border-dashed">
                                  <div className="text-sm font-medium text-center">
                                    {permission.type === 'ferie' ? '🏖️ Ferie' :
                                     permission.type === 'permesso' ? '📋 Permesso' :
                                     permission.type === 'malattia' ? '🏥 Malattia' : '📝 Altro'}
                                  </div>
                                  {permission.start_time && permission.end_time ? (
                                    <div className="text-xs text-center text-muted-foreground mt-1">
                                      {permission.start_time} - {permission.end_time}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-center text-muted-foreground mt-1 font-medium">
                                      ⏰ Tutto il giorno
                                    </div>
                                  )}
                                  <div className="text-xs text-center text-muted-foreground mt-1">
                                    {permission.reason}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {t('ore.schedule.not_working', 'Non lavora')}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Permessi Approvati */}
      {filteredPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              {t('ore.approved_permissions.title', 'Permessi Approvati')}
              <Badge variant="secondary" className="ml-2">
                {filteredPermissions.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              {t('ore.approved_permissions.description', 'Permessi approvati che influenzano gli orari di lavoro')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPermissions.map(permission => {
                const member = members.find(m => m.id === permission.member_id);
                const startDate = new Date(permission.start_date);
                const endDate = new Date(permission.end_date);
                const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        permission.type === 'ferie' ? 'bg-blue-100 text-blue-600' :
                        permission.type === 'permesso' ? 'bg-purple-100 text-purple-600' :
                        permission.type === 'malattia' ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {permission.type === 'ferie' ? '🏖️' :
                         permission.type === 'permesso' ? '📋' :
                         permission.type === 'malattia' ? '🏥' : '📝'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member?.name || 'Dipendente non trovato'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(startDate, 'dd/MM/yyyy', { locale: it })} - {format(endDate, 'dd/MM/yyyy', { locale: it })} ({daysCount} {t('ore.permission.days', 'giorni')})
                        </div>
                        {permission.start_time && permission.end_time ? (
                          <div className="text-xs text-muted-foreground">
                            {t('ore.permission.time', 'Orario')}: {permission.start_time} - {permission.end_time}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground font-medium">
                            ⏰ {t('ore.permission.all_day', 'Tutto il giorno')}
                          </div>
                        )}
                        <div className="text-sm mt-1">{permission.reason}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        permission.type === 'ferie' ? 'border-blue-200 text-blue-700' :
                        permission.type === 'permesso' ? 'border-purple-200 text-purple-700' :
                        permission.type === 'malattia' ? 'border-orange-200 text-orange-700' :
                        'border-gray-200 text-gray-700'
                      }>
                        {permission.type === 'ferie' ? t('ore.permission.type.holiday', 'Ferie') :
                         permission.type === 'permesso' ? t('ore.permission.type.permission', 'Permesso') :
                         permission.type === 'malattia' ? t('ore.permission.type.sick_leave', 'Malattia') : t('ore.permission.type.other', 'Altro')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(permission.created_at || ''), 'dd/MM/yyyy', { locale: it })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifiche */}
      {showNotifications && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('ore.notifications.title', 'Notifiche Orari')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notification => (
                  <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'schedule_change' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'shift_request' ? 'bg-yellow-100 text-yellow-600' :
                        notification.type === 'availability_request' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {notification.type === 'schedule_change' ? <Clock className="h-4 w-4" /> :
                         notification.type === 'shift_request' ? <Calendar className="h-4 w-4" /> :
                         notification.type === 'availability_request' ? <User className="h-4 w-4" /> :
                         <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground">{notification.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <Badge variant="secondary">Nuovo</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(notification.created_at), 'dd/MM HH:mm', { locale: it })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('ore.notifications.empty', 'Nessuna notifica')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Richieste in sospeso (solo manager) */}
      {isManager && (shiftRequests.filter(r => r.status === 'pending').length > 0 || 
                    availabilityRequests.filter(r => r.status === 'pending').length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              {t('ore.pending_requests.title', 'Richieste in Sospeso')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="shift" className="w-full">
              <TabsList>
                <TabsTrigger value="shift">
                  {t('ore.pending_requests.shift_changes', 'Cambi Turno')} ({shiftRequests.filter(r => r.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="availability">
                  {t('ore.pending_requests.availability', 'Disponibilità')} ({availabilityRequests.filter(r => r.status === 'pending').length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="shift" className="space-y-3">
                {shiftRequests.filter(r => r.status === 'pending').map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {members.find(m => m.id === request.member_id)?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.requested_date} • {request.current_start_time}-{request.current_end_time} → {request.requested_start_time}-{request.requested_end_time}
                      </div>
                      <div className="text-sm">{request.reason}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRequestAction(request.id, 'shift', 'approve')}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t('ore.actions.approve', 'Approva')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRequestAction(request.id, 'shift', 'reject')}>
                        <XCircle className="h-4 w-4 mr-1" />
                        {t('ore.actions.reject', 'Rifiuta')}
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="availability" className="space-y-3">
                {availabilityRequests.filter(r => r.status === 'pending').map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {members.find(m => m.id === request.member_id)?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.date} • {request.start_time}-{request.end_time} • {request.type === 'available' ? t('ore.availability.available', 'Disponibile') : t('ore.availability.unavailable', 'Non disponibile')}
                      </div>
                      {request.reason && <div className="text-sm">{request.reason}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRequestAction(request.id, 'availability', 'approve')}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approva
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRequestAction(request.id, 'availability', 'reject')}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rifiuta
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Dialog per orario settimanale - ENHANCED VERSION */}
      <Dialog open={isWeeklyScheduleDialogOpen} onOpenChange={setIsWeeklyScheduleDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('ore.dialogs.weekly_schedule.title', 'Imposta Orario Settimanale')}</DialogTitle>
            <DialogDescription>
              {t('ore.dialogs.weekly_schedule.description', 'Configura l\'orario di lavoro settimanale per il dipendente selezionato')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="member">{t('ore.form.employee', 'Dipendente')}</Label>
                <Select value={weeklyScheduleForm.member_id} onValueChange={(value) => 
                  setWeeklyScheduleForm(prev => ({ ...prev, member_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder={t('ore.form.select_employee', 'Seleziona dipendente')} />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="week_start">{t('ore.form.week_start', 'Inizio Settimana')}</Label>
                <Input
                  type="date"
                  value={weeklyScheduleForm.week_start_date}
                  onChange={(e) => setWeeklyScheduleForm(prev => ({ 
                    ...prev, 
                    week_start_date: e.target.value 
                  }))}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{t('ore.quick_actions.title', 'Azioni Rapide')}</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enableAllWeekdays}
                  >
                    {t('ore.quick_actions.enable_weekdays', 'Abilita Feriali')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enableAllDays}
                  >
                    {t('ore.quick_actions.enable_all', 'Abilita Tutti')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disableAllDays}
                  >
                    {t('ore.quick_actions.disable_all', 'Disabilita Tutti')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkOptions(!showBulkOptions)}
                  >
                    {showBulkOptions ? t('ore.quick_actions.hide', 'Nascondi') : t('ore.quick_actions.show', 'Mostra')} {t('ore.quick_actions.bulk_options', 'Opzioni Bulk')}
                  </Button>
                </div>
              </div>
              
              {/* Presets */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {TIME_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="text-xs h-auto py-2 px-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{preset.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.start}-{preset.end}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
              
              {/* Bulk Operations */}
              {showBulkOptions && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h5 className="font-medium mb-3">{t('ore.bulk_operations.title', 'Operazioni di Massa')}</h5>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <Button
                          key={day.id}
                          variant={bulkDays.includes(day.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleBulkDay(day.id)}
                          className="text-xs"
                        >
                          {t(`ore.days.${day.short.toLowerCase()}`, day.short)}
                        </Button>
                      ))}
                    </div>
                    {bulkDays.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {TIME_PRESETS.slice(0, 4).map((preset) => (
                          <Button
                            key={preset.label}
                            variant="secondary"
                            size="sm"
                            onClick={() => applyBulkPreset(preset)}
                            className="text-xs"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Daily Schedule Grid */}
            <div className="space-y-4">
              <h4 className="font-medium">{t('ore.daily_schedule.title', 'Orari per Giorno')}</h4>
              <div className="grid gap-4">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div key={day.id} className="grid grid-cols-1 lg:grid-cols-9 gap-4 items-center p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="font-medium min-w-[80px]">{t(`ore.days.${day.name.toLowerCase()}`, day.name)}</div>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyFromPreviousDay(day.id)}
                          className="h-6 w-6 p-0"
                          title={t('ore.actions.copy_from', 'Copia da') + ' ' + t(`ore.days.${DAYS_OF_WEEK[index - 1].name.toLowerCase()}`, DAYS_OF_WEEK[index - 1].name)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={weeklyScheduleForm.schedules[day.id]?.is_working_day || false}
                        onCheckedChange={(checked) => setWeeklyScheduleForm(prev => ({
                          ...prev,
                          schedules: {
                            ...prev.schedules,
                            [day.id]: {
                              ...prev.schedules[day.id],
                              is_working_day: checked
                            }
                          }
                        }))}
                      />
                      <Label className="text-sm">{t('ore.schedule.works', 'Lavora')}</Label>
                    </div>
                    
                    <div>
                      <Label className="text-sm">{t('ore.schedule.start', 'Inizio')}</Label>
                      <Input
                        type="time"
                        value={weeklyScheduleForm.schedules[day.id]?.start_time || ''}
                        onChange={(e) => setWeeklyScheduleForm(prev => ({
                          ...prev,
                          schedules: {
                            ...prev.schedules,
                            [day.id]: {
                              ...prev.schedules[day.id],
                              start_time: e.target.value
                            }
                          }
                        }))}
                        disabled={!weeklyScheduleForm.schedules[day.id]?.is_working_day}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm">{t('ore.schedule.end', 'Fine')}</Label>
                      <Input
                        type="time"
                        value={weeklyScheduleForm.schedules[day.id]?.end_time || ''}
                        onChange={(e) => setWeeklyScheduleForm(prev => ({
                          ...prev,
                          schedules: {
                            ...prev.schedules,
                            [day.id]: {
                              ...prev.schedules[day.id],
                              end_time: e.target.value
                            }
                          }
                        }))}
                        disabled={!weeklyScheduleForm.schedules[day.id]?.is_working_day}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm">{t('ore.schedule.break_start', 'Pausa Inizio')}</Label>
                      <Input
                        type="time"
                        value={weeklyScheduleForm.schedules[day.id]?.break_start || ''}
                        onChange={(e) => setWeeklyScheduleForm(prev => ({
                          ...prev,
                          schedules: {
                            ...prev.schedules,
                            [day.id]: {
                              ...prev.schedules[day.id],
                              break_start: e.target.value
                            }
                          }
                        }))}
                        disabled={!weeklyScheduleForm.schedules[day.id]?.is_working_day}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm">{t('ore.schedule.break_end', 'Pausa Fine')}</Label>
                      <Input
                        type="time"
                        value={weeklyScheduleForm.schedules[day.id]?.break_end || ''}
                        onChange={(e) => setWeeklyScheduleForm(prev => ({
                          ...prev,
                          schedules: {
                            ...prev.schedules,
                            [day.id]: {
                              ...prev.schedules[day.id],
                              break_end: e.target.value
                            }
                          }
                        }))}
                        disabled={!weeklyScheduleForm.schedules[day.id]?.is_working_day}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm">{t('ore.schedule.notes', 'Note')}</Label>
                      <Input
                        type="text"
                        value={weeklyScheduleForm.schedules[day.id]?.notes || ''}
                        onChange={(e) => setWeeklyScheduleForm(prev => ({
                          ...prev,
                          schedules: {
                            ...prev.schedules,
                            [day.id]: {
                              ...prev.schedules[day.id],
                              notes: e.target.value
                            }
                          }
                        }))}
                        disabled={!weeklyScheduleForm.schedules[day.id]?.is_working_day}
                        className="text-sm"
                        placeholder={t('ore.schedule.notes_placeholder', 'Note opzionali...')}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBulkDay(day.id)}
                        className={bulkDays.includes(day.id) ? "bg-blue-100" : ""}
                      >
                        {bulkDays.includes(day.id) ? t('ore.actions.selected', 'Selezionato') : t('ore.actions.select', 'Seleziona')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWeeklyScheduleDialogOpen(false)}>
              {t('ore.actions.cancel', 'Annulla')}
            </Button>
            <Button onClick={handleWeeklyScheduleSubmit} disabled={isSubmittingWeeklySchedule}>
              {isSubmittingWeeklySchedule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('ore.actions.save_schedule', 'Salva Orario')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per orario straordinario - ENHANCED */}
      <Dialog open={isExtraScheduleDialogOpen} onOpenChange={setIsExtraScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('ore.dialogs.extra_schedule.title', 'Orario Straordinario')}</DialogTitle>
            <DialogDescription>
              {t('ore.dialogs.extra_schedule.description', 'Crea un orario speciale per un giorno specifico')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="member">Dipendente</Label>
              <Select value={extraScheduleForm.member_id} onValueChange={(value) => 
                setExtraScheduleForm(prev => ({ ...prev, member_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder={t('ore.form.select_employee', 'Seleziona dipendente')} />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date">{t('ore.form.date', 'Data')}</Label>
              <Input
                type="date"
                value={extraScheduleForm.date}
                onChange={(e) => setExtraScheduleForm(prev => ({ 
                  ...prev, 
                  date: e.target.value 
                }))}
              />
            </div>
            
            {/* Quick Time Presets */}
            <div className="space-y-3">
              <Label>{t('ore.form.quick_times', 'Orari Rapidi')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TIME_PRESETS.slice(0, 4).map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setExtraScheduleForm(prev => ({
                      ...prev,
                      start_time: preset.start,
                      end_time: preset.end
                    }))}
                    className="text-xs h-auto py-2 px-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{preset.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.start}-{preset.end}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Inizio</Label>
                <Input
                  type="time"
                  value={extraScheduleForm.start_time}
                  onChange={(e) => setExtraScheduleForm(prev => ({ 
                    ...prev, 
                    start_time: e.target.value 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_time">Fine</Label>
                <Input
                  type="time"
                  value={extraScheduleForm.end_time}
                  onChange={(e) => setExtraScheduleForm(prev => ({ 
                    ...prev, 
                    end_time: e.target.value 
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={extraScheduleForm.type} onValueChange={(value: any) => 
                setExtraScheduleForm(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="extra">Orario Extra</SelectItem>
                  <SelectItem value="overtime">Straordinario</SelectItem>
                  <SelectItem value="holiday">Festivo</SelectItem>
                  <SelectItem value="closing">Chiusura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                value={extraScheduleForm.reason}
                onChange={(e) => setExtraScheduleForm(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                placeholder="Spiega il motivo dell'orario straordinario..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtraScheduleDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleExtraScheduleSubmit} disabled={isSubmittingExtraSchedule}>
              {isSubmittingExtraSchedule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crea Orario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per richiesta cambio turno - ENHANCED */}
      <Dialog open={isShiftRequestDialogOpen} onOpenChange={setIsShiftRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Richiesta Cambio Turno</DialogTitle>
            <DialogDescription>
              Richiedi un cambio di orario per un giorno specifico
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="requested_date">Data</Label>
              <Input
                type="date"
                value={shiftRequestForm.requested_date}
                onChange={(e) => setShiftRequestForm(prev => ({ 
                  ...prev, 
                  requested_date: e.target.value 
                }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_start">Orario Attuale - Inizio</Label>
                <Input
                  type="time"
                  value={shiftRequestForm.current_start_time}
                  onChange={(e) => setShiftRequestForm(prev => ({ 
                    ...prev, 
                    current_start_time: e.target.value 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="current_end">Orario Attuale - Fine</Label>
                <Input
                  type="time"
                  value={shiftRequestForm.current_end_time}
                  onChange={(e) => setShiftRequestForm(prev => ({ 
                    ...prev, 
                    current_end_time: e.target.value 
                  }))}
                />
              </div>
            </div>
            
            {/* Quick Time Presets for Requested Time */}
            <div className="space-y-3">
              <Label>Orari Richiesti Rapidi</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TIME_PRESETS.slice(0, 4).map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setShiftRequestForm(prev => ({
                      ...prev,
                      requested_start_time: preset.start,
                      requested_end_time: preset.end
                    }))}
                    className="text-xs h-auto py-2 px-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{preset.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.start}-{preset.end}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requested_start">Orario Richiesto - Inizio</Label>
                <Input
                  type="time"
                  value={shiftRequestForm.requested_start_time}
                  onChange={(e) => setShiftRequestForm(prev => ({ 
                    ...prev, 
                    requested_start_time: e.target.value 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="requested_end">Orario Richiesto - Fine</Label>
                <Input
                  type="time"
                  value={shiftRequestForm.requested_end_time}
                  onChange={(e) => setShiftRequestForm(prev => ({ 
                    ...prev, 
                    requested_end_time: e.target.value 
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                value={shiftRequestForm.reason}
                onChange={(e) => setShiftRequestForm(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                placeholder="Spiega il motivo della richiesta..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShiftRequestDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleShiftRequestSubmit} disabled={isSubmittingShiftRequest}>
              {isSubmittingShiftRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Invia Richiesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per richiesta disponibilità - ENHANCED */}
      <Dialog open={isAvailabilityRequestDialogOpen} onOpenChange={setIsAvailabilityRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Richiesta Disponibilità</DialogTitle>
            <DialogDescription>
              Comunica la tua disponibilità per un giorno specifico
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                type="date"
                value={availabilityRequestForm.date}
                onChange={(e) => setAvailabilityRequestForm(prev => ({ 
                  ...prev, 
                  date: e.target.value 
                }))}
              />
            </div>
            
            {/* Quick Time Presets */}
            <div className="space-y-3">
              <Label>Orari Rapidi</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TIME_PRESETS.slice(0, 4).map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setAvailabilityRequestForm(prev => ({
                      ...prev,
                      start_time: preset.start,
                      end_time: preset.end
                    }))}
                    className="text-xs h-auto py-2 px-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{preset.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.start}-{preset.end}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Inizio</Label>
                <Input
                  type="time"
                  value={availabilityRequestForm.start_time}
                  onChange={(e) => setAvailabilityRequestForm(prev => ({ 
                    ...prev, 
                    start_time: e.target.value 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_time">Fine</Label>
                <Input
                  type="time"
                  value={availabilityRequestForm.end_time}
                  onChange={(e) => setAvailabilityRequestForm(prev => ({ 
                    ...prev, 
                    end_time: e.target.value 
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={availabilityRequestForm.type} onValueChange={(value: any) => 
                setAvailabilityRequestForm(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponibile</SelectItem>
                  <SelectItem value="unavailable">Non Disponibile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reason">Motivo (opzionale)</Label>
              <Textarea
                value={availabilityRequestForm.reason}
                onChange={(e) => setAvailabilityRequestForm(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                placeholder="Spiega il motivo..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvailabilityRequestDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleAvailabilityRequestSubmit} disabled={isSubmittingAvailabilityRequest}>
              {isSubmittingAvailabilityRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Invia Richiesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
