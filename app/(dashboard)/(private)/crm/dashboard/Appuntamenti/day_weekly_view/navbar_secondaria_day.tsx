'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { APPOINTMENT_STATUSES } from "@/components/status";
import { format, addDays, subDays, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  View, 
  Calendar, 
  Filter,
  TrashCan,
  UserMultiple,
  Checkmark,
  Time,
  CheckmarkOutline,
  WarningAlt,
  Warning,
  Error,
  Information,
  CurrencyDollar,
  Receipt,
  ShoppingBag,
  Document,
  Send,
  ErrorOutline,
  Subtract,
  Add
} from "@carbon/icons-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from '@/utils/getSalonId';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "@/components/ui/calendar";
import { useLocalization } from "@/hooks/useLocalization";

const supabase = createClient();

interface Member {
  id: string;
  name: string;
  ColorMember?: string;
  avatar_url?: string;
  order_column?: number;
  email?: string;
  phone_number?: string;
}

interface Group {
  id: string;
  name: string;
}

interface NavbarSecondariaProps {
  dailyViewDate: Date;
  setDailyViewDate: (date: Date) => void;
  filteredMembers: Member[];
  startMemberIndex: number;
  hasMoreLeft: boolean;
  hasMoreRight: boolean;
  slidePrev: () => void;
  slideNext: () => void;
  showMemberDropdown: boolean;
  setShowMemberDropdown: (show: boolean) => void;
  groups: Group[];
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  handleGroupChange: (groupId: string | null) => void;
  groupFilteredMembers: Member[];
  selectedTeamMemberIds: string[];
  handleToggleMember: (memberId: string) => void;

  hourHeight: number;
  onHourHeightChange: (height: number) => void;
  teamMembers: Member[]; // Aggiungi questa prop per passare tutti i membri
  appointments: Array<{
    id: string;
    nome: string;
    orarioInizio: string;
    orarioFine: string;
    data: string;
    team_id: string;
    status: string;
  }>; // Add appointments prop
  selectedStatusFilters: (string | null)[];
  setSelectedStatusFilters: (statuses: (string | null)[]) => void;
  showDeletedAppointments: boolean;
  setShowDeletedAppointments: (show: boolean) => void;
  daysToShow: number;
  setDaysToShow: (days: number) => void;
  setSelectedTeamMemberIds: (ids: string[]) => void;
}

