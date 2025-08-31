'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { APPOINTMENT_STATUSES } from "@/components/status";
import { format, addDays, subDays } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  View, 
  Calendar, 
  Filter,
  Subtract, 
  Add,
  TrashCan,
  Checkmark,
  Time,
  CheckmarkOutline,
  WarningAlt,
  Warning,
  Error,
  Information,
  Receipt,
  Calendar as CalendarCarbon,
  ChevronDown,
  Time as TimeCarbon
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
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "@/components/ui/calendar";

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
  setSelectedTeamMemberIds: (ids: string[]) => void;
  handleToggleMember: (memberId: string) => void;
  setIsSettingCalendarOpen: (open: boolean) => void;
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
  setSelectedTeamMemberIds,
  handleToggleMember,
  setIsSettingCalendarOpen,
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
}) => {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Cambiato da true a false
  const [isFilterUpdating, setIsFilterUpdating] = useState(false); // State per mostrare aggiornamento filtro
  const [isSavingDaysToShow, setIsSavingDaysToShow] = useState(false); // State per salvataggio giorni da mostrare


  // Stati disponibili per gli appuntamenti importati da StatoCard
  const appointmentStatuses = APPOINTMENT_STATUSES;

  // Stati custom utente (come in GestioneStati)
  const [customStatuses, setCustomStatuses] = useState<{ value: string, label: string, color: string }[]>([]);
  useEffect(() => {
    async function fetchCustomStatuses() {
      try {
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
          setCustomStatuses(
            data.map((s: { key: string, value: string }) => ({
              value: s.key,
              label: s.key.charAt(0).toUpperCase() + s.key.slice(1),
              color: '#8b5cf6', // colore custom, puoi migliorare se vuoi
            }))
          );
        }
      } catch (e) {
        // fail silent
      }
    }
    fetchCustomStatuses();
  }, []);

  // Unisci solo stati di sistema e custom
  const allStatuses = useMemo(() => {
    // Evita duplicati tra custom e sistema
    const systemValues = appointmentStatuses.map(s => s.value);
    const filteredCustom = customStatuses.filter(s => !systemValues.includes(s.value));
    return [...appointmentStatuses, ...filteredCustom];
  }, [appointmentStatuses, customStatuses]);

  // Funzione per gestire il toggle dei filtri di stato
  const handleStatusFilterToggle = (status: string | null) => {
    // Se clicchi su "Eliminato" (deleted), attiva/disattiva il cestino
    if (status === 'deleted') {
      setShowDeletedAppointments(!showDeletedAppointments);
      return;
    }
    const updatedFilters = selectedStatusFilters.includes(status)
      ? selectedStatusFilters.filter(s => s !== status)
      : [...selectedStatusFilters, status];
    setSelectedStatusFilters(updatedFilters);
  };

  // Calcola tutti gli appuntamenti del giorno (inclusi Eliminato)
  const allTodayAppointments = useMemo(() => {
    return appointments.filter(app => app.data === format(dailyViewDate, "yyyy-MM-dd"));
  }, [appointments, dailyViewDate]);

  // Appuntamenti visibili (rispettando showDeletedAppointments)
  const todayAppointments = useMemo(() => {
    return showDeletedAppointments
      ? allTodayAppointments
      : allTodayAppointments.filter(app => app.status !== 'Eliminato');
  }, [allTodayAppointments, showDeletedAppointments]);

  const filteredTodayAppointments = useMemo(() =>
    selectedStatusFilters.length > 0
      ? todayAppointments.filter(app => selectedStatusFilters.includes(app.status))
      : todayAppointments,
    [todayAppointments, selectedStatusFilters]
  );

  // Calcola i contatori per ogni stato su tutti gli appuntamenti del giorno (anche Eliminato se nascosto)
  const statusCounts = useMemo(() => {
    const counts: Record<string | 'null' | 'empty', number> = {};
    allTodayAppointments.forEach(app => {
      let status = app.status || 'empty';
      // Normalizza "Eliminato" a "deleted" per compatibilità vecchi dati
      if (status === 'Eliminato') status = 'deleted';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [allTodayAppointments]);

  // Debug: mostra gli stati degli appuntamenti
  useEffect(() => {
    const uniqueStatuses = [...new Set(appointments.map(app => app.status).filter(Boolean))];
    console.log('Stati unici trovati negli appuntamenti:', uniqueStatuses);
    console.log('Appuntamenti di oggi:', todayAppointments.length);
    console.log('Stati degli appuntamenti di oggi:', todayAppointments.map(app => ({ nome: app.nome, status: app.status })));
    console.log('Filtri di stato selezionati:', selectedStatusFilters);
    console.log('Appuntamenti filtrati:', filteredTodayAppointments.length);
  }, [appointments, todayAppointments, selectedStatusFilters, filteredTodayAppointments]);

  // Forza il re-render quando cambiano gli appuntamenti per aggiornare i contatori
  useEffect(() => {
    // Questo useEffect si attiva ogni volta che cambiano gli appuntamenti
    // e forza un aggiornamento dei contatori del filtro
    console.log('Aggiornamento appuntamenti rilevato, riaggiornamento contatori filtro');
    
    setIsFilterUpdating(true);
    
    // Rimuovi i filtri per stati che non esistono più negli appuntamenti correnti
    const currentStatuses = [...new Set(appointments.map(app => app.status))];
    const validFilters = selectedStatusFilters.filter(filter => 
      filter === null || filter === '' || currentStatuses.includes(filter)
    );
    
    if (validFilters.length !== selectedStatusFilters.length) {
      console.log('Rimozione filtri per stati non più presenti');
      setSelectedStatusFilters(validFilters);
    }
    
    // Rimuovi l'indicatore di aggiornamento dopo un breve delay
    const timer = setTimeout(() => setIsFilterUpdating(false), 500);
    return () => clearTimeout(timer);
  }, [appointments]);

  // Salva i filtri di stato in localStorage quando cambiano
  useEffect(() => {
    try {
      localStorage.setItem('statusFilters', JSON.stringify(selectedStatusFilters));
    } catch (error) {
      console.error('Errore nel salvare i filtri di stato:', error);
    }
  }, [selectedStatusFilters]);

  // Salva lo stato showDeletedAppointments in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('showDeletedAppointments', JSON.stringify(showDeletedAppointments));
    } catch (error) {
      console.error('Errore nel salvare lo stato showDeletedAppointments:', error);
    }
  }, [showDeletedAppointments]);

  // Carica lo stato showDeletedAppointments dal localStorage al mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('showDeletedAppointments');
      if (saved !== null) {
        const parsedState = JSON.parse(saved);
        if (typeof parsedState === 'boolean') {
          setShowDeletedAppointments(parsedState);
        }
      }
    } catch (error) {
      console.error('Errore nel caricare lo stato showDeletedAppointments:', error);
    }
  }, []);

  // Funzione per ottenere il salon_id dell'utente corrente
  async function fetchSalonId() {
    try {
      // Usa l'utility per ottenere il salon_id
      const salonId = await getSalonId();
      
      if (salonId) {
        console.log("[DEBUG] Salon ID trovato:", salonId);
        setSalonId(salonId);
        return salonId;
      }
      
      console.warn("[DEBUG] Nessun salon_id trovato per l'utente.");
      return null;
    } catch (error) {
      console.error("[DEBUG] Errore durante il recupero del salonId:", error);
      return null;
    }
  }

  // Carica salon ID all'avvio
  useEffect(() => {
    fetchSalonId();
  }, []);

  // Note: daysToShow loading is now handled in the parent WeeklyCalendar component

  // Funzione per salvare il numero di giorni da mostrare
  const saveDaysToShow = async (newDaysToShow: number) => {
    if (!salonId) {
      console.error("Salon ID non disponibile");
      return;
    }

    setIsSavingDaysToShow(true);
    try {
      // Aggiorna tutti i membri del team per questo salone
      const { error } = await supabase
        .from("team")
        .update({ rowmonthly: newDaysToShow })
        .eq("salon_id", salonId);

      if (error) {
        console.error("Errore nel salvare il numero di giorni:", error);
        return;
      }

      console.log("Numero di giorni salvato con successo:", newDaysToShow);
    } catch (error) {
      console.error("Errore nel salvare il numero di giorni:", error);
    } finally {
      setIsSavingDaysToShow(false);
    }
  };

  // Gestisce il cambio del numero di giorni da mostrare
  const handleDaysToShowChange = (newDaysToShow: number) => {
    console.log('Dropdown clicked - changing days to show from', daysToShow, 'to', newDaysToShow);
    setDaysToShow(newDaysToShow);
    saveDaysToShow(newDaysToShow);
  };
  const MIN_HEIGHT = 175;
  const MAX_HEIGHT = 800;
  
  const handleIncrement = () => {
    onHourHeightChange(Math.min(hourHeight + 20, MAX_HEIGHT));
  };

  const handleDecrement = () => {
    onHourHeightChange(Math.max(hourHeight - 20, MIN_HEIGHT));
  };

  // Funzione per mappare gli stati agli iconi Carbon
  const getStatusIcon = (statusValue: string) => {
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
        return <Receipt className="h-4 w-4" />;
      case 'Pagato in contanti':
        return <Receipt className="h-4 w-4" />;
      case 'paid_card':
        return <Receipt className="h-4 w-4" />;
      case 'paid_online':
        return <Receipt className="h-4 w-4" />;
      case 'Fatturato':
        return <Receipt className="h-4 w-4" />;
      case 'Fattura da emettere':
        return <Receipt className="h-4 w-4" />;
      case 'Fattura inviata':
        return <Receipt className="h-4 w-4" />;
      case 'Errore fattura':
        return <Error className="h-4 w-4" />;
      case 'Eliminato':
        return <TrashCan className="h-4 w-4" />;
      default:
        return <Information className="h-4 w-4" />;
    }
  };

  // DEBUG LOGS
  console.log('DEBUG navbar_secondaria:');
  console.log('selectedTeamMemberIds:', selectedTeamMemberIds);
  console.log('teamMembers recuperati:', teamMembers.length);
  console.log('teamMembers IDs:', teamMembers.map(m => m.id));

  // Verifica sovrapposizione tra membri selezionati e membri recuperati
  const membersInBoth = selectedTeamMemberIds.filter(id => 
    teamMembers.some(m => m.id === id)
  );
  console.log('Membri presenti sia in selectedTeamMemberIds che in teamMembers:', membersInBoth.length);

  useEffect(() => {
    const handleZoomWithWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault(); // Previene lo zoom del browser
        event.stopPropagation(); // Previene la propagazione dell'evento
        if (event.deltaY < 0) {
          // Scroll verso l'alto, aumenta lo zoom
          onHourHeightChange(Math.min(hourHeight + 20, 800));
        } else {
          // Scroll verso il basso, riduci lo zoom
          onHourHeightChange(Math.max(hourHeight - 20, 175));
        }
      }
    };

    window.addEventListener('wheel', handleZoomWithWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleZoomWithWheel);
    };
  }, [hourHeight, onHourHeightChange]);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.visible-users-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    };

    if (showMemberDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMemberDropdown]);
  return (
    <div
      className="px-4 py-3 bg-white h-16 border-b border-gray-200 flex-none"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {/* MOBILE: Enhanced mobile controls with modern design */}
          <div className="md:hidden w-full">
            {/* Mobile Navigation Bar */}
            <div className="flex items-center justify-between gap-3 mb-3">
              {/* Date Navigation */}
              <div className="flex items-center bg-white rounded-xl p-1 gap-1 shadow-sm border border-gray-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setDailyViewDate(subDays(dailyViewDate, 1))}
                        className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 active:scale-95 text-gray-600 hover:text-gray-900"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                                    <TooltipContent side="bottom" align="center">
                  <span className="text-xs">Giorno precedente</span>
                </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Popover>
                  <PopoverTrigger asChild>
                    <div className="px-3 py-1 cursor-pointer hover:bg-gray-50 rounded-lg transition-all duration-200">
                      <h2 className="text-sm font-bold text-gray-800 whitespace-nowrap">
                        {format(dailyViewDate, 'dd MMM yyyy')}
                      </h2>
                    </div>
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
                        className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 active:scale-95 text-gray-600 hover:text-gray-900"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                                    <TooltipContent side="bottom" align="center">
                  <span className="text-xs">Giorno successivo</span>
                </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {/* Today Button */}
                <button
                  onClick={() => setDailyViewDate(new Date())}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                >
                  Oggi
                </button>


              </div>
            </div>

            {/* Mobile Quick Actions Bar */}
            <div className="flex items-center gap-2 overflow-x-auto mobile-quick-actions pb-2">
              {/* Filter Status Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedStatusFilters.length > 0 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
                    }`}
                    type="button"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filtri</span>
                    {selectedStatusFilters.length > 0 && (
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-blue-600 text-white">
                        {selectedStatusFilters.length}
                      </Badge>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto z-50">
                  <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                    <h3 className="font-bold text-gray-900">Filtra per stato</h3>
                    <p className="text-xs text-gray-600 mt-1">Seleziona gli stati da visualizzare</p>
                  </div>
                  <div className="p-2">
                    {allStatuses.map((status) => (
                      <DropdownMenuItem
                        key={status.value || 'empty'}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusFilterToggle(status.value);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                          selectedStatusFilters.includes(status.value)
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100">
                          {getStatusIcon(status.value)}
                        </div>
                        <span className="flex-1 font-medium">{status.label}</span>
                        <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                          {statusCounts[status.value ?? 'empty'] || 0}
                        </Badge>
                      </DropdownMenuItem>
                    ))}
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
                      <Subtract className="h-3 w-3" /> 
                      Rimuovi tutti i filtri
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Show Deleted Button */}
              <button
                onClick={() => setShowDeletedAppointments(!showDeletedAppointments)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  showDeletedAppointments 
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <TrashCan className="h-4 w-4" />
                <span>Eliminati</span>
              </button>

              {/* Member Selection Button */}
              <button
                onClick={() => setShowMemberDropdown(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm"
              >
                <View className="h-4 w-4" />
                <span>Membri</span>
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-purple-600 text-white">
                  {selectedTeamMemberIds.length}
                </Badge>
              </button>

              {/* Days to Show Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm"
                    disabled={isSavingDaysToShow}
                    type="button"
                    onClick={() => console.log('Dropdown trigger clicked, daysToShow:', daysToShow)}
                  >
                    <CalendarCarbon className="h-4 w-4" />
                    <span>{daysToShow} giorni</span>
                    <ChevronDown className="h-3 w-3" />
                    {isSavingDaysToShow && (
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    )}
                    {/* Debug indicator */}
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Giorni da visualizzare</h3>
                    <p className="text-xs text-gray-600 mt-1">Seleziona quanti giorni mostrare</p>
                    {/* Debug info */}
                    <div className="text-xs text-red-500 mt-1">Debug: Dropdown content rendered</div>
                  </div>
                  <div className="p-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <DropdownMenuItem
                        key={num}
                        onClick={() => {
                          console.log('Dropdown item clicked:', num);
                          handleDaysToShowChange(num);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                          daysToShow === num
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <CalendarCarbon className="h-4 w-4" />
                        <span className="flex-1 font-medium text-sm">{num} {num === 1 ? 'giorno' : 'giorni'}</span>
                        {daysToShow === num && (
                          <Checkmark className="h-4 w-4 text-blue-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Enhanced Mobile Member Selection Modal */}
          {showMemberDropdown && (
            <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="w-full h-full max-w-full max-h-full rounded-none overflow-y-auto bg-white border-none shadow-none p-0 flex flex-col">
                {/* Enhanced Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-4 shadow-sm">
                  <button
                    onClick={() => setShowMemberDropdown(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                  <h1 className="text-lg font-bold text-gray-900 flex-1 text-center mx-4">Seleziona membri</h1>
                  <div className="w-9"></div>
                </div>

                {/* Enhanced Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {groupFilteredMembers.length === 0 ? (
                                      <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <View className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-2">Nessun membro disponibile</p>
                    <p className="text-sm text-gray-500">Non ci sono membri da selezionare</p>
                  </div>
                  ) : (
                    <div className="space-y-2">
                      {groupFilteredMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleToggleMember(member.id)}
                          className={`mobile-member-card ${
                            selectedTeamMemberIds.includes(member.id) 
                              ? 'selected' 
                              : ''
                          }`}
                        >
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={member.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-semibold">
                              {member.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900">{member.name}</span>
                            {member.email && (
                              <p className="text-xs text-gray-500 mt-1">{member.email}</p>
                            )}
                          </div>
                          {selectedTeamMemberIds.includes(member.id) && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enhanced Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">
                      {selectedTeamMemberIds.length} di {groupFilteredMembers.length} membri selezionati
                    </span>
                    <button
                      onClick={() => {
                        const allMemberIds = groupFilteredMembers.map(m => m.id);
                        setSelectedTeamMemberIds(allMemberIds);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Seleziona tutti
                    </button>
                  </div>
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-lg"
                    onClick={() => setShowMemberDropdown(false)}
                  >
                    Conferma ({selectedTeamMemberIds.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP: Day navigation controls */}
          <div className="hidden md:flex items-center rounded-lg p-1 gap-1 h-9">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDailyViewDate(subDays(dailyViewDate, 1))}
                    className="p-2 rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <span className="text-xs">Giorno precedente</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Popover>
              <PopoverTrigger asChild>
                <div className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-200">
                  <h2 className="text-sm font-medium text-gray-800 whitespace-nowrap">
                    {format(dailyViewDate, 'dd MMMM yyyy')}
                  </h2>
                </div>
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
                    className="p-2 rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm text-gray-600 hover:text-gray-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <span className="text-xs">Giorno successivo</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3"> {/* Spostato il contenitore dei pulsanti qui */}
        {/* Zoom +/- buttons visibili solo su desktop (md e superiori) */}
        <div className="hidden md:flex items-center gap-1 h-9">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDecrement}
                  className="flex items-center justify-center p-2 rounded-md transition-all duration-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <Subtract className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <span className="text-xs">Diminuisci zoom</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleIncrement}
                  className="flex items-center justify-center p-2 rounded-md transition-all duration-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <Add className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <span className="text-xs">Aumenta zoom</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Members selection dropdown */}
        <div className="relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 h-9 rounded-lg transition-all duration-200 hover:bg-gray-100"
                  onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                >
                  <View className="h-4 w-4 text-gray-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <span className="text-xs">Seleziona membri del team</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>            {showMemberDropdown && (
            <div className="absolute right-0 mt-2 w-[370px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 max-h-96 overflow-y-auto visible-users-dropdown">
              <div className="text-sm font-semibold text-gray-800 mb-3 flex justify-between items-center">
                <span>Membri del team</span>
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <span className="text-xs text-gray-400">Caricamento...</span>
                  ) : null}
                </div>
              </div>
              
              {groups.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Filtra per gruppo</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-300"
                    value={selectedGroupId || ""}
                    onChange={e => {
                      handleGroupChange(e.target.value || null);
                    }}
                  >
                    <option value="" className="text-gray-500">Tutti i membri</option>
                    {groups.map(group => (
                      <option 
                        key={group.id} 
                        value={group.id} 
                        className="text-gray-700"
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
                <div className="text-sm text-red-600 px-3 py-4 bg-red-50 rounded-lg">
                  <div className="font-medium">Nessun membro disponibile</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Verifica che i membri siano associati correttamente al salone.<br />
                    Se hai appena aggiunto membri, aggiorna la pagina.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {teamMembers.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-all cursor-pointer ${
                        selectedTeamMemberIds.includes(member.id) ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamMemberIds.includes(member.id)}
                        onChange={() => {
                          console.log('Toggle team member in dropdown:', member.id, member.name);
                          console.log('Current selectedTeamMemberIds before toggle:', selectedTeamMemberIds);
                          handleToggleMember(member.id);
                        }}
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
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                          {member.email && (
                            <div className="text-xs text-gray-500">
                              {member.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-3 pt-2 border-t border-gray-100">
                <button
                  className="text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
                  onClick={() => setShowMemberDropdown(false)}
                  type="button"
                >
                  Chiudi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Days to Show Button - Desktop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center p-2 h-9 w-9 transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              disabled={isSavingDaysToShow}
              type="button"
              title="Giorni da visualizzare"
              onClick={() => console.log('Desktop dropdown trigger clicked, daysToShow:', daysToShow)}
            >
              <CalendarCarbon className="h-4 w-4" />
              {isSavingDaysToShow && (
                <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Giorni da visualizzare</h3>
              <p className="text-xs text-gray-600 mt-1">Seleziona quanti giorni mostrare</p>
            </div>
            <div className="p-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <DropdownMenuItem
                  key={num}
                  onClick={() => {
                    console.log('Desktop dropdown item clicked:', num);
                    handleDaysToShowChange(num);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                    daysToShow === num
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <CalendarCarbon className="h-4 w-4" />
                  <span className="flex-1 font-medium text-sm">{num} {num === 1 ? 'giorno' : 'giorni'}</span>
                  {daysToShow === num && (
                    <Checkmark className="h-4 w-4 text-blue-600" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
              title="Filtra per stato appuntamenti"
            >
              <Filter className="h-4 w-4" />
              {selectedStatusFilters.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 max-h-80 overflow-y-auto z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Filtra per stato</h3>
              <p className="text-xs text-gray-600 mt-1">Seleziona gli stati da visualizzare</p>
            </div>
            <div className="p-2">
              {allStatuses.map((status) => (
                <DropdownMenuItem
                  key={status.value || 'empty'}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStatusFilterToggle(status.value);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                    selectedStatusFilters.includes(status.value)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100">
                    {getStatusIcon(status.value)}
                  </div>
                  <span className="flex-1 font-medium text-sm">{status.label}</span>
                  <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                    {statusCounts[status.value ?? 'empty'] || 0}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                setSelectedStatusFilters([]);
                setShowDeletedAppointments(false);
              }}
              className="text-sm text-gray-500 p-3 font-medium hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
            >
              <span className="flex items-center gap-2 w-full justify-center">
                <Subtract className="h-3 w-3" /> 
                Rimuovi tutti i filtri
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Action buttons with improved spacing */}
        <div className="flex items-center gap-3">
          {/* Pulsante 'Data e ora corrente' visibile solo su desktop (md e superiori) */}
          <div className="hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDailyViewDate(new Date())}
                    className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                  >
                    <TimeCarbon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <span className="text-xs">Data e ora corrente</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              <TooltipContent side="bottom" align="center">
                <span className="text-xs">
                  {showDeletedAppointments ? 'Nascondi appuntamenti eliminati' : 'Mostra appuntamenti eliminati'}
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

// CSS styles for mobile member cards
const styles = `
  .mobile-member-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    border: 2px solid transparent;
    background: white;
    transition: all 0.2s ease;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .mobile-member-card:hover {
    background: #f8fafc;
    border-color: #e2e8f0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .mobile-member-card.selected {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  .mobile-member-card.selected:hover {
    background: #dbeafe;
    border-color: #2563eb;
  }

  .mobile-quick-actions {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }

  .mobile-quick-actions::-webkit-scrollbar {
    height: 4px;
  }

  .mobile-quick-actions::-webkit-scrollbar-track {
    background: transparent;
  }

  .mobile-quick-actions::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }

  .mobile-quick-actions::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
