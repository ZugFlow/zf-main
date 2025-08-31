import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchServicesForOrders } from '@/app/(dashboard)/(private)/crm/dashboard/query/query';
import { useSupabaseConnectionManager } from './useSupabaseConnectionManager';

interface UseAppointmentsWithHeartbeatProps {
  setAppointments: React.Dispatch<React.SetStateAction<any[]>>;
  salonId?: string;
  onConnectionStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
  onAppointmentsLoaded?: (appointments: any[]) => void;
}

export function useAppointmentsWithHeartbeat({
  setAppointments,
  salonId,
  onConnectionStatusChange,
  onAppointmentsLoaded
}: UseAppointmentsWithHeartbeatProps) {
  const supabase = createClient();
  const subscriptionRef = useRef<any>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const minFetchInterval = 10000; // Increased to 10 seconds between fetches

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);

  // Batch update management
  const pendingUpdatesRef = useRef<Record<string, { type: string; data: any }>>({});
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Connection manager for heartbeat and reconnection
  const {
    connectionStatus: heartbeatStatus,
    isConnected: heartbeatConnected,
    heartbeatActive,
    heartbeatCount,
    reconnect: reconnectHeartbeat
  } = useSupabaseConnectionManager({
    heartbeatInterval: 60000, // 60 seconds (1 minute)
    heartbeatTimeout: 5000,
    reconnectOnHeartbeatFailure: true,
    reconnectOnVisibilityChange: true,
    onConnectionStatusChange: (status) => {
      setConnectionStatus(status);
      onConnectionStatusChange?.(status);
    },
    onHeartbeatSuccess: () => {
      console.log('💓 [Appointments] Heartbeat successful');
    },
    onReconnectionSuccess: () => {
      console.log('✅ [Appointments] Reconnection successful');
      // Only refresh if we haven't loaded appointments yet and not currently fetching
      if (!appointmentsLoaded && !isFetchingRef.current) {
        setTimeout(() => {
          fetchAppointments();
        }, 2000);
      }
    }
  });

  // Process batch updates
  const processBatchUpdates = useCallback(() => {
    const updates = Object.values(pendingUpdatesRef.current);
    
    if (updates.length === 0) return;

    setAppointments((prevAppointments) => {
      let newAppointments = [...prevAppointments];
      
      // Process inserts
      const inserts = updates.filter(u => u.type === 'INSERT').map(u => u.data);
      if (inserts.length > 0) {
        const insertIds = new Set(inserts.map(app => app.id));
        newAppointments = newAppointments.filter(app => !insertIds.has(app.id));
        newAppointments = [...newAppointments, ...inserts];
      }
      
      // Process updates
      const updateMap: Record<string, any> = {};
      updates.filter(u => u.type === 'UPDATE').forEach(u => {
        updateMap[u.data.id] = u.data;
      });
      
      if (Object.keys(updateMap).length > 0) {
        newAppointments = newAppointments.map(app => 
          updateMap[app.id] ? { ...app, ...updateMap[app.id] } : app
        );
      }
      
      // Process deletes
      const deleteIds = new Set(updates.filter(u => u.type === 'DELETE').map(u => u.data));
      if (deleteIds.size > 0) {
        newAppointments = newAppointments.filter(app => !deleteIds.has(app.id));
      }
      
      return newAppointments;
    });
    
    pendingUpdatesRef.current = {};
  }, [setAppointments]);

  // Queue an update
  const queueUpdate = useCallback((id: string, type: string, data: any) => {
    pendingUpdatesRef.current[id] = { type, data };
    
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(processBatchUpdates, 100);
  }, [processBatchUpdates]);

  // Enhanced service fetching with retry
  const fetchServicesWithRetry = useCallback(async (orderId: string) => {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const serviceMap = await fetchServicesForOrders([orderId]);
        return serviceMap[orderId] || [];
      } catch (error) {
        console.error(`Error fetching services for order ${orderId}, attempt ${attempt}:`, error);
        if (attempt === maxRetries) {
          console.error(`Failed to fetch services for order ${orderId} after ${maxRetries} attempts`);
          return [];
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
    return [];
  }, []);

  // Fetch appointments function
  const fetchAppointments = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log('🔄 [Appointments] Already fetching, skipping...');
      return;
    }

    const now = Date.now();
    if (now - lastFetchTimeRef.current < minFetchInterval) {
      console.log('🔄 [Appointments] Too soon to fetch again, skipping...', {
        timeSinceLastFetch: now - lastFetchTimeRef.current,
        minInterval: minFetchInterval,
        lastFetch: new Date(lastFetchTimeRef.current).toLocaleTimeString()
      });
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      console.log('🔄 [Appointments] Fetching appointments...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [Appointments] No user found - user might not be authenticated');
        setLastError('User not authenticated');
        return;
      }

      console.log('👤 [Appointments] User authenticated:', user.id);

      // Fetch appointments with services
      const { data: appointments, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_services (
            *,
            services (*)
          )
        `)
        .eq('salon_id', salonId || '')
        .neq('status', 'Eliminato')
        .order('data', { ascending: true });

      if (error) {
        throw error;
      }

      // Process appointments to include services
      const processedAppointments = appointments?.map(appointment => ({
        ...appointment,
        services: appointment.order_services?.map((os: any) => os.services) || []
      })) || [];

      setAppointments(processedAppointments);
      setAppointmentsLoaded(true);
      onAppointmentsLoaded?.(processedAppointments);
      
      console.log(`✅ [Appointments] Loaded ${processedAppointments.length} appointments`);
    } catch (error) {
      console.error('❌ [Appointments] Error fetching appointments:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      isFetchingRef.current = false;
    }
  }, [supabase, salonId, setAppointments, onAppointmentsLoaded]);

  // Handle appointment changes
  const handleAppointmentChange = useCallback(async (payload: any) => {
    if (isFetchingRef.current) return;

    // Filter by salon_id if provided
    if (salonId) {
      const appointmentSalonId = payload.new?.salon_id || payload.old?.salon_id;
      if (appointmentSalonId !== salonId) {
        return;
      }
    }

    try {
      if (payload.eventType === "INSERT") {
        console.log('🔄 [Appointments] Real-time INSERT event received for appointment:', payload.new.id);
        const services = await fetchServicesWithRetry(payload.new.id);
        const newAppointment = {
          ...payload.new,
          services: services,
        };
        queueUpdate(payload.new.id, 'INSERT', newAppointment);
      } else if (payload.eventType === "DELETE") {
        console.log('🔄 [Appointments] Real-time DELETE event received for appointment:', payload.old.id);
        queueUpdate(payload.old.id, 'DELETE', payload.old.id);
      } else if (payload.eventType === "UPDATE") {
        console.log('🔄 [Appointments] Real-time UPDATE event received for appointment:', payload.new.id);
        
        // Cache system removed - no longer needed
        
        const services = await fetchServicesWithRetry(payload.new.id);
        const updatedAppointment = {
          ...payload.new,
          services: services,
        };
        queueUpdate(payload.new.id, 'UPDATE', updatedAppointment);
      }
    } catch (error) {
      console.error('Error processing real-time appointment event:', error);
    }
  }, [salonId, fetchServicesWithRetry, queueUpdate]);

  // Handle order services changes
  const handleOrderServicesChange = useCallback(async (payload: any) => {
    if (isFetchingRef.current) return;

    try {
      const orderId = payload.new?.order_id || payload.old?.order_id;
      if (!orderId) return;

      console.log('🔄 [Appointments] Real-time order_services event received for order:', orderId);
      const services = await fetchServicesWithRetry(orderId);
      queueUpdate(orderId, 'UPDATE', {
        id: orderId,
        services: services,
      });
    } catch (error) {
      console.error('Error processing real-time order_services event:', error);
    }
  }, [fetchServicesWithRetry, queueUpdate]);

  // Create and subscribe to channel
  const subscribe = useCallback(() => {
    try {
      const channelId = `realtime:appointments_with_heartbeat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔄 [Appointments] Setting up subscription...', { channelId, salonId });

      // Remove existing subscription if any
      if (subscriptionRef.current) {
        console.log('🔄 [Appointments] Removing existing subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Create new subscription with unique channel name
      const subscription = supabase
        .channel(channelId)
        .on(
          "postgres_changes" as any,
          { event: "*", schema: "public", table: "orders" },
          handleAppointmentChange
        )
        .on(
          "postgres_changes" as any,
          { event: "*", schema: "public", table: "order_services" },
          handleOrderServicesChange
        )
        .subscribe();

      subscriptionRef.current = subscription;
      
      // Set connection status after subscription is created
      setConnectionStatus('connected');
      setLastError(null);
      onConnectionStatusChange?.('connected');
      console.log('✅ [Appointments] Subscription created successfully', { channelId });
    } catch (error) {
      console.error('❌ [Appointments] Error creating subscription:', error);
      setConnectionStatus('error');
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      onConnectionStatusChange?.('error');
    }
  }, [supabase, handleAppointmentChange, handleOrderServicesChange, onConnectionStatusChange, salonId]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    console.log('🔄 [Appointments] Manual reconnection requested');
    subscribe();
    fetchAppointments();
  }, [subscribe, fetchAppointments]);

  // Setup subscription and initial fetch - SINGLE useEffect
  useEffect(() => {
    // Initial fetch
    fetchAppointments();
    
    // Setup subscription after a delay
    const timer = setTimeout(() => {
      subscribe();
    }, 3000); // Increased delay to avoid race conditions

    return () => {
      clearTimeout(timer);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []); // No dependencies to prevent re-initialization

  return {
    connectionStatus,
    lastError,
    reconnect,
    fetchAppointments,
    appointmentsLoaded,
    heartbeatStatus,
    heartbeatActive,
    heartbeatCount,
    setFetching: (fetching: boolean) => {
      isFetchingRef.current = fetching;
    }
  };
} 