const NavbarSecondaria: React.FC<NavbarSecondariaProps> = ({
  dailyViewDate,
  setDailyViewDate,
  filteredMembers,
  startMemberIndex,
  hasMoreLeft,
  hasMoreRight,
  slidePrev,
  slideNext,
  showMemberDropdown,
  setShowMemberDropdown,
  groups,
  selectedGroupId,
  setSelectedGroupId,
  handleGroupChange,
  groupFilteredMembers,
  selectedTeamMemberIds,
  handleToggleMember,

  hourHeight,
  onHourHeightChange,
  teamMembers, // Usa teamMembers passato come prop
  appointments, // Add appointments
  selectedStatusFilters,
  setSelectedStatusFilters,
  showDeletedAppointments,
  setShowDeletedAppointments,
  daysToShow,
  setDaysToShow,
  setSelectedTeamMemberIds,
}) => {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocalization();

  // Cache per evitare fetch ripetuti
  const salonIdCacheRef = useRef<string | null>(null);
  const customStatusesCacheRef = useRef<{ value: string, label: string, color: string }[]>([]);

  // Stati disponibili per gli appuntamenti importati da StatoCard
  const appointmentStatuses = APPOINTMENT_STATUSES;

  // Stati custom utente (con cache)
  const [customStatuses, setCustomStatuses] = useState<{ value: string, label: string, color: string }[]>([]);
  
  // OTTIMIZZAZIONE: Fetch custom statuses solo se necessario e con cache
  useEffect(() => {
    let isMounted = true;
    
    async function fetchCustomStatuses() {
      // Usa cache se disponibile
      if (customStatusesCacheRef.current.length > 0) {
        setCustomStatuses(customStatusesCacheRef.current);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.id || !isMounted) return;
        
        const { data, error } = await supabase
          .from("settings")
          .select("key, value")
          .eq("user_id", userData.user.id)
          .eq("type", "appointment_status")
          .eq("enabled", true)
          .order("created_at", { ascending: true });
          
        if (!error && data && isMounted) {
          const statuses = data.map((s: { key: string, value: string }) => ({
            value: s.key,
            label: s.key.charAt(0).toUpperCase() + s.key.slice(1),
            color: '#8b5cf6',
          }));
          
          // Aggiorna cache
          customStatusesCacheRef.current = statuses;
          setCustomStatuses(statuses);
        }
      } catch (e) {
        // fail silent
      }
    }
    
    fetchCustomStatuses();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // OTTIMIZZAZIONE: Unisci stati solo quando cambiano i dati
  const allStatuses = useMemo(() => {
    const systemValues = appointmentStatuses.map(s => s.value);
    const filteredCustom = customStatuses.filter(s => !systemValues.includes(s.value));
    return [...appointmentStatuses, ...filteredCustom];
  }, [appointmentStatuses, customStatuses]);

  // OTTIMIZZAZIONE: Memoizza la funzione per evitare re-render
  const handleStatusFilterToggle = useCallback((status: string | null) => {
    if (status === 'deleted') {
      setShowDeletedAppointments(!showDeletedAppointments);
      return;
    }
    
    const updatedFilters = selectedStatusFilters.includes(status)
      ? selectedStatusFilters.filter(s => s !== status)
      : [...selectedStatusFilters, status];
    
    setSelectedStatusFilters(updatedFilters);
    
    // Debounced localStorage save
    setTimeout(() => {
      try {
        localStorage.setItem('statusFilters', JSON.stringify(updatedFilters));
      } catch (error) {
        // fail silent in production
      }
    }, 100);
  }, [selectedStatusFilters, setSelectedStatusFilters, showDeletedAppointments, setShowDeletedAppointments]);

  // OTTIMIZZAZIONE: Calcola appuntamenti del mese con cache migliorata
  const allMonthAppointments = useMemo(() => {
    if (!appointments.length) return [];
    
    const startMonth = format(startOfMonth(dailyViewDate), "yyyy-MM-dd");
    const endMonth = format(endOfMonth(dailyViewDate), "yyyy-MM-dd");
    
    return appointments.filter(app => app.data >= startMonth && app.data <= endMonth);
  }, [appointments, dailyViewDate]);

  // OTTIMIZZAZIONE: Calcola appuntamenti del giorno più efficiente
  const allTodayAppointments = useMemo(() => {
    if (!appointments.length) return [];
    
    const todayStr = format(dailyViewDate, "yyyy-MM-dd");
    return appointments.filter(app => app.data === todayStr);
  }, [appointments, dailyViewDate]);

  // OTTIMIZZAZIONE: Appuntamenti visibili con filtro ottimizzato
  const todayAppointments = useMemo(() => {
    return showDeletedAppointments
      ? allTodayAppointments
      : allTodayAppointments.filter(app => app.status !== 'Eliminato');
  }, [allTodayAppointments, showDeletedAppointments]);

  // OTTIMIZZAZIONE: Calcola contatori stati più efficiente
  const statusCounts = useMemo(() => {
    const counts: Record<string | 'null' | 'empty', number> = {};
    
    if (!allMonthAppointments.length) return counts;
    
    for (const app of allMonthAppointments) {
      let status = app.status || 'empty';
      if (status === 'Eliminato') status = 'deleted';
      counts[status] = (counts[status] || 0) + 1;
    }
    
    return counts;
  }, [allMonthAppointments]);

  // OTTIMIZZAZIONE: Debounced localStorage operations
  const localStorageTimeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedLocalStorageSave = useCallback((key: string, value: any) => {
    if (localStorageTimeoutRef.current) {
      clearTimeout(localStorageTimeoutRef.current);
    }
    
    localStorageTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // fail silent in production
      }
    }, 200);
  }, []);

  // OTTIMIZZAZIONE: Combina localStorage saves
  useEffect(() => {
    debouncedLocalStorageSave('statusFilters', selectedStatusFilters);
  }, [selectedStatusFilters, debouncedLocalStorageSave]);

  useEffect(() => {
    debouncedLocalStorageSave('showDeletedAppointments', showDeletedAppointments);
  }, [showDeletedAppointments, debouncedLocalStorageSave]);

  // OTTIMIZZAZIONE: Carica stato da localStorage solo al mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('statusFilters');
      const savedDeleted = localStorage.getItem('showDeletedAppointments');
      
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        if (Array.isArray(parsedFilters)) {
          setSelectedStatusFilters(parsedFilters);
        }
      }
      
      if (savedDeleted) {
        const parsedDeleted = JSON.parse(savedDeleted);
        if (typeof parsedDeleted === 'boolean') {
          setShowDeletedAppointments(parsedDeleted);
        }
      }
    } catch (error) {
      // fail silent
    }
  }, []); // Solo al mount

  // OTTIMIZZAZIONE: Fetch salon ID con cache e controllo mounted
  useEffect(() => {
    let isMounted = true;
    
    async function fetchSalonId() {
      // Usa cache se disponibile
      if (salonIdCacheRef.current) {
        setSalonId(salonIdCacheRef.current);
        return;
      }

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const user = userData?.user;

        if (userError || !user || !isMounted) return;

        // Get salon_id using utility function (works for both managers and collaborators)
        const salonId = await getSalonId();

        if (!isMounted) return;

        if (salonId) {
          salonIdCacheRef.current = salonId;
          setSalonId(salonId);
          return;
        }
      } catch (error) {
        // fail silent in production
      }
    }
    
    fetchSalonId();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const MIN_HEIGHT = 175;
  const MAX_HEIGHT = 800;
  
  // OTTIMIZZAZIONE: Memoizza i handler per evitare re-render
  const handleIncrement = useCallback(() => {
    onHourHeightChange(Math.min(hourHeight + 20, MAX_HEIGHT));
  }, [hourHeight, onHourHeightChange]);

  const handleDecrement = useCallback(() => {
    onHourHeightChange(Math.max(hourHeight - 20, MIN_HEIGHT));
  }, [hourHeight, onHourHeightChange]);

  // OTTIMIZZAZIONE: Event listener per zoom con throttling
  const zoomTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const handleZoomWithWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      // Throttle zoom updates
      if (zoomTimeoutRef.current) return;
      
      zoomTimeoutRef.current = setTimeout(() => {
        const delta = event.deltaY < 0 ? 20 : -20;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, hourHeight + delta));
        onHourHeightChange(newHeight);
        zoomTimeoutRef.current = undefined;
      }, 50);
    };

    window.addEventListener('wheel', handleZoomWithWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleZoomWithWheel);
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, [hourHeight, onHourHeightChange]);



  // OTTIMIZZAZIONE: Click outside handler con throttling
  useEffect(() => {
    if (!showMemberDropdown) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.visible-users-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    };

    // Delay per evitare conflitti con il click che apre il dropdown
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMemberDropdown, setShowMemberDropdown]);

  // OTTIMIZZAZIONE: Cleanup refs
  useEffect(() => {
    return () => {
      if (localStorageTimeoutRef.current) {
        clearTimeout(localStorageTimeoutRef.current);
      }
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  // Funzione per mappare gli stati agli iconi Carbon
  const getStatusIcon = useCallback((statusValue: string) => {
    switch (statusValue) {
      case 'Prenotato':
        return <Time className="h-4 w-4" />;
      case 'Confermato':
        return <CheckmarkOutline className="h-4 w-4" />;
      case 'In attesa':
        return <WarningAlt className="h-4 w-4" />;
      case 'Arrivato':
        return <Information className="h-4 w-4" />;
      case 'In corso':
        return <Time className="h-4 w-4" />;
      case 'Completato':
        return <Checkmark className="h-4 w-4" />;
      case 'Annullato':
        return <Error className="h-4 w-4" />;
      case 'Assente':
        return <Warning className="h-4 w-4" />;
      case 'Riprogrammato':
        return <Calendar className="h-4 w-4" />;
      case 'Non pagato':
        return <CurrencyDollar className="h-4 w-4" />;
      case 'Pagato in contanti':
        return <CurrencyDollar className="h-4 w-4" />;
      case 'paid_card':
        return <ShoppingBag className="h-4 w-4" />;
      case 'paid_online':
        return <ShoppingBag className="h-4 w-4" />;
      case 'Fatturato':
        return <Receipt className="h-4 w-4" />;
      case 'Fattura da emettere':
        return <Document className="h-4 w-4" />;
      case 'Fattura inviata':
        return <Send className="h-4 w-4" />;
      case 'Errore fattura':
        return <ErrorOutline className="h-4 w-4" />;
      case 'Eliminato':
        return <TrashCan className="h-4 w-4" />;
      default:
        return <Information className="h-4 w-4" />;
    }
  }, []);

  // OTTIMIZZAZIONE: Rimuovi console.log in produzione
  // DEBUG LOGS commentati per performance
  // console.log('DEBUG navbar_secondaria:');
  // console.log('selectedTeamMemberIds:', selectedTeamMemberIds);
  // console.log('teamMembers recuperati:', teamMembers.length);
  // console.log('teamMembers IDs:', teamMembers.map(m => m.id));

  // Verifica sovrapposizione tra membri selezionati e membri recuperati (solo in dev)
  // const membersInBoth = selectedTeamMemberIds.filter(id => 
  //   teamMembers.some(m => m.id === id)
  // );
  // console.log('Membri presenti sia in selectedTeamMemberIds che in teamMembers:', membersInBoth.length);

  return (
    <div
      className="px-4 py-3 bg-white dark:bg-gray-900 h-16 border-b border-gray-200 dark:border-gray-700 flex-none"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} // Aggiunto justifyContent per spostare gli elementi
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {/* Mobile Navbar Component */}
          <div className="hidden md:flex items-center rounded-lg p-1 gap-1 h-9">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setDailyViewDate(subDays(dailyViewDate, 1))}
                className="p-2 rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              <span className="text-xs">{t('navbar_day.previous_day')}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Popover>
          <PopoverTrigger asChild>
            <button className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200">
              <h2 className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap cursor-pointer">
                {format(dailyViewDate, 'dd MMMM yyyy')}
              </h2>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarIcon
              mode="single"
              selected={dailyViewDate}
              onSelect={(date) => {
                if (date) {
                  setDailyViewDate(date);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setDailyViewDate(addDays(dailyViewDate, 1))}
                className="p-2 rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              <span className="text-xs">{t('navbar_day.next_day')}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Desktop only: zoom, impostazioni, data/ora corrente, pin */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1 h-9">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleDecrement}
                    className="flex items-center justify-center p-2 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <Subtract className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <span className="text-xs">{t('navbar_day.decrease_zoom')}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleIncrement}
                    className="flex items-center justify-center p-2 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <Add className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <span className="text-xs">{t('navbar_day.increase_zoom')}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Dropdown selezione membri desktop */}
          <div className="hidden md:block relative">
            <div 
              className="flex items-center gap-2 cursor-pointer px-3 py-2 h-9 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            >
              <View className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </div>
            {showMemberDropdown && (
              <div className="absolute right-0 mt-2 w-[370px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 max-h-96 overflow-y-auto visible-users-dropdown">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex justify-between items-center">
                  <span>{t('navbar_day.team_members')}</span>
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{t('navbar_day.loading')}</span>
                    ) : null}
                  </div>
                </div>
                
                {groups.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('navbar_day.filter_by_group')}</label>
                    <select
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200"
                      value={selectedGroupId || ""}
                      onChange={e => {
                        handleGroupChange(e.target.value || null);
                      }}
                    >
                      <option value="" className="text-gray-500 dark:text-gray-400">{t('navbar_day.all_members')}</option>
                      {groups.map(group => (
                        <option 
                          key={group.id} 
                          value={group.id} 
                          className="text-gray-700 dark:text-gray-200"
                        >
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 rounded bg-blue-600 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 rounded bg-blue-600 animate-bounce"></div>
                    </div>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-sm text-red-600 dark:text-red-400 px-3 py-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="font-medium">{t('navbar_day.no_members_available')}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('navbar_day.verify_members_salon')}<br />
                      {t('navbar_day.refresh_page')}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {teamMembers.map(member => (
                      <label
                        key={member.id}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer ${
                          selectedTeamMemberIds.includes(member.id) ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : 'border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeamMemberIds.includes(member.id)}
                          onChange={() => handleToggleMember(member.id)}
                          className="accent-blue-600 h-4 w-4"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url} alt={member.name} />
                            <AvatarFallback style={{ backgroundColor: member.ColorMember || '#888888' }}>
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {member.name}
                            </div>
                            {member.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {member.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                    onClick={() => setShowMemberDropdown(false)}
                    type="button"
                  >
                    {t('navbar_day.close')}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDailyViewDate(new Date())}
                    className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <span className="text-xs">{t('navbar_day.current_date_time')}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>


            
            {/* Filter Status Button - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center justify-center p-2 h-9 w-9 transition-all duration-200 ${
                    selectedStatusFilters.length > 0 
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {selectedStatusFilters.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded"></div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto z-50">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t('navbar_day.filter_by_status')}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('navbar_day.select_statuses_to_show')}</p>
                </div>
                
                {/* Stati di Prenotazione */}
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('navbar_day.booking')}</span>
                  </div>
                  <div className="space-y-1">
                    {allStatuses.filter(status => 
                      ['Prenotato', 'Confermato', 'In attesa', 'Arrivato', 'In corso', 'Completato', 'Annullato', 'Assente', 'Riprogrammato'].includes(status.value)
                    ).map((status) => (
                      <DropdownMenuItem
                        key={status.value || 'empty'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusFilterToggle(status.value);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${
                          selectedStatusFilters.includes(status.value)
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 dark:bg-gray-600">
                          {getStatusIcon(status.value)}
                        </div>
                        <span className="flex-1 text-sm font-medium">{status.label}</span>
                        <Badge className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {statusCounts[status.value ?? 'empty'] || 0}
                        </Badge>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>

                {/* Stati di Pagamento */}
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <CurrencyDollar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('navbar_day.payment')}</span>
                  </div>
                  <div className="space-y-1">
                    {allStatuses.filter(status => 
                      ['Non pagato', 'Pagato in contanti', 'paid_card', 'paid_online'].includes(status.value)
                    ).map((status) => (
                      <DropdownMenuItem
                        key={status.value || 'empty'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusFilterToggle(status.value);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${
                          selectedStatusFilters.includes(status.value)
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 dark:bg-gray-600">
                          {getStatusIcon(status.value)}
                        </div>
                        <span className="flex-1 text-sm font-medium">{status.label}</span>
                        <Badge className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {statusCounts[status.value ?? 'empty'] || 0}
                        </Badge>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>

                {/* Stati di Fatturazione */}
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('navbar_day.billing')}</span>
                  </div>
                  <div className="space-y-1">
                    {allStatuses.filter(status => 
                      ['Fatturato', 'Fattura da emettere', 'Fattura inviata', 'Errore fattura'].includes(status.value)
                    ).map((status) => (
                      <DropdownMenuItem
                        key={status.value || 'empty'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusFilterToggle(status.value);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${
                          selectedStatusFilters.includes(status.value)
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 dark:bg-gray-600">
                          {getStatusIcon(status.value)}
                        </div>
                        <span className="flex-1 text-sm font-medium">{status.label}</span>
                        <Badge className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {statusCounts[status.value ?? 'empty'] || 0}
                        </Badge>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>

                {/* Stato Eliminato */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrashCan className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('navbar_day.management')}</span>
                  </div>
                  <div className="space-y-1">
                    {allStatuses.filter(status => 
                      ['Eliminato'].includes(status.value)
                    ).map((status) => (
                      <DropdownMenuItem
                        key={status.value || 'empty'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusFilterToggle(status.value);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${
                          selectedStatusFilters.includes(status.value)
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 dark:bg-gray-600">
                          {getStatusIcon(status.value)}
                        </div>
                        <span className="flex-1 text-sm font-medium">{status.label}</span>
                        <Badge className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {statusCounts[status.value ?? 'empty'] || 0}
                        </Badge>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedStatusFilters([]);
                    setShowDeletedAppointments(false);
                  }}
                  className="text-sm text-gray-500 dark:text-gray-400 p-3 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-b-lg transition-colors"
                >
                  <span className="flex items-center gap-2 w-full justify-center">
                    <Subtract className="h-3 w-3" /> 
                    {t('navbar_day.remove_all_filters')}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Separatore */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
     
 
        {/* Trash button: visibile sempre */}
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeletedAppointments(!showDeletedAppointments)}
                    className={`flex items-center justify-center p-2 h-9 w-9 transition-all duration-200 ${
                      showDeletedAppointments 
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <TrashCan className="h-4 w-4" />
                  </Button>
                  {showDeletedAppointments && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded"></div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <span className="text-xs">
                  {showDeletedAppointments ? t('navbar_day.hide_deleted_appointments') : t('navbar_day.show_deleted_appointments')}
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default NavbarSecondaria;
