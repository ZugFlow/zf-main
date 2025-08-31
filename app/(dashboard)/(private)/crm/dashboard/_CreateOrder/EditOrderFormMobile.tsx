'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { X, Calendar, Clock, User, Scissors, FileText, Plus, Trash2, Check, ChevronDown, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { createClient } from "@/utils/supabase/client";
import { clsx } from 'clsx';

const supabase = createClient();

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Appointment {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  team_id: string;
  servizio: string;
  accesso: string;
  status: string;
  progresso: number;
  membri?: string[];
  services?: Service[];
  color_card?: string[] | string;
  prefer_card_style?: "filled" | "top" | "bottom" | "left" | "right";
  alone?: string | number;
  note?: string;
  descrizione?: string;
  prezzo?: number;
}

interface EditOrderFormMobileProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSave: (services: Service[], updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string }) => void;
  onDeleteService: (serviceId: string, orderId: string) => void;
  updateModalState?: (isOpen: boolean) => void;
}

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  appointmentName: string;
  onConfirm: () => void;
}

// Modal per eliminare singolo servizio
function DeleteServiceModal({ 
  isOpen, 
  onClose, 
  service, 
  appointmentName, 
  onConfirm 
}: DeleteServiceModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors h-8 w-8"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </Button>
              </motion.div>
              <h1 className="text-base font-bold text-gray-900 flex-1 text-center mx-3 truncate">Elimina Servizio</h1>
              <div className="w-8"></div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-2 text-base">Conferma eliminazione</p>
                <p className="text-sm text-gray-600 mb-6">
                  Sei sicuro di voler eliminare il servizio <span className="font-semibold text-red-600">"{service?.name}"</span> 
                  dall'appuntamento <span className="font-semibold">"{appointmentName}"</span>?
                </p>
                
                {service && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm mb-6"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-red-800">{service.name}</span>
                      <span className="text-red-600 font-bold text-lg">€{service.price.toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}
                
                <p className="text-xs text-gray-500">
                  Questa azione non può essere annullata.
                </p>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="destructive"
                  onClick={onConfirm}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-2xl font-bold transition-all duration-200 active:scale-95 shadow-lg text-base"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina Servizio
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full h-12 text-gray-600 border border-gray-300 hover:bg-gray-50 py-3 rounded-2xl font-bold transition-all duration-200 active:scale-95"
                >
                  Annulla
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function EditOrderFormMobile({
  open,
  onClose,
  appointment,
  onSave,
  onDeleteService,
  updateModalState
}: EditOrderFormMobileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [deleteServiceModal, setDeleteServiceModal] = useState<{
    isOpen: boolean;
    service: Service | null;
  }>({ isOpen: false, service: null });
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const { toast } = useToast();

  // Utility per formattare la data in YYYY-MM-DD (richiesto da input type="date")
  function formatDateForInput(dateStr: string) {
    if (!dateStr) return '';
    // Se già in formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Prova a convertire da altri formati
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  const [editedDate, setEditedDate] = useState<string>('');
  const [editedOrarioInizio, setEditedOrarioInizio] = useState<string>('');
  const [editedOrarioFine, setEditedOrarioFine] = useState<string>('');
  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  // Inizializza i dati quando si apre il modal
  useEffect(() => {
    if (open && appointment) {
      // Debug: log dei servizi dell'appuntamento per vedere la struttura
      console.log('Appointment services:', appointment.services);
      
      // Assicuriamoci che i servizi abbiano la struttura corretta
      const normalizedServices = (appointment.services || []).map((service: any) => {
        // Se il servizio ha già la struttura corretta, usalo così com'è
        if (service.name && typeof service.price === 'number') {
          return service as Service;
        }
        
        // Se il servizio ha una struttura diversa, normalizzala
        return {
          id: String(service.id || service.service_id || ''),
          name: String(service.name || service.servizio || 'Servizio sconosciuto'),
          price: typeof service.price === 'number' ? service.price : parseFloat(String(service.price)) || 0
        } as Service;
      });
      
      console.log('Normalized services:', normalizedServices);
      setServices(normalizedServices);
      
      setIsAddingService(false);
      setSelectedServiceId('');
      setEditedDate(formatDateForInput(appointment.data || ''));
      
      // Arrotonda gli orari esistenti ai 5 minuti più vicini
      const roundedOrarioInizio = roundToNearestFiveMinutes(appointment.orarioInizio || '');
      const roundedOrarioFine = roundToNearestFiveMinutes(appointment.orarioFine || '');
      
      setEditedOrarioInizio(roundedOrarioInizio);
      setEditedOrarioFine(roundedOrarioFine);
      setTimeWarning(null);
      
      // Recupera i servizi disponibili da Supabase
      const fetchServices = async () => {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, price')
          .eq('status', 'Attivo');
        if (!error && data) {
          setAvailableServices(data);
        }
      };
      fetchServices();
    }
  }, [open, appointment]);

  // Genera liste di orari con incrementi di 5 minuti
  const generateTimeOptions = (startHour = 0, endHour = 23): string[] => {
    const times: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  // Memoize time options for performance
  const startTimeOptions = React.useMemo(() => generateTimeOptions(0, 23), []);
  const getEndTimeOptions = React.useCallback((start: string): string[] => {
    if (!/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(start)) return startTimeOptions;
    const [startHour, startMinute] = start.split(":").map(Number);
    const times: string[] = [];
    for (let hour = startHour; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        if (hour === startHour && minute <= startMinute) continue;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  }, [startTimeOptions]);

  // Funzione per arrotondare ai 5 minuti più vicini
  const roundToNearestFiveMinutes = (timeString: string): string => {
    if (!timeString || !/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(timeString)) {
      return timeString;
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 5) * 5;
    
    // Gestisce il caso in cui i minuti arrotondati siano 60
    if (roundedMinutes === 60) {
      const newHours = (hours + 1) % 24;
      return `${newHours.toString().padStart(2, '0')}:00`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
  };

  // Funzione per controllare warning sugli orari
  const checkTimeWarning = (startTime: string, endTime: string) => {
    if (
      startTime && endTime &&
      /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(startTime) &&
      /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(endTime)
    ) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        setTimeWarning("L'orario di fine deve essere maggiore dell'orario di inizio (minimo 5 minuti).");
      } else {
        setTimeWarning(null);
      }
    } else {
      setTimeWarning(null);
    }
  };

  // Gestione cambio orario inizio
  const handleOrarioInizioChange = (value: string) => {
    setEditedOrarioInizio(value);
    // If end time is now invalid, reset it
    if (editedOrarioFine) {
      const [startHour, startMinute] = value.split(":").map(Number);
      const [endHour, endMinute] = editedOrarioFine.split(":").map(Number);
      if (
        endHour < startHour ||
        (endHour === startHour && endMinute <= startMinute)
      ) {
        setEditedOrarioFine("");
      }
    }
    checkTimeWarning(value, editedOrarioFine);
  };

  // Gestione cambio orario fine
  const handleOrarioFineChange = (value: string) => {
    setEditedOrarioFine(value);
    checkTimeWarning(editedOrarioInizio, value);
  };

  const handleDeleteServiceClick = (service: Service) => {
    setDeleteServiceModal({ isOpen: true, service });
  };

  const handleConfirmDelete = async () => {
    const serviceToDelete = deleteServiceModal.service;
    if (!serviceToDelete || !appointment) return;
    setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
    setDeleteServiceModal({ isOpen: false, service: null });
    onDeleteService(serviceToDelete.id, appointment.id);
    toast({ title: "Servizio eliminato" });
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      updateModalState?.(false);
    }
  };

  const handleSave = async () => {
    if (!appointment) return;

    // Controlla se ci sono warning sugli orari
    if (timeWarning) {
      toast({
        title: "Errore validazione",
        description: timeWarning,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Controlla se sono stati modificati data o orari
      const hasDateChanged = editedDate !== appointment?.data;
      const hasOrarioInizioChanged = editedOrarioInizio !== appointment?.orarioInizio;
      const hasOrarioFineChanged = editedOrarioFine !== appointment?.orarioFine;
      const hasAnyTimeDataChanged = hasDateChanged || hasOrarioInizioChanged || hasOrarioFineChanged;
      
      // Aggiorna data e orari se sono stati modificati
      if (hasAnyTimeDataChanged) {
        const updateData: any = {};
        if (hasDateChanged) updateData.data = editedDate;
        if (hasOrarioInizioChanged) updateData.orarioInizio = editedOrarioInizio;
        if (hasOrarioFineChanged) updateData.orarioFine = editedOrarioFine;

        const { error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', appointment.id);
        if (updateError) {
          toast({
            title: "Errore salvataggio",
            description: updateError.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      // Cancella tutti i servizi associati all'appuntamento
      const { error: deleteError } = await supabase
        .from('order_details')
        .delete()
        .eq('order_id', appointment.id);
      if (deleteError) {
        toast({
          title: "Errore rimozione servizi",
          description: deleteError.message,
          variant: "destructive",
        });
        return;
      }
      
      // Inserisci tutti i servizi selezionati con batch insert
      const orderServicesData = services.map(service => ({
        order_id: appointment.id,
        service_id: Number(service.id),
        price: service.price,
        service_name: service.name
      }));
      
      if (orderServicesData.length > 0) {
        const { error: insertError } = await supabase
          .from('order_details')
          .insert(orderServicesData);
        if (insertError) {
          toast({
            title: "Errore salvataggio servizi",
            description: insertError.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      // Comunica al componente padre i servizi aggiornati e i dati modificati (se cambiati)
      const updatedData = hasAnyTimeDataChanged ? {
        ...(hasDateChanged && { data: editedDate }),
        ...(hasOrarioInizioChanged && { orarioInizio: editedOrarioInizio }),
        ...(hasOrarioFineChanged && { orarioFine: editedOrarioFine })
      } : undefined;
      
      onSave(services, updatedData);
      
      handleClose();
      toast({
        title: "Dati salvati",
        description: hasAnyTimeDataChanged 
          ? "I servizi, la data e gli orari sono stati aggiornati con successo"
          : "I servizi sono stati aggiornati con successo",
      });
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

  if (!appointment) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
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
                    onClick={handleClose}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors h-8 w-8"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </Button>
                </motion.div>
                <h1 className="text-base font-bold text-gray-900 flex-1 text-center mx-3 truncate">
                  Modifica Appuntamento
                </h1>
                <div className="w-8"></div> {/* Spacer for centering */}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Client Name */}
                  {appointment.nome && (
                    <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-violet-900 text-lg">{appointment.nome}</h3>
                          <p className="text-sm text-violet-700">Cliente</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date and Time Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data e Orario
                    </h4>
                    <div className="space-y-3">
                      {/* Date Input */}
                      <div>
                        <Label htmlFor="editedDate" className="text-sm font-medium text-gray-700 block mb-2">
                          Data Appuntamento
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            id="editedDate"
                            type="date"
                            value={editedDate}
                            onChange={e => setEditedDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-3 pl-10 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      {/* Time Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="orarioInizio" className="text-sm font-medium text-gray-700 block mb-2">
                            Orario Inizio
                          </Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Select value={editedOrarioInizio} onValueChange={handleOrarioInizioChange}>
                              <SelectTrigger className="w-full rounded-lg border border-gray-300 px-3 py-3 pl-10 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
                                <SelectValue placeholder="-- Seleziona --" />
                              </SelectTrigger>
                              <SelectContent style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                {startTimeOptions.map(time => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="orarioFine" className="text-sm font-medium text-gray-700 block mb-2">
                            Orario Fine
                          </Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Select value={editedOrarioFine} onValueChange={handleOrarioFineChange}>
                              <SelectTrigger className="w-full rounded-lg border border-gray-300 px-3 py-3 pl-10 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
                                <SelectValue placeholder="-- Seleziona --" />
                              </SelectTrigger>
                              <SelectContent style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                {getEndTimeOptions(editedOrarioInizio).map(time => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Warning per orari non validi */}
                      {timeWarning && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 text-center"
                        >
                          {timeWarning}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Services Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        Servizi
                      </h4>
                      <Badge className="bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200 font-semibold px-3 py-1 rounded-full">
                        Totale: €{totalPrice.toFixed(2)}
                      </Badge>
                    </div>
                    
                    {services.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-lg p-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <Scissors className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="font-medium mb-1">Nessun servizio presente</p>
                        <p className="text-sm">Aggiungi il primo servizio utilizzando il pulsante qui sotto</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {services.map((service, index) => (
                          <motion.div
                            key={service.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <div>
                              <span className="text-sm font-medium text-gray-900">{service.name}</span>
                              <span className="text-sm font-semibold text-violet-600 block">
                                €{service.price.toFixed(2)}
                              </span>
                            </div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteServiceClick(service)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Service Section */}
                    {isAddingService && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                      >
                        <Label htmlFor="selectService" className="text-sm font-medium text-gray-700 block mb-2">
                          Seleziona servizio
                        </Label>
                        <div className="relative">
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          <select
                            id="selectService"
                            className="w-full border border-gray-300 rounded-lg px-3 py-3 pr-10 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 appearance-none"
                            value={selectedServiceId}
                            onChange={e => {
                              const value = e.target.value;
                              setSelectedServiceId(value);
                              if (value) {
                                const selectedService = availableServices.find(s => String(s.id) === value);
                                if (selectedService && !services.some(s => String(s.id) === String(selectedService.id))) {
                                  setServices(prev => [...prev, selectedService]);
                                  setSelectedServiceId('');
                                  setIsAddingService(false);
                                  toast({ title: "Servizio aggiunto" });
                                }
                              }
                            }}
                          >
                            <option value="">-- Seleziona --</option>
                            {availableServices.map(s => (
                              <option
                                key={s.id}
                                value={s.id}
                                disabled={services.some(serv => String(serv.id) === String(s.id))}
                              >
                                {s.name} (€{s.price.toFixed(2)})
                                {services.some(serv => String(serv.id) === String(s.id)) ? ' (già aggiunto)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Add Service Button */}
                    {!isAddingService && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4"
                      >
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={() => setIsAddingService(true)}
                            variant="outline"
                            className="w-full bg-white text-violet-600 hover:bg-violet-50 hover:text-violet-700 border border-violet-200 transition-all duration-300 py-3 rounded-lg font-medium"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Aggiungi Servizio
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>

                  {/* Notes Section */}
                  {appointment.descrizione && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Note
                      </h4>
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-900">{appointment.descrizione}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Salvataggio...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Check className="w-4 h-4 mr-2" />
                            Salva Modifiche
                          </div>
                        )}
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Annulla
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal di conferma eliminazione */}
      <DeleteServiceModal
        isOpen={deleteServiceModal.isOpen}
        onClose={() => setDeleteServiceModal({ isOpen: false, service: null })}
        service={deleteServiceModal.service}
        appointmentName={appointment?.nome || ''}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
