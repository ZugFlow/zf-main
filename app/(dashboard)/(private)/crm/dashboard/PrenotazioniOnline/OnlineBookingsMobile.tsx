"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocalization } from "@/hooks/useLocalization";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Scissors, 
  DollarSign, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CalendarPlus,
  Edit3
} from "lucide-react";
import { format, parseISO, addMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from '@/utils/getSalonId';
import { sendBookingConfirmationEmail, sendBookingModificationEmail, sendBookingCancellationEmail } from '@/utils/emailService';
import { useCustomTexts } from '@/hooks/useCustomTexts';
import { MobileNavbar } from "../navbarMobile";

const supabase = createClient();

interface OnlineBooking {
  id: string;
  salon_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  requested_date: string;
  requested_time: string;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  service_id: number | null;
  service_name: string;
  service_duration: number;
  service_price: number;
  team_member_id: string | null;
  status: string;
  notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

interface OnlineBookingsMobileProps {
  bookings: OnlineBooking[];
  onUpdateStatus: (bookingId: string, newStatus: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  teamMembers: TeamMember[];
  hasPermission: (permission: string) => boolean;
  // Mobile navbar toggles
  toggleDay?: () => void;
  toggleClients?: () => void;
  toggleOnlineBookings?: () => void;
  showDay?: boolean;
  showClients?: boolean;
  showOnlineBookings?: boolean;
}

interface TeamMember {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export default function OnlineBookingsMobile({ 
  bookings, 
  onUpdateStatus, 
  onRefresh, 
  teamMembers,
  hasPermission,
  toggleDay,
  toggleClients,
  toggleOnlineBookings,
  showDay,
  showClients,
  showOnlineBookings
}: OnlineBookingsMobileProps) {
  const { t, formatDate, formatCurrency, currentLanguage } = useLocalization();
  // Get custom texts
  const { getText } = useCustomTexts();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<OnlineBooking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingBooking, setConvertingBooking] = useState<OnlineBooking | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [converting, setConverting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<OnlineBooking | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

  // Carica i servizi al mount del componente
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const salonId = await getSalonId();
      if (!salonId) return;

      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, duration')
        .eq('salon_id', salonId)
        .eq('status', 'Attivo');

      if (error) {
        console.error('Errore nel caricamento dei servizi:', error);
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Errore nel caricamento dei servizi:', error);
    }
  };

  const convertToAppointment = async () => {
    if (!convertingBooking || !selectedTeamMember || !selectedService) {
      console.error('Dati mancanti per la conversione');
      return;
    }

    // 🔧 FIX: Controlla se l'operazione è già in corso
    if (converting) {
      console.log(`Conversione già in corso per prenotazione ${convertingBooking.id}, skip`);
      return;
    }

    setConverting(true);
    try {
      const salonId = await getSalonId();
      if (!salonId) {
        throw new Error("Impossibile determinare il salone");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Utente non autenticato");
      }

      // Trova il servizio selezionato
      const service = services.find(s => s.id === selectedService);
      if (!service) {
        throw new Error("Servizio non trovato");
      }

      // Calcola l'orario di fine basato sulla durata del servizio
      const startTime = convertingBooking.requested_time;
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date(convertingBooking.requested_date);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = addMinutes(startDate, service.duration);
      const endTime = format(endDate, 'HH:mm');

      // Cerca se esiste già un cliente con la stessa email o telefono
      let customerUuid = null;
      if (convertingBooking.customer_email || convertingBooking.customer_phone) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('customer_uuid')
          .eq('salon_id', salonId)
          .or(
            convertingBooking.customer_email && convertingBooking.customer_phone
              ? `email.eq.${convertingBooking.customer_email},telefono.eq.${convertingBooking.customer_phone}`
              : convertingBooking.customer_email
                ? `email.eq.${convertingBooking.customer_email}`
                : `telefono.eq.${convertingBooking.customer_phone}`
          )
          .single();

        if (existingCustomer) {
          customerUuid = existingCustomer.customer_uuid;
        }
      }

      // Se non esiste, crea un nuovo cliente
      if (!customerUuid) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            nome: convertingBooking.customer_name,
            email: convertingBooking.customer_email,
            telefono: convertingBooking.customer_phone,
            user_id: user.id,
            salon_id: salonId,
            note: `Cliente creato da prenotazione online - ID: ${convertingBooking.id}`
          })
          .select('customer_uuid')
          .single();

        if (customerError) {
          throw new Error(`Errore nella creazione del cliente: ${customerError.message}`);
        }

        customerUuid = newCustomer.customer_uuid;
      }

      // Crea l'appuntamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('orders')
        .insert({
          nome: convertingBooking.customer_name,
          telefono: convertingBooking.customer_phone,
          email: convertingBooking.customer_email,
          data: convertingBooking.requested_date,
          orarioInizio: startTime,
          orarioFine: endTime,
          prezzo: service.price,
          note: convertingBooking.notes || `Prenotazione online convertita - ID: ${convertingBooking.id}`,
          status: 'In corso',
          team_id: selectedTeamMember,
          customer_uuid: customerUuid,
          user_id: user.id,
          salon_id: salonId,
          color_card: ['#3B82F6'], // Colore blu per prenotazioni online
          prefer_card_style: 'filled'
        })
        .select()
        .single();

      if (appointmentError) {
        throw new Error(`Errore nella creazione dell'appuntamento: ${appointmentError.message}`);
      }

      // Aggiungi il servizio all'appuntamento
      const { error: serviceError } = await supabase
        .from('order_services')
        .insert({
          order_id: appointment.id,
          service_id: selectedService,
          price: service.price,
          servizio: service.name
        });

      if (serviceError) {
        throw new Error(`Errore nell'aggiunta del servizio: ${serviceError.message}`);
      }

      // Aggiorna lo status della prenotazione online a 'confirmed' (non 'converted')
      const { error: statusError } = await supabase
        .from('online_bookings')
        .update({ status: 'confirmed' })
        .eq('id', convertingBooking.id);

      if (statusError) {
        throw new Error(`Errore nell'aggiornamento dello status: ${statusError.message}`);
      }

      // Aggiorna la lista locale tramite la funzione onUpdateStatus
      await onUpdateStatus(convertingBooking.id, 'confirmed');

      // Invia email di conferma al cliente
      if (emailNotificationsEnabled && convertingBooking.customer_email) {
        try {
          const emailResult = await sendBookingConfirmationEmail({
            to: convertingBooking.customer_email,
            customerName: convertingBooking.customer_name,
            serviceName: convertingBooking.service_name,
            appointmentDate: convertingBooking.requested_date,
            appointmentTime: convertingBooking.requested_time,
          });

          if (emailResult.success) {
            console.log(`Email di conferma inviata a ${convertingBooking.customer_email}`);
          } else {
            console.warn('Errore nell\'invio email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Errore nell\'invio email:', emailError);
        }
      }

      // Chiudi il modal e resetta i campi
      setIsConvertModalOpen(false);
      setConvertingBooking(null);
      setSelectedTeamMember("");
      setSelectedService("");

      // Ricarica le prenotazioni
      await onRefresh();

    } catch (error) {
      console.error('Errore nella conversione:', error);
      alert(`Errore nella conversione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setConverting(false);
    }
  };

  const openConvertModal = (booking: OnlineBooking) => {
    setConvertingBooking(booking);
    setSelectedTeamMember("");
    setSelectedService("");
    setIsConvertModalOpen(true);
  };

  const openEditModal = (booking: OnlineBooking) => {
    setEditingBooking(booking);
    setEditDate(booking.requested_date);
    setEditTime(booking.requested_time);
    setIsEditModalOpen(true);
  };

  const updateBookingDateTime = async () => {
    if (!editingBooking || !editDate || !editTime) {
      console.error('Dati mancanti per la modifica');
      return;
    }

    setEditing(true);
    try {
      const { error } = await supabase
        .from('online_bookings')
        .update({ 
          requested_date: editDate,
          requested_time: editTime,
          start_time: editTime,
          booking_date: editDate
        })
        .eq('id', editingBooking.id);

      if (error) {
        throw new Error(`Errore nell'aggiornamento: ${error.message}`);
      }

      // Invia email di notifica modifica al cliente
      if (emailNotificationsEnabled && editingBooking.customer_email) {
        try {
          const emailResult = await sendBookingModificationEmail({
            to: editingBooking.customer_email,
            customerName: editingBooking.customer_name,
            serviceName: editingBooking.service_name,
            appointmentDate: editDate,
            appointmentTime: editTime,
          });

          if (emailResult.success) {
            console.log(`Email di modifica inviata a ${editingBooking.customer_email}`);
          } else {
            console.warn('Errore nell\'invio email modifica:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Errore nell\'invio email modifica:', emailError);
        }
      }

      // Ricarica i dati
      await onRefresh();
      
      // Chiudi il modal e resetta i campi
      setIsEditModalOpen(false);
      setEditingBooking(null);
      setEditDate("");
      setEditTime("");

    } catch (error) {
      console.error('Errore nella modifica degli orari:', error);
      alert(`Errore nella modifica degli orari: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setEditing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'converted':
        return <CalendarPlus className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return getText('booking_status_pending', 'In attesa');
      case 'confirmed':
        return getText('booking_status_confirmed', 'Confermato');
      case 'cancelled':
        return getText('booking_status_cancelled', 'Annullato');
      case 'completed':
        return getText('booking_status_completed', 'Completato');
      case 'converted':
        return getText('booking_status_converted', 'Convertito');
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer_email && booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.customer_phone && booking.customer_phone.includes(searchTerm)) ||
      booking.service_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status.toLowerCase() === statusFilter.toLowerCase();
    
    let matchesDate = true;
    
    if (dateFilter === "today") {
      matchesDate = booking.requested_date === format(new Date(), 'yyyy-MM-dd');
    } else if (dateFilter === "week") {
      const bookingDate = new Date(booking.requested_date);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = bookingDate >= weekAgo && bookingDate <= today;
    } else if (dateFilter === "month") {
      const bookingDate = new Date(booking.requested_date);
      const today = new Date();
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      matchesDate = bookingDate >= monthAgo && bookingDate <= today;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const openDetailModal = (booking: OnlineBooking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const getTeamMemberName = (teamMemberId: string | null) => {
    if (!teamMemberId) return getText('booking_team_not_assigned', "Non assegnato");
    const member = teamMembers.find(m => m.id === teamMemberId);
    return member ? member.name : getText('booking_team_member_not_found', "Membro non trovato");
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      
      // Se stiamo confermando una prenotazione, apri il modal di conversione
      if (newStatus === 'confirmed') {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          setConvertingBooking(booking);
          setSelectedTeamMember("");
          setSelectedService("");
          setIsConvertModalOpen(true);
          setUpdatingStatus(null);
          return;
        }
      }

      // Se stiamo cancellando una prenotazione, invia email di notifica
      if (newStatus === 'cancelled') {
        const booking = bookings.find(b => b.id === bookingId);
        if (emailNotificationsEnabled && booking && booking.customer_email) {
          try {
            const emailResult = await sendBookingCancellationEmail({
              to: booking.customer_email,
              customerName: booking.customer_name,
              serviceName: booking.service_name,
              appointmentDate: booking.requested_date,
              appointmentTime: booking.requested_time,
            });

            if (emailResult.success) {
              console.log(`Email di cancellazione inviata a ${booking.customer_email}`);
            } else {
              console.warn('Errore nell\'invio email cancellazione:', emailResult.error);
            }
          } catch (emailError) {
            console.error('Errore nell\'invio email cancellazione:', emailError);
          }
        }
      }
      
      await onUpdateStatus(bookingId, newStatus);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('onlineBookings:updated'));
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Fixed Header with Mobile Navbar for consistency */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white">
        <div className="border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
          <div className="w-full">
            <MobileNavbar
              toggleDay={toggleDay || (() => {})}
              toggleClients={toggleClients || (() => {})}
              toggleOnlineBookings={toggleOnlineBookings || (() => {})}
              showDay={showDay ?? false}
              showClients={showClients ?? false}
              showOnlineBookings={showOnlineBookings ?? true}
              hasPermission={hasPermission || (() => false)}
              canAccess={(requiredPermissions: string[]) => requiredPermissions.every(p => hasPermission?.(p) || false)}
            />
          </div>
        </div>
      </div>
      <div className="pt-14" />
      {/* Header Mobile */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('prenotazioni.title', 'Prenotazioni Online')}</h1>
                      <p className="text-sm text-gray-600">
              {filteredBookings.length} {t('prenotazioni.count', 'prenotazioni')}
            </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={onRefresh}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Cerca prenotazioni..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Toggle */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtri
        </span>
        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4 space-y-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="pending">In attesa</SelectItem>
              <SelectItem value="confirmed">Confermato</SelectItem>
              <SelectItem value="cancelled">Annullato</SelectItem>
              <SelectItem value="completed">Completato</SelectItem>
              <SelectItem value="converted">Convertito</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le date</SelectItem>
              <SelectItem value="today">Oggi</SelectItem>
              <SelectItem value="week">Ultima settimana</SelectItem>
              <SelectItem value="month">Ultimo mese</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Totali</p>
              <p className="text-lg font-bold text-gray-900">{bookings.length}</p>
            </div>
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">In attesa</p>
              <p className="text-lg font-bold text-yellow-600">
                {bookings.filter(b => b.status.toLowerCase() === 'pending').length}
              </p>
            </div>
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna prenotazione trovata</p>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-sm">{booking.customer_name}</span>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(booking.status)}
                      {getStatusLabel(booking.status)}
                    </span>
                  </Badge>
                </div>

                {/* Service Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Scissors className="w-4 h-4" />
                  <span>{booking.service_name}</span>
                  <span className="text-gray-400">•</span>
                  <DollarSign className="w-4 h-4" />
                  <span>€{booking.service_price}</span>
                </div>

                {/* Date and Time */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{format(parseISO(booking.requested_date), 'dd/MM/yyyy', { locale: it })}</span>
                  <span className="text-gray-400">•</span>
                  <Clock className="w-4 h-4" />
                  <span>{booking.requested_time}</span>
                </div>

                {/* Contact Info */}
                {(booking.customer_email || booking.customer_phone) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {booking.customer_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{booking.customer_email}</span>
                      </div>
                    )}
                    {booking.customer_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{booking.customer_phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {hasPermission('canViewOnlineBookingDetails') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailModal(booking)}
                      className="flex-1 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Dettagli
                    </Button>
                  )}
                  
                  {hasPermission('canManageOnlineBookings') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(booking)}
                      className="flex-1 flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modifica
                    </Button>
                  )}
                  
                  {booking.status.toLowerCase() === 'pending' && hasPermission('canManageOnlineBookings') && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        disabled={updatingStatus === booking.id}
                        className="bg-green-600 hover:bg-green-700 px-2"
                      >
                        {updatingStatus === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        disabled={updatingStatus === booking.id}
                        className="px-2"
                      >
                        {updatingStatus === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="w-[92vw] max-w-md sm:w-full sm:max-w-md p-4 sm:p-6 max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Dettagli Prenotazione</DialogTitle>
            <DialogDescription>
              Informazioni complete sulla prenotazione
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Cliente</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Nome:</strong> {selectedBooking.customer_name}</p>
                  <p><strong>Email:</strong> {selectedBooking.customer_email || 'Non fornita'}</p>
                  <p><strong>Telefono:</strong> {selectedBooking.customer_phone || 'Non fornito'}</p>
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Servizio</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Servizio:</strong> {selectedBooking.service_name}</p>
                  <p><strong>Durata:</strong> {selectedBooking.service_duration} min</p>
                  <p><strong>Prezzo:</strong> €{selectedBooking.service_price}</p>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Appuntamento</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Data:</strong> {format(parseISO(selectedBooking.requested_date), 'dd/MM/yyyy', { locale: it })}</p>
                  <p><strong>Orario:</strong> {selectedBooking.requested_time}</p>
                  <p><strong>Membro del team:</strong> {getTeamMemberName(selectedBooking.team_member_id)}</p>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 text-xs ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusLabel(selectedBooking.status)}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Note</h3>
                  <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Status Actions */}
              {selectedBooking.status.toLowerCase() === 'pending' && hasPermission('canManageOnlineBookings') && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, 'confirmed');
                      setIsDetailModalOpen(false);
                    }}
                    disabled={updatingStatus === selectedBooking.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {updatingStatus === selectedBooking.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Conferma e Converti
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, 'cancelled');
                      setIsDetailModalOpen(false);
                    }}
                    disabled={updatingStatus === selectedBooking.id}
                    className="flex-1"
                  >
                    {updatingStatus === selectedBooking.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Annulla
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Appointment Modal */}
      <Dialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <DialogContent className="w-[92vw] max-w-md sm:w-full sm:max-w-md p-4 sm:p-6 max-h-[80vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Approva e Converti in Appuntamento</DialogTitle>
            <DialogDescription>
              Approva questa prenotazione online e convertila in un appuntamento del calendario
            </DialogDescription>
          </DialogHeader>
          
          {convertingBooking && (
            <div className="space-y-4">
              {/* Booking Summary */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Riepilogo</h4>
                <div className="space-y-1 text-xs">
                  <p><strong>Cliente:</strong> {convertingBooking.customer_name}</p>
                  <p><strong>Data:</strong> {format(parseISO(convertingBooking.requested_date), 'dd/MM/yyyy', { locale: it })}</p>
                  <p><strong>Orario:</strong> {convertingBooking.requested_time}</p>
                  <p><strong>Servizio:</strong> {convertingBooking.service_name}</p>
                </div>
              </div>

              {/* Team Member Selection */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Membro del Team *
                </label>
                <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Scegli un membro" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Servizio *
                </label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Scegli un servizio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - €{service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conversion Info */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">Cosa succederà:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• La prenotazione verrà approvata</li>
                  <li>• Nuovo appuntamento nel calendario</li>
                  <li>• Cliente creato se non esiste</li>
                  <li>• Orario fine calcolato automaticamente</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConvertModalOpen(false)}
              disabled={converting}
            >
              Annulla
            </Button>
            <Button 
              onClick={convertToAppointment}
              disabled={converting || !selectedTeamMember || !selectedService}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {converting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Approvazione...
                </>
              ) : (
                <>
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Approva e Converti
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Modifica Orari</DialogTitle>
            <DialogDescription>
              Modifica data e orario della prenotazione
            </DialogDescription>
          </DialogHeader>
          
          {editingBooking && (
            <div className="space-y-4">
              {/* Booking Summary */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Prenotazione</h4>
                <div className="space-y-1 text-xs">
                  <p><strong>Cliente:</strong> {editingBooking.customer_name}</p>
                  <p><strong>Servizio:</strong> {editingBooking.service_name}</p>
                  <p><strong>Data Attuale:</strong> {format(parseISO(editingBooking.requested_date), 'dd/MM/yyyy', { locale: it })}</p>
                  <p><strong>Orario Attuale:</strong> {editingBooking.requested_time}</p>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Nuova Data *
                </label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Nuovo Orario *
                </label>
                <Input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-semibold text-yellow-900 text-sm mb-2">Attenzione:</h4>
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• Verifica disponibilità per il nuovo orario</li>
                  <li>• Il cliente non verrà notificato automaticamente</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
              disabled={editing}
            >
              Annulla
            </Button>
            <Button 
              onClick={updateBookingDateTime}
              disabled={editing || !editDate || !editTime}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Salva
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 