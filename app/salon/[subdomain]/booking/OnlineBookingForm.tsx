'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { 
  Calendar,
  Clock,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  CalendarDays,
  Timer,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import opening hours utilities
import { parseOpeningHours, getNextAvailableDate, DAYS_OF_WEEK } from '@/utils/openingHoursUtils';

const supabase = createClient();

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface AvailableSlot {
  time_slot: string;
  available_members: TeamMember[];
  total_available_members: number;
}

interface OpeningHours {
  day: string;
  dayNumber: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  isBreakTime: boolean;
  breakStartTime: string;
  breakEndTime: string;
}

interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  selected_service: string;
  selected_member: string;
  selected_date: string;
  selected_time: string;
  notes: string;
}

export default function OnlineBookingForm({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHours[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [formData, setFormData] = useState<BookingFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    selected_service: '',
    selected_member: '',
    selected_date: '',
    selected_time: '',
    notes: ''
  });

  // Carica i dati iniziali
  useEffect(() => {
    loadInitialData();
  }, [salonId]);

  // Carica slot disponibili quando cambia la data
  useEffect(() => {
    if (selectedDate && formData.selected_service) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, formData.selected_service, salonId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Carica servizi
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, price, duration, description')
        .eq('salon_id', salonId)
        .eq('status', 'Attivo')
        .eq('visible_online', true);

      setServices(servicesData || []);

      // Carica membri del team
      const { data: teamData } = await supabase
        .from('team')
        .select('id, name, email')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .eq('visible_users', true);

      setTeamMembers(teamData || []);

      // Carica orari di apertura
      await loadOpeningHours();

    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati per la prenotazione",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOpeningHours = async () => {
    try {
      const { data: webSettings } = await supabase
        .from('salon_web_settings')
        .select('*')
        .eq('salon_id', salonId)
        .single();

      if (webSettings) {
        const openingHoursString = (webSettings as any)?.web_map_opening_hours || '';
        const parsedHours = parseOpeningHours(openingHoursString);
        setOpeningHours(parsedHours);
        
        // Generate available dates for the next 14 days
        generateAvailableDates(parsedHours);
      }
    } catch (error) {
      console.error('Error loading opening hours:', error);
    }
  };

  const generateAvailableDates = (hours: OpeningHours[]) => {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      const dayHours = hours.find(h => h.dayNumber === dayOfWeek);
      
      if (dayHours && dayHours.isOpen) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    setAvailableDates(dates);
  };

  const loadAvailableSlots = async (date: string) => {
    try {
      const selectedService = services.find(s => s.id === formData.selected_service);
      if (!selectedService) return;

      const response = await fetch(
        `/api/online-bookings?salon_id=${salonId}&date=${date}&service_id=${selectedService.id}`
      );
      const data = await response.json();

      if (data.success) {
        setAvailableSlots(data.availableSlots || []);
      } else {
        console.error('Errore nel caricamento degli slot:', data.error);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento degli slot:', error);
      setAvailableSlots([]);
    }
  };

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setFormData(prev => ({ 
        ...prev, 
        selected_service: serviceId,
        selected_time: '' // Reset time when service changes
      }));
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setFormData(prev => ({ 
      ...prev, 
      selected_date: date,
      selected_time: '' // Reset time when date changes
    }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, selected_time: time }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.selected_service || !formData.selected_date || !formData.selected_time) {
      toast({
        title: "Dati mancanti",
        description: "Seleziona servizio, data e ora per continuare",
        variant: "destructive"
      });
      return;
    }

    const selectedService = services.find(s => s.id === formData.selected_service);
    if (!selectedService) return;

    try {
      setSubmitting(true);

      const response = await fetch('/api/online-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salon_id: salonId,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          requested_date: formData.selected_date,
          requested_time: formData.selected_time,
          service_id: formData.selected_service,
          service_name: selectedService.name,
          service_duration: selectedService.duration,
          service_price: selectedService.price,
          team_member_id: formData.selected_member || null,
          notes: formData.notes,
          ip_address: '127.0.0.1', // In production, get real IP
          user_agent: navigator.userAgent
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Prenotazione inviata!",
          description: data.message,
        });
        
        // Reset form
        setFormData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          selected_service: '',
          selected_member: '',
          selected_date: '',
          selected_time: '',
          notes: ''
        });
        setCurrentStep(1);
        setSelectedDate('');
      } else {
        toast({
          title: "Errore",
          description: data.error || "Errore durante l'invio della prenotazione",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Errore nell\'invio della prenotazione:', error);
      toast({
        title: "Errore",
        description: "Impossibile inviare la prenotazione",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.selected_service) {
      toast({
        title: "Servizio richiesto",
        description: "Seleziona un servizio per continuare",
        variant: "destructive"
      });
      return;
    }
    if (currentStep === 2 && !formData.selected_date) {
      toast({
        title: "Data richiesta",
        description: "Seleziona una data per continuare",
        variant: "destructive"
      });
      return;
    }
    if (currentStep === 3 && !formData.selected_time) {
      toast({
        title: "Orario richiesto",
        description: "Seleziona un orario per continuare",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
    const dayNumber = date.getDate();
    const month = date.toLocaleDateString('it-IT', { month: 'short' });
    
    return { dayName, dayNumber, month };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Prenotazione Online
          </CardTitle>
          <CardDescription>
            Prenota il tuo appuntamento in modo semplice e veloce
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Seleziona il Servizio
                </h3>
                
                {services.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nessun servizio disponibile al momento
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="service_select">Servizio *</Label>
                      <Select
                        value={formData.selected_service}
                        onValueChange={handleServiceSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un servizio" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex justify-between items-center w-full">
                                <div className="font-medium">{service.name}</div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Timer className="h-3 w-3" />
                                  {service.duration} min
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Service Details Display */}
                    {formData.selected_service && (
                      <div className="p-4 border rounded-lg bg-gray-50">
                        {(() => {
                          const selectedService = services.find(s => s.id === formData.selected_service);
                          if (!selectedService) return null;
                          
                          return (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg">{selectedService.name}</h4>
                              {selectedService.description && (
                                <p className="text-gray-600">{selectedService.description}</p>
                              )}
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {selectedService.duration} min
                                </Badge>
                                <div className="font-semibold text-lg text-blue-600">
                                  €{selectedService.price.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Date Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Seleziona la Data
                </h3>
                
                {availableDates.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nessuna data disponibile per la prenotazione
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {availableDates.slice(0, 14).map((dateString) => {
                      const { dayName, dayNumber, month } = formatDate(dateString);
                      
                      return (
                        <button
                          key={dateString}
                          type="button"
                          className={`p-3 border rounded-lg text-center transition-all ${
                            selectedDate === dateString
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleDateSelect(dateString)}
                        >
                          <div className="text-xs font-medium">{dayName}</div>
                          <div className="text-lg font-semibold">{dayNumber}</div>
                          <div className="text-xs text-gray-500">{month}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Time Selection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Seleziona l'Orario
                </h3>
                
                {availableSlots.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nessuno slot disponibile per la data selezionata
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time_slot}
                        type="button"
                        className={`p-3 border rounded-lg text-center transition-all ${
                          formData.selected_time === slot.time_slot
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleTimeSelect(slot.time_slot)}
                      >
                        <div className="font-medium">{slot.time_slot}</div>
                        <div className="text-xs text-gray-600">
                          {slot.total_available_members} disponibili
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Customer Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  I Tuoi Dati
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer_name">Nome e Cognome *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="customer_email">Email *</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => handleInputChange('customer_email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="customer_phone">Telefono</Label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                    />
                  </div>

                  {teamMembers.length > 0 && (
                    <div>
                      <Label htmlFor="selected_member">Preferisci un membro specifico?</Label>
                      <Select
                        value={formData.selected_member}
                        onValueChange={(value) => handleInputChange('selected_member', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un membro (opzionale)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nessuna preferenza</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="notes">Note aggiuntive</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Inserisci eventuali note o richieste speciali..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Indietro
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Avanti
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Conferma Prenotazione
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 