import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { applyCoupon } from "./applyCoupon";
import { Sheet } from "@/components/ui/sheet";
import { 
  Add, 
  Cut, 
  User, 
  Calendar, 
  Time, 
  Document, 
  List, 
  TrashCan,
  Notification
} from "@carbon/icons-react";
import { Loader2 } from "lucide-react";
import { showSuccessToast } from "../HelperToast";
import { useLocalization } from "@/hooks/useLocalization";
import { ServiceSection } from "./servizi";
import { ClientSection } from "./clienti";
import { TimeSection } from "./Time";
import { getSalonId } from '@/utils/getSalonId';
// import { fetchClientsWithCache, checkCouponAvailability, createOrder, deleteCoupon, createPause } from '../query/query';

const supabase = createClient();



// Palette Fresha-like, colori tenui
const PREDEFINED_COLORS = [
  '#FDE2E4', // rosa chiaro
  '#FFF1E6', // beige
  '#E2F0CB', // verde chiaro
  '#BEE1E6', // azzurro chiaro
  '#F0EFEB', // grigio/beige
  '#D0F4DE', // verde menta
  '#CDE7F0', // celeste
  '#F6DFEB', // lilla chiaro
  '#F9F9F9', // quasi bianco
  '#FDF6E3', // giallo crema
  '#FFB3B3', // Apple Red
  '#FFD580', // Apple Orange
  '#FFE066', // Apple Yellow
  '#B5EAD7', // Apple Green
  '#C7CEEA', // Apple Blue
  '#B5B9FF', // Apple Indigo
  '#E2B5FF', // Apple Purple
  '#FFB5E2', // Apple Pink
  '#B3FFF1', // Apple Teal
  '#B3FFD9', // Apple Mint
  '#D1B3FF', // Apple Lavender
  '#FFB3C6', // Apple Rose
  '#B3C6FF', // Apple Sky
  '#B3E0FF', // Apple Light Blue
  '#B3FFB5', // Apple Light Green
  '#FFF6B3', // Apple Light Yellow
  '#A3C9F9', // Apple Blue Calendar
  '#F7B7A3', // Apple Orange Calendar
  '#F9F7A3', // Apple Yellow Calendar
  '#A3F7BF', // Apple Green Calendar
  '#D3A3F7', // Apple Purple Calendar
  '#F7A3C9', // Apple Pink Calendar
  '#A3F0F7', // Apple Cyan Calendar
  '#F7E3A3', // Apple Cream Calendar
];

// Create dynamic form schema based on modal settings
const createFormSchema = (settings: any) => {
  const requiredFieldMessage = settings?.required_field_message || "Campo obbligatorio";
  const invalidTimeMessage = settings?.invalid_time_message || "Formato orario non valido. Usa HH:mm.";
  const endTimeBeforeStartMessage = settings?.end_time_before_start_message || "L'orario di fine deve essere maggiore o uguale all'orario di inizio.";
  
  return z
    .object({
      prezzo: z.string().optional(),
      nome: settings?.require_client_name ? 
        z.string().min(1, { message: requiredFieldMessage }) : 
        z.string().optional(),
      telefono: settings?.require_client_phone ? 
        z.string().min(1, { message: requiredFieldMessage }) : 
        z.string().optional(),
      email: settings?.require_client_email ? 
        z.string().min(1, { message: requiredFieldMessage }) : 
        z.string().optional(),
      data: z.string().min(1, { message: requiredFieldMessage }),
      orarioInizio: z
        .string()
        .min(1, { message: requiredFieldMessage })
        .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, { message: invalidTimeMessage }),
      orarioFine: z
        .string()
        .min(1, { message: requiredFieldMessage })
        .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, { message: invalidTimeMessage }),
      status: z.string().optional().default(""),
      descrizione: z.string().optional(),
      team_id: settings?.require_team_selection ? 
        z.string().min(1, { message: requiredFieldMessage }) : 
        z.string().optional(),
      customer_uuid: z.string().optional(),
      color_card: z.array(z.string()).max(2, { message: "Puoi selezionare massimo 2 colori." }),
      prefer_card_style: z.enum(["filled", "top", "bottom", "left", "right", "default"]).default("filled"),
      alone: z.enum(["1", "2", "3"]).default("1"),
      notify_client: z.boolean().default(false),
    })
    .refine(
      (data) => {
        if (!data.orarioInizio || !data.orarioFine) return true;
        const [startHour, startMinute] = data.orarioInizio.split(":").map(Number);
        const [endHour, endMinute] = data.orarioFine.split(":").map(Number);
        return endHour > startHour || (endHour === startHour && endMinute >= startMinute);
      },
      {
        message: endTimeBeforeStartMessage,
        path: ["orarioFine"],
      }
    );
};

