"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Euro, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  Plus,
  CalendarPlus,
  Archive,
  ArchiveRestore,
  Edit3,
  Bell,
  BellOff
} from "lucide-react";
import { format, parseISO, addMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { getSalonId } from '@/utils/getSalonId';
import { useIsMobile } from '@/hooks/use-mobile';
import OnlineBookingsMobile from './OnlineBookingsMobile';
import { usePermissions } from '../Impostazioni/usePermission';
import { sendBookingConfirmationEmail, sendBookingModificationEmail, sendBookingCancellationEmail, testEmailConnection } from '@/utils/emailService';
import { useCustomTexts } from '@/hooks/useCustomTexts';

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
  archived: boolean;
  created_at: string;
  updated_at: string;
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

export default function OnlineBookingsPage(props: any) {
  const {
    toggleDay,
    toggleClients,
    toggleOnlineBookings,
    showDay,
    showClients,
    showOnlineBookings,
  } = props || {};
  const { t, formatDate, formatCurrency, currentLanguage } = useLocalization();
  const [bookings, setBookings] = useState<OnlineBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<OnlineBooking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingBooking, setConvertingBooking] = useState<OnlineBooking | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [converting, setConverting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<OnlineBooking | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [archivingBooking, setArchivingBooking] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const [maxRetries] = useState(3);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);

  const supabase = createClient();
  const isMobile = useIsMobile();
  
  // 🔧 FIX: Ref per tracciare la subscription attiva e prevenire duplicati
  const activeSubscriptionRef = useRef<any>(null);
  const isSettingUpSubscriptionRef = useRef(false);
  
  // Get permissions
  const { hasPermission, loading: permissionsLoading } = usePermissions(session);
  
  // Get custom texts
  const { getText } = useCustomTexts();

  // Funzione per aggiungere log di debug
  const addDebugLog = (message: string) => {
    if (debugMode) {
      const timestamp = new Date().toLocaleTimeString();
      setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]); // Mantieni solo gli ultimi 10 log
    }
  };

  // 🔧 FIX: Funzione per pulire la subscription attiva
  const cleanupActiveSubscription = () => {
    if (activeSubscriptionRef.current) {
      addDebugLog('Pulizia subscription attiva');
      supabase.removeChannel(activeSubscriptionRef.current);
      activeSubscriptionRef.current = null;
    }
  };

  // Sistema di heartbeat per monitorare la connessione
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastUpdate = now.getTime() - lastRefreshTime.getTime();
      const timeSinceLastHeartbeat = now.getTime() - lastHeartbeat.getTime();
      
      // Valuta la qualità della connessione
      if (subscriptionStatus === 'SUBSCRIBED') {
        if (timeSinceLastUpdate < 60000) { // Meno di 1 minuto
          setConnectionQuality('excellent');
        } else if (timeSinceLastUpdate < 120000) { // Meno di 2 minuti
          setConnectionQuality('good');
        } else {
          setConnectionQuality('poor');
        }
      } else {
        setConnectionQuality('unknown');
      }
      
      // Se sono passati più di 2 minuti senza aggiornamenti, potrebbe esserci un problema
      if (timeSinceLastUpdate > 120000 && subscriptionStatus === 'SUBSCRIBED') {
        console.warn('Nessun aggiornamento ricevuto da più di 2 minuti, verifico la connessione...');
        addDebugLog('Nessun aggiornamento da 2+ minuti, riconnessione...');
        setSubscriptionStatus('connecting');
        setupRealtimeSubscription();
      }
      
      // Aggiorna il heartbeat ogni 30 secondi
      if (timeSinceLastHeartbeat > 30000) {
        setLastHeartbeat(now);
      }
    }, 30000); // Controlla ogni 30 secondi

    return () => clearInterval(heartbeatInterval);
  }, [lastRefreshTime, lastHeartbeat, subscriptionStatus]);

  // Gestione della visibilità della pagina per riconnessione automatica
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && subscriptionStatus !== 'SUBSCRIBED') {
        console.log('Pagina tornata visibile, riconnetto la subscription...');
        setupRealtimeSubscription();
      }
    };

    const handleOnline = () => {
      console.log('Connessione internet ripristinata, riconnetto la subscription...');
      setupRealtimeSubscription();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [subscriptionStatus]);

  // Funzione per riprovare la subscription
  const retrySubscription = async () => {
    if (retryCount < maxRetries) {
      const message = `Riprovo la subscription (tentativo ${retryCount + 1}/${maxRetries})`;
      console.log(message);
      addDebugLog(message);
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        setupRealtimeSubscription();
      }, 2000 * (retryCount + 1)); // Backoff esponenziale
    } else {
      const message = 'Numero massimo di tentativi raggiunto per la subscription';
      console.error(message);
      addDebugLog(message);
      setSubscriptionStatus('failed');
    }
  };

  // 🔧 FIX: Funzione per configurare la subscription real-time con gestione duplicati
  const setupRealtimeSubscription = async () => {
    // 🔧 FIX: Previeni setup multipli simultanei
    if (isSettingUpSubscriptionRef.current) {
      addDebugLog('Setup subscription già in corso, skip');
      return;
    }

    try {
      isSettingUpSubscriptionRef.current = true;
      setSubscriptionStatus('connecting');
      addDebugLog('Avvio configurazione subscription real-time');
      
      // 🔧 FIX: Pulisci sempre la subscription precedente
      cleanupActiveSubscription();
      
      const salonId = await getSalonId();
      if (!salonId) {
        const message = "Impossibile determinare il salone per la subscription";
        console.error(message);
        addDebugLog(message);
        setSubscriptionStatus('failed');
        return;
      }

      const message = `Setting up real-time subscription for salon: ${salonId}`;
      console.log(message);
      addDebugLog(message);

      const channel = supabase
        .channel('online_bookings_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'online_bookings',
            filter: `salon_id=eq.${salonId}`
          },
          (payload) => {
            console.log('Cambio rilevato nelle prenotazioni online:', payload);
            addDebugLog(`Cambio rilevato: ${payload.eventType} - ID: ${(payload.new as any)?.id || (payload.old as any)?.id}`);
            
            // 🔧 FIX: Aggiorna la lista delle prenotazioni in tempo reale con controllo duplicati
            if (payload.eventType === 'INSERT') {
              // Nuova prenotazione aggiunta - controlla se esiste già e se deve essere mostrata
              const newBooking = payload.new as OnlineBooking;
              if (newBooking.archived === showArchived) {
                setBookings(prev => {
                  const existingBooking = prev.find(b => b.id === newBooking.id);
                  if (existingBooking) {
                    addDebugLog(`Prenotazione ${newBooking.id} già presente, skip`);
                    return prev;
                  }
                  addDebugLog(`Nuova prenotazione aggiunta: ${newBooking.customer_name}`);
                  return [newBooking, ...prev];
                });
                if (!showArchived) {
                  setNewBookingsCount(prev => prev + 1);
                }
                setLastRefreshTime(new Date());
              }
            } else if (payload.eventType === 'UPDATE') {
              // Prenotazione aggiornata
              const updatedBooking = payload.new as OnlineBooking;
              if (updatedBooking.archived === showArchived) {
                setBookings(prev => 
                  prev.map(booking => 
                    booking.id === updatedBooking.id 
                      ? updatedBooking
                      : booking
                  )
                );
                setLastRefreshTime(new Date());
                addDebugLog(`Prenotazione aggiornata: ${updatedBooking.customer_name}`);
              } else {
                // Se lo stato di archiviazione è cambiato, rimuovi dalla lista corrente
                setBookings(prev => 
                  prev.filter(booking => booking.id !== updatedBooking.id)
                );
                setLastRefreshTime(new Date());
                addDebugLog(`Prenotazione ${updatedBooking.customer_name} rimossa dalla vista corrente`);
              }
            } else if (payload.eventType === 'DELETE') {
              // Prenotazione eliminata
              setBookings(prev => 
                prev.filter(booking => booking.id !== payload.old.id)
              );
              setLastRefreshTime(new Date());
              addDebugLog(`Prenotazione eliminata: ${payload.old.customer_name}`);
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          addDebugLog(`Subscription status: ${status}`);
          setSubscriptionStatus(status);
          
          if (status === 'SUBSCRIBED') {
            const message = 'Real-time subscription attiva per le prenotazioni online';
            console.log(message);
            addDebugLog(message);
            setRetryCount(0); // Reset retry count on success
            // 🔧 FIX: Salva il riferimento alla subscription attiva
            activeSubscriptionRef.current = channel;
          } else if (status === 'CHANNEL_ERROR') {
            const message = 'Errore nella subscription real-time';
            console.error(message);
            addDebugLog(message);
            retrySubscription();
          } else if (status === 'TIMED_OUT') {
            const message = 'Timeout nella subscription real-time';
            console.error(message);
            addDebugLog(message);
            retrySubscription();
          }
        });

    } catch (error) {
      const message = `Errore nella configurazione della subscription real-time: ${error}`;
      console.error(message);
      addDebugLog(message);
      setSubscriptionStatus('failed');
      retrySubscription();
    } finally {
      isSettingUpSubscriptionRef.current = false;
    }
  };

  useEffect(() => {
    // Get current session for permissions
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    fetchBookings();
    fetchTeamMembers();
    fetchServices();

    // Setup real-time subscription for online bookings
    setupRealtimeSubscription();

    // 🔧 FIX: Cleanup della subscription quando il componente viene smontato
    return () => {
      addDebugLog('Cleanup componente - rimozione subscription');
      cleanupActiveSubscription();
    };
  }, []);

  // Ricarica i dati quando cambia il filtro di archiviazione
  useEffect(() => {
    fetchBookings();
  }, [showArchived]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const salonId = await getSalonId();
      if (!salonId) {
        console.error("Impossibile determinare il salone");
        return;
      }

      const { data, error } = await supabase
        .from('online_bookings')
        .select('*')
        .eq('salon_id', salonId)
        .eq('archived', showArchived)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore nel caricamento delle prenotazioni:', error);
        return;
      }

      // 🔧 FIX: Controlla duplicati prima di aggiornare lo stato
      setBookings(prev => {
        if (!data || data.length === 0) return [];
        
        // Crea un Set con gli ID esistenti per controllo rapido
        const existingIds = new Set(prev.map(b => b.id));
        
        // Filtra i nuovi dati per rimuovere duplicati
        const uniqueNewBookings = data.filter(booking => !existingIds.has(booking.id));
        
        if (uniqueNewBookings.length !== data.length) {
          addDebugLog(`Rimossi ${data.length - uniqueNewBookings.length} duplicati dal fetch`);
        }
        
        // Combina i dati esistenti con quelli nuovi, rimuovendo duplicati
        const allBookings = [...prev, ...uniqueNewBookings];
        
        // Rimuovi duplicati basati su ID e mantieni solo la versione più recente
        const bookingMap = new Map();
        allBookings.forEach(booking => {
          const existing = bookingMap.get(booking.id);
          if (!existing || new Date(booking.updated_at) > new Date(existing.updated_at)) {
            bookingMap.set(booking.id, booking);
          }
        });
        
        const finalBookings = Array.from(bookingMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return finalBookings;
      });
    } catch (error) {
      console.error('Errore nel caricamento delle prenotazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const salonId = await getSalonId();
      if (!salonId) {
        console.error("Impossibile determinare il salone");
        return;
      }

      const { data, error } = await supabase
        .from('team')
        .select('id, name')
        .eq('is_active', true)
        .eq('salon_id', salonId);

      if (error) {
        console.error('Errore nel caricamento del team:', error);
        return;
      }

      setTeamMembers(data || []);
    } catch (error) {
      console.error('Errore nel caricamento del team:', error);
    }
  };

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

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      
      // 🔧 FIX: Controlla se lo status è già quello richiesto
      const currentBooking = bookings.find(b => b.id === bookingId);
      if (currentBooking && currentBooking.status === newStatus) {
        addDebugLog(`Status già ${newStatus} per prenotazione ${bookingId}, skip`);
        setUpdatingStatus(null);
        return;
      }
      
      // Se stiamo confermando una prenotazione, apri il modal di conversione
      if (newStatus === 'confirmed') {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          setConvertingBooking(booking);
          setSelectedTeamMember("");
          // Trova e seleziona automaticamente il servizio corrispondente
          const matchingService = services.find(service => 
            service.name.toLowerCase() === booking.service_name.toLowerCase() ||
            (booking.service_id && service.id === booking.service_id.toString())
          );
          setSelectedService(matchingService?.id || "");
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
              addDebugLog(`Email di cancellazione inviata a ${booking.customer_email}`);
            } else {
              console.warn('Errore nell\'invio email cancellazione:', emailResult.error);
              addDebugLog(`Errore invio email cancellazione: ${emailResult.error}`);
            }
          } catch (emailError) {
            console.error('Errore nell\'invio email cancellazione:', emailError);
            addDebugLog(`Errore invio email cancellazione: ${emailError}`);
          }
        } else if (!emailNotificationsEnabled) {
          addDebugLog('Notifiche email disabilitate');
        }
      }
      
      const { error } = await supabase
        .from('online_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Errore nell\'aggiornamento dello status:', error);
        return;
      }

      // 🔧 FIX: Aggiorna la lista locale con controllo duplicati
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus, updated_at: new Date().toISOString() }
            : booking
        )
      );

      // Notifica le navbar per aggiornare i badge prenotazioni
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('onlineBookings:updated'));
      }

      // Aggiorna anche il booking selezionato nel modal
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
      }
      
      addDebugLog(`Status aggiornato a ${newStatus} per prenotazione ${bookingId}`);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleArchiveBooking = async (bookingId: string) => {
    try {
      setArchivingBooking(bookingId);
      
      const currentBooking = bookings.find(b => b.id === bookingId);
      if (!currentBooking) {
        console.error('Prenotazione non trovata');
        return;
      }

      const newArchivedStatus = !currentBooking.archived;
      
      const { error } = await supabase
        .from('online_bookings')
        .update({ archived: newArchivedStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Errore nell\'archiviazione della prenotazione:', error);
        return;
      }

      // Rimuovi la prenotazione dalla lista corrente
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      
      // Aggiorna anche il booking selezionato nel modal se necessario
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null);
        setIsDetailModalOpen(false);
      }
      
      addDebugLog(`Prenotazione ${bookingId} ${newArchivedStatus ? 'archiviata' : 'ripristinata'}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('onlineBookings:updated'));
      }
    } catch (error) {
      console.error('Errore nell\'archiviazione della prenotazione:', error);
    } finally {
      setArchivingBooking(null);
    }
  };

  const convertToAppointment = async () => {
    if (!convertingBooking || !selectedTeamMember || !selectedService) {
      console.error('Dati mancanti per la conversione');
      return;
    }

    // 🔧 FIX: Controlla se la prenotazione è già stata convertita
    if (convertingBooking.status === 'confirmed') {
      addDebugLog(`Prenotazione ${convertingBooking.id} già confermata, skip conversione`);
      setIsConvertModalOpen(false);
      setConvertingBooking(null);
      setConverting(false);
      return;
    }

    // 🔧 FIX: Controlla se l'operazione è già in corso
    if (converting) {
      addDebugLog(`Conversione già in corso per prenotazione ${convertingBooking.id}, skip`);
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
      // Assicurati che l'orario sia nel formato HH:mm (rimuovi i secondi se presenti)
      const cleanStartTime = startTime.split(':').slice(0, 2).join(':');
      const [hours, minutes] = cleanStartTime.split(':').map(Number);
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
          orarioInizio: cleanStartTime, // Usa il formato HH:mm pulito
          orarioFine: endTime,
          prezzo: service.price,
          note: convertingBooking.notes || `Prenotazione online convertita - ID: ${convertingBooking.id}`,
          descrizione: convertingBooking.notes || `Prenotazione online convertita - ID: ${convertingBooking.id}`,
          status: 'In corso',
          team_id: selectedTeamMember,
          customer_uuid: customerUuid,
          user_id: user.id,
          salon_id: salonId,
          created_at: new Date().toISOString(),
          color_card: ['#8B5CF6'], // Colore viola per prenotazioni online
          prefer_card_style: 'filled',
          alone: '1' // Valore di default per l'alone luminoso
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

      // Aggiorna la lista locale
      setBookings(prev => 
        prev.map(booking => 
          booking.id === convertingBooking.id 
            ? { ...booking, status: 'confirmed' }
            : booking
        )
      );

      // Emetti un evento personalizzato per aggiornare tutte le viste del calendario
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointment-created', {
          detail: { appointmentId: appointment.id }
        }));
      }

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
            addDebugLog(`Email di conferma inviata a ${convertingBooking.customer_email}`);
          } else {
            console.warn('Errore nell\'invio email:', emailResult.error);
            addDebugLog(`Errore invio email: ${emailResult.error}`);
          }
        } catch (emailError) {
          console.error('Errore nell\'invio email:', emailError);
          addDebugLog(`Errore invio email: ${emailError}`);
        }
      } else if (!emailNotificationsEnabled) {
        addDebugLog('Notifiche email disabilitate');
      } else {
        addDebugLog('Nessuna email cliente disponibile per l\'invio della conferma');
      }

      // Chiudi il modal e resetta i campi
      setIsConvertModalOpen(false);
      setConvertingBooking(null);
      setSelectedTeamMember("");
      setSelectedService("");

      // Ricarica le prenotazioni
      await fetchBookings();

    } catch (error) {
      console.error('Errore nella conversione:', error);
      alert(getText('booking_system_error', `Errore nella conversione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`));
    } finally {
      setConverting(false);
    }
  };

  const openConvertModal = (booking: OnlineBooking) => {
    setConvertingBooking(booking);
    setSelectedTeamMember("");
    // Trova e seleziona automaticamente il servizio corrispondente
    const matchingService = services.find(service => 
      service.name.toLowerCase() === booking.service_name.toLowerCase() ||
      (booking.service_id && service.id === booking.service_id.toString())
    );
    setSelectedService(matchingService?.id || "");
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

      // Aggiorna la lista locale
      setBookings(prev => 
        prev.map(booking => 
          booking.id === editingBooking.id 
            ? { 
                ...booking, 
                requested_date: editDate,
                requested_time: editTime,
                start_time: editTime,
                booking_date: editDate,
                updated_at: new Date().toISOString()
              }
            : booking
        )
      );

      // Aggiorna anche il booking selezionato nel modal se necessario
      if (selectedBooking?.id === editingBooking.id) {
        setSelectedBooking(prev => prev ? { 
          ...prev, 
          requested_date: editDate,
          requested_time: editTime,
          start_time: editTime,
          booking_date: editDate,
          updated_at: new Date().toISOString()
        } : null);
      }

      addDebugLog(`Orari aggiornati per prenotazione ${editingBooking.id}`);
      
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
            addDebugLog(`Email di modifica inviata a ${editingBooking.customer_email}`);
          } else {
            console.warn('Errore nell\'invio email modifica:', emailResult.error);
            addDebugLog(`Errore invio email modifica: ${emailResult.error}`);
          }
        } catch (emailError) {
          console.error('Errore nell\'invio email modifica:', emailError);
          addDebugLog(`Errore invio email modifica: ${emailError}`);
        }
      } else if (!emailNotificationsEnabled) {
        addDebugLog('Notifiche email disabilitate');
      } else {
        addDebugLog('Nessuna email cliente disponibile per l\'invio della notifica di modifica');
      }
      
      // Chiudi il modal e resetta i campi
      setIsEditModalOpen(false);
      setEditingBooking(null);
      setEditDate("");
      setEditTime("");

    } catch (error) {
      console.error('Errore nella modifica degli orari:', error);
      alert(getText('booking_system_error', `Errore nella modifica degli orari: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`));
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

  const resetNewBookingsCount = () => {
    setNewBookingsCount(0);
  };

  const getTeamMemberName = (teamMemberId: string | null) => {
    if (!teamMemberId) return getText('booking_team_not_assigned', "Non assegnato");
    const member = teamMembers.find(m => m.id === teamMemberId);
    return member ? member.name : getText('booking_team_member_not_found', "Membro non trovato");
  };

  if (loading || permissionsLoading) {
    // Mobile-friendly loading UI aligned with Appuntamenti/Clienti
    if (isMobile) {
      return (
        <div className="fixed inset-0 bg-[#f8fafc] flex items-center justify-center z-50">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
            </div>
            <p className="text-sm text-gray-500 text-center">{t('prenotazioni.loading.mobile', 'Caricamento prenotazioni online...')}</p>
          </div>
        </div>
      );
    }
    // Desktop loading UI
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t('prenotazioni.loading.desktop', 'Caricamento prenotazioni online...')}</span>
        </div>
      </div>
    );
  }

  // 🔒 Controllo autorizzazione - Solo chi ha canViewOnlineBookings può accedere
  if (!hasPermission('canViewOnlineBookings')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('prenotazioni.access_denied.title', 'Accesso Negato')}</h3>
            <p className="text-gray-600 mb-4">
              {t('prenotazioni.access_denied.message', 'Non hai i permessi per visualizzare le prenotazioni online.')}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">{t('prenotazioni.access_denied.required_permission', 'Permesso Richiesto')}</span>
              </div>
              <p className="text-sm text-red-600 mt-2">
                canViewOnlineBookings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render mobile version
  if (isMobile) {
    return (
      <OnlineBookingsMobile 
        bookings={filteredBookings}
        onUpdateStatus={updateBookingStatus}
        onRefresh={fetchBookings}
        teamMembers={teamMembers}
        hasPermission={hasPermission}
        // Mobile navbar toggles/visibility (use passed-in handlers)
        toggleDay={toggleDay}
        toggleClients={toggleClients}
        toggleOnlineBookings={toggleOnlineBookings}
        showDay={showDay}
        showClients={showClients}
        showOnlineBookings={showOnlineBookings ?? true}
      />
    );
  }

  // Render desktop version
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('prenotazioni.title', 'Prenotazioni Online')}</h1>
          <p className="text-gray-600 mt-1">
            {t('prenotazioni.description', 'Gestisci le prenotazioni ricevute dal sito web')}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              {subscriptionStatus === 'SUBSCRIBED' ? (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              ) : subscriptionStatus === 'connecting' ? (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              ) : subscriptionStatus === 'failed' ? (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              ) : (
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              )}
              <span>
                {subscriptionStatus === 'SUBSCRIBED' && t('prenotazioni.status.realtime_active', 'Aggiornamento in tempo reale attivo')}
                {subscriptionStatus === 'connecting' && t('prenotazioni.status.connecting', 'Connessione in corso...')}
                {subscriptionStatus === 'failed' && t('prenotazioni.status.connection_error', 'Errore di connessione')}
                {subscriptionStatus === 'CHANNEL_ERROR' && t('prenotazioni.status.connection_error', 'Errore di connessione')}
                {subscriptionStatus === 'TIMED_OUT' && t('prenotazioni.status.timeout', 'Timeout di connessione')}
                {!['SUBSCRIBED', 'connecting', 'failed', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(subscriptionStatus) && t('prenotazioni.status.unknown', 'Stato sconosciuto')}
              </span>
            </div>
            <span>{t('prenotazioni.last_update', 'Ultimo aggiornamento')}: {format(lastRefreshTime, 'HH:mm:ss')}</span>
            {retryCount > 0 && (
              <span className="text-orange-600">{t('prenotazioni.retry_attempts', 'Tentativi')}: {retryCount}/{maxRetries}</span>
            )}
            {subscriptionStatus === 'SUBSCRIBED' && (
              <span className={`text-xs ${
                connectionQuality === 'excellent' ? 'text-green-600' :
                connectionQuality === 'good' ? 'text-yellow-600' :
                connectionQuality === 'poor' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {t('prenotazioni.quality', 'Qualità')}: {connectionQuality === 'excellent' ? t('prenotazioni.quality.excellent', 'Eccellente') :
                         connectionQuality === 'good' ? t('prenotazioni.quality.good', 'Buona') :
                         connectionQuality === 'poor' ? t('prenotazioni.quality.poor', 'Scarsa') :
                         t('prenotazioni.quality.unknown', 'Sconosciuta')}
              </span>
            )}
            {subscriptionStatus === 'failed' && (
              <Button 
                onClick={setupRealtimeSubscription}
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {t('prenotazioni.actions.retry', 'Riprova')}
              </Button>
            )}
            {subscriptionStatus === 'SUBSCRIBED' && (
              <Button 
                onClick={() => {
                  console.log('Test manuale della subscription...');
                  setLastRefreshTime(new Date());
                }}
                variant="outline" 
                size="sm"
                className="text-xs"
                title={t('prenotazioni.actions.test_connection', 'Test connessione')}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </Button>
            )}
            <Button 
              onClick={() => setDebugMode(!debugMode)}
              variant="outline" 
              size="sm"
              className="text-xs"
              title={t('prenotazioni.actions.toggle_debug', 'Toggle debug mode')}
            >
              {debugMode ? '🔴' : '🟢'} Debug
            </Button>
            <Button 
              onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
              variant="outline" 
              size="sm"
              className={`text-xs ${emailNotificationsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
              title={emailNotificationsEnabled ? t('prenotazioni.actions.disable_email_notifications', 'Disabilita notifiche email') : t('prenotazioni.actions.enable_email_notifications', 'Abilita notifiche email')}
            >
              {emailNotificationsEnabled ? (
                <Bell className="w-3 h-3 mr-1" />
              ) : (
                <BellOff className="w-3 h-3 mr-1" />
              )}
              Email
            </Button>
            {debugMode && (
              <Button 
                onClick={async () => {
                  setTestingEmail(true);
                  try {
                    const result = await testEmailConnection();
                    if (result.success) {
                      addDebugLog('✅ Test connessione email riuscito');
                    } else {
                      addDebugLog(`❌ Test connessione email fallito: ${result.error}`);
                    }
                  } catch (error) {
                    addDebugLog(`❌ Errore test email: ${error}`);
                  } finally {
                    setTestingEmail(false);
                  }
                }}
                variant="outline" 
                size="sm"
                className="text-xs"
                disabled={testingEmail}
                title={t('prenotazioni.actions.test_email_connection', 'Test connessione email')}
              >
                {testingEmail ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Mail className="w-3 h-3 mr-1" />
                )}
                Test Email
              </Button>
            )}
            {debugMode && (
              <Button 
                onClick={async () => {
                  try {
                    const salonId = await getSalonId();
                    if (!salonId) return;
                    
                    // Simula una nuova prenotazione per testare la subscription
                    const testBooking = {
                      salon_id: salonId,
                      customer_name: 'Test Cliente',
                      customer_email: 'test@example.com',
                      customer_phone: '123456789',
                      requested_date: new Date().toISOString().split('T')[0],
                      requested_time: '10:00',
                      booking_date: new Date().toISOString().split('T')[0],
                      start_time: '10:00',
                      end_time: '11:00',
                      service_id: 1,
                      service_name: 'Test Servizio',
                      service_duration: 60,
                      service_price: 50,
                      team_member_id: null,
                      status: 'pending',
                      notes: 'Prenotazione di test per verificare real-time',
                      ip_address: '127.0.0.1',
                      user_agent: 'Test Browser',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    
                    const { error } = await supabase
                      .from('online_bookings')
                      .insert(testBooking);
                    
                    if (error) {
                      console.error('Errore nel test:', error);
                      addDebugLog(`Errore test: ${error.message}`);
                    } else {
                      addDebugLog('Test prenotazione inserita con successo');
                    }
                  } catch (error) {
                    console.error('Errore nel test:', error);
                    addDebugLog(`Errore test: ${error}`);
                  }
                }}
                variant="outline" 
                size="sm"
                className="text-xs"
                title={t('prenotazioni.actions.test_subscription', 'Test subscription')}
              >
                🧪 Test
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newBookingsCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {newBookingsCount} nuova{newBookingsCount > 1 ? 'e' : ''}
            </Badge>
          )}
          <Button 
            onClick={() => {
              addDebugLog('Refresh manuale richiesto');
              fetchBookings();
              resetNewBookingsCount();
            }}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Aggiornamento...' : 'Aggiorna'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cerca per nome, email, telefono o servizio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('prenotazioni.filters.all_statuses', 'Tutti gli status')}</SelectItem>
                <SelectItem value="pending">{t('prenotazioni.status.pending', 'In attesa')}</SelectItem>
                <SelectItem value="confirmed">{t('prenotazioni.status.confirmed', 'Confermato')}</SelectItem>
                <SelectItem value="cancelled">{t('prenotazioni.status.cancelled', 'Annullato')}</SelectItem>
                <SelectItem value="completed">{t('prenotazioni.status.completed', 'Completato')}</SelectItem>
                <SelectItem value="converted">{t('prenotazioni.status.converted', 'Convertito')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('prenotazioni.filters.all_dates', 'Tutte le date')}</SelectItem>
                <SelectItem value="today">{t('prenotazioni.filters.today', 'Oggi')}</SelectItem>
                <SelectItem value="week">{t('prenotazioni.filters.last_week', 'Ultima settimana')}</SelectItem>
                <SelectItem value="month">{t('prenotazioni.filters.last_month', 'Ultimo mese')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowArchived(!showArchived);
                  fetchBookings();
                }}
                className="flex items-center gap-2"
              >
                {showArchived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4" />
                    {t('prenotazioni.filters.archived', 'Archiviate')}
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    {t('prenotazioni.filters.active', 'Attive')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      {debugMode && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 text-sm">{t('prenotazioni.debug.title', 'Debug Real-time')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xs">
                <strong>{t('prenotazioni.debug.status', 'Status')}:</strong> {subscriptionStatus}
              </div>
              <div className="text-xs">
                <strong>{t('prenotazioni.debug.attempts', 'Tentativi')}:</strong> {retryCount}/{maxRetries}
              </div>
              <div className="text-xs">
                <strong>{t('prenotazioni.debug.last_heartbeat', 'Ultimo heartbeat')}:</strong> {format(lastHeartbeat, 'HH:mm:ss')}
              </div>
              <div className="text-xs">
                <strong>{t('prenotazioni.debug.connection_quality', 'Qualità connessione')}:</strong> 
                <span className={`ml-1 ${
                  connectionQuality === 'excellent' ? 'text-green-600' :
                  connectionQuality === 'good' ? 'text-yellow-600' :
                  connectionQuality === 'poor' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {connectionQuality === 'excellent' ? t('prenotazioni.quality.excellent', 'Eccellente') :
                   connectionQuality === 'good' ? t('prenotazioni.quality.good', 'Buona') :
                   connectionQuality === 'poor' ? t('prenotazioni.quality.poor', 'Scarsa') :
                   t('prenotazioni.quality.unknown', 'Sconosciuta')}
                </span>
              </div>
              <div className="text-xs">
                <strong>{t('prenotazioni.debug.email_notifications', 'Notifiche email')}:</strong> 
                <span className={`ml-1 ${
                  emailNotificationsEnabled ? 'text-green-600' : 'text-red-600'
                }`}>
                  {emailNotificationsEnabled ? t('prenotazioni.debug.enabled', 'Abilitate') : t('prenotazioni.debug.disabled', 'Disabilitate')}
                </span>
              </div>
              <div className="text-xs">
                <strong>{t('prenotazioni.debug.logs', 'Log')}:</strong>
                <div className="bg-white p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {debugLogs.length === 0 ? (
                    <span className="text-gray-500">{t('prenotazioni.debug.no_logs', 'Nessun log disponibile')}</span>
                  ) : (
                    debugLogs.map((log, index) => (
                      <div key={index} className="text-gray-700">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {showArchived ? t('prenotazioni.stats.archived', 'Archiviate') : t('prenotazioni.stats.total', 'Totali')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              {showArchived ? (
                <ArchiveRestore className="w-8 h-8 text-orange-500" />
              ) : (
                <Calendar className="w-8 h-8 text-blue-500" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('prenotazioni.stats.pending', 'In attesa')}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status.toLowerCase() === 'pending').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('prenotazioni.stats.confirmed', 'Confermati')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status.toLowerCase() === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('prenotazioni.stats.converted', 'Convertiti')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {bookings.filter(b => b.status.toLowerCase() === 'converted').length}
                </p>
              </div>
              <CalendarPlus className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {showArchived ? (
              <>
                <ArchiveRestore className="w-5 h-5 text-orange-600" />
                {t('prenotazioni.list.archived', 'Prenotazioni Archiviate')} ({filteredBookings.length})
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 text-blue-600" />
                {t('prenotazioni.list.active', 'Prenotazioni Attive')} ({filteredBookings.length})
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('prenotazioni.empty.no_bookings', 'Nessuna prenotazione trovata')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className={`hover:shadow-md transition-shadow ${
                    new Date(booking.created_at) > new Date(Date.now() - 30000) 
                      ? 'ring-2 ring-green-500 bg-green-50' 
                      : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold">{booking.customer_name}</span>
                          <Badge className={getStatusColor(booking.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(booking.status)}
                              {getStatusLabel(booking.status)}
                            </span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(parseISO(booking.requested_date), 'dd/MM/yyyy', { locale: it })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{booking.requested_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            <span>{booking.service_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="w-4 h-4" />
                            <span>€{booking.service_price}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {booking.customer_email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{booking.customer_email}</span>
                            </div>
                          )}
                          {booking.customer_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{booking.customer_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasPermission('canViewOnlineBookingDetails') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(booking)}
                            className="flex items-center gap-1"
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
                            className="flex items-center gap-1"
                            title="Modifica orari"
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
                              className="bg-green-600 hover:bg-green-700"
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
                            >
                              {updatingStatus === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {hasPermission('canManageOnlineBookings') && 
                         booking.status.toLowerCase() !== 'pending' && (
                          <Button
                            variant={showArchived ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => toggleArchiveBooking(booking.id)}
                            disabled={archivingBooking === booking.id}
                            className={`flex items-center gap-1 ${
                              showArchived 
                                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            }`}
                            title={showArchived ? "Ripristina prenotazione" : "Archivia prenotazione"}
                          >
                            {archivingBooking === booking.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : showArchived ? (
                              <ArchiveRestore className="w-4 h-4" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettagli Prenotazione</DialogTitle>
            <DialogDescription>
              Informazioni complete sulla prenotazione online
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Informazioni Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-gray-900">{selectedBooking.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedBooking.customer_email || 'Non fornita'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Telefono</label>
                    <p className="text-gray-900">{selectedBooking.customer_phone || 'Non fornito'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {getStatusLabel(selectedBooking.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Servizio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Servizio</label>
                    <p className="text-gray-900">{selectedBooking.service_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Durata</label>
                    <p className="text-gray-900">{selectedBooking.service_duration} min</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Prezzo</label>
                    <p className="text-gray-900">€{selectedBooking.service_price}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Dettagli Appuntamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Data richiesta</label>
                    <p className="text-gray-900">
                      {format(parseISO(selectedBooking.requested_date), 'dd/MM/yyyy', { locale: it })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Orario richiesto</label>
                    <p className="text-gray-900">{selectedBooking.requested_time}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Data prenotazione</label>
                    <p className="text-gray-900">
                      {format(parseISO(selectedBooking.booking_date), 'dd/MM/yyyy', { locale: it })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Orario inizio</label>
                    <p className="text-gray-900">{selectedBooking.start_time}</p>
                  </div>
                  {selectedBooking.end_time && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Orario fine</label>
                      <p className="text-gray-900">{selectedBooking.end_time}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Membro del team</label>
                    <p className="text-gray-900">{getTeamMemberName(selectedBooking.team_member_id)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Informazioni Aggiuntive</h3>
                <div className="space-y-4">
                  {selectedBooking.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Note</label>
                      <p className="text-gray-900">{selectedBooking.notes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data creazione</label>
                      <p className="text-gray-900">
                        {format(parseISO(selectedBooking.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ultimo aggiornamento</label>
                      <p className="text-gray-900">
                        {format(parseISO(selectedBooking.updated_at), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Azioni</h3>
                <div className="flex flex-wrap gap-2">
                  {hasPermission('canManageOnlineBookings') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        openEditModal(selectedBooking);
                        setIsDetailModalOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modifica Orari
                    </Button>
                  )}
                  
                  {selectedBooking.status.toLowerCase() === 'pending' && (
                    <>
                      <Button
                        onClick={() => {
                          updateBookingStatus(selectedBooking.id, 'confirmed');
                          setIsDetailModalOpen(false);
                        }}
                        disabled={updatingStatus === selectedBooking.id}
                        className="bg-green-600 hover:bg-green-700"
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
                      >
                        {updatingStatus === selectedBooking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Annulla
                      </Button>
                    </>
                  )}
                  {selectedBooking.status.toLowerCase() === 'confirmed' && (
                    <Button
                      onClick={() => {
                        updateBookingStatus(selectedBooking.id, 'completed');
                        setIsDetailModalOpen(false);
                      }}
                      disabled={updatingStatus === selectedBooking.id}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updatingStatus === selectedBooking.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Segna come completato
                    </Button>
                  )}
                  
                  {hasPermission('canManageOnlineBookings') && 
                   selectedBooking.status.toLowerCase() !== 'pending' && (
                    <Button
                      variant={showArchived ? "outline" : "secondary"}
                      onClick={() => {
                        toggleArchiveBooking(selectedBooking.id);
                        setIsDetailModalOpen(false);
                      }}
                      disabled={archivingBooking === selectedBooking.id}
                      className={`flex items-center gap-2 ${
                        showArchived 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      }`}
                    >
                      {archivingBooking === selectedBooking.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : showArchived ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                      {showArchived ? "Ripristina" : "Archivia"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Orari Prenotazione</DialogTitle>
            <DialogDescription>
              Modifica la data e l'orario della prenotazione online
            </DialogDescription>
          </DialogHeader>
          
          {editingBooking && (
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Prenotazione da Modificare</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Cliente:</span>
                    <p>{editingBooking.customer_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Servizio:</span>
                    <p>{editingBooking.service_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Data Attuale:</span>
                    <p>{format(parseISO(editingBooking.requested_date), 'dd/MM/yyyy', { locale: it })}</p>
                  </div>
                  <div>
                    <span className="font-medium">Orario Attuale:</span>
                    <p>{editingBooking.requested_time}</p>
                  </div>
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
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Attenzione:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• La modifica degli orari potrebbe creare conflitti con altre prenotazioni</li>
                  <li>• Verifica la disponibilità del team member per il nuovo orario</li>
                  <li>• Il cliente non verrà notificato automaticamente della modifica</li>
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
                  Salva Modifiche
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Appointment Modal */}
      <Dialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <DialogContent className="w-[92vw] max-w-2xl sm:w-full sm:max-w-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Approva e Converti in Appuntamento</DialogTitle>
            <DialogDescription>
              Approva questa prenotazione online e convertila in un appuntamento del calendario
            </DialogDescription>
          </DialogHeader>
          
          {convertingBooking && (
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Riepilogo Prenotazione</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Cliente:</span>
                    <p>{convertingBooking.customer_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Data:</span>
                    <p>{format(parseISO(convertingBooking.requested_date), 'dd/MM/yyyy', { locale: it })}</p>
                  </div>
                  <div>
                    <span className="font-medium">Orario:</span>
                    <p>{convertingBooking.requested_time}</p>
                  </div>
                  <div>
                    <span className="font-medium">Servizio:</span>
                    <p>{convertingBooking.service_name}</p>
                  </div>
                </div>
              </div>

              {/* Team Member Selection */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Seleziona Membro del Team *
                </label>
                <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Scegli un membro del team" />
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
                  Seleziona Servizio *
                </label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Scegli un servizio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - €{service.price} ({service.duration}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conversion Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Cosa succederà:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• La prenotazione verrà approvata</li>
                  <li>• Verrà creato un nuovo appuntamento nel calendario</li>
                  <li>• Se il cliente non esiste, verrà creato automaticamente</li>
                  <li>• L'orario di fine verrà calcolato automaticamente in base alla durata del servizio</li>
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
    </div>
  );
} 