'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { APPOINTMENT_STATUSES } from "@/components/status";
import { format, addDays, subDays, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  View, 
  Settings, 
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

  // Calcola tutti gli appuntamenti del mese corrente (per la vista mensile)
  const allMonthAppointments = useMemo(() => {
    const startMonth = format(startOfMonth(dailyViewDate), "yyyy-MM-dd");
    const endMonth = format(endOfMonth(dailyViewDate), "yyyy-MM-dd");
    return appointments.filter(app => app.data >= startMonth && app.data <= endMonth);
  }, [appointments, dailyViewDate]);

  // Calcola tutti gli appuntamenti del giorno (inclusi Eliminato) - solo per compatibilità
  const allTodayAppointments = useMemo(() => {
    return appointments.filter(app => app.data === format(dailyViewDate, "yyyy-MM-dd"));
  }, [appointments, dailyViewDate]);

  // Appuntamenti visibili (rispettando showDeletedAppointments)  
  const todayAppointments = useMemo(() => {
    return showDeletedAppointments
      ? allTodayAppointments
      : allTodayAppointments.filter(app => app.status !== 'Eliminato');
  }, [allTodayAppointments, showDeletedAppointments]);

  // Calcola i contatori per ogni stato su tutti gli appuntamenti del mese
  const statusCounts = useMemo(() => {
    const counts: Record<string | 'null' | 'empty', number> = {};
    allMonthAppointments.forEach(app => {
      let status = app.status || 'empty';
      // Normalizza "Eliminato" a "deleted" per compatibilità vecchi dati
      if (status === 'Eliminato') status = 'deleted';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [allMonthAppointments]);

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
      // Ottieni l'utente loggato
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        console.error("[DEBUG] Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
        return null;
      }

      // 1. Prima controlla nella tabella salon se l'utente è un titolare
      const { data: salonData, error: salonError } = await supabase
        .from("salon")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (salonData?.id) {
        console.log("[DEBUG] Utente trovato come titolare del salone, ID:", salonData.id);
        setSalonId(salonData.id);
        return salonData.id;
      }

      // 2. Controlla se l'utente è un collaboratore e ha un salon_id nel profilo
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('salon_id')
        .eq('id', user.id)
        .single();
        
      if (!profileError && profileData?.salon_id) {
        console.log("[DEBUG] Profilo utente trovato con salon_id:", profileData.salon_id);
        setSalonId(profileData.salon_id);
        return profileData.salon_id;
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

  // Carica il numero di giorni salvato dal database
  useEffect(() => {
    const loadDaysToShow = async () => {
      if (!salonId) return;

      try {
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
  }, [salonId]);

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
      className="px-4 py-3 bg-white dark:bg-gray-900 h-16 border-b border-gray-200 dark:border-gray-700 flex-none"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {/* DESKTOP: Month navigation controls */}
          <div className="hidden md:flex items-center rounded-lg p-1 gap-1 h-9">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDailyViewDate(subMonths(dailyViewDate, 1))}
                    className="p-2 rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <span className="text-xs">Mese precedente</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="px-3 py-2">
              <h2 className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                {format(dailyViewDate, 'MMMM yyyy')}
              </h2>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDailyViewDate(addMonths(dailyViewDate, 1))}
                    className="p-2 rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <span className="text-xs">Mese successivo</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
              <div className="flex items-center gap-3">
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
                  <span className="text-xs">Diminuisci zoom</span>
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
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 h-9 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                >
                  <View className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <span className="text-xs">Seleziona membri del team</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>            {showMemberDropdown && (
            <div className="absolute right-0 mt-2 w-[370px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 max-h-96 overflow-y-auto visible-users-dropdown">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex justify-between items-center">
                <span>Membri del team</span>
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Caricamento...</span>
                  ) : null}
                </div>
              </div>
              
              {groups.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Filtra per gruppo</label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200"
                    value={selectedGroupId || ""}
                    onChange={e => {
                      handleGroupChange(e.target.value || null);
                    }}
                  >
                    <option value="" className="text-gray-500 dark:text-gray-400">Tutti i membri</option>
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
                  <div className="font-medium">Nessun membro disponibile</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Verifica che i membri siano associati correttamente al salone.<br />
                    Se hai appena aggiunto membri, aggiorna la pagina.
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
                  Chiudi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Days to Show Button - Desktop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-center p-2 h-9 w-9 transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={isSavingDaysToShow}
                  >
                    {/* Days to Show icon removed */}
                    {isSavingDaysToShow && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <span className="text-xs">Giorni da visualizzare</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Giorni da visualizzare</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Seleziona quanti giorni mostrare</p>
            </div>
            <div className="p-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <DropdownMenuItem
                  key={num}
                  onClick={() => handleDaysToShowChange(num)}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                    daysToShow === num
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <CalendarCarbon className="h-4 w-4" />
                  <span className="flex-1 font-medium text-sm">{num} {num === 1 ? 'giorno' : 'giorni'}</span>
                  {daysToShow === num && (
                    <Checkmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Filtra per stato appuntamenti"
            >
              <Filter className="h-4 w-4" />
              {selectedStatusFilters.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 max-h-80 overflow-y-auto z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Filtra per stato</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Seleziona gli stati da visualizzare</p>
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
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 dark:bg-gray-600">
                    {getStatusIcon(status.value)}
                  </div>
                  <span className="flex-1 font-medium text-sm">{status.label}</span>
                  <Badge className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
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
              className="text-sm text-gray-500 dark:text-gray-400 p-3 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-md transition-colors"
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDailyViewDate(new Date())}
                  className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <TimeCarbon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <span className="text-xs">Data e ora corrente</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
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
