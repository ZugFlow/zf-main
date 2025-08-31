import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSupabaseHeartbeat } from './useSupabaseHeartbeat';

interface ConnectionManagerConfig {
  // Heartbeat settings
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  heartbeatEnabled?: boolean;
  
  // Reconnection settings
  reconnectOnHeartbeatFailure?: boolean;
  reconnectOnVisibilityChange?: boolean;
  
  // Callbacks
  onConnectionStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
  onHeartbeatSuccess?: () => void;
  onHeartbeatError?: (error: any) => void;
  onConnectionLost?: () => void;
  onReconnectionAttempt?: () => void;
  onReconnectionSuccess?: () => void;
  onReconnectionError?: (error: any) => void;
}

interface UseSupabaseConnectionManagerReturn {
  // Connection status
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  isConnected: boolean;
  
  // Heartbeat info
  heartbeatActive: boolean;
  lastHeartbeat: Date | null;
  heartbeatCount: number;
  heartbeatError: string | null;
  
  // Reconnection info
  reconnectAttempts: number;
  lastReconnectionAttempt: Date | null;
  reconnectionError: string | null;
  
  // Actions
  reconnect: () => void;
  forceHeartbeat: () => Promise<boolean>;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  
  // Connection health
  connectionHealth: 'excellent' | 'good' | 'poor' | 'critical';
  healthScore: number; // 0-100
}

export function useSupabaseConnectionManager(config: ConnectionManagerConfig = {}): UseSupabaseConnectionManagerReturn {
  const {
    heartbeatInterval = 60000, // 60 seconds (1 minute)
    heartbeatTimeout = 5000,
    heartbeatEnabled = true,
    reconnectOnHeartbeatFailure = true,
    reconnectOnVisibilityChange = true,
    onConnectionStatusChange,
    onHeartbeatSuccess,
    onHeartbeatError,
    onConnectionLost,
    onReconnectionAttempt,
    onReconnectionSuccess,
    onReconnectionError
  } = config;

  const supabase = createClient();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastReconnectionAttempt, setLastReconnectionAttempt] = useState<Date | null>(null);
  const [reconnectionError, setReconnectionError] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState(100);

  const isConnectingRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);
  const maxConsecutiveFailures = 3;

  // Heartbeat hook
  const {
    isActive: heartbeatActive,
    lastHeartbeat,
    heartbeatCount,
    lastError: heartbeatError,
    startHeartbeat,
    stopHeartbeat,
    forceHeartbeat
  } = useSupabaseHeartbeat({
    interval: heartbeatInterval,
    timeout: heartbeatTimeout,
    enabled: heartbeatEnabled,
    onHeartbeatSuccess: () => {
      // Update connection status on successful heartbeat
      if (connectionStatus !== 'connected') {
        setConnectionStatus('connected');
        setIsConnected(true);
        consecutiveFailuresRef.current = 0;
        onConnectionStatusChange?.('connected');
        onReconnectionSuccess?.();
      }
      onHeartbeatSuccess?.();
    },
    onHeartbeatError: (error) => {
      consecutiveFailuresRef.current++;
      onHeartbeatError?.(error);
      
      // Only trigger reconnection after multiple failures to avoid loops
      if (reconnectOnHeartbeatFailure && consecutiveFailuresRef.current >= maxConsecutiveFailures) {
        console.log('🔄 [ConnectionManager] Heartbeat failures exceeded threshold, triggering reconnection');
        // Add delay to prevent immediate reconnection loops
        setTimeout(() => {
          if (connectionStatus !== 'connected') {
            reconnect();
          }
        }, 5000);
      }
    },
    onConnectionLost: () => {
      setConnectionStatus('error');
      setIsConnected(false);
      onConnectionLost?.();
      onConnectionStatusChange?.('error');
    }
  });

  // Test connection function
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (error) {
        throw error;
      }
      
      // Update health score based on latency
      const newHealthScore = Math.max(0, Math.min(100, 100 - (latency / 100)));
      setHealthScore(newHealthScore);
      
      return true;
    } catch (error) {
      console.error('❌ [ConnectionManager] Connection test failed:', error);
      setHealthScore(0);
      return false;
    }
  }, [supabase]);

  // Reconnection function
  const reconnect = useCallback(async () => {
    if (isConnectingRef.current) {
      console.log('🔄 [ConnectionManager] Already attempting reconnection, skipping');
      return;
    }

    try {
      isConnectingRef.current = true;
      setConnectionStatus('connecting');
      setIsConnected(false);
      setReconnectionError(null);
      setLastReconnectionAttempt(new Date());
      setReconnectAttempts(prev => prev + 1);
      
      onReconnectionAttempt?.();
      onConnectionStatusChange?.('connecting');

      console.log('🔄 [ConnectionManager] Attempting reconnection...');

      // Test connection
      const success = await testConnection();
      
      if (success) {
        setConnectionStatus('connected');
        setIsConnected(true);
        consecutiveFailuresRef.current = 0;
        onReconnectionSuccess?.();
        onConnectionStatusChange?.('connected');
        console.log('✅ [ConnectionManager] Reconnection successful');
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown reconnection error';
      setConnectionStatus('error');
      setIsConnected(false);
      setReconnectionError(errorMessage);
      onReconnectionError?.(error);
      onConnectionStatusChange?.('error');
      console.error('❌ [ConnectionManager] Reconnection failed:', errorMessage);
    } finally {
      isConnectingRef.current = false;
    }
  }, [testConnection, onReconnectionAttempt, onReconnectionSuccess, onReconnectionError, onConnectionStatusChange]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ [ConnectionManager] Page became visible, checking connection...');
      if (reconnectOnVisibilityChange) {
        setTimeout(() => {
          if (connectionStatus !== 'connected') {
            reconnect();
          }
        }, 100);
      }
    }
  }, [reconnectOnVisibilityChange, connectionStatus, reconnect]);

  // Setup visibility listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Initial connection test
  useEffect(() => {
    testConnection().then(success => {
      if (success) {
        setConnectionStatus('connected');
        setIsConnected(true);
        onConnectionStatusChange?.('connected');
      } else {
        setConnectionStatus('error');
        setIsConnected(false);
        onConnectionStatusChange?.('error');
      }
    });
  }, [testConnection, onConnectionStatusChange]);

  // Calculate connection health
  const connectionHealth = useCallback((): 'excellent' | 'good' | 'poor' | 'critical' => {
    if (healthScore >= 90) return 'excellent';
    if (healthScore >= 70) return 'good';
    if (healthScore >= 40) return 'poor';
    return 'critical';
  }, [healthScore]);

  return {
    // Connection status
    connectionStatus,
    isConnected,
    
    // Heartbeat info
    heartbeatActive,
    lastHeartbeat,
    heartbeatCount,
    heartbeatError,
    
    // Reconnection info
    reconnectAttempts,
    lastReconnectionAttempt,
    reconnectionError,
    
    // Actions
    reconnect,
    forceHeartbeat,
    startHeartbeat,
    stopHeartbeat,
    
    // Connection health
    connectionHealth: connectionHealth(),
    healthScore
  };
} 