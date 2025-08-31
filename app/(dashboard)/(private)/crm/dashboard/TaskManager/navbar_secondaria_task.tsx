'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { APPOINTMENT_STATUSES } from "@/components/status";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { 
  View,
  Filter,
  TrashCan,
  Checkmark,
  ChevronDown,
  Time,
  Information
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const supabase = createClient();



interface NavbarSecondariaProps {
  dailyViewDate: Date;
  setDailyViewDate: (date: Date) => void;
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
  // Props for create task functionality
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  // Props for user permissions
  userRole?: string | null;
  hasPermission?: (permission: string) => boolean;
  currentUserTeamId?: string | null;
}

const NavbarSecondaria: React.FC<NavbarSecondariaProps> = ({
  dailyViewDate,
  setDailyViewDate,
  appointments, // Add appointments
  selectedStatusFilters,
  setSelectedStatusFilters,
  showDeletedAppointments,
  setShowDeletedAppointments,
  daysToShow,
  setDaysToShow,
  // Props for create task functionality
  isCreateModalOpen,
  setIsCreateModalOpen,
  // Props for user permissions
  userRole,
  hasPermission,
  currentUserTeamId,
}) => {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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





  // OTTIMIZZAZIONE: Cleanup refs
  useEffect(() => {
    return () => {
      if (localStorageTimeoutRef.current) {
        clearTimeout(localStorageTimeoutRef.current);
      }
    };
  }, []);

  // Funzione per mappare gli stati agli iconi
  const getStatusIcon = useCallback((statusValue: string) => {
    switch (statusValue) {
      case 'In corso':
        return <Time className="h-4 w-4" />;
      case 'Completato':
        return <Checkmark className="h-4 w-4" />;
      case 'Annullato':
        return <ChevronDown className="h-4 w-4" />;
      case 'Eliminato':
        return <TrashCan className="h-4 w-4" />;
      default:
        return <Information className="h-4 w-4" />;
    }
  }, []);

  return (
    <div
      className="px-4 py-3 bg-white h-16 border-b border-gray-200 flex-none"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div className="flex items-center gap-6">
        {/* Removed date navigation section */}
      </div>
              <div className="flex items-center gap-3">
          {/* Desktop only: filter status dropdown */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1" style={{ alignItems: 'center' }}>
            {/* Filter Status Button - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center justify-center p-2 h-9 w-9 transition-all duration-200 ${
                    selectedStatusFilters.length > 0 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Filtra per stato task"
                >
                  <Filter className="h-4 w-4" />
                  {selectedStatusFilters.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto z-50">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="font-bold text-gray-900 text-sm">Filtra per stato</h3>
                  <p className="text-xs text-gray-600 mt-1">Seleziona gli stati da visualizzare</p>
                </div>
                
                {/* Stati di Task */}
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkmark className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Task</span>
                  </div>
                  <div className="space-y-1">
                    {allStatuses.filter(status => 
                      ['In corso', 'Completato', 'Annullato', 'Eliminato'].includes(status.value)
                    ).map((status) => (
                      <DropdownMenuItem
                        key={status.value || 'empty'}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusFilterToggle(status.value);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${
                          selectedStatusFilters.includes(status.value)
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100">
                          {getStatusIcon(status.value)}
                        </div>
                        <span className="flex-1 text-sm font-medium">{status.label}</span>
                        <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
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
                  className="text-sm text-gray-500 p-3 font-medium hover:bg-red-50 hover:text-red-700 rounded-b-lg transition-colors"
                >
                  <span className="flex items-center gap-2 w-full justify-center">
                    Rimuovi tutti i filtri
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
                        ? 'text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <TrashCan className="h-4 w-4" />
                  </Button>
                  {showDeletedAppointments && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <span className="text-xs">
                  {showDeletedAppointments ? 'Nascondi task eliminati' : 'Mostra task eliminati'}
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
