import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchServicesForOrders } from '@/app/(dashboard)/(private)/crm/dashboard/query/query';

interface UseAppointmentsWithReconnectionProps {
  setAppointments: React.Dispatch<React.SetStateAction<any[]>>;
  salonId?: string;
  onConnectionStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
}

export function useAppointmentsWithReconnection({
  setAppointments,
  salonId,
  onConnectionStatusChange
}: UseAppointmentsWithReconnectionProps) {
  const supabase = createClient();
  const subscriptionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const isFetchingRef = useRef(false);
  
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);

  // Batch update management
  const pendingUpdatesRef = useRef<Record<string, { type: string; data: any }>>({});
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        console.log('🔄 [Reconnection] Real-time INSERT event received for appointment:', payload.new.id);
        const services = await fetchServicesWithRetry(payload.new.id);
        const newAppointment = {
          ...payload.new,
          services: services,
        };
        queueUpdate(payload.new.id, 'INSERT', newAppointment);
      } else if (payload.eventType === "DELETE") {
        console.log('🔄 [Reconnection] Real-time DELETE event received for appointment:', payload.old.id);
        queueUpdate(payload.old.id, 'DELETE', payload.old.id);
      } else if (payload.eventType === "UPDATE") {
        console.log('🔄 [Reconnection] Real-time UPDATE event received for appointment:', payload.new.id);
        
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

      console.log('🔄 [Reconnection] Real-time order_services event received for order:', orderId);
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
    if (isConnectingRef.current) return;
    
    try {
      isConnectingRef.current = true;
      setConnectionStatus('connecting');
      setLastError(null);
      onConnectionStatusChange?.('connecting');

      // Remove existing subscription if any
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Create new subscription
      const subscription = supabase
        .channel("realtime:appointments_with_reconnection")
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
      isConnectingRef.current = false;
      setConnectionStatus('connected');
      setLastError(null);
      onConnectionStatusChange?.('connected');
      console.log('✅ [Reconnection] Appointments subscription created successfully');
    } catch (error) {
      isConnectingRef.current = false;
      console.error('❌ [Reconnection] Error creating appointments subscription:', error);
      setConnectionStatus('error');
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      onConnectionStatusChange?.('error');
    }
  }, [supabase, handleAppointmentChange, handleOrderServicesChange, onConnectionStatusChange]);

  // Reconnect if needed
  const reconnectIfNeeded = useCallback(() => {
    if (connectionStatus !== 'connected' && !isConnectingRef.current) {
      console.log('🔄 [Reconnection] Attempting to reconnect appointments subscription...');
      subscribe();
    }
  }, [connectionStatus, subscribe]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    console.log('🔄 [Reconnection] Manual reconnection requested for appointments');
    subscribe();
  }, [subscribe]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ [Reconnection] Page became visible, checking appointments connection...');
      setTimeout(() => {
        reconnectIfNeeded();
      }, 100);
    }
  }, [reconnectIfNeeded]);

  // Setup subscription and visibility listener
  useEffect(() => {
    subscribe();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [subscribe, handleVisibilityChange]);

  // Auto-reconnect on error with exponential backoff
  useEffect(() => {
    if (connectionStatus === 'error' && !isConnectingRef.current) {
      const backoffDelay = Math.min(1000 * Math.pow(2, 0), 30000);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 [Reconnection] Auto-reconnecting appointments subscription after error...');
        subscribe();
      }, backoffDelay);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectionStatus, subscribe]);

  return {
    connectionStatus,
    lastError,
    reconnect,
    setFetching: (fetching: boolean) => {
      isFetchingRef.current = fetching;
    }
  };
} 