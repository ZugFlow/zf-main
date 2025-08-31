'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, addDays, subDays, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Pin, 
  Calendar, 
  Filter,
  Minus, 
  Plus,
  Trash,
  Users,
  Check,
  RefreshCw,
  Download,
  Upload,
  FileText,
  BarChart3,
  CalendarDays,
  List,
  Building2,
  Clock3,
  CalendarCheck,
  Clock,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Member, Permission } from './types';

interface NavbarSecondariaProps {
  // Date controls
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  
  // Main tabs
  activeMainTab: string;
  setActiveMainTab: (tab: string) => void;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  
  // Member selection
  members: Member[];
  selectedMember: string;
  setSelectedMember: (member: string) => void;
  showMemberDropdown: boolean;
  setShowMemberDropdown: (show: boolean) => void;
  
  // Status and type filters
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Permissions data
  permissions: Permission[];
  isManager: boolean;
  currentUser: any;
  
  // Actions
  onRefresh: () => void;
  onCreatePermission: () => void;
  onExport: () => void;
  onTestRealtime: () => void;
  onToggleMobile?: () => void;
  onPermissionsAndHolidays: () => void;
  onWorkingHours: () => void;
  onManageHolidayBalances?: () => void;
  
  // UI states
  isLoading: boolean;
  isRealtimeUpdating: boolean;
  isNavbarFixed: boolean;
  setIsNavbarFixed: (fixed: boolean) => void;
  currentSection: 'permissions' | 'working-hours';
}

