'use client';

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, X, AlertTriangle, Clock, Calendar, User, Check, ChevronDown, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from "@/utils/supabase/client";
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { APPOINTMENT_STATUSES, getStatusColor } from '@/components/status';
import { dispatchAppointmentEvent } from '../utils/appointmentEvents';

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
}

interface EditServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSave: (services: Service[], updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string; status?: string }) => void;
  onDeleteService: (serviceId: string, orderId: string) => void;
}

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  appointmentName: string;
  onConfirm: () => void;
}

// Modal per eliminare singolo servizio
export function DeleteServiceModal({ 
  isOpen, 
  onClose, 
  service, 
  appointmentName, 
  onConfirm 
}: DeleteServiceModalProps) {
  const isMobile = useIsMobile();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${
              isMobile 
                ? "w-full h-full max-w-full max-h-full rounded-none overflow-y-auto bg-white border-none shadow-none p-0 flex flex-col"
                : "w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            }`}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`${
              isMobile 
                ? "sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-3 shadow-sm"
                : "bg-white border-b border-gray-200 flex items-center justify-between p-4"
            }`}>
              {isMobile ? (
                <>
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
                </>
              ) : (
                <>
                  <h1 className="text-lg font-bold text-gray-900">Elimina Servizio</h1>
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
                </>
              )}
            </div>

            {/* Content */}
            <div className={`${
              isMobile 
                ? "flex-1 overflow-y-auto p-4"
                : "p-6"
            }`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center ${isMobile ? "py-8" : "py-4"}`}
              >
                <div className={`${
                  isMobile 
                    ? "w-16 h-16"
                    : "w-12 h-12"
                } bg-gradient-to-br from-red-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                  <AlertTriangle className={`${
                    isMobile 
                      ? "h-8 w-8"
                      : "h-6 w-6"
                  } text-red-600`} />
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
            <div className={`${
              isMobile 
                ? "sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3"
                : "bg-white border-t border-gray-200 p-4 space-y-3"
            }`}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="destructive"
                  onClick={onConfirm}
                  className={`w-full ${
                    isMobile 
                      ? "h-12 py-3 rounded-2xl text-base"
                      : "h-10 py-2 rounded-xl text-sm"
                  } bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-all duration-200 active:scale-95 shadow-lg`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina Servizio
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className={`w-full ${
                    isMobile 
                      ? "h-12 py-3 rounded-2xl text-base"
                      : "h-10 py-2 rounded-xl text-sm"
                  } text-gray-600 border border-gray-300 hover:bg-gray-50 font-bold transition-all duration-200 active:scale-95`}
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

// Modal principale per gestire i servizi
export function EditServicesModal({ 
  isOpen, 
  onClose, 
  appointment, 
  onSave,
  onDeleteService 
}: EditServicesModalProps) {
  const isMobile = useIsMobile();
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [deleteServiceModal, setDeleteServiceModal] = useState<{
    isOpen: boolean;
    service: Service | null;
  }>({ isOpen: false, service: null });
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [originalServices, setOriginalServices] = useState<Service[]>([]);
  const [servicesModified, setServicesModified] = useState(false);
  const { toast } = useToast();

  // Stato per la data modificabile
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

  const [editedDate, setEditedDate] = useState<string>(appointment ? formatDateForInput(appointment.data) : '');
  const [editedOrarioInizio, setEditedOrarioInizio] = useState<string>(appointment?.orarioInizio || '');
  const [editedOrarioFine, setEditedOrarioFine] = useState<string>(appointment?.orarioFine || '');
  const [editedStatus, setEditedStatus] = useState<string>(appointment?.status || '');
  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  // Inizializza i servizi quando si apre il modal
  useEffect(() => {
    if (isOpen && appointment) {
      // Debug: log dei servizi dell'appuntamento per vedere la struttura
      console.log('Appointment services:', appointment.services);
      console.log('Appointment ID:', appointment.id);
      console.log('Appointment name:', appointment.nome);
      
      // Carica i servizi direttamente dal database per assicurarsi che siano corretti
      const loadServicesFromDatabase = async () => {
        try {
          console.log('Loading services from database for appointment:', appointment.id);
          
          const { data: orderServices, error } = await supabase
            .from('order_services')
            .select(`
              service_id,
              price,
              servizio
            `)
            .eq('order_id', appointment.id);
          
          if (error) {
            console.error('Error loading order services:', error);
            return;
          }
          
          console.log('Order services from database:', orderServices);
          console.log('Number of services found:', orderServices?.length || 0);
          
          // Normalizza i servizi dal database e rimuovi eventuali duplicati
          const serviceMap = new Map();
          (orderServices || []).forEach((orderService: any) => {
            const serviceId = String(orderService.service_id);
            console.log('Processing service:', { serviceId, name: orderService.servizio, price: orderService.price });
            // Se il servizio esiste già, mantieni quello con il prezzo più alto (più recente)
            if (!serviceMap.has(serviceId) || serviceMap.get(serviceId).price < orderService.price) {
              serviceMap.set(serviceId, {
                id: serviceId,
                name: orderService.servizio || 'Servizio sconosciuto',
                price: orderService.price
              });
            }
          });
          
          const normalizedServices = Array.from(serviceMap.values());
          console.log('Final normalized services (duplicates removed):', normalizedServices);
          console.log('Number of normalized services:', normalizedServices.length);
          
          // Fallback: se non ci sono servizi nel database ma c'è un servizio nel campo legacy
          if (normalizedServices.length === 0 && appointment.servizio) {
            console.log('No services found in database, using legacy servizio field:', appointment.servizio);
            const fallbackService = {
              id: 'legacy_service',
              name: appointment.servizio,
              price: 0 // Prezzo sconosciuto per servizi legacy
            };
            normalizedServices.push(fallbackService);
            console.log('Added fallback service:', fallbackService);
          }
          
          // Fallback: se non ci sono servizi nel database ma ci sono servizi nel campo services dell'appuntamento
          if (normalizedServices.length === 0 && appointment.services && appointment.services.length > 0) {
            console.log('No services found in database, using services from appointment object:', appointment.services);
            normalizedServices.push(...appointment.services);
            console.log('Added services from appointment object:', appointment.services);
          }
          
          setServices(normalizedServices);
          setOriginalServices(normalizedServices); // Salva i servizi originali
        } catch (error) {
          console.error('Error in loadServicesFromDatabase:', error);
        }
      };
      
      // Carica sempre i servizi dal database quando si apre il modal
      // Questo assicura che i servizi siano sempre aggiornati per ogni appuntamento
      loadServicesFromDatabase();
      
      setIsAddingService(false);
      setNewServiceName('');
      setNewServicePrice('');
      setEditedDate(formatDateForInput(appointment.data || ''));
      
      // Arrotonda gli orari esistenti ai 5 minuti più vicini
      const roundedOrarioInizio = roundToNearestFiveMinutes(appointment.orarioInizio || '');
      const roundedOrarioFine = roundToNearestFiveMinutes(appointment.orarioFine || '');
      
      setEditedOrarioInizio(roundedOrarioInizio);
      setEditedOrarioFine(roundedOrarioFine);
      setEditedStatus(appointment.status || '');
      setTimeWarning(null);
      
      // Recupera i servizi disponibili da Supabase
      const fetchServices = async () => {
        try {
          const { data, error } = await supabase
            .from('services')
            .select('id, name, price')
            .eq('status', 'Attivo');
          if (error) {
            console.error('Error fetching services:', error);
            toast({
              title: "Errore caricamento servizi",
              description: error.message,
              variant: "destructive",
            });
            return;
          }
          if (data) {
            console.log('Available services loaded:', data.length);
            setAvailableServices(data);
          }
        } catch (error) {
          console.error('Error in fetchServices:', error);
        }
      };
      fetchServices();
    }
  }, [isOpen, appointment?.id]); // Cambiato da [isOpen, appointment] a [isOpen, appointment?.id]

  // Reset services when appointment changes
  useEffect(() => {
    if (appointment && isOpen) {
      // Reset services when appointment changes
      setServices([]);
      setOriginalServices([]);
      setServicesModified(false);
      setIsAddingService(false);
      setNewServiceName('');
      setNewServicePrice('');
    }
  }, [appointment?.id, isOpen]);

  // Genera liste di orari con incrementi di 5 minuti
  // Time range: 00:00 to 23:55, 5-min increments
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

  // Aggiungi servizio selezionato dal select
  const handleAddService = (serviceId: string) => {
    const selectedService = availableServices.find(s => String(s.id) === serviceId);
    if (selectedService) {
      // Controlla se il servizio esiste già (sia come servizio esistente che come nuovo)
      const serviceExists = services.some(s => 
        s.id === String(selectedService.id) || s.id === `temp_${selectedService.id}`
      );
      
      if (!serviceExists) {
        // Crea un servizio con ID temporaneo per i nuovi servizi
        const newService = {
          ...selectedService,
          id: `temp_${selectedService.id}` // Aggiungi prefisso temp_ per identificare i nuovi servizi
        };
        
        // Controllo aggiuntivo per prevenire duplicazioni
        const isDuplicate = services.some(s => 
          s.name === selectedService.name && s.price === selectedService.price
        );
        
        if (isDuplicate) {
          toast({ 
            title: "Servizio duplicato",
            description: "Un servizio identico è già presente nell'appuntamento",
            variant: "destructive"
          });
          return;
        }
        
        setServices(prev => [...prev, newService]);
        setIsAddingService(false);
        setServicesModified(true);
        toast({ title: "Servizio aggiunto" });
      } else {
        toast({ 
          title: "Servizio già presente",
          description: "Questo servizio è già stato aggiunto all'appuntamento",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteServiceClick = (service: Service) => {
    setDeleteServiceModal({ isOpen: true, service });
  };

  const handleConfirmDelete = async () => {
    const serviceToDelete = deleteServiceModal.service;
    if (!serviceToDelete || !appointment) return;
    
    try {
      console.log('Deleting service:', {
        serviceId: serviceToDelete.id,
        serviceIdNumber: Number(serviceToDelete.id),
        orderId: appointment.id,
        serviceName: serviceToDelete.name
      });
      
      // Remove from local state immediately
      setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      setServicesModified(true);
      setDeleteServiceModal({ isOpen: false, service: null });
      
      // Call the parent's onDeleteService with the correct parameters
      // Il componente padre si occuperà dell'eliminazione dal database
      onDeleteService(serviceToDelete.id, appointment.id);
      toast({ title: "Servizio rimosso" });
    } catch (error) {
      console.error('Delete service error:', error);
      toast({
        title: "Errore rimozione",
        description: "Si è verificato un errore durante la rimozione del servizio",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      // Controlla se ci sono warning sugli orari
      if (timeWarning) {
        toast({
          title: "Errore validazione",
          description: timeWarning,
          variant: "destructive",
        });
        return;
      }

      // Controlla se sono stati modificati data, orari o status
      const hasDateChanged = editedDate !== appointment?.data;
      const hasOrarioInizioChanged = editedOrarioInizio !== appointment?.orarioInizio;
      const hasOrarioFineChanged = editedOrarioFine !== appointment?.orarioFine;
      const hasStatusChanged = editedStatus !== appointment?.status;
      const hasAnyDataChanged = hasDateChanged || hasOrarioInizioChanged || hasOrarioFineChanged || hasStatusChanged;

      console.log('🔍 [Modal] Status change detected:', {
        originalStatus: appointment?.status,
        newStatus: editedStatus,
        hasStatusChanged,
        hasAnyDataChanged
      });

      let updatedFields: { data?: string; orarioInizio?: string; orarioFine?: string; status?: string } | undefined;

      // Aggiorna direttamente su Supabase se ci sono modifiche
      if (hasAnyDataChanged && appointment) {
        updatedFields = {};
        
        if (hasDateChanged) updatedFields.data = editedDate;
        if (hasOrarioInizioChanged) updatedFields.orarioInizio = editedOrarioInizio;
        if (hasOrarioFineChanged) updatedFields.orarioFine = editedOrarioFine;
        if (hasStatusChanged) updatedFields.status = editedStatus;
        
        console.log('📤 [Modal] Updating appointment on Supabase:', {
          appointmentId: appointment.id,
          updateData: updatedFields
        });
        
        const { error } = await supabase
          .from("orders")
          .update(updatedFields)
          .eq("id", appointment.id);
        
        if (error) {
          console.error("Error updating appointment:", error);
          toast({
            title: "Errore aggiornamento",
            description: "Si è verificato un errore durante l'aggiornamento dell'appuntamento",
            variant: "destructive",
          });
          return;
        } else {
          console.log('✅ [Modal] Appointment updated successfully');
          toast({
            title: "Appuntamento aggiornato",
            description: "Le modifiche sono state salvate con successo",
          });
          
          // Force a small delay to ensure the real-time subscription picks up the change
          setTimeout(() => {
            console.log('🔄 [Modal] Triggering real-time update for appointment:', appointment.id);
            // Dispatch a custom event to force refresh if needed
            dispatchAppointmentEvent('appointment-updated', {
              appointmentId: appointment.id,
              updateData: updatedFields
            });
          }, 100);
        }
      }
      
      // Comunica al componente padre solo i servizi aggiornati
      onSave(services, updatedFields);
      
      setServicesModified(false);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Errore preparazione",
        description: "Si è verificato un errore durante la preparazione dei dati",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setIsAddingService(false);
  };

  const handleClose = () => {
    // Reset services to original state if modified but not saved
    if (servicesModified) {
      setServices(originalServices);
      setServicesModified(false);
    }
    onClose();
  };

  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

  if (!appointment) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex min-h-screen min-w-full items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-0 border border-gray-100 flex flex-col justify-center mx-auto max-h-[90vh]"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
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
                <h1 className="text-base font-bold text-gray-900 flex-1 text-center mx-3 truncate">Modifica Appuntamento</h1>
                <div className="w-8"></div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Client Info Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-200 rounded-xl flex items-center justify-center shadow-sm">
                      <User className="h-6 w-6 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-gray-900 text-lg">{appointment.nome}</h2>
                      <p className="text-sm text-violet-700 font-medium">Cliente</p>
                    </div>
                  </div>
                </motion.div>

                {/* Date and Time Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <div className="border-b border-gray-200 pb-3 mb-4">
                    <h2 className="text-base font-medium text-gray-900 mb-1">Data e Orario</h2>
                    <p className="text-sm text-gray-600">Modifica la data e gli orari dell'appuntamento</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Date */}
                    <div>
                      <Label htmlFor="editedDate" className="text-sm font-medium text-gray-900 block mb-2">
                        Data Appuntamento
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          id="editedDate"
                          type="date"
                          value={editedDate}
                          onChange={e => setEditedDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-3 py-3 pl-10 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    
                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="orarioInizio" className="text-sm font-medium text-gray-900 block mb-2">
                          Orario Inizio
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Select value={editedOrarioInizio} onValueChange={handleOrarioInizioChange}>
                            <SelectTrigger className="w-full rounded-xl border border-gray-300 px-3 py-3 pl-10 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
                              <SelectValue placeholder="-- Seleziona --" />
                            </SelectTrigger>
                            <SelectContent style={{ maxHeight: '180px', overflowY: 'auto' }} className="z-[10000]">
                              {startTimeOptions.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="orarioFine" className="text-sm font-medium text-gray-900 block mb-2">
                          Orario Fine
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Select value={editedOrarioFine} onValueChange={handleOrarioFineChange}>
                            <SelectTrigger className="w-full rounded-xl border border-gray-300 px-3 py-3 pl-10 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
                              <SelectValue placeholder="-- Seleziona --" />
                            </SelectTrigger>
                            <SelectContent style={{ maxHeight: '180px', overflowY: 'auto' }} className="z-[10000]">
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
                        className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 text-center"
                      >
                        {timeWarning}
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Status Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="border-b border-gray-200 pb-3 mb-4">
                    <h2 className="text-base font-medium text-gray-900 mb-1">Stato Appuntamento</h2>
                    <p className="text-sm text-gray-600">Modifica lo stato dell'appuntamento</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center shadow-sm">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                                         <div className="flex-1">
                       <Label htmlFor="appointmentStatus" className="text-sm font-medium text-gray-900 block mb-2">
                         Stato Appuntamento
                       </Label>
                       
                       {/* Current Status Badge */}
                       {editedStatus && (
                         <div className="mb-3">
                           <Badge 
                             className={clsx(
                               "text-xs font-medium px-2 py-1 rounded-full",
                               getStatusColor(editedStatus) === 'blue' && "bg-blue-100 text-blue-800",
                               getStatusColor(editedStatus) === 'sky' && "bg-sky-100 text-sky-800",
                               getStatusColor(editedStatus) === 'yellow' && "bg-yellow-100 text-yellow-800",
                               getStatusColor(editedStatus) === 'amber' && "bg-amber-100 text-amber-800",
                               getStatusColor(editedStatus) === 'indigo' && "bg-indigo-100 text-indigo-800",
                               getStatusColor(editedStatus) === 'green' && "bg-green-100 text-green-800",
                               getStatusColor(editedStatus) === 'red' && "bg-red-100 text-red-800",
                               getStatusColor(editedStatus) === 'rose' && "bg-rose-100 text-rose-800",
                               getStatusColor(editedStatus) === 'purple' && "bg-purple-100 text-purple-800",
                               getStatusColor(editedStatus) === 'orange' && "bg-orange-100 text-orange-800",
                               getStatusColor(editedStatus) === 'emerald' && "bg-emerald-100 text-emerald-800",
                               getStatusColor(editedStatus) === 'teal' && "bg-teal-100 text-teal-800",
                               getStatusColor(editedStatus) === 'cyan' && "bg-cyan-100 text-cyan-800",
                               getStatusColor(editedStatus) === 'lime' && "bg-lime-100 text-lime-800",
                               getStatusColor(editedStatus) === 'zinc' && "bg-zinc-100 text-zinc-800"
                             )}
                           >
                             {APPOINTMENT_STATUSES.find(s => s.value === editedStatus)?.label || editedStatus}
                           </Badge>
                         </div>
                       )}
                       
                       <Select value={editedStatus} onValueChange={(value) => {
                         setEditedStatus(value);
                       }}>
                         <SelectTrigger className="w-full rounded-xl border border-gray-300 px-3 py-3 pl-10 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white">
                           <SelectValue placeholder="-- Seleziona --" />
                         </SelectTrigger>
                         <SelectContent style={{ maxHeight: '180px', overflowY: 'auto' }} className="z-[10000]">
                           {APPOINTMENT_STATUSES.map(status => (
                             <SelectItem 
                               key={status.value} 
                               value={status.value} 
                               className="flex items-center"
                             >
                               <span className="text-gray-900">{status.label}</span>
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                  </div>
                </motion.div>

                {/* Services Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="border-b border-gray-200 pb-3 mb-4">
                    <h2 className="text-base font-medium text-gray-900 mb-1">Servizi</h2>
                    <p className="text-sm text-gray-600">Gestisci i servizi dell'appuntamento</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Servizi attuali ({services.length})
                    </h3>
                    <Badge className="bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200 font-semibold px-3 py-1 rounded-full">
                      Totale: €{totalPrice.toFixed(2)}
                    </Badge>
                  </div>
                  
                  {services.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Edit2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="font-medium mb-1">Nessun servizio presente</p>
                      <p className="text-sm">Aggiungi il primo servizio utilizzando il pulsante qui sotto</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {services.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 block">
                              {service.name}
                            </span>
                            <span className="text-green-600 font-semibold text-sm">
                              €{service.price.toFixed(2)}
                            </span>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteServiceClick(service)}
                              className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
                
                {/* Add Service Section */}
                {isAddingService && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <div className="border-b border-gray-200 pb-3 mb-4">
                      <h2 className="text-base font-medium text-gray-900 mb-1">Aggiungi Servizio</h2>
                      <p className="text-sm text-gray-600">Seleziona un servizio dalla lista</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="selectService" className="text-sm font-medium text-gray-900 block mb-2">
                        Seleziona servizio
                      </Label>
                      <div className="relative">
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <select
                          id="selectService"
                          className="w-full border border-gray-300 rounded-xl px-3 py-3 pr-10 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 appearance-none"
                          value=""
                          onChange={e => {
                            const value = e.target.value;
                            if (value) {
                              handleAddService(value);
                            }
                          }}
                        >
                          <option value="">-- Seleziona un servizio --</option>
                          {availableServices.map(s => (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={services.some(serv => 
                                serv.id === String(s.id) || serv.id === `temp_${s.id}`
                              )}
                            >
                              {s.name} (€{s.price.toFixed(2)})
                              {services.some(serv => 
                                serv.id === String(s.id) || serv.id === `temp_${s.id}`
                              ) ? ' (già aggiunto)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Pulsante per chiudere la sezione aggiunta servizio */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={cancelEdit}
                          variant="outline"
                          className="w-full text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-xl"
                        >
                          Chiudi
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Add Service Button */}
                {!isAddingService && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setIsAddingService(true)}
                        variant="outline"
                        className="w-full bg-white text-violet-600 hover:bg-violet-50 hover:text-violet-700 border border-violet-200 transition-all duration-300 py-3 rounded-xl font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Aggiungi Servizio
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </div>
              
              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={handleSave}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 rounded-2xl font-bold transition-all duration-200 active:scale-95 shadow-lg text-base"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Salva Modifiche
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
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
      
      {/* Modal di conferma eliminazione */}
      <DeleteServiceModal
        isOpen={deleteServiceModal.isOpen}
        onClose={() => setDeleteServiceModal({ isOpen: false, service: null })}
        service={deleteServiceModal.service}
        appointmentName={appointment.nome}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
