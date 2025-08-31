'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Calendar, Clock, User, Scissors, FileText, Loader2, Plus, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { createClient } from '@/utils/supabase/client';
import { showSuccessToast } from '../HelperToast';
import { fetchCreateOrderData } from '../query/query';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSalonId } from '@/utils/getSalonId';
import { useLocalization } from '@/hooks/useLocalization';

// Mobile optimization libraries
import { useSwipeable } from 'react-swipeable';
import { useMediaQuery } from 'react-responsive';
import { isMobile as isMobileDevice, isTablet as isTabletDevice } from 'react-device-detect';
import { useIsMobile } from '@/hooks/use-mobile';


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

const formSchema = z
  .object({
    prezzo: z.string().optional(),
    nome: z.string().min(1, { message: "Il nome è obbligatorio." }),
    telefono: z.string().optional(),
    email: z.string().optional(),
    data: z.string().min(1, { message: "La data è obbligatoria." }),
    orarioInizio: z
      .string()
      .min(1, { message: "L'orario di inizio è obbligatorio." })
      .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, { message: "Formato orario di inizio non valido. Usa HH:mm." }),
    orarioFine: z
      .string()
      .min(1, { message: "L'orario di fine è obbligatorio." })
      .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, { message: "Formato orario di fine non valido. Usa HH:mm." }),
    status: z.string().optional().default(""),
    descrizione: z.string().optional(),
    team_id: z.string().min(1, { message: "Selezionare un membro del team." }),
    customer_uuid: z.string().optional(),
    color_card: z.array(z.string()).max(2, { message: "Puoi selezionare massimo 2 colori." }),
    prefer_card_style: z.enum(["filled", "top", "bottom", "left", "right", "default"]).default("filled"),
    alone: z.enum(["1", "2", "3"]).default("1"),
    notify_client: z.boolean().default(false), // Abilita/disabilita notifiche
    notify_method: z.enum(["email", "sms"]).optional(), // Metodo di notifica
    notify_time_minutes: z.number().min(0).max(1440).optional(), // Minuti prima dell'appuntamento
  })
  .refine(
    (data) => {
      if (!data.orarioInizio || !data.orarioFine) return true;
      
      const [startHour, startMinute] = data.orarioInizio.split(":").map(Number);
      const [endHour, endMinute] = data.orarioFine.split(":").map(Number);
      
      // Calculate total minutes for easier comparison
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      return endTotalMinutes > startTotalMinutes;
    },
    {
      message: "⚠️ L'orario di fine deve essere maggiore dell'orario di inizio.",
      path: ["orarioFine"],
    }
  );

interface CreateOrderMobileProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  actionType?: string;
  initialFormData?: {
    data: string;
    orarioInizio: string;
    orarioFine: string;
    team_id?: string;
  } | null;
  onAppointmentCreated?: () => void;
  updateModalState?: (isOpen: boolean) => void;
}

interface Client {
  id: string;
  nome: string;
  customer_uuid: string;
  telefono: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface TeamMember {
  id: string;
  name: string;
}

export function CreateOrderMobile({
  isDialogOpen,
  setIsDialogOpen,
  actionType = 'appointment',
  initialFormData,
  onAppointmentCreated,
  updateModalState
}: CreateOrderMobileProps) {
  const { t } = useLocalization();
  
  // Mobile detection and responsive hooks
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery({ maxWidth: 1024 });
  const isSmallScreen = useMediaQuery({ maxWidth: 640 });
  const isLandscape = useMediaQuery({ orientation: 'landscape' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consolidated state management for better performance
  const [uiState, setUiState] = useState({
    loading: true,
    isSheetOpen: false,
    bannerMessage: null as string | null,
    isSubmitting: false,
  });

  const [dataState, setDataState] = useState({
    clients: [] as Client[],
    selectedServices: [] as Array<{ id: string; name: string; price: number; duration: number }>,
    couponCache: {} as {[key: string]: boolean},
  });

  const [priceState, setPriceState] = useState({
    calculatedPrice: "",
    useCoupon: false,
    isCouponAvailable: false
  });

  const [servicesState, setServicesState] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  // Force rerender of end-time options when start-time changes
  const [orarioInizioVersion, setOrarioInizioVersion] = useState(0);

  // Create ref for tracking mounted state and preventing duplicate fetches
  const isMounted = React.useRef(true);
  const fetchInProgress = React.useRef(false);
  
  // Swipe handlers for mobile navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    },
    onSwipedRight: () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    },
    trackMouse: false,
    delta: 50,
    swipeDuration: 500,
  });
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      fetchInProgress.current = false; // Reset fetch flag on unmount
      