const NavbarSecondaria: React.FC<NavbarSecondariaProps> = ({
  currentDate,
  setCurrentDate,
  activeMainTab,
  setActiveMainTab,
  activeSubTab,
  setActiveSubTab,
  members,
  selectedMember,
  setSelectedMember,
  showMemberDropdown,
  setShowMemberDropdown,
  selectedStatus,
  setSelectedStatus,
  selectedType,
  setSelectedType,
  searchTerm,
  setSearchTerm,
  permissions,
  isManager,
  currentUser,
  onRefresh,
  onCreatePermission,
  onExport,
  onTestRealtime,
  onToggleMobile,
  onPermissionsAndHolidays,
  onWorkingHours,
  onManageHolidayBalances,
  currentSection,
  isLoading,
  isRealtimeUpdating,
  isNavbarFixed,
  setIsNavbarFixed,
}) => {
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // OTTIMIZZAZIONE: Memoizza i contatori per performance
  const permissionCounts = useMemo(() => {
    const counts = {
      total: permissions.length,
      pending: permissions.filter(p => p.status === 'pending').length,
      approved: permissions.filter(p => p.status === 'approved').length,
      rejected: permissions.filter(p => p.status === 'rejected').length,
      ferie: permissions.filter(p => p.type === 'ferie').length,
      permesso: permissions.filter(p => p.type === 'permesso').length,
      malattia: permissions.filter(p => p.type === 'malattia').length,
    };
    return counts;
  }, [permissions]);

  // OTTIMIZZAZIONE: Memoizza i handler per evitare re-render
  const handleMemberToggle = useCallback((memberId: string) => {
    setSelectedMember(selectedMember === memberId ? 'all' : memberId);
  }, [selectedMember, setSelectedMember]);

  const toggleNavbarPosition = useCallback(() => {
    setIsNavbarFixed(!isNavbarFixed);
  }, [isNavbarFixed, setIsNavbarFixed]);

  // OTTIMIZZAZIONE: Click outside handler con throttling
  useEffect(() => {
    if (!showMemberDropdown) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.visible-users-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMemberDropdown, setShowMemberDropdown]);

  return (
    <div
      className={`px-4 py-3 bg-white h-16 ${isNavbarFixed ? '' : 'border-b border-gray-200'} flex-none ${isNavbarFixed ? 'fixed top-16 left-0 w-full z-50 shadow-sm' : ''}`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div className="flex items-center gap-6">
        {/* Manager Indicator */}
        {isManager && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-blue-700">Manager</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">?</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Puoi vedere e approvare tutti i permessi</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {/* Regular User Indicator */}
        {!isManager && currentUser && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-xs font-semibold text-gray-700">Utente</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">?</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Puoi vedere solo i tuoi permessi personali</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {/* MOBILE: Enhanced mobile controls with modern design */}
          <div className="md:hidden w-full">


            {/* Mobile Quick Actions Bar */}
            <div className="flex items-center gap-2 overflow-x-auto mobile-quick-actions pb-2">
              {/* Filter Status Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedStatus !== 'all' || selectedType !== 'all'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
                    }`}
                    type="button"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filtri</span>
                    {(selectedStatus !== 'all' || selectedType !== 'all') && (
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-blue-600 text-white">
                        {(selectedStatus !== 'all' ? 1 : 0) + (selectedType !== 'all' ? 1 : 0)}
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
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus('all')}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                        selectedStatus === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full border border-gray-300 shadow-sm bg-gray-400" />
                      <span className="flex-1 font-medium">Tutti gli stati</span>
                      <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                        {permissionCounts.total}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus('pending')}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                        selectedStatus === 'pending' ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full border border-gray-300 shadow-sm bg-yellow-400" />
                      <span className="flex-1 font-medium">In attesa</span>
                      <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                        {permissionCounts.pending}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus('approved')}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                        selectedStatus === 'approved' ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full border border-gray-300 shadow-sm bg-green-400" />
                      <span className="flex-1 font-medium">Approvato</span>
                      <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                        {permissionCounts.approved}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus('rejected')}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                        selectedStatus === 'rejected' ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full border border-gray-300 shadow-sm bg-red-400" />
                      <span className="flex-1 font-medium">Rifiutato</span>
                      <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                        {permissionCounts.rejected}
                      </Badge>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedStatus('all');
                      setSelectedType('all');
                    }}
                    className="text-sm text-gray-500 p-3 font-medium hover:bg-red-50 hover:text-red-700 rounded-b-lg transition-colors"
                  >
                    <span className="flex items-center gap-2 w-full justify-center">
                      <Minus className="h-3 w-3" /> 
                      Rimuovi tutti i filtri
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Member Selection Button - visible only to managers */}
              {isManager && (
                <button
                  onClick={() => setShowMemberDropdown(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span>Membri</span>
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-purple-600 text-white">
                    {selectedMember !== 'all' ? 1 : members.length}
                  </Badge>
                </button>
              )}

              {/* Permissions and Holidays Button */}
              <button
                onClick={onPermissionsAndHolidays}
                className={`flex items-center gap-1 text-xs font-medium transition-all duration-200 px-2 py-1 h-8 min-w-0 ${
                  currentSection === 'permissions' && activeSubTab === 'list'
                    ? 'bg-violet-500 text-white hover:bg-violet-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <CalendarCheck size={13} />
                <span>Permessi & Ferie</span>
              </button>

              {/* Working Hours Button */}
              <button
                onClick={onWorkingHours}
                className={`flex items-center gap-1 text-xs font-medium transition-all duration-200 px-2 py-1 h-8 min-w-0 ${
                  currentSection === 'working-hours'
                    ? 'bg-violet-500 text-white hover:bg-violet-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Clock3 size={13} />
                <span>Orari Lavoro</span>
              </button>

              {/* Gestione Bilanci Ferie - Mobile */}
              {isManager && onManageHolidayBalances && (
                <button
                  onClick={onManageHolidayBalances}
                  className={`flex items-center gap-1 text-xs font-medium transition-all duration-200 px-2 py-1 h-8 min-w-0 ${
                    activeSubTab === 'balances'
                      ? 'bg-violet-500 text-white hover:bg-violet-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Building2 size={13} />
                  <span>Bilanci</span>
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Mobile Member Selection Modal - only for managers */}
          {isManager && showMemberDropdown && (
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
                  {members.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-900 mb-2">Nessun membro disponibile</p>
                      <p className="text-sm text-gray-500">Non ci sono membri da selezionare</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Mostra "Tutti i membri" solo ai manager */}
                      {isManager && (
                        <button
                          onClick={() => handleMemberToggle('all')}
                          className={`mobile-member-card ${
                            selectedMember === 'all' 
                              ? 'selected' 
                              : ''
                          }`}
                        >
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-semibold">
                              <Users className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900">Tutti i membri</span>
                            <p className="text-xs text-gray-500 mt-1">{members.length} membri totali</p>
                          </div>
                          {selectedMember === 'all' && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </button>
                      )}
                      
                      {members.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleMemberToggle(member.id)}
                          className={`mobile-member-card ${
                            selectedMember === member.id 
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
                          {selectedMember === member.id && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
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
                      {selectedMember !== 'all' ? 1 : members.length} di {members.length} membri selezionati
                    </span>
                    {/* Mostra "Seleziona tutti" solo ai manager */}
                    {isManager && (
                      <button
                        onClick={() => {
                          setSelectedMember('all');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Seleziona tutti
                      </button>
                    )}
                  </div>
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-lg"
                    onClick={() => setShowMemberDropdown(false)}
                  >
                    Conferma ({selectedMember !== 'all' ? 1 : members.length})
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Desktop only: zoom, impostazioni, data/ora corrente, pin */}
        <div className="hidden md:flex items-center gap-3">
          {/* Permissions and Holidays Button - Desktop */}
          <Button
            variant={currentSection === 'permissions' && activeSubTab === 'list' ? "default" : "ghost"}
            size="sm"
            onClick={onPermissionsAndHolidays}
            className={`flex items-center gap-1 text-xs font-medium transition-all duration-200 px-2 py-1 h-8 min-w-0 ${
              currentSection === 'permissions' && activeSubTab === 'list'
                ? 'bg-violet-500 text-white hover:bg-violet-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <CalendarCheck size={13} />
            <span>Permessi & Ferie</span>
          </Button>

          {/* Working Hours Button - Desktop */}
          <Button
            variant={currentSection === 'working-hours' ? "default" : "ghost"}
            size="sm"
            onClick={onWorkingHours}
            className={`flex items-center gap-1 text-xs font-medium transition-all duration-200 px-2 py-1 h-8 min-w-0 ${
              currentSection === 'working-hours'
                ? 'bg-violet-500 text-white hover:bg-violet-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock3 size={13} />
            <span>Orari Lavoro</span>
          </Button>

          {/* Gestione Bilanci Ferie - Desktop */}
          {isManager && onManageHolidayBalances && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onManageHolidayBalances}
              className={`flex items-center gap-1 text-xs font-medium transition-all duration-200 px-2 py-1 h-8 min-w-0 ${
                activeSubTab === 'balances'
                  ? 'bg-violet-500 text-white hover:bg-violet-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Building2 size={13} />
              <span>Bilanci</span>
            </Button>
          )}

          <div className="flex items-center gap-1" style={{ alignItems: 'center' }}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <span className="text-xs">Aggiorna</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExport}
                    className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <span className="text-xs">Esporta</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Rimosso il pulsante "Data e ora corrente" */}
            {/* Rimosso il pulsante "Fissa la barra in alto" */}
            {/* Filter Status Button - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center justify-center p-2 h-9 w-9 transition-all duration-200 ${
                    selectedStatus !== 'all' || selectedType !== 'all'
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {(selectedStatus !== 'all' || selectedType !== 'all') && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto z-50">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="font-bold text-gray-900">Filtra per stato</h3>
                  <p className="text-xs text-gray-600 mt-1">Seleziona gli stati da visualizzare</p>
                </div>
                <div className="p-2">
                  <DropdownMenuItem
                    onClick={() => setSelectedStatus('all')}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                      selectedStatus === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full border border-gray-300 shadow-sm bg-gray-400" />
                    
                    
                  </DropdownMenuItem>
                  
                  
                </div>
                <DropdownMenuSeparator />
                
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dropdown selezione membri desktop - only for managers */}
        {isManager && (
        <div className="hidden md:block relative">
          <div 
            className="flex items-center gap-2 cursor-pointer px-3 py-2 h-9 rounded-lg transition-all duration-200 bg-gray-50 hover:bg-gray-100"
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            style={{ alignItems: 'center' }}
          >
            <Eye className="h-4 w-4 text-gray-600" />
            {selectedMember !== 'all' && (
              <Badge 
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-xs font-medium"
              >
                1
              </Badge>
            )}
        
          </div>
          {showMemberDropdown && (
            <div className="absolute right-0 mt-2 w-[370px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 max-h-96 overflow-y-auto visible-users-dropdown">
              <div className="text-sm font-semibold text-gray-800 mb-3 flex justify-between items-center">
                <span>Membri del team</span>
                <div className="flex items-center gap-2">
                  {isLoadingMembers ? (
                    <span className="text-xs text-gray-400">Caricamento...</span>
                  ) : null}
                </div>
              </div>
              
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
                  </div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-sm text-red-600 px-3 py-4 bg-red-50 rounded-lg">
                  <div className="font-medium">Nessun membro disponibile</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Verifica che i membri siano associati correttamente al salone.<br />
                    Se hai appena aggiunto membri, aggiorna la pagina.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Mostra "Tutti i membri" solo ai manager */}
                  {isManager && (
                    <label
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-all cursor-pointer ${
                        selectedMember === 'all' ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMember === 'all'}
                        onChange={() => handleMemberToggle('all')}
                        className="accent-blue-600 h-4 w-4"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback style={{ backgroundColor: '#888888' }}>
                            <Users className="h-4 w-4 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Tutti i membri
                          </div>
                          <div className="text-xs text-gray-500">
                            {members.length} membri totali
                          </div>
                        </div>
                      </div>
                    </label>
                  )}
                  
                  {members.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-all cursor-pointer ${
                        selectedMember === member.id ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMember === member.id}
                        onChange={() => handleMemberToggle(member.id)}
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
        )}
     
 
        {/* Action buttons: visibili sempre */}
        <div className="flex items-center gap-1" style={{ alignItems: 'center' }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCreatePermission}
                    className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <span className="text-xs">
                  Nuovo permesso
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

// Aggiungi gli stili CSS per il mobile member card
const mobileMemberCardStyles = `
  .mobile-member-card {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid transparent;
    background: white;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .mobile-member-card.selected {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
  
  .mobile-member-card:not(.selected):hover {
    background: #f8fafc;
    border-color: #e2e8f0;
    transform: translateY(-1px);
  }
  
  .mobile-member-card:active {
    transform: scale(0.98);
  }
`;

// Inserisci gli stili nel DOM
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = mobileMemberCardStyles;
  document.head.appendChild(styleElement);
}