function CreateOrderForm({
  teamMembers,
  setIsDialogOpen,
  initialFormData,
  statuses,
  appointments,
  services,
  clients = [], // <-- Accept clients as a prop
  initialFormType = 'appointment',
  onAppointmentCreated,
  modalSettings
}: {
  teamMembers: { id: string; name: string }[];
  setIsDialogOpen: (open: boolean) => void;
  initialFormData?: {
    data: string;
    orarioInizio: string;
    orarioFine: string;
    team_id?: string;
  } | null;
  statuses: string[];
  appointments: any[];
  services: any[];
  clients?: { id: string; nome: string; telefono: string; email: string; customer_uuid: string }[];
  initialFormType?: string;
  onAppointmentCreated?: () => void;
  modalSettings?: any;
}) {
  const { t } = useLocalization();
  
  // Consolidate UI-related state into a single object
  const [uiState, setUiState] = useState({
    loading: true,
    isSheetOpen: false,
    bannerMessage: null as string | null,
    isSubmitting: false,
  });

  // Consolidate data-related state into a separate object
  const [dataState, setDataState] = useState({
    clients: clients, // Use clients from props
    selectedServices: [] as Array<{ id: string; name: string; price: number; duration: number }>,
    couponCache: {} as {[key: string]: boolean},
  });

  // Keep price state separate as it's frequently updated
  const [priceState, setPriceState] = useState({
    calculatedPrice: "",
    useCoupon: false,
    isCouponAvailable: false
  });



  const [submissionTimeout, setSubmissionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null); // Add state for warning message

  // Create state update helpers to avoid re-renders
  const updateUiState = useCallback((updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDataState = useCallback((updates: Partial<typeof dataState>) => {
    setDataState(prev => ({ ...prev, ...updates }));
  }, []);

  // Create ref for tracking mounted state
  const isMounted = React.useRef(true);
  
  // Ref per tracciare se il modal è aperto
  const isModalOpen = React.useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset del ref quando il componente viene smontato
  useEffect(() => {
    return () => {
      isModalOpen.current = false;
    };
  }, []);

  // Create dynamic schema based on modal settings
  const formSchema = useMemo(() => createFormSchema(modalSettings), [modalSettings]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefono: "",
      email: "",
      data: initialFormData?.data || "",
      orarioInizio: initialFormData?.orarioInizio || "10:00",
      prezzo: "",
      orarioFine: "",
      status: "",
      descrizione: "",
      team_id: initialFormData?.team_id || "",
      customer_uuid: "",
      color_card: [], // Default: nessun colore selezionato
      prefer_card_style: "filled", // Default card style
      alone: "1",
      notify_client: false,
    },
  });

  // Memoize the form to prevent re-creation on every render
  const memoizedForm = useMemo(() => form, [form]);

  // Monitora quando il modal viene aperto/chiuso
  useEffect(() => {
    // Quando il modal viene aperto, resetta lo stato
    if (!isModalOpen.current) {
      isModalOpen.current = true;
      
      // Reset del form ai valori di default
      form.reset({
        nome: "",
        telefono: "",
        email: "",
        data: initialFormData?.data || "",
        orarioInizio: initialFormData?.orarioInizio || "10:00",
        prezzo: "",
        orarioFine: "",
        status: "",
        descrizione: "",
        team_id: initialFormData?.team_id || "",
        customer_uuid: "",
        color_card: [],
        prefer_card_style: "filled",
        alone: "1",
        notify_client: false,
      });
      
      // Reset degli stati
      setDataState(prev => ({
        ...prev,
        selectedServices: [],
        couponCache: {},
      }));
      
      setPriceState({
        calculatedPrice: "",
        useCoupon: false,
        isCouponAvailable: false
      });
      
      setTimeWarning(null);
      
      // Reset dello stato UI
      updateUiState({
        loading: false,
        isSheetOpen: false,
        bannerMessage: null,
        isSubmitting: false,
      });
    }
  }, [initialFormData, form, updateUiState]);

  // Effect to update form values when initialFormData changes
  useEffect(() => {
    if (initialFormData) {
      form.setValue("data", initialFormData.data);
      form.setValue("orarioInizio", initialFormData.orarioInizio);
      form.setValue("orarioFine", initialFormData.orarioFine);
      if (initialFormData.team_id) {
        form.setValue("team_id", initialFormData.team_id);
      }
    }
  }, [initialFormData, form]);

  // Keep dataState.clients in sync with the clients prop and set loading to false only when clients are loaded or confirmed empty
  useEffect(() => {
    setDataState(prev => ({ ...prev, clients: clients }));
    // Only set loading to false if clients is an array (even if empty)
    if (Array.isArray(clients)) {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  }, [clients]);

  // Fallback per evitare che il loading rimanga bloccato
  useEffect(() => {
    const timeout = setTimeout(() => {
      setUiState(prev => ({ ...prev, loading: false }));
    }, 3000); // Timeout di 3 secondi

    return () => clearTimeout(timeout);
  }, []);

  // Use throttled price calculation to avoid recalculating on every render
  const calculateTotalPrice = useMemo(() => {
    return dataState.selectedServices.reduce((total, s) => total + s.price, 0);
  }, [dataState.selectedServices]);

  // Check coupon availability with caching and debouncing
  const customerUuid = form.watch("customer_uuid");
  
  // Using useRef for debounce timer
  const couponDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear previous timer
    if (couponDebounceTimer.current) {
      clearTimeout(couponDebounceTimer.current);
    }
    
    // Set new timer (300ms debounce)
    couponDebounceTimer.current = setTimeout(async () => {
      if (!customerUuid) {
        setPriceState(prev => ({ ...prev, isCouponAvailable: false }));
        return;
      }
      
      // Use cached result if available
      if (dataState.couponCache.hasOwnProperty(customerUuid)) {
        setPriceState(prev => ({ ...prev, isCouponAvailable: dataState.couponCache[customerUuid] }));
        return;
      }
      
      // Otherwise fetch from database
      const { data: customerCoupons, error: couponError } = await supabase
        .from("customer_coupons")
        .select("id")
        .eq("customer_id", customerUuid)
        .limit(1);
      
      if (!isMounted.current) return;
      
      const hasCoupon = (customerCoupons ?? []).length > 0;
      setPriceState(prev => ({ ...prev, isCouponAvailable: hasCoupon }));
      
      // Update cache
      updateDataState({ 
        couponCache: { 
          ...dataState.couponCache, 
          [customerUuid]: hasCoupon 
        } 
      });
    }, 300);
    
    // Cleanup
    return () => {
      if (couponDebounceTimer.current) {
        clearTimeout(couponDebounceTimer.current);
      }
    };
  }, [customerUuid, dataState.couponCache, updateDataState]);

  // Optimize coupon application with memoization
  const applyCouponMemoized = useCallback(async (customerId: string, originalPrice: number) => {
    try {
      // Call the external applyCoupon function
      const newPrice = await applyCoupon(customerId, originalPrice);
      return newPrice;
    } catch (error) {
      console.error("Error applying coupon:", error);
      return originalPrice;
    }
  }, []);

  // Throttle client change handler to prevent excessive updates
  const handleClientChange = useCallback(async (customerUuid: string) => {
    const selectedClient = dataState.clients.find(client => client.customer_uuid === customerUuid);
    if (!selectedClient) return;
    
    form.setValue("nome", selectedClient.nome);
    form.setValue("telefono", selectedClient.telefono);
    form.setValue("email", selectedClient.email);
    form.setValue("customer_uuid", selectedClient.customer_uuid);

    // Delay price update to avoid multiple recalculations
    setTimeout(async () => {
      if (!isMounted.current) return;
      
      if (priceState.useCoupon) {
        const totalPrice = calculateTotalPrice;
        const newPrice = await applyCouponMemoized(selectedClient.customer_uuid, totalPrice);
        setPriceState(prev => ({ ...prev, calculatedPrice: newPrice.toFixed(2) }));
      } else {
        setPriceState(prev => ({ ...prev, calculatedPrice: calculateTotalPrice.toString() }));
      }
    }, 100);
  }, [dataState.clients, form, priceState.useCoupon, calculateTotalPrice, applyCouponMemoized]);

  // Recupera i servizi del salone corrente direttamente da Supabase (ignora la prop services)
  const [servicesState, setServicesState] = useState<{id: string, name: string, price: number, duration: number}[]>([]);

  useEffect(() => {
    // Usa i servizi passati come prop invece di fare un fetch separato
    console.log('DEBUG: Services prop received:', services);
    if (services && services.length > 0) {
      console.log('DEBUG: Using services from prop:', services.length);
      setServicesState(services.map(s => ({
        id: String(s.id),
        name: s.name,
        price: Number(s.price),
        duration: Number(s.duration || 0)
      })));
    } else {
      console.log('DEBUG: No services in prop, fetching from database');
      // Fallback: fetch solo se i servizi non sono disponibili come prop
      async function fetchSalonServices() {
        let salon_id = localStorage.getItem('salon_id');
        if (!salon_id) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data: profileData } = await supabase
            .from('profiles')
            .select('salon_id')
            .eq('id', user.id)
            .single();
          salon_id = profileData?.salon_id;
          if (salon_id) localStorage.setItem('salon_id', salon_id);
        }
        if (!salon_id) return;
        console.log('DEBUG: Fetching services for salon_id:', salon_id);
        const { data, error } = await supabase
          .from('services')
          .select('id, name, price, duration, salon_id')
          .eq('salon_id', salon_id)
          .eq('status', 'Attivo');
        console.log('DEBUG: Services fetch result:', { data, error });
        if (!error && data) {
          setServicesState(data.map(s => ({
            id: String(s.id),
            name: s.name,
            price: Number(s.price),
            duration: Number(s.duration || 0)
          })));
        } else {
          setServicesState([]);
        }
      }
      fetchSalonServices();
    }
  }, [services]);

  // Funzione per calcolare l'orario di fine basandosi sulla durata dei servizi
  const calculateEndTime = useCallback((startTime: string, totalDuration: number): string => {
    if (!startTime || totalDuration <= 0) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + totalDuration * 60000); // duration in minutes
    
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  }, []);

  // Funzione per controllare warning sugli orari (aggiornata: sempre aggiorna su cambio valori)
  const checkTimeWarning = useCallback((startValue?: string, endValue?: string) => {
    // Se passati valori, usali, altrimenti prendi dal form
    const start = typeof startValue === 'string' ? startValue : form.getValues('orarioInizio');
    const end = typeof endValue === 'string' ? endValue : form.getValues('orarioFine');
    const safeStart = start ?? "";
    const safeEnd = end ?? "";
    if (
      safeStart && safeEnd &&
      /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(safeStart) &&
      /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(safeEnd)
    ) {
      const [startHour, startMinute] = safeStart.split(":").map(Number);
      const [endHour, endMinute] = safeEnd.split(":").map(Number);
      if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
        setTimeWarning(t('form.time_warning'));
      } else {
        setTimeWarning(null);
      }
    } else {
      setTimeWarning(null);
    }
  }, [form, t]);

  // Funzione per aggiornare l'orario di fine quando cambiano i servizi selezionati
  const updateEndTimeFromServices = useCallback(() => {
    const startTime = form.getValues('orarioInizio');
    if (!startTime) return;
    
    const totalDuration = dataState.selectedServices.reduce((total, service) => total + service.duration, 0);
    if (totalDuration > 0) {
      const endTime = calculateEndTime(startTime, totalDuration);
      if (endTime) {
        form.setValue('orarioFine', endTime);
        checkTimeWarning(startTime, endTime);
      }
    }
  }, [dataState.selectedServices, form, calculateEndTime, checkTimeWarning]);

  // Effetto per aggiornare l'orario di fine quando cambiano i servizi selezionati
  useEffect(() => {
    if (dataState.selectedServices.length > 0) {
      updateEndTimeFromServices();
    }
  }, [dataState.selectedServices, updateEndTimeFromServices]);

  // Optimize service management with batch updates - declare functions before using them in useMemo
  const handleServiceChange = useCallback((serviceId: string) => {
    const selectedService = servicesState.find(service => service.id === serviceId);
    if (!selectedService) return;

    const isServiceAlreadySelected = dataState.selectedServices.some(
      service => service.id === selectedService.id
    );

    if (isServiceAlreadySelected) return;

    updateDataState({
      selectedServices: [...dataState.selectedServices, selectedService],
    });
  }, [servicesState, dataState.selectedServices, updateDataState]);

  const removeService = useCallback((serviceId: string) => {
    updateDataState({
      selectedServices: dataState.selectedServices.filter(service => service.id !== serviceId),
    });
  }, [dataState.selectedServices, updateDataState]);

  // ServiceSectionMemo: unica dichiarazione valida - now using already defined functions
  // Patch: Pass extraClassName to ServiceSection for SelectContent z-index
  const ServiceSectionMemo = useMemo(() => (
    <ServiceSection
      services={servicesState}
      selectedServices={dataState.selectedServices}
      onServiceAdd={handleServiceChange}
      onServiceRemove={removeService}
      selectContentClassName="z-[9999]"
      modalSettings={modalSettings}
    />
  ), [servicesState, dataState.selectedServices, handleServiceChange, removeService, modalSettings]);

  // Memo per la sezione orari
  const TimeSectionMemo = useMemo(() => (
    <TimeSection form={memoizedForm} modalSettings={modalSettings} />
  ), [memoizedForm, modalSettings]);

  // Banner message with auto-dismissal
  useEffect(() => {
    if (uiState.bannerMessage) {
      const timer = setTimeout(() => {
        updateUiState({ bannerMessage: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uiState.bannerMessage, updateUiState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submissionTimeout) {
        clearTimeout(submissionTimeout);
      }
    };
  }, [submissionTimeout]);

  // Memoize components to prevent unnecessary re-renders
  // Patch: Pass extraClassName to ClientSection for SelectContent z-index
  const ClientSectionMemo = useMemo(() => (
    <ClientSection
      form={memoizedForm}
      clients={dataState.clients}
      handleClientChange={handleClientChange}
      isSheetOpen={uiState.isSheetOpen}
      setIsSheetOpen={(isOpen) => updateUiState({ isSheetOpen: isOpen })}
      fetchClients={() => {}} // No-op, since clients come from props
      setBannerMessage={(message) => updateUiState({ bannerMessage: message })}
      selectContentClassName="z-[9999]"
      modalSettings={modalSettings}
    />
  ), [
    memoizedForm, 
    dataState.clients, 
    handleClientChange, 
    uiState.isSheetOpen, 
    updateUiState,
    modalSettings
  ]);

  // Stato per forzare il rerender di orarioFine quando cambia orarioInizio
  const [orarioInizioVersion, setOrarioInizioVersion] = useState(0);

  // Effetto: aggiorna orarioFine se orarioInizio cambia e orarioFine non è più valido
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'orarioInizio') {
        setOrarioInizioVersion(v => v + 1);
        // Se orarioFine è minore o uguale a orarioInizio, resetta orarioFine
        const startValue = value.orarioInizio ?? "";
        const endValue = value.orarioFine ?? "";
        if (
          /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(startValue) &&
          /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(endValue)
        ) {
          const [startHour, startMinute] = startValue.split(":").map(Number);
          const [endHour, endMinute] = endValue.split(":").map(Number);
          if (
            endHour < startHour ||
            (endHour === startHour && endMinute <= startMinute)
          ) {
            form.setValue('orarioFine', '');
          }
        } else if (!startValue) {
          form.setValue('orarioFine', '');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Memoize the entire form to prevent unnecessary re-renders
  const FormContent = useMemo(() => {
    if (uiState.loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Client Details Section */}
        {modalSettings?.show_client_section !== false && modalSettings?.show_client_section !== "false" && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-gray-700 flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-500" />
            {modalSettings?.client_section_title || t('form.client')}
          </h3>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            {ClientSectionMemo}
          </div>
        </div>
        )}

        {/* Services Section */}
        {modalSettings?.show_service_section !== false && modalSettings?.show_service_section !== "false" && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-gray-700 flex items-center">
            <Cut className="w-4 h-4 mr-2 text-gray-500" />
            {modalSettings?.service_section_title || t('form.services')}
          </h3>
          
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            {ServiceSectionMemo}
          </div>

          {/* Coupon Section */}
          {priceState.isCouponAvailable && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                checked={priceState.useCoupon}
                onChange={async (e) => {
                  setPriceState(prev => ({ ...prev, useCoupon: e.target.checked }));
                  
                  requestAnimationFrame(async () => {
                    if (!isMounted.current) return;
                    
                    if (e.target.checked) {
                      const customerUuid = form.getValues("customer_uuid");
                      if (customerUuid) {
                        const newPrice = await applyCouponMemoized(customerUuid, calculateTotalPrice);
                        setPriceState(prev => ({ ...prev, calculatedPrice: newPrice.toFixed(2) }));
                      }
                    } else {
                      setPriceState(prev => ({ ...prev, calculatedPrice: calculateTotalPrice.toString() }));
                    }
                  });
                }}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{t('form.apply_coupon')}</span>
            </div>
          )}
        </div>
        )}

        {/* Date and Time Section */}
        {modalSettings?.show_time_section !== false && modalSettings?.show_time_section !== "false" && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-gray-700 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            {modalSettings?.time_section_title || t('form.date_time')}
          </h3>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            {/* Data sopra orario di inizio e fine */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">{modalSettings?.date_label || t('form.date')}</FormLabel>
                    <input
                      type="date"
                      {...field}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                    />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="orarioInizio"
                  render={({ field }) => (
                    <FormItem>
                                              <FormLabel className="text-xs font-medium text-gray-700">{modalSettings?.start_time_label || t('form.start_time')}</FormLabel>
                      {/* Orario di inizio con Select shadcn, solo step 5 minuti */}
                      <Select
                        value={field.value}
                        onValueChange={val => {
                          field.onChange(val);
                          checkTimeWarning(val, form.getValues('orarioFine'));
                        }}
                      >
                        <SelectTrigger
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                          onBlur={() => {
                            checkTimeWarning(field.value, form.getValues('orarioFine'));
                          }}
                        >
                          <SelectValue placeholder={modalSettings?.time_placeholder || t('form.select_time')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto z-[9999]">
                          {Array.from({ length: 24 * 12 }, (_, i) => {
                            const hour = Math.floor(i / 12);
                            const minute = (i % 12) * 5;
                            const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            return (
                              <SelectItem key={value} value={value} className="text-sm">
                                {value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                   
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex-1">
                {/* Forza il rerender di orarioFine quando cambia orarioInizio usando orarioInizioVersion come chiave */}
                <FormField
                  key={orarioInizioVersion}
                  control={form.control}
                  name="orarioFine"
                  render={({ field }) => {
                    // Calcola gli orari disponibili per orarioFine in base a orarioInizio
                    const startValue = form.getValues('orarioInizio');
                    let minIndex = 0;
                    const isStartValid = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(startValue);
                    if (isStartValid) {
                      const [startHour, startMinute] = startValue.split(":").map(Number);
                      minIndex = startHour * 12 + Math.floor(startMinute / 5);
                    }
                    return (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-700">{modalSettings?.end_time_label || t('form.end_time')}</FormLabel>
                        {/* Orario di fine con Select shadcn, solo step 5 minuti, nasconde valori minori o uguali a orarioInizio. Disabilitato se orarioInizio non valido */}
                        <Select
                          value={field.value}
                          onValueChange={val => {
                            field.onChange(val);
                            checkTimeWarning(form.getValues('orarioInizio'), val);
                          }}
                          disabled={!isStartValid}
                        >
                          <SelectTrigger
                            className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${!isStartValid ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
                            disabled={!isStartValid}
                          >
                            <SelectValue placeholder={t('form.select_time')} />
                          </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto z-[9999]">
                            {isStartValid ? (
                              Array.from({ length: 24 * 12 }, (_, i) => {
                                if (i <= minIndex) return null;
                                const hour = Math.floor(i / 12);
                                const minute = (i % 12) * 5;
                                const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                return (
                                  <SelectItem key={value} value={value} className="text-sm">
                                    {value}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <div className="px-3 py-2 text-gray-400 text-sm">{t('form.select_start_time_first')}</div>
                            )}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>
            {timeWarning && (
              <div className="mt-2 text-sm text-red-600">{modalSettings?.end_time_before_start_message || t('form.time_warning')}</div>
            )}
          </div>
        </div>
        )}

        {/* Staff and Notes Section */}
        {modalSettings?.show_team_section !== false && modalSettings?.show_team_section !== "false" && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-gray-700">{modalSettings?.team_section_title || t('form.staff_notes')}</h3>
          
          <div className="rounded-lg bg-gray-50 px-3 py-2 space-y-4">
          {/* Staff Selection */}
          <FormField
            control={form.control}
            name="team_id"
            render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">{modalSettings?.team_member_label || t('form.staff')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white">
                <SelectValue placeholder={modalSettings?.team_member_placeholder || t('form.select_staff')} />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-md shadow-lg z-[9999]">
                {teamMembers.map((member) => (
                <SelectItem
                  key={member.id}
                  value={member.id}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  style={{ position: "relative" }}
                >
                  <span className="flex items-center">
                  <span className="flex-1">{member.name}</span>
                  </span>
                </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </FormItem>
            )}
          />

            {/* Notes */}
            {modalSettings?.show_notes_section !== false && modalSettings?.show_notes_section !== "false" && (
            <FormField
              control={form.control}
              name="descrizione"
              render={({ field }) => (
                            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">{modalSettings?.notes_label || t('form.notes')}</FormLabel>
                  <Textarea 
                    placeholder={modalSettings?.notes_placeholder || t('form.notes_placeholder')} 
                    {...field} 
                    className="min-h-[60px] text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none rounded-lg border border-gray-200 px-3 py-2" 
                  />
                </FormItem>
              )}
            />
            )}

            {/* Notification Settings */}
            {modalSettings?.show_notifications_section !== false && modalSettings?.show_notifications_section !== "false" && (
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="notify_client"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-3 bg-white">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs font-medium text-gray-700 flex items-center gap-2">
                        <Notification className="w-4 h-4 text-gray-500" />
                        {modalSettings?.notify_client_label || t('form.notify_client')}
                      </FormLabel>
                      <div className="text-xs text-gray-500">
                        {modalSettings?.notify_client_desc || t('form.notify_client_desc')}
                      </div>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </FormItem>
                )}
              />
            </div>
            )}

            
            {/* Color Selection - pallini selezionabili */}
            {modalSettings?.show_color_section !== false && modalSettings?.show_color_section !== "false" && (
            <FormField
              control={form.control}
              name="color_card"
              render={({ field, fieldState }) => {
                const selectedColors: string[] = Array.isArray(field.value) ? field.value : [];
                const handleToggle = (color: string) => {
                  if (form.getValues('prefer_card_style') === 'default') return;
                  if (selectedColors.includes(color)) {
                    field.onChange(selectedColors.filter((c) => c !== color));
                  } else if (selectedColors.length < 2) {
                    field.onChange([...selectedColors, color]);
                  }
                };
                // Funzione per convertire HEX in rgba con opacità
                const hexToRgba = (hex: string, alpha: number) => {
                  let c = hex.replace('#', '');
                  if (c.length === 3) {
                    c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
                  }
                  const num = parseInt(c, 16);
                  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
                };
                return (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">{modalSettings?.color_card_label || t('form.color_card')}</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PREDEFINED_COLORS.map((color) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => handleToggle(color)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center focus:outline-none transition-all duration-100 ${
                            selectedColors.includes(color)
                              ? 'border-blue-600 ring-2 ring-blue-300 scale-110'
                              : 'border-gray-200'
                          } ${
                            (selectedColors.length === 2 && !selectedColors.includes(color)) || form.getValues('prefer_card_style') === 'default'
                              ? 'opacity-40 cursor-not-allowed'
                              : ''
                          }`}
                          style={{ backgroundColor: hexToRgba(color, 0.45) }}
                          aria-label={`Scegli il colore ${color}`}
                          disabled={
                            (selectedColors.length === 2 && !selectedColors.includes(color)) || form.getValues('prefer_card_style') === 'default'
                          }
                        >
                          {selectedColors.includes(color) && (
                            <span className="w-3 h-3 bg-white rounded-full border border-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Nuova selezione: dove applicare il colore */}
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="prefer_card_style"
                        render={({ field: styleField }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">{modalSettings?.card_style_label || t('form.where_apply_color')}</FormLabel>
                            <div className="flex flex-wrap gap-2 mt-1">
                                                              <button
                                  type="button"
                                  className={`px-2 py-1 rounded border text-xs font-medium ${styleField.value === 'filled' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700'}`}
                                  onClick={() => {
                                    styleField.onChange('filled');
                                    if (form.getValues('color_card')[0] === '#FFFFFF' && form.getValues('color_card').length === 1) {
                                      form.setValue('color_card', []);
                                    }
                                  }}
                                >
                                  {t('form.entire_card')}
                                </button>
                                                              <button
                                  type="button"
                                  className={`px-2 py-1 rounded border text-xs font-medium ${styleField.value === 'top' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700'}`}
                                  onClick={() => {
                                    styleField.onChange('top');
                                    if (form.getValues('color_card')[0] === '#FFFFFF' && form.getValues('color_card').length === 1) {
                                      form.setValue('color_card', []);
                                    }
                                  }}
                                >
                                  {t('form.top_only')}
                                </button>
                                                              <button
                                  type="button"
                                  className={`px-2 py-1 rounded border text-xs font-medium ${styleField.value === 'bottom' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700'}`}
                                  onClick={() => {
                                    styleField.onChange('bottom');
                                    if (form.getValues('color_card')[0] === '#FFFFFF' && form.getValues('color_card').length === 1) {
                                      form.setValue('color_card', []);
                                    }
                                  }}
                                >
                                  {t('form.bottom_only')}
                                </button>
                                                              <button
                                  type="button"
                                  className={`px-2 py-1 rounded border text-xs font-medium ${styleField.value === 'left' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700'}`}
                                  onClick={() => {
                                    styleField.onChange('left');
                                    if (form.getValues('color_card')[0] === '#FFFFFF' && form.getValues('color_card').length === 1) {
                                      form.setValue('color_card', []);
                                    }
                                  }}
                                >
                                  {t('form.left_only')}
                                </button>
                                                              <button
                                  type="button"
                                  className={`px-2 py-1 rounded border text-xs font-medium ${styleField.value === 'right' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700'}`}
                                  onClick={() => {
                                    styleField.onChange('right');
                                    if (form.getValues('color_card')[0] === '#FFFFFF' && form.getValues('color_card').length === 1) {
                                      form.setValue('color_card', []);
                                    }
                                  }}
                                >
                                  {t('form.right_only')}
                                </button>
                              {/* Default bianco */}
                              <button
                                type="button"
                                className={`px-2 py-1 rounded border text-xs font-medium ${styleField.value === 'default' ? 'bg-gray-200 text-gray-900 border-gray-400' : 'bg-white border-gray-300 text-gray-700'}`}
                                onClick={() => {
                                  styleField.onChange('default');
                                  form.setValue('color_card', ['#FFFFFF']);
                                }}
                                style={{ minWidth: 60 }}
                              >
                                {t('form.white')}
                              </button>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Alone luminoso: selezione spessore (selezionabile e deselezionabile) */}
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="alone"
                        render={({ field }) => {
                          // Mappa valori a etichette
                          const aloneOptions = [
                            { value: "1", label: t('form.low') },
                            { value: "2", label: t('form.medium') },
                            { value: "3", label: t('form.high') },
                          ];
                          return (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">{t('form.luminance_glow')}</FormLabel>
                              <div className="flex gap-2 mt-1">
                                {aloneOptions.map(opt => (
                                                                  <button
                                  key={opt.value}
                                  type="button"
                                  className={`px-2 py-1 rounded border text-xs font-medium ${field.value === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700'}`}
                                  onClick={() => field.value === opt.value ? field.onChange("") : field.onChange(opt.value)}
                                >
                                  {opt.label}
                                </button>
                                ))}
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                    {/* Anteprima rettangolare del risultato */}
                    <div className="mt-4">
                      <div
                        className="w-32 h-10 rounded-lg border border-gray-300 shadow-sm flex items-center justify-center text-xs font-medium text-gray-700"
                        style={{
                          // Se default, bianco pieno
                          ...(form.getValues('prefer_card_style') === 'default'
                            ? { background: '#fff' }
                            : selectedColors.length === 2
                              ? { background: `linear-gradient(90deg, ${hexToRgba(selectedColors[0], 0.45)}, ${hexToRgba(selectedColors[1], 0.45)})` }
                              : selectedColors.length === 1
                                ? { background: hexToRgba(selectedColors[0], 0.45) }
                                : { background: '#f3f4f6' }),
                          // Alone luminoso
                          boxShadow: form.getValues('alone') && form.getValues('prefer_card_style') !== 'default' && selectedColors.length > 0
                            ? `0 0 ${parseInt(form.getValues('alone')) * 4}px ${selectedColors[0]}`
                            : undefined
                        }}
                      >
                        {form.getValues('prefer_card_style') === 'default' && t('form.white')}
                        {form.getValues('prefer_card_style') !== 'default' && selectedColors.length === 0 && t('form.preview')}
                        {form.getValues('prefer_card_style') !== 'default' && selectedColors.length === 1 && t('form.single_color')}
                        {form.getValues('prefer_card_style') !== 'default' && selectedColors.length === 2 && t('form.gradient')}
                        {form.getValues('prefer_card_style') !== 'default' && selectedColors.length > 0 && form.getValues('alone') && (
                                                      <span className="ml-2 text-[10px] text-blue-500">
                              {t('form.alone')} {form.getValues('alone') === '1' ? t('form.low') : form.getValues('alone') === '2' ? t('form.medium') : form.getValues('alone') === '3' ? t('form.high') : ''}
                            </span>
                        )}
                      </div>
                    </div>
                    {fieldState.error && (
                      <div className="text-xs text-red-500 mt-1">{fieldState.error.message}</div>
                    )}
                  </FormItem>
                );
              }}
            />
            )}
            </div>
        </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-8 pb-6 px-12 border-t border-gray-200 flex-shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsDialogOpen(false);
              // Reset del ref per il modal
              isModalOpen.current = false;
            }} 
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            {modalSettings?.cancel_button_text || t('form.cancel')}
          </Button>
          <Button 
            type="submit" 
            variant="default" 
            disabled={uiState.isSubmitting}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-6"
          >
            {uiState.isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('form.saving')}
              </div>
            ) : (
              modalSettings?.save_button_text || t('form.create_appointment')
            )}
          </Button>
        </div>
      </div>
    );
  }, [
    uiState.loading,
    uiState.isSheetOpen,
    uiState.isSubmitting,
    dataState.selectedServices,
    priceState,
    calculateTotalPrice,
    ClientSectionMemo,
    ServiceSectionMemo,
    TimeSectionMemo,
    teamMembers,
    form,
    removeService,
    applyCouponMemoized,
    updateUiState,
    setIsDialogOpen,
    isModalOpen.current
  ]);

  // Salvataggio appuntamento
  const handleSubmitWithTimeout = useCallback(async (values: z.infer<typeof formSchema>) => {
    console.log('🚀 [CreateOrderForm] Starting appointment creation...', {
      values: values,
      selectedServices: dataState.selectedServices
    });
    
    updateUiState({ isSubmitting: true });
    try {
      // Recupera salon_id usando getSalonId() che gestisce sia manager che membri del team
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato. Accesso richiesto.");
      
      console.log('👤 [CreateOrderForm] User authenticated:', user.id);
      
      const salon_id = await getSalonId();
      
      if (!salon_id) throw new Error("Impossibile determinare il salone.");
      
      console.log('🏢 [CreateOrderForm] Salon ID determined:', salon_id);

      // Prepara i dati dell'ordine secondo la tabella orders
      const orderData = {
        user_id: user.id,
        nome: values.nome,
        telefono: values.telefono || null,
        email: values.email || null,
        data: values.data,
        orarioInizio: values.orarioInizio,
        orarioFine: values.orarioFine || null,
        prezzo: priceState.useCoupon && priceState.calculatedPrice ? parseFloat(priceState.calculatedPrice) : calculateTotalPrice,
        note: values.descrizione || null,
        status: values.status || 'In corso',
        descrizione: values.descrizione || null,
        team_id: values.team_id || null,
        customer_uuid: values.customer_uuid || null,
        salon_id: salon_id,
        created_at: new Date().toISOString(),
        color_card: Array.isArray(values.color_card) ? values.color_card : [],
        prefer_card_style: values.prefer_card_style || 'filled',
        alone: values.alone || '1', // Salva il valore dell'alone luminoso
        notify_client: values.notify_client, // Salva il valore della notifica
      };

      console.log('📝 [CreateOrderForm] Order data prepared:', orderData);
      
      // Inserisci l'ordine in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      console.log('💾 [CreateOrderForm] Order insert result:', { order, error: orderError });
      
      if (orderError) throw orderError;

      // Inserisci i servizi selezionati nella tabella order_services
      const orderServicesData = dataState.selectedServices.map(service => ({
        order_id: order.id,
        service_id: service.id,
        price: service.price,
        servizio: service.name, // Aggiunta del nome del servizio nella colonna "servizio"
      }));

      if (orderServicesData.length > 0) {
        console.log('🔧 [CreateOrderForm] Order services data:', orderServicesData);
        
        const { error: orderServicesError } = await supabase
          .from('order_services')
          .insert(orderServicesData);
        
        console.log('🔧 [CreateOrderForm] Order services insert result:', { error: orderServicesError });
        
        if (orderServicesError) throw orderServicesError;
      }



      console.log('✅ [CreateOrderForm] Appointment created successfully!');
      
      // Invia notifica al cliente se l'email è presente
      if (orderData.email && orderData.email.trim() !== '') {
        console.log("📧 Invio notifica di conferma al cliente:", orderData.email);
        
        try {
          const notificationData = {
            to: orderData.email,
            customerName: orderData.nome,
            serviceName: orderServicesData.length > 0 ? orderServicesData[0].servizio : "Servizio",
            appointmentDate: orderData.data,
            appointmentTime: orderData.orarioInizio,
            templateType: 'confirmation'
          };

          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData),
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log("✅ Notifica di conferma inviata con successo al cliente");
          } else {
            console.error("❌ Errore nell'invio notifica al cliente:", result.error);
          }
        } catch (notificationError) {
          console.error("❌ Errore generale nell'invio notifica al cliente:", notificationError);
        }
      } else {
        console.log("ℹ️ Nessuna email cliente disponibile per l'invio della notifica");
      }
      
      showSuccessToast(t('form.appointment_created_success'));
      
      // Emetti un evento personalizzato per aggiornare tutte le viste
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointment-created', {
          detail: { appointmentId: order.id }
        }));
      }
      
      // Reset completo del form e dello stato
      form.reset({
        nome: "",
        telefono: "",
        email: "",
        data: "",
        orarioInizio: "10:00",
        prezzo: "",
        orarioFine: "",
        status: "",
        descrizione: "",
        team_id: "",
        customer_uuid: "",
        color_card: [],
        prefer_card_style: "filled",
        alone: "1",
        notify_client: false,
      });
      
      // Reset degli stati
      setDataState({
        clients: dataState.clients, // Mantieni i clients
        selectedServices: [],
        couponCache: {},
      });
      
      setPriceState({
        calculatedPrice: "",
        useCoupon: false,
        isCouponAvailable: false
      });
      
      setTimeWarning(null);
      
      // Reset dello stato UI
      updateUiState({
        loading: false,
        isSheetOpen: false,
        bannerMessage: null,
        isSubmitting: false,
      });
      
      if (onAppointmentCreated) onAppointmentCreated();
      setIsDialogOpen(false);
      
      // Reset del ref per il modal
      isModalOpen.current = false;
    } catch (error: any) {
      console.error('❌ [CreateOrderForm] Error creating appointment:', error);
      updateUiState({ bannerMessage: error.message || t('form.error_creating_appointment') });
    } finally {
      updateUiState({ isSubmitting: false });
    }
  }, [calculateTotalPrice, dataState.selectedServices, dataState.clients, onAppointmentCreated, priceState.calculatedPrice, priceState.useCoupon, setIsDialogOpen, updateUiState, form]);

  return (
    <div className="w-full bg-white">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmitWithTimeout)} 
          className="space-y-4"
        >
          {FormContent}
        </form>
      </Form>
    </div>
  );
}

export default React.memo(CreateOrderForm);
