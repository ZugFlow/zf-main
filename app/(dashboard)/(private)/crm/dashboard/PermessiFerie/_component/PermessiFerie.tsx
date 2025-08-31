'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Edit, 
  Trash, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Upload,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  CalendarDays,
  Users,
  Building2,
  FileText,
  BarChart3,
  RefreshCw,
  Clock3,
  Bell,
  Eye,
  EyeOff,
  Archive,
  ArchiveRestore
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useLocalization } from '@/hooks/useLocalization';

import { 
  Permission, 
  Member, 
  HolidayBalance,
  FormData
} from './types';
import StatsCardsPermessi from './StatsCardsPermessi';

interface PermessiFerieProps {
  permissions: Permission[];
  members: Member[];
  holidayBalances: HolidayBalance[];
  isManager: boolean;
  currentUser: any;
  selectedMember: string;
  selectedStatus: string;
  selectedType: string;
  searchTerm: string;
  activeSubTab?: string; // Aggiungo questa prop
  onMemberChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onUpdateStatus: (permissionId: string, status: 'approved' | 'rejected') => void;
  onEdit: (permission: Permission) => void;
  onDelete: (permissionId: string) => void;
  onCreatePermission: () => void;
  onArchive: (permissionId: string) => void;
  onRestore: (permissionId: string) => void;
}

