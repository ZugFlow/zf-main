/**
 * DialogDay Component
 * 
 * This component implements a modal dialog for managing hair salon appointments.
 * Features:
 * - View and edit appointment details
 * - Manage client information, service details, and scheduling
 * - Real-time updates to Supabase database
 * - Responsive design with a user-friendly interface
 * - Form validation and error handling
 * - Supports both viewing and editing modes
 */

'use client';

// Import necessary dependencies
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { FaClock, FaUser, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaCut, FaTasks } from 'react-icons/fa';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ServiceSection } from "../_CreateOrder/servizi";
import { XIcon } from "lucide-react";
import { 
  fetchAppointmentStatus, 
  updateAppointmentStatus, 
  fetchTeamMembers, 
  fetchServicesForOrders,
  fetchAppointmentsWithServices,
  updateAppointment
} from '../query/query';
import { useAuthContext } from "../query/AuthContext"; // Import useAuthContext

// Initialize Supabase client
const supabase = createClient();

// Define TypeScript interface for Appointment data structure
interface Appointment {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  team_id: string;
  servizio: string;
  accesso: string; // Tipo di accesso (es. "Invitation")
  status: string; // Changed from stato to status
  progresso: number; // Percentuale di completamento
  membri?: string[]; // URL immagini membri
  services?: Array<{ id: string; name: string; price: number }>;
  task?: boolean; // Indicates if this is a task
}

// Define TypeScript interface for TeamMember data structure
interface TeamMember {
  id: string;
  name: string;
  imageUrl?: string;
}

// Define props interface for DialogDay component
interface DialogDayProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  selectedAppointment: Appointment | null;
}

// Add type safety for service data
interface ServiceData {
  id: string;
  name: string;
  price: number;
  duration: number;
}

