'use client';

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, X, AlertTriangle } from 'lucide-react';
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
}

interface EditServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSave: (services: Service[], updatedData?: { data?: string; orarioInizio?: string; orarioFine?: string }) => void;
  onDeleteService: (serviceId: string) => void;
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border border-gray-200 shadow-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-red-600 font-semibold text-center">
            <AlertTriangle className="w-5 h-5" />
            Elimina Servizio
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 text-center">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Sei sicuro di voler eliminare il servizio <span className="font-semibold">"{service?.name}"</span> 
            dall'appuntamento <span className="font-semibold">"{appointmentName}"</span>?
          </p>
          
          {service && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg p-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium text-red-800">{service.name}</span>
                <span className="text-red-600 font-semibold">€{service.price.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            Questa azione non può essere annullata.
          </p>
        </div>

        <DialogFooter className="gap-2 flex flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 border border-[#e5e7eb] hover:bg-gray-50/90 hover:text-gray-700 transition-all duration-200 text-center justify-center"
          >
            Annulla
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm transition-all duration-200 text-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Elimina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
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
  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  // Inizializza i servizi quando si apre il modal
  useEffect(() => {
    if (isOpen && appointment) {
      // Debug: log dei servizi dell'appuntamento per vedere la struttura
      console.log('Appointment services:', appointment.services);
      
      // Assicuriamoci che i servizi abbiano la struttura corretta
      const normalizedServices = (appointment.services || []).map((service: any) => {
        // Se il servizio ha già la struttura corretta, usalo così com'è
        if (service.name && typeof service.price === 'number') {
          return service as Service;
        }
        
        // Se il servizio ha una struttura diversa, normalizzala
        // Gestisci tutti i possibili campi per l'ID
        const serviceId = service.id || service.service_id || service.id_service || '';
        
        // Gestisci tutti i possibili campi per il nome
        const serviceName = service.name || service.servizio || service.nome || service.service_name || 'Servizio sconosciuto';
        
        // Gestisci tutti i possibili campi per il prezzo
        let servicePrice = 0;
        if (typeof service.price === 'number') {
          servicePrice = service.price;
        } else if (service.price !== undefined && service.price !== null) {
          servicePrice = parseFloat(String(service.price)) || 0;
        } else if (service.prezzo !== undefined && service.prezzo !== null) {
          servicePrice = typeof service.prezzo === 'number' ? service.prezzo : parseFloat(String(service.prezzo)) || 0;
        }
        
        return {
          id: String(serviceId),
          name: String(serviceName),
          price: servicePrice
        } as Service;
      }).filter(service => {
        // Filtra servizi vuoti o invalidi
        return service.id && service.name && service.name !== 'Servizio sconosciuto' && service.price >= 0;
      });
      
      // Rimuovi duplicati basati su service_id
      const uniqueNormalizedServices = normalizedServices.reduce((acc, service) => {
        const existingIndex = acc.findIndex(s => s.id === service.id);
        if (existingIndex === -1) {
          acc.push(service);
        } else {
          // Se esiste già, mantieni quello con il prezzo più alto o il nome più lungo
          const existing = acc[existingIndex];
          if (service.price > existing.price || service.name.length > existing.name.length) {
            acc[existingIndex] = service;
          }
        }
        return acc;
      }, [] as Service[]);
      
      console.log('Normalized services:', normalizedServices);
      console.log('Unique normalized services:', uniqueNormalizedServices);
      setServices(uniqueNormalizedServices);
      
      setIsAddingService(false);
      setNewServiceName('');
      setNewServicePrice('');
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
  }, [isOpen, appointment]);

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
  const handleAddService = () => {
    const selectedService = availableServices.find(s => String(s.id) === selectedServiceId);
    if (selectedService && !services.some(s => String(s.id) === String(selectedService.id))) {
      setServices(prev => [...prev, selectedService]);
      setSelectedServiceId('');
      setIsAddingService(false);
      toast({ title: "Servizio aggiunto" });
    }
  };

  const handleDeleteServiceClick = (service: Service) => {
    setDeleteServiceModal({ isOpen: true, service });
  };

  const handleConfirmDelete = async () => {
    const serviceToDelete = deleteServiceModal.service;
    if (!serviceToDelete) return;
    setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
    setDeleteServiceModal({ isOpen: false, service: null });
    onDeleteService(serviceToDelete.id);
    toast({ title: "Servizio eliminato" });
  };

  const handleSave = async () => {
    // Controlla se ci sono warning sugli orari
    if (timeWarning) {
      toast({
        title: "Errore validazione",
        description: timeWarning,
        variant: "destructive",
      });
      return;
    }

    // Debug: log dei servizi che stiamo per salvare
    console.log('Saving services:', services);
    console.log('Services count:', services.length);

    // Valida i servizi prima di salvare
    const validServices = services.filter(service => {
      const isValid = service.id && service.name && typeof service.price === 'number' && service.price >= 0;
      if (!isValid) {
        console.warn('Invalid service found:', service);
      }
      return isValid;
    });
    
    if (validServices.length !== services.length) {
      console.warn('Some services were invalid and filtered out:', {
        original: services.length,
        valid: validServices.length
      });
    }
    
    // Usa solo i servizi validi
    const servicesToSave = validServices;

    // Controlla se sono stati modificati data o orari
    const hasDateChanged = editedDate !== appointment?.data;
    const hasOrarioInizioChanged = editedOrarioInizio !== appointment?.orarioInizio;
    const hasOrarioFineChanged = editedOrarioFine !== appointment?.orarioFine;
    const hasAnyTimeDataChanged = hasDateChanged || hasOrarioInizioChanged || hasOrarioFineChanged;
    
    if (appointment) {
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
          console.error('Error updating order:', updateError);
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
        .from('order_services')
        .delete()
        .eq('order_id', appointment.id);
      if (deleteError) {
        console.error('Error deleting existing services:', deleteError);
        toast({
          title: "Errore rimozione servizi",
          description: deleteError.message,
          variant: "destructive",
        });
        return;
      }
      
      // Inserisci tutti i servizi selezionati con batch insert
      // Rimuovi duplicati basati su service_id per evitare violazioni del constraint unique
      const uniqueServices = servicesToSave.reduce((acc, service) => {
        const existingIndex = acc.findIndex(s => s.id === service.id);
        if (existingIndex === -1) {
          acc.push(service);
        } else {
          // Se esiste già, aggiorna il prezzo se necessario
          acc[existingIndex] = service;
        }
        return acc;
      }, [] as Service[]);
      
      const orderServicesData = uniqueServices.map(service => ({
        order_id: appointment.id,
        service_id: Number(service.id),
        price: service.price,
        servizio: service.name
      }));
      
      console.log('Order services data to insert:', orderServicesData);
      console.log('Unique services count:', uniqueServices.length);
      
      if (orderServicesData.length > 0) {
        const { error: insertError } = await supabase
          .from('order_services')
          .insert(orderServicesData);
        if (insertError) {
          console.error('Error inserting services:', insertError);
          toast({
            title: "Errore salvataggio servizi",
            description: insertError.message,
            variant: "destructive",
          });
          return;
        }
        
        console.log('Successfully inserted', orderServicesData.length, 'services');
      }
    }
    
    // Comunica al componente padre i servizi aggiornati e i dati modificati (se cambiati)
    const updatedData = hasAnyTimeDataChanged ? {
      ...(hasDateChanged && { data: editedDate }),
      ...(hasOrarioInizioChanged && { orarioInizio: editedOrarioInizio }),
      ...(hasOrarioFineChanged && { orarioFine: editedOrarioFine })
    } : undefined;
    
    onSave(servicesToSave, updatedData);
    
    onClose();
    toast({
      title: "Dati salvati",
      description: hasAnyTimeDataChanged 
        ? "I servizi, la data e gli orari sono stati aggiornati con successo"
        : "I servizi sono stati aggiornati con successo",
    });
  };

  const cancelEdit = () => {
    setIsAddingService(false);
    setSelectedServiceId('');
  };

  const totalPrice = services.reduce((sum, service) => {
    const price = typeof service.price === 'number' ? service.price : parseFloat(String(service.price)) || 0;
    return sum + price;
  }, 0);

  if (!appointment) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={
            isMobile
              ? "w-full h-full max-w-full max-h-full rounded-none overflow-y-auto bg-white border-none shadow-none p-0"
              : "max-w-2xl max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-200 shadow-md"
          }
        >
          {isMobile ? (
            /* Mobile: Form-style header with fixed top section */
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mx-4">
                  Modifica Appuntamento
                </h1>
                <div className="w-9"></div> {/* Spacer for centering */}
              </div>
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-600 text-center">{appointment.nome}</p>
              </div>
            </div>
          ) : (
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-semibold text-gray-800">
                <Edit2 className="w-5 h-5 text-violet-500" />
                Gestisci Servizi - {appointment.nome}
              </DialogTitle>
            </DialogHeader>
          )}
          
          <div className={isMobile ? "flex-1 overflow-y-auto" : "space-y-4"}>
            <div className={isMobile ? "p-4 space-y-6" : "space-y-4"}>
              {/* Info appuntamento con data e orari modificabili */}
              <div className={isMobile 
                ? "space-y-4" 
                : "bg-gradient-to-r from-blue-50 to-blue-50/80 backdrop-blur-sm border border-[#e5e7eb] rounded-lg p-3 shadow-sm"
              }>
                {isMobile && (
                  <div className="border-b border-gray-200 pb-3">
                    <h2 className="text-base font-medium text-gray-900 mb-1">Data e Orario</h2>
                    <p className="text-sm text-gray-600">Modifica la data e gli orari dell'appuntamento</p>
                  </div>
                )}
                <div className={isMobile ? "space-y-4" : "space-y-3"}>
                  {/* Data */}
                  <div className={isMobile ? "space-y-2" : "flex justify-between items-center text-sm"}>
                    {isMobile ? (
                      <div>
                        <Label htmlFor="editedDate" className="text-sm font-medium text-gray-900 block mb-2">
                          Data Appuntamento
                        </Label>
                        <input
                          id="editedDate"
                          type="date"
                          value={editedDate}
                          onChange={e => setEditedDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200"
                        />
                      </div>
                    ) : (
                      <span>
                        <strong>Data:</strong>{' '}
                        <input
                          type="date"
                          value={editedDate}
                          onChange={e => setEditedDate(e.target.value)}
                          className="border border-[#e5e7eb] rounded px-2 py-1 bg-white/80 text-gray-700 focus:ring-1 focus:ring-violet-300 focus:border-violet-300 transition-all duration-200"
                          style={{ minWidth: 120 }}
                        />
                      </span>
                    )}
                  </div>
                  
                  {/* Orari */}
                  <div className={isMobile ? "flex justify-center gap-4" : "grid grid-cols-2 gap-4"}>
                    <div style={isMobile ? { minWidth: '140px' } : {}}>
                      <Label htmlFor="orarioInizio" className={isMobile ? "text-sm font-medium text-gray-900 block mb-2 text-center" : "text-sm font-medium text-gray-700"}>
                        Orario Inizio
                      </Label>
                      <Select value={editedOrarioInizio} onValueChange={handleOrarioInizioChange}>
                        <SelectTrigger className={isMobile 
                          ? "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
                          : "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white"
                        }>
                          <SelectValue placeholder="-- Seleziona orario --" />
                        </SelectTrigger>
                        <SelectContent style={{ maxHeight: '180px', overflowY: 'auto' }}>
                          {startTimeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div style={isMobile ? { minWidth: '140px' } : {}}>
                      <Label htmlFor="orarioFine" className={isMobile ? "text-sm font-medium text-gray-900 block mb-2 text-center" : "text-sm font-medium text-gray-700"}>
                        Orario Fine
                      </Label>
                      <Select value={editedOrarioFine} onValueChange={handleOrarioFineChange}>
                        <SelectTrigger className={isMobile 
                          ? "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
                          : "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white"
                        }>
                          <SelectValue placeholder="-- Seleziona orario --" />
                        </SelectTrigger>
                        <SelectContent style={{ maxHeight: '180px', overflowY: 'auto' }}>
                          {getEndTimeOptions(editedOrarioInizio).map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Warning per orari non validi */}
                  {timeWarning && (
                    <div className={isMobile 
                      ? "text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 text-center"
                      : "text-red-600 text-sm bg-red-50/80 border border-red-200 rounded-lg p-2 text-center"
                    }>
                      {timeWarning}
                    </div>
                  )}
                </div>
              </div>
              {/* Lista servizi esistenti */}
              <div className={isMobile ? "space-y-4" : "space-y-2"}>
                {isMobile && (
                  <div className="border-b border-gray-200 pb-3">
                    <h2 className="text-base font-medium text-gray-900 mb-1">Servizi</h2>
                    <p className="text-sm text-gray-600">Gestisci i servizi dell'appuntamento</p>
                  </div>
                )}
                <div className={isMobile ? "flex items-center justify-between mb-4" : "flex justify-between items-center"}>
                  <h3 className={isMobile ? "text-sm font-medium text-gray-900" : "font-semibold text-gray-800"}>
                    Servizi attuali ({services.length})
                  </h3>
                  <Badge variant="outline" className="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-500 font-semibold border border-[#e5e7eb]">
                    Totale: €{totalPrice.toFixed(2)}
                  </Badge>
                </div>
                {/* Debug info in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mb-2">
                    Debug: {services.length} servizi caricati
                    {services.map((s, i) => (
                      <div key={i} className="ml-2">
                        {i + 1}. {s.name} (ID: {s.id}, Prezzo: €{s.price})
                      </div>
                    ))}
                  </div>
                )}
                {services.length === 0 ? (
                  <div className={isMobile 
                    ? "text-center py-8 text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-4"
                    : "text-center py-8 text-gray-500 bg-white/80 backdrop-blur-sm border border-[#e5e7eb] rounded-lg p-4"
                  }>
                    <p className={isMobile ? "font-medium mb-1" : ""}>Nessun servizio presente</p>
                    <p className="text-sm">Aggiungi il primo servizio utilizzando il pulsante qui sotto</p>
                  </div>
                ) : (
                  <div className={isMobile ? "space-y-3" : "space-y-2 max-h-48 overflow-y-auto"}>
                    {services.map((service) => (
                      <div key={service.id} className={isMobile 
                        ? "flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                        : "flex items-center justify-between bg-white/80 backdrop-blur-sm border border-[#e5e7eb] rounded-lg p-3 hover:bg-gray-50/90 transition-all duration-200 shadow-sm"
                      }>
                        <div className="flex-1">
                          <span className={isMobile ? "font-medium text-gray-900 block" : "font-medium text-gray-700"}>
                            {service.name}
                          </span>
                          <span className={isMobile 
                            ? "text-green-600 font-semibold text-sm"
                            : "ml-3 text-green-600 font-semibold"
                          }>
                            €{service.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size={isMobile ? "default" : "sm"}
                            variant="outline"
                            onClick={() => handleDeleteServiceClick(service)}
                            className={isMobile 
                              ? "h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all duration-200"
                              : "h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50/90 border border-[#e5e7eb] transition-all duration-200"
                            }
                          >
                            <Trash2 className={isMobile ? "w-4 h-4" : "w-3 h-3"} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Form per aggiungere servizio da select */}
              {isAddingService && (
                <div className={isMobile 
                  ? "space-y-4"
                  : "border border-[#e5e7eb] rounded-lg p-4 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm shadow-sm"
                }>
                  {isMobile && (
                    <div className="border-b border-gray-200 pb-3">
                      <h2 className="text-base font-medium text-gray-900 mb-1">Aggiungi Servizio</h2>
                      <p className="text-sm text-gray-600">Seleziona un servizio dalla lista</p>
                    </div>
                  )}
                  {!isMobile && (
                    <h4 className="font-semibold mb-3 text-gray-800">Aggiungi Servizio Disponibile</h4>
                  )}
                  <div className={isMobile ? "space-y-2" : "mb-3"}>
                    <Label htmlFor="selectService" className={isMobile 
                      ? "text-sm font-medium text-gray-900 block mb-2"
                      : "text-gray-700"
                    }>
                      Seleziona servizio
                    </Label>
                    <select
                      id="selectService"
                      className={isMobile 
                        ? "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200"
                        : "w-full border border-[#e5e7eb] rounded-md px-2 py-2 mt-1 bg-white/80 backdrop-blur-sm focus:ring-1 focus:ring-violet-300 focus:border-violet-300 transition-all duration-200"
                      }
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
                </div>
              )}
              
              {/* Pulsante per aggiungere nuovo servizio */}
              {!isAddingService && (
                <Button
                  onClick={() => setIsAddingService(true)}
                  variant="outline"
                  className={isMobile 
                    ? "w-full bg-white text-violet-600 hover:bg-violet-50 hover:text-violet-700 border border-violet-200 transition-all duration-300 py-3 rounded-lg font-medium"
                    : "w-full bg-white/70 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:text-purple-400 hover:border-purple-100/40 transition-all duration-300 border border-[#e5e7eb] shadow-sm justify-center"
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Servizio
                </Button>
              )}
            </div>
          </div>
          
          {/* Footer Section */}
          {isMobile ? (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
              <Button 
                onClick={handleSave}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-medium transition-all duration-200"
              >
                Salva Modifiche
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full text-gray-600 border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Annulla
              </Button>
            </div>
          ) : (
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="bg-white/70 text-gray-600 border border-[#e5e7eb] hover:bg-gray-50/90 hover:text-gray-700 transition-all duration-200"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-sm transition-all duration-200"
              >
                Salva Servizi
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
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