export default function PermessiFerie({
  permissions,
  members,
  holidayBalances,
  isManager,
  currentUser,
  selectedMember,
  selectedStatus,
  selectedType,
  searchTerm,
  activeSubTab = 'list', // Default a 'list' se non fornito
  onMemberChange,
  onStatusChange,
  onTypeChange,
  onSearchChange,
  onUpdateStatus,
  onEdit,
  onDelete,
  onCreatePermission,
  onArchive,
  onRestore
}: PermessiFerieProps) {
  const { t, formatDate, formatCurrency, currentLanguage } = useLocalization();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(activeSubTab);
  const [showArchived, setShowArchived] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Identifica il member_id dell'utente corrente (utile per nascondere i pulsanti su propri permessi)
  const currentMemberId = currentUser ? members.find(m => m.user_id === currentUser.id)?.id : undefined;

  // Sincronizza activeTab con activeSubTab quando cambia
  useEffect(() => {
    setActiveTab(activeSubTab);
  }, [activeSubTab]);


  // Filter permissions based on selected criteria
  const filteredPermissions = permissions.filter(permission => {
    // Per i non-manager, mostra solo i propri permessi indipendentemente dal selectedMember
    if (!isManager && currentUser) {
      const currentMember = members.find(m => m.user_id === currentUser.id);
      if (currentMember && permission.member_id !== currentMember.id) {
        return false;
      }
    }
    
    // Filtro per archiviati/non archiviati
    const matchesArchive = showArchived ? permission.archived : !permission.archived;
    
    const matchesMember = selectedMember === 'all' || permission.member_id === selectedMember;
    const matchesStatus = selectedStatus === 'all' || permission.status === selectedStatus;
    const matchesType = selectedType === 'all' || permission.type === selectedType;
    const matchesSearch = permission.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesArchive && matchesMember && matchesStatus && matchesType && matchesSearch;
  });

  // Calcola numero filtri attivi e un breve sommario
  const activeFiltersCount = (
    (isManager && selectedMember !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (searchTerm?.trim() ? 1 : 0) +
    (showArchived ? 1 : 0)
  );

  const handleResetFilters = () => {
    onMemberChange('all');
    onStatusChange('all');
    onTypeChange('all');
    onSearchChange('');
    setShowArchived(false);
  };



  // Helper function to safely format dates
  const formatDateLocal = (dateString: string | null | undefined): string => {
    if (!dateString) return t('permessi.date_not_available', 'Data non disponibile');
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t('permessi.invalid_date', 'Data non valida');
      }
      return format(date, 'dd/MM/yyyy', { locale: it });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return t('permessi.invalid_date', 'Data non valida');
    }
  };

  // Helper function to safely calculate days between dates
  const calculateDaysBetween = (startDate: string, endDate: string): number => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch (error) {
      console.error('Error calculating days between dates:', startDate, endDate, error);
      return 0;
    }
  };

  // Calculate total duration in days for a permission
  const getPermissionDurationDays = (permission: Permission): number => {
    return calculateDaysBetween(permission.start_date, permission.end_date);
  };

  // Compute holiday (ferie) stats from permissions for a member
  const getMemberHolidayStats = (memberId: string, totalDaysFallback: number = 30) => {
    const approvedFerie = permissions.filter(
      (p) => p.member_id === memberId && p.type === 'ferie' && p.status === 'approved'
    );
    const pendingFerie = permissions.filter(
      (p) => p.member_id === memberId && p.type === 'ferie' && p.status === 'pending'
    );

    const usedDays = approvedFerie.reduce(
      (acc, p) => acc + calculateDaysBetween(p.start_date, p.end_date),
      0
    );
    const pendingDays = pendingFerie.reduce(
      (acc, p) => acc + calculateDaysBetween(p.start_date, p.end_date),
      0
    );

    // find total days from incoming balances if available
    const balance = holidayBalances.find((b) => b.member_id === memberId);
    const totalDays = balance?.total_days ?? totalDaysFallback;
    const remainingDays = Math.max(totalDays - usedDays, 0);

    return { totalDays, usedDays, remainingDays, pendingDays };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ferie': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'permesso': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'malattia': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCalendarDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getPermissionsForDay = (date: Date) => {
    return filteredPermissions.filter(permission => {
      try {
        const startDate = new Date(permission.start_date);
        const endDate = new Date(permission.end_date);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return false;
        }
        
        return date >= startDate && date <= endDate;
      } catch (error) {
        console.error('Error checking permission date range:', permission, error);
        return false;
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con controlli */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{t('permessi.title', 'Permessi & Ferie')}</h2>
          <Badge variant="outline">
            {filteredPermissions.length} {t('permessi.permissions_count', 'permessi')}
          </Badge>
          <div className="flex items-center gap-2">
            <Switch
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label className="text-sm">
              {showArchived ? t('permessi.show_archived', 'Mostra archiviati') : t('permessi.show_active', 'Mostra attivi')}
            </Label>
          </div>
        </div>
        
   
      </div>

      {/* Stats Cards per Permessi & Ferie */}
      <StatsCardsPermessi 
        permissions={filteredPermissions}
        members={members}
      />

      {/* Filtri - compatti e collassabili */}
      <Card>
        <CardHeader className="py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-base">{t('permessi.filters.title', 'Filtri')}</CardTitle>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
              )}
              {showArchived && (
                <Badge variant="secondary" className="ml-1">
                  <Archive className="h-3 w-3 mr-1" />
                  Archiviati
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 px-2 text-xs">
                  {t('permessi.filters.reset', 'Reimposta')}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(v => !v)} className="h-8 px-2">
                {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {showArchived && (
            <CardDescription className="text-xs">
              {t('permessi.archived_description', 'Visualizzazione dei permessi archiviati. I permessi archiviati sono quelli approvati o rifiutati che sono stati spostati nell\'archivio per mantenere la lista attiva più pulita.')}
            </CardDescription>
          )}
        </CardHeader>
        {filtersOpen && (
          <CardContent className="pt-0 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="member" className="text-xs">{t('permessi.filters.employee', 'Dipendente')}</Label>
                <Select value={selectedMember} onValueChange={onMemberChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={isManager ? t('permessi.filters.all_employees', 'Tutti i dipendenti') : t('permessi.filters.select_employee', 'Seleziona dipendente')} />
                  </SelectTrigger>
                  <SelectContent>
                    {isManager && <SelectItem value="all">{t('permessi.filters.all_employees', 'Tutti i dipendenti')}</SelectItem>}
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status" className="text-xs">{t('permessi.filters.status', 'Stato')}</Label>
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t('permessi.filters.all_statuses', 'Tutti gli stati')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('permessi.filters.all_statuses', 'Tutti gli stati')}</SelectItem>
                    <SelectItem value="pending">{t('permessi.status.pending', 'In attesa')}</SelectItem>
                    <SelectItem value="approved">{t('permessi.status.approved', 'Approvato')}</SelectItem>
                    <SelectItem value="rejected">{t('permessi.status.rejected', 'Rifiutato')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type" className="text-xs">{t('permessi.filters.type', 'Tipo')}</Label>
                <Select value={selectedType} onValueChange={onTypeChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t('permessi.filters.all_types', 'Tutti i tipi')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('permessi.filters.all_types', 'Tutti i tipi')}</SelectItem>
                    <SelectItem value="ferie">{t('permessi.type.holiday', 'Ferie')}</SelectItem>
                    <SelectItem value="permesso">{t('permessi.type.permission', 'Permesso')}</SelectItem>
                    <SelectItem value="malattia">{t('permessi.type.sick_leave', 'Malattia')}</SelectItem>
                    <SelectItem value="altro">{t('permessi.type.other', 'Altro')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search" className="text-xs">{t('permessi.filters.search', 'Cerca')}</Label>
                <Input
                  placeholder={t('permessi.filters.search_placeholder', 'Cerca per nome o motivo...')}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contenuto principale */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">{t('permessi.tabs.permissions_list', 'Lista Permessi')}</TabsTrigger>
          {isManager && <TabsTrigger value="calendar">{t('permessi.tabs.calendar', 'Calendario')}</TabsTrigger>}
          {isManager && <TabsTrigger value="balances">{t('permessi.tabs.holiday_balances', 'Bilanci Ferie')}</TabsTrigger>}
        </TabsList>
        
        {/* Lista Permessi Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('permessi.list.title', 'Lista Permessi')}</CardTitle>
                  <CardDescription>
                    {isManager 
                      ? t('permessi.list.manager_description', 'Gestisci tutte le richieste di permesso e ferie del team')
                      : t('permessi.list.personal_description', 'I tuoi permessi personali')
                    }
                  </CardDescription>
                </div>
                {/* View Summary */}
                <div className="flex items-center gap-2">
                  {isManager ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Users className="h-3 w-3 mr-1" />
                      {t('permessi.view.manager', 'Vista Manager')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      <User className="h-3 w-3 mr-1" />
                      {t('permessi.view.personal', 'Vista Personale')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('permessi.table.employee', 'Dipendente')}</TableHead>
                      <TableHead>{t('permessi.table.type', 'Tipo')}</TableHead>
                      <TableHead>{t('permessi.table.period', 'Periodo')}</TableHead>
                      <TableHead>{t('permessi.table.reason', 'Motivo')}</TableHead>
                      <TableHead>{t('permessi.table.status', 'Stato')}</TableHead>
                      <TableHead>{t('permessi.table.actions', 'Azioni')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={members.find(m => m.id === permission.member_id)?.avatar_url} />
                              <AvatarFallback>
                                {permission.member_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{permission.member_name}</span>
                                {/* Show indicator if this is the current user's permission */}
                                {currentUser && members.find(m => m.user_id === currentUser.id)?.id === permission.member_id && (
                                                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                  {t('permessi.yours', 'Tuo')}
                                </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDateLocal(permission.created_at)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(permission.type)}>
                            {permission.type === 'ferie' ? t('permessi.type.holiday', 'Ferie') :
                             permission.type === 'permesso' ? t('permessi.type.permission', 'Permesso') :
                             permission.type === 'malattia' ? t('permessi.type.sick_leave', 'Malattia') : t('permessi.type.other', 'Altro')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{t('permessi.period.from', 'Dal')}: {formatDateLocal(permission.start_date)}</div>
                            <div>{t('permessi.period.to', 'Al')}: {formatDateLocal(permission.end_date)}</div>
                            {permission.start_time && permission.end_time && (
                              <div className="text-xs text-muted-foreground">
                                {permission.start_time} - {permission.end_time}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="text-sm font-medium">{permission.reason}</div>
                            {permission.notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {permission.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(permission.status)}>
                            {permission.status === 'pending' ? t('permessi.status.pending', 'In attesa') :
                             permission.status === 'approved' ? t('permessi.status.approved', 'Approvato') : t('permessi.status.rejected', 'Rifiutato')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!showArchived ? (
                              <>
                                {/* Solo i manager possono approvare/rifiutare permessi */}
                                {isManager && permission.status === 'pending' && permission.member_id !== currentMemberId && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-green-100 hover:bg-green-200 border-green-300"
                                      onClick={() => onUpdateStatus(permission.id, 'approved')}
                                    >
                                      <Check className="h-4 w-4" />
                                      {t('permessi.actions.approve', 'Approva')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-red-100 hover:bg-red-200 border-red-300"
                                      onClick={() => onUpdateStatus(permission.id, 'rejected')}
                                    >
                                      <X className="h-4 w-4" />
                                      {t('permessi.actions.reject', 'Rifiuta')}
                                    </Button>
                                  </>
                                )}
                                
                                {/* I membri possono eliminare solo i propri permessi in attesa */}
                                {(!isManager && permission.status === 'pending' && currentUser) || isManager ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDelete(permission.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                ) : null}

                                {/* Archivia permessi approvati o rifiutati */}
                                {permission.status !== 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onArchive(permission.id)}
                                    title="Archivia permesso"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              /* Sezione archiviati - mostra solo il pulsante di ripristino */
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRestore(permission.id)}
                                title="Ripristina permesso"
                              >
                                <ArchiveRestore className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredPermissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {showArchived ? (
                    <>
                      <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('permessi.empty.archived', 'Nessun permesso archiviato trovato')}</p>
                      <p className="text-sm mt-2">{t('permessi.empty.archived_description', 'I permessi archiviati sono quelli approvati o rifiutati che sono stati spostati nell\'archivio.')}</p>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('permessi.empty.no_permissions', 'Nessun permesso trovato')}</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendario Tab - Solo per i manager */}
        {isManager && (
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('permessi.calendar.title', 'Calendario Permessi')}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(subDays(currentDate, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium">
                      {format(currentDate, 'MMMM yyyy', { locale: it })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(addDays(currentDate, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  {getCalendarDays().map((date) => {
                    const dayPermissions = getPermissionsForDay(date);
                    return (
                      <div
                        key={date.toISOString()}
                        className={`p-2 min-h-[80px] border rounded-lg ${
                          isToday(date) ? 'bg-primary/10 border-primary' : 'bg-card'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {format(date, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayPermissions.map((permission) => (
                            <div
                              key={permission.id}
                              className={`text-xs p-1 rounded ${
                                permission.type === 'ferie' ? 'bg-blue-100 text-blue-800' :
                                permission.type === 'permesso' ? 'bg-purple-100 text-purple-800' :
                                permission.type === 'malattia' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                              title={`${permission.member_name} - ${permission.reason} (${getPermissionDurationDays(permission)}g)`}
                            >
                              {`${permission.member_name} (${getPermissionDurationDays(permission)}g)`}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Bilanci Ferie Tab - Solo per i manager */}
        {isManager && (
          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('permessi.balances.title', 'Bilanci Ferie')}</CardTitle>
                <CardDescription>
                  {t('permessi.balances.description', 'Panoramica dei giorni di ferie per ogni membro del team')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {holidayBalances.map((balance) => {
                    const stats = getMemberHolidayStats(balance.member_id);
                    return (
                    <div key={balance.member_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={members.find(m => m.id === balance.member_id)?.avatar_url} />
                          <AvatarFallback>
                            {balance.member_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{balance.member_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {stats.usedDays} {t('permessi.balances.days_used', 'giorni utilizzati')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">{t('permessi.balances.remaining_days', 'Giorni rimanenti')}</div>
                          <div className="text-2xl font-bold text-green-600">
                            {stats.remainingDays}
                          </div>
                        </div>
                        <div className="w-32">
                          <Progress 
                            value={(stats.usedDays / stats.totalDays) * 100} 
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {stats.usedDays}/{stats.totalDays} {t('permessi.balances.days', 'giorni')}
                          </div>
                        </div>
                        {stats.pendingDays > 0 && (
                          <Badge variant="secondary">
                            {stats.pendingDays} {t('permessi.balances.pending', 'in attesa')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