// Main component for displaying and editing appointment details in a dialog
const DialogDay: React.FC<DialogDayProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  selectedAppointment,
}) => {
  const { userId } = useAuthContext();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    orarioInizio: '',
    orarioFine: '',
    data: '',
    status: '',
  });

  // Consolidated state
  const [appointmentData, setAppointmentData] = useState({
    statusOptions: [] as { key: string }[],
    currentStatus: '',
    appointmentStatus: '',
    teamMembers: [] as TeamMember[],
    services: [] as ServiceData[],
    selectedServices: [] as ServiceData[],
    calculatedPrice: "0"
  });

  // Single useEffect for initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      if (!userId) return;

      try {
        // Fetch all data in parallel
        const [statusOptionsData, teamMembersData, servicesData] = await Promise.all([
          supabase
            .from('settings')
            .select('key')
            .eq('user_id', userId)
            .eq('type', 'appointment_status'),
          fetchTeamMembers(userId),
          supabase.from('services').select('id, name, price, duration')
        ]);

        setAppointmentData(prev => ({
          ...prev,
          statusOptions: statusOptionsData.data || [],
          teamMembers: teamMembersData.map(m => ({
            id: m.id,
            name: m.name,
            imageUrl: m.avatar_url || undefined,
          })),
          services: (servicesData.data || []).map(service => ({
            ...service,
            duration: service.duration || 0
          }))
        }));
      } catch (error) {
        // Handle error silently for Vercel/SSR
      }
    };

    loadInitialData();
  }, [userId]);

  // Single useEffect for appointment-specific data
  useEffect(() => {
    const loadAppointmentData = async () => {
      if (!selectedAppointment?.id || !userId) return;

      try {
        // Fetch appointment status and services in parallel
        const [statusData, servicesData] = await Promise.all([
          fetchAppointmentStatus(selectedAppointment.id),
          supabase
            .from('order_services')
            .select('service_id, services!inner(id, name, price, duration)')
            .eq('order_id', selectedAppointment.id)
        ]);

        const status = statusData?.status || '';
        const formattedServices = (servicesData.data || []).map((item: any) => ({
          id: item.services.id,
          name: item.services.name,
          price: item.services.price,
          duration: item.services.duration || 0
        }));

        setAppointmentData(prev => ({
          ...prev,
          currentStatus: status,
          appointmentStatus: status,
          selectedServices: formattedServices,
          calculatedPrice: formattedServices.reduce((sum, service) => 
            sum + (service.price || 0), 0).toFixed(2)
        }));

        setFormData(prev => ({
          ...prev,
          status,
          orarioInizio: selectedAppointment.orarioInizio,
          orarioFine: selectedAppointment.orarioFine,
          data: selectedAppointment.data,
        }));
      } catch (error) {
        // Handle error silently
      }
    };

    loadAppointmentData();
  }, [selectedAppointment, userId]);

  // Handle status update using the new query function
  const handleStatusChange = async (newStatus: string) => {
    try {
      if (!selectedAppointment?.id || !userId) return;
      await updateAppointmentStatus(selectedAppointment.id, newStatus, userId);
      setAppointmentData(prev => ({ ...prev, currentStatus: newStatus, appointmentStatus: newStatus }));
      setFormData(prev => ({ ...prev, status: newStatus }));
      // Optionally: close dialog or show notification here
    } catch (error) {
      // Handle error silently for Vercel/SSR
    }
  };

  // Update form data when selected appointment changes
  useEffect(() => {
    if (!selectedAppointment) return;
    setFormData({
      orarioInizio: selectedAppointment.orarioInizio,
      orarioFine: selectedAppointment.orarioFine,
      data: selectedAppointment.data,
      status: selectedAppointment.status,
    });
    setAppointmentData(prev => ({
      ...prev,
      currentStatus: selectedAppointment.status,
      appointmentStatus: selectedAppointment.status,
    }));
  }, [selectedAppointment]);

  // Handle appointment update using the new query function
  const handleEdit = async () => {
    if (!selectedAppointment || !userId) return;
    try {
      await updateAppointment({
        ...formData,
        id: selectedAppointment.id,
        user_id: userId,
        team_id: selectedAppointment.team_id,
        accesso: selectedAppointment.accesso,
        progresso: selectedAppointment.progresso,
        nome: selectedAppointment.nome,
        servizio: selectedAppointment.servizio,
      });

      await supabase
        .from('order_services')
        .delete()
        .eq('order_id', selectedAppointment.id);

      const serviceInserts = appointmentData.selectedServices.map(service => ({
        order_id: selectedAppointment.id,
        service_id: service.id,
        price: service.price,
        servizio: service.name
      }));

      if (serviceInserts.length > 0) {
        await supabase
          .from('order_services')
          .insert(serviceInserts);
      }

      setEditMode(false);
      setIsDialogOpen(false);
      setAppointmentData(prev => ({
        ...prev,
        currentStatus: formData.status,
        appointmentStatus: formData.status,
      }));
    } catch (error) {
      // Handle error silently for Vercel/SSR
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = async (serviceId: string) => {
    const selectedService = appointmentData.services.find(service => service.id === serviceId);
    if (!selectedService) return;
    const isServiceAlreadySelected = appointmentData.selectedServices.some(
      service => service.id === selectedService.id
    );
    if (!isServiceAlreadySelected) {
      const newServices = [...appointmentData.selectedServices, selectedService];
      setAppointmentData(prev => ({ ...prev, selectedServices: newServices }));
      calculateTotalPrice(newServices);
    }
  };

  const removeService = async (serviceId: string) => {
    const newServices = appointmentData.selectedServices.filter(service => service.id !== serviceId);
    setAppointmentData(prev => ({ ...prev, selectedServices: newServices }));
    calculateTotalPrice(newServices);
    if (selectedAppointment?.id) {
      await supabase
        .from('order_services')
        .delete()
        .eq('order_id', selectedAppointment.id)
        .eq('service_id', serviceId);
    }
  };

  const calculateTotalPrice = (services: Array<{ price: number }>) => {
    const total = services.reduce((sum, service) => sum + (service.price || 0), 0);
    setAppointmentData(prev => ({ ...prev, calculatedPrice: total.toFixed(2) }));
  };

  // Update the render code to use appointmentData instead of individual states
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="rounded-2xl bg-white p-6 text-gray-900 shadow-2xl max-w-lg w-full">
        {/* Dialog Header - Shows appointment time and status */}
        <DialogHeader className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="px-3 py-1 flex items-center gap-2">
              <FaClock className="text-rose-500" />
              <span>{selectedAppointment?.orarioInizio} - {selectedAppointment?.orarioFine}</span>
            </Badge>
            <Badge variant="outline" className="bg-rose-50 text-rose-500 border-rose-200">
              {appointmentData.appointmentStatus || 'In attesa'}
            </Badge>
          </div>
          <DialogClose className="text-gray-500 hover:text-gray-700" />
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {editMode ? (
            // Edit Mode - Show form inputs for editing appointment details
            <div className="space-y-4">
              {/* Form fields for start/end time, and date */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FaClock className="text-rose-500" />
                      Orario Inizio
                    </label>
                    <Input
                      name="orarioInizio"
                      type="time"
                      value={formData.orarioInizio}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-rose-500 focus:ring-rose-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FaClock className="text-rose-500" />
                      Orario Fine
                    </label>
                    <Input
                      name="orarioFine"
                      type="time"
                      value={formData.orarioFine}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-rose-500 focus:ring-rose-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FaCalendarAlt className="text-rose-500" />
                    Data
                  </label>
                  <Input
                    name="data"
                    type="date"
                    value={formData.data}
                    onChange={handleInputChange}
                    className="border-gray-200 focus:border-rose-500 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FaTasks className="text-rose-500" />
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-full border-gray-200 focus:border-rose-500 focus:ring-rose-500">
                      <SelectValue placeholder="Seleziona uno status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        // Filter status options for tasks
                        const availableOptions = selectedAppointment?.task 
                          ? appointmentData.statusOptions.filter(option => 
                              option.key === 'Completato' || option.key === 'Eliminato'
                            )
                          : appointmentData.statusOptions;
                        
                        return availableOptions.map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.key}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Services Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <FaCut className="text-rose-500" />
                  Servizi
                </h3>
                <ServiceSection
                  services={appointmentData.services}
                  selectedServices={appointmentData.selectedServices}
                  onServiceAdd={handleServiceChange}
                  onServiceRemove={removeService}
                />
                {appointmentData.selectedServices.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {appointmentData.selectedServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span>{service.name}</span>
                        <div className="flex items-center gap-4">
                          <span>€{service.price.toFixed(2)}</span>
                          <button
                            onClick={() => removeService(service.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-semibold">
                      <span>Totale</span>
                      <span>€{appointmentData.calculatedPrice}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // View Mode - Display appointment details in a formatted layout
            <div className="space-y-4">
              {/* Client information card */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-xl text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedAppointment?.nome}</h3>
                  <p className="text-gray-500 text-sm">Cliente</p>
                </div>
              </div>

              {/* Service and date information cards */}
              <div className="grid grid-cols-2 gap-4 min-h-[120px]">
                <div className="p-4 bg-gray-50 rounded-lg h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCut className="text-rose-500" />
                    <span className="text-sm font-medium">Servizio</span>
                  </div>
                  <p className="text-gray-700 break-words">{selectedAppointment?.servizio}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCalendarAlt className="text-rose-500" />
                    <span className="text-sm font-medium">Data</span>
                  </div>
                  <p className="text-gray-700">{selectedAppointment?.data}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaTasks className="text-rose-500" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-gray-700">{appointmentData.appointmentStatus || 'Non impostato'}</p>
              </div>

              {/* Team members information */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaUser className="text-rose-500" />
                  <span className="text-sm font-medium">Membri del Team</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appointmentData.teamMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-2">
                      {member.imageUrl && (
                        <img src={member.imageUrl} alt={member.name} className="h-8 w-8 rounded-full" />
                      )}
                      <span className="text-gray-700">{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services display in view mode */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaCut className="text-rose-500" />
                  <span className="text-sm font-medium">Servizi</span>
                </div>
                {appointmentData.selectedServices.length > 0 ? (
                  <div className="space-y-2">
                    {appointmentData.selectedServices.map((service) => (
                      <div key={service.id} className="flex justify-between text-gray-700">
                        <span>{service.name}</span>
                        <span>€{service.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Totale</span>
                      <span>€{appointmentData.calculatedPrice}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Nessun servizio selezionato</p>
                )}
              </div>
            </div>
          )}

          {/* Footer with action buttons (Edit/Save/Cancel) */}
          <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  className="flex items-center gap-2"
                >
                  <FaTimes />
                  Annulla
                </Button>
                <Button
                  onClick={handleEdit}
                  className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2"
                >
                  <FaSave />
                  Salva
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditMode(true)}
                  className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2"
                >
                  <FaEdit />
                  Modifica
                </Button>
                <Select
                  value={appointmentData.currentStatus}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Filter status options for tasks
                      const availableOptions = selectedAppointment?.task 
                        ? appointmentData.statusOptions.filter(option => 
                            option.key === 'Completato' || option.key === 'Eliminato'
                          )
                        : appointmentData.statusOptions;
                      
                      return availableOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.key}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogDay;
