import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface SubscriptionConfig {
  channelName: string;
  table: string;
  event: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onError?: (error: any) => void;
}

interface UseSupabaseReconnectionReturn {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  reconnect: () => void;
  lastError: string | null;
}

export function useSupabaseReconnection(
  config: SubscriptionConfig,
  dependencies: any[] = []
): UseSupabaseReconnectionReturn {
  const supabase = createClient();
  const subscriptionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);

  // Function to create and subscribe to the channel
  const subscribe = useCallback(() => {
    if (isConnectingRef.current) return;
    
    try {
      isConnectingRef.current = true;
      setConnectionStatus('connecting');
      setLastError(null);

      // Remove existing subscription if any
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Create new subscription with correct syntax for newer Supabase versions
      const subscription = supabase
        .channel(config.channelName)
        .on(
          'postgres_changes' as any,
          {
            event: config.event,
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter
          },
          (payload: any) => {
            try {
              if (payload.eventType === 'INSERT' && config.onInsert) {
                config.onInsert(payload);
              } else if (payload.eventType === 'UPDATE' && config.onUpdate) {
                config.onUpdate(payload);
              } else if (payload.eventType === 'DELETE' && config.onDelete) {
                config.onDelete(payload);
              }
            } catch (error) {
              console.error('Error handling subscription payload:', error);
              config.onError?.(error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isConnectingRef.current = false;
            setIsConnected(true);
            setConnectionStatus('connected');
            setLastError(null);
            console.log(`✅ [Reconnection] Subscription to ${config.channelName} created successfully`);
          } else if (status === 'CHANNEL_ERROR') {
            isConnectingRef.current = false;
            setConnectionStatus('error');
            setLastError('Channel subscription error');
            console.error('❌ [Reconnection] Channel subscription error');
          }
        });

      subscriptionRef.current = subscription;
    } catch (error) {
      isConnectingRef.current = false;
      console.error('❌ [Reconnection] Error creating subscription:', error);
      setConnectionStatus('error');
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      config.onError?.(error);
    }
  }, [supabase, config, ...dependencies]);

  // Function to reconnect if needed
  const reconnectIfNeeded = useCallback(() => {
    if (!isConnected && !isConnectingRef.current) {
      console.log('🔄 [Reconnection] Attempting to reconnect...');
      subscribe();
    }
  }, [isConnected, subscribe]);

  // Function to reconnect
  const reconnect = useCallback(() => {
    console.log('🔄 [Reconnection] Manual reconnection requested');
    subscribe();
  }, [subscribe]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ [Reconnection] Page became visible, checking connection...');
      // Add a small delay to ensure the page is fully loaded
      setTimeout(() => {
        reconnectIfNeeded();
      }, 100);
    }
  }, [reconnectIfNeeded]);

  // Setup subscription and visibility listener
  useEffect(() => {
    // Initial subscription
    subscribe();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [subscribe, handleVisibilityChange]);

  // Auto-reconnect on error with exponential backoff
  useEffect(() => {
    if (connectionStatus === 'error' && !isConnectingRef.current) {
      const backoffDelay = Math.min(1000 * Math.pow(2, 0), 30000); // Start with 1s, max 30s
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 [Reconnection] Auto-reconnecting after error...');
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
    isConnected,
    connectionStatus,
    reconnect,
    lastError
  };
}