      // Cleanup timers
      if (couponDebounceTimer.current) {
        clearTimeout(couponDebounceTimer.current);
      }
    };
  }, []);

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
      color_card: [],
      prefer_card_style: "filled",
      alone: "1",
      notify_client: false,
      notify_method: undefined,
      notify_time_minutes: undefined,
    },
    mode: "onChange", // Enable real-time validation
  });

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

  // Fetch initial data when modal opens (prevent duplicate calls)
  useEffect(() => {
    if (isDialogOpen && !fetchInProgress.current) {
      console.log('🚀 [CreateOrderMobile] Modal opened, starting data fetch...');
      fetchInProgress.current = true;
      setLoading(true);
      setErrorMessage(null);
      fetchInitialData();
    }
    
    // Reset fetch flag when modal closes
    if (!isDialogOpen) {
      fetchInProgress.current = false;
    }
  }, [isDialogOpen]);

  // Debug effect to monitor servicesState changes (commented out to prevent unnecessary re-renders)
  // useEffect(() => {
  //   console.log('servicesState changed:', servicesState);
  // }, [servicesState]);

  const fetchInitialData = async () => {
    try {
      console.log('🔄 [CreateOrderMobile] Starting fetchInitialData...');
      setLoading(true);
      setErrorMessage(null);

      // Check cache first
      const cacheKey = 'createOrderMobile_cache';
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
      const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache

      if (cacheValid) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            console.log('📦 [CreateOrderMobile] Using cached data');
            
            setStatuses(parsedData.statuses || []);
            setTeamMembers(parsedData.teamMembers || []);
            setServicesState(parsedData.services || []);
            setDataState(prev => ({ ...prev, clients: parsedData.clients || [] }));
            
            // Check for required data
            if (!parsedData.clients || parsedData.clients.length === 0) {
              setErrorMessage('no_clients');
            } else if (!parsedData.teamMembers || parsedData.teamMembers.length === 0) {
              setErrorMessage('no_team');
            } else if (!parsedData.services || parsedData.services.length === 0) {
              setErrorMessage('no_services');
            } else {
              setErrorMessage(null);
            }
            
            setLoading(false);
            setUiState(prev => ({ ...prev, loading: false }));
            fetchInProgress.current = false;
            return;
          } catch (cacheError) {
            console.log('⚠️ [CreateOrderMobile] Cache corrupted, fetching fresh data');
          }
        }
      }

      // Get salon_id using the utility function
      const salonId = await getSalonId();
      if (!salonId) {
        throw new Error(t('mobile.cannot_determine_salon', 'Impossibile determinare il salone associato.'));
      }

      console.log('🏢 [CreateOrderMobile] Salon ID:', salonId);

      const data = await fetchCreateOrderData(salonId);

      // Check if component is still mounted before updating state
      if (!isMounted.current) return;

      console.log('📊 [CreateOrderMobile] Fetched data:', data);
      
      // Set all data at once to prevent multiple re-renders
      setStatuses(data.statuses || []);
      setTeamMembers(data.teamMembers || []);
      
      // Map services properly
      const mappedServices = data.services && data.services.length > 0 
        ? data.services.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            price: Number(s.price),
            duration: Number(s.duration || 0)
          }))
        : [];
      
      setServicesState(mappedServices);
      
      // Ensure all clients have required fields
      const mappedClients = (data.clients || []).map((c: any) => ({
        id: c && c.id !== undefined ? String(c.id) : '',
        nome: c && c.nome ? c.nome : '',
        customer_uuid: c && c.customer_uuid ? c.customer_uuid : (c && c.id ? String(c.id) : ''),
        telefono: c && c.telefono ? c.telefono : '',
        email: c && c.email ? c.email : ''
      }));

      setDataState(prev => ({
        ...prev,
        clients: mappedClients
      }));

      // Cache the data
      const cacheData = {
        statuses: data.statuses || [],
        teamMembers: data.teamMembers || [],
        services: mappedServices,
        clients: mappedClients
      };
      
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        console.log('💾 [CreateOrderMobile] Data cached successfully');
      } catch (cacheError) {
        console.warn('⚠️ [CreateOrderMobile] Failed to cache data:', cacheError);
      }

      // Check for required data
      if (!data.clients || data.clients.length === 0) {
        setErrorMessage('no_clients');
      } else if (!data.teamMembers || data.teamMembers.length === 0) {
        setErrorMessage('no_team');
      } else if (!data.services || data.services.length === 0) {
        setErrorMessage('no_services');
      } else {
        setErrorMessage(null);
      }

    } catch (error) {
      console.error('❌ [CreateOrderMobile] Error fetching initial data:', error);
      if (isMounted.current) {
        setErrorMessage(t('mobile.error_loading', 'Errore durante il caricamento.') + ' ' + (error instanceof Error ? error.message : ""));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setUiState(prev => ({ ...prev, loading: false }));
      }
      fetchInProgress.current = false;
      console.log('✅ [CreateOrderMobile] fetchInitialData completed');
    }
  };

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
      setDataState(prev => ({ 
        ...prev,
        couponCache: { 
          ...prev.couponCache, 
          [customerUuid]: hasCoupon 
        } 
      }));
    }, 300);
    
    // Cleanup
    return () => {
      if (couponDebounceTimer.current) {
        clearTimeout(couponDebounceTimer.current);
      }
    };
  }, [customerUuid]); // Removed dataState.couponCache from dependencies

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
        // Note: applyCoupon function would need to be imported if used
        setPriceState(prev => ({ ...prev, calculatedPrice: calculateTotalPrice.toString() }));
      } else {
        setPriceState(prev => ({ ...prev, calculatedPrice: calculateTotalPrice.toString() }));
      }
    }, 100);
  }, [dataState.clients, form, priceState.useCoupon, calculateTotalPrice, isMounted]);

  // Service management functions - matching form.tsx logic
  const handleServiceChange = useCallback((serviceId: string) => {
    console.log('handleServiceChange called with serviceId:', serviceId);
    console.log('available services:', servicesState);
    
    const selectedService = servicesState.find(service => service.id === serviceId);
    if (!selectedService) {
      console.log('Service not found for ID:', serviceId);
      return;
    }

    console.log('Selected service:', selectedService);

    const isServiceAlreadySelected = dataState.selectedServices.some(
      service => service.id === selectedService.id
    );

    if (isServiceAlreadySelected) {
      console.log('Service already selected');
      return;
    }

    console.log('Adding service to selected services');
    setDataState(prev => ({
      ...prev,
      selectedServices: [...prev.selectedServices, selectedService],
    }));
  }, [servicesState]); // Removed dataState.selectedServices from dependencies

  const removeService = useCallback((serviceId: string) => {
    setDataState(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(service => service.id !== serviceId),
    }));
  }, []); // Removed dataState.selectedServices from dependencies

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

  // Funzione per controllare warning sugli orari
  const checkTimeWarning = useCallback((startValue?: string, endValue?: string) => {
    const start = typeof startValue === 'string' ? startValue : form.getValues('orarioInizio');
    const end = typeof endValue === 'string' ? endValue : form.getValues('orarioFine');
    const safeStart = start ?? "";
    const safeEnd = end ?? "";
    
    // Reset warning if either time is empty
    if (!safeStart || !safeEnd) {
      setTimeWarning(null);
      return;
    }
    
    // Check if times are in valid format
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(safeStart) || !timeRegex.test(safeEnd)) {
      setTimeWarning(null);
      return;
    }
    
    const [startHour, startMinute] = safeStart.split(":").map(Number);
    const [endHour, endMinute] = safeEnd.split(":").map(Number);
    
    // Calculate total minutes for easier comparison
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    if (endTotalMinutes <= startTotalMinutes) {
      setTimeWarning(t('mobile.time_warning', "⚠️ L'orario di fine deve essere maggiore dell'orario di inizio."));
    } else {
      setTimeWarning(null);
    }
  }, [form]);

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
  }, [dataState.selectedServices]); // Removed updateEndTimeFromServices from dependencies

  // Effect to check time warning whenever start or end time changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'orarioInizio' || name === 'orarioFine') {
        checkTimeWarning(value.orarioInizio, value.orarioFine);
      }
      if (name === 'orarioInizio') {
        setOrarioInizioVersion((v) => v + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);



  const handleClose = () => {
    if (!isLoading) {
      setIsDialogOpen(false);
      updateModalState?.(false);
      setCurrentStep(1);
      setDataState(prev => ({ ...prev, selectedServices: [] }));
      setPriceState({ calculatedPrice: "", useCoupon: false, isCouponAvailable: false });
      setErrorMessage(null);
      setLoading(false);
      setUiState(prev => ({ ...prev, loading: false }));
      form.reset();
      fetchInProgress.current = false;
      console.log('🔒 [CreateOrderMobile] Modal closed, state reset');
    }
  };

  // Function to invalidate cache when needed
  const invalidateCache = useCallback(() => {
    try {
      localStorage.removeItem('createOrderMobile_cache');
      localStorage.removeItem('createOrderMobile_cache_timestamp');
      console.log('🗑️ [CreateOrderMobile] Cache invalidated');
    } catch (error) {
      console.warn('⚠️ [CreateOrderMobile] Failed to invalidate cache:', error);
    }
  }, []);

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Salvataggio appuntamento ottimizzato
  const handleSave = async () => {
    // Validate form before proceeding
    const isValid = await form.trigger();
    if (!isValid) {
      showSuccessToast(t('mobile.fill_required_fields', 'Compila correttamente tutti i campi obbligatori'));
      return;
    }
    
    const values = form.getValues();
    
    if (!values.nome || !values.data || !values.orarioInizio || !values.orarioFine || !values.team_id) {
      showSuccessToast(t('mobile.fill_all_required', 'Compila tutti i campi obbligatori'));
      return;
    }

    setUiState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      console.log('💾 [CreateOrderMobile] Starting appointment creation...');
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('mobile.user_not_authenticated', 'Utente non autenticato. Accesso richiesto.'));
      
      console.log('👤 [CreateOrderMobile] User authenticated:', user.id);
      
      const salon_id = await getSalonId();
      if (!salon_id) throw new Error(t('mobile.cannot_determine_salon', 'Impossibile determinare il salone.'));

      // Prepara i dati dell'ordine
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
        alone: values.alone || '1',
        notify_client: values.notify_client,
        notify_method: values.notify_method || null,
        notify_time_minutes: values.notify_time_minutes || null,
      };

      console.log('📝 [CreateOrderMobile] Order data prepared:', orderData);

      // Inserisci l'ordine in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      if (orderError) throw orderError;

      console.log('✅ [CreateOrderMobile] Order created:', order.id);

      // Inserisci i servizi selezionati
      if (dataState.selectedServices.length > 0) {
        const orderServicesData = dataState.selectedServices.map(service => ({
          order_id: order.id,
          service_id: service.id,
          price: service.price,
          servizio: service.name,
        }));

        const { error: orderServicesError } = await supabase
          .from('order_services')
          .insert(orderServicesData);
        
        if (orderServicesError) throw orderServicesError;
        
        console.log('✅ [CreateOrderMobile] Services added to order');
      }

      showSuccessToast(t('mobile.appointment_created_success', 'Appuntamento creato con successo!'));
      
      // Emetti un evento personalizzato per aggiornare tutte le viste
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointment-created', {
          detail: { appointmentId: order.id }
        }));
      }
      
      if (onAppointmentCreated) onAppointmentCreated();
      handleClose();

    } catch (error: any) {
      console.error('❌ [CreateOrderMobile] Error creating appointment:', error);
      showSuccessToast(t('mobile.error_creating_appointment', 'Errore nella creazione dell\'appuntamento:') + ' ' + (error.message || t('mobile.unknown_error', 'Errore sconosciuto')));
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
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

  const getTotalPrice = () => {
    console.log('Current selected services:', dataState.selectedServices);
    return dataState.selectedServices.reduce((sum, service) => sum + service.price, 0);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-violet-600" />
                  {t('mobile.client', 'Cliente')}
                </h4>
                <div className="space-y-4">
                  {/* Client Selection Dropdown */}
                  <Select
                    onValueChange={(value) => {
                      form.setValue("customer_uuid", value);
                      if (value) {
                        handleClientChange(value);
                      }
                    }}
                    value={form.watch("customer_uuid")}
                  >
                    <SelectTrigger className="w-full h-14 bg-white border-gray-200 text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                      <SelectValue placeholder={t('mobile.select_client', 'Seleziona un cliente')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                      {dataState.clients.map((client) => (
                        <SelectItem key={client.id} value={client.customer_uuid} className="py-3 text-base">
                          {client.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-600" />
                  {t('mobile.date_time', 'Data e Orario')}
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="data" className="text-sm font-medium text-gray-700 block mb-2">{t('mobile.date', 'Data')}</Label>
                    <Input
                      type="date"
                      id="data"
                      {...form.register("data")}
                      className="w-full h-14 bg-white border-gray-200 text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orarioInizio" className="text-sm font-medium text-gray-700 block mb-2">{t('mobile.start_time', 'Inizio')}</Label>
                      <Select
                        value={form.watch("orarioInizio")}
                        onValueChange={(val) => {
                          form.setValue("orarioInizio", val);
                          checkTimeWarning(val, form.getValues("orarioFine"));
                        }}
                      >
                        <SelectTrigger className={`create-order-mobile-select-trigger ${
                          form.formState.errors.orarioInizio ? 'border-red-500 focus:ring-red-500' : ''
                        }`}>
                          <SelectValue placeholder={t('mobile.select_time', 'Seleziona orario')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                          {Array.from({ length: 24 * 12 }, (_, i) => {
                            const hour = Math.floor(i / 12);
                            const minute = (i % 12) * 5;
                            const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            return (
                              <SelectItem key={value} value={value} className="py-2 text-sm">
                                {value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.orarioInizio && (
                        <div className="text-sm text-red-600">{form.formState.errors.orarioInizio.message}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orarioFine" className="text-sm font-medium text-gray-700 block mb-2">{t('mobile.end_time', 'Fine')}</Label>
                      {(() => {
                        const startValue = form.getValues("orarioInizio");
                        const isStartValid = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(startValue || "");
                        let minIndex = -1;
                        if (isStartValid) {
                          const [startHour, startMinute] = startValue.split(":").map(Number);
                          minIndex = startHour * 12 + Math.floor(startMinute / 5);
                        }
                        return (
                          <Select
                            key={orarioInizioVersion}
                            value={form.watch("orarioFine")}
                            onValueChange={(val) => {
                              form.setValue("orarioFine", val);
                              checkTimeWarning(form.getValues("orarioInizio"), val);
                            }}
                            disabled={!isStartValid}
                          >
                            <SelectTrigger className={`create-order-mobile-select-trigger ${
                              form.formState.errors.orarioFine || timeWarning ? 'border-red-500 focus:ring-red-500' : ''
                            } ${!isStartValid ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}>
                              <SelectValue placeholder={t('mobile.select_time', 'Seleziona orario')} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                              {isStartValid ? (
                                Array.from({ length: 24 * 12 }, (_, i) => {
                                  if (i <= minIndex) return null;
                                  const hour = Math.floor(i / 12);
                                  const minute = (i % 12) * 5;
                                  const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                  return (
                                    <SelectItem key={value} value={value} className="py-2 text-sm">
                                      {value}
                                    </SelectItem>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-gray-400 text-sm">{t('mobile.select_start_time_first', 'Seleziona prima l\'orario di inizio')}</div>
                              )}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                      {form.formState.errors.orarioFine && (
                        <div className="text-sm text-red-600">{form.formState.errors.orarioFine.message}</div>
                      )}
                    </div>
                  </div>
                  {timeWarning && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                      {timeWarning}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('mobile.team_member', 'Membro del Team')}
              </h4>
              <Select
                onValueChange={(value) => form.setValue("team_id", value)}
                value={form.watch("team_id")}
              >
                <SelectTrigger className="w-full h-12 bg-white border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                  <SelectValue placeholder={t('mobile.select_team_member', 'Seleziona un membro')} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="py-3 text-base">
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                {t('mobile.services', 'Servizi')} ({servicesState.length} {t('mobile.available_services', 'disponibili')})
              </h4>
              {dataState.selectedServices.length > 0 ? (
                <div className="space-y-2">
                  {dataState.selectedServices.map((service, index) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-violet-600">
                          €{service.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeService(service.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-200">
                    <span className="text-sm font-semibold text-violet-900">{t('mobile.total', 'Totale')}</span>
                    <span className="text-sm font-bold text-violet-900">
                      €{getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-500">{t('mobile.no_services_selected', 'Nessun servizio selezionato')}</span>
                </div>
              )}
              <Select
                onValueChange={(value) => {
                  console.log('Select onChange triggered with value:', value);
                  console.log('Current servicesState:', servicesState);
                  if (value) {
                    handleServiceChange(value);
                  }
                }}
                value=""
              >
                <SelectTrigger className="w-full mt-3 h-12 bg-violet-50 border-violet-200 text-violet-700 font-medium hover:bg-violet-100 transition-colors">
                  <SelectValue placeholder={t('mobile.add_service', 'Aggiungi Servizio')} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                  {servicesState.map((service) => (
                    <SelectItem key={service.id} value={service.id} className="py-3 text-base whitespace-normal">
                      <div className="flex flex-col">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-sm text-gray-600">
                          €{service.price.toFixed(2)} • {service.duration}min
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('mobile.notes', 'Note')}
              </h4>
              <div className="space-y-2">
                <Label htmlFor="descrizione" className="text-sm font-medium text-gray-700 block mb-1">{t('mobile.notes', 'Note')}</Label>
                <Textarea
                  id="descrizione"
                  placeholder={t('mobile.notes_placeholder', 'Aggiungi note per l\'appuntamento...')}
                  {...form.register("descrizione")}
                  rows={4}
                  className="w-full bg-white border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {t('mobile.notifications', 'Notifiche')}
              </h4>
              <div className="space-y-4">
                {/* Notification Toggle */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-700">{t('mobile.send_notification', 'Invia notifica al cliente')}</div>
                    <div className="text-xs text-gray-500">{t('mobile.notification_description', 'Promemoria via email o SMS')}</div>
                  </div>
                  <Switch
                    checked={form.watch("notify_client")}
                    onCheckedChange={(checked) => form.setValue("notify_client", checked)}
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>

                {/* Notification Options - only show if enabled */}
                {form.watch("notify_client") && (
                  <div className="space-y-3 p-3 bg-violet-50 rounded-lg border border-violet-200">
                    {/* Notification Method */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{t('mobile.notification_method', 'Metodo di notifica')}</Label>
                      <Select
                        onValueChange={(value) => form.setValue("notify_method", value as "email" | "sms")}
                        value={form.watch("notify_method")}
                      >
                        <SelectTrigger className="w-full h-12 bg-white border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                          <SelectValue placeholder={t('mobile.select_method', 'Seleziona metodo')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                          <SelectItem value="email" className="py-3 text-base">Email</SelectItem>
                          <SelectItem value="sms" className="py-3 text-base">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notification Timing */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{t('mobile.send_notification_time', 'Invia notifica')}</Label>
                      <Select
                        onValueChange={(value) => form.setValue("notify_time_minutes", Number(value))}
                        value={form.watch("notify_time_minutes")?.toString()}
                      >
                        <SelectTrigger className="w-full h-12 bg-white border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                          <SelectValue placeholder={t('mobile.select_time_before', 'Seleziona tempo')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                          <SelectItem value="15" className="py-3 text-base">15 {t('mobile.minutes_before', 'minuti prima')}</SelectItem>
                          <SelectItem value="30" className="py-3 text-base">30 {t('mobile.minutes_before', 'minuti prima')}</SelectItem>
                          <SelectItem value="60" className="py-3 text-base">1 {t('mobile.hour_before', 'ora prima')}</SelectItem>
                          <SelectItem value="120" className="py-3 text-base">2 {t('mobile.hours_before', 'ore prima')}</SelectItem>
                          <SelectItem value="1440" className="py-3 text-base">1 {t('mobile.day_before', 'giorno prima')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{t('mobile.final_summary', 'Riepilogo Finale')}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{t('mobile.client', 'Cliente')}</span>
                  <span className="text-sm text-gray-900 font-medium">{form.getValues("nome") || t('mobile.not_specified', 'Non specificato')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{t('mobile.date', 'Data')}</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {form.getValues("data") ? formatDate(form.getValues("data")) : t('mobile.not_set', 'Non impostata')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{t('mobile.start_time', 'Orario')}</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {form.getValues("orarioInizio") && form.getValues("orarioFine") 
                      ? `${formatTime(form.getValues("orarioInizio"))} - ${formatTime(form.getValues("orarioFine"))}`
                      : t('mobile.not_set', 'Non impostato')
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{t('mobile.services', 'Servizi')}</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {dataState.selectedServices.length} {t('mobile.services_count', 'servizi')}
                  </span>
                </div>
                {dataState.selectedServices.length > 0 && (
                  <div className="space-y-2">
                    {dataState.selectedServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-sm text-gray-700">{service.name}</span>
                        <span className="text-sm font-semibold text-violet-600">
                          €{service.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-200">
                  <span className="text-sm font-semibold text-violet-900">{t('mobile.total', 'Totale')}</span>
                  <span className="text-sm font-bold text-violet-900">
                    €{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                
                {/* Notification Summary */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{t('mobile.notifications', 'Notifiche')}</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {form.getValues("notify_client") ? (
                      <span className="text-green-600">
                        {form.getValues("notify_method") === "email" ? "Email" : "SMS"} - {
                          form.getValues("notify_time_minutes") === 15 ? `15 ${t('mobile.minutes_before', 'min prima')}` :
                          form.getValues("notify_time_minutes") === 30 ? `30 ${t('mobile.minutes_before', 'min prima')}` :
                          form.getValues("notify_time_minutes") === 60 ? `1 ${t('mobile.hour_before', 'ora prima')}` :
                          form.getValues("notify_time_minutes") === 120 ? `2 ${t('mobile.hours_before', 'ore prima')}` :
                          form.getValues("notify_time_minutes") === 1440 ? `1 ${t('mobile.day_before', 'giorno prima')}` :
                          t('mobile.not_set', 'Tempo non specificato')
                        }
                      </span>
                    ) : (
                      <span className="text-gray-500">{t('mobile.disabled', 'Disabilitate')}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderErrorContent = () => {
    if (errorMessage === 'no_clients') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <User className="w-12 h-12 text-violet-400 mb-3" />
          <div className="text-xl font-semibold text-gray-700 mb-1">{t('mobile.no_clients_found', 'Nessun cliente trovato')}</div>
          <div className="text-base text-gray-500">{t('mobile.add_client_message', 'Aggiungi un cliente per poter creare un nuovo appuntamento o vendita.')}</div>
        </div>
      );
    } else if (errorMessage === 'no_team') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <User className="w-12 h-12 text-violet-400 mb-3" />
          <div className="text-xl font-semibold text-gray-700 mb-1">{t('mobile.no_team_found', 'Nessun membro del team trovato')}</div>
          <div className="text-base text-gray-500">{t('mobile.add_team_message', 'Aggiungi membri del team per poter gestire appuntamenti o vendite.')}</div>
        </div>
      );
    } else if (errorMessage === 'no_services') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Scissors className="w-12 h-12 text-violet-400 mb-3" />
          <div className="text-xl font-semibold text-gray-700 mb-1">{t('mobile.no_services_found', 'Nessun servizio attivo trovato')}</div>
          <div className="text-base text-gray-500">{t('mobile.add_services_message', 'Aggiungi servizi per poterli selezionare durante la creazione di appuntamenti o vendite.')}</div>
        </div>
      );
    } else if (errorMessage) {
      return (
        <div className="text-center text-red-500 text-sm mt-10">{errorMessage}</div>
      );
    }
    return null;
  };

  return (
    <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh] max-h-[95vh] w-full rounded-t-3xl border-0 p-0 overflow-hidden"
        {...swipeHandlers}
      >
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-4 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors h-10 w-10"
              >
                <X className="w-5 h-5 text-gray-600" />
              </Button>
              <h1 className="text-lg font-bold text-gray-900 flex-1 text-center mx-3 truncate">
                {t('mobile.new_appointment', 'Nuovo Appuntamento')}
              </h1>
              <div className="w-10"></div>
            </div>

            {/* Progress Steps */}
            <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step <= currentStep 
                        ? 'bg-violet-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                        step < currentStep ? 'bg-violet-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 mt-4">{t('mobile.loading_data', 'Caricamento dati...')}</p>
                </div>
              ) : errorMessage ? (
                renderErrorContent()
              ) : (
                <div className="space-y-6">
                  {renderStepContent()}

                  {/* Action Buttons */}
                  <div className="space-y-4 pt-6 pb-4">
                    {currentStep < 4 ? (
                      <Button
                        onClick={handleNextStep}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 active:scale-95 shadow-lg text-base h-14"
                      >
                        {t('mobile.next', 'Avanti')}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSave}
                        disabled={uiState.isSubmitting}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base h-14"
                      >
                        {uiState.isSubmitting ? (
                          <div className="flex items-center">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {t('mobile.creating', 'Creazione...')}
                          </div>
                        ) : (
                          t('mobile.create_appointment', 'Crea Appuntamento')
                        )}
                      </Button>
                    )}
                    
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        onClick={handlePrevStep}
                        disabled={uiState.isSubmitting}
                        className="w-full py-4 rounded-2xl font-semibold transition-all duration-200 active:scale-95 border-gray-300 text-gray-700 hover:bg-gray-50 text-base h-14"
                      >
                        {t('mobile.back', 'Indietro')}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      disabled={uiState.isSubmitting}
                      className="w-full py-4 rounded-2xl font-semibold transition-all duration-200 active:scale-95 border-gray-300 text-gray-700 hover:bg-gray-50 text-base h-14"
                    >
                      {t('mobile.cancel', 'Annulla')}
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    );